const STORAGE_KEY = "hs-essay-grading-classes";
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

let classes = [];
let selectedClassId = null;
let selectedTaskId = null;

function padNumber(num, size) {
  return num.toString().padStart(size, "0");
}

function generateSecretCode() {
  return Math.random().toString(10).slice(2, 6).padEnd(4, "0");
}

function setStatus(msg) {
  const box = document.getElementById("status");
  box.textContent = msg;
  box.style.display = msg ? "block" : "none";
  if (msg) {
    setTimeout(() => {
      box.style.display = "none";
    }, 2000);
  }
}

function ensureClassStructure(cls) {
  if (!cls.tasks) cls.tasks = [];
  if (!cls.feedbacks) cls.feedbacks = {};
  if (!cls.students) cls.students = [];
}

function saveState(showMessage = false) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ classes, selectedClassId, selectedTaskId })
  );
  if (showMessage) setStatus("已儲存至本機。");
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      classes = parsed.classes || [];
      selectedClassId = parsed.selectedClassId || null;
      selectedTaskId = parsed.selectedTaskId || null;
    }
  } catch (err) {
    classes = [];
  }
  classes.forEach(ensureClassStructure);
  if (!selectedClassId && classes.length) selectedClassId = classes[0].classId;
  const cls = getCurrentClass();
  if (cls && !selectedTaskId && cls.tasks.length) selectedTaskId = cls.tasks[0].id;
}

function getCurrentClass() {
  return classes.find((c) => c.classId === selectedClassId) || null;
}

function getCurrentTask() {
  const cls = getCurrentClass();
  if (!cls) return null;
  return cls.tasks.find((t) => t.id === selectedTaskId) || null;
}

function isStudentFinished(taskId, studentId) {
  const cls = getCurrentClass();
  if (!cls) return false;
  const fb = cls.feedbacks?.[taskId]?.[studentId];
  if (!fb) return false;
  return aspectList.every((a) => fb[a.key]?.level);
}

