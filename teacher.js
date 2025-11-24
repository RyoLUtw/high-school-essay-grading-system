const STORAGE_KEY = "hs-essay-grading-classes";
const aspectList = [
  { key: "content", label: "內容" },
  { key: "organization", label: "組織" },
  { key: "grammar", label: "文法句構" },
  { key: "lexical", label: "字彙拼字" },
];

const LEVEL_CHOICES = [
  {
    label: "優",
    points: [5, 4],
    desc: {
      content: "主題（句）清楚切題，並有具體、完整的相關細節支持。",
      organization: "重點分明，有開頭、發展、結尾，前後連貫，轉承語使用得當。",
      grammar: "全文幾無文法、格式、標點錯誤，文句結構富變化。",
      lexical: "用字精確、得宜，且幾無拼字、大小寫錯誤。",
    },
  },
  {
    label: "可",
    points: [3],
    desc: {
      content: "主題不夠清楚或突顯，部分相關敘述發展不全。",
      organization: "重點安排不妥，前後發展比例與轉承語使用欠妥。",
      grammar: "文法、格式、標點錯誤少，且未影響文意之表達。",
      lexical: "字詞單調、重複，用字偶有不當，少許拼字、大小寫錯誤，但不影響文意之表達。",
    },
  },
  {
    label: "差",
    points: [2, 1],
    desc: {
      content: "主題不明，大部分相關敘述發展不全或與主題無關。",
      organization: "重點不明，前後不連貫。",
      grammar: "文法、格式、標點錯誤多，且明顯影響文意之表達。",
      lexical: "用字、拼字、大小寫錯誤多，明顯影響文意之表達。",
    },
  },
  {
    label: "劣",
    points: [0],
    desc: {
      content: "文不對題或沒寫（凡文不對題或沒寫者，其他各項均以零分計算）。",
      organization: "全文毫無組織或未按提示寫作。",
      grammar: "全文文法錯誤嚴重，導致文意不明。",
      lexical: "只寫出或抄襲與題意有關的零碎字詞。",
    },
  },
];

let pendingPointAspect = null;
let pendingPointLabel = null;
let pendingPointOptions = [];

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
  if (!cls.className) cls.className = cls.classId;
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
  return aspectList.every((a) => fb[a.key] && fb[a.key].levelLabel && fb[a.key].level !== undefined);
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

function openPointPicker(aspectKey, levelLabel, options) {
  pendingPointAspect = aspectKey;
  pendingPointLabel = levelLabel;
  pendingPointOptions = options;
  const hint = document.getElementById("pointModalHint");
  hint.textContent = `${levelLabel} 可給 ${options.join("、")} 分，請選擇實際給分。`;
  const box = document.getElementById("pointChoiceContainer");
  box.innerHTML = options
    .map((pt) => `<button class="secondary" data-point-choice="${pt}">${pt} 分</button>`)
    .join("");
  openModal("pointModal");
}

function finalizePointSelection(point) {
  if (!pendingPointAspect || !pendingPointLabel) return;
  const cls = getCurrentClass();
  const savedAspect =
    cls?.feedbacks?.[selectedTaskId]?.[document.getElementById("studentSelect").value]?.[
      pendingPointAspect
    ];
  setLevelUI(pendingPointAspect, pendingPointLabel, point);
  renderRubricLists(pendingPointAspect, pendingPointLabel, savedAspect || { achieved: [], needsWork: [] });
  saveCurrentFeedback();
  pendingPointAspect = null;
  pendingPointLabel = null;
  pendingPointOptions = [];
  closeModal("pointModal");
}

function renderRubricLists(aspectKey, levelLabel, saved = { achieved: [], needsWork: [] }) {
  const achievedBox = document.querySelector(`[data-achieved-list="${aspectKey}"]`);
  const needsBox = document.querySelector(`[data-needs-list="${aspectKey}"]`);
  achievedBox.innerHTML = "";
  needsBox.innerHTML = "";

  if (!levelLabel) {
    achievedBox.innerHTML = `<div class="placeholder">請先選擇等級以顯示句庫。</div>`;
    needsBox.innerHTML = `<div class="placeholder">請先選擇等級以顯示句庫。</div>`;
    document.querySelector(`[data-achieved-count="${aspectKey}"]`).textContent = "0 則已選";
    document.querySelector(`[data-needs-count="${aspectKey}"]`).textContent = "0 則已選";
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
    const sectionId = `aspect-${aspect.key}`;
    const section = document.createElement("div");
    section.className = "section aspect-card";
    section.id = sectionId;
    section.innerHTML = `
      <h3>${aspect.label}</h3>
      <div class="level-choices">
        ${LEVEL_CHOICES.map(
          (lvl) => {
            const rangeLabel =
              lvl.points.length > 1
                ? `${Math.max(...lvl.points)}–${Math.min(...lvl.points)} 分`
                : `${lvl.points[0]} 分`;
            const desc = lvl.desc[aspect.key];
            return `
          <button class="level-btn" data-aspect="${aspect.key}" data-label="${lvl.label}" data-points="${lvl.points.join(",")}">
            <div>
              <div class="level-label">${lvl.label}（${rangeLabel}）</div>
              <div class="small-note">${desc}</div>
            </div>
          </button>`;
          }
        ).join("")}
      </div>
      <div class="rubric-columns">
        <div>
          <div class="flex-between"><label>已達成</label><span class="small-note" data-achieved-count="${
            aspect.key
          }"></span></div>
          <div class="rubric-list" data-achieved-list="${aspect.key}"></div>
        </div>
        <div>
          <div class="flex-between"><label>待加強</label><span class="small-note" data-needs-count="${
            aspect.key
          }"></span></div>
          <div class="rubric-list" data-needs-list="${aspect.key}"></div>
        </div>
      </div>
    `;
    container.appendChild(section);
  });
  renderFloatingNav();
}

