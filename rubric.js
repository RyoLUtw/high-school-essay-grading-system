// 評分規準與回饋句庫（繁體中文）
// aspect: content | organization | grammar | lexical
// group: achieved | needsWork

const RUBRIC_ITEMS = {
  // 內容－優 已達成
  "C-A-優-1": { aspect: "content", group: "achieved", text: "已清楚點出主題句並全篇緊扣題意。" },
  "C-A-優-2": { aspect: "content", group: "achieved", text: "能提供多個具體、生活化的例子支持主旨。" },
  "C-A-優-3": { aspect: "content", group: "achieved", text: "有說明原因或結果，而不只是單純列舉事情。" },
  "C-A-優-4": { aspect: "content", group: "achieved", text: "能加入適度的個人感受與觀點，使內容更豐富。" },
  "C-A-優-5": { aspect: "content", group: "achieved", text: "所有段落都與主題高度相關，沒有明顯離題內容。" },
  // 內容－優 待加強
  "C-N-優-1": { aspect: "content", group: "needsWork", text: "個別細節雖相關，但仍可再更具體或生動。" },
  "C-N-優-2": { aspect: "content", group: "needsWork", text: "結論段可再更清楚總結主旨與寫作重點。" },
  "C-N-優-3": { aspect: "content", group: "needsWork", text: "少數句子內容重複，可刪減或合併以更精簡。" },
  "C-N-優-4": { aspect: "content", group: "needsWork", text: "例子多集中在單一面向，可補充不同角度的說明。" },
  "C-N-優-5": { aspect: "content", group: "needsWork", text: "尚未明確點出內容對讀者的啟示或收穫。" },
  // 內容－可 已達成
  "C-A-可-1": { aspect: "content", group: "achieved", text: "大致能看出文章的主題方向。" },
  "C-A-可-2": { aspect: "content", group: "achieved", text: "至少有一至兩個與主題相關的具體例子。" },
  "C-A-可-3": { aspect: "content", group: "achieved", text: "能簡單說明自己的立場或感受。" },
  "C-A-可-4": { aspect: "content", group: "achieved", text: "大部分句子與題目有關，沒有完全偏題。" },
  "C-A-可-5": { aspect: "content", group: "achieved", text: "能寫出基本的開頭與結尾來框住主題。" },
  // 內容－可 待加強
  "C-N-可-1": { aspect: "content", group: "needsWork", text: "主題句不夠明顯，讀者需要猜才能理解重點。" },
  "C-N-可-2": { aspect: "content", group: "needsWork", text: "有些細節與主題關係不大，造成內容鬆散。" },
  "C-N-可-3": { aspect: "content", group: "needsWork", text: "相關例子發展不夠完整，說到一半就結束。" },
  "C-N-可-4": { aspect: "content", group: "needsWork", text: "缺少對例子的解釋，無法看出和主題的連結。" },
  "C-N-可-5": { aspect: "content", group: "needsWork", text: "結尾未能回扣主題，整體重點感較弱。" },
  // 內容－差 已達成
  "C-A-差-1": { aspect: "content", group: "achieved", text: "文章中可略為看出與題目相關的想法。" },
  "C-A-差-2": { aspect: "content", group: "achieved", text: "部分句子有嘗試提到題目要求的情境或人物。" },
  "C-A-差-3": { aspect: "content", group: "achieved", text: "雖然不完整，但能寫出少量與主題相符的訊息。" },
  "C-A-差-4": { aspect: "content", group: "achieved", text: "能看出學生有想表達某種經驗或意見。" },
  "C-A-差-5": { aspect: "content", group: "achieved", text: "內容長度勉強達到最基本要求。" },
  // 內容－差 待加強
  "C-N-差-1": { aspect: "content", group: "needsWork", text: "主題不清楚，讀者難以理解文章在談什麼。" },
  "C-N-差-2": { aspect: "content", group: "needsWork", text: "大部分內容與題目無直接關聯或只停留在表面。" },
  "C-N-差-3": { aspect: "content", group: "needsWork", text: "細節零散、跳躍，無法形成完整的描寫或說明。" },
  "C-N-差-4": { aspect: "content", group: "needsWork", text: "常出現與主題無關的閒聊式句子。" },
  "C-N-差-5": { aspect: "content", group: "needsWork", text: "欠缺關鍵資訊導致內容空洞（時間、地點、原因等）。" },
  // 內容－劣 已達成
  "C-A-劣-1": { aspect: "content", group: "achieved", text: "有少量字詞與題目中的關鍵字相近。" },
  "C-A-劣-2": { aspect: "content", group: "achieved", text: "似乎有嘗試書寫個人經驗或想法。" },
  "C-A-劣-3": { aspect: "content", group: "achieved", text: "能看出學生曾經閱讀題目並作出反應。" },
  "C-A-劣-4": { aspect: "content", group: "achieved", text: "文章中至少出現一個完整句子。" },
  "C-A-劣-5": { aspect: "content", group: "achieved", text: "有基本的寫作意圖，而非完全留白。" },
  // 內容－劣 待加強
  "C-N-劣-1": { aspect: "content", group: "needsWork", text: "文意完全不對題或幾乎與題目無關。" },
  "C-N-劣-2": { aspect: "content", group: "needsWork", text: "缺乏任何可辨識的主題或重點。" },
  "C-N-劣-3": { aspect: "content", group: "needsWork", text: "大部分內容為抄寫題目或無意義的字串。" },
  "C-N-劣-4": { aspect: "content", group: "needsWork", text: "內容過於簡略，無法評估學生真正想法。" },
  "C-N-劣-5": { aspect: "content", group: "needsWork", text: "需要重新閱讀題目並依指示完整作答。" },

  // 組織－優 已達成
  "O-A-優-1": { aspect: "organization", group: "achieved", text: "有清楚的開頭，介紹背景與主題。" },
  "O-A-優-2": { aspect: "organization", group: "achieved", text: "中間段落依順序發展，重點安排合理。" },
  "O-A-優-3": { aspect: "organization", group: "achieved", text: "結尾段能總結全文並回扣主題。" },
  "O-A-優-4": { aspect: "organization", group: "achieved", text: "段與段之間使用轉承語，使內容銜接順暢。" },
  "O-A-優-5": { aspect: "organization", group: "achieved", text: "各段落長度與功能分配適當，不會頭重腳輕。" },
  // 組織－優 待加強
  "O-N-優-1": { aspect: "organization", group: "needsWork", text: "個別段落內的句子順序仍可再調整得更自然。" },
  "O-N-優-2": { aspect: "organization", group: "needsWork", text: "轉折處可加入更多提示語，幫助讀者跟上思路。" },
  "O-N-優-3": { aspect: "organization", group: "needsWork", text: "結尾雖有總結，但可以更有力地收束全文。" },
  "O-N-優-4": { aspect: "organization", group: "needsWork", text: "部分訊息可再分段，避免單一段落過長。" },
  "O-N-優-5": { aspect: "organization", group: "needsWork", text: "可再刻意安排一兩句主旨句讓組織更醒目。" },
  // 組織－可 已達成
  "O-A-可-1": { aspect: "organization", group: "achieved", text: "大致可以看出文章有開頭、發展與結尾。" },
  "O-A-可-2": { aspect: "organization", group: "achieved", text: "多數內容依時間或事件順序排列。" },
  "O-A-可-3": { aspect: "organization", group: "achieved", text: "偶爾使用「首先、然後、最後」等基本轉承語。" },
  "O-A-可-4": { aspect: "organization", group: "achieved", text: "同一主題的句子大多集中在同一段落。" },
  "O-A-可-5": { aspect: "organization", group: "achieved", text: "讀者雖感略顯雜亂，但仍能追蹤主要流程。" },
  // 組織－可 待加強
  "O-N-可-1": { aspect: "organization", group: "needsWork", text: "開頭未清楚交代背景或主題，引入略顯突兀。" },
  "O-N-可-2": { aspect: "organization", group: "needsWork", text: "中間段落的重點比例失衡，有的太短有的太長。" },
  "O-N-可-3": { aspect: "organization", group: "needsWork", text: "段落之間缺乏轉承語，跳接感明顯。" },
  "O-N-可-4": { aspect: "organization", group: "needsWork", text: "有些內容出現重複或位置不當，需要重新分配。" },
  "O-N-可-5": { aspect: "organization", group: "needsWork", text: "結尾過於突然，沒有好好收尾或呼應開頭。" },
  // 組織－差 已達成
  "O-A-差-1": { aspect: "organization", group: "achieved", text: "文章中勉強可辨識出一個主要事件或情節。" },
  "O-A-差-2": { aspect: "organization", group: "achieved", text: "個別句子之間偶爾有連貫感。" },
  "O-A-差-3": { aspect: "organization", group: "achieved", text: "有嘗試分段，即使分段理由不明確。" },
  "O-A-差-4": { aspect: "organization", group: "achieved", text: "部分內容依照時間或事件先後排列。" },
  "O-A-差-5": { aspect: "organization", group: "achieved", text: "能看出學生有想說故事或說明的企圖。" },
  // 組織－差 待加強
  "O-N-差-1": { aspect: "organization", group: "needsWork", text: "全文重點模糊，很難分辨哪裡是開頭、中間或結尾。" },
  "O-N-差-2": { aspect: "organization", group: "needsWork", text: "句子順序跳躍，讀者需要不斷回頭理解。" },
  "O-N-差-3": { aspect: "organization", group: "needsWork", text: "相關訊息被拆散在不同地方，缺乏統整。" },
  "O-N-差-4": { aspect: "organization", group: "needsWork", text: "幾乎沒有使用任何轉承語，段落之間斷裂感強。" },
  "O-N-差-5": { aspect: "organization", group: "needsWork", text: "結尾沒有為整篇文章帶來收束或結論。" },
  // 組織－劣 已達成
  "O-A-劣-1": { aspect: "organization", group: "achieved", text: "文中至少有一組連續的句子談到同一件事。" },
  "O-A-劣-2": { aspect: "organization", group: "achieved", text: "有少量試圖分段或換行的痕跡。" },
  "O-A-劣-3": { aspect: "organization", group: "achieved", text: "可以看出學生寫作時曾努力延伸幾句內容。" },
  "O-A-劣-4": { aspect: "organization", group: "achieved", text: "文章並非全篇單一句重複。" },
  "O-A-劣-5": { aspect: "organization", group: "achieved", text: "願意嘗試開始與結束，而非只寫單一句。" },
  // 組織－劣 待加強
  "O-N-劣-1": { aspect: "organization", group: "needsWork", text: "缺乏基本段落概念，全文呈現零散句子堆疊。" },
  "O-N-劣-2": { aspect: "organization", group: "needsWork", text: "完全看不出先後順序或邏輯關係。" },
  "O-N-劣-3": { aspect: "organization", group: "needsWork", text: "未依題目提示的結構來組織內容。" },
  "O-N-劣-4": { aspect: "organization", group: "needsWork", text: "重複抄寫同一句或同一詞語，而非真正發展段落。" },
  "O-N-劣-5": { aspect: "organization", group: "needsWork", text: "需要學習最基本的三段式寫作：開頭、發展、結尾。" },

  // 文法句構－優 已達成
  "G-A-優-1": { aspect: "grammar", group: "achieved", text: "句子多數文法正確，僅偶有小錯誤。" },
  "G-A-優-2": { aspect: "grammar", group: "achieved", text: "能運用多種句型表達意思。" },
  "G-A-優-3": { aspect: "grammar", group: "achieved", text: "主詞與動詞一致性良好。" },
  "G-A-優-4": { aspect: "grammar", group: "achieved", text: "時態使用大致一致且符合情境。" },
  "G-A-優-5": { aspect: "grammar", group: "achieved", text: "標點符號使用恰當，幫助理解句子結構。" },
  // 文法句構－優 待加強
  "G-N-優-1": { aspect: "grammar", group: "needsWork", text: "個別複雜句仍有細微文法問題，可再精修。" },
  "G-N-優-2": { aspect: "grammar", group: "needsWork", text: "時態切換處可再檢查，避免不必要的變化。" },
  "G-N-優-3": { aspect: "grammar", group: "needsWork", text: "部分句子過長，可拆成兩句以提升清楚度。" },
  "G-N-優-4": { aspect: "grammar", group: "needsWork", text: "偶爾出現中英結構干擾，語序略顯中文式。" },
  "G-N-優-5": { aspect: "grammar", group: "needsWork", text: "可再嘗試使用更多不同開頭或連接詞，增加句構變化。" },
  // 文法句構－可 已達成
  "G-A-可-1": { aspect: "grammar", group: "achieved", text: "大多數簡單句的文法是正確的。" },
  "G-A-可-2": { aspect: "grammar", group: "achieved", text: "即使有文法錯誤，讀者仍能大致理解意思。" },
  "G-A-可-3": { aspect: "grammar", group: "achieved", text: "偶爾會使用連接詞連結兩個句子。" },
  "G-A-可-4": { aspect: "grammar", group: "achieved", text: "已能正確使用一些基本時態。" },
  "G-A-可-5": { aspect: "grammar", group: "achieved", text: "標點符號雖不完美，但不會造成嚴重誤解。" },
  // 文法句構－可 待加強
  "G-N-可-1": { aspect: "grammar", group: "needsWork", text: "主詞與動詞常出現數量不一致的情況。" },
  "G-N-可-2": { aspect: "grammar", group: "needsWork", text: "複合句結構不穩定，容易缺少主詞或動詞。" },
  "G-N-可-3": { aspect: "grammar", group: "needsWork", text: "有些句子直接照中文語序翻譯，英文結構不自然。" },
  "G-N-可-4": { aspect: "grammar", group: "needsWork", text: "時態混用影響閱讀流暢度。" },
  "G-N-可-5": { aspect: "grammar", group: "needsWork", text: "標點使用較隨意，句子邊界不清楚。" },
  // 文法句構－差 已達成
  "G-A-差-1": { aspect: "grammar", group: "achieved", text: "偶爾能寫出文法較正確的簡單句。" },
  "G-A-差-2": { aspect: "grammar", group: "achieved", text: "個別句子仍能傳達大致意思。" },
  "G-A-差-3": { aspect: "grammar", group: "achieved", text: "能看出學生嘗試用英文完整表達一個想法。" },
  "G-A-差-4": { aspect: "grammar", group: "achieved", text: "偶爾使用主詞＋動詞的基本句型。" },
  "G-A-差-5": { aspect: "grammar", group: "achieved", text: "有有限度地使用代名詞或連接詞。" },
  // 文法句構－差 待加強
  "G-N-差-1": { aspect: "grammar", group: "needsWork", text: "文法錯誤頻繁，讀者需要猜測句意。" },
  "G-N-差-2": { aspect: "grammar", group: "needsWork", text: "常缺少主詞、動詞或受詞，句子不完整。" },
  "G-N-差-3": { aspect: "grammar", group: "needsWork", text: "結構混亂，常把多個想法塞在一個句子裡。" },
  "G-N-差-4": { aspect: "grammar", group: "needsWork", text: "時態、單複數、人稱代名詞等使用錯誤明顯。" },
  "G-N-差-5": { aspect: "grammar", group: "needsWork", text: "標點使用不當，難以分辨句子分界。" },
  // 文法句構－劣 已達成
  "G-A-劣-1": { aspect: "grammar", group: "achieved", text: "能看出少數英文字組合成一句話的嘗試。" },
  "G-A-劣-2": { aspect: "grammar", group: "achieved", text: "有時能正確拼出常見的 be 動詞或代名詞。" },
  "G-A-劣-3": { aspect: "grammar", group: "achieved", text: "句子雖不完整，但仍帶有部分英文句型影子。" },
  "G-A-劣-4": { aspect: "grammar", group: "achieved", text: "願意使用英文而非完全以中文書寫。" },
  "G-A-劣-5": { aspect: "grammar", group: "achieved", text: "內容不是完全由單一字母或亂碼組成。" },
  // 文法句構－劣 待加強
  "G-N-劣-1": { aspect: "grammar", group: "needsWork", text: "文法錯誤嚴重，幾乎無法理解句子意思。" },
  "G-N-劣-2": { aspect: "grammar", group: "needsWork", text: "多數句子只是字詞堆疊，缺乏結構。" },
  "G-N-劣-3": { aspect: "grammar", group: "needsWork", text: "無法辨識時態、主詞、動詞等基本句子成分。" },
  "G-N-劣-4": { aspect: "grammar", group: "needsWork", text: "中英文夾雜嚴重，難以判斷要表達的語言。" },
  "G-N-劣-5": { aspect: "grammar", group: "needsWork", text: "建議重新練習簡單句型，再逐步延伸。" },

  // 字彙拼字－優 已達成
  "L-A-優-1": { aspect: "lexical", group: "achieved", text: "能選用貼切且精準的字詞表達意思。" },
  "L-A-優-2": { aspect: "lexical", group: "achieved", text: "適度使用較高階或主題相關的字彙。" },
  "L-A-優-3": { aspect: "lexical", group: "achieved", text: "同一字詞不會過度重複，能有變化。" },
  "L-A-優-4": { aspect: "lexical", group: "achieved", text: "拼字大致正確，僅有少數小錯誤。" },
  "L-A-優-5": { aspect: "lexical", group: "achieved", text: "大小寫使用得宜，專有名詞能正確大寫。" },
  // 字彙拼字－優 待加強
  "L-N-優-1": { aspect: "lexical", group: "needsWork", text: "個別用字略顯口語，可再尋找更正式的表達。" },
  "L-N-優-2": { aspect: "lexical", group: "needsWork", text: "某些好字詞只出現一次，可增加使用次數強化印象。" },
  "L-N-優-3": { aspect: "lexical", group: "needsWork", text: "少數拼字接近正確，可再多加注意字母順序。" },
  "L-N-優-4": { aspect: "lexical", group: "needsWork", text: "有時仍會忘記句首與專有名詞的大寫規則。" },
  "L-N-優-5": { aspect: "lexical", group: "needsWork", text: "可再嘗試使用一些同義字，讓語氣更豐富。" },
  // 字彙拼字－可 已達成
  "L-A-可-1": { aspect: "lexical", group: "achieved", text: "大部分時候能用基本字詞把意思說清楚。" },
  "L-A-可-2": { aspect: "lexical", group: "achieved", text: "雖然字彙較簡單，但大多與主題相符。" },
  "L-A-可-3": { aspect: "lexical", group: "achieved", text: "偶爾會嘗試使用較不常見的新字。" },
  "L-A-可-4": { aspect: "lexical", group: "achieved", text: "拼字錯誤雖有，仍不至於造成嚴重誤解。" },
  "L-A-可-5": { aspect: "lexical", group: "achieved", text: "大小寫錯誤不多，讀者仍能分辨句子與專有名詞。" },
  // 字彙拼字－可 待加強
  "L-N-可-1": { aspect: "lexical", group: "needsWork", text: "字詞使用較單調，常重複同一個簡單字。" },
  "L-N-可-2": { aspect: "lexical", group: "needsWork", text: "有時選錯字，導致意思與原意不同。" },
  "L-N-可-3": { aspect: "lexical", group: "needsWork", text: "某些常見字仍常拼錯，需要再熟練。" },
  "L-N-可-4": { aspect: "lexical", group: "needsWork", text: "大小寫規則不穩定，專有名詞時常漏大寫。" },
  "L-N-可-5": { aspect: "lexical", group: "needsWork", text: "部分字彙與中文意思過度對應，英語用法不自然。" },
  // 字彙拼字－差 已達成
  "L-A-差-1": { aspect: "lexical", group: "achieved", text: "能使用少量關鍵字讓人猜到主題。" },
  "L-A-差-2": { aspect: "lexical", group: "achieved", text: "部分單字拼寫接近正確。" },
  "L-A-差-3": { aspect: "lexical", group: "achieved", text: "有嘗試寫出超過課本範圍的字彙。" },
  "L-A-差-4": { aspect: "lexical", group: "achieved", text: "少量句子中，用字與文意仍勉強搭配。" },
  "L-A-差-5": { aspect: "lexical", group: "achieved", text: "能看出學生在有限字彙下努力表達。" },
  // 字彙拼字－差 待加強
  "L-N-差-1": { aspect: "lexical", group: "needsWork", text: "用字常常不恰當，甚至與想表達的意思相反。" },
  "L-N-差-2": { aspect: "lexical", group: "needsWork", text: "拼字錯誤頻繁，妨礙讀者理解。" },
  "L-N-差-3": { aspect: "lexical", group: "needsWork", text: "過度依賴少數單字，整篇文章重複同一詞。" },
  "L-N-差-4": { aspect: "lexical", group: "needsWork", text: "大小寫錯誤多，句首與專有名詞常混亂。" },
  "L-N-差-5": { aspect: "lexical", group: "needsWork", text: "需要加強字彙量與基本拼字規則的練習。" },
  // 字彙拼字－劣 已達成
  "L-A-劣-1": { aspect: "lexical", group: "achieved", text: "能寫出與題目相關的少量英文字或片語。" },
  "L-A-劣-2": { aspect: "lexical", group: "achieved", text: "有嘗試拼寫單字，而非完全留白。" },
  "L-A-劣-3": { aspect: "lexical", group: "achieved", text: "部分字母順序接近正確單字。" },
  "L-A-劣-4": { aspect: "lexical", group: "achieved", text: "個別字詞可以看出學生大致想表達的方向。" },
  "L-A-劣-5": { aspect: "lexical", group: "achieved", text: "願意動筆練習英文，而非完全放棄作答。" },
  // 字彙拼字－劣 待加強
  "L-N-劣-1": { aspect: "lexical", group: "needsWork", text: "內容多為零碎字詞，無法形成完整句子。" },
  "L-N-劣-2": { aspect: "lexical", group: "needsWork", text: "拼字錯誤嚴重，幾乎無法辨識原本要寫的字。" },
  "L-N-劣-3": { aspect: "lexical", group: "needsWork", text: "大部分文字可能為抄寫題目或他人內容。" },
  "L-N-劣-4": { aspect: "lexical", group: "needsWork", text: "缺乏足夠字彙，難以表達任何具體想法。" },
  "L-N-劣-5": { aspect: "lexical", group: "needsWork", text: "建議從高頻字與基本拼字訓練重新累積基礎。" },
};

function getRubricByAspect(aspect, group) {
  return Object.values(RUBRIC_ITEMS).filter((item) => item.aspect === aspect && item.group === group);
}

// 將 key 寫回物件，方便 UI 使用
for (const [id, item] of Object.entries(RUBRIC_ITEMS)) {
  item.id = id;
}
