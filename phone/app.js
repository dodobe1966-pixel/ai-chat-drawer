"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const sources = {
  chatgpt: "ChatGPT", claude: "Claude Code", gemini: "Gemini", codex: "Codex", other: "기타",
};
const icons = {
  library: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m4-11h4m-4 4h4"/>',
  all: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  search: '<circle cx="10.7" cy="10.7" r="6.2"/><path d="m15.3 15.3 4.2 4.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  computer: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  upload: '<path d="M12 16V4m-4 4 4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  download: '<path d="M12 4v12m-4-4 4 4 4-4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/>',
  shield: '<path d="M12 22s7-3 7-9V6l-7-3-7 3v7c0 6 7 9 7 9Z"/><path d="m9 12 2 2 4-4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  chat: '<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2V11.5A7.5 7.5 0 0 1 10.5 4h2a7.5 7.5 0 0 1 7.5 7.5Z"/><path d="M8 10h7m-7 4h5"/>',
  paste: '<rect x="5" y="6" width="14" height="15" rx="2"/><rect x="9" y="3" width="6" height="5" rx="1"/><path d="M9 12h6m-6 4h6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  edit: '<path d="m14 6 4 4M4 20l4-1L20 7a2.8 2.8 0 1 0-4-4L4 15l-1 5Z"/>',
  // 왼쪽 메뉴: AI 서비스마다 같은 굵기의 테두리 아이콘(상표 그림은 쓰지 않음)
  bubble: '<path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.6A7.5 7.5 0 1 1 20 11.5Z"/>',
  terminal: '<rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="m7.5 10 2.5 2.2-2.5 2.3M12.5 15h4"/>',
  spark: '<path d="M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8Z"/>',
  code: '<path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.3 5.5l-2.6 13"/>',
  dots: '<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
  chev: '<path d="m7 10 5 5 5-5"/>',
  check: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12.2 2.4 2.4 4.8-5"/>',
  trash: '<path d="M4 7h16M9 7V4.8c0-.4.4-.8.8-.8h4.4c.4 0 .8.4.8.8V7M6.5 7l.8 12.2c.1.9.8 1.8 1.8 1.8h5.8c1 0 1.7-.9 1.8-1.8L17.5 7M10 11v6M14 11v6"/>',
  drawer: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/><path d="m15.5 10-2 2 2 2"/>',
};
const sourceIcons = { chatgpt: "bubble", claude: "terminal", gemini: "spark", codex: "code", other: "dots" };

// 많이 쓰는 AI 100 (1~46위: a16z「Top 100 Gen AI Consumer Apps」6판(2026년 1월 자료) 웹 순위, Similarweb 순방문자 기준. 성인용 대화앱 4곳은 뺌.
// 47~50: 이 앱이 자동으로 읽는 코딩 AI 3개와 Microsoft Copilot. 51~82: 같은 6판 모바일 순위(Sensor Tower 월 사용자)에서 겹치는 것·브라우저·배달앱을 뺀 것.
// 83~100: 순위표 밖이지만 많이 쓰는 AI(한국 서비스·코딩 도구) 보충). 기록은 원래 분류(source) + 서비스 이름(service)으로 남긴다.
const serviceGroups = {
  chat: "대화형 AI", write: "글쓰기·공부", search: "검색·에이전트", image: "그림·사진",
  media: "영상·음악·음성", code: "코딩·개발", character: "캐릭터 대화",
};
const aiServices = [
  ["chatgpt", "ChatGPT", "chat", "chatgpt", "web"], ["gemini", "Gemini", "chat", "gemini", "web"],
  ["canva", "Canva", "image"], ["deepseek", "DeepSeek", "chat"], ["grok", "Grok", "chat"],
  ["claude-web", "Claude", "chat", "claude", "web"], ["character-ai", "Character.AI", "character"],
  ["perplexity", "Perplexity", "search"], ["notion", "Notion AI", "write"], ["ai-studio", "Google AI Studio", "code", "gemini"],
  ["freepik", "Freepik", "image"], ["doubao", "Doubao (豆包)", "chat"], ["janitor", "JanitorAI", "character"],
  ["quark", "Quark (夸克)", "search"], ["suno", "Suno", "media"], ["removebg", "remove.bg", "image"],
  ["capcut", "CapCut", "media"], ["grammarly", "Grammarly", "write"], ["quillbot", "QuillBot", "write"],
  ["lovable", "Lovable", "code"], ["polybuzz", "PolyBuzz", "character"], ["kimi", "Kimi", "chat"],
  ["google-labs", "Google Labs", "search", "gemini"], ["qwen", "Qwen", "chat"], ["turboscribe", "TurboScribe", "media"],
  ["gamma", "Gamma", "write"], ["elevenlabs", "ElevenLabs", "media"], ["notebooklm", "NotebookLM", "write", "gemini"],
  ["lmarena", "LMArena", "chat"], ["seaart", "SeaArt", "image"], ["huggingface", "Hugging Face", "code"],
  ["meta-ai", "Meta AI", "chat"], ["photoroom", "Photoroom", "image"], ["pixelcut", "Pixelcut", "image"],
  ["adot", "에이닷 (A.)", "chat"], ["higgsfield", "Higgsfield", "media"], ["cursor", "Cursor", "code"],
  ["civitai", "Civitai", "image"], ["midjourney", "Midjourney", "image"], ["manus", "Manus", "search"],
  ["kling", "Kling AI", "media"], ["veed", "VEED", "media"], ["genspark", "Genspark", "search"],
  ["gigachat", "GigaChat", "chat"], ["poe", "Poe", "chat"], ["cutout", "Cutout.pro", "image"],
  ["claude", "Claude Code", "code", "claude", "auto"], ["codex", "OpenAI Codex", "code", "codex", "auto"],
  ["gemini-cli", "Gemini CLI", "code", "gemini", "auto"], ["copilot", "Microsoft Copilot", "chat"],
  ["ai-gallery", "AI Gallery", "image"], ["picsart", "Picsart", "image"], ["remini", "Remini", "image"], ["cici", "Cici", "chat"],
  ["lightroom", "Adobe Lightroom", "image"], ["baidu-ai", "Baidu AI Search", "search"], ["vn", "VN Video Editor", "media"], ["edits", "Edits", "media"],
  ["meitu", "Meitu", "image"], ["hypic", "Hypic", "image"], ["seekee", "Seekee", "search"], ["photomath", "Photomath", "write"],
  ["gauth", "Gauth", "write"], ["learna", "Learna AI", "write"], ["wink", "Wink", "media"], ["facemoji", "Facemoji", "write"],
  ["bing", "Microsoft Bing", "search"], ["faceapp", "FaceApp", "image"], ["nova", "NOVA", "chat"], ["youcut", "YouCut", "media"],
  ["polish", "Polish", "image"], ["b612", "B612", "image"], ["pixverse", "PixVerse", "media"], ["hi-translate", "Hi Translate", "write"],
  ["beautycam", "BeautyCam", "image"], ["papago", "파파고 (Papago)", "write"], ["brainly", "Brainly", "write"], ["ai-mirror", "AI Mirror", "image"],
  ["mivi", "MIVI", "media"], ["snow", "SNOW", "image"], ["vivacut", "VivaCut", "media"], ["beautyplus", "BeautyPlus", "image"],
  ["wrtn", "뤼튼 (wrtn)", "chat"], ["liner", "라이너 (Liner)", "search"], ["clova-note", "클로바노트", "media"], ["zeta", "제타 (zeta)", "character"],
  ["le-chat", "Mistral Le Chat", "chat"], ["venice", "Venice", "chat"], ["openevidence", "OpenEvidence", "search"], ["deepl", "DeepL", "write"],
  ["figma", "Figma AI", "image"], ["leonardo", "Leonardo.Ai", "image"], ["ideogram", "Ideogram", "image"], ["runway", "Runway", "media"],
  ["github-copilot", "GitHub Copilot", "code"], ["windsurf", "Windsurf", "code"], ["replit", "Replit", "code"], ["v0", "v0", "code"],
  ["bolt", "Bolt", "code"], ["base44", "Base44", "code"],
].map(([id, name, group, source = "other", method = "paste"], index) => ({ rank: index + 1, id, name, group, source, method }));
const serviceById = new Map(aiServices.map(service => [service.id, service]));
// 웹 주소로 쓰는 AI 를 알아보는 표(확장프로그램\content.js 의 DOMAINS 와 같다). 확장이 이 주소에 들어간 것을 보면 「내가 쓰는 AI」로 저절로 고른다
const serviceDomains = {
  "chatgpt": ["chatgpt.com", "chat.openai.com"], "gemini": ["gemini.google.com"], "canva": ["canva.com"], "deepseek": ["chat.deepseek.com"],
  "grok": ["grok.com"], "claude-web": ["claude.ai"], "character-ai": ["character.ai"], "perplexity": ["perplexity.ai"],
  "notion": ["notion.so", "notion.com"], "ai-studio": ["aistudio.google.com"], "freepik": ["freepik.com"], "doubao": ["doubao.com"],
  "janitor": ["janitorai.com"], "quark": ["quark.cn"], "suno": ["suno.com"], "removebg": ["remove.bg"],
  "capcut": ["capcut.com"], "grammarly": ["grammarly.com"], "quillbot": ["quillbot.com"], "lovable": ["lovable.dev"],
  "polybuzz": ["polybuzz.ai"], "kimi": ["kimi.com", "kimi.moonshot.cn"], "google-labs": ["labs.google"], "qwen": ["chat.qwen.ai"],
  "turboscribe": ["turboscribe.ai"], "gamma": ["gamma.app"], "elevenlabs": ["elevenlabs.io"], "notebooklm": ["notebooklm.google.com"],
  "lmarena": ["lmarena.ai"], "seaart": ["seaart.ai"], "huggingface": ["huggingface.co"], "meta-ai": ["meta.ai"],
  "photoroom": ["photoroom.com"], "pixelcut": ["pixelcut.ai"], "adot": ["adot.ai"], "higgsfield": ["higgsfield.ai"],
  "cursor": ["cursor.com"], "civitai": ["civitai.com"], "midjourney": ["midjourney.com"], "manus": ["manus.im"],
  "kling": ["klingai.com"], "veed": ["veed.io"], "genspark": ["genspark.ai"], "gigachat": ["giga.chat"],
  "poe": ["poe.com"], "cutout": ["cutout.pro"], "copilot": ["copilot.microsoft.com"], "picsart": ["picsart.com"],
  "remini": ["remini.ai"], "lightroom": ["lightroom.adobe.com"], "baidu-ai": ["chat.baidu.com", "yiyan.baidu.com"], "gauth": ["gauthmath.com"],
  "pixverse": ["pixverse.ai"], "papago": ["papago.naver.com"], "brainly": ["brainly.com"], "wrtn": ["wrtn.ai"],
  "liner": ["liner.com", "getliner.com"], "clova-note": ["clovanote.naver.com"], "zeta": ["zeta-ai.io"], "le-chat": ["chat.mistral.ai"],
  "venice": ["venice.ai"], "openevidence": ["openevidence.com"], "deepl": ["deepl.com"], "leonardo": ["leonardo.ai"],
  "ideogram": ["ideogram.ai"], "runway": ["runwayml.com"], "windsurf": ["windsurf.com"], "replit": ["replit.com"],
  "v0": ["v0.app", "v0.dev"], "bolt": ["bolt.new"], "base44": ["base44.com"],
};
for (const [id, domains] of Object.entries(serviceDomains)) if (serviceById.has(id)) serviceById.get(id).domains = domains;
function serviceFromLink(link) {
  try {
    const host = new URL(link).hostname;
    return Object.entries(serviceDomains).find(([, domains]) => domains.some(domain => host === domain || host.endsWith("." + domain)))?.[0] || "";
  } catch {
    return "";
  }
}
// 내가 쓰는 AI: 확장이 알려 준 서비스(서버 used.json) + 서랍에 대화가 있는 서비스. 최근에 쓴 것부터
function usedServices() {
  const used = new Map(Object.entries(syncInfo?.used || {}).filter(([id]) => serviceById.has(id)).map(([id, info]) => [id, info.last || ""]));
  for (const record of state.records) {
    const id = serviceById.has(record.service) ? record.service : serviceById.has(record.source) ? record.source : "";
    if (id && (!used.has(id) || used.get(id) < record.date)) used.set(id, record.date || "");
  }
  return [...used].sort((a, b) => b[1].localeCompare(a[1])).map(([id]) => id);
}
const methodNames = { auto: "자동", web: "자동 (확장)", export: "내보내기 파일", paste: "붙여넣기" };
const fileMethod = method => method === "export" || method === "web";   // 내보내기 ZIP 을 읽을 수 있는 서비스
function serviceName(record) {
  const service = serviceById.get(record.service);
  return service && service.id !== record.source ? service.name : sources[record.source] ?? sources.other;
}