function renderFloatingNav() {
  const nav = document.getElementById("floatingNav");
  nav.innerHTML = aspectList
    .map((a) => `<a href="#aspect-${a.key}" class="anchor-link">${a.label}</a>`)
    .join("");
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
        saved.achieved?.includes(item.id) ? "checked" : ""
      }>
      <span>${item.text}</span>`;
    achievedBox.appendChild(label);
  });

  needsItems.forEach((item) => {
    const label = document.createElement("label");
    label.className = "checkbox-row";
    label.innerHTML = `
      <input type="checkbox" data-needs="${aspectKey}" value="${item.id}" ${
        saved.needsWork?.includes(item.id) ? "checked" : ""
      }>
      <span>${item.text}</span>`;
    needsBox.appendChild(label);
  });

  document.querySelector(`[data-achieved-count="${aspectKey}"]`).textContent = `${
    saved.achieved?.length || 0
  } 則已選`;
  document.querySelector(`[data-needs-count="${aspectKey}"]`).textContent = `${
    saved.needsWork?.length || 0
  } 則已選`;
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
          <div class="flex-between"><label>已達成</label><span class="small-note" data-achieved-count="${
            aspect.key
          }"></span></div>
          <div class="rubric-list" data-achieved-list="${aspect.key}"></div>
          <label class="small-note">自訂（每行一則）</label>
          <textarea data-custom-achieved="${aspect.key}" placeholder="自訂優點"></textarea>
        </div>
        <div>
          <div class="flex-between"><label>待加強</label><span class="small-note" data-needs-count="${
            aspect.key
          }"></span></div>
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

function gatherLines(text) {
  return text
    .split(/\n+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function resetFeedbackUI() {
  aspectList.forEach((aspect) => {
    setLevelUI(aspect.key, "");
    renderRubricLists(aspect.key, "", { achieved: [], needsWork: [] });
    document.querySelector(`textarea[data-custom-achieved="${aspect.key}"]`).value = "";
    document.querySelector(`textarea[data-custom-needs="${aspect.key}"]`).value = "";
  });
}

function loadFeedbackIntoUI(taskId, studentId) {
  const cls = getCurrentClass();
  if (!cls || !taskId || !studentId) {
    resetFeedbackUI();
    return;
  }
  const savedByTask = cls.feedbacks?.[taskId]?.[studentId];
  aspectList.forEach((aspect) => {
    const stored = savedByTask?.[aspect.key];
    const levelLabel = stored?.levelLabel || "";
    setLevelUI(aspect.key, levelLabel);
    renderRubricLists(aspect.key, levelLabel, stored || { achieved: [], needsWork: [] });
    document.querySelector(`textarea[data-custom-achieved="${aspect.key}"]`).value = stored?.customAchieved?.join("\n") || "";
    document.querySelector(`textarea[data-custom-needs="${aspect.key}"]`).value =
      stored?.customNeedsWork?.join("\n") || "";
  });
}

function saveCurrentFeedback() {
  const cls = getCurrentClass();
  const taskId = selectedTaskId;
  const studentId = document.getElementById("studentSelect").value;
  if (!cls || !taskId || !studentId) return;
  if (!cls.feedbacks[taskId]) cls.feedbacks[taskId] = {};
  const obj = {};
  aspectList.forEach((aspect) => {
    const activeBtn = document.querySelector(`.level-btn[data-aspect="${aspect.key}"].active`);
    const levelLabel = activeBtn?.dataset.label;
    const levelValue = activeBtn ? Number(activeBtn.dataset.level) : null;
    const achieved = Array.from(document.querySelectorAll(`input[data-achieved="${aspect.key}"]:checked`)).map(
      (el) => el.value
    );
    const needsWork = Array.from(document.querySelectorAll(`input[data-needs="${aspect.key}"]:checked`)).map(
      (el) => el.value
    );
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
  cls.feedbacks[taskId][studentId] = obj;
  updateProgress();
  renderStudentSelect();
  saveState();
}

function renderStudentSelect() {
  const select = document.getElementById("studentSelect");
  select.innerHTML = "";
  const cls = getCurrentClass();
  if (!cls) return;
  const taskId = selectedTaskId;
  cls.students.forEach((stu) => {
    const option = document.createElement("option");
    option.value = stu.id;
    const done = taskId ? isStudentFinished(taskId, stu.id) : false;
    const marker = done ? " ✓" : " ...";
    option.textContent = `${stu.id}${stu.name ? " - " + stu.name : ""}${marker}`;
    select.appendChild(option);
  });
  if (!select.value && cls.students.length) select.value = cls.students[0].id;
}

function updateProgress() {
  const cls = getCurrentClass();
  const taskId = selectedTaskId;
  if (!cls || !taskId) return;
  const total = cls.students.length || 1;
  const finished = cls.students.filter((stu) => isStudentFinished(taskId, stu.id)).length;
  const percent = Math.round((finished / total) * 100);
  document.getElementById("progressFill").style.width = `${percent}%`;
  document.getElementById("progressText").textContent = `${finished}/${total} (${percent}%)`;
  document.getElementById("openTaskModalBtn").style.display = percent === 100 ? "inline-block" : "none";
}

function computeTaskProgress(cls, taskId) {
  const total = cls.students.length || 1;
  const finished = cls.students.filter((stu) => isStudentFinished(taskId, stu.id)).length;
  return { total, finished, percent: Math.round((finished / total) * 100) };
}

function renderClassList() {
  const list = document.getElementById("classList");
  list.innerHTML = "";
  if (!classes.length) {
    list.innerHTML = `<div class="placeholder">尚未建立班級，請點擊「新增班級」。</div>`;
    return;
  }

  classes.forEach((cls) => {
    const card = document.createElement("div");
    card.className = `class-card ${cls.classId === selectedClassId ? "active" : ""}`;
    card.dataset.classId = cls.classId;
    card.innerHTML = `
      <div class="flex-between class-card-header">
        <div>
          <div class="class-title">${cls.classId}${cls.className ? "｜" + cls.className : ""}</div>
          <div class="small-note">學生 ${cls.students.length} 人，任務 ${cls.tasks.length} 則</div>
        </div>
        <div class="flex-between" style="gap:0.35rem;">
          <button class="secondary" data-edit-class="${cls.classId}">編輯班級</button>
          <button class="secondary" data-manage-task="${cls.classId}">管理任務</button>
        </div>
      </div>
      <div class="task-stack" ${cls.classId === selectedClassId ? "" : "style=\"display:none;\""}>
        ${cls.tasks
          .map((task) => {
            const prog = computeTaskProgress(cls, task.id);
            const startLabel = prog.finished === 0 ? "開始批改" : "繼續批改";
            return `
              <div class="task-card" data-task-id="${task.id}" data-class-id="${cls.classId}">
                <div>
                  <div class="task-title">${task.topic || "未命名任務"}</div>
                  <div class="small-note">${task.date || "未填日期"}${
              task.note ? "｜" + task.note : ""
            }</div>
                  <div class="progress-bar mini"><div class="progress-bar-fill" style="width:${prog.percent}%"></div></div>
                  <div class="small-note">完成：${prog.finished}/${prog.total}（${prog.percent}%）</div>
                </div>
                <div class="task-actions">
                  <button data-start="${task.id}" data-class="${cls.classId}">${startLabel}</button>
                  <button class="danger" data-delete-task="${task.id}" data-class="${cls.classId}">刪除</button>
                </div>
              </div>`;
          })
          .join("")}
        <button class="ghost" data-add-task="${cls.classId}">＋ 新增批改任務</button>
      </div>
    `;
    list.appendChild(card);
  });
}

function updateGradingHeader() {
  const cls = getCurrentClass();
  const task = getCurrentTask();
  document.getElementById("currentClassLabel").textContent = cls
    ? `${cls.classId}${cls.className ? "｜" + cls.className : ""}`
    : "尚未選擇";
  document.getElementById("currentTaskLabel").textContent = task
    ? `${task.topic || task.id}${task.date ? "｜" + task.date : ""}`
    : "尚未選擇";
}

function refreshAll() {
  renderClassList();
  renderStudentSelect();
  updateProgress();
  updateGradingHeader();
  const cls = getCurrentClass();
  const taskId = selectedTaskId;
  const stuId = document.getElementById("studentSelect").value;
  loadFeedbackIntoUI(taskId, stuId);
}

function openModal(id) {
  document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

function createClass() {
  const classId = document.getElementById("modalClassId").value.trim();
  const className = document.getElementById("modalClassName").value.trim();
  const size = Number(document.getElementById("modalClassSize").value) || 0;
  if (!classId) return alert("請輸入班級代碼。");
  if (classes.some((c) => c.classId === classId)) return alert("班級代碼已存在。");
  if (size <= 0) return alert("請輸入正確的人數。");
  const digits = Math.max(2, size.toString().length);
  const students = Array.from({ length: size }, (_, idx) => ({
    id: padNumber(idx + 1, digits),
    name: "",
    secretCode: generateSecretCode(),
  }));
  const cls = { classId, className, students, tasks: [], feedbacks: {} };
  classes.push(cls);
  selectedClassId = classId;
  selectedTaskId = null;
  saveState(true);
  closeModal("createClassModal");
  refreshAll();
}

function populateEditClassModal() {
  const cls = getCurrentClass();
  if (!cls) return;
  document.getElementById("editClassId").value = cls.classId;
  document.getElementById("editClassName").value = cls.className || "";
  renderStudentTable();
  renderSecretViewer();
}

function saveClassBasics() {
  const cls = getCurrentClass();
  if (!cls) return;
  const newId = document.getElementById("editClassId").value.trim();
  const newName = document.getElementById("editClassName").value.trim();
  if (!newId) return setStatus("班級代碼不可為空。");
  if (newId !== cls.classId && classes.some((c) => c.classId === newId)) {
    setStatus("班級代碼重複，請重新輸入。");
    document.getElementById("editClassId").value = cls.classId;
    return;
  }
  cls.classId = newId;
  cls.className = newName;
  selectedClassId = newId;
  saveState(true);
  renderClassList();
  updateGradingHeader();
}

function renderStudentTable() {
  const tbody = document.querySelector("#studentTable tbody");
  tbody.innerHTML = "";
  const cls = getCurrentClass();
  if (!cls) return;
  cls.students.forEach((stu) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stu.id}</td>
      <td><input data-id="${stu.id}" class="name-input" type="text" value="${stu.name || ""}" placeholder="姓名"></td>
      <td><input data-id="${stu.id}" class="code-input inline-input" type="text" value="${stu.secretCode}"></td>
      <td><button class="secondary regen" data-id="${stu.id}">重新產生</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSecretViewer() {
  const select = document.getElementById("secretStudentSelect");
  select.innerHTML = "";
  const cls = getCurrentClass();
  if (!cls) return;
  cls.students.forEach((stu) => {
    const opt = document.createElement("option");
    opt.value = stu.id;
    opt.textContent = `${stu.id}${stu.name ? " - " + stu.name : ""}`;
    select.appendChild(opt);
  });
  if (cls.students.length) select.value = cls.students[0].id;
  updateSecretDisplay();
}

function updateSecretDisplay() {
  const cls = getCurrentClass();
  if (!cls) return;
  const select = document.getElementById("secretStudentSelect");
  const target = cls.students.find((s) => s.id === select.value);
  document.getElementById("secretDisplay").textContent = target?.secretCode || "—";
}

function shiftSecret(delta) {
  const cls = getCurrentClass();
  if (!cls) return;
  const select = document.getElementById("secretStudentSelect");
  const idx = cls.students.findIndex((s) => s.id === select.value);
  if (idx === -1) return;
  const next = cls.students[(idx + delta + cls.students.length) % cls.students.length];
  select.value = next.id;
  updateSecretDisplay();
}

function importJson(file) {
  const cls = getCurrentClass();
  if (!cls) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      ensureClassStructure(imported);
      const idx = classes.findIndex((c) => c.classId === cls.classId);
      classes[idx] = imported;
      selectedClassId = imported.classId;
      selectedTaskId = imported.tasks[0]?.id || null;
      saveState(true);
      populateEditClassModal();
      refreshAll();
    } catch (err) {
      alert("匯入失敗，請確認檔案格式。");
    }
  };
  reader.readAsText(file);
}

function exportJson() {
  const cls = getCurrentClass();
  if (!cls) return;
  const blob = new Blob([JSON.stringify(cls, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cls.classId || "class"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function addTask(topic, date, note) {
  const cls = getCurrentClass();
  if (!cls) return alert("請先選擇班級。");
  if (!topic) return alert("請輸入作文主題。");
  const id = `task-${Date.now()}`;
  cls.tasks.push({ id, topic, date, note });
  selectedTaskId = id;
  saveState(true);
  refreshAll();
  closeModal("createTaskModal");
}

function renderTaskListInModal() {
  const list = document.getElementById("taskList");
  const cls = getCurrentClass();
  list.innerHTML = "";
  if (!cls || !cls.tasks.length) {
    list.innerHTML = `<p class="placeholder">尚無任務。</p>`;
    return;
  }
  cls.tasks.forEach((task) => {
    const prog = computeTaskProgress(cls, task.id);
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
        <span class="small-note">完成：${prog.finished}/${prog.total}</span>
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

async function computeHash(classId, studentId, secretCode) {
  const data = `${classId}|${studentId}|${secretCode}`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function exportLinks(taskId) {
  const cls = getCurrentClass();
  if (!cls) return;
  const task = cls.tasks.find((t) => t.id === taskId);
  if (!task) return;
  const links = [];
  for (const stu of cls.students) {
    const fb = cls.feedbacks?.[taskId]?.[stu.id];
    if (!fb || !aspectList.every((a) => fb[a.key]?.level)) continue;
    const payload = {
      classId: cls.classId,
      className: cls.className,
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
    const hash = await computeHash(cls.classId, stu.id, stu.secretCode);
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
  const cls = getCurrentClass();
  if (!cls) return;
  if (!confirm("確定要刪除這個任務？進度將一併移除。")) return;
  cls.tasks = cls.tasks.filter((t) => t.id !== taskId);
  delete cls.feedbacks[taskId];
  if (selectedTaskId === taskId) selectedTaskId = cls.tasks[0]?.id || null;
  saveState(true);
  refreshAll();
}

function saveTaskEdits(taskId) {
  const cls = getCurrentClass();
  if (!cls) return;
  const task = cls.tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.topic = document.querySelector(`[data-task-topic="${taskId}"]`).value;
  task.date = document.querySelector(`[data-task-date="${taskId}"]`).value;
  task.note = document.querySelector(`[data-task-note="${taskId}"]`).value;
  saveState(true);
  renderClassList();
  setStatus("任務已更新。");
}

function nextStudent(ungradedOnly = false) {
  const cls = getCurrentClass();
  const taskId = selectedTaskId;
  if (!cls || !taskId) return;
  const select = document.getElementById("studentSelect");
  const students = cls.students;
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

function goToGradingTab() {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
  document.querySelector('[data-tab="gradingTab"]').classList.add("active");
  document.getElementById("gradingTab").classList.add("active");
}

function jumpToFirstInProgress() {
  const cls = getCurrentClass();
  const taskId = selectedTaskId;
  if (!cls || !taskId) return;
  const target = cls.students.find((stu) => !isStudentFinished(taskId, stu.id)) || cls.students[0];
  const select = document.getElementById("studentSelect");
  if (target) select.value = target.id;
  loadFeedbackIntoUI(taskId, target?.id);
  document.getElementById("studentSelect").scrollIntoView({ behavior: "smooth", block: "start" });
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

function bindEvents() {
  bindTabs();
  renderAspectBlocks();

  document.getElementById("openCreateClassModal").addEventListener("click", () => openModal("createClassModal"));
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });
  document.getElementById("createClassBtn").addEventListener("click", createClass);

  document.getElementById("classList").addEventListener("click", (e) => {
    const classCard = e.target.closest(".class-card");
    const classId = classCard?.dataset.classId;
    if (e.target.matches("button[data-edit-class]")) {
      selectedClassId = e.target.dataset.editClass;
      populateEditClassModal();
      openModal("editClassModal");
      saveState();
      refreshAll();
      return;
    }
    if (e.target.matches("button[data-manage-task]")) {
      selectedClassId = e.target.dataset.manageTask;
      renderTaskListInModal();
      openModal("taskModal");
      saveState();
      refreshAll();
      return;
    }
    if (e.target.matches("button[data-add-task]")) {
      selectedClassId = e.target.dataset.addTask;
      document.getElementById("taskTopic").value = "";
      document.getElementById("taskDate").value = "";
      document.getElementById("taskNote").value = "";
      openModal("createTaskModal");
      return;
    }
    if (e.target.matches("button[data-start]")) {
      selectedClassId = e.target.dataset.class;
      selectedTaskId = e.target.dataset.start;
      goToGradingTab();
      refreshAll();
      jumpToFirstInProgress();
      return;
    }
    if (e.target.matches("button[data-delete-task]")) {
      selectedClassId = e.target.dataset.class;
      deleteTask(e.target.dataset.deleteTask);
      return;
    }
    if (classCard && !e.target.closest("button")) {
      selectedClassId = classId;
      selectedTaskId = getCurrentClass()?.tasks[0]?.id || null;
      refreshAll();
      saveState();
    }
  });

  document.getElementById("createTaskBtn").addEventListener("click", () => {
    const topic = document.getElementById("taskTopic").value.trim();
    const date = document.getElementById("taskDate").value;
    const note = document.getElementById("taskNote").value.trim();
    addTask(topic, date, note);
  });

  document.getElementById("taskList").addEventListener("click", (e) => {
    const saveBtn = e.target.closest("button[data-save]");
    const delBtn = e.target.closest("button[data-delete]");
    const exportBtn = e.target.closest("button[data-export]");
    if (saveBtn) saveTaskEdits(saveBtn.dataset.save);
    if (delBtn) deleteTask(delBtn.dataset.delete);
    if (exportBtn) exportLinks(exportBtn.dataset.export);
  });

  document.getElementById("closeTaskModal").addEventListener("click", () => closeModal("taskModal"));

  document.getElementById("studentSelect").addEventListener("change", () => {
    const taskId = selectedTaskId;
    const stuId = document.getElementById("studentSelect").value;
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
      const cls = getCurrentClass();
      const saved = cls?.feedbacks?.[selectedTaskId]?.[document.getElementById("studentSelect").value]?.[aspect];
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

  document.getElementById("openTaskModalBtn").addEventListener("click", () => {
    renderTaskListInModal();
    openModal("taskModal");
  });

  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
  });

  document.getElementById("importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) importJson(file);
  });

  document.getElementById("exportBtn").addEventListener("click", exportJson);

  document.getElementById("editClassId").addEventListener("blur", saveClassBasics);
  document.getElementById("editClassName").addEventListener("blur", saveClassBasics);

  document.getElementById("studentTable").addEventListener("input", (e) => {
    const cls = getCurrentClass();
    if (!cls) return;
    const target = e.target;
    const id = target.getAttribute("data-id");
    const student = cls.students.find((s) => s.id === id);
    if (!student) return;
    if (target.classList.contains("name-input")) {
      student.name = target.value;
      renderStudentSelect();
    }
    if (target.classList.contains("code-input")) {
      student.secretCode = target.value;
    }
    saveState();
  });

  document.getElementById("studentTable").addEventListener("click", (e) => {
    const btn = e.target.closest("button.regen");
    if (!btn) return;
    const cls = getCurrentClass();
    if (!cls) return;
    const id = btn.getAttribute("data-id");
    const student = cls.students.find((s) => s.id === id);
    if (student) {
      student.secretCode = generateSecretCode();
      renderStudentTable();
      renderSecretViewer();
      renderStudentSelect();
      saveState(true);
      setStatus("已重新產生密碼，請重新產生連結。");
    }
  });

  document.getElementById("secretStudentSelect").addEventListener("change", updateSecretDisplay);
  document.getElementById("prevSecret").addEventListener("click", () => shiftSecret(-1));
  document.getElementById("nextSecret").addEventListener("click", () => shiftSecret(1));
}

loadState();
renderAspectBlocks();
bindEvents();
refreshAll();
