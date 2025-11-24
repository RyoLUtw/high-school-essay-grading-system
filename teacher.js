const aspectList = [
  { key: "content", label: "內容" },
  { key: "organization", label: "組織" },
  { key: "grammar", label: "文法句構" },
  { key: "lexical", label: "字彙拼字" },
];

const LEVEL_CHOICES = [
  { value: 4, label: "優", desc: "5–4 分：表現優異、細節完整" },
  { value: 3, label: "可", desc: "3 分：方向大致到位，仍有提升空間" },
  { value: 2, label: "差", desc: "2–1 分：多處不足，需要補強" },
  { value: 1, label: "劣", desc: "0 分：嚴重不足，需重新改寫" },
];

let currentClass = null;

function generateSecretCode() {
  return Math.random().toString(10).slice(2, 6).padEnd(4, "0");
}

function padNumber(num, size) {
  return num.toString().padStart(size, "0");
}

function setStatus(msg) {
  const box = document.getElementById("status");
  box.textContent = msg;
  box.style.display = msg ? "block" : "none";
}

function ensureStructure() {
  if (!currentClass.tasks) currentClass.tasks = [];
  if (!currentClass.feedbacks) currentClass.feedbacks = {};
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

function isStudentFinished(taskId, studentId) {
  if (!currentClass || !currentClass.feedbacks?.[taskId]?.[studentId]) return false;
  const data = currentClass.feedbacks[taskId][studentId];
  return aspectList.every((a) => data[a.key]?.level);
}

function renderStudentSelect() {
  const select = document.querySelector("#studentSelect");
  select.innerHTML = "";
  if (!currentClass) return;
  const taskId = document.getElementById("taskSelect").value;
  currentClass.students.forEach((stu) => {
    const option = document.createElement("option");
    option.value = stu.id;
    const done = taskId ? isStudentFinished(taskId, stu.id) : false;
    const marker = done ? " ✓" : " ...";
    option.textContent = `${stu.id}${stu.name ? " - " + stu.name : ""}${marker}`;
    select.appendChild(option);
  });
}

function getLevelFromId(id) {
  const parts = id.split("-");
  return parts[2] || "";
}

function getRubricByAspectLevel(aspect, group, levelLabel) {
  return Object.values(RUBRIC_ITEMS).filter(
    (item) => item.aspect === aspect && item.group === group && getLevelFromId(item.id) === levelLabel
  );
}

function renderFloatingNav() {
  const nav = document.getElementById("floatingNav");
  nav.innerHTML = aspectList
    .map((a) => `<a href="#aspect-${a.key}" class="anchor-link">${a.label}</a>`)
    .join("");
}

function renderAspectBlocks() {
  const container = document.getElementById("aspectContainer");
  container.innerHTML = "";
  aspectList.forEach((aspect) => {
    const section = document.createElement("div");
    section.className = "section aspect-card";
    section.id = `aspect-${aspect.key}`;
    section.innerHTML = `
      <h3>${aspect.label}</h3>
      <div class="level-choices">
        ${LEVEL_CHOICES.map(
          (lvl) => `
          <button class="level-btn" data-aspect="${aspect.key}" data-level="${lvl.value}" data-label="${lvl.label}">
            <div class="level-num">${lvl.value}</div>
            <div>
              <div class="level-label">${lvl.label}</div>
              <div class="small-note">${lvl.desc}</div>
            </div>
          </button>`
        ).join("")}
      </div>
      <div class="rubric-columns">
        <div>
          <div class="flex-between"><label>已達成</label><span class="small-note" data-achieved-count="${aspect.key}"></span></div>
          <div class="rubric-list" data-achieved-list="${aspect.key}"></div>
          <label class="small-note">自訂（每行一則）</label>
          <textarea data-custom-achieved="${aspect.key}" placeholder="自訂優點"></textarea>
        </div>
        <div>
          <div class="flex-between"><label>待加強</label><span class="small-note" data-needs-count="${aspect.key}"></span></div>
          <div class="rubric-list" data-needs-list="${aspect.key}"></div>
          <label class="small-note">自訂（每行一則）</label>
          <textarea data-custom-needs="${aspect.key}" placeholder="自訂待加強"></textarea>
        </div>
      </div>
    `;
    container.appendChild(section);
  });
  renderFloatingNav();
}

function setLevelUI(aspectKey, levelLabel) {
  document.querySelectorAll(`.level-btn[data-aspect="${aspectKey}"]`).forEach((btn) => {
    if (btn.dataset.label === levelLabel) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function renderRubricLists(aspectKey, levelLabel, saved = { achieved: [], needsWork: [] }) {
  const achievedBox = document.querySelector(`[data-achieved-list="${aspectKey}"]`);
  const needsBox = document.querySelector(`[data-needs-list="${aspectKey}"]`);
  achievedBox.innerHTML = "";
  needsBox.innerHTML = "";

  if (!levelLabel) {
    achievedBox.innerHTML = `<div class="placeholder">請先選擇等級以顯示句庫。</div>`;
    needsBox.innerHTML = `<div class="placeholder">請先選擇等級以顯示句庫。</div>`;
    return;
  }

  const achievedItems = getRubricByAspectLevel(aspectKey, "achieved", levelLabel);
  const needsItems = getRubricByAspectLevel(aspectKey, "needsWork", levelLabel);

  achievedItems.forEach((item) => {
    const label = document.createElement("label");
    label.className = "checkbox-row";
    label.innerHTML = `
      <input type="checkbox" data-achieved="${aspectKey}" value="${item.id}" ${
      saved.achieved.includes(item.id) ? "checked" : ""
    }>
      <span>${item.text}</span>`;
    achievedBox.appendChild(label);
  });

  needsItems.forEach((item) => {
    const label = document.createElement("label");
    label.className = "checkbox-row";
    label.innerHTML = `
      <input type="checkbox" data-needs="${aspectKey}" value="${item.id}" ${
      saved.needsWork.includes(item.id) ? "checked" : ""
    }>
      <span>${item.text}</span>`;
    needsBox.appendChild(label);
  });

  document.querySelector(`[data-achieved-count="${aspectKey}"]`).textContent = `${saved.achieved.length} 則已選`;
  document.querySelector(`[data-needs-count="${aspectKey}"]`).textContent = `${saved.needsWork.length} 則已選`;
}

function getCurrentTaskId() {
  return document.getElementById("taskSelect").value;
}

function getCurrentStudentId() {
  return document.getElementById("studentSelect").value;
}

function gatherLines(text) {
  return text
    .split(/\n+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function loadFeedbackIntoUI(taskId, studentId) {
  aspectList.forEach((aspect) => {
    const stored = currentClass.feedbacks?.[taskId]?.[studentId]?.[aspect.key];
    const levelLabel = stored?.levelLabel || "";
    setLevelUI(aspect.key, levelLabel);
    renderRubricLists(aspect.key, levelLabel, stored || { achieved: [], needsWork: [] });
    document.querySelector(`textarea[data-custom-achieved="${aspect.key}"]`).value = stored?.customAchieved?.join("\n") || "";
    document.querySelector(`textarea[data-custom-needs="${aspect.key}"]`).value = stored?.customNeedsWork?.join("\n") || "";
  });
}

function saveCurrentFeedback() {
  if (!currentClass) return;
  const taskId = getCurrentTaskId();
  const studentId = getCurrentStudentId();
  if (!taskId || !studentId) return;
  if (!currentClass.feedbacks[taskId]) currentClass.feedbacks[taskId] = {};
  const obj = {};
  aspectList.forEach((aspect) => {
    const activeBtn = document.querySelector(`.level-btn[data-aspect="${aspect.key}"].active`);
    const levelLabel = activeBtn?.dataset.label;
    const levelValue = activeBtn ? Number(activeBtn.dataset.level) : null;
    const achieved = Array.from(document.querySelectorAll(`input[data-achieved="${aspect.key}"]:checked`)).map(
      (el) => el.value
    );
    const needsWork = Array.from(document.querySelectorAll(`input[data-needs="${aspect.key}"]:checked`)).map((el) => el.value);
    const customAchieved = gatherLines(document.querySelector(`textarea[data-custom-achieved="${aspect.key}"]`).value);
    const customNeeds = gatherLines(document.querySelector(`textarea[data-custom-needs="${aspect.key}"]`).value);
    document.querySelector(`[data-achieved-count="${aspect.key}"]`).textContent = `${achieved.length} 則已選`;
    document.querySelector(`[data-needs-count="${aspect.key}"]`).textContent = `${needsWork.length} 則已選`;
    obj[aspect.key] = {
      level: levelValue,
      levelLabel: levelLabel || "",
      achieved,
      needsWork,
      customAchieved: customAchieved.length ? customAchieved : undefined,
      customNeedsWork: customNeeds.length ? customNeeds : undefined,
    };
  });
  currentClass.feedbacks[taskId][studentId] = obj;
  setStatus("已自動儲存。");
  updateProgress();
  renderStudentSelect();
}

function resetUI() {
  aspectList.forEach((aspect) => {
    setLevelUI(aspect.key, "");
    renderRubricLists(aspect.key, "");
    document.querySelector(`textarea[data-custom-achieved="${aspect.key}"]`).value = "";
    document.querySelector(`textarea[data-custom-needs="${aspect.key}"]`).value = "";
  });
}

function updateProgress() {
  if (!currentClass) return;
  const taskId = getCurrentTaskId();
  if (!taskId) return;
  const total = currentClass.students.length || 1;
  const finished = currentClass.students.filter((stu) => isStudentFinished(taskId, stu.id)).length;
  const percent = Math.round((finished / total) * 100);
  document.getElementById("progressFill").style.width = `${percent}%`;
  document.getElementById("progressText").textContent = `${finished}/${total} (${percent}%)`;
  document.getElementById("openTaskModalBtn").style.display = percent === 100 ? "inline-block" : "none";
}

function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
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
      currentClass = JSON.parse(reader.result);
      ensureStructure();
      renderStudentTable();
      renderStudentSelect();
      renderTaskSelect();
      updateProgress();
      setStatus("已匯入班級資料。");
    } catch (err) {
      alert("匯入失敗，請確認檔案格式。");
    }
  };
  reader.readAsText(file);
}

function renderTaskSelect() {
  const select = document.getElementById("taskSelect");
  select.innerHTML = "";
  if (!currentClass) return;
  currentClass.tasks.forEach((task) => {
    const option = document.createElement("option");
    option.value = task.id;
    option.textContent = `${task.topic || "未命名"}（${task.date || "未填日期"}）`;
    select.appendChild(option);
  });
  if (!select.value && currentClass.tasks.length) {
    select.value = currentClass.tasks[0].id;
  }
}

function addTask() {
  if (!currentClass) return alert("請先建立或匯入班級。");
  const topic = document.getElementById("taskTopic").value.trim();
  if (!topic) return alert("請輸入作文主題。");
  const date = document.getElementById("taskDate").value;
  const note = document.getElementById("taskNote").value.trim();
  const id = `task-${Date.now()}`;
  currentClass.tasks.push({ id, topic, date, note });
  renderTaskSelect();
  renderStudentSelect();
  updateProgress();
  setStatus("已新增批改任務。");
}

function renderTaskListInModal() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";
  if (!currentClass || !currentClass.tasks.length) {
    list.innerHTML = `<p class="placeholder">尚無任務。</p>`;
    return;
  }
  currentClass.tasks.forEach((task) => {
    const finishedCount = currentClass.students.filter((stu) => isStudentFinished(task.id, stu.id)).length;
    const card = document.createElement("div");
    card.className = "task-row";
    card.innerHTML = `
      <div class="grid-3">
        <div>
          <label>主題</label>
          <input type="text" data-task-topic="${task.id}" value="${task.topic}">
        </div>
        <div>
          <label>日期</label>
          <input type="date" data-task-date="${task.id}" value="${task.date || ""}">
        </div>
        <div>
          <label>備註</label>
          <input type="text" data-task-note="${task.id}" value="${task.note || ""}">
        </div>
      </div>
      <div class="flex-between" style="margin-top:0.5rem;">
        <span class="small-note">完成：${finishedCount}/${currentClass.students.length}</span>
        <div class="flex-between" style="gap:0.35rem;">
          <button class="secondary" data-export="${task.id}">匯出連結</button>
          <button class="secondary" data-save="${task.id}">儲存修改</button>
          <button class="danger" data-delete="${task.id}">刪除</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function openTaskModal() {
  document.getElementById("taskModal").style.display = "flex";
  renderTaskListInModal();
}

function closeTaskModal() {
  document.getElementById("taskModal").style.display = "none";
}

async function exportLinks(taskId) {
  if (!currentClass) return;
  const task = currentClass.tasks.find((t) => t.id === taskId);
  if (!task) return;
  const links = [];
  for (const stu of currentClass.students) {
    const fb = currentClass.feedbacks?.[taskId]?.[stu.id];
    if (!fb || !isStudentFinished(taskId, stu.id)) continue;
    const payload = {
      classId: currentClass.classId,
      className: currentClass.className,
      studentId: stu.id,
      studentName: stu.name,
      taskId: task.id,
      taskTopic: task.topic,
      taskDate: task.date,
      taskNote: task.note,
      aspects: fb,
    };
    const jsonString = JSON.stringify(payload);
    const encoded = btoa(encodeURIComponent(jsonString));
    const hash = await computeHash(currentClass.classId, stu.id, stu.secretCode);
    const url = `${location.origin}${location.pathname.replace(/[^/]+$/, "feedback.html")}?p=${encoded}&h=${hash}`;
    links.push({ studentId: stu.id, name: stu.name, url });
  }
  if (!links.length) return alert("尚無完成的學生可匯出。");
  const blob = new Blob([JSON.stringify(links, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${task.topic || task.id}-links.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function deleteTask(taskId) {
  currentClass.tasks = currentClass.tasks.filter((t) => t.id !== taskId);
  delete currentClass.feedbacks[taskId];
  renderTaskSelect();
  renderStudentSelect();
  updateProgress();
}

function saveTaskEdits(taskId) {
  const task = currentClass.tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.topic = document.querySelector(`[data-task-topic="${taskId}"]`).value;
  task.date = document.querySelector(`[data-task-date="${taskId}"]`).value;
  task.note = document.querySelector(`[data-task-note="${taskId}"]`).value;
  renderTaskSelect();
  setStatus("任務已更新。");
}

function nextStudent(ungradedOnly = false) {
  if (!currentClass) return;
  const taskId = getCurrentTaskId();
  const select = document.getElementById("studentSelect");
  const students = currentClass.students;
  let idx = students.findIndex((s) => s.id === select.value);
  for (let i = 1; i <= students.length; i++) {
    const target = students[(idx + i) % students.length];
    if (!ungradedOnly || !isStudentFinished(taskId, target.id)) {
      select.value = target.id;
      loadFeedbackIntoUI(taskId, target.id);
      document.getElementById("studentSelect").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }
}

function bindEvents() {
  bindTabs();
  renderAspectBlocks();

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
    currentClass = { classId, className, students, tasks: [], feedbacks: {} };
    renderStudentTable();
    renderStudentSelect();
    renderTaskSelect();
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

  document.getElementById("createTaskBtn").addEventListener("click", addTask);
  document.getElementById("manageTaskBtn").addEventListener("click", openTaskModal);
  document.getElementById("openTaskModalBtn").addEventListener("click", openTaskModal);
  document.getElementById("closeTaskModal").addEventListener("click", closeTaskModal);

  document.getElementById("taskList").addEventListener("click", (e) => {
    const saveBtn = e.target.closest("button[data-save]");
    const delBtn = e.target.closest("button[data-delete]");
    const exportBtn = e.target.closest("button[data-export]");
    if (saveBtn) saveTaskEdits(saveBtn.dataset.save);
    if (delBtn) {
      deleteTask(delBtn.dataset.delete);
      renderTaskListInModal();
    }
    if (exportBtn) exportLinks(exportBtn.dataset.export);
  });

  document.getElementById("taskSelect").addEventListener("change", () => {
    renderStudentSelect();
    const taskId = getCurrentTaskId();
    const stuId = getCurrentStudentId();
    resetUI();
    loadFeedbackIntoUI(taskId, stuId);
    updateProgress();
  });

  document.getElementById("studentSelect").addEventListener("change", () => {
    const taskId = getCurrentTaskId();
    const stuId = getCurrentStudentId();
    resetUI();
    loadFeedbackIntoUI(taskId, stuId);
  });

  document.getElementById("nextStudentBtn").addEventListener("click", () => nextStudent(false));
  document.getElementById("nextUngradedBtn").addEventListener("click", () => nextStudent(true));

  document.getElementById("aspectContainer").addEventListener("click", (e) => {
    const btn = e.target.closest(".level-btn");
    if (btn) {
      const aspect = btn.dataset.aspect;
      const levelLabel = btn.dataset.label;
      setLevelUI(aspect, levelLabel);
      const saved = currentClass?.feedbacks?.[getCurrentTaskId()]?.[getCurrentStudentId()]?.[aspect];
      renderRubricLists(aspect, levelLabel, saved || { achieved: [], needsWork: [] });
      saveCurrentFeedback();
    }
  });

  document.getElementById("aspectContainer").addEventListener("input", (e) => {
    if (e.target.matches("textarea")) {
      saveCurrentFeedback();
    }
  });

  document.getElementById("aspectContainer").addEventListener("change", (e) => {
    if (e.target.matches("input[type=checkbox]")) {
      saveCurrentFeedback();
    }
  });
}

renderAspectBlocks();
bindEvents();