function icon(name) {
  const span = document.createElement("span");
  span.setAttribute("aria-hidden", "true");
  span.className = "icon";
  span.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + icons[name] + '</svg>';
  return span;
}

function element(tag, className, content) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (content !== undefined) result.textContent = content;
  return result;
}

function button(label, className, handler, glyph) {
  const result = element("button", className, label);
  result.type = "button";
  if (glyph) result.prepend(icon(glyph));
  result.addEventListener("click", handler);
  return result;
}

const examples = [
  ["claude", "가계부 앱 저장 기능 고치기", "가계부 앱", "2026-11-22",
    "저장 버튼을 눌러도 목록이 바뀌지 않는 원인을 찾고 저장 순서를 정리했습니다.",
    "저장 버튼을 누르면 가끔 목록이 그대로야. 어디부터 보면 될까?",
    "저장이 끝난 뒤에 목록을 다시 읽는지부터 확인해 보세요. 저장 요청과 목록 새로 고침의 순서를 바꾸면 해결되는 경우가 많습니다."],
  ["chatgpt", "제주 3박 4일 여행 일정", "가족 여행", "2026-11-22",
    "비 오는 날 갈 곳과 이동 시간을 고려해 하루 일정을 다시 짰습니다.",
    "아이 둘과 제주 3박 4일, 이동은 짧게 하고 싶어.",
    "숙소를 동쪽 한 곳으로 정하고, 날마다 차로 40분 안쪽만 다니는 일정을 추천합니다. 비가 오면 실내 수족관과 미술관으로 바꾸세요."],
  ["gemini", "블로그 글 첫 문단 다듬기", "블로그", "2026-11-21",
    "첫 문단을 짧게 줄이고 읽는 사람이 바로 얻을 것을 앞에 두었습니다.",
    "처음 세 줄이 너무 길다는 말을 들었어.",
    "첫 문장에 이 글을 읽으면 무엇을 알게 되는지 한 줄로 쓰고, 배경 설명은 두 번째 문단으로 옮겨 보세요."],
  ["codex", "엑셀 자료 정리 스크립트", "가계부 앱", "2026-11-21",
    "월별 지출 파일을 하나로 합치고 항목별 합계를 내는 스크립트를 만들었습니다.",
    "달마다 따로 있는 지출 파일을 한 번에 합치고 싶어.",
    "폴더 안의 파일을 차례로 읽어 한 표로 붙인 뒤, 항목별로 묶어 합계를 내는 순서로 만들었습니다."],
  ["gemini", "영어 회화 공부 계획", "공부", "2026-11-20",
    "하루 20분씩 4주 동안 할 수 있는 말하기 연습 순서를 정했습니다.",
    "퇴근 후 20분만 영어 말하기 연습을 하고 싶어.",
    "첫 주는 자기소개와 하루 일과, 둘째 주는 식당과 길 묻기처럼 상황별로 나누고, 매일 녹음해서 들어 보세요."],
  ["chatgpt", "이사 체크리스트", "생활", "2026-11-20",
    "이사 두 주 전부터 당일까지 할 일을 날짜순으로 정리했습니다.",
    "다음 달 이사인데 빠뜨리는 게 있을까 걱정돼.",
    "전입신고, 인터넷 이전, 관리비 정산, 도시가스 해지와 연결을 날짜순 목록으로 만들어 드릴게요."],
].map(([source, title, project, date, summary, user, assistant], index) => ({
  id: "example-" + index, source, title, project, date, summary, example: true,
  messages: [{ role: "user", text: user }, { role: "assistant", text: assistant }],
}));

const state = {
  records: [], version: null, ready: false, error: "", showExamples: true, view: "date",
  source: "", service: "", project: "", favorites: false, customProjects: [], date: "", order: "new", query: "", limit: 60,
};
const intake = { mode: "choice", batch: [], warnings: [], offsets: {}, totals: {}, local: null, busy: false,
  service: "", serviceQuery: "", serviceGroup: null };   // serviceGroup null = 처음 열 때 쓰는 AI 가 있으면 「내가 쓰는 AI」로
let syncInfo = null;
let detailId = null;
let entry = null;
let toastTimer;
let writeQueue = Promise.resolve();
const searchedText = new WeakMap();
const koreanDate = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric", weekday: "long",
});

function today() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return ["year", "month", "day"].map(key => parts.find(part => part.type === key).value).join("-");
}

function fullDate(value) {
  const date = new Date(value + "T00:00:00+09:00");
  return isNaN(date) ? "날짜 미상" : koreanDate.format(date).replace(/\. /g, " ").replace(/\.$/, "");
}

function shortDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.replaceAll("-", ".") : "날짜 미상";
}

function normalized(value) {
  return value.normalize("NFKC").toLocaleLowerCase("ko");
}

function projectOf(record) {
  return record.project || "미분류";
}

function summaryOf(record) {
  return record.summary || record.messages[0]?.text || "";
}

function recordSearch(record) {
  if (!searchedText.has(record)) {
    searchedText.set(record, normalized([
      record.title, projectOf(record), record.summary, serviceName(record), ...record.messages.map(message => message.text),
    ].join(" ")));
  }
  return searchedText.get(record);
}

function visibleLibrary() {
  return state.records.length || !state.showExamples ? state.records : examples.filter(record => !hiddenExamples.has(record.id));
}
const hiddenExamples = new Set();   // 선택 삭제로 지운 예시 카드(서버에 없는 것이라 화면에서만 숨김)

function mapCount(records, key) {
  const counts = new Map();
  for (const record of records) counts.set(key(record), (counts.get(key(record)) ?? 0) + 1);
  return counts;
}

function navItem(label, glyph, count, active, handler, source) {
  const item = button(label, "nav-item" + (active ? " is-active" : ""), handler, glyph || sourceIcons[source] || "dots");
  item.firstChild.classList.add("nav-tile");   // 입체 아이콘 블록(색은 styles.css 의 data-glyph · data-source)
  item.firstChild.dataset.glyph = glyph || "source";
  if (source) item.firstChild.dataset.source = source;
  const text = [...item.childNodes].find(node => node.nodeType === 3);
  if (text) { const span = element("span", "nav-label", text.textContent); span.title = text.textContent; text.replaceWith(span); }   // 긴 이름은 한 줄 + 말줄임
  item.append(element("span", "nav-count", count.toLocaleString("ko-KR")));
  item.setAttribute("aria-pressed", String(active));
  return item;
}

