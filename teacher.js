const aspectList = [
  { key: "content", label: "內容" },
  { key: "organization", label: "組織" },
  { key: "grammar", label: "文法句構" },
  { key: "lexical", label: "字彙拼字" },
];

let currentClass = null;

function generateSecretCode() {
  return Math.random().toString(10).slice(2, 6).padEnd(4, "0");
}

function padNumber(num, size) {
  return num.toString().padStart(size, "0");
}

function renderStudentTable() {
  const tbody = document.querySelector("#studentTable tbody");
  tbody.innerHTML = "";
  if (!currentClass) return;
  currentClass.students.forEach((stu) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stu.id}</td>
      <td><input data-id="${stu.id}" class="name-input" type="text" value="${stu.name || ""}" placeholder="姓名"></td>
      <td><input data-id="${stu.id}" class="code-input inline-input" type="text" value="${stu.secretCode}"></td>
      <td>
        <button class="secondary regen" data-id="${stu.id}">重新產生</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderStudentSelect() {
  const select = document.querySelector("#studentSelect");
  select.innerHTML = "";
  if (!currentClass) return;
  currentClass.students.forEach((stu) => {
    const option = document.createElement("option");
    option.value = stu.id;
    option.textContent = `${stu.id}${stu.name ? " - " + stu.name : ""}`;
    select.appendChild(option);
  });
}

function setupAspectBlocks() {
  const container = document.getElementById("aspectContainer");
  container.innerHTML = "";
  aspectList.forEach((aspect) => {
    const achievedItems = getRubricByAspect(aspect.key, "achieved");
    const needsItems = getRubricByAspect(aspect.key, "needsWork");
    const section = document.createElement("div");
    section.className = "section";
    section.innerHTML = `
      <h3>${aspect.label}</h3>
      <div class="grid-2">
        <div>
          <label>等級（1-5）</label>
          <input type="number" min="0" max="5" value="3" data-level="${aspect.key}">
        </div>
      </div>
      <div class="rubric-columns">
        <div>
          <label>已達成</label>
          ${achievedItems
            .map(
              (item) => `
                <label style="font-weight:400; display:flex; gap:0.35rem; align-items:flex-start;">
                  <input type="checkbox" data-achieved="${aspect.key}" value="${item.id}" style="margin-top:4px;">
                  <span>${item.text}</span>
                </label>`
            )
            .join("")}
          <label class="small-note">自訂（每行一則）</label>
          <textarea data-custom-achieved="${aspect.key}" placeholder="自訂優點"></textarea>
        </div>
        <div>
          <label>待加強</label>
          ${needsItems
            .map(
              (item) => `
                <label style="font-weight:400; display:flex; gap:0.35rem; align-items:flex-start;">
                  <input type="checkbox" data-needs="${aspect.key}" value="${item.id}" style="margin-top:4px;">
                  <span>${item.text}</span>
                </label>`
            )
            .join("")}
          <label class="small-note">自訂（每行一則）</label>
          <textarea data-custom-needs="${aspect.key}" placeholder="自訂待加強"></textarea>
        </div>
      </div>
    `;
    container.appendChild(section);
  });
}

function setStatus(msg) {
  const box = document.getElementById("status");
  box.textContent = msg;
  box.style.display = "block";
}

async function computeHash(classId, studentId, secretCode) {
  const data = `${classId}|${studentId}|${secretCode}`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function exportJson() {
  if (!currentClass) return;
  const blob = new Blob([JSON.stringify(currentClass, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentClass.classId || "class"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.students || !Array.isArray(data.students)) throw new Error("格式不正確");
      currentClass = data;
      renderStudentTable();
      renderStudentSelect();
      setStatus("已匯入班級資料。");
    } catch (err) {
      alert("匯入失敗：" + err.message);
    }
  };
  reader.readAsText(file);
}

function gatherLines(text) {
  return text
    .split(/\n+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

async function generateUrl() {
  if (!currentClass) {
    setStatus("請先建立或匯入班級資料。");
    return;
  }
  const studentId = document.getElementById("studentSelect").value;
  const essayId = document.getElementById("essayId").value.trim();
  if (!studentId || !essayId) {
    setStatus("請選擇學生並輸入作文標題或編號。");
    return;
  }
  const student = currentClass.students.find((s) => s.id === studentId);
  const aspects = {};
  for (const aspect of aspectList) {
    const levelInput = document.querySelector(`input[data-level="${aspect.key}"]`);
    const achieved = Array.from(document.querySelectorAll(`input[data-achieved="${aspect.key}"]:checked`)).map((el) => el.value);
    const needsWork = Array.from(document.querySelectorAll(`input[data-needs="${aspect.key}"]:checked`)).map((el) => el.value);
    const customAchieved = gatherLines(document.querySelector(`textarea[data-custom-achieved="${aspect.key}"]`).value);
    const customNeedsWork = gatherLines(document.querySelector(`textarea[data-custom-needs="${aspect.key}"]`).value);
    aspects[aspect.key] = {
      level: Number(levelInput.value) || 0,
      achieved,
      needsWork,
      customAchieved: customAchieved.length ? customAchieved : undefined,
      customNeedsWork: customNeedsWork.length ? customNeedsWork : undefined,
    };
  }
  const payload = {
    classId: currentClass.classId,
    studentId,
    essayId,
    aspects,
    overallComment: document.getElementById("overallComment").value.trim() || undefined,
  };

  const jsonString = JSON.stringify(payload);
  const encoded = btoa(encodeURIComponent(jsonString));
  const hash = await computeHash(currentClass.classId, studentId, student.secretCode);
  const url = `${location.origin}${location.pathname.replace(/[^/]+$/, "feedback.html")}?p=${encoded}&h=${hash}`;
  const urlInput = document.getElementById("generatedUrl");
  urlInput.value = url;
  document.getElementById("urlBox").style.display = "block";
  setStatus("已產生連結，請複製後分享給學生。");
}

function copyUrl() {
  const input = document.getElementById("generatedUrl");
  input.select();
  document.execCommand("copy");
  setStatus("已複製到剪貼簿。");
}

function bindEvents() {
  document.getElementById("createClassBtn").addEventListener("click", () => {
    const classId = document.getElementById("classId").value.trim();
    if (!classId) return alert("請輸入班級代碼。");
    const className = document.getElementById("className").value.trim();
    const size = Number(document.getElementById("classSize").value) || 0;
    if (size <= 0) return alert("請輸入正確的人數。");
    const digits = Math.max(2, size.toString().length);
    const students = Array.from({ length: size }, (_, idx) => ({
      id: padNumber(idx + 1, digits),
      name: "",
      secretCode: generateSecretCode(),
    }));
    currentClass = { classId, className, students };
    renderStudentTable();
    renderStudentSelect();
    setStatus("班級已建立，密碼已自動產生。");
  });

  document.getElementById("studentTable").addEventListener("input", (e) => {
    if (!currentClass) return;
    const target = e.target;
    const id = target.getAttribute("data-id");
    const student = currentClass.students.find((s) => s.id === id);
    if (!student) return;
    if (target.classList.contains("name-input")) {
      student.name = target.value;
      renderStudentSelect();
    }
    if (target.classList.contains("code-input")) {
      student.secretCode = target.value;
    }
  });

  document.getElementById("studentTable").addEventListener("click", (e) => {
    const btn = e.target.closest("button.regen");
    if (!btn || !currentClass) return;
    const id = btn.getAttribute("data-id");
    const student = currentClass.students.find((s) => s.id === id);
    if (student) {
      student.secretCode = generateSecretCode();
      renderStudentTable();
      renderStudentSelect();
      setStatus("已重新產生密碼，請重新產生連結。");
    }
  });

  document.getElementById("exportBtn").addEventListener("click", exportJson);

  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
  });
  document.getElementById("importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) importJson(file);
  });

  document.getElementById("generateUrlBtn").addEventListener("click", () => {
    generateUrl();
  });
  document.getElementById("copyUrlBtn").addEventListener("click", copyUrl);
}

setupAspectBlocks();
bindEvents();
