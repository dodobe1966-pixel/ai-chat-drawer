"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const sources = {
  chatgpt: "ChatGPT", claude: "Claude Code", gemini: "Gemini", codex: "Codex", other: "Other",
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

const serviceGroups = {
  chat: "Chat AI", write: "Writing & study", search: "Search & agents", image: "Images & photos",
  media: "Video, music & voice", code: "Coding", character: "Character chat",
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
  ["adot", "A. (A-dot)", "chat"], ["higgsfield", "Higgsfield", "media"], ["cursor", "Cursor", "code"],
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
  ["beautycam", "BeautyCam", "image"], ["papago", "Papago", "write"], ["brainly", "Brainly", "write"], ["ai-mirror", "AI Mirror", "image"],
  ["mivi", "MIVI", "media"], ["snow", "SNOW", "image"], ["vivacut", "VivaCut", "media"], ["beautyplus", "BeautyPlus", "image"],
  ["wrtn", "Wrtn", "chat"], ["liner", "Liner", "search"], ["clova-note", "Clova Note", "media"], ["zeta", "Zeta", "character"],
  ["le-chat", "Mistral Le Chat", "chat"], ["venice", "Venice", "chat"], ["openevidence", "OpenEvidence", "search"], ["deepl", "DeepL", "write"],
  ["figma", "Figma AI", "image"], ["leonardo", "Leonardo.Ai", "image"], ["ideogram", "Ideogram", "image"], ["runway", "Runway", "media"],
  ["github-copilot", "GitHub Copilot", "code"], ["windsurf", "Windsurf", "code"], ["replit", "Replit", "code"], ["v0", "v0", "code"],
  ["bolt", "Bolt", "code"], ["base44", "Base44", "code"],
].map(([id, name, group, source = "other", method = "paste"], index) => ({ rank: index + 1, id, name, group, source, method }));
const serviceById = new Map(aiServices.map(service => [service.id, service]));
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
function usedServices() {
  const used = new Map(Object.entries(syncInfo?.used || {}).filter(([id]) => serviceById.has(id)).map(([id, info]) => [id, info.last || ""]));
  for (const record of state.records) {
    const id = serviceById.has(record.service) ? record.service : serviceById.has(record.source) ? record.source : "";
    if (id && (!used.has(id) || used.get(id) < record.date)) used.set(id, record.date || "");
  }
  return [...used].sort((a, b) => b[1].localeCompare(a[1])).map(([id]) => id);
}
const methodNames = { auto: "Auto", web: "Auto (extension)", export: "Export file", paste: "Paste" };
const fileMethod = method => method === "export" || method === "web";
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
  ["claude", "Fixing the save button in a budget app", "Budget app", "2026-11-22",
    "Found why the list didn’t update after saving and fixed the save order.",
    "Sometimes the list doesn’t change after I hit Save. Where should I start looking?",
    "First check whether the list is reloaded after the save finishes. Swapping the order of the save request and the list refresh often fixes it."],
  ["chatgpt", "4-day trip to Jeju", "Family trip", "2026-11-22",
    "Replanned the day around rainy-day spots and travel time.",
    "Four days in Jeju with two kids. I want to keep travel short.",
    "I suggest staying in one place on the east side and keeping each day within a 40-minute drive. If it rains, switch to an indoor aquarium and an art museum."],
  ["gemini", "Polishing a blog intro", "Blog", "2026-11-21",
    "Shortened the first paragraph and put what the reader gets right up front.",
    "People told me my first three lines are too long.",
    "Use the first sentence to say in one line what readers will learn, and move the background to the second paragraph."],
  ["codex", "Spreadsheet cleanup script", "Budget app", "2026-11-21",
    "Made a script that merges monthly expense files and totals each category.",
    "I want to merge my separate monthly expense files in one go.",
    "It reads each file in the folder, joins them into one table, then groups by category and adds up the totals."],
  ["gemini", "English speaking study plan", "Study", "2026-11-20",
    "Set up a 4-week speaking practice plan at 20 minutes a day.",
    "I want to practice speaking English for just 20 minutes after work.",
    "Split it by situation: week one is introducing yourself and your day, week two is restaurants and asking for directions. Record yourself every day and listen back."],
  ["chatgpt", "Moving checklist", "Life", "2026-11-20",
    "Listed everything to do from two weeks before the move to moving day, in date order.",
    "I’m moving next month and worried I’ll forget something.",
    "I’ll make you a dated list: address registration, moving your internet, settling building fees, and stopping and starting gas service."],
].map(([source, title, project, date, summary, user, assistant], index) => ({
  id: "example-" + index, source, title, project, date, summary, example: true,
  messages: [{ role: "user", text: user }, { role: "assistant", text: assistant }],
}));