function closeMenu() {
  $(".app-shell").classList.remove("is-menu-open");
  $("#mobile-menu").setAttribute("aria-expanded", "false");
  $("#mobile-menu").setAttribute("aria-label", "메뉴 열기");
}

function selectLibrary(filters) {
  Object.assign(state, { favorites: false, project: "", source: "", service: "" }, filters);
  closeMenu();
  render(true);
  $("#records-heading").focus({ preventScroll: true });
}

function renderNavigation(records) {
  $("#library-nav").replaceChildren(
    navItem("전체 대화", "all", records.length, !state.favorites && !state.project && !state.source && !state.service, () => selectLibrary({})),
    navItem("즐겨찾기", "star", records.filter(record => record.favorite).length, state.favorites, () => selectLibrary({ favorites: true })),
    navItem("휴지통", "trash", trash.items.length, false, openTrash),
  );
  // AI 서비스: 왼쪽에는 단추 하나, 누르면 내가 쓰는 AI 만 담긴 팝업
  serviceMenu = usedServiceEntries(records);
  const chosen = serviceMenu.find(item => item.active);
  const trigger = navItem(chosen ? chosen.label : "AI 서비스 전체", chosen ? null : "all", serviceMenu.length, Boolean(chosen),
    event => { event.stopPropagation(); toggleServicePopover(); }, chosen?.icon);
  trigger.id = "service-trigger";
  trigger.classList.add("service-trigger");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", String(!$("#service-popover").hidden));
  trigger.querySelector(".nav-count").title = "쓰는 AI " + serviceMenu.length + "곳";
  const chev = icon("chev");
  chev.classList.add("service-chev");
  trigger.append(chev);
  $("#source-nav").replaceChildren(trigger);
  if (!$("#service-popover").hidden) drawServicePopover();
  // 프로젝트 메뉴: 내 대화의 프로젝트 + 내가 직접 만든 프로젝트(대화 0개라도 보임). 예시 카드의 프로젝트는 넣지 않는다
  const projectCounts = mapCount(state.records, projectOf);
  for (const name of state.customProjects) if (!projectCounts.has(name)) projectCounts.set(name, 0);
  const created = new Set(state.customProjects);
  const projects = [...projectCounts].sort((a, b) => b[1] - a[1] || created.has(b[0]) - created.has(a[0]) || a[0].localeCompare(b[0], "ko"));
  const limit = Math.max(7, state.customProjects.length);
  const shortList = projects.slice(0, limit);
  const active = projects.find(([project]) => project === state.project);
  if (active && !shortList.includes(active)) shortList.push(active);
  $("#project-nav").replaceChildren(...shortList.map(([project, count]) =>
    navItem(project, "folder", count, state.project === project, () => selectLibrary({ project, view: "date" }))));
  if (projects.length > limit) {
    $("#project-nav").append(button("모든 프로젝트 보기", "nav-item text-button", () => selectLibrary({ view: "project" }), "folder"));
  }
  if (!projects.length) $("#project-nav").append(element("p", "project-empty", "「새 프로젝트」로 일 이름을 만들어 두면 여기에 생겨요."));
  $("#saved-projects").replaceChildren(...[...new Set([...state.customProjects, ...state.records.map(projectOf)])].sort().map(project => {
    const option = element("option");
    option.value = project;
    return option;
  }));
}

// ---- AI 서비스 팝업: 내가 쓰는 AI 만(대화가 있는 AI + 자동 저장 확장이 알아본 AI)
let serviceMenu = [];
document.body.append($("#service-popover"));   // 서랍(사이드바)이 움직여도 팝업이 화면 기준으로 뜨게 body 로 옮긴다
function usedServiceEntries(records) {
  const entries = new Map();
  const add = (key, label, count, filter, iconKey) => {
    const old = entries.get(key);
    if (old) { old.count += count; return; }
    entries.set(key, { key, label, count, filter, icon: iconKey,
      active: filter.source ? state.source === filter.source && !state.service : state.service === filter.service });
  };
  for (const [key, count] of mapCount(records, record => record.source)) {
    const service = serviceById.get(key);
    const own = records.filter(record => record.source === key && (!record.service || record.service === key || !serviceById.has(record.service))).length;
    if (own) add("source:" + key, service?.name || sources[key] || sources.other, own, { source: key }, key);
  }
  for (const [id, count] of mapCount(records.filter(record => serviceById.has(record.service) && record.service !== record.source), record => record.service)) {
    add("service:" + id, serviceById.get(id).name, count, { service: id }, serviceById.get(id).source);
  }
  for (const id of usedServices()) {
    const service = serviceById.get(id);
    if (service.source === id) add("source:" + id, service.name, 0, { source: id }, id);
    else add("service:" + id, service.name, 0, { service: id }, service.source);
  }
  return [...entries.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko"));
}

function drawServicePopover() {
  const box = $("#service-popover");
  const list = element("div", "service-pop-list");
  list.append(navItem("AI 서비스 전체", "all", state.records.length, !state.source && !state.service && !state.favorites && !state.project,
    () => { closeServicePopover(); selectLibrary({}); }));
  for (const item of serviceMenu) {
    list.append(navItem(item.label, null, item.count, item.active, () => { closeServicePopover(); selectLibrary(item.filter); }, item.icon));
  }
  const head = element("div", "service-pop-head");
  head.append(element("strong", "", "내가 쓰는 AI"), element("span", "", serviceMenu.length + "곳"));
  box.replaceChildren(head, list);
  if (!serviceMenu.length) box.append(element("p", "service-pop-empty", "아직 쓰는 AI 가 없어요. 대화를 넣거나 자동 저장 확장을 깔아 두면 쓰는 AI 가 저절로 여기에 모여요."));
  box.append(button("다른 AI 찾기 (TOP 100)", "service-pop-more", () => { closeServicePopover(); openIntake("services"); }, "plus"));
  placeServicePopover();
}

function placeServicePopover() {
  const box = $("#service-popover");
  const trigger = $("#service-trigger");
  if (box.hidden || !trigger) return;
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(280, window.innerWidth - 24);
  const beside = window.innerWidth >= 720 && rect.right + 8 + width <= window.innerWidth - 8;
  box.style.width = width + "px";
  box.style.left = (beside ? rect.right + 8 : Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))) + "px";
  const top = beside ? rect.top - 8 : rect.bottom + 6;
  box.style.top = Math.max(12, Math.min(top, window.innerHeight - box.offsetHeight - 12)) + "px";
}

function toggleServicePopover() {
  if ($("#service-popover").hidden) openServicePopover(); else closeServicePopover();
}
function openServicePopover() {
  $("#service-popover").hidden = false;
  $("#service-trigger")?.setAttribute("aria-expanded", "true");
  drawServicePopover();
  $("#service-popover").querySelector(".nav-item")?.focus();
}
function closeServicePopover() {
  if ($("#service-popover").hidden) return;
  $("#service-popover").hidden = true;
  $("#service-trigger")?.setAttribute("aria-expanded", "false");
}
document.addEventListener("click", event => {
  if (!$("#service-popover").hidden && !event.target.closest("#service-popover, #service-trigger")) closeServicePopover();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("#service-popover").hidden) { closeServicePopover(); $("#service-trigger")?.focus(); }
});
window.addEventListener("resize", placeServicePopover);
$(".sidebar").addEventListener("scroll", placeServicePopover, { passive: true });

function sourceBadge(source, service) {
  const badge = element("span", "source-badge", serviceName({ source, service }));
  badge.dataset.source = source;
  return badge;
}

function coverImage(record) {
  const image = element("img");
  image.src = record.thumbnail;
  image.alt = record.title + " 썸네일";
  image.loading = "lazy";
  return image;
}

function projectCover(project) {
  // 프로젝트 이름으로 표지 12장(assets/covers/p01~p12) 가운데 하나를 늘 같게 고른다
  const sum = [...project].reduce((total, char) => total + char.charCodeAt(0), 0);
  return "p" + String(1 + sum % 12).padStart(2, "0");
}