function setLevelUI(aspectKey, levelLabel, points = "") {
  document.querySelectorAll(`.level-btn[data-aspect="${aspectKey}"]`).forEach((btn) => {
    if (btn.dataset.label === levelLabel) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  const section = document.getElementById(`aspect-${aspectKey}`);
  if (section) {
    section.dataset.points = points || "";
    section.dataset.levelLabel = levelLabel || "";
  }
}

function resetFeedbackUI() {
  aspectList.forEach((aspect) => {
    setLevelUI(aspect.key, "");
    renderRubricLists(aspect.key, "", { achieved: [], needsWork: [] });
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
    const points = stored?.level ?? "";
    setLevelUI(aspect.key, levelLabel, points);
    renderRubricLists(aspect.key, levelLabel, stored || { achieved: [], needsWork: [] });
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
    const section = document.getElementById(`aspect-${aspect.key}`);
    const levelValue = section && section.dataset.points ? Number(section.dataset.points) : null;
    const achieved = Array.from(document.querySelectorAll(`input[data-achieved="${aspect.key}"]:checked`)).map(
      (el) => el.value
    );
    const needsWork = Array.from(document.querySelectorAll(`input[data-needs="${aspect.key}"]:checked`)).map(
      (el) => el.value
    );
    document.querySelector(`[data-achieved-count="${aspect.key}"]`).textContent = `${achieved.length} 則已選`;
    document.querySelector(`[data-needs-count="${aspect.key}"]`).textContent = `${needsWork.length} 則已選`;
    obj[aspect.key] = {
      level: levelValue,
      levelLabel: levelLabel || "",
      achieved,
      needsWork,
    };
  });
  cls.feedbacks[taskId][studentId] = obj;
  updateProgress();
  renderStudentSelect();
  saveState();
}

function renderStudentSelect() {
  const select = document.getElementById("studentSelect");
  const previous = select.value;
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
  const hasPrev = Array.from(select.options).some((o) => o.value === previous);
  if (hasPrev) {
    select.value = previous;
  } else if (!select.value && cls.students.length) {
    select.value = cls.students[0].id;
  }
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
          <div class="class-title">${cls.className || cls.classId}</div>
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
                  <button class="secondary" data-export-task="${task.id}" data-class="${cls.classId}">匯出連結</button>
                  <button class="danger" data-delete-task="${task.id}" data-class="${cls.classId}">刪除</button>
                </div>
              </div>`;
          })
          .join("")}
        <button class="ghost" data-add-task="${cls.classId}"><span class="small-note light-label">＋ 新增批改任務</span></button>
      </div>
    `;
    list.appendChild(card);
  });
}

function updateGradingHeader() {
  const cls = getCurrentClass();
  const task = getCurrentTask();
  document.getElementById("currentClassLabel").textContent = cls
    ? `${cls.className || cls.classId}`
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
  if (id === "pointModal") {
    pendingPointAspect = null;
    pendingPointLabel = null;
    pendingPointOptions = [];
  }
}

function createClass() {
  const className = document.getElementById("modalClassName").value.trim();
  const size = Number(document.getElementById("modalClassSize").value) || 0;
  if (!className) return alert("請輸入班級名稱。");
  if (classes.some((c) => c.classId === className)) return alert("班級名稱已存在。");
  if (size <= 0) return alert("請輸入正確的人數。");
  const digits = Math.max(2, size.toString().length);
  const students = Array.from({ length: size }, (_, idx) => ({
    id: padNumber(idx + 1, digits),
    name: "",
    secretCode: generateSecretCode(),
  }));
  const cls = { classId: className, className, students, tasks: [], feedbacks: {} };
  classes.push(cls);
  selectedClassId = className;
  selectedTaskId = null;
  saveState(true);
  closeModal("createClassModal");
  refreshAll();
}