const state = {
  records: [], version: null, ready: false, error: "", showExamples: true, view: "date",
  source: "", service: "", project: "", favorites: false, customProjects: [], date: "", order: "new", query: "", limit: 60,
};
const intake = { mode: "choice", batch: [], warnings: [], offsets: {}, totals: {}, local: null, busy: false,
  service: "", serviceQuery: "", serviceGroup: null };
let syncInfo = null;
let detailId = null;
let entry = null;
let toastTimer;
let writeQueue = Promise.resolve();
const searchedText = new WeakMap();
const koreanDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric", weekday: "long",
});

function today() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return ["year", "month", "day"].map(key => parts.find(part => part.type === key).value).join("-");
}

function fullDate(value) {
  const date = new Date(value + "T00:00:00+09:00");
  return isNaN(date) ? "Unknown date" : koreanDate.format(date).replace(/\. /g, " ").replace(/\.$/, "");
}

function shortDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.replaceAll("-", ".") : "Unknown date";
}

function normalized(value) {
  return value.normalize("NFKC").toLocaleLowerCase("ko");
}

function projectOf(record) {
  return record.project || "Unsorted";
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
const hiddenExamples = new Set();

function mapCount(records, key) {
  const counts = new Map();
  for (const record of records) counts.set(key(record), (counts.get(key(record)) ?? 0) + 1);
  return counts;
}

function navItem(label, glyph, count, active, handler, source) {
  const item = button(label, "nav-item" + (active ? " is-active" : ""), handler, glyph || sourceIcons[source] || "dots");
  item.firstChild.classList.add("nav-tile");
  item.firstChild.dataset.glyph = glyph || "source";
  if (source) item.firstChild.dataset.source = source;
  const text = [...item.childNodes].find(node => node.nodeType === 3);
  if (text) { const span = element("span", "nav-label", text.textContent); span.title = text.textContent; text.replaceWith(span); }
  item.append(element("span", "nav-count", count.toLocaleString("en-US")));
  item.setAttribute("aria-pressed", String(active));
  return item;
}

function closeMenu() {
  $(".app-shell").classList.remove("is-menu-open");
  $("#mobile-menu").setAttribute("aria-expanded", "false");
  $("#mobile-menu").setAttribute("aria-label", "Open menu");
}

function selectLibrary(filters) {
  Object.assign(state, { favorites: false, project: "", source: "", service: "" }, filters);
  closeMenu();
  render(true);
  $("#records-heading").focus({ preventScroll: true });
}

function renderNavigation(records) {
  $("#library-nav").replaceChildren(
    navItem("All conversations", "all", records.length, !state.favorites && !state.project && !state.source && !state.service, () => selectLibrary({})),
    navItem("Favorites", "star", records.filter(record => record.favorite).length, state.favorites, () => selectLibrary({ favorites: true })),
    navItem("Trash", "trash", trash.items.length, false, openTrash),
  );
  serviceMenu = usedServiceEntries(records);
  const chosen = serviceMenu.find(item => item.active);
  const trigger = navItem(chosen ? chosen.label : "All AI services", chosen ? null : "all", serviceMenu.length, Boolean(chosen),
    event => { event.stopPropagation(); toggleServicePopover(); }, chosen?.icon);
  trigger.id = "service-trigger";
  trigger.classList.add("service-trigger");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", String(!$("#service-popover").hidden));
  trigger.querySelector(".nav-count").title = "In use: " + serviceMenu.length + " AIs";
  const chev = icon("chev");
  chev.classList.add("service-chev");
  trigger.append(chev);
  $("#source-nav").replaceChildren(trigger);
  if (!$("#service-popover").hidden) drawServicePopover();
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
    $("#project-nav").append(button("See all projects", "nav-item text-button", () => selectLibrary({ view: "project" }), "folder"));
  }
  if (!projects.length) $("#project-nav").append(element("p", "project-empty", "Make a project with “New project” and it will show up here."));
  $("#saved-projects").replaceChildren(...[...new Set([...state.customProjects, ...state.records.map(projectOf)])].sort().map(project => {
    const option = element("option");
    option.value = project;
    return option;
  }));
}