function coverPlaceholder(record) {
  const cover = element("span", "cover-placeholder");
  cover.dataset.tone = record.source;
  const seed = [...String(record.id ?? record.title)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  cover.style.setProperty("--cover-art", `url("assets/covers/${projectCover(projectOf(record))}.webp")`);
  cover.style.setProperty("--shine-delay", `${-(seed % 9)}s`);
  cover.append(icon("chat"), element("span", "cover-project", projectOf(record)), element("strong", "cover-title", record.title));
  return cover;
}

// 삭제: 「선택」을 켜고 카드를 골라 한꺼번에 지우거나, 대화 창의 「삭제」로 하나만 지운다. 지운 대화는 휴지통에서 3일 동안 되살릴 수 있다.
const selection = { on: false, ids: new Set() };
function setSelecting(on) {
  selection.on = on;
  selection.ids.clear();
  document.body.classList.toggle("is-selecting", on);
  $("#select-toggle").setAttribute("aria-pressed", String(on));
  $("#select-toggle").classList.toggle("is-active", on);
  updateSelectBar();
  render();
}
function toggleSelected(id, card, wanted = !selection.ids.has(id)) {
  if (wanted) selection.ids.add(id); else selection.ids.delete(id);
  card.classList.toggle("is-selected", wanted);
  const box = card.querySelector(".card-check input");
  if (box) box.checked = wanted;
  updateSelectBar();
}
function updateSelectBar() {
  $("#select-bar").hidden = !selection.on;
  $("#select-count").textContent = selection.ids.size.toLocaleString("ko-KR") + "개 선택";
  $("#select-delete").disabled = !selection.ids.size;
}
function askDelete(count) {
  const dialog = $("#confirm-delete");
  $("#confirm-title").textContent = `대화 ${count.toLocaleString("ko-KR")}개를 지울까요?`;
  dialog.returnValue = "";
  dialog.showModal();
  dialog.querySelector(".secondary-button").focus();
  return new Promise(resolve => dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true }));
}
// 휴지통: 지운 지 3일 안의 대화를 되살린다(서버 /api/trash). 바깥 주소에서는 보기 전용이라 열리지 않는다.
const trash = { items: [], days: 3 };
async function refreshTrash() {
  try {
    const result = await api("api/trash");
    trash.items = result.items;
    trash.days = result.days;
  } catch {
    trash.items = [];
  }
}
function timeLeft(expiresAt) {
  const hours = Math.max(0, Math.floor((expiresAt * 1000 - Date.now()) / 3600000));
  return hours >= 24 ? `${Math.floor(hours / 24)}일 ${hours % 24}시간 남음` : `${hours}시간 남음`;
}
async function openTrash() {
  closeMenu();
  await refreshTrash();
  const body = $("#trash-body");
  const foot = $("#trash-foot");
  body.replaceChildren();
  foot.replaceChildren();
  if (!trash.items.length) {
    body.append(element("p", "trash-empty", `지난 ${trash.days}일 안에 지운 대화가 없습니다.`));
  } else {
    const list = element("ul", "trash-list");
    for (const item of trash.items) {
      const row = element("li", "trash-row");
      const info = element("div", "trash-info");
      const meta = element("div", "trash-meta");
      meta.append(sourceBadge(item.source, item.service), element("span", "", item.project || "미분류"), element("span", "trash-left", timeLeft(item.expiresAt)));
      info.append(element("strong", "trash-name", item.title || "제목 없음"), meta);
      row.append(info, button("되살리기", "secondary-button", () => restoreRecords([item.id]), "upload"));
      list.append(row);
    }
    body.append(list);
    foot.append(button(`모두 되살리기 (${trash.items.length.toLocaleString("ko-KR")}개)`, "primary-button", () => restoreRecords(trash.items.map(item => item.id)), "upload"));
  }
  if (!$("#trash").open) $("#trash").showModal();
}
async function restoreRecords(ids) {
  try {
    const result = await api("api/trash/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    await loadArchive();
    await refreshTrash();
    render();
    notify(result.restored ? `대화 ${result.restored.toLocaleString("ko-KR")}개를 되살렸습니다.` : "되살릴 대화가 없습니다.");
    if ($("#trash").open) openTrash();
  } catch (error) {
    notify(error.message);
  }
}

async function deleteRecords(ids) {
  if (ids.size && [...ids].every(id => id.startsWith("example-"))) {   // 예시 카드: 휴지통 없이 화면에서만 숨김
    for (const id of ids) hiddenExamples.add(id);
    notify(`예시 대화 ${ids.size.toLocaleString("ko-KR")}개를 숨겼습니다. 내 대화를 지우면 휴지통으로 가서 3일 안에 되살릴 수 있습니다.`);
    setSelecting(false);
    return true;
  }
  if (!ids.size || !(await askDelete(ids.size))) return false;
  try {
    await updateArchive(records => records.filter(record => !ids.has(record.id)));
    await refreshTrash();
    render();
    notify(`대화 ${ids.size.toLocaleString("ko-KR")}개를 지웠습니다. 휴지통에서 ${trash.days}일 안에 되살릴 수 있습니다.`);
    if (selection.on) setSelecting(false);
    return true;
  } catch (error) {
    notify(error.message);
    return false;
  }
}

function renderCard(record) {
  const card = element("article", "record-card");
  card.dataset.id = record.id;
  const cover = button("", "card-cover", () => selection.on ? toggleSelected(record.id, card) : openDetail(record.id));
  cover.setAttribute("aria-label", record.title + " 대화 열기");
  if (record.thumbnail) {
    const image = coverImage(record);
    image.addEventListener("error", () => image.replaceWith(coverPlaceholder(record)), { once: true });
    cover.append(image);
  } else {
    cover.append(coverPlaceholder(record));
  }
  const star = button("", "card-favorite" + (record.favorite ? " is-active" : ""),
    () => record.example ? notify("내 대화를 가져오면 즐겨찾기에 넣을 수 있습니다.") : toggleFavorite(record.id), "star");
  star.setAttribute("aria-label", record.favorite ? "즐겨찾기 해제" : "즐겨찾기 추가");
  star.setAttribute("aria-pressed", String(Boolean(record.favorite)));
  const body = element("div", "card-body");
  const meta = element("div", "card-meta");
  meta.append(sourceBadge(record.source, record.service), element("time", "card-date", shortDate(record.date)));
  const title = element("h4");
  title.append(button(record.title, "card-title", () => openDetail(record.id)));
  const project = button(projectOf(record), "card-project", () => selectLibrary({ project: projectOf(record), view: "date" }), "folder");
  body.append(meta, title, element("p", "card-summary", summaryOf(record)), project);
  card.append(cover, star, body);
  if (selection.on) {   // 「대화내용 선택후 삭제」: 선택 모드면 카드마다 체크 칸
    const check = element("label", "card-check");
    const box = element("input");
    box.type = "checkbox";
    box.checked = selection.ids.has(record.id);
    box.setAttribute("aria-label", record.title + " 선택");
    box.addEventListener("change", () => toggleSelected(record.id, card, box.checked));
    check.append(box);
    card.append(check);
    card.classList.add("is-selectable");
    card.classList.toggle("is-selected", box.checked);
  }
  return card;
}

function matchingRecords(records) {
  const words = normalized(state.query.trim()).split(/\s+/).filter(Boolean);
  return records.filter(record => (!state.source || record.source === state.source)
    && (!state.project || projectOf(record) === state.project)
    && (!state.favorites || record.favorite)
    && (!state.date || record.date === state.date)
    && (!words.length || words.every(word => recordSearch(record).includes(word))))
    .sort((a, b) => (state.order === "old" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
}

function render(resetLimit = false) {
  if (resetLimit) state.limit = 60;
  const records = visibleLibrary();
  renderNavigation(records);
  $("#demo-banner").hidden = !state.ready || Boolean(state.records.length) || Boolean(state.error);
  $("#demo-text").textContent = state.showExamples
    ? "실제 대화를 추가하면 내 기록이 표시됩니다." : "예시를 펼쳐 앱을 둘러볼 수 있습니다.";
  $("#toggle-demo").textContent = state.showExamples ? "예시 숨기기" : "예시 보기";
  $("#records-heading").textContent = state.favorites ? "즐겨찾기" : (state.project || serviceById.get(state.service)?.name || sources[state.source] || "전체 대화");
  $("#load-status").textContent = state.error || (state.ready ? "" : "보관함을 불러오는 중입니다.");
  for (const tab of document.querySelectorAll("[data-view]")) {
    const active = tab.dataset.view === state.view;
    tab.setAttribute("aria-pressed", String(active));
    tab.classList.toggle("is-active", active);
  }
  $("#date-label").textContent = state.date ? shortDate(state.date) : "날짜 선택";
  $("#clear-date").hidden = !state.date;
  const matched = matchingRecords(records);
  $("#view-count").textContent = matched.length.toLocaleString("ko-KR") + "건";
  const timeline = $("#timeline");
  timeline.replaceChildren();
  $("#show-more").hidden = matched.length <= state.limit;
  if (!matched.length && state.project && !state.query && !state.date && !state.source && !state.service && !state.favorites) {
    const empty = element("section", "empty-state");   // 직접 만든 빈 프로젝트
    empty.append(icon("folder"), element("h3", "", `「${state.project}」 프로젝트에 아직 대화가 없어요.`),
      element("p", "", "대화를 넣을 때 프로젝트 칸에 이 이름이 미리 들어가요."),
      button("이 프로젝트에 대화 넣기", "primary-button", () => openIntake("choice"), "plus"));
    timeline.append(empty);
    return;
  }
  if (!matched.length) {
    const empty = element("section", "empty-state");
    const filtering = state.query || state.source || state.service || state.date || state.project || state.favorites;
    empty.append(icon(filtering ? "search" : "library"),
      element("h3", "", filtering ? "조건에 맞는 대화가 없습니다." : "아직 보관한 대화가 없습니다."),
      element("p", "", filtering ? "검색어를 바꾸거나 날짜와 프로젝트 선택을 확인해 보세요." : "내보낸 대화 파일이나 PC 판 백업을 가져오면 여기에 표시됩니다."));
    empty.append(filtering ? button("필터 초기화", "secondary-button", () => {
      Object.assign(state, { date: "", query: "" });
      $("#search").value = "";
      $("#date-filter").value = "";
      selectLibrary({});
    }) : button("대화 추가", "primary-button", () => openIntake("choice"), "plus"));
    timeline.append(empty);
    return;
  }
  const groupKey = state.view === "date" ? record => record.date : projectOf;
  const totals = mapCount(matched, groupKey);
  const groups = new Map();
  for (const record of matched.slice(0, state.limit)) {
    const key = groupKey(record);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  for (const [key, group] of groups) {
    const section = element("section", "record-group");
    const head = element("div", "group-head");
    head.append(icon(state.view === "date" ? "calendar" : "folder"),
      element("h3", "", state.view === "date" ? fullDate(key) : key),
      element("span", "group-count", totals.get(key).toLocaleString("ko-KR") + "건"));
    const grid = element("div", "card-grid");
    grid.append(...group.map(renderCard));
    section.append(head, grid);
    timeline.append(section);
  }
}

async function api(url, options) {
  const response = await fetch(url, options);
  const value = await response.json();
  if (!response.ok) {
    const error = new Error(value.error || value.message || "작업을 처리하지 못했습니다. (" + response.status + ")");
    error.status = response.status;
    throw error;
  }
  return value;
}

async function loadArchive() {
  const result = await api("api/archive");
  state.records = result.records;
  state.version = result.version;
  state.error = "";
  state.ready = true;
  try {
    state.customProjects = (await api("api/projects")).projects;
  } catch {
    state.customProjects = [];
  }
}

// 「새 프로젝트」: 내가 정한 이름으로 프로젝트를 만들면 왼쪽 메뉴에 바로 생긴다(대화가 없어도). 서버 projects.json 에 저장
async function saveProjects(names) {
  const result = await api("api/projects", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projects: names }) });
  state.customProjects = result.projects;
}
function openNewProject() {
  if ($("#new-project-form")) { $("#new-project-form input").focus(); return; }
  const form = element("form", "new-project-form");
  form.id = "new-project-form";
  const input = element("input");
  input.maxLength = 160;
  input.placeholder = "프로젝트 이름 (예: 우리집 가계부)";
  input.setAttribute("aria-label", "새 프로젝트 이름");
  input.required = true;
  const ok = element("button", "primary-button", "만들기");
  ok.type = "submit";
  const cancel = button("취소", "ghost-button", () => form.remove());
  const row = element("div", "new-project-actions");
  row.append(ok, cancel);
  form.append(input, row);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const name = input.value.trim().replace(/\s+/g, " ");
    if (!name) return;
    const exists = state.customProjects.includes(name) || state.records.some(record => projectOf(record) === name);
    try {
      if (!state.customProjects.includes(name)) await saveProjects([...state.customProjects, name]);
      form.remove();
      selectLibrary({ project: name, view: "date" });
      notify(exists ? `「${name}」 프로젝트로 옮겼어요.` : `「${name}」 프로젝트를 만들었어요.`);
    } catch (error) {
      notify(error.message);
    }
  });
  input.addEventListener("keydown", event => { if (event.key === "Escape") form.remove(); });
  $("#project-nav").before(form);
  input.focus();
}