function populateEditClassModal() {
  const cls = getCurrentClass();
  if (!cls) return;
  document.getElementById("editClassName").value = cls.className || "";
  renderStudentTable();
  renderSecretViewer();
}

function saveClassBasics() {
  const cls = getCurrentClass();
  if (!cls) return;
  const newName = document.getElementById("editClassName").value.trim();
  if (!newName) {
    document.getElementById("editClassName").value = cls.className;
    return setStatus("班級名稱不可為空。");
  }
  if (newName !== cls.classId && classes.some((c) => c.classId === newName)) {
    setStatus("班級名稱重複，請重新輸入。");
    document.getElementById("editClassName").value = cls.className;
    return;
  }
  cls.classId = newName;
  cls.className = newName;
  selectedClassId = newName;
  saveState(true);
  renderClassList();
  updateGradingHeader();
}

function deleteClass() {
  const cls = getCurrentClass();
  if (!cls) return;
  if (!confirm(`確定刪除 ${cls.className || cls.classId}？所有任務與進度都會移除。`)) return;
  classes = classes.filter((c) => c.classId !== cls.classId);
  if (!classes.length) {
    selectedClassId = null;
    selectedTaskId = null;
  } else {
    selectedClassId = classes[0].classId;
    selectedTaskId = classes[0].tasks[0]?.id || null;
  }
  saveState(true);
  closeModal("editClassModal");
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
  a.download = `${cls.className || cls.classId || "class"}.json`;
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
  const prog = computeTaskProgress(cls, taskId);
  if (prog.percent < 100) {
    const goOn = confirm("仍有未完成學生，確定要匯出嗎？");
    if (!goOn) return;
  }

  const rows = [];
  for (const stu of cls.students) {
    const fb = cls.feedbacks?.[taskId]?.[stu.id];
    if (
      !fb ||
      !aspectList.every((a) => fb[a.key] && fb[a.key].levelLabel && fb[a.key].level !== undefined)
    )
      continue;
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
    rows.push(`<tr><td>${stu.id}</td><td>${stu.name || ""}</td><td><a href="${url}" target="_blank">回饋報告</a></td></tr>`);
  }
  if (!rows.length) return alert("尚無完成的學生可匯出。");
  const win = window.open("", "_blank");
  if (!win) return alert("請允許彈出視窗以匯出 PDF。");
  const title = `${cls.className || cls.classId}｜${task.topic || "批改任務"} 回饋連結`;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    body{font-family:Arial,'Noto Sans TC',sans-serif;padding:16px;}
    h1{font-size:18px;margin-bottom:12px;}
    table{width:100%;border-collapse:collapse;}
    th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:14px;}
    th{background:#f1f5f9;}
  </style></head><body>
  <h1>${title}</h1>
  <table><thead><tr><th>座號</th><th>姓名</th><th>連結</th></tr></thead><tbody>${rows.join("")}</tbody></table>
  <script>window.onload=()=>{setTimeout(()=>{window.print();},150);};</script>
  </body></html>`);
  win.document.close();
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
      if (btn.dataset.tab === "classTab") {
        refreshAll();
      }
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

  document.getElementById("deleteClassBtn").addEventListener("click", deleteClass);

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
    if (e.target.matches("button[data-export-task]")) {
      selectedClassId = e.target.dataset.class;
      selectedTaskId = e.target.dataset.exportTask;
      exportLinks(e.target.dataset.exportTask);
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

  document.getElementById("openNavModal").addEventListener("click", () => {
    renderFloatingNav();
    openModal("navModal");
  });

  document.getElementById("openSecretModal").addEventListener("click", () => {
    renderSecretViewer();
    closeModal("editClassModal");
    openModal("secretModal");
  });
  document.getElementById("closeSecretModal").addEventListener("click", () => {
    closeModal("secretModal");
    populateEditClassModal();
    openModal("editClassModal");
  });

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
      const pointOptions = btn.dataset.points
        .split(",")
        .map((p) => Number(p))
        .filter((n) => !Number.isNaN(n));
      const isActive = btn.classList.contains("active");
      const cls = getCurrentClass();
      const saved = cls?.feedbacks?.[selectedTaskId]?.[document.getElementById("studentSelect").value]?.[aspect];
      if (isActive) {
        setLevelUI(aspect, "", "");
        renderRubricLists(aspect, "", { achieved: [], needsWork: [] });
        saveCurrentFeedback();
        return;
      }
      if (pointOptions.length > 1) {
        openPointPicker(aspect, levelLabel, pointOptions);
        return;
      }
      const pointValue = pointOptions[0] ?? null;
      setLevelUI(aspect, levelLabel, pointValue);
      renderRubricLists(aspect, levelLabel, saved || { achieved: [], needsWork: [] });
      saveCurrentFeedback();
    }
  });

  document.getElementById("pointChoiceContainer").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-point-choice]");
    if (btn) {
      finalizePointSelection(Number(btn.dataset.pointChoice));
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
