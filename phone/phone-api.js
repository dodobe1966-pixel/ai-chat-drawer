/* AI Chat Drawer, phone edition: the PC server (server.py) rebuilt inside the browser.
 * app.js keeps calling fetch("api/..."); this file answers those calls from IndexedDB on the phone,
 * with the same JSON shapes, status codes and messages as the PC server. Nothing leaves the phone. */
(function () {
  "use strict";
  const Phone = window.PhoneImport;
  const MSG = {
    readArchive: "저장된 대화 파일을 읽지 못했습니다. 기존 기록 파일은 보존되어 있습니다.",
    conflict: "다른 창에서 기록이 바뀌었습니다. 내용을 복사한 뒤 새로고침하고 다시 시도해 주세요.",
    tooLarge: "AI 대화서랍 저장 용량이 512MB를 넘었습니다. 큰 썸네일을 줄인 뒤 다시 저장해 주세요.",
    listFormat: "대화 목록 형식을 확인해 주세요.",
    badVersion: "잘못된 저장 번호입니다. 화면을 새로고침해 주세요.",
    recordFormat: "대화 기록 형식을 확인해 주세요.",
    duplicate: "중복되거나 식별할 수 없는 대화 기록이 있습니다.",
    sourceInvalid: "대화 서비스를 다시 선택해 주세요.",
    fields: "대화 제목과 프로젝트, 날짜를 확인해 주세요.",
    dateFormat: "대화 날짜 형식을 확인해 주세요.",
    bodyFormat: "대화 본문 형식을 확인해 주세요.",
    extraFormat: "대화 설명 또는 그림 형식을 확인해 주세요.",
    favoriteFormat: "즐겨찾기 상태 형식을 확인해 주세요.",
    projectFormat: "프로젝트 목록 형식을 확인해 주세요.",
    restoreFormat: "되살릴 대화를 확인해 주세요.",
    chooseFile: "가져올 파일을 선택해 주세요.",
    emptyFile: "빈 파일은 가져올 수 없습니다.",
    limitHead: "한 번에 ",
    limitTail: "MB까지 처리할 수 있습니다.",
    importEmpty: "이 파일에서 읽을 수 있는 대화를 찾지 못했습니다. 내보낸 대화 파일이나 텍스트 파일을 선택해 주세요.",
    notFound: "요청한 화면을 찾을 수 없습니다.",
    generic: "요청을 처리하는 중 문제가 생겼습니다. 다시 시도해 주세요.",
    storage: "휴대폰 저장 공간에 쓰지 못했습니다. 저장 공간을 확인하고 백업부터 받아 두세요.",
    syncBusy: "맞추는 동안 폰 기록이 바뀌었습니다. 한 번 더 눌러 주세요.",
    syncFailed: "PC와 맞추지 못했습니다. PC가 켜져 있는지 확인하고 다시 눌러 주세요.",
  };
  const SOURCES = new Set(["chatgpt", "claude", "codex", "gemini", "other"]);
  const TRASH_DAYS = 3;
  const MAX_ARCHIVE = 512 * 1024 * 1024;
  const MAX_UPLOAD = 256 * 1024 * 1024;

  class RequestError extends Error { constructor(status, message) { super(message); this.status = status; } }

  // ---------------------------------------------------------------- IndexedDB (one key-value store)
  let opening = null;
  function database() {
    if (!opening) {
      opening = new Promise((resolve, reject) => {
        const request = indexedDB.open("ai-chat-drawer-phone", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("kv");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      opening.catch(() => { opening = null; });
    }
    return opening;
  }
  async function transact(mode, work) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("kv", mode);
      const store = transaction.objectStore("kv");
      let result;
      Promise.resolve(work(store, value => { result = value; })).catch(reject);
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("aborted"));
    });
  }
  const getKey = (store, key) => new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  async function readAll() {
    try {
      return await transact("readonly", async (store, done) => {
        done({ archive: await getKey(store, "archive"), projects: await getKey(store, "projects"), trash: await getKey(store, "trash"), pcsync: await getKey(store, "pcsync") });
      });
    } catch {
      throw new RequestError(500, MSG.readArchive);
    }
  }
  async function writeKeys(values) {
    try {
      await transact("readwrite", store => { for (const [key, value] of Object.entries(values)) store.put(value, key); });
    } catch {
      throw new RequestError(500, MSG.storage);
    }
  }
  // one request at a time, like the lock in server.py
  let queue = Promise.resolve();
  const locked = work => { const run = queue.then(work); queue = run.catch(() => {}); return run; };

  function currentArchive(saved) {
    if (saved === undefined) return { version: 0, records: [], _removed: [] };
    if (saved && Number.isInteger(saved.version) && Array.isArray(saved.records)) return saved;
    throw new RequestError(500, MSG.readArchive);
  }
  function liveTrash(items) {
    const cutoff = Date.now() / 1000 - TRASH_DAYS * 86400;
    return (Array.isArray(items) ? items : []).filter(item => item && typeof item === "object" && !Array.isArray(item)
      && (typeof item.deletedAt === "number" ? item.deletedAt : 0) >= cutoff && item.record && typeof item.record === "object" && !Array.isArray(item.record));
  }
  const byteLength = text => new Blob([text]).size;
  function commitValue(version, records, removed) {
    const data = { version: version + 1, records, _removed: [...removed].sort(comparePy) };
    if (byteLength(JSON.stringify(data)) > MAX_ARCHIVE) throw new RequestError(413, MSG.tooLarge);
    return data;
  }
  function comparePy(a, b) { return a === b ? 0 : (a < b ? -1 : 1); }

  // ---------------------------------------------------------------- validation (validate_archive)
  const isDict = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  function validDate(text) {
    try { Phone.dateFromIsoformat(text); return true; } catch { return false; }
  }
  function validateArchive(data) {
    if (!isDict(data) || !Array.isArray(data.records)) throw new RequestError(400, MSG.listFormat);
    const version = own(data, "version") ? data.version : null;
    if (version !== null && (!Number.isInteger(version) || version < 0)) throw new RequestError(400, MSG.badVersion);
    const ids = new Set();
    for (const record of data.records) {
      if (!isDict(record)) throw new RequestError(400, MSG.recordFormat);
      const id = record.id;
      if (typeof id !== "string" || !id || ids.has(id)) throw new RequestError(400, MSG.duplicate);
      ids.add(id);
      if (typeof record.source !== "string" || !SOURCES.has(record.source)) throw new RequestError(400, MSG.sourceInvalid);
      if (["title", "project", "date"].some(field => typeof record[field] !== "string")) throw new RequestError(400, MSG.fields);
      if (record.date && !validDate(record.date)) throw new RequestError(400, MSG.dateFormat);
      const messages = record.messages;
      if (!Array.isArray(messages) || messages.some(message => !isDict(message) || !["user", "assistant", "system"].includes(message.role) || typeof message.text !== "string")) {
        throw new RequestError(400, MSG.bodyFormat);
      }
      for (const field of ["thumbnail", "summary", "link"]) if (own(record, field) && typeof record[field] !== "string") throw new RequestError(400, MSG.extraFormat);
      if (own(record, "favorite") && typeof record.favorite !== "boolean") throw new RequestError(400, MSG.favoriteFormat);
    }
    return [data.records, version];
  }

  // ---------------------------------------------------------------- request bodies
  const contentType = headers => {
    let value = "";
    if (headers instanceof Headers) value = headers.get("Content-Type") || "";
    else if (headers) for (const key of Object.keys(headers)) if (key.toLowerCase() === "content-type") value = headers[key];
    return value.split(";")[0].trim().toLowerCase() || "text/plain";
  };
  async function bodyBytes(body) {
    if (body === undefined || body === null) return new Uint8Array(0);
    if (typeof body === "string") return new TextEncoder().encode(body);
    if (body instanceof Blob) return new Uint8Array(await body.arrayBuffer());
    if (body instanceof ArrayBuffer) return new Uint8Array(body);
    if (ArrayBuffer.isView(body)) return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
    return new TextEncoder().encode(String(body));
  }
  async function readBody(body, limit) {
    let size = 0;
    if (body instanceof Blob) size = body.size;
    else if (typeof body === "string") size = byteLength(body);
    else if (body) size = (await bodyBytes(body)).length;
    if (size <= 0) throw new RequestError(400, MSG.emptyFile);
    if (size > limit) throw new RequestError(413, MSG.limitHead + Math.floor(limit / (1024 * 1024)) + MSG.limitTail);
    return bodyBytes(body);
  }
  async function readJson(body, limit, error) {
    const bytes = await readBody(body, limit);
    try {
      let text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return JSON.parse(text);
    } catch {
      throw new RequestError(400, error);
    }
  }

  // ---------------------------------------------------------------- routes
  async function getArchive() {
    return locked(async () => {
      const { archive } = await readAll();
      const current = currentArchive(archive);
      return { version: current.version, records: current.records };
    });
  }
  async function putArchive(init) {
    if (contentType(init.headers) !== "application/json") throw new RequestError(415, MSG.listFormat);
    const data = await readJson(init.body, MAX_ARCHIVE, MSG.listFormat);
    const [records, version] = validateArchive(data);
    return locked(async () => {
      const saved = await readAll();
      const current = currentArchive(saved.archive);
      if (version !== null && version !== current.version) throw new RequestError(409, MSG.conflict);
      const nextIds = new Set(records.map(record => record.id));
      const removed = new Set([...(current._removed || []), ...current.records.map(record => record.id)].filter(id => !nextIds.has(id)));
      const gone = current.records.map((record, index) => [index, record]).filter(([, record]) => !nextIds.has(record.id));
      const next = commitValue(current.version, records, removed);
      const values = { archive: next };
      if (gone.length) {
        const now = Date.now() / 1000;
        values.trash = liveTrash(saved.trash).concat(gone.map(([index, record]) => ({ deletedAt: now, index, record })));
      }
      await writeKeys(values);
      return { version: next.version };
    });
  }
  async function getProjects() {
    const { projects } = await readAll();
    return { projects: Array.isArray(projects) ? projects.filter(name => typeof name === "string") : [] };
  }
  async function putProjects(init) {
    if (contentType(init.headers) !== "application/json") throw new RequestError(415, MSG.projectFormat);
    const data = await readJson(init.body, 1024 * 1024, MSG.projectFormat);
    const names = isDict(data) ? data.projects : null;
    if (!Array.isArray(names) || names.length > 500 || names.some(name => typeof name !== "string")) throw new RequestError(400, MSG.projectFormat);
    const clean = [];
    for (const raw of names) {
      const name = Array.from(Phone.splitWs(raw).join(" ")).slice(0, 160).join("");
      if (name && !clean.includes(name)) clean.push(name);
    }
    await locked(() => writeKeys({ projects: clean }));
    return { projects: clean };
  }
  async function getTrash() {
    return locked(async () => {
      const items = liveTrash((await readAll()).trash);
      await writeKeys({ trash: items });
      const field = (record, key, fallback) => (own(record, key) ? record[key] : fallback);
      return {
        days: TRASH_DAYS,
        items: items.slice().sort((a, b) => b.deletedAt - a.deletedAt).map(item => ({
          id: field(item.record, "id", null), title: field(item.record, "title", ""), source: field(item.record, "source", "other"),
          project: field(item.record, "project", ""), date: field(item.record, "date", ""),
          deletedAt: item.deletedAt, expiresAt: item.deletedAt + TRASH_DAYS * 86400,
        })),
      };
    });
  }
  async function restoreTrash(init) {
    if (contentType(init.headers) !== "application/json") throw new RequestError(415, MSG.restoreFormat);
    const data = await readJson(init.body, 1024 * 1024, MSG.restoreFormat);
    if (!isDict(data)) throw new RequestError(400, MSG.restoreFormat);
    let raw = own(data, "ids") ? data.ids : [];
    if (typeof raw === "string") raw = Array.from(raw);
    else if (isDict(raw)) raw = Object.keys(raw);
    else if (!Array.isArray(raw)) throw new RequestError(400, MSG.restoreFormat);
    const ids = new Set(raw.map(value => Phone.pyStr(value)));
    return locked(async () => {
      const saved = await readAll();
      const current = currentArchive(saved.archive);
      const items = liveTrash(saved.trash);
      const existing = new Set(current.records.map(record => record.id));
      const back = items.filter(item => ids.has(item.record.id) && !existing.has(item.record.id));
      if (!back.length) return { restored: 0, version: current.version };
      const backIds = new Set(back.map(item => item.record.id));
      const removed = new Set((current._removed || []).filter(id => !backIds.has(id)));
      const records = current.records.slice();
      const position = item => (Number.isFinite(item.index) ? Math.trunc(item.index) : records.length);
      for (const item of back.slice().sort((a, b) => (Number.isFinite(a.index) ? a.index : Infinity) - (Number.isFinite(b.index) ? b.index : Infinity))) {
        records.splice(Math.min(position(item), records.length), 0, item.record);
      }
      const next = commitValue(current.version, records, removed);
      await writeKeys({ archive: next, trash: items.filter(item => !backIds.has(item.record.id)) });
      return { restored: back.length, version: current.version + 1 };
    });
  }
  async function importFile(query, init) {
    const name = query.get("name") || "";
    const source = query.has("source") && query.get("source") !== "" ? query.get("source") : "auto";
    if (!(SOURCES.has(source) || source === "auto")) throw new RequestError(400, MSG.sourceInvalid);
    if (!name || Phone.cpLength(name) > 1000) throw new RequestError(400, MSG.chooseFile);
    const payload = await readBody(init.body, MAX_UPLOAD);
    const { records, warnings } = await Phone.importUpload(name, payload, source === "auto" ? "" : source);
    if (!records.length) throw new RequestError(400, MSG.importEmpty);
    return { records, warnings };
  }

  async function route(method, path, query, init) {
    if (method === "GET" && path === "api/status") return [200, { instance: "phone" }];
    if (method === "GET" && path === "api/archive") return [200, await getArchive()];
    if (method === "PUT" && path === "api/archive") return [200, await putArchive(init)];
    if (method === "POST" && path === "api/import") return [200, await importFile(query, init)];
    if (method === "GET" && path === "api/local") return [200, { sources: [] }];
    if (method === "POST" && path === "api/local") return [200, { records: [], warnings: [], nextOffset: null, total: 0 }];
    if (method === "GET" && path === "api/projects") return [200, await getProjects()];
    if (method === "PUT" && path === "api/projects") return [200, await putProjects(init)];
    if (method === "GET" && path === "api/trash") return [200, await getTrash()];
    if (method === "POST" && path === "api/trash/restore") return [200, await restoreTrash(init)];
    if (method === "GET" && path === "api/sync") return [200, { enabled: false }];
    if (method === "POST" && path === "api/sync") return [202, { enabled: false }];
    throw new RequestError(404, MSG.notFound);
  }
  // ---------------------------------------------------------------- syncing with the home PC (phone-sync.js)
  // The phone remembers a fingerprint of every chat as it was at the last sync. A chat whose fingerprint changed was
  // edited here and wins on the PC; a chat that disappeared was deleted here and goes to the PC trash. On the very first
  // sync nothing is known, so phone chats are merged in and the PC copy wins where both have the same chat.
  function fingerprint(record) {
    const text = JSON.stringify(record);
    let hash = 0x811c9dc5;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36) + "." + text.length;
  }
  async function syncWithPc(base) {
    const before = await locked(async () => {
      const saved = await readAll();
      return { archive: currentArchive(saved.archive), pcsync: saved.pcsync };
    });
    const known = before.pcsync && isDict(before.pcsync.hashes) ? before.pcsync.hashes : null;
    const replace = [], merge = [], remove = [], present = new Set(), mine = {};
    for (const record of before.archive.records) {
      if (record.example) continue;
      present.add(record.id);
      mine[record.id] = fingerprint(record);
      if (!known) merge.push(record);
      else if (known[record.id] !== mine[record.id]) replace.push(record);
    }
    if (known) for (const id of Object.keys(known)) if (!present.has(id)) remove.push(id);
    let response;
    try {
      response = await networkFetch(base + "api/phone-sync", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replace, merge, remove }),
      });
    } catch {
      throw new RequestError(503, MSG.syncFailed);
    }
    if (response.status === 401) { const error = new RequestError(401, MSG.syncFailed); error.login = true; throw error; }
    let data = null;
    try { data = await response.json(); } catch { /* handled below */ }
    if (!response.ok) throw new RequestError(response.status, (data && data.error) || MSG.syncFailed);
    if (!data || !Array.isArray(data.records) || !Array.isArray(data.removed)) throw new RequestError(502, MSG.syncFailed);
    return locked(async () => {
      const saved = await readAll();
      const current = currentArchive(saved.archive);
      if (current.version !== before.archive.version) throw new RequestError(409, MSG.syncBusy);
      const hashes = {};
      let phoneChanged = data.records.length !== present.size;
      for (const record of data.records) {
        hashes[record.id] = fingerprint(record);
        if (mine[record.id] !== hashes[record.id]) phoneChanged = true;
      }
      const values = { pcsync: { hashes, at: Date.now() } };
      if (phoneChanged) values.archive = commitValue(current.version, data.records, new Set(data.removed));
      await writeKeys(values);
      return { phoneChanged, total: data.records.length, sent: replace.length + merge.length, deleted: remove.length };
    });
  }

  const reply = (status, data) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

  const networkFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input && input.url;
    if (typeof url !== "string" || !/^api\//.test(url)) return networkFetch(input, init);
    init = init || {};
    const method = (init.method || "GET").toUpperCase();
    const mark = url.indexOf("?");
    const path = mark < 0 ? url : url.slice(0, mark);
    const query = new URLSearchParams(mark < 0 ? "" : url.slice(mark + 1));
    try {
      const [status, data] = await route(method, path, query, init);
      return reply(status, data);
    } catch (error) {
      if (error instanceof RequestError) return reply(error.status, { error: error.message });
      if (error && error.pyType === "RequestError") return reply(error.status, { error: error.message });
      return reply(500, { error: MSG.generic });
    }
  };
  window.PhoneApi = { route, database, MSG, syncWithPc };
})();