function updateArchive(transform) {
  const run = async () => {
    if (!state.ready) await loadArchive();
    for (let attempt = 0; attempt < 2; attempt++) {
      const records = transform(state.records);
      try {
        const result = await api("api/archive", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records, version: state.version }),
        });
        state.version = result.version;
        state.records = records;
        render();
        return;
      } catch (error) {
        if (error.status !== 409 || attempt) throw error;
        await loadArchive();
      }
    }
  };
  const operation = writeQueue.then(run);
  writeQueue = operation.catch(() => {});
  return operation;
}

function recordById(id) {
  return visibleLibrary().find(record => record.id === id);
}

function notify(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => { $("#toast").hidden = true; }, 4500);
}

async function toggleFavorite(id) {
  const wanted = !recordById(id)?.favorite;
  try {
    await updateArchive(records => records.map(record => record.id === id ? { ...record, favorite: wanted } : record));
    if (detailId === id && $("#detail").open) openDetail(id);
    else [...document.querySelectorAll(".record-card")].find(card => card.dataset.id === id)
      ?.querySelector(".card-favorite").focus({ preventScroll: true });
  } catch (error) {
    notify(error.message);
  }
}

function externalLink(label, address, className = "") {
  try {
    if (!["https:", "http:"].includes(new URL(address).protocol)) return null;
  } catch {
    return null;
  }
  const link = element("a", className, label);
  link.href = address;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function messageLabel(message, record) {
  if (message.role === "user") return "내 질문";
  if (message.role === "assistant") return sources[record.source] || "AI 답변";
  return "대화 원문";
}

function openDetail(id) {
  const record = recordById(id);
  if (!record) return;
  detailId = id;
  $("#detail-title").textContent = record.title;
  const badges = [sourceBadge(record.source, record.service), element("span", "", fullDate(record.date)), element("span", "", projectOf(record))];
  if (record.origin) badges.push(element("span", "", record.origin));
  if (record.example) badges.push(element("span", "", "예시 대화"));
  $("#detail-meta").replaceChildren(...badges);
  const body = $("#detail-body");
  body.replaceChildren();
  if (record.thumbnail) {
    const image = coverImage(record);
    image.className = "detail-cover";
    body.append(image);
  }
  if (record.summary) body.append(element("p", "detail-summary", record.summary));
  for (const message of record.messages) {
    const block = element("section", "message");
    block.dataset.role = message.role;
    block.append(element("h3", "", messageLabel(message, record)), element("p", "", message.text));
    body.append(block);
  }
  const buttons = $("#detail-foot");
  buttons.replaceChildren();
  const original = externalLink("원본 열기", record.link, "secondary-button");
  if (original) buttons.append(original);
  buttons.append(button("원문 복사", "secondary-button", async () => {
    try {
      await navigator.clipboard.writeText(record.messages.map(message => messageLabel(message, record) + "\n" + message.text).join("\n\n"));
      notify("대화 원문을 복사했습니다.");
    } catch {
      notify("복사할 문장을 선택해 복사해 주세요.");
    }
  }, "copy"));
  if (!record.example) {
    buttons.append(button("삭제", "danger-button detail-delete", async () => {
      if (await deleteRecords(new Set([id])) && $("#detail").open) $("#detail").close();
    }, "trash"),
      button(record.favorite ? "즐겨찾기 해제" : "즐겨찾기", "secondary-button", () => toggleFavorite(id), "star"),
      button("수정", "primary-button", () => openEditor(record), "edit"));
  }
  if (!$("#detail").open) $("#detail").showModal();
  body.scrollTop = 0;
}

// 붙여넣기 창의 「AI 서비스」 칸: 기본 4개 + TOP 100 을 분류별로
function fillServiceSelect() {
  const select = $("#entry-source");
  const option = (value, label) => { const item = element("option", "", label); item.value = value; return item; };
  const groups = Object.entries(serviceGroups).map(([key, label]) => {
    const group = element("optgroup");
    group.label = label;
    group.append(...aiServices.filter(service => service.group === key).map(service => option(service.id, service.name)));
    return group;
  });
  select.replaceChildren(...groups, option("other", "기타"));
}

function openEditor(record = null, serviceId = "") {
  if ($("#intake").open) $("#intake").close();
  if ($("#detail").open) $("#detail").close();
  entry = { record, thumbnail: record?.thumbnail || "" };
  const form = $("#entry-form");
  form.reset();
  $("#editor-title").textContent = record ? "대화 정보 수정" : "대화 붙여넣기";
  $("#entry-title").value = record?.title || "";
  $("#entry-project").value = record?.project || (record ? "" : state.project);
  $("#entry-date").required = !record;
  $("#entry-date").value = record ? record.date : today();
  $("#entry-source").value = serviceId || (record ? (serviceById.has(record.service) ? record.service : record.source)
    : state.service || (state.source && state.source !== "other" ? state.source : usedServices()[0] || "chatgpt"));
  $("#entry-summary").value = record?.summary || "";
  $("#entry-link").value = record?.link || "";
  $("#entry-transcript-field").hidden = Boolean(record);
  $("#entry-transcript").required = !record;
  $("#editor-status").textContent = "";
  renderImageEdit();
  $("#editor").showModal();
  $("#entry-title").focus();
}

function renderImageEdit() {
  const image = $("#image-edit");
  image.hidden = !entry.thumbnail;
  image.replaceChildren();
  if (entry.thumbnail) {
    const preview = coverImage({ thumbnail: entry.thumbnail, title: "선택한" });
    image.append(preview, button("그림 지우기", "text-button", () => {
      entry.thumbnail = "";
      $("#entry-image").value = "";
      renderImageEdit();
    }));
  }
}

async function shrinkImage(file) {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 20 * 1024 * 1024) {
    throw new Error("20MB 이하의 사진 파일을 선택해 주세요.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = element("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", .83);
  } finally {
    bitmap.close();
  }
}

function pasteMessages(text) {
  const markers = [...text.matchAll(/^\s*(나|사용자|질문|AI|답변|Gemini|ChatGPT|Claude)\s*[:：][ \t]*/gmi)];
  if (!markers.length || markers[0].index > 0) return [{ role: "system", text }];
  return markers.map((mark, index) => ({
    role: /^(나|사용자|질문)$/.test(mark[1]) ? "user" : "assistant",
    text: text.slice(mark.index + mark[0].length, markers[index + 1]?.index ?? text.length).trim(),
  })).filter(message => message.text);
}

function htmlSection(title, text, className, glyph, handler) {
  const option = button("", className, handler, glyph);
  const content = element("span");
  content.append(element("strong", "", title), element("small", "", text));
  option.append(content);
  return option;
}

function openIntake(mode) {
  if (intake.busy) return;
  intake.mode = mode;
  intake.batch = [];
  intake.warnings = [];
  drawIntake();
  if (!$("#intake").open) $("#intake").showModal();
  if (mode === "local") discoverLocal();
  if (mode === "sync") refreshSync();
}

function drawIntake() {
  const title = $("#intake-title");
  const subtitle = $("#intake-subtitle");
  const body = $("#intake-body");
  const foot = $("#intake-foot");
  body.replaceChildren();
  foot.replaceChildren();
  foot.hidden = false;
  if (intake.mode === "choice") {
    title.textContent = "대화 추가";
    subtitle.textContent = "가져올 방법을 선택하세요.";
    const options = element("div", "import-options");
    options.append(
      htmlSection("파일 가져오기", "ChatGPT·Claude·Gemini 내보내기, JSON 백업, 텍스트 파일", "import-option", "upload", () => openIntake("file")),
      htmlSection("대화 붙여넣기", "원문을 복사해 새 카드 만들기", "import-option", "paste", () => openEditor()),
      htmlSection("AI 서비스 고르기 (TOP 100)", "많이 쓰는 AI 100곳 · 내가 쓰는 AI 는 저절로 골라 둠", "import-option is-featured", "all", () => openIntake("services")),
    );
    body.append(options);
    foot.hidden = true;
    return;
  }
  if (intake.mode === "services") {
    drawServicePicker(title, subtitle, body, foot);
    return;
  }
  if (intake.mode === "service") {
    drawServiceGuide(title, subtitle, body, foot);
    return;
  }
  foot.append(button("다른 방법", "secondary-button", () => openIntake("choice")));
  if (intake.mode === "sync") {
    title.textContent = "자동 기록";
    subtitle.textContent = syncInfo?.enabled ? "이 PC의 Claude Code, Codex, Gemini 작업 기록과 웹 AI 대화를 저절로 저장합니다." : "자동 기록 상태를 확인하고 있습니다.";
    body.append(element("p", "", "원래 AI 앱에서 대화를 지워도 서랍에 저장된 원문과 썸네일은 남습니다."));
    if (syncInfo?.folder) {
      body.append(element("h3", "", "웹 대화 가져올 폴더"),
        element("p", "", "ChatGPT, Claude, Gemini 내보내기 파일을 이 폴더에 넣으세요. 프로젝트 이름으로 하위 폴더를 만들 수 있습니다."),
        element("p", "sync-folder", syncInfo.folder),
        button("폴더 주소 복사", "secondary-button", async () => {
          await navigator.clipboard.writeText(syncInfo.folder);
          notify("탐색기 주소창에 폴더 주소를 붙여넣으세요.");
        }, "copy"));
    }
    if (syncInfo?.extension) {
      // 웹 AI(ChatGPT · Claude · Gemini) 대화 자동 저장: Chrome 확장을 한 번 설치하면 대화가 끝날 때마다 들어온다
      const steps = element("ol", "service-steps");
      for (const text of [
        "Chrome 주소창에 chrome://extensions 를 넣고 오른쪽 위 「개발자 모드」를 켭니다.",
        "「압축해제된 확장 프로그램을 로드합니다」를 누르고 아래 폴더를 고릅니다.",
        "끝입니다. ChatGPT · Claude · Gemini 웹에서 대화하면 답이 끝날 때마다 이 서랍에 저장됩니다.",
      ]) steps.append(element("li", "", text));
      body.append(element("h3", "", "웹 AI 대화 자동 저장 (Chrome 확장)"),
        element("p", "", "대화는 이 PC 의 서랍으로만 보내고 다른 곳으로 나가지 않습니다. 앱이 꺼져 있던 동안의 대화는 다음에 켜면 이어서 들어옵니다."),
        steps,
        element("p", "sync-folder", syncInfo.extension),
        button("확장 프로그램 폴더 주소 복사", "secondary-button", async () => {
          await navigator.clipboard.writeText(syncInfo.extension);
          notify("폴더 고르는 창의 주소창에 붙여넣으세요.");
        }, "copy"));
      const web = syncInfo.web || {};
      body.append(element("p", "status-text", web.lastAt
        ? "마지막 웹 대화 저장 " + new Date(web.lastAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) + " · " + (serviceById.get(web.service)?.name || web.service)
        : "이번에 앱을 켠 뒤로 들어온 웹 대화는 아직 없습니다."));
    }
    if (syncInfo?.running || syncInfo?.lastRun) {
      const lastRun = syncInfo.lastRun ? new Date(syncInfo.lastRun).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "";
      body.append(element("p", "status-text", syncInfo.running ? "새 기록을 확인하고 있습니다." : "마지막 확인 " + lastRun));
    }
    if (syncInfo?.error) body.append(element("p", "status-text", syncInfo.error));
    if (syncInfo?.enabled) foot.append(button("지금 새 기록 확인", "primary-button", async () => {
      try {
        syncInfo = await api("api/sync", { method: "POST" });
        if ($("#intake").open && intake.mode === "sync") drawIntake();
        notify("새 기록 확인을 요청했습니다.");
      } catch (error) {
        notify(error.message);
      }
    }));
  } else if (intake.mode === "local") {
    title.textContent = "내 PC 대화 찾기";
    subtitle.textContent = "가져올 AI 서비스를 고르세요. 최신 대화부터 읽습니다.";
    const options = element("div", "import-options");
    for (const source of intake.local ?? []) {
      const offset = intake.offsets[source.id] || 0;
      const remains = Math.max(0, source.count - offset);
      const option = htmlSection(source.name, remains ? (offset ? "이전 기록 " : "발견한 파일 ") + remains.toLocaleString("ko-KR") + "개" : "가져올 기록이 없습니다",
        "import-option", "chat", () => importLocal(source.id));
      option.disabled = !remains || intake.busy;
      options.append(option);
    }
    if (!intake.local) options.append(element("p", "status-text", "이 PC의 대화 파일을 찾는 중입니다."));
    body.append(options);
  } else if (intake.mode === "file") {
    title.textContent = "파일 가져오기";
    subtitle.textContent = "파일을 선택하거나 이 창에 끌어 놓으세요.";
    const field = element("label", "field", "AI 서비스");
    const select = element("select");
    const entries = Object.entries({ auto: "자동 감지", ...sources });
    for (const [key, label] of entries) {
      const option = element("option", "", label);
      option.value = key;
      select.append(option);
    }
    field.append(select);
    const input = element("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".zip,.json,.jsonl,.html,.htm,.md,.txt";
    input.hidden = true;
    input.addEventListener("change", () => importFiles([...input.files], select.value));
    const drop = button("파일 선택", "drop-zone", () => input.click(), "upload");
    drop.append(element("small", "", "ZIP, JSON, JSONL, HTML, MD, TXT"));
    drop.addEventListener("dragover", event => event.preventDefault());
    drop.addEventListener("drop", event => {
      event.preventDefault();
      importFiles([...event.dataTransfer.files], select.value);
    });
    const links = element("p", "import-help");
    links.append(externalLink("ChatGPT 내보내기 안내", "https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data"),
      document.createTextNode(" · "), externalLink("Gemini 내보내기 안내", "https://support.google.com/gemini/answer/16920332?hl=ko"));
    const pasted = element("details", "backup-paste");
    pasted.append(element("summary", "", "복사한 백업 붙여넣기"));
    const paste = element("textarea");
    paste.placeholder = "AI 대화서랍 JSON 백업 내용을 붙여넣으세요.";
    paste.setAttribute("aria-label", "JSON 백업");
    paste.rows = 3;
    pasted.append(paste, button("붙여넣은 백업 확인", "secondary-button", () => {
      if (!paste.value.trim()) return;
      importFiles([new File([paste.value], "대화서랍-백업.json", { type: "application/json" })], select.value);
    }));
    body.append(field, input, drop, links, pasted);
  } else {
    title.textContent = "가져올 대화 확인";
    subtitle.textContent = intake.batch.length.toLocaleString("ko-KR") + "건을 읽었습니다.";
    const list = element("ul", "import-preview");
    for (const record of intake.batch.slice(0, 8)) {
      const row = element("li");
      row.append(sourceBadge(record.source, record.service), element("span", "", record.title));
      list.append(row);
    }
    body.append(list);
    if (intake.batch.length > 8) body.append(element("p", "status-text", "그 외 " + (intake.batch.length - 8) + "건"));
    const field = element("label", "field", "한 프로젝트에 모으기");
    const project = element("input");
    project.setAttribute("list", "saved-projects");
    project.placeholder = "비워두면 가져온 프로젝트를 사용합니다.";
    project.maxLength = 160;
    project.value = state.project;   // 프로젝트를 골라 둔 채 넣으면 그 프로젝트로
    field.append(project);
    body.append(field);
    foot.append(button("대화 " + intake.batch.length.toLocaleString("ko-KR") + "건 저장", "primary-button", event => saveBatch(project.value, event.currentTarget)));
  }
  const warnings = element("p", "status-text", intake.warnings.join("\n"));
  warnings.id = "intake-status";
  warnings.setAttribute("role", "status");
  body.append(warnings);
}

// TOP 100 선택창: 검색·분류로 고르고, 고른 서비스의 저장 방법(자동 / 내보내기 파일 / 붙여넣기)을 보여 준다
function drawServicePicker(title, subtitle, body, foot) {
  title.textContent = "AI 서비스 고르기";
  subtitle.textContent = "많이 쓰는 AI 100곳입니다. 내가 쓰는 AI 는 저절로 골라 맨 앞에 모아 둡니다.";
  foot.append(button("다른 방법", "secondary-button", () => openIntake("choice")));
  const search = element("input", "service-search");
  search.type = "search";
  search.placeholder = "서비스 이름 검색 (예: Perplexity, Midjourney)";
  search.setAttribute("aria-label", "AI 서비스 이름 검색");
  search.value = intake.serviceQuery || "";
  const chips = element("div", "service-chips");
  chips.setAttribute("role", "group");
  chips.setAttribute("aria-label", "AI 서비스 분류");
  const list = element("div", "service-list");
  const mine = usedServices();
  if (intake.serviceGroup === undefined || intake.serviceGroup === null) intake.serviceGroup = mine.length ? "mine" : "";
  const draw = () => {
    const word = normalized(search.value.trim());
    const pool = intake.serviceGroup === "mine" && !word ? mine.map(id => serviceById.get(id)) : aiServices;
    const shown = pool.filter(service => (!intake.serviceGroup || intake.serviceGroup === "mine" || service.group === intake.serviceGroup)
      && (!word || normalized(service.name + " " + service.id + " " + serviceGroups[service.group]).includes(word)));
    list.replaceChildren(...shown.map(service => {
      const item = button("", "service-item", () => { intake.service = service.id; openIntake("service"); });
      item.dataset.source = service.source;
      const used = state.records.filter(record => (record.service || record.source) === service.id).length;
      item.append(element("span", "service-rank", String(service.rank)), element("strong", "service-name", service.name),
        element("span", "service-group", serviceGroups[service.group]),
        element("span", "service-method is-" + service.method, methodNames[service.method]));
      if (used) item.append(element("span", "service-used", used.toLocaleString("ko-KR") + "건"));
      else if (mine.includes(service.id)) item.append(element("span", "service-used", "쓰는 중"));
      return item;
    }));
    if (!shown.length) list.append(element("p", "status-text", intake.serviceGroup === "mine"
      ? "아직 알아본 AI 가 없습니다. 자동 저장 확장을 깔고 AI 웹사이트를 쓰면 여기에 저절로 모입니다."
      : "찾는 서비스가 없으면 「기타」로 붙여넣어 저장하세요."));
  };
  for (const [key, label] of [["mine", "내가 쓰는 AI" + (mine.length ? " " + mine.length : "")], ["", "전체"], ...Object.entries(serviceGroups)]) {
    const chip = button(label, "service-chip" + ((intake.serviceGroup || "") === key ? " is-active" : ""), () => {
      intake.serviceGroup = key;
      chips.querySelectorAll(".service-chip").forEach(other => other.classList.toggle("is-active", other === chip));
      draw();
    });
    chips.append(chip);
  }
  search.addEventListener("input", () => { intake.serviceQuery = search.value; draw(); });
  draw();
  body.append(search, chips, list,
    element("p", "service-note", "순위: a16z 「Top 100 Gen AI Consumer Apps」 6판(2026년 1월 자료) 웹 순위에서 성인용 대화앱을 뺀 46곳, 이 앱이 자동으로 읽는 코딩 AI 3곳 · Microsoft Copilot, 같은 판 모바일 순위 32곳, 많이 쓰는 AI 보충 18곳(뤼튼·라이너·클로바노트 등). 「쓰는 중」은 자동 저장 확장이 이 PC 의 Chrome 에서 알아본 AI 입니다."));
  setTimeout(() => search.focus(), 0);
}

const serviceTips = {
  image: "만든 그림의 지시문(프롬프트), 고친 내용, 결과 링크를 붙여 넣어 두면 나중에 같은 그림을 다시 만들 때 찾기 쉽습니다.",
  media: "영상·음악·음성을 만든 지시문과 설정, 결과 링크를 붙여 넣어 두세요. 받아쓰기 결과는 글 전체를 붙여 넣으면 됩니다.",
  code: "만든 코드나 요청한 내용, 결과 화면 주소를 붙여 넣어 두세요.",
};
function drawServiceGuide(title, subtitle, body, foot) {
  const service = serviceById.get(intake.service) || serviceById.get("copilot");
  title.textContent = service.name;
  subtitle.textContent = `${service.rank}위 · ${serviceGroups[service.group]} · 저장 방법: ${methodNames[service.method]}`;
  foot.append(button("목록으로", "secondary-button", () => openIntake("services")));
  const steps = element("ol", "service-steps");
  const add = text => steps.append(element("li", "", text));
  if (service.method === "auto") {
    add(`${service.name} 의 대화 파일은 PC 에 남아서 휴대폰이 직접 찾을 수 없습니다.`);
    add("PC 판 AI 대화서랍에서 「내 PC 대화 찾기」로 모은 뒤 「백업 내보내기」로 파일을 받으세요.");
    add("그 백업 파일을 폰으로 보내고 여기서 「파일 가져오기」로 고르면 됩니다. 같은 대화는 두 번 들어가지 않습니다.");
    body.append(steps);
    foot.append(button("파일 가져오기", "primary-button", () => openIntake("file"), "upload"));
    return;
  }
  if (fileMethod(service.method)) {
    if (service.method === "web") {
      // 웹 대화 자동 저장: Chrome 확장(확장프로그램 폴더)이 대화 화면의 글을 서랍으로 보낸다
      add(`휴대폰판은 ${service.name} 대화를 저절로 저장하지 않습니다. PC 판 자동 저장으로 모은 대화는 백업 파일로 옮겨 올 수 있습니다.`);
      add("이 폰에서 바로 넣으려면 아래처럼 내보내기 ZIP 을 받아 넣으세요.");
    }
    if (service.id === "chatgpt") {
      add("ChatGPT 에서 설정 → 데이터 제어 → 데이터 내보내기를 누릅니다.");
      add("메일로 온 링크에서 ZIP 파일을 받습니다.");
    } else if (service.id === "gemini") {
      add("Google 테이크아웃에서 「내 활동」 → Gemini 앱만 골라 내보냅니다.");
      add("받은 ZIP 파일을 그대로 씁니다.");
    } else {
      add("claude.ai 에서 설정 → 개인정보 → 데이터 내보내기를 누릅니다.");
      add("메일로 온 링크에서 ZIP 파일을 받습니다.");
    }
    add("아래 「파일 고르기」로 ZIP 을 넣으면 대화가 하나씩 카드로 나뉩니다.");
  } else {
    add(`${service.name} 대화(작업) 화면에서 남기고 싶은 내용을 모두 선택해 복사합니다.`);
    add("「붙여넣기 창 열기」를 눌러 붙여 넣고 제목·프로젝트를 적어 저장합니다.");
    add("질문 앞에 「나:」, 답 앞에 「AI:」를 붙이면 말풍선이 나뉘어 보입니다.");
    add("내용을 .md · .txt 파일로 저장해 두었다면 「파일 고르기」로 한꺼번에 넣어도 됩니다.");
  }
  body.append(steps);
  if (serviceTips[service.group]) body.append(element("p", "service-tip", serviceTips[service.group]));
  if (service.id === "chatgpt" || service.id === "gemini") {
    const links = element("p", "import-help");
    links.append(service.id === "chatgpt"
      ? externalLink("ChatGPT 내보내기 안내", "https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data")
      : externalLink("Gemini 내보내기 안내", "https://support.google.com/gemini/answer/16920332?hl=ko"));
    body.append(links);
  }
  const input = element("input");
  input.type = "file";
  input.multiple = true;
  input.accept = ".zip,.json,.jsonl,.html,.htm,.md,.txt";
  input.hidden = true;
  input.addEventListener("change", () => importFiles([...input.files], fileMethod(service.method) ? "auto" : service.source, service.id));
  body.append(input);
  const status = element("p", "status-text", intake.warnings.join("\n"));
  status.id = "intake-status";
  status.setAttribute("role", "status");
  body.append(status);
  foot.append(button("파일 고르기", service.method === "export" || service.method === "web" ? "primary-button" : "secondary-button", () => input.click(), "upload"));
  if (service.method === "paste") foot.append(button("붙여넣기 창 열기", "primary-button", () => openEditor(null, service.id), "paste"));
}

async function discoverLocal() {
  try {
    intake.local = (await api("api/local")).sources;
  } catch (error) {
    intake.local = [];
    intake.warnings = [error.message];
  }
  if (intake.mode === "local" && $("#intake").open) drawIntake();
}

async function readImport(getResult) {
  if (intake.busy) return;
  intake.busy = true;
  const controls = [...$("#intake").querySelectorAll("button")].filter(button => !button.disabled);
  controls.forEach(button => { button.disabled = true; });
  $("#intake-status").textContent = "대화 파일을 읽는 중입니다.";
  try {
    const result = await getResult();
    intake.batch = [...new Map(result.records.map(record => [record.id, record])).values()];
    intake.warnings = result.warnings || [];
    if (intake.batch.length) intake.mode = "preview";
    else if (!intake.warnings.length) intake.warnings = ["가져올 대화를 찾지 못했습니다."];
  } catch (error) {
    intake.warnings = [error.message];
  } finally {
    intake.busy = false;
    controls.forEach(button => { button.disabled = false; });
    drawIntake();
  }
}

function importLocal(source) {
  return readImport(async () => {
    const params = new URLSearchParams({ source, limit: "50", offset: String(intake.offsets[source] || 0) });
    const result = await api("api/local?" + params, { method: "POST" });
    if (result.nextOffset != null) intake.offsets[source] = result.nextOffset;
    else if (result.total != null) intake.offsets[source] = result.total;
    return result;
  });
}

function importFiles(files, source, serviceId = "") {
  if (!files.length) return;
  const service = serviceById.get(serviceId);
  return readImport(async () => {
    const result = { records: [], warnings: [] };
    for (const file of files) {
      const params = new URLSearchParams({ name: file.name, source });
      try {
        const parsed = await api("api/import?" + params, { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: file });
        // TOP 100 에서 고른 서비스면 이름표(service)를 붙인다. 내보내기 파일은 읽어 보니 다른 AI 것이면 붙이지 않는다
        result.records.push(...(service ? parsed.records.map(record => fileMethod(service.method) && record.source !== service.source
          ? record : { ...record, source: fileMethod(service.method) ? record.source : service.source, service: service.id }) : parsed.records));
        result.warnings.push(...(parsed.warnings || []));
      } catch (error) {
        result.warnings.push(file.name + " — " + error.message);
      }
    }
    return result;
  });
}

async function saveBatch(project, control) {
  control.disabled = true;
  const selected = project.trim();
  const batch = intake.batch;
  try {
    await updateArchive(records => {
      const merged = new Map(records.map(record => [record.id, record]));
      for (const item of batch) {
        const previous = merged.get(item.id);
        const record = previous ? { ...item, ...previous,
          messages: item.messages.length >= previous.messages.length ? item.messages : previous.messages,
          thumbnail: previous.thumbnail || item.thumbnail || "",
        } : item;
        merged.set(item.id, selected ? { ...record, project: selected } : record);
      }
      return [...merged.values()];
    });
    $("#intake").close();
    revealRecords();
    notify("대화 " + batch.length.toLocaleString("ko-KR") + "건을 확인해 저장했습니다.");
  } catch (error) {
    $("#intake-status").textContent = error.message;
  } finally {
    control.disabled = false;
  }
}

function revealRecords() {
  Object.assign(state, { date: "", query: "" });
  $("#search").value = "";
  $("#date-filter").value = "";
  selectLibrary({});
}

function backup() {
  if (!state.records.length) {
    notify("백업할 대화가 없습니다.");
    return;
  }
  const file = new Blob([JSON.stringify({ format: "blue-chat-archive", records: state.records })], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = element("a");
  link.href = url;
  link.download = "AI 대화서랍 " + today() + ".json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function refreshSync() {
  try {
    const info = await api("api/sync");
    const changed = JSON.stringify(info) !== JSON.stringify(syncInfo);
    const usedChanged = JSON.stringify(info.used || {}) !== JSON.stringify(syncInfo?.used || {});
    syncInfo = info;
    if (usedChanged && state.ready) render();
    $("#sync-note").textContent = (window.PhoneSync && PhoneSync.note) || "이 폰에만 저장";
    $("#sync-note").title = window.PhoneSync && PhoneSync.active ? "눌러서 집 PC 와 대화를 맞춥니다." : "대화는 이 폰의 브라우저에만 있습니다. 눌러서 백업 안내를 보세요.";
    if (state.ready && Number.isInteger(info.version) && info.version > state.version) {
      await writeQueue;
      const next = await api("api/archive");
      if (next.version > state.version) {
        state.records = next.records;
        state.version = next.version;
        render();
      }
    }
    if (changed && $("#intake").open && intake.mode === "sync") drawIntake();
  } catch {
    // The archive remains usable when sync is unavailable.
  }
}

for (const target of document.querySelectorAll("[data-icon]")) {
  const glyph = icon(target.dataset.icon);
  if (target.classList.length) glyph.classList.add(...target.classList);   // brand-mark 처럼 붙어 있던 이름을 살림(로고 칸 배경)
  target.replaceWith(glyph);
}
for (const tab of document.querySelectorAll("[data-view]")) tab.addEventListener("click", () => { state.view = tab.dataset.view; render(true); });
for (const closer of document.querySelectorAll("[data-close]")) closer.addEventListener("click", () => document.getElementById(closer.dataset.close).close());
$("#intake").addEventListener("cancel", event => { if (intake.busy) event.preventDefault(); });
$("#add-button").addEventListener("click", () => openIntake("choice"));
$("#find-file").addEventListener("click", () => openIntake("file"));
$("#backup-button").addEventListener("click", backup);
$("#open-sync").addEventListener("click", () => window.PhoneSync && PhoneSync.active ? PhoneSync.run(true) : notify("대화는 이 폰에만 저장됩니다. 폰을 바꾸거나 브라우저 데이터를 지우면 사라지니 「백업 내보내기」로 파일을 받아 폰 밖에도 두세요."));
$("#toggle-demo").addEventListener("click", () => { state.showExamples = !state.showExamples; revealRecords(); });
// 메뉴를 서랍식으로: 넓은 화면은 서랍을 밀어 넣고 빼며(상태 기억), 좁은 화면은 위에 덮는 서랍. 칸(보관함 · AI 서비스 · 프로젝트)도 접었다 폄
$("#select-toggle").addEventListener("click", () => setSelecting(!selection.on));
$("#select-cancel").addEventListener("click", () => setSelecting(false));
$("#select-all").addEventListener("click", () => {
  for (const card of document.querySelectorAll(".record-card.is-selectable")) toggleSelected(card.dataset.id, card, true);
});
$("#select-delete").addEventListener("click", () => deleteRecords(new Set(selection.ids)));
const wide = window.matchMedia("(min-width: 781px)");
const remember = (key, value) => { try { localStorage.setItem(key, value); } catch { /* 저장 못 해도 동작 */ } };
const recall = key => { try { return localStorage.getItem(key); } catch { return null; } };
function syncDrawerButton() {
  const shell = $(".app-shell");
  const open = wide.matches ? !shell.classList.contains("is-side-closed") : shell.classList.contains("is-menu-open");
  $("#mobile-menu").setAttribute("aria-expanded", String(open));
  $("#mobile-menu").setAttribute("aria-label", open ? "메뉴 서랍 닫기" : "메뉴 서랍 열기");
  $("#mobile-menu").title = open ? "메뉴 서랍 닫기" : "메뉴 서랍 열기";
}
function toggleDrawer() {
  const shell = $(".app-shell");
  if (wide.matches) remember("aiDrawer.side", shell.classList.toggle("is-side-closed") ? "closed" : "open");
  else shell.classList.toggle("is-menu-open");
  syncDrawerButton();
}
if (recall("aiDrawer.side") === "closed") $(".app-shell").classList.add("is-side-closed");
$("#mobile-menu").addEventListener("click", toggleDrawer);
$("#side-close").addEventListener("click", () => { if (wide.matches) toggleDrawer(); else { closeMenu(); syncDrawerButton(); } });
$(".app-shell").addEventListener("click", event => { if (event.target === event.currentTarget && !wide.matches) { closeMenu(); syncDrawerButton(); } });
document.addEventListener("keydown", event => { if (event.key === "Escape" && $(".app-shell").classList.contains("is-menu-open")) { closeMenu(); syncDrawerButton(); } });
wide.addEventListener("change", () => { closeMenu(); syncDrawerButton(); });
syncDrawerButton();
for (const caption of document.querySelectorAll(".sidebar .side-caption")) {
  const row = caption.parentElement.classList.contains("side-caption-row") ? caption.parentElement : caption;   // 「새 프로젝트」 단추와 한 줄
  const body = row.nextElementSibling;
  if (!body) continue;
  const key = "aiDrawer.fold." + caption.textContent.trim();
  const head = element("button", "side-caption drawer-head");
  head.type = "button";
  head.append(element("span", "", caption.textContent.trim()), icon("chev"));
  const set = open => { body.hidden = !open; head.setAttribute("aria-expanded", String(open)); };
  set(recall(key) !== "closed");
  head.addEventListener("click", () => { const open = body.hidden; set(open); remember(key, open ? "open" : "closed"); });
  caption.replaceWith(head);
}
$("#search").addEventListener("input", event => { state.query = event.target.value; render(true); });
$("#date-filter").addEventListener("change", event => { state.date = event.target.value; render(true); });
$("#clear-date").addEventListener("click", () => { $("#date-filter").value = ""; state.date = ""; render(true); });
$("#sort-order").addEventListener("change", event => { state.order = event.target.value; render(true); });
$("#show-more").addEventListener("click", () => { state.limit += 60; render(); });
document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !document.querySelector("dialog[open]")) {
    event.preventDefault();
    $("#search").focus();
  }
});
$("#entry-image").addEventListener("change", async event => {
  const target = entry;
  const file = event.target.files[0];
  if (!file) return;
  const save = $("#entry-form button[type=submit]");
  save.disabled = true;
  try {
    const image = await shrinkImage(file);
    if (entry !== target) return;
    entry.thumbnail = image;
    renderImageEdit();
    $("#editor-status").textContent = "";
  } catch (error) {
    $("#editor-status").textContent = error.message;
  } finally {
    save.disabled = false;
  }
});
fillServiceSelect();
$("#new-project").addEventListener("click", openNewProject);
// 붙여넣기 창: 원래 주소(링크)를 넣으면 그 주소로 AI 서비스 칸을 저절로 고른다
$("#entry-link").addEventListener("input", () => {
  const found = serviceFromLink($("#entry-link").value.trim());
  if (found) $("#entry-source").value = found;
});

