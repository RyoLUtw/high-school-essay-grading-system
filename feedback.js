async function computeHash(classId, studentId, secretCode) {
  const data = `${classId}|${studentId}|${secretCode}`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function decodePayload(encoded) {
  const jsonString = decodeURIComponent(atob(encoded));
  return JSON.parse(jsonString);
}

function renderLocked(payload) {
  const meta = document.getElementById("lockedMeta");
  meta.textContent = `班級：${payload.classId} ｜ 座號：${payload.studentId} ｜ 作文：${payload.essayId}`;
}

function renderAspect(aspectKey, aspectData) {
  const container = document.createElement("div");
  container.className = "feedback-card";
  const titleMap = {
    content: "內容",
    organization: "組織",
    grammar: "文法句構",
    lexical: "字彙拼字",
  };
  const achievedTexts = aspectData.achieved.map((id) => RUBRIC_ITEMS[id]?.text || id);
  const needsTexts = aspectData.needsWork.map((id) => RUBRIC_ITEMS[id]?.text || id);
  if (aspectData.customAchieved) achievedTexts.push(...aspectData.customAchieved);
  if (aspectData.customNeedsWork) needsTexts.push(...aspectData.customNeedsWork);

  container.innerHTML = `
    <h3>${titleMap[aspectKey]} <span class="badge">等級 ${aspectData.level}</span></h3>
    <div class="grid-2">
      <div>
        <h4>做得好的地方</h4>
        <ul>${achievedTexts.map((t) => `<li>${t}</li>`).join("") || "<li>（未填寫）</li>"}</ul>
      </div>
      <div>
        <h4>可以再加強</h4>
        <ul>${needsTexts.map((t) => `<li>${t}</li>`).join("") || "<li>（未填寫）</li>"}</ul>
      </div>
    </div>
  `;
  return container;
}

function renderFeedback(payload) {
  const view = document.getElementById("feedbackView");
  view.innerHTML = "";
  const header = document.createElement("div");
  header.className = "feedback-card";
  header.innerHTML = `
    <h2>作文回饋</h2>
    <p>班級：${payload.classId} ｜ 座號：${payload.studentId} ｜ 作文：${payload.essayId}</p>
    ${payload.overallComment ? `<p><strong>整體總評：</strong>${payload.overallComment}</p>` : ""}
  `;
  view.appendChild(header);

  Object.entries(payload.aspects).forEach(([key, data]) => {
    view.appendChild(renderAspect(key, data));
  });

  const actions = document.createElement("div");
  actions.className = "feedback-card";
  actions.innerHTML = `
    <h3>下一步</h3>
    <label class="small-note">寫下你下次想努力的方向（不會被儲存）：</label>
    <textarea placeholder="例：多檢查主詞動詞一致、結尾加入呼應句"></textarea>
    <div style="margin-top:0.5rem;">
      <button id="printBtn">列印 / 另存 PDF</button>
    </div>
  `;
  view.appendChild(actions);

  document.getElementById("lockedView").style.display = "none";
  view.style.display = "block";

  document.getElementById("printBtn").addEventListener("click", () => window.print());
}

function showError(msg) {
  const el = document.getElementById("errorMsg");
  el.textContent = msg;
}

function init() {
  const params = new URLSearchParams(location.search);
  const encoded = params.get("p");
  const hash = params.get("h");
  if (!encoded || !hash) {
    document.getElementById("lockedMeta").textContent = "連結有誤，缺少必要參數。";
    document.getElementById("unlockBtn").disabled = true;
    return;
  }
  let payload;
  try {
    payload = decodePayload(encoded);
  } catch (err) {
    document.getElementById("lockedMeta").textContent = "無法解析連結內容。";
    document.getElementById("unlockBtn").disabled = true;
    return;
  }
  renderLocked(payload);

  document.getElementById("unlockBtn").addEventListener("click", async () => {
    showError("");
    const code = document.getElementById("codeInput").value.trim();
    const computed = await computeHash(payload.classId, payload.studentId, code);
    if (computed === hash) {
      renderFeedback(payload);
    } else {
      showError("密碼錯誤，請再試一次。");
    }
  });
}

init();