let serviceMenu = [];
document.body.append($("#service-popover"));
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
  list.append(navItem("All AI services", "all", state.records.length, !state.source && !state.service && !state.favorites && !state.project,
    () => { closeServicePopover(); selectLibrary({}); }));
  for (const item of serviceMenu) {
    list.append(navItem(item.label, null, item.count, item.active, () => { closeServicePopover(); selectLibrary(item.filter); }, item.icon));
  }
  const head = element("div", "service-pop-head");
  head.append(element("strong", "", "My AIs"), element("span", "", serviceMenu.length + " AIs"));
  box.replaceChildren(head, list);
  if (!serviceMenu.length) box.append(element("p", "service-pop-empty", "No AIs yet. Add a conversation or install the auto-save extension, and the AIs you use will gather here on their own."));
  box.append(button("Find other AIs (Top 100)", "service-pop-more", () => { closeServicePopover(); openIntake("services"); }, "plus"));
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
  image.alt = record.title + " thumbnail";
  image.loading = "lazy";
  return image;
}

function projectCover(project) {
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
  $("#select-count").textContent = selection.ids.size.toLocaleString("en-US") + " selected";
  $("#select-delete").disabled = !selection.ids.size;
}
function askDelete(count) {
  const dialog = $("#confirm-delete");
  $("#confirm-title").textContent = `${count.toLocaleString("en-US")} conversation(s) will be deleted. OK?`;
  dialog.returnValue = "";
  dialog.showModal();
  dialog.querySelector(".secondary-button").focus();
  return new Promise(resolve => dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true }));
}
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
  return hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h left` : `${hours}h left`;
}
async function openTrash() {
  closeMenu();
  await refreshTrash();
  const body = $("#trash-body");
  const foot = $("#trash-foot");
  body.replaceChildren();
  foot.replaceChildren();
  if (!trash.items.length) {
    body.append(element("p", "trash-empty", `No conversations deleted in the last ${trash.days} days.`));
  } else {
    const list = element("ul", "trash-list");
    for (const item of trash.items) {
      const row = element("li", "trash-row");
      const info = element("div", "trash-info");
      const meta = element("div", "trash-meta");
      meta.append(sourceBadge(item.source, item.service), element("span", "", item.project || "Unsorted"), element("span", "trash-left", timeLeft(item.expiresAt)));
      info.append(element("strong", "trash-name", item.title || "Untitled"), meta);
      row.append(info, button("Restore", "secondary-button", () => restoreRecords([item.id]), "upload"));
      list.append(row);
    }
    body.append(list);
    foot.append(button(`Restore all (${trash.items.length.toLocaleString("en-US")})`, "primary-button", () => restoreRecords(trash.items.map(item => item.id)), "upload"));
  }
  if (!$("#trash").open) $("#trash").showModal();
}
async function restoreRecords(ids) {
  try {
    const result = await api("api/trash/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    await loadArchive();
    await refreshTrash();
    render();
    notify(result.restored ? `${result.restored.toLocaleString("en-US")} conversation(s) restored.` : "Nothing to restore.");
    if ($("#trash").open) openTrash();
  } catch (error) {
    notify(error.message);
  }
}

async function deleteRecords(ids) {
  if (ids.size && [...ids].every(id => id.startsWith("example-"))) {
    for (const id of ids) hiddenExamples.add(id);
    notify(`Hid ${ids.size.toLocaleString("en-US")} sample conversation(s). When you delete your own conversations, they go to the trash and can be restored within 3 days.`);
    setSelecting(false);
    return true;
  }
  if (!ids.size || !(await askDelete(ids.size))) return false;
  try {
    await updateArchive(records => records.filter(record => !ids.has(record.id)));
    await refreshTrash();
    render();
    notify(`${ids.size.toLocaleString("en-US")} conversation(s) deleted. You can restore them from the trash within ${trash.days} days.`);
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
  cover.setAttribute("aria-label", record.title + " – open conversation");
  if (record.thumbnail) {
    const image = coverImage(record);
    image.addEventListener("error", () => image.replaceWith(coverPlaceholder(record)), { once: true });
    cover.append(image);
  } else {
    cover.append(coverPlaceholder(record));
  }
  const star = button("", "card-favorite" + (record.favorite ? " is-active" : ""),
    () => record.example ? notify("Add your own conversations to use favorites.") : toggleFavorite(record.id), "star");
  star.setAttribute("aria-label", record.favorite ? "Unfavorite" : "Add to favorites");
  star.setAttribute("aria-pressed", String(Boolean(record.favorite)));
  const body = element("div", "card-body");
  const meta = element("div", "card-meta");
  meta.append(sourceBadge(record.source, record.service), element("time", "card-date", shortDate(record.date)));
  const title = element("h4");
  title.append(button(record.title, "card-title", () => openDetail(record.id)));
  const project = button(projectOf(record), "card-project", () => selectLibrary({ project: projectOf(record), view: "date" }), "folder");
  body.append(meta, title, element("p", "card-summary", summaryOf(record)), project);
  card.append(cover, star, body);
  if (selection.on) {
    const check = element("label", "card-check");
    const box = element("input");
    box.type = "checkbox";
    box.checked = selection.ids.has(record.id);
    box.setAttribute("aria-label", record.title + " optional");
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
    ? "Add a real conversation to see your own history." : "Show the samples to look around the app.";
  $("#toggle-demo").textContent = state.showExamples ? "Hide samples" : "Show samples";
  $("#records-heading").textContent = state.favorites ? "Favorites" : (state.project || serviceById.get(state.service)?.name || sources[state.source] || "All conversations");
  $("#load-status").textContent = state.error || (state.ready ? "" : "Loading your conversations…");
  for (const tab of document.querySelectorAll("[data-view]")) {
    const active = tab.dataset.view === state.view;
    tab.setAttribute("aria-pressed", String(active));
    tab.classList.toggle("is-active", active);
  }
  $("#date-label").textContent = state.date ? shortDate(state.date) : "Pick a date";
  $("#clear-date").hidden = !state.date;
  const matched = matchingRecords(records);
  $("#view-count").textContent = matched.length.toLocaleString("en-US") + " items";
  const timeline = $("#timeline");
  timeline.replaceChildren();
  $("#show-more").hidden = matched.length <= state.limit;
  if (!matched.length && state.project && !state.query && !state.date && !state.source && !state.service && !state.favorites) {
    const empty = element("section", "empty-state");
    empty.append(icon("folder"), element("h3", "", `“${state.project}” has no conversations yet.`),
      element("p", "", "When you add a conversation, this name will already be filled in as the project."),
      button("Add to this project", "primary-button", () => openIntake("choice"), "plus"));
    timeline.append(empty);
    return;
  }
  if (!matched.length) {
    const empty = element("section", "empty-state");
    const filtering = state.query || state.source || state.service || state.date || state.project || state.favorites;
    empty.append(icon(filtering ? "search" : "library"),
      element("h3", "", filtering ? "No matching conversations." : "No saved conversations yet."),
      element("p", "", filtering ? "Try other search words, or check the date and project you picked." : "Import an exported chat file or a backup from the PC version, and they’ll show up here."));
    empty.append(filtering ? button("Clear filters", "secondary-button", () => {
      Object.assign(state, { date: "", query: "" });
      $("#search").value = "";
      $("#date-filter").value = "";
      selectLibrary({});
    }) : button("Add chat", "primary-button", () => openIntake("choice"), "plus"));
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
      element("span", "group-count", totals.get(key).toLocaleString("en-US") + " items"));
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
    const error = new Error(value.error || value.message || "Something went wrong. (" + response.status + ")");
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
  input.placeholder = "Project name (e.g. Home budget)";
  input.setAttribute("aria-label", "New project name");
  input.required = true;
  const ok = element("button", "primary-button", "Create");
  ok.type = "submit";
  const cancel = button("Cancel", "ghost-button", () => form.remove());
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
      notify(exists ? `“${name}”: moved to this project.` : `“${name}”: project created.`);
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
  if (message.role === "user") return "Me";
  if (message.role === "assistant") return sources[record.source] || "AI";
  return "Full conversation";
}

function openDetail(id) {
  const record = recordById(id);
  if (!record) return;
  detailId = id;
  $("#detail-title").textContent = record.title;
  const badges = [sourceBadge(record.source, record.service), element("span", "", fullDate(record.date)), element("span", "", projectOf(record))];
  if (record.origin) badges.push(element("span", "", record.origin));
  if (record.example) badges.push(element("span", "", "Sample conversations"));
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
  const original = externalLink("Open original", record.link, "secondary-button");
  if (original) buttons.append(original);
  buttons.append(button("Copy text", "secondary-button", async () => {
    try {
      await navigator.clipboard.writeText(record.messages.map(message => messageLabel(message, record) + "\n" + message.text).join("\n\n"));
      notify("Conversation copied.");
    } catch {
      notify("Please select the text and copy it yourself.");
    }
  }, "copy"));
  if (!record.example) {
    buttons.append(button("Delete", "danger-button detail-delete", async () => {
      if (await deleteRecords(new Set([id])) && $("#detail").open) $("#detail").close();
    }, "trash"),
      button(record.favorite ? "Unfavorite" : "Favorites", "secondary-button", () => toggleFavorite(id), "star"),
      button("Edit", "primary-button", () => openEditor(record), "edit"));
  }
  if (!$("#detail").open) $("#detail").showModal();
  body.scrollTop = 0;
}

function fillServiceSelect() {
  const select = $("#entry-source");
  const option = (value, label) => { const item = element("option", "", label); item.value = value; return item; };
  const groups = Object.entries(serviceGroups).map(([key, label]) => {
    const group = element("optgroup");
    group.label = label;
    group.append(...aiServices.filter(service => service.group === key).map(service => option(service.id, service.name)));
    return group;
  });
  select.replaceChildren(...groups, option("other", "Other"));
}

function openEditor(record = null, serviceId = "") {
  if ($("#intake").open) $("#intake").close();
  if ($("#detail").open) $("#detail").close();
  entry = { record, thumbnail: record?.thumbnail || "" };
  const form = $("#entry-form");
  form.reset();
  $("#editor-title").textContent = record ? "Edit conversation" : "Paste a conversation";
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
    const preview = coverImage({ thumbnail: entry.thumbnail, title: "Selected" });
    image.append(preview, button("Remove image", "text-button", () => {
      entry.thumbnail = "";
      $("#entry-image").value = "";
      renderImageEdit();
    }));
  }
}

async function shrinkImage(file) {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 20 * 1024 * 1024) {
    throw new Error("Please choose an image file of 20MB or less.");
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
  const markers = [...text.matchAll(/^\s*(Me|You|User|Question|AI|Answer|Assistant|Gemini|ChatGPT|Claude)\s*[:：][ \t]*/gmi)];
  if (!markers.length || markers[0].index > 0) return [{ role: "system", text }];
  return markers.map((mark, index) => ({
    role: /^(me|you|user|question)$/i.test(mark[1]) ? "user" : "assistant",
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
    title.textContent = "Add chat";
    subtitle.textContent = "Choose how to bring them in.";
    const options = element("div", "import-options");
    options.append(
      htmlSection("Import file", "ChatGPT, Claude or Gemini exports, JSON backups, text files", "import-option", "upload", () => openIntake("file")),
      htmlSection("Paste a conversation", "Paste copied text to make a new card", "import-option", "paste", () => openEditor()),
      htmlSection("Choose AI services (Top 100)", "100 popular AIs · the ones you use are picked for you", "import-option is-featured", "all", () => openIntake("services")),
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
  foot.append(button("Other ways", "secondary-button", () => openIntake("choice")));
  if (intake.mode === "sync") {
    title.textContent = "Auto save";
    subtitle.textContent = syncInfo?.enabled ? "Saves your Claude Code, Codex and Gemini work history on this PC, plus your web AI chats, on its own." : "Checking auto save…";
    body.append(element("p", "", "Even if you delete a chat in the AI app itself, the copy and thumbnail saved in the drawer stay."));
    if (syncInfo?.folder) {
      body.append(element("h3", "", "Folder for web chat files"),
        element("p", "", "Put ChatGPT, Claude or Gemini export files in this folder. You can make subfolders named after your projects."),
        element("p", "sync-folder", syncInfo.folder),
        button("Copy folder path", "secondary-button", async () => {
          await navigator.clipboard.writeText(syncInfo.folder);
          notify("Paste the folder path into the File Explorer address bar.");
        }, "copy"));
    }
    if (syncInfo?.extension) {
      const steps = element("ol", "service-steps");
      for (const text of [
        "Type chrome://extensions in the Chrome address bar and turn on “Developer mode” at the top right.",
        "Click “Load unpacked” and choose the folder below.",
        "That’s it. When you chat on the ChatGPT, Claude or Gemini website, each finished answer is saved to this drawer.",
      ]) steps.append(element("li", "", text));
      body.append(element("h3", "", "Auto-save web AI chats (Chrome extension)"),
        element("p", "", "Chats are sent only to the drawer on this PC and nowhere else. Chats from while the app was off come in the next time you start it."),
        steps,
        element("p", "sync-folder", syncInfo.extension),
        button("Copy extension folder path", "secondary-button", async () => {
          await navigator.clipboard.writeText(syncInfo.extension);
          notify("Paste it into the address bar of the folder picker.");
        }, "copy"));
      const web = syncInfo.web || {};
      body.append(element("p", "status-text", web.lastAt
        ? "Last web chat saved " + new Date(web.lastAt).toLocaleString("en-US", { timeZone: "Asia/Seoul" }) + " · " + (serviceById.get(web.service)?.name || web.service)
        : "No web chats have come in since the app started."));
    }
    if (syncInfo?.running || syncInfo?.lastRun) {
      const lastRun = syncInfo.lastRun ? new Date(syncInfo.lastRun).toLocaleString("en-US", { timeZone: "Asia/Seoul" }) : "";
      body.append(element("p", "status-text", syncInfo.running ? "Checking for new chats…" : "Last checked " + lastRun));
    }
    if (syncInfo?.error) body.append(element("p", "status-text", syncInfo.error));
    if (syncInfo?.enabled) foot.append(button("Check now", "primary-button", async () => {
      try {
        syncInfo = await api("api/sync", { method: "POST" });
        if ($("#intake").open && intake.mode === "sync") drawIntake();
        notify("Checking for new chats.");
      } catch (error) {
        notify(error.message);
      }
    }));
  } else if (intake.mode === "local") {
    title.textContent = "Find chats on this PC";
    subtitle.textContent = "Choose an AI service. Newest chats are read first.";
    const options = element("div", "import-options");
    for (const source of intake.local ?? []) {
      const offset = intake.offsets[source.id] || 0;
      const remains = Math.max(0, source.count - offset);
      const option = htmlSection(source.name, remains ? (offset ? "Older ones left: " : "Found ") + remains.toLocaleString("en-US") + " items" : "Nothing to import",
        "import-option", "chat", () => importLocal(source.id));
      option.disabled = !remains || intake.busy;
      options.append(option);
    }
    if (!intake.local) options.append(element("p", "status-text", "Looking for chat files on this PC…"));
    body.append(options);
  } else if (intake.mode === "file") {
    title.textContent = "Import file";
    subtitle.textContent = "Choose a file or drag it into this window.";
    const field = element("label", "field", "AI services");
    const select = element("select");
    const entries = Object.entries({ auto: "Detect automatically", ...sources });
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
    const drop = button("Choose file", "drop-zone", () => input.click(), "upload");
    drop.append(element("small", "", "ZIP, JSON, JSONL, HTML, MD, TXT"));
    drop.addEventListener("dragover", event => event.preventDefault());
    drop.addEventListener("drop", event => {
      event.preventDefault();
      importFiles([...event.dataTransfer.files], select.value);
    });
    const links = element("p", "import-help");
    links.append(externalLink("How to export from ChatGPT", "https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data"),
      document.createTextNode(" · "), externalLink("How to export from Gemini", "https://support.google.com/gemini/answer/16920332?hl=ko"));
    const pasted = element("details", "backup-paste");
    pasted.append(element("summary", "", "Paste a copied backup"));
    const paste = element("textarea");
    paste.placeholder = "Paste your AI Chat Drawer JSON backup here.";
    paste.setAttribute("aria-label", "JSON backup");
    paste.rows = 3;
    pasted.append(paste, button("Check pasted backup", "secondary-button", () => {
      if (!paste.value.trim()) return;
      importFiles([new File([paste.value], "chat-drawer-backup.json", { type: "application/json" })], select.value);
    }));
    body.append(field, input, drop, links, pasted);
  } else {
    title.textContent = "Review conversations";
    subtitle.textContent = intake.batch.length.toLocaleString("en-US") + " conversation(s) found.";
    const list = element("ul", "import-preview");
    for (const record of intake.batch.slice(0, 8)) {
      const row = element("li");
      row.append(sourceBadge(record.source, record.service), element("span", "", record.title));
      list.append(row);
    }
    body.append(list);
    if (intake.batch.length > 8) body.append(element("p", "status-text", "Plus " + (intake.batch.length - 8) + " items"));
    const field = element("label", "field", "Put all in one project");
    const project = element("input");
    project.setAttribute("list", "saved-projects");
    project.placeholder = "Leave empty to keep their original projects.";
    project.maxLength = 160;
    project.value = state.project;
    field.append(project);
    body.append(field);
    foot.append(button("Conversations: " + intake.batch.length.toLocaleString("en-US") + " — Save", "primary-button", event => saveBatch(project.value, event.currentTarget)));
  }
  const warnings = element("p", "status-text", intake.warnings.join("\n"));
  warnings.id = "intake-status";
  warnings.setAttribute("role", "status");
  body.append(warnings);
}

function drawServicePicker(title, subtitle, body, foot) {
  title.textContent = "Choose AI services";
  subtitle.textContent = "The 100 most popular AIs. The ones you use are picked for you and shown first.";
  foot.append(button("Other ways", "secondary-button", () => openIntake("choice")));
  const search = element("input", "service-search");
  search.type = "search";
  search.placeholder = "Search by name (e.g. Perplexity, Midjourney)";
  search.setAttribute("aria-label", "Search AI services");
  search.value = intake.serviceQuery || "";
  const chips = element("div", "service-chips");
  chips.setAttribute("role", "group");
  chips.setAttribute("aria-label", "AI service categories");
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
      if (used) item.append(element("span", "service-used", used.toLocaleString("en-US") + " items"));
      else if (mine.includes(service.id)) item.append(element("span", "service-used", "In use"));
      return item;
    }));
    if (!shown.length) list.append(element("p", "status-text", intake.serviceGroup === "mine"
      ? "No AIs found yet. Install the auto-save extension and use AI websites, and they’ll gather here on their own."
      : "If you can’t find your service, paste it in under “Other” and save."));
  };
  for (const [key, label] of [["mine", "My AIs" + (mine.length ? " " + mine.length : "")], ["", "All"], ...Object.entries(serviceGroups)]) {
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
    element("p", "service-note", "Ranking: a16z “Top 100 Gen AI Consumer Apps”, 6th edition (January 2026 data). 46 from the web list minus adult chat apps, 3 coding AIs this app reads automatically · Microsoft Copilot, 32 from the same edition’s mobile list, and 18 more popular AIs (Wrtn, Liner, Clova Note and others). “In use” means AIs the auto-save extension has spotted in Chrome on this PC."));
  setTimeout(() => search.focus(), 0);
}

const serviceTips = {
  image: "Paste in the prompt you used for an image, your edits, and the result link. It makes the same image easy to find and remake later.",
  media: "Paste in the prompt and settings you used for video, music or voice, plus the result link. For transcripts, just paste the whole text.",
  code: "Paste in the code you made or what you asked for, plus the result page address.",
};
function drawServiceGuide(title, subtitle, body, foot) {
  const service = serviceById.get(intake.service) || serviceById.get("copilot");
  title.textContent = service.name;
  subtitle.textContent = `${service.rank} on the list · ${serviceGroups[service.group]} · How to save: ${methodNames[service.method]}`;
  foot.append(button("Back to list", "secondary-button", () => openIntake("services")));
  const steps = element("ol", "service-steps");
  const add = text => steps.append(element("li", "", text));
  if (service.method === "auto") {
    add(`${service.name} keeps its chat files on the PC, so your phone can’t find them directly.`);
    add("On the PC version of AI Chat Drawer, gather them with “Find chats on this PC”, then save a file with “Export backup”.");
    add("Send that backup file to your phone and choose it here with “Import file”. The same chat never goes in twice.");
    body.append(steps);
    foot.append(button("Import file", "primary-button", () => openIntake("file"), "upload"));
    return;
  }
  if (fileMethod(service.method)) {
    if (service.method === "web") {
      add(`The phone version doesn’t save ${service.name} chats on its own. Chats gathered by auto-save on the PC version can come over in a backup file.`);
      add("To add chats on this phone, get an export ZIP as shown below and add it.");
    }
    if (service.id === "chatgpt") {
      add("In ChatGPT, go to Settings → Data controls → Export data.");
      add("Download the ZIP file from the link in the email.");
    } else if (service.id === "gemini") {
      add("In Google Takeout, choose “My Activity” → Gemini Apps only, then export.");
      add("Use the downloaded ZIP file as is.");
    } else {
      add("On claude.ai, go to Settings → Privacy → Export data.");
      add("Download the ZIP file from the link in the email.");
    }
    add("Add the ZIP with “Choose file” below, and each chat becomes its own card.");
  } else {
    add(`${service.name} chat (or task) screen: select everything you want to keep and copy it.`);
    add("Press “Open paste window”, paste it in, add a title and project, and save.");
    add("Put “Me:” before your questions and “AI:” before answers to split them into chat bubbles.");
    add("If you saved the content as .md · .txt files, you can add them all at once with “Choose file”.");
  }
  body.append(steps);
  if (serviceTips[service.group]) body.append(element("p", "service-tip", serviceTips[service.group]));
  if (service.id === "chatgpt" || service.id === "gemini") {
    const links = element("p", "import-help");
    links.append(service.id === "chatgpt"
      ? externalLink("How to export from ChatGPT", "https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data")
      : externalLink("How to export from Gemini", "https://support.google.com/gemini/answer/16920332?hl=ko"));
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
  foot.append(button("Choose file", service.method === "export" || service.method === "web" ? "primary-button" : "secondary-button", () => input.click(), "upload"));
  if (service.method === "paste") foot.append(button("Open paste window", "primary-button", () => openEditor(null, service.id), "paste"));
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
  $("#intake-status").textContent = "Reading chat files.";
  try {
    const result = await getResult();
    intake.batch = [...new Map(result.records.map(record => [record.id, record])).values()];
    intake.warnings = result.warnings || [];
    if (intake.batch.length) intake.mode = "preview";
    else if (!intake.warnings.length) intake.warnings = ["No chats found to import."];
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
    notify("Conversations: " + batch.length.toLocaleString("en-US") + " checked and saved.");
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
    notify("No chats to back up.");
    return;
  }
  const file = new Blob([JSON.stringify({ format: "blue-chat-archive", records: state.records })], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = element("a");
  link.href = url;
  link.download = "AI Chat Drawer " + today() + ".json";
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
    $("#sync-note").textContent = (window.PhoneSync && PhoneSync.note) || "Saved on this phone only";
    $("#sync-note").title = window.PhoneSync && PhoneSync.active ? "Tap to sync chats with your home PC." : "Chats live only in this phone’s browser. Tap to see how to back up.";
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
  if (target.classList.length) glyph.classList.add(...target.classList);
  target.replaceWith(glyph);
}
for (const tab of document.querySelectorAll("[data-view]")) tab.addEventListener("click", () => { state.view = tab.dataset.view; render(true); });
for (const closer of document.querySelectorAll("[data-close]")) closer.addEventListener("click", () => document.getElementById(closer.dataset.close).close());
$("#intake").addEventListener("cancel", event => { if (intake.busy) event.preventDefault(); });
$("#add-button").addEventListener("click", () => openIntake("choice"));
$("#find-file").addEventListener("click", () => openIntake("file"));
$("#backup-button").addEventListener("click", backup);
$("#open-sync").addEventListener("click", () => window.PhoneSync && PhoneSync.active ? PhoneSync.run(true) : notify("Chats are saved only on this phone. Changing phones or clearing browser data removes them, so use “Export backup” and keep the file somewhere outside the phone too."));
$("#toggle-demo").addEventListener("click", () => { state.showExamples = !state.showExamples; revealRecords(); });
$("#select-toggle").addEventListener("click", () => setSelecting(!selection.on));
$("#select-cancel").addEventListener("click", () => setSelecting(false));
$("#select-all").addEventListener("click", () => {
  for (const card of document.querySelectorAll(".record-card.is-selectable")) toggleSelected(card.dataset.id, card, true);
});
$("#select-delete").addEventListener("click", () => deleteRecords(new Set(selection.ids)));
const wide = window.matchMedia("(min-width: 781px)");
const remember = (key, value) => { try { localStorage.setItem(key, value); } catch { /* works even if saving fails */ } };
const recall = key => { try { return localStorage.getItem(key); } catch { return null; } };
function syncDrawerButton() {
  const shell = $(".app-shell");
  const open = wide.matches ? !shell.classList.contains("is-side-closed") : shell.classList.contains("is-menu-open");
  $("#mobile-menu").setAttribute("aria-expanded", String(open));
  $("#mobile-menu").setAttribute("aria-label", open ? "Close menu" : "Open menu");
  $("#mobile-menu").title = open ? "Close menu" : "Open menu";
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
  const row = caption.parentElement.classList.contains("side-caption-row") ? caption.parentElement : caption;
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
    status.textContent = "Please enter a title and the chat text.";
    return;
  }
  if (link && !externalLink("", link)) {
    status.textContent = "For the original link, enter an https or http address.";
    return;
  }
  const original = entry.record;
  const picked = serviceById.get(data.get("source"));
  const metadata = {
    title, project: data.get("project").trim() || "Unsorted", date: data.get("date"), source: picked?.source || "other",
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
    notify("Chat saved.");
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