$("#entry-form").addEventListener("submit", async event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const title = data.get("title").trim();
  const transcript = data.get("transcript").trim();
  const status = $("#editor-status");
  const control = event.submitter;
  const link = data.get("link").trim();
  const messages = entry.record?.messages || pasteMessages(transcript);
  if (!title || !messages.length || (!entry.record && !transcript)) {
    status.textContent = "제목과 대화 원문을 입력해 주세요.";
    return;
  }
  if (link && !externalLink("", link)) {
    status.textContent = "원본 링크는 https 또는 http 주소를 입력해 주세요.";
    return;
  }
  const original = entry.record;
  const picked = serviceById.get(data.get("source"));   // 칸 값은 서비스 id → 원래 분류(source) + 이름표(service)
  const metadata = {
    title, project: data.get("project").trim() || "미분류", date: data.get("date"), source: picked?.source || "other",
    service: picked && picked.id !== picked.source ? picked.id : "",
    link, summary: data.get("summary").trim(), thumbnail: entry.thumbnail,
  };
  const id = original?.id || crypto.randomUUID();
  control.disabled = true;
  try {
    await updateArchive(records => original
      ? records.map(record => record.id === id ? { ...record, ...metadata } : record)
      : [{ id, ...metadata, messages }, ...records]);
    $("#editor").close();
    if (original) openDetail(id);
    else revealRecords();
    notify("대화를 저장했습니다.");
  } catch (error) {
    status.textContent = error.message;
  } finally {
    control.disabled = false;
  }
});

Promise.all([loadArchive(), refreshTrash()]).catch(error => { state.error = error.message; state.showExamples = false; }).finally(() => {
  render();
  refreshSync();
});
setInterval(refreshSync, 12000);
