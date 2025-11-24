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
  meta.textContent = `班級：${payload.classId} ｜ 座號：${payload.studentId} ｜ 作文：${payload.taskTopic || "未命名"}`;
}

function levelRange(level) {
  const low = (Number(level || 0) - 0.5).toFixed(1);
  const high = (Number(level || 0) + 0.5).toFixed(1);
  return `${low} ~ ${high}`;
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

  container.innerHTML = `
    <h3>${titleMap[aspectKey]} <span class="badge">等級 ${aspectData.level}（範圍 ${levelRange(aspectData.level)}）</span></h3>
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
  return { container, achievedTexts, needsTexts };
}

function buildAIPrompt(payload, collected) {
  const parts = Object.entries(payload.aspects).map(([key], idx) => {
    const data = collected[key];
    return `${idx + 1}. ${data.label}\n已達成：${data.achieved.join("；") || "無"}\n待加強：${data.needs.join("；") || "無"}`;
  });
  return `這篇是關於我的作文的建議和回饋，請幫我找出作文中哪幾句話是符合「已達成」的項目，以及哪幾句話符合「待加強」，並且建議我應該如何更改句子。\n${parts.join("\n\n")}`;
}

function renderFeedback(payload) {
  const view = document.getElementById("feedbackView");
  view.innerHTML = "";
  const header = document.createElement("div");
  header.className = "feedback-card";
  header.innerHTML = `
    <h2>作文回饋</h2>
    <p>班級：${payload.classId} ｜ 座號：${payload.studentId}</p>
    <p>主題：${payload.taskTopic || "未命名"}${payload.taskDate ? ` ｜ 日期：${payload.taskDate}` : ""}</p>
    ${payload.taskNote ? `<p class="small-note">教師備註：${payload.taskNote}</p>` : ""}
  `;
  view.appendChild(header);

  const collected = {};
  let totalLevel = 0;
  Object.entries(payload.aspects).forEach(([key, data]) => {
    const { container, achievedTexts, needsTexts } = renderAspect(key, data);
    collected[key] = { label: container.querySelector("h3").textContent.split(" ")[0], achieved: achievedTexts, needs: needsTexts };
    totalLevel += Number(data.level || 0);
    view.appendChild(container);
  });

  const totalCard = document.createElement("div");
  totalCard.className = "feedback-card";
  const totalLow = (totalLevel - 2).toFixed(1);
  const totalHigh = (totalLevel + 2).toFixed(1);
  totalCard.innerHTML = `
    <h3>整體表現範圍</h3>
    <p>四項等級總和範圍：${totalLow} ~ ${totalHigh}</p>
    <label class="small-note">寫下你下次想努力的方向（不會被儲存）：</label>
    <textarea placeholder="例：多檢查主詞動詞一致、結尾加入呼應句"></textarea>
    <div style="margin-top:0.5rem;">
      <button id="printBtn">列印 / 另存 PDF</button>
    </div>
  `;
  view.appendChild(totalCard);

  const aiCard = document.createElement("div");
  aiCard.className = "feedback-card";
  const promptText = buildAIPrompt(payload, collected);
  aiCard.innerHTML = `
    <h3>AI 協作提示</h3>
    <p class="small-note">可貼上至生成式 AI，協助找出對應句子並改寫。</p>
    <textarea id="aiPrompt" readonly>${promptText}</textarea>
    <button class="secondary" id="copyPromptBtn">複製提示</button>
  `;
  view.appendChild(aiCard);

  document.getElementById("lockedView").style.display = "none";
  view.style.display = "block";

  document.getElementById("printBtn").addEventListener("click", () => window.print());
  document.getElementById("copyPromptBtn").addEventListener("click", () => {
    const input = document.getElementById("aiPrompt");
    input.select();
    document.execCommand("copy");
  });
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
  if (!payload.classId || !payload.studentId || !payload.aspects) {
    document.getElementById("lockedMeta").textContent = "連結資訊不完整。";
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
