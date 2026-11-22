/* AI Chat Drawer, phone edition: JavaScript port of importers.py plus the ZIP handling of server.py.
 * Goal: the same input file gives the same JSON as the PC version (Python 3.13).
 * Works in the browser (window.PhoneImport) and in node (module.exports) for the parity tests.
 * Unicode tables, HTML entities and code pages come from phone-tables.js, generated from Python by the builder. */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory(require("./phone-tables.js"));
  else root.PhoneImport = factory(root.PHONE_TABLES);
})(typeof self !== "undefined" ? self : this, function (TABLES) {
  "use strict";
  if (!TABLES) throw new Error("phone-tables.js is missing");

  // ---------------------------------------------------------------- messages (replaced for other languages by the builder)
  const MSG = {
    unsorted: "Unsorted",
    imageAttached: "[Image attached]",
    badEncoding: "Can’t read the file’s text encoding.",
    badBackup: "Please check the chat format in the AI Chat Drawer backup file.",
    badJson: "Please check the JSON file format.",
    badSuffix: "Supported file types are JSON, JSONL, TXT, MD and HTML.",
    badChatHtml: "Can’t read the ChatGPT HTML chat data.",
    importEmpty: "No readable chats found in this file. Please choose an exported chat file or a text file.",
    zipTooMany: "This ZIP file has too many items. Please choose only the chat files you need.",
    zipTooBig: "The unzipped chats are over 512MB. Please import the files in smaller parts.",
    zipBad: "Can’t open the ZIP file. Please check that it finished downloading.",
    zipSkipped: n => "Files with no readable chats or an unsupported format: " + n + " skipped.",
    uploadType: "Please choose a ZIP, JSON, JSONL, TXT, MD or HTML chat file.",
  };

  const MAX_UPLOAD = 256 * 1024 * 1024;
  const MAX_ARCHIVE = 512 * 1024 * 1024;
  const MAX_ZIP_ENTRIES = 20000;
  const MAX_COVER = 2 * 1024 * 1024;
  const MAX_ZIP_COVERS = 24 * 1024 * 1024;
  const MAX_STREAM_LINE = 48 * 1024 * 1024;

  // ---------------------------------------------------------------- Python exceptions
  const PARENT = {
    UnicodeDecodeError: "UnicodeError", UnicodeEncodeError: "UnicodeError", UnicodeError: "ValueError",
    JSONDecodeError: "ValueError", AddressValueError: "ValueError", ValueError: "Exception",
    TypeError: "Exception", KeyError: "LookupError", LookupError: "Exception",
    RecursionError: "RuntimeError", NotImplementedError: "RuntimeError", RequestError: "RuntimeError", RuntimeError: "Exception",
    OSError: "Exception", EOFError: "Exception", BadZipFile: "Exception", OverflowError: "ArithmeticError",
    ArithmeticError: "Exception", InternalError: "Exception", Exception: null,
  };
  class PyError extends Error {
    constructor(type, message, status) {
      super(message || type);
      this.pyType = type;
      if (status) this.status = status;
    }
  }
  function pyType(error) {
    if (error instanceof PyError) return error.pyType;
    if (error instanceof RangeError && /call stack/i.test(error.message)) return "RecursionError";
    return "InternalError";
  }
  function isA(error, ...types) {
    for (let type = pyType(error); type; type = PARENT[type]) if (types.includes(type)) return true;
    return false;
  }
  const fail = (type, message, status) => { throw new PyError(type, message, status); };
  const requestError = (status, message) => new PyError("RequestError", message, status);

  // ---------------------------------------------------------------- Python value helpers
  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const EMPTY = Object.freeze(Object.create(null));
  class PyDT { constructor(ord, sec, us, off, korea) { this.ord = ord; this.sec = sec; this.us = us; this.off = off; this.korea = korea; } }
  const isDict = value => value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof PyDT);
  const get = (dict, key, fallback) => (hasOwn(dict, key) ? dict[key] : fallback);
  const isNone = value => value === null || value === undefined;
  function truthy(value) {
    if (value === null || value === undefined || value === false) return false;
    if (value === true) return true;
    if (typeof value === "number") return value !== 0;   // NaN is true in Python
    if (typeof value === "string" || Array.isArray(value)) return value.length > 0;
    if (value instanceof PyDT) return true;
    for (const key in value) if (hasOwn(value, key)) return true;
    return false;
  }
  function or(...values) {
    for (const value of values) if (truthy(value)) return value;
    return values[values.length - 1];
  }
  const _object = value => (isDict(value) ? value : EMPTY);
  const _str = value => (typeof value === "string" ? value : "");
  const newDict = () => Object.create(null);

  // whitespace exactly as str.isspace(); all of it is in the BMP
  const SPACE = new Set([...TABLES.spaceChars].map(char => char.charCodeAt(0)));
  function strip(text) {
    let start = 0, end = text.length;
    while (start < end && SPACE.has(text.charCodeAt(start))) start++;
    while (end > start && SPACE.has(text.charCodeAt(end - 1))) end--;
    return start === 0 && end === text.length ? text : text.slice(start, end);
  }
  function lstrip(text) {
    let start = 0;
    while (start < text.length && SPACE.has(text.charCodeAt(start))) start++;
    return start ? text.slice(start) : text;
  }
  function rstripChars(text, chars) {
    let end = text.length;
    while (end > 0 && chars.includes(text[end - 1])) end--;
    return text.slice(0, end);
  }
  function splitWs(text) {
    const out = [];
    let index = 0;
    const length = text.length;
    while (index < length) {
      while (index < length && SPACE.has(text.charCodeAt(index))) index++;
      if (index >= length) break;
      let stop = index;
      while (stop < length && !SPACE.has(text.charCodeAt(stop))) stop++;
      out.push(text.slice(index, stop));
      index = stop;
    }
    return out;
  }
  const _oneLine = value => splitWs(_str(value)).join(" ");
  // the first `limit` code points of _one_line(value), without building the whole string
  function oneLinePrefix(value, limit) {
    const text = _str(value);
    let out = "", count = 0, index = 0, pendingSpace = false;
    const length = text.length;
    while (index < length && count < limit) {
      const code = text.charCodeAt(index);
      if (SPACE.has(code)) { if (out) pendingSpace = true; index++; continue; }
      if (pendingSpace) { out += " "; count++; pendingSpace = false; if (count >= limit) break; }
      const pair = code >= 0xd800 && code <= 0xdbff && index + 1 < length && (text.charCodeAt(index + 1) & 0xfc00) === 0xdc00;
      out += pair ? text.slice(index, index + 2) : text[index];
      index += pair ? 2 : 1;
      count++;
    }
    return out;
  }
  function cpLength(text) {
    let count = text.length;
    for (let index = 0; index < text.length - 1; index++) {
      const code = text.charCodeAt(index);
      if (code >= 0xd800 && code <= 0xdbff && (text.charCodeAt(index + 1) & 0xfc00) === 0xdc00) { count--; index++; }
    }
    return count;
  }
  const LINE_BREAK = /\r\n|[\n\r\x0b\x0c\x1c\x1d\x1e\x85\u2028\u2029]/g;
  function splitlines(text) {
    const out = [];
    let last = 0, match;
    LINE_BREAK.lastIndex = 0;
    while ((match = LINE_BREAK.exec(text))) {
      out.push(text.slice(last, match.index));
      last = match.index + match[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }
  const lower = text => text.toLowerCase();
  function cpCompare(a, b) {   // Python str ordering (code points)
    const limit = Math.min(a.length, b.length);
    for (let index = 0; index < limit; index++) {
      let x = a.codePointAt(index), y = b.codePointAt(index);
      if (x !== y) {
        if ((a.charCodeAt(index) & 0xfc00) === 0xdc00) x = a.charCodeAt(index);
        if ((b.charCodeAt(index) & 0xfc00) === 0xdc00) y = b.charCodeAt(index);
        return x < y ? -1 : 1;
      }
      if (x > 0xffff) index++;
    }
    return a.length === b.length ? 0 : a.length < b.length ? -1 : 1;
  }
  const ZEROS = TABLES.digitZeros;
  function digitValue(code) {
    let lo = 0, hi = ZEROS.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ZEROS[mid] <= code) lo = mid; else hi = mid - 1; }
    return code - ZEROS[lo];
  }
  function pyInt(digits) {   // int() of a run of Unicode decimal digits
    let value = 0;
    for (const char of digits) value = value * 10 + digitValue(char.codePointAt(0));
    return value;
  }
  const thousands = number => String(number).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // ---------------------------------------------------------------- regular expressions with Python's Unicode classes
  const W = "[" + TABLES.word + "]";
  const S = "[" + TABLES.space + "]";
  const D = "[" + TABLES.digit + "]";
  const WORD_DASH = "[" + TABLES.word + "\\-]";
  const BOUNDARY = `(?:(?<=${W})(?!${W})|(?<!${W})(?=${W}))`;
  const rx = (source, flags) => new RegExp(source, "u" + (flags || ""));

  const KOREA_OFFSET = 9 * 3600;
  const SOURCES = new Set(["chatgpt", "claude", "gemini", "codex", "other"]);
  const APP_BACKUP = "blue-chat-archive";
  const ROLE_NAMES = new Map(Object.entries({
    "user": "user", "human": "user", "me": "user", "사용자": "user", "나": "user",
    "assistant": "assistant", "ai": "assistant", "model": "assistant", "gemini": "assistant",
    "claude": "assistant", "chatgpt": "assistant", "codex": "assistant", "답변": "assistant",
    "system": "system", "developer": "system",
  }));
  const TEXT_TYPES = new Set(["text", "input_text", "output_text", "message", "multimodal_text", ""]);
  const DAY_PATTERN = rx(`${D}{4}[-.]${D}{1,2}[-.]${D}{1,2}`);
  const MARKER = rx(`^${S}*(?:#{1,6}${S}*)?(?:\\*\\*)?([${TABLES.word} ]{1,22})(?:\\*\\*)?${S}*[:：]?${S}*([^\\n]*?)${S}*$`);
  const REMINDER = rx(`<system-reminder>[^]*?</system-reminder>${S}*`, "g");
  const CLAUDE_LINE = /"type"[ \t\n\r\f\v]*:[ \t\n\r\f\v]*"(?:user|assistant|custom-title|summary|ai-title)"/;
  const THUMBNAIL = /^data:image\/(?:png|jpeg|gif|webp|avif);base64,[a-zA-Z0-9+/=]+$/;
  const ASSET_ID = /(?:file-service|sediment):\/\/((?:file-|file_)[a-zA-Z0-9_-]{3,95})(?:$|[^a-zA-Z0-9_-])/;
  const PROMPT = rx(`^(?:Prompted${S}+|(?:프롬프트 입력|프롬프트|질문|요청)${S}*[:：]?${S}*)`, "i");
  const ACTIVITY_TIME = rx(
    `${BOUNDARY}(?:${D}{4}[-/.]${S}*${D}{1,2}[-/.]${S}*${D}{1,2}\\.?(?:,?${S}*(?:오전${S}*|오후${S}*)?${D}{1,2}:${D}{2}(?::${D}{2})?)?(?:${S}*(?:KST|UTC|GMT))?`
    + `|[A-Za-z]{3,9}${S}+${D}{1,2},${S}+${D}{4},?${S}+${D}{1,2}:${D}{2}(?::${D}{2})?${S}*(?:AM|PM)(?:${S}+[A-Z]{2,5})?)${BOUNDARY}`, "g");
  const ANSWER = rx(`(?:^|\\n)${S}*(?:Response|Answer|답변|응답)${S}*[:：]${S}*([^]+)`, "i");
  const GEMINI_PATH = rx(`^/(?:u/${D}+/)?(?:app|share)/${WORD_DASH}+/?$`);
  const CHATGPT_ID = rx(`^${WORD_DASH}{8,80}$`);
  const JSON_DATA = rx(`${BOUNDARY}(?:var|const|let)${S}+jsonData${S}*=${S}*(?=\\[)`);
  const CHATGPT_EXPORT = rx(`^conversations(?:[-_.]?${D}+)?\\.json(?=\\n?$)`, "i");
  const ASSET_KEY = /^file[-_][A-Za-z0-9_-]{3,95}$/;

  // ---------------------------------------------------------------- bytes and text
  const encoder = new TextEncoder();
  function utf8Encode(text, surrogatePass) {   // returns null for a lone surrogate unless surrogatePass
    const out = new Uint8Array(text.length * 3);
    let size = 0;
    for (let index = 0; index < text.length; index++) {
      let code = text.charCodeAt(index);
      if (code < 0x80) { out[size++] = code; continue; }
      if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length && (text.charCodeAt(index + 1) & 0xfc00) === 0xdc00) {
        code = 0x10000 + ((code - 0xd800) << 10) + (text.charCodeAt(++index) - 0xdc00);
        out[size++] = 0xf0 | (code >> 18); out[size++] = 0x80 | ((code >> 12) & 63);
        out[size++] = 0x80 | ((code >> 6) & 63); out[size++] = 0x80 | (code & 63);
        continue;
      }
      if (code >= 0xd800 && code <= 0xdfff && !surrogatePass) return null;
      if (code < 0x800) { out[size++] = 0xc0 | (code >> 6); out[size++] = 0x80 | (code & 63); }
      else { out[size++] = 0xe0 | (code >> 12); out[size++] = 0x80 | ((code >> 6) & 63); out[size++] = 0x80 | (code & 63); }
    }
    return out.subarray(0, size);
  }
  const utf8Fatal = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  const utf8SigFatal = new TextDecoder("utf-8", { fatal: true });
  function decodeUtf8(bytes, { sig = false, surrogatePass = false } = {}) {
    try {
      return (sig ? utf8SigFatal : utf8Fatal).decode(bytes);
    } catch {
      if (!surrogatePass) fail("UnicodeDecodeError", "utf-8");
    }
    // strict UTF-8 that also accepts encoded surrogates (Python 'surrogatepass')
    let start = sig && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
    const parts = [];
    let chunk = [];
    for (let index = start; index < bytes.length;) {
      const byte = bytes[index];
      let code, need, min;
      if (byte < 0x80) { code = byte; need = 0; min = 0; }
      else if (byte >= 0xc2 && byte <= 0xdf) { code = byte & 31; need = 1; min = 0x80; }
      else if (byte >= 0xe0 && byte <= 0xef) { code = byte & 15; need = 2; min = 0x800; }
      else if (byte >= 0xf0 && byte <= 0xf4) { code = byte & 7; need = 3; min = 0x10000; }
      else fail("UnicodeDecodeError", "utf-8");
      if (index + need >= bytes.length + (need ? 0 : 1)) fail("UnicodeDecodeError", "utf-8");
      for (let k = 1; k <= need; k++) {
        const next = bytes[index + k];
        if ((next & 0xc0) !== 0x80) fail("UnicodeDecodeError", "utf-8");
        code = (code << 6) | (next & 63);
      }
      if (code < min || code > 0x10ffff) fail("UnicodeDecodeError", "utf-8");
      index += need + 1;
      if (code > 0xffff) { code -= 0x10000; chunk.push(0xd800 + (code >> 10), 0xdc00 + (code & 1023)); }
      else chunk.push(code);
      if (chunk.length > 8000) { parts.push(String.fromCharCode(...chunk)); chunk = []; }
    }
    parts.push(String.fromCharCode(...chunk));
    return parts.join("");
  }
  function decodeUtf16(bytes, littleEndian, surrogatePass) {
    if (bytes.length % 2) fail("UnicodeDecodeError", "utf-16");
    const parts = [];
    let chunk = [];
    for (let index = 0; index < bytes.length; index += 2) {
      const unit = littleEndian ? bytes[index] | (bytes[index + 1] << 8) : (bytes[index] << 8) | bytes[index + 1];
      if (!surrogatePass) {
        if (unit >= 0xd800 && unit <= 0xdbff) {
          const next = index + 3 < bytes.length ? (littleEndian ? bytes[index + 2] | (bytes[index + 3] << 8) : (bytes[index + 2] << 8) | bytes[index + 3]) : -1;
          if (next < 0xdc00 || next > 0xdfff) fail("UnicodeDecodeError", "utf-16");
          chunk.push(unit, next);
          index += 2;
          continue;
        }
        if (unit >= 0xdc00 && unit <= 0xdfff) fail("UnicodeDecodeError", "utf-16");
      }
      chunk.push(unit);
      if (chunk.length > 8000) { parts.push(String.fromCharCode(...chunk)); chunk = []; }
    }
    parts.push(String.fromCharCode(...chunk));
    return parts.join("");
  }
  function decodeUtf16Bom(bytes, surrogatePass) {   // Python 'utf-16': BOM decides, default little endian
    if (bytes[0] === 0xff && bytes[1] === 0xfe) return decodeUtf16(bytes.subarray(2), true, surrogatePass);
    if (bytes[0] === 0xfe && bytes[1] === 0xff) return decodeUtf16(bytes.subarray(2), false, surrogatePass);
    return decodeUtf16(bytes, true, surrogatePass);
  }
  function decodeUtf32(bytes, littleEndian, surrogatePass) {
    if (bytes.length % 4) fail("UnicodeDecodeError", "utf-32");
    let out = "";
    for (let index = 0; index < bytes.length; index += 4) {
      const code = littleEndian
        ? (bytes[index] | (bytes[index + 1] << 8) | (bytes[index + 2] << 16)) + bytes[index + 3] * 0x1000000
        : (bytes[index + 3] | (bytes[index + 2] << 8) | (bytes[index + 1] << 16)) + bytes[index] * 0x1000000;
      if (code > 0x10ffff || (!surrogatePass && code >= 0xd800 && code <= 0xdfff)) fail("UnicodeDecodeError", "utf-32");
      out += String.fromCodePoint(code);
    }
    return out;
  }
  function decodeUtf32Bom(bytes, surrogatePass) {
    if (bytes[0] === 0xff && bytes[1] === 0xfe && bytes[2] === 0 && bytes[3] === 0) return decodeUtf32(bytes.subarray(4), true, surrogatePass);
    if (bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 0xfe && bytes[3] === 0xff) return decodeUtf32(bytes.subarray(4), false, surrogatePass);
    return decodeUtf32(bytes, true, surrogatePass);
  }
  const CP949 = TABLES.cp949;   // lead 0x81..0xfe x trail 0x41..0xfe, "\u0000" = invalid
  function decodeCp949(bytes) {
    let out = "";
    let chunk = [];
    for (let index = 0; index < bytes.length; index++) {
      const byte = bytes[index];
      if (byte < 0x80) { chunk.push(byte); }
      else {
        if (byte < 0x81 || byte > 0xfe || index + 1 >= bytes.length) fail("UnicodeDecodeError", "cp949");
        const trail = bytes[++index];
        if (trail < 0x41 || trail > 0xfe) fail("UnicodeDecodeError", "cp949");
        const code = CP949.charCodeAt((byte - 0x81) * 190 + (trail - 0x41));
        if (!code) fail("UnicodeDecodeError", "cp949");
        chunk.push(code);
      }
      if (chunk.length > 8000) { out += String.fromCharCode(...chunk); chunk = []; }
    }
    return out + String.fromCharCode(...chunk);
  }
  const CP437 = TABLES.cp437;
  function decodeCp437(bytes) {
    let out = "";
    for (const byte of bytes) out += CP437[byte];
    return out;
  }
  const startsWithBytes = (bytes, ...prefix) => prefix.every((byte, index) => bytes[index] === byte);

  function _decoded(payload, legacyText) {
    try {
      if (startsWithBytes(payload, 0xff, 0xfe) || startsWithBytes(payload, 0xfe, 0xff)) return decodeUtf16Bom(payload, false);
      return decodeUtf8(payload, { sig: true });
    } catch (error) {
      if (!isA(error, "UnicodeError")) throw error;
      if (legacyText) {
        try {
          return decodeCp949(payload);
        } catch (inner) {
          if (!isA(inner, "UnicodeError")) throw inner;
        }
      }
      fail("ValueError", MSG.badEncoding);
    }
  }

  // ---------------------------------------------------------------- JSON (Python json module semantics)
  const KEY_ORDER = new WeakMap();   // object -> keys in source order when JavaScript would reorder them
  const INTEGER_KEY = /"(?:0|[1-9][0-9]{0,9})"[ \t\n\r]*:/;
  const isIndexKey = key => /^(?:0|[1-9][0-9]*)$/.test(key) && Number(key) < 4294967295;
  const pyKeys = object => KEY_ORDER.get(object) || Object.keys(object);
  class PyJson {
    constructor(text) { this.text = text; this.index = 0; }
    error() { fail("JSONDecodeError", "Expecting value"); }
    ws() {
      const text = this.text;
      let index = this.index;
      for (;;) { const c = text.charCodeAt(index); if (c === 32 || c === 9 || c === 10 || c === 13) index++; else break; }
      this.index = index;
    }
    value(depth) {
      if (depth > 100000) fail("RecursionError", "maximum recursion depth exceeded");
      const text = this.text;
      const c = text[this.index];
      if (c === "{") return this.object(depth);
      if (c === "[") return this.array(depth);
      if (c === '"') return this.string();
      if (c === "n" && text.startsWith("null", this.index)) { this.index += 4; return null; }
      if (c === "t" && text.startsWith("true", this.index)) { this.index += 4; return true; }
      if (c === "f" && text.startsWith("false", this.index)) { this.index += 5; return false; }
      if (c === "N" && text.startsWith("NaN", this.index)) { this.index += 3; return NaN; }
      if (c === "I" && text.startsWith("Infinity", this.index)) { this.index += 8; return Infinity; }
      if (c === "-" && text.startsWith("-Infinity", this.index)) { this.index += 9; return -Infinity; }
      const match = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?/y;
      match.lastIndex = this.index;
      const found = match.exec(text);
      if (!found || !found[0] || found[0] === "-") this.error();
      this.index += found[0].length;
      return Number(found[0]);
    }
    string() {
      const text = this.text;
      let index = this.index + 1, out = "", start = index;
      for (;;) {
        if (index >= text.length) fail("JSONDecodeError", "Unterminated string");
        const c = text.charCodeAt(index);
        if (c === 34) { out += text.slice(start, index); this.index = index + 1; return out; }
        if (c < 0x20) fail("JSONDecodeError", "Invalid control character");
        if (c === 92) {
          out += text.slice(start, index);
          const e = text[index + 1];
          const simple = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" }[e];
          if (simple !== undefined) { out += simple; index += 2; }
          else if (e === "u") {
            const hex = text.slice(index + 2, index + 6);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail("JSONDecodeError", "Invalid \\uXXXX escape");
            out += String.fromCharCode(parseInt(hex, 16));
            index += 6;
          } else fail("JSONDecodeError", "Invalid \\escape");
          start = index;
          continue;
        }
        index++;
      }
    }
    array(depth) {
      const out = [];
      this.index++;
      this.ws();
      if (this.text[this.index] === "]") { this.index++; return out; }
      for (;;) {
        out.push(this.value(depth + 1));
        this.ws();
        const c = this.text[this.index];
        if (c === "]") { this.index++; return out; }
        if (c !== ",") fail("JSONDecodeError", "Expecting ',' delimiter");
        this.index++;
        this.ws();
      }
    }
    object(depth) {
      const out = {};
      let order = null;
      const keys = [];
      const seen = new Set();
      this.index++;
      this.ws();
      if (this.text[this.index] === "}") { this.index++; return out; }
      for (;;) {
        if (this.text[this.index] !== '"') fail("JSONDecodeError", "Expecting property name enclosed in double quotes");
        const key = this.string();
        this.ws();
        if (this.text[this.index] !== ":") fail("JSONDecodeError", "Expecting ':' delimiter");
        this.index++;
        this.ws();
        const value = this.value(depth + 1);
        if (key === "__proto__") Object.defineProperty(out, key, { value, writable: true, enumerable: true, configurable: true });
        else out[key] = value;
        if (!seen.has(key)) { seen.add(key); keys.push(key); if (isIndexKey(key)) order = true; }
        this.ws();
        const c = this.text[this.index];
        if (c === "}") { this.index++; break; }
        if (c !== ",") fail("JSONDecodeError", "Expecting ',' delimiter");
        this.index++;
        this.ws();
      }
      if (order) KEY_ORDER.set(out, keys);
      return out;
    }
  }
  function slowLoads(text, start) {
    const parser = new PyJson(text);
    parser.index = start;
    return parser;
  }
  function jsonLoads(text) {   // json.loads(str)
    if (text.charCodeAt(0) === 0xfeff) fail("JSONDecodeError", "Unexpected UTF-8 BOM");
    if (!INTEGER_KEY.test(text)) {
      try { return JSON.parse(text); } catch { /* Python may still accept NaN or Infinity */ }
    }
    const parser = slowLoads(text, 0);
    parser.ws();
    const value = parser.value(0);
    parser.ws();
    if (parser.index !== text.length) fail("JSONDecodeError", "Extra data");
    return value;
  }
  function jsonRawDecode(text, start) {   // JSONDecoder().raw_decode(text, start) -> [value, end]
    let depth = 0, index = start, inString = false;
    for (; index < text.length; index++) {
      const c = text.charCodeAt(index);
      if (inString) {
        if (c === 92) index++;
        else if (c === 34) inString = false;
        continue;
      }
      if (c === 34) inString = true;
      else if (c === 91 || c === 123) depth++;
      else if (c === 93 || c === 125) { depth--; if (!depth) break; }
    }
    if (index < text.length) {
      const slice = text.slice(start, index + 1);
      if (!INTEGER_KEY.test(slice)) {
        try { return [JSON.parse(slice), index + 1]; } catch { /* fall back */ }
      }
    }
    const parser = slowLoads(text, start);
    const value = parser.value(0);
    return [value, parser.index];
  }
  function detectEncoding(bytes) {   // json.detect_encoding
    if (startsWithBytes(bytes, 0, 0, 0xfe, 0xff) || startsWithBytes(bytes, 0xff, 0xfe, 0, 0)) return "utf-32";
    if (startsWithBytes(bytes, 0xfe, 0xff) || startsWithBytes(bytes, 0xff, 0xfe)) return "utf-16";
    if (startsWithBytes(bytes, 0xef, 0xbb, 0xbf)) return "utf-8-sig";
    if (bytes.length >= 4) {
      if (!bytes[0]) return bytes[1] ? "utf-16-be" : "utf-32-be";
      if (!bytes[1]) return bytes[2] || bytes[3] ? "utf-16-le" : "utf-32-le";
    } else if (bytes.length === 2) {
      if (!bytes[0]) return "utf-16-be";
      if (!bytes[1]) return "utf-16-le";
    }
    return "utf-8";
  }
  function jsonLoadsBytes(bytes) {   // json.loads(bytes): decode with 'surrogatepass', no BOM check afterwards
    const encoding = detectEncoding(bytes);
    let text;
    if (encoding === "utf-8") text = decodeUtf8(bytes, { surrogatePass: true });
    else if (encoding === "utf-8-sig") text = decodeUtf8(bytes, { sig: true, surrogatePass: true });
    else if (encoding === "utf-16") text = decodeUtf16Bom(bytes, true);
    else if (encoding === "utf-16-le") text = decodeUtf16(bytes, true, true);
    else if (encoding === "utf-16-be") text = decodeUtf16(bytes, false, true);
    else if (encoding === "utf-32") text = decodeUtf32Bom(bytes, true);
    else if (encoding === "utf-32-le") text = decodeUtf32(bytes, true, true);
    else text = decodeUtf32(bytes, false, true);
    if (!INTEGER_KEY.test(text)) {
      try { return JSON.parse(text); } catch { /* slow path below */ }
    }
    const parser = slowLoads(text, 0);
    parser.ws();
    const value = parser.value(0);
    parser.ws();
    if (parser.index !== text.length) fail("JSONDecodeError", "Extra data");
    return value;
  }
  // json.dumps(value, ensure_ascii=True) with the default ", " and ": " separators
  function dumpsAscii(value) {
    if (typeof value === "string") {
      let out = '"';
      for (let index = 0; index < value.length; index++) {
        const code = value.charCodeAt(index);
        if (code === 34) out += '\\"';
        else if (code === 92) out += "\\\\";
        else if (code === 10) out += "\\n";
        else if (code === 13) out += "\\r";
        else if (code === 9) out += "\\t";
        else if (code === 8) out += "\\b";
        else if (code === 12) out += "\\f";
        else if (code < 0x20 || code > 0x7e) out += "\\u" + code.toString(16).padStart(4, "0");
        else out += value[index];
      }
      return out + '"';
    }
    if (Array.isArray(value)) return "[" + value.map(dumpsAscii).join(", ") + "]";
    if (value === null || value === undefined) return "null";
    if (value === true) return "true";
    if (value === false) return "false";
    if (typeof value === "number") return String(value);
    return "{" + Object.keys(value).map(key => dumpsAscii(key) + ": " + dumpsAscii(value[key])).join(", ") + "}";
  }
  // str() of a JSON value, close enough for substring tests ("gemini" in hint)
  function pyStrLike(value, nested) {
    if (typeof value === "string") return nested ? "'" + value + "'" : value;
    if (value === null || value === undefined) return "None";
    if (value === true) return "True";
    if (value === false) return "False";
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) return "[" + value.map(item => pyStrLike(item, true)).join(", ") + "]";
    return "{" + pyKeys(value).map(key => "'" + key + "': " + pyStrLike(value[key], true)).join(", ") + "}";
  }
  function pyStr(value) {   // str(value) for restore ids
    return pyStrLike(value, false);
  }

  // ---------------------------------------------------------------- SHA-256, CRC-32, base64
  const K256 = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  function sha256Hex(bytes) {
    const length = bytes.length;
    const total = ((length + 9 + 63) >> 6) << 6;
    const data = new Uint8Array(total);
    data.set(bytes);
    data[length] = 0x80;
    const bits = length * 8;
    const view = new DataView(data.buffer);
    view.setUint32(total - 8, Math.floor(bits / 0x100000000));
    view.setUint32(total - 4, bits >>> 0);
    const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const w = new Uint32Array(64);
    for (let offset = 0; offset < total; offset += 64) {
      for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
      for (let i = 16; i < 64; i++) {
        const a = w[i - 15], b = w[i - 2];
        const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
        const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], k = h[7];
      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const t1 = (k + S1 + ((e & f) ^ (~e & g)) + K256[i] + w[i]) >>> 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        k = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += k;
    }
    return [...h].map(value => value.toString(16).padStart(8, "0")).join("");
  }
  const asciiBytes = text => { const out = new Uint8Array(text.length); for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i); return out; };
  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
    return table;
  })();
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  function base64(bytes) {
    let out = "";
    let i = 0;
    for (; i + 2 < bytes.length; i += 3) {
      const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      out += B64[n >> 18] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
    }
    if (i < bytes.length) {
      const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8);
      out += B64[n >> 18] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : "=") + "=";
    }
    return out;
  }

  // ---------------------------------------------------------------- datetime (C implementation of CPython 3.13 on Windows)
  const DIM = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const DBM = [-1, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const isLeap = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = (year, month) => (month === 2 && isLeap(year) ? 29 : DIM[month]);
  const daysBeforeYear = year => { const y = year - 1; return y * 365 + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400); };
  const ymdToOrd = (year, month, day) => daysBeforeYear(year) + DBM[month] + (month > 2 && isLeap(year) ? 1 : 0) + day;
  function ordToYmd(ordinal) {
    let n = ordinal - 1;
    const n400 = Math.floor(n / 146097); n -= n400 * 146097;
    let year = n400 * 400 + 1;
    const n100 = Math.floor(n / 36524); n -= n100 * 36524;
    const n4 = Math.floor(n / 1461); n -= n4 * 1461;
    const n1 = Math.floor(n / 365); n -= n1 * 365;
    year += n100 * 100 + n4 * 4 + n1;
    if (n1 === 4 || n100 === 4) return [year - 1, 12, 31];
    const leap = n1 === 3 && (n4 !== 24 || n100 === 3);
    let month = (n + 50) >> 5;
    let preceding = DBM[month] + (month > 2 && leap ? 1 : 0);
    if (preceding > n) { month -= 1; preceding -= DIM[month] + (month === 2 && leap ? 1 : 0); }
    return [year, month, n - preceding + 1];
  }
  const ORD_MAX = ymdToOrd(9999, 12, 31);
  const EPOCH_ORD = ymdToOrd(1970, 1, 1);
  function makeDT(year, month, day, hour, minute, second, us, off, korea) {
    if (year < 1 || year > 9999) fail("ValueError", "year is out of range");
    if (month < 1 || month > 12) fail("ValueError", "month must be in 1..12");
    if (day < 1 || day > daysInMonth(year, month)) fail("ValueError", "day is out of range for month");
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59 || us < 0 || us > 999999) fail("ValueError", "time out of range");
    return new PyDT(ymdToOrd(year, month, day), hour * 3600 + minute * 60 + second, us, off, korea);
  }
  function shift(dt, seconds, micro) {   // dt + timedelta, OverflowError outside year 1..9999
    let us = dt.us + micro;
    let sec = dt.sec + seconds + Math.floor(us / 1e6);
    us -= Math.floor(us / 1e6) * 1e6;
    const days = Math.floor(sec / 86400);
    sec -= days * 86400;
    const ord = dt.ord + days;
    if (ord < 1 || ord > ORD_MAX) fail("OverflowError", "date value out of range");
    return new PyDT(ord, sec, us, dt.off, dt.korea);
  }
  const KOREA_TZ = { sec: KOREA_OFFSET, us: 0 };
  function astimezoneKorea(dt) {
    if (dt.korea) return dt;
    const utc = shift(dt, -dt.off.sec, -dt.off.us);
    const local = shift(utc, KOREA_OFFSET, 0);
    return new PyDT(local.ord, local.sec, local.us, KOREA_TZ, true);
  }
  const replaceKorea = dt => new PyDT(dt.ord, dt.sec, dt.us, KOREA_TZ, true);
  const pad = (number, width) => String(number).padStart(width, "0");
  function isoDate(ord) {
    const [year, month, day] = ordToYmd(ord);
    return pad(year, 4) + "-" + pad(month, 2) + "-" + pad(day, 2);
  }
  function isoformat(dt, sep = "T") {
    let text = isoDate(dt.ord) + sep + pad(Math.floor(dt.sec / 3600), 2) + ":" + pad(Math.floor(dt.sec / 60) % 60, 2) + ":" + pad(dt.sec % 60, 2);
    if (dt.us) text += "." + pad(dt.us, 6);
    if (dt.off) {
      let total = dt.off.sec * 1e6 + dt.off.us;
      const sign = total < 0 ? "-" : "+";
      total = Math.abs(total);
      const us = total % 1e6, secs = (total - us) / 1e6;
      text += sign + pad(Math.floor(secs / 3600), 2) + ":" + pad(Math.floor(secs / 60) % 60, 2);
      if (secs % 60 || us) text += ":" + pad(secs % 60, 2);
      if (us) text += "." + pad(us, 6);
    }
    return text;
  }
  function cRound(x) { const t = Math.trunc(x); return Math.abs(x - t) >= 0.5 ? t + Math.sign(x) : t; }
  function roundHalfEven(x) { let r = cRound(x); if (Math.abs(x - r) === 0.5) r = 2 * cRound(x / 2); return r; }
  function fromTimestampUtc(value) {   // datetime.fromtimestamp(value, timezone.utc) on Windows
    if (Number.isNaN(value)) fail("ValueError", "Invalid value NaN (not a number)");
    if (!Number.isFinite(value)) fail("OverflowError", "timestamp out of range");
    let seconds = Math.trunc(value);
    let fraction = roundHalfEven((value - seconds) * 1e6);
    if (fraction >= 1e6) { fraction -= 1e6; seconds += 1; }
    else if (fraction < 0) { fraction += 1e6; seconds -= 1; }
    if (!(seconds >= -9223372036854775808 && seconds < 9223372036854775808)) fail("OverflowError", "timestamp out of range for platform time_t");
    if (seconds < -43200 || seconds > 32536850399) fail("OSError", "[Errno 22] Invalid argument");   // gmtime_s range
    const days = Math.floor(seconds / 86400);
    return new PyDT(EPOCH_ORD + days, seconds - days * 86400, fraction, { sec: 0, us: 0 }, false);
  }
  // datetime.fromisoformat (C code works on the UTF-8 bytes)
  function parseDigits(at, p, count) {
    let value = 0;
    for (let i = 0; i < count; i++) {
      const digit = at(p++) - 48;
      if (digit < 0 || digit > 9) return null;
      value = value * 10 + digit;
    }
    return [p, value];
  }
  const isDigitByte = byte => byte >= 48 && byte <= 57;
  function weekday(year, month, day) { return (ymdToOrd(year, month, day) + 6) % 7; }
  function isoToYmd(isoYear, isoWeek, isoDay) {
    if (isoYear < 1 || isoYear > 9999) return -4;
    if (isoWeek <= 0 || isoWeek >= 53) {
      let out = true;
      if (isoWeek === 53) { const first = weekday(isoYear, 1, 1); if (first === 3 || (first === 2 && isLeap(isoYear))) out = false; }
      if (out) return -2;
    }
    if (isoDay <= 0 || isoDay >= 8) return -3;
    const firstDay = ymdToOrd(isoYear, 1, 1);
    const firstWeekday = (firstDay + 6) % 7;
    let monday = firstDay - firstWeekday;
    if (firstWeekday > 3) monday += 7;
    return ordToYmd(monday + (isoWeek - 1) * 7 + isoDay - 1);
  }
  function parseIsoDate(at, length) {   // returns [year, month, day] or a negative code
    let r = parseDigits(at, 0, 4);
    if (!r) return -1;
    let p = r[0];
    const year = r[1];
    const separator = at(p) === 45;
    if (separator) p++;
    if (at(p) === 87) {
      p++;
      r = parseDigits(at, p, 2);
      if (!r) return -3;
      p = r[0];
      const week = r[1];
      let day = 1;
      if (p < length) {
        if (separator && at(p++) !== 45) return -2;
        r = parseDigits(at, p, 1);
        if (!r) return -4;
        day = r[1];
      }
      const result = isoToYmd(year, week, day);
      return typeof result === "number" ? -3 + result : result;
    }
    r = parseDigits(at, p, 2);
    if (!r) return -1;
    p = r[0];
    const month = r[1];
    if (separator && at(p++) !== 45) return -2;
    r = parseDigits(at, p, 2);
    if (!r) return -1;
    return [year, month, r[1]];
  }
  function parseHms(at, p, end) {   // parse_hh_mm_ss_ff -> {rv, values, p}
    const values = [0, 0, 0];
    let us = 0, separator = true, broke = false;
    for (let i = 0; i < 3; i++) {
      const r = parseDigits(at, p, 2);
      if (!r) return { rv: -3 };
      p = r[0];
      values[i] = r[1];
      const c = at(p++);
      if (i === 0) separator = c === 58;
      if (p >= end) return { rv: c !== 0 ? 1 : 0, values, us };
      if (separator && c === 58) continue;
      if (c === 46 || c === 44) { broke = true; break; }
      if (!separator) p--;
      else return { rv: -4 };
    }
    if (!broke && false) return { rv: 0, values, us };
    const remains = end - p;
    const count = remains >= 6 ? 6 : remains;
    const r = parseDigits(at, p, count);
    if (!r) return { rv: -3 };
    p = r[0];
    us = r[1];
    if (count < 6) us *= [100000, 10000, 1000, 100, 10][count - 1];
    while (isDigitByte(at(p))) p++;
    return { rv: at(p) !== 0 ? 1 : 0, values, us };
  }
  function parseIsoTime(at, start, length) {
    const end = start + length;
    let tz = start;
    do {
      const c = at(tz);
      if (c === 90 || c === 43 || c === 45) break;
    } while (++tz < end);
    const time = parseHms(at, start, tz);
    if (time.rv < 0) return { rv: time.rv };
    if (tz === end) return time.rv === 1 ? { rv: -5 } : { rv: 0, time };
    if (at(tz) === 90) return at(tz + 1) !== 0 ? { rv: -5 } : { rv: 1, time, off: 0, offUs: 0 };
    const sign = at(tz) === 45 ? -1 : 1;
    const zone = parseHms(at, tz + 1, end);
    if (zone.rv < 0) return { rv: -5 };
    const [h, m, s] = zone.values || [0, 0, 0];
    return { rv: zone.rv ? -5 : 1, time, off: sign * (h * 3600 + m * 60 + s), offUs: sign * (zone.us || 0) };
  }
  function findSeparator(at, length) {
    if (length === 7) return 7;
    if (at(4) === 45) {
      if (at(5) === 87) {
        if (length < 8) return -1;
        if (length > 8 && at(8) === 45) {
          if (length === 9) return -1;
          if (length > 10 && isDigitByte(at(10))) return 8;
          return 10;
        }
        return 8;
      }
      return 10;
    }
    if (at(4) === 87) {
      let index = 7;
      for (; index < length; index++) if (!isDigitByte(at(index))) break;
      if (index < 9) return index;
      return index % 2 === 0 ? 7 : 8;
    }
    return 8;
  }
  const invalidIso = () => fail("ValueError", "Invalid isoformat string");
  function fromIsoformat(text) {
    const chars = Array.from(text);
    if (chars.length < 7) invalidIso();
    for (const pos of [7, 8, 10]) {
      if (pos > chars.length) break;
      const char = chars[pos];
      if (char && char.length === 1 && char.charCodeAt(0) >= 0xd800 && char.charCodeAt(0) <= 0xdfff) { chars[pos] = "T"; break; }
    }
    const bytes = utf8Encode(chars.join(""), false);
    if (!bytes) invalidIso();
    const length = bytes.length;
    const at = index => (index >= 0 && index < length ? bytes[index] : 0);
    const separator = findSeparator(at, length);
    let date = parseIsoDate(at, separator < 0 ? Infinity : separator);
    let time = { rv: 0 };
    if (typeof date !== "number" && length > separator) {
      let p = separator;
      const lead = at(p);
      p += (lead & 0x80) === 0 ? 1 : (lead & 0xf0) === 0xe0 ? 3 : (lead & 0xf0) === 0xf0 ? 4 : 2;
      time = parseIsoTime(at, p, length - p);
      if (time.rv < 0) invalidIso();
    }
    if (typeof date === "number") invalidIso();
    const [hour, minute, second] = time.time ? time.time.values : [0, 0, 0];
    const us = time.time ? time.time.us : 0;
    let off = null;
    if (time.rv === 1) {
      if (time.off === 0) off = { sec: 0, us: 0 };
      else {
        const total = time.off * 1e6 + time.offUs;
        if (total <= -86400e6 || total >= 86400e6) fail("ValueError", "offset must be a timedelta strictly between -timedelta(hours=24) and timedelta(hours=24)");
        const secs = Math.floor(total / 1e6);
        off = { sec: secs, us: total - secs * 1e6 };
      }
    }
    return makeDT(date[0], date[1], date[2], hour, minute, second, us, off, false);
  }
  function dateFromIsoformat(text) {   // date.fromisoformat
    const bytes = utf8Encode(text, false);
    if (!bytes) invalidIso();
    const length = bytes.length;
    const at = index => (index >= 0 && index < length ? bytes[index] : 0);
    const date = length === 7 || length === 8 || length === 10 ? parseIsoDate(at, length) : -1;
    if (typeof date === "number") invalidIso();
    makeDT(date[0], date[1], date[2], 0, 0, 0, 0, null, false);
  }

  function _when(value) {
    try {
      let stamp;
      if (value instanceof PyDT) stamp = value;
      else if (typeof value === "number") stamp = fromTimestampUtc(value > 100000000000 ? value / 1000 : value);
      else if (typeof value === "string") stamp = fromIsoformat(strip(value).split("Z").join("+00:00"));
      else return null;
      return stamp.off ? astimezoneKorea(stamp) : replaceKorea(stamp);
    } catch (error) {
      if (isA(error, "OverflowError", "OSError", "ValueError")) return null;
      throw error;
    }
  }
  function _date(value) {
    const stamp = _when(value);
    return stamp ? isoDate(stamp.ord) : "";
  }
  function todayKorea() {
    const now = Date.now() / 1000 + KOREA_OFFSET;
    return isoDate(EPOCH_ORD + Math.floor(now / 86400));
  }
  function validDate(year, month, day) {
    return year >= 1 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
  }
  function _fileDate(name) {
    const match = DAY_PATTERN.exec(name);
    if (match) {
      const [year, month, day] = match[0].split(/[-.]/).map(pyInt);
      if (validDate(year, month, day)) return pad(year, 4) + "-" + pad(month, 2) + "-" + pad(day, 2);
    }
    return "";
  }

  // ---------------------------------------------------------------- paths
  function posixParts(path) { return path.split("/").filter(part => part && part !== "."); }
  function posixName(path) { const parts = posixParts(path); return parts.length ? parts[parts.length - 1] : ""; }
  function nameSuffix(name) { const i = name.lastIndexOf("."); return i > 0 && i < name.length - 1 ? name.slice(i) : ""; }
  function nameStem(name) { const i = name.lastIndexOf("."); return i > 0 && i < name.length - 1 ? name.slice(0, i) : name; }
  const _fileName = name => posixName(name.split("\\").join("/"));
  function winParse(path) {   // pathlib.WindowsPath parsing -> [drive, root, parts]
    if (!path) return ["", "", []];
    const normal = path.split("/").join("\\");
    let drive = "", root = "", rest = normal;
    if (normal[0] === "\\") {
      if (normal[1] === "\\") {
        const start = normal.slice(0, 8).toUpperCase() === "\\\\?\\UNC\\" ? 8 : 2;
        const index = normal.indexOf("\\", start);
        const index2 = index < 0 ? -1 : normal.indexOf("\\", index + 1);
        if (index < 0 || index2 < 0) { drive = normal; rest = ""; }
        else { drive = normal.slice(0, index2); root = "\\"; rest = normal.slice(index2 + 1); }
      } else { root = "\\"; rest = normal.slice(1); }
    } else if (normal[1] === ":") {
      drive = normal.slice(0, 2);
      if (normal[2] === "\\") { root = "\\"; rest = normal.slice(3); } else rest = normal.slice(2);
    }
    if (!root && drive.startsWith("\\") && !drive.endsWith("\\")) {
      const parts = drive.split("\\");
      if ((parts.length === 4 && !"?.".includes(parts[2])) || parts.length === 6) root = "\\";
    }
    return [drive, root, rest.split("\\").filter(part => part && part !== ".")];
  }
  function winName(path) { const parts = winParse(path)[2]; return parts.length ? parts[parts.length - 1] : ""; }
  const winSuffix = path => nameSuffix(winName(path));
  function winWithSuffix(path, suffix) {
    const [drive, root, parts] = winParse(path);
    const stem = nameStem(parts.length ? parts[parts.length - 1] : "");
    if (!stem) fail("ValueError", "empty name");
    parts[parts.length - 1] = stem + suffix;
    if (drive || root) return drive + root + parts.join("\\");
    if (parts.length && winParse(parts[0])[0]) parts.unshift(".");
    return parts.join("\\") || ".";
  }
  const _project = value => { const text = rstripChars(strip(_str(value)), "/\\"); return text ? _fileName(text) : ""; };

  // ---------------------------------------------------------------- urllib.parse.urlsplit
  function partition(text, sep) { const i = text.indexOf(sep); return i < 0 ? [text, "", ""] : [text.slice(0, i), sep, text.slice(i + sep.length)]; }
  function rpartition(text, sep) { const i = text.lastIndexOf(sep); return i < 0 ? ["", "", text] : [text.slice(0, i), sep, text.slice(i + sep.length)]; }
  function ipv4Ok(text) {
    if (!text || text.includes("/")) return false;
    const octets = text.split(".");
    if (octets.length !== 4) return false;
    return octets.every(octet => octet && /^[0-9]+$/.test(octet) && octet.length <= 3 && !(octet !== "0" && octet[0] === "0") && Number(octet) <= 255);
  }
  function ipv6Ok(text) {
    if (text.includes("/")) return false;
    const [address, sep, scope] = partition(text, "%");
    if (sep && (!scope || scope.includes("%"))) return false;
    if (!address || cpLength(address) > 45) return false;
    let parts = address.split(":");
    if (parts.length > 10) parts = parts.slice(0, 9).concat([parts.slice(9).join(":")]);
    if (parts.length < 3) return false;
    if (parts[parts.length - 1].includes(".")) {
      if (!ipv4Ok(parts.pop())) return false;
      parts.push("0", "0");
    }
    if (parts.length > 9) return false;
    let skip = null;
    for (let i = 1; i < parts.length - 1; i++) {
      if (!parts[i]) { if (skip !== null) return false; skip = i; }
    }
    let hi, lo;
    if (skip !== null) {
      hi = skip; lo = parts.length - skip - 1;
      if (!parts[0]) { hi -= 1; if (hi) return false; }
      if (!parts[parts.length - 1]) { lo -= 1; if (lo) return false; }
      if (8 - (hi + lo) < 1) return false;
    } else {
      if (parts.length !== 8 || !parts[0] || !parts[parts.length - 1]) return false;
      hi = parts.length; lo = 0;
    }
    const hextet = part => /^[0-9A-Fa-f]{1,4}$/.test(part);
    for (let i = 0; i < hi; i++) if (!hextet(parts[i])) return false;
    for (let i = parts.length - lo; i < parts.length; i++) if (!hextet(parts[i])) return false;
    return true;
  }
  function checkBracketedNetloc(netloc) {
    const hostAndPort = rpartition(netloc, "@")[2];
    const [before, open, bracketed] = partition(hostAndPort, "[");
    let hostname;
    if (open) {
      if (before) fail("ValueError", "Invalid IPv6 URL");
      const [host, , port] = partition(bracketed, "]");
      if (port && !port.startsWith(":")) fail("ValueError", "Invalid IPv6 URL");
      hostname = host;
    } else hostname = partition(hostAndPort, ":")[0];
    if (hostname.startsWith("v")) {
      if (!/^v[a-fA-F0-9]+\.[^\n]+$/.test(hostname)) fail("ValueError", "IPvFuture address is invalid");
    } else if (ipv4Ok(hostname)) fail("ValueError", "An IPv4 address cannot be in brackets");
    else if (!ipv6Ok(hostname)) fail("ValueError", "does not appear to be an IPv4 or IPv6 address");
  }
  function urlsplit(url) {
    url = url.replace(/^[\x00-\x20]+/, "").replace(/[\t\r\n]/g, "");
    let scheme = "", netloc = "", query = "", fragment = "";
    const colon = url.indexOf(":");
    if (colon > 0 && /^[A-Za-z]/.test(url) && /^[A-Za-z0-9+\-.]*$/.test(url.slice(0, colon))) {
      scheme = url.slice(0, colon).toLowerCase();
      url = url.slice(colon + 1);
    }
    if (url.slice(0, 2) === "//") {
      let end = url.length;
      for (const c of "/?#") { const i = url.indexOf(c, 2); if (i >= 0) end = Math.min(end, i); }
      netloc = url.slice(2, end);
      url = url.slice(end);
      if (netloc.includes("[") !== netloc.includes("]")) fail("ValueError", "Invalid IPv6 URL");
      if (netloc.includes("[") && netloc.includes("]")) checkBracketedNetloc(netloc);
    }
    if (url.includes("#")) [url, , fragment] = partition(url, "#");
    if (url.includes("?")) [url, , query] = partition(url, "?");
    if (netloc && /[^\x00-\x7f]/.test(netloc)) {
      const n = netloc.split("@").join("").split(":").join("").split("#").join("").split("?").join("");
      const normal = n.normalize("NFKC");
      if (n !== normal) for (const c of "/?#@:") if (normal.includes(c)) fail("ValueError", "netloc contains invalid characters under NFKC normalization");
    }
    return { scheme, netloc, path: url, query, fragment };
  }
  function urlUsername(parts) {
    const [userinfo, have] = rpartition(parts.netloc, "@");
    return have ? partition(userinfo, ":")[0] : null;
  }
  function urlHostname(parts) {
    const hostinfo = rpartition(parts.netloc, "@")[2];
    const [, open, bracketed] = partition(hostinfo, "[");
    const hostname = open ? partition(bracketed, "]")[0] : partition(hostinfo, ":")[0];
    if (!hostname) return null;
    const [host, percent, zone] = partition(hostname, "%");
    return host.toLowerCase() + percent + zone;
  }
  function _link(value) {
    value = strip(_str(value));
    let parsed;
    try {
      parsed = urlsplit(value);
    } catch (error) {
      if (isA(error, "ValueError")) return "";
      throw error;
    }
    return (parsed.scheme === "https" || parsed.scheme === "http") && parsed.netloc && !urlUsername(parsed) ? value : "";
  }
  function _geminiUrl(value) {
    const valid = _link(value);
    const parsed = urlsplit(valid);
    if (urlHostname(parsed) === "gemini.google.com" && GEMINI_PATH.test(parsed.path)) return "https://gemini.google.com" + rstripChars(parsed.path, "/");
    return "";
  }

  // ---------------------------------------------------------------- importers.py
  const _role = value => ROLE_NAMES.get(lower(strip(_str(value)))) || "";
  function _content(value) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      const parts = [];
      for (const item of value) { const part = _content(item); if (part) parts.push(part); }
      return parts.join("\n");
    }
    if (!isDict(value) || truthy(get(value, "thought"))) return "";
    const kind = lower(_str(or(get(value, "type"), get(value, "content_type"))));
    if (TEXT_TYPES.has(kind)) return _content(or(get(value, "text"), get(value, "parts"), get(value, "content"), get(value, "value")));
    return "";
  }
  function _thumbnail(value) {
    value = _str(value);
    return value.length <= 3000000 && THUMBNAIL.test(value) ? value : "";
  }
  function _contentImage(value) {
    if (Array.isArray(value)) {
      for (const part of value) { const image = _contentImage(part); if (image) return image; }
      return "";
    }
    if (!isDict(value)) return "";
    const descriptor = _object(or(get(value, "source"), get(value, "inlineData"), get(value, "inline_data")));
    const data = get(descriptor, "data");
    const imageType = or(get(descriptor, "media_type"), get(descriptor, "mimeType"), get(descriptor, "mime_type"));
    if (typeof data === "string" && typeof imageType === "string" && cpLength(data) < 3000000) return _thumbnail("data:" + imageType + ";base64," + data);
    const url = or(get(value, "image_url"), get(value, "url"));
    const direct = isDict(url) ? _thumbnail(get(url, "url")) : _thumbnail(url);
    return direct || _contentImage(or(get(value, "parts"), get(value, "content")));
  }
  function _assetImageKey(value) {
    if (Array.isArray(value)) {
      for (const part of value) { const key = _assetImageKey(part); if (key) return key; }
      return "";
    }
    if (!isDict(value)) return "";
    if (get(value, "content_type") === "image_asset_pointer") {
      const match = ASSET_ID.exec(_str(get(value, "asset_pointer")));
      return match ? match[1] : "";
    }
    return _assetImageKey(get(value, "parts"));
  }
  function _message(role, text, timestamp) {
    role = _role(role);
    text = strip(_str(text));
    if (!role || !text) return null;
    const result = { role, text };
    const stamp = _when(timestamp);
    if (stamp) result.timestamp = isoformat(stamp);
    return result;
  }
  function _makeRecord(source, messages, options = {}) {
    const { nativeId = null, keepId = false, title = "", project = "", when = null, fallbackDate = "", summary = "", thumbnail = "", favorite = null, link = "" } = options;
    messages = messages.filter(item => item);
    const visible = messages.filter(item => item.role === "user" || item.role === "assistant");
    if (!visible.length) return null;
    const firstUser = visible.find(item => item.role === "user");
    const first = firstUser ? firstUser.text : visible[0].text;
    let lastAnswer = first;
    for (let i = visible.length - 1; i >= 0; i--) if (visible[i].role === "assistant") { lastAnswer = visible[i].text; break; }
    const identity = _str(nativeId) || sha256Hex(asciiBytes(dumpsAscii(messages)));
    let day = _date(when);
    if (!day) { const stamped = visible.find(item => item.timestamp); day = stamped ? _date(stamped.timestamp) : ""; }
    const record = {
      id: keepId && truthy(nativeId) ? identity : source + "-" + sha256Hex(utf8Encode(identity, true)).slice(0, 24),
      source,
      title: _oneLine(title) || oneLinePrefix(first, 82),
      project: _oneLine(project) || MSG.unsorted,
      date: day || fallbackDate || todayKorea(),
      summary: _oneLine(summary) || oneLinePrefix(lastAnswer, 240),
      messages,
    };
    const thumb = _thumbnail(thumbnail);
    if (thumb) record.thumbnail = thumb;
    if (!isNone(favorite)) record.favorite = favorite === true;
    const validLink = _link(link);
    if (validLink) record.link = validLink;
    return record;
  }
  const _number = value => (typeof value === "number" ? value : value === true ? 1 : value === false ? 0 : 0);
  function _chatgpt(record, fallbackDate) {
    const mapping = record.mapping;
    let node = get(record, "current_node");
    if (typeof node !== "string" || !hasOwn(mapping, node)) {
      let best = null, bestKey;
      for (const key of pyKeys(mapping)) {
        const item = mapping[key];
        if (!isDict(item) || truthy(get(item, "children"))) continue;
        const value = _number(get(_object(get(item, "message")), "create_time"));
        if (best === null || value > bestKey) { best = key; bestKey = value; }
      }
      if (best !== null) node = best;
    }
    const chain = [], visited = new Set();
    while (typeof node === "string" && hasOwn(mapping, node) && !visited.has(node)) {
      visited.add(node);
      const item = _object(mapping[node]);
      chain.push(_object(get(item, "message")));
      node = get(item, "parent");
    }
    const messages = [];
    let thumbnail = "", imageKey = "";
    for (let i = chain.length - 1; i >= 0; i--) {
      const item = chain[i];
      const role = _str(get(_object(get(item, "author")), "role"));
      const metadata = _object(get(item, "metadata"));
      if ((role !== "user" && role !== "assistant") || truthy(get(metadata, "is_visually_hidden_from_conversation"))) continue;
      const recipient = get(item, "recipient");
      if (!isNone(recipient) && recipient !== "all") continue;
      const contents = get(item, "content");
      const attachedImage = _contentImage(contents);
      const attachedKey = _assetImageKey(contents);
      const body = _content(contents) || (attachedImage || attachedKey ? MSG.imageAttached : "");
      messages.push(_message(role, body, get(item, "create_time")));
      thumbnail = thumbnail || attachedImage;
      imageKey = imageKey || attachedKey;
    }
    const identity = _str(or(get(record, "id"), get(record, "conversation_id")));
    const generatedLink = CHATGPT_ID.test(identity) ? "https://chatgpt.com/c/" + identity : "";
    const result = _makeRecord("chatgpt", messages, {
      nativeId: identity, title: get(record, "title"),
      project: or(get(record, "project_name"), get(_object(get(record, "project")), "name"), get(record, "project")),
      when: get(record, "create_time"), fallbackDate, thumbnail, link: or(get(record, "link"), generatedLink),
    });
    if (result && imageKey && !thumbnail) result.imageKey = imageKey;
    return result;
  }
  function _generic(record, source, fallbackDate) {
    const raw = hasOwn(record, "messages") ? record.messages : get(record, "chat_messages");
    if (!Array.isArray(raw)) return null;
    source = lower(_str(get(record, "source"))) || source;
    if (!SOURCES.has(source)) source = "other";
    if (source === "other" && hasOwn(record, "chat_messages")) source = "claude";
    if (source === "other" && hasOwn(record, "sessionId") && hasOwn(record, "projectHash")) source = "gemini";
    const messages = [];
    let thumbnail = _thumbnail(get(record, "thumbnail"));
    for (let item of raw) {
      item = _object(item);
      const role = or(get(item, "role"), get(item, "sender"), get(item, "type"), get(_object(get(item, "author")), "role"));
      const kind = _role(role);
      if (kind !== "user" && kind !== "assistant") continue;
      const contents = or(get(item, "displayContent"), get(item, "text"), get(item, "content"), get(item, "parts"));
      const timestamp = or(get(item, "timestamp"), get(item, "created_at"), get(item, "time"));
      messages.push(_message(role, _content(contents), timestamp));
      thumbnail = thumbnail || _contentImage(contents);
    }
    const saved = hasOwn(record, "source") && typeof get(record, "date") === "string" && hasOwn(record, "messages");
    const directories = get(record, "directories");
    const geminiDir = Array.isArray(directories) && directories.length ? directories[0] : "";
    const result = _makeRecord(source, messages, {
      nativeId: or(get(record, "id"), get(record, "uuid"), get(record, "sessionId")),
      keepId: saved, title: or(get(record, "title"), get(record, "name")),
      project: or(get(_object(get(record, "project")), "name"), get(record, "project"), get(record, "project_name"), _project(geminiDir), _project(get(record, "cwd"))),
      when: or(get(record, "date"), get(record, "startTime"), get(record, "created_at"), get(record, "create_time")),
      fallbackDate, summary: get(record, "summary"), thumbnail,
      favorite: get(record, "favorite"), link: or(get(record, "link"), get(record, "url")),
    });
    if (result) { const origin = _oneLine(get(record, "origin")); if (origin) result.origin = origin; }
    return result;
  }
  const CLI_WRAPPERS = ["<command-name>", "<local-command-stdout>", "<local-command-caveat>", "<environment_context>", "<user_action>", "<task-notification>", "# AGENTS.md instructions for "];
  function _cleanCli(text) {
    REMINDER.lastIndex = 0;
    text = strip(text.replace(REMINDER, ""));
    return CLI_WRAPPERS.some(prefix => text.startsWith(prefix)) ? "" : text;
  }
  function _claude(rows, name, fallbackDate) {
    let identity = "", title = "", summary = "", cwd = "", when = null, thumbnail = "";
    const result = [], seen = new Set();
    for (const row of rows) {
      const kind = _str(get(row, "type"));
      if (kind === "custom-title" || kind === "ai-title" || kind === "summary") {
        if (kind === "custom-title") title = or(get(row, "customTitle"), title);
        else if (!truthy(title) && kind === "ai-title") title = or(get(row, "aiTitle"), title);
        else if (kind === "summary") summary = or(get(row, "summary"), summary);
        continue;
      }
      if ((kind !== "user" && kind !== "assistant") || ["isSidechain", "isMeta", "isCompactSummary"].some(key => truthy(get(row, key)))) continue;
      const message = _object(get(row, "message"));
      const contents = get(message, "content");
      let text = _content(contents);
      if (kind === "user") text = _cleanCli(text);
      const uid = _str(get(row, "uuid"));
      if (uid && seen.has(uid)) continue;
      const item = _message(kind, text, get(row, "timestamp"));
      if (item) {
        result.push(item);
        if (uid) seen.add(uid);
        identity = identity || _str(get(row, "sessionId"));
        cwd = cwd || _str(get(row, "cwd"));
        when = or(when, get(row, "timestamp"));
      }
      thumbnail = thumbnail || _contentImage(contents);
    }
    return _makeRecord("claude", result, {
      nativeId: identity || nameStem(_fileName(name)), title, project: _project(cwd), when, fallbackDate, thumbnail, summary,
    });
  }
  function _codex(rows, name, fallbackDate, titles) {
    let identity = "", cwd = "", when = null, thumbnail = "";
    const messages = [];
    for (const row of rows) {
      const kind = _str(get(row, "type")), payload = _object(get(row, "payload"));
      const subtype = _str(get(payload, "type"));
      if (kind === "session_meta") {
        const meta = truthy(_object(get(payload, "meta"))) ? _object(get(payload, "meta")) : payload;
        identity = _str(or(get(meta, "id"), get(meta, "session_id")));
        cwd = get(meta, "cwd");
        when = or(get(meta, "timestamp"), get(row, "timestamp"));
        if (truthy(get(meta, "agent_path")) || truthy(get(_object(get(meta, "source")), "subagent"))) return null;
      } else if (kind === "response_item" && subtype === "message") {
        const contents = get(payload, "content");
        messages.push(["response", _str(get(payload, "role")), _content(contents), get(row, "timestamp")]);
        thumbnail = thumbnail || _contentImage(contents);
      } else if (kind === "event_msg") {
        const item = _object(get(payload, "item"));
        const itemType = get(item, "type");
        if (subtype === "item_completed" && (itemType === "UserMessage" || itemType === "AgentMessage")) {
          messages.push(["item", itemType === "UserMessage" ? "user" : "assistant", _content(get(item, "content")), get(row, "timestamp")]);
          thumbnail = thumbnail || _contentImage(get(item, "content"));
        } else if (subtype === "user_message" || subtype === "agent_message") {
          messages.push(["event", subtype === "user_message" ? "user" : "assistant", _str(get(payload, "message")), get(row, "timestamp")]);
        }
      }
    }
    const preferred = new Map(), used = new Map();
    const key = (role, text) => role + "\u0000" + text;
    for (const [kind, role, text] of messages) {
      if (kind !== "response" && strip(text)) { const k = key(role, strip(text)); preferred.set(k, (preferred.get(k) || 0) + 1); }
    }
    const result = [];
    let last = null;
    for (const [kind, role, rawText, stamp] of messages) {
      if (role !== "user" && role !== "assistant") continue;
      const text = role === "user" ? _cleanCli(rawText) : strip(rawText);
      if (!text) continue;
      const k = key(role, text);
      if (kind === "response" && (used.get(k) || 0) < (preferred.get(k) || 0)) { used.set(k, (used.get(k) || 0) + 1); continue; }
      if (last && last[0] === role && last[1] === text && last[2] !== kind && kind !== "response" && last[2] !== "response") continue;
      result.push(_message(role, text, stamp));
      last = [role, text, kind];
    }
    return _makeRecord("codex", result, {
      nativeId: identity || nameStem(_fileName(name)), title: titles ? titles.get(identity) : undefined,
      project: _project(cwd), when, fallbackDate, thumbnail,
    });
  }
  function _geminiLines(rows, fallbackDate) {
    const metadata = newDict();
    let messages = new Map();
    const assign = (target, source) => { for (const k of Object.keys(source)) target[k] = source[k]; };
    for (const row of rows) {
      if (isDict(get(row, "$set"))) assign(metadata, row["$set"]);
      else if (hasOwn(row, "sessionId")) {
        assign(metadata, row);
        if (Array.isArray(get(row, "messages"))) {
          messages = new Map();
          row.messages.forEach((m, index) => { if (isDict(m)) messages.set(_str(get(m, "id")) || String(index), m); });
        }
      } else if (hasOwn(row, "$rewindTo")) {
        const end = row.$rewindTo;
        if (typeof end === "string" && messages.has(end)) {
          const next = new Map();
          for (const [k, v] of messages) { next.set(k, v); if (k === end) break; }
          messages = next;
        }
      } else if (hasOwn(row, "$patch")) {
        const patch = _object(row.$patch);
        let identity = _str(get(patch, "id"));
        if (messages.has(identity) && hasOwn(patch, "content")) messages.get(identity).content = patch.content;
        const updates = get(patch, "updates");
        for (let update of Array.isArray(updates) ? updates : []) {
          update = _object(update);
          identity = _str(get(update, "id"));
          if (messages.has(identity) && hasOwn(update, "content")) messages.get(identity).content = update.content;
        }
        const removed = get(patch, "removeIds");
        for (const id of Array.isArray(removed) ? removed : []) messages.delete(_str(id));
        const order = get(patch, "orderIds");
        if (Array.isArray(order)) {
          const next = new Map();
          for (const k of order) if (typeof k === "string" && messages.has(k)) next.set(k, messages.get(k));
          for (const [k, v] of messages) if (!next.has(k)) next.set(k, v);
          messages = next;
        }
      } else {
        const identity = _str(get(row, "id"));
        if (identity) messages.set(identity, row);
      }
    }
    if (get(metadata, "kind") === "subagent") return null;
    const record = newDict();
    assign(record, metadata);
    record.messages = [...messages.values()];
    return _generic(record, "gemini", fallbackDate);
  }
  const ZONES = { KST: 9, JST: 9, GMT: 0, UTC: 0, PDT: -7, PST: -8, EDT: -4, EST: -5, CEST: 2, CET: 1 };
  const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const FULL_MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const byLength = names => names.map((name, index) => [name, index]).sort((a, b) => b[0].length - a[0].length || a[1] - b[1]).map(item => item[0]);
  const STRP = {
    b: "(" + byLength(MONTHS).join("|") + ")", B: "(" + byLength(FULL_MONTHS).join("|") + ")",
    d: `(3[0-1]|[1-2]${D}|0[1-9]|[1-9]| [1-9])`, Y: `(${D}${D}${D}${D})`, I: `(1[0-2]|0[1-9]|[1-9]| [1-9])`,
    M: `([0-5]${D}|${D})`, S: `(6[0-1]|[0-5]${D}|${D})`, p: "(am|pm)",
  };
  const STRP_FORMATS = ["%b %d, %Y, %I:%M:%S %p", "%B %d, %Y, %I:%M:%S %p", "%b %d, %Y %I:%M:%S %p",
    "%B %d, %Y %I:%M:%S %p", "%b %d, %Y, %I:%M %p", "%B %d, %Y, %I:%M %p"].map(format => {
    const keys = [];
    const source = format.replace(/\s+/g, "\u0001").replace(/[.^$*+?()[\]{}|\\]/g, "\\$&").replace(/\u0001/g, S + "+")
      .replace(/%([a-zA-Z])/g, (_, key) => { keys.push(key); return STRP[key]; });
    return { keys, re: rx("^" + source + "$", "i") };
  });
  function strptimeActivity(display) {   // datetime.strptime(display, pattern) for the six patterns, or null
    for (const { keys, re } of STRP_FORMATS) {
      const match = re.exec(display);
      if (!match) continue;
      const found = {};
      keys.forEach((key, index) => { found[key] = match[index + 1]; });
      const year = pyInt(found.Y);
      const month = found.b ? MONTHS.indexOf(found.b.toLowerCase()) + 1 : FULL_MONTHS.indexOf(found.B.toLowerCase()) + 1;
      const day = pyInt(strip(found.d));
      let hour = pyInt(strip(found.I));
      const ampm = found.p.toLowerCase();
      if (ampm === "am") { if (hour === 12) hour = 0; } else if (hour !== 12) hour += 12;
      const minute = pyInt(found.M), second = found.S === undefined ? 0 : pyInt(found.S);
      if (!validDate(year, month, day) || second > 59) continue;
      return { year, month, day, hour, minute, second };
    }
    return null;
  }
  function _activityWhen(value) {
    const stamp = _when(value);
    if (stamp) return stamp;
    ACTIVITY_TIME.lastIndex = 0;
    const match = ACTIVITY_TIME.exec(_str(value));
    if (!match) return null;
    let display = _oneLine(match[0]);
    if (!/^[A-Za-z]/.test(display)) return _when(_fileDate(display.split(" ").join("").split("/").join("-")));
    let zone = null;
    const tail = display.slice(display.lastIndexOf(" ") + 1);
    if (hasOwn(ZONES, tail)) {
      zone = ZONES[tail];
      display = display.lastIndexOf(" ") >= 0 ? display.slice(0, display.lastIndexOf(" ")) : display;
    }
    const parts = strptimeActivity(display);
    if (!parts) return null;
    const local = makeDT(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second, 0,
      zone === null ? KOREA_TZ : { sec: zone * 3600, us: 0 }, zone === null);
    try {
      return astimezoneKorea(local);
    } catch (error) {
      if (isA(error, "OverflowError")) throw new PyError("OverflowError", "date value out of range");
      throw error;
    }
  }
  function compareStamp(a, b) { return a.ord - b.ord || a.sec - b.sec || a.us - b.us; }
  function _activityRecords(entries, fallbackDate) {
    const groups = new Map();
    entries.forEach((entry, index) => {
      const title = _str(get(entry, "title"));
      PROMPT.lastIndex = 0;
      const promptMatch = PROMPT.exec(title);
      const prompt = promptMatch ? strip(title.slice(promptMatch[0].length)) : _str(get(entry, "prompt"));
      const response = _content(or(get(entry, "response"), get(entry, "answer")));
      const when = _activityWhen(or(get(entry, "time"), get(entry, "timestamp")));
      const url = _geminiUrl(or(get(entry, "titleUrl"), get(entry, "url")));
      if (!prompt && !response) return;
      const identity = url || sha256Hex(utf8Encode((when ? isoformat(when, " ") : "") + "\n" + prompt + "\n" + response, true));
      if (!groups.has(identity)) groups.set(identity, { url, entries: [] });
      groups.get(identity).entries.push([when, index, prompt, response]);
    });
    const result = [];
    for (const [identity, group] of groups) {
      const ordered = group.entries.slice().sort((a, b) => {
        if ((a[0] === null) !== (b[0] === null)) return a[0] === null ? 1 : -1;
        if (a[0] !== null) { const c = compareStamp(a[0], b[0]); if (c) return c; }
        return b[1] - a[1];
      });
      const messages = [];
      for (const [when, , prompt, response] of ordered) messages.push(_message("user", prompt, when), _message("assistant", response, when));
      result.push(_makeRecord("gemini", messages, { nativeId: identity, when: ordered[0][0], fallbackDate, link: group.url }));
    }
    return result.filter(item => item);
  }

  // ---------------------------------------------------------------- html.parser.HTMLParser (CPython 3.13.14, convert_charrefs=True)
  const ENTITIES = TABLES.entities;
  const INVALID_CHARREFS = TABLES.invalidCharrefs;
  const INVALID_CODEPOINTS = new Set(TABLES.invalidCodepoints);
  const CHARREF = /&(#[0-9]+;?|#[xX][0-9a-fA-F]+;?|[^\t\n\f <&#;]{1,32};?)/gu;
  function replaceCharref(_, s) {
    if (s[0] === "#") {
      const num = s[1] === "x" || s[1] === "X" ? parseInt(rstripChars(s.slice(2), ";"), 16) : parseInt(rstripChars(s.slice(1), ";"), 10);
      if (hasOwn(INVALID_CHARREFS, String(num))) return INVALID_CHARREFS[String(num)];
      if ((num >= 0xd800 && num <= 0xdfff) || num > 0x10ffff) return "\ufffd";
      if (INVALID_CODEPOINTS.has(num)) return "";
      return String.fromCodePoint(num);
    }
    if (hasOwn(ENTITIES, s)) return ENTITIES[s];
    for (let x = s.length - 1; x > 1; x--) if (hasOwn(ENTITIES, s.slice(0, x))) return ENTITIES[s.slice(0, x)] + s.slice(x);
    return "&" + s;
  }
  const unescape = text => (text.includes("&") ? text.replace(CHARREF, replaceCharref) : text);
  const ATTR_CHARREF = /&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*)[;=]?/g;
  const unescapeAttr = text => text.replace(ATTR_CHARREF, ref => (ref.startsWith("&#") || (!ref.endsWith("=") && hasOwn(ENTITIES, ref.slice(1))) ? unescape(ref) : ref));
  const STARTTAGOPEN = /<[a-zA-Z]/y;
  const ENDTAGOPEN = /<\/[a-zA-Z]/y;
  const TAGFIND = /([a-zA-Z][^\t\n\r\f />]*)(?:[\t\n\r\f ]|\/(?!>))*/y;
  const ATTRFIND = /((?<=['"\t\n\r\f /])[^\t\n\r\f />][^\t\n\r\f /=>]*)([\t\n\r\f ]*=[\t\n\r\f ]*('[^']*'|"[^"]*"|(?!['"])[^>\t\n\r\f ]*))?(?:[\t\n\r\f ]|\/(?!>))*/y;
  const LOCATETAGEND = /[a-zA-Z][^\t\n\r\f />]*[\t\n\r\f /]*(?:(?<=['"\t\n\r\f /])[^\t\n\r\f />][^\t\n\r\f /=>]*(?:[\t\n\r\f ]*=[\t\n\r\f ]*(?:'[^']*'|"[^"]*"|(?!['"])[^>\t\n\r\f ]*))?[\t\n\r\f /]*)*>?/y;
  const COMMENTCLOSE = /--!?>/g;
  const COMMENTABRUPT = /-?>/y;
  const CDATA_CONTENT = new Set(["script", "style", "xmp", "iframe", "noembed", "noframes"]);
  const RCDATA_CONTENT = new Set(["textarea", "title"]);
  const sticky = (re, text, index) => { re.lastIndex = index; return re.exec(text); };
  class HTMLParser {
    constructor(handler) { this.h = handler; this.raw = ""; this.cdata = null; this.escapable = true; this.interesting = null; }
    feedAll(text) { this.raw = text; this.goahead(false); this.goahead(true); }
    setCdata(element, escapable) {
      this.cdata = element.toLowerCase();
      this.escapable = escapable;
      this.interesting = this.cdata === "plaintext" ? /$/g : new RegExp("</" + this.cdata + "(?=[\\t\\n\\r\\f />])", "gi");
    }
    clearCdata() { this.cdata = null; this.escapable = true; this.interesting = null; }
    data(text) { this.h.data(text); }
    goahead(end) {
      const raw = this.raw;
      const n = raw.length;
      let i = 0;
      while (i < n) {
        let j;
        if (!this.cdata) {
          j = raw.indexOf("<", i);
          if (j < 0) j = n;
        } else {
          this.interesting.lastIndex = i;
          const match = this.interesting.exec(raw);
          if (!match) break;
          j = match.index;
        }
        if (i < j) this.data(this.escapable ? unescape(raw.slice(i, j)) : raw.slice(i, j));
        i = j;
        if (i === n) break;
        let k;
        if (sticky(STARTTAGOPEN, raw, i)) k = this.parseStarttag(i);
        else if (raw.startsWith("</", i)) k = this.parseEndtag(i);
        else if (raw.startsWith("<!--", i)) k = this.parseComment(i);
        else if (raw.startsWith("<?", i)) k = raw.indexOf(">", i + 2) < 0 ? -1 : raw.indexOf(">", i + 2) + 1;
        else if (raw.startsWith("<!", i)) k = this.parseDeclaration(i);
        else if (i + 1 < n || end) { this.data("<"); k = i + 1; }
        else break;
        if (k < 0) {
          if (!end) break;
          if (sticky(STARTTAGOPEN, raw, i)) { /* swallowed */ }
          else if (raw.startsWith("</", i)) { if (i + 2 === n) this.data("</"); }
          k = n;
        }
        i = k;
      }
      if (end && i < n) { this.data(this.escapable ? unescape(raw.slice(i, n)) : raw.slice(i, n)); i = n; }
      this.raw = raw.slice(i);
    }
    parseDeclaration(i) {
      const raw = this.raw;
      if (raw.startsWith("<!--", i)) return this.parseComment(i);
      if (raw.startsWith("<![CDATA[", i)) { const j = raw.indexOf("]]>", i + 9); return j < 0 ? -1 : j + 3; }
      if (raw.slice(i, i + 9).toLowerCase() === "<!doctype") { const gt = raw.indexOf(">", i + 9); return gt < 0 ? -1 : gt + 1; }
      const pos = raw.indexOf(">", i + 2);
      return pos < 0 ? -1 : pos + 1;
    }
    parseComment(i) {
      COMMENTCLOSE.lastIndex = i + 4;
      let match = COMMENTCLOSE.exec(this.raw);
      if (match) return match.index + match[0].length;
      match = sticky(COMMENTABRUPT, this.raw, i + 4);
      return match ? i + 4 + match[0].length : -1;
    }
    parseStarttag(i) {
      const raw = this.raw;
      const located = sticky(LOCATETAGEND, raw, i + 1);
      const endpos = i + 1 + located[0].length;
      if (raw[endpos - 1] !== ">") return -1;
      const attrs = [];
      const tagMatch = sticky(TAGFIND, raw, i + 1);
      let k = i + 1 + tagMatch[0].length;
      const tag = tagMatch[1].toLowerCase();
      while (k < endpos) {
        const m = sticky(ATTRFIND, raw, k);
        if (!m) break;
        let value = m[3];
        if (!m[2]) value = null;
        else if ((value.slice(0, 1) === "'" && value.slice(-1) === "'") || (value.slice(0, 1) === '"' && value.slice(-1) === '"')) value = value.slice(1, -1);
        if (value) value = unescapeAttr(value);
        attrs.push([m[1].toLowerCase(), value]);
        k += m[0].length;
      }
      const rest = strip(raw.slice(k, endpos));
      if (rest !== ">" && rest !== "/>") { this.data(raw.slice(i, endpos)); return endpos; }
      if (rest.endsWith("/>")) { this.h.start(tag, attrs); this.h.end(tag); }
      else {
        this.h.start(tag, attrs);
        if (CDATA_CONTENT.has(tag) || tag === "plaintext") this.setCdata(tag, false);
        else if (RCDATA_CONTENT.has(tag)) this.setCdata(tag, true);
      }
      return endpos;
    }
    parseEndtag(i) {
      const raw = this.raw;
      if (raw.indexOf(">", i + 2) < 0) return -1;
      if (!sticky(ENDTAGOPEN, raw, i)) {
        if (raw.slice(i + 2, i + 3) === ">") return i + 3;
        const pos = raw.indexOf(">", i + 2);
        return pos < 0 ? -1 : pos + 1;
      }
      const located = sticky(LOCATETAGEND, raw, i + 2);
      const j = i + 2 + located[0].length;
      if (raw[j - 1] !== ">") return -1;
      const tag = sticky(TAGFIND, raw, i + 2)[1].toLowerCase();
      this.h.end(tag);
      this.clearCdata();
      return j;
    }
  }
  const BLOCKS = new Set(["div", "p", "br", "ul", "ol", "li", "h1", "h2", "h3", "article", "section", "pre"]);
  const VOID = new Set(["br", "hr", "img", "input", "meta", "link", "source", "wbr", "area", "base", "col", "embed", "param", "track"]);
  const HIDDEN = new Set(["script", "style", "noscript", "head", "svg"]);
  class TextHTML {
    constructor() { this.elements = []; this.hidden = 0; this.activity = []; this.card = null; this.cardDepth = null; this.mainDepth = null; this.headerDepth = null; this.text = []; }
    start(tag, attrs) {
      const attributes = new Map(attrs);
      const classes = splitWs(_str(attributes.get("class")));
      if (this.card === null && classes.includes("outer-cell")) { this.card = { text: [], header: [] }; this.cardDepth = this.elements.length; }
      if (this.card !== null && classes.includes("content-cell") && classes.includes("mdl-typography--body-1")) this.mainDepth = this.elements.length;
      if (this.card !== null && classes.includes("content-cell") && classes.includes("mdl-typography--headline")) this.headerDepth = this.elements.length;
      if (this.card !== null && tag === "a" && _geminiUrl(attributes.get("href"))) { if (!hasOwn(this.card, "url")) this.card.url = attributes.get("href"); }
      if (!VOID.has(tag)) { this.elements.push(tag); if (HIDDEN.has(tag)) this.hidden++; }
      if (BLOCKS.has(tag)) this.data("\n");
    }
    end(tag) {
      if (BLOCKS.has(tag)) this.data("\n");
      const target = this.elements.lastIndexOf(tag);
      if (target < 0) return;
      for (let index = target; index < this.elements.length; index++) if (HIDDEN.has(this.elements[index])) this.hidden--;
      this.elements.length = target;
      if (this.mainDepth !== null && target <= this.mainDepth) this.mainDepth = null;
      if (this.headerDepth !== null && target <= this.headerDepth) this.headerDepth = null;
      if (this.card !== null && target <= this.cardDepth) { this.activity.push(this.card); this.card = null; this.cardDepth = null; }
    }
    data(text) {
      if (this.hidden) return;
      this.text.push(text);
      if (this.card !== null && this.mainDepth !== null) this.card.text.push(text);
      if (this.card !== null && this.headerDepth !== null) this.card.header.push(text);
    }
  }
  function _activityHtml(parser, fallbackDate, geminiHint) {
    const entries = [];
    for (const card of parser.activity) {
      const content = strip(card.text.join(""));
      const header = lower(card.header.join(""));
      if (!(geminiHint || truthy(card.url) || header.includes("gemini") || header.includes("제미나이"))) continue;
      const matches = [];
      ACTIVITY_TIME.lastIndex = 0;
      let found;
      while ((found = ACTIVITY_TIME.exec(content))) { matches.push(found); if (found[0] === "") ACTIVITY_TIME.lastIndex++; }
      const ownLine = matches.filter(item => !strip(content.slice(content.lastIndexOf("\n", item.index - 1) + 1, item.index)));
      const match = matches.length ? (ownLine.length ? ownLine : matches)[(ownLine.length ? ownLine : matches).length - 1] : null;
      if (!match) continue;
      const title = strip(content.slice(0, match.index));
      const answer = ANSWER.exec(content.slice(match.index + match[0].length));
      entries.push({ title, time: match[0], url: hasOwn(card, "url") ? card.url : null, response: answer ? strip(answer[1]) : "" });
    }
    return _activityRecords(entries, fallbackDate);
  }
  function _plainMessages(text) {
    const buffers = [];
    let role = "", lines = [];
    for (const line of splitlines(text)) {
      const candidate = MARKER.exec(line);
      const matched = candidate ? _role(candidate[1]) : "";
      const trimmed = lstrip(line);
      const delimiter = line.includes(":") || line.includes("：") || trimmed.startsWith("#") || trimmed.startsWith("**");
      if (matched && (delimiter || !candidate[2])) {
        if (role && lines.length) buffers.push(_message(role, lines.join("\n")));
        role = matched;
        lines = candidate[2] ? [candidate[2]] : [];
      } else lines.push(line);
    }
    if (role) buffers.push(_message(role, lines.join("\n")));
    return buffers.some(item => item) ? buffers : [_message("user", text)];
  }

  // ---------------------------------------------------------------- JSONL lines
  const latin1 = new TextDecoder("latin1");
  function* _lineRecords(payload, source) {
    let start = 0;
    while (start < payload.length) {
      let end = payload.indexOf(10, start);
      end = end < 0 ? payload.length : end + 1;
      let line = payload.subarray(start, end);
      start = end;
      if (line.length > MAX_STREAM_LINE) continue;
      if (source === "claude" && !CLAUDE_LINE.test(latin1.decode(line))) continue;
      let item;
      try {
        if (startsWithBytes(line, 0xef, 0xbb, 0xbf)) { let k = 0; while (k < line.length && (line[k] === 0xef || line[k] === 0xbb || line[k] === 0xbf)) k++; line = line.subarray(k); }
        item = jsonLoadsBytes(line);
      } catch (error) {
        if (isA(error, "ValueError", "RecursionError")) continue;
        throw error;
      }
      if (isDict(item)) yield item;
    }
  }
  function _lineSession(rows, name, source, fallbackDate) {
    if (source === "claude") return _claude(rows, name, fallbackDate);
    if (source === "codex") return _codex(rows, name, fallbackDate, null);
    return _geminiLines(rows, fallbackDate);
  }
  function _sniffJsonl(rows, name) {
    for (const row of rows) {
      const kind = _str(get(row, "type"));
      if (kind === "session_meta" || kind === "event_msg" || kind === "response_item") return "codex";
      if (truthy(get(row, "sessionId")) && (hasOwn(row, "projectHash") || hasOwn(row, "startTime"))) return "gemini";
      if (hasOwn(row, "$set") || kind === "gemini") return "gemini";
      if (hasOwn(row, "sessionId") && (hasOwn(row, "message") || hasOwn(row, "uuid") || kind === "custom-title")) return "claude";
    }
    return _fileName(name).startsWith("rollout-") ? "codex" : "";
  }
  function _archiveBackup(records) {
    const error = () => fail("ValueError", MSG.badBackup);
    if (!Array.isArray(records)) error();
    const restored = [], seen = new Set();
    const required = ["id", "source", "title", "project", "date"];
    for (const item of records) {
      const record = _object(item);
      if (required.some(key => typeof get(record, key) !== "string")) error();
      const identity = record.id;
      if (!identity || seen.has(identity) || !SOURCES.has(record.source)) error();
      if (record.date) {
        try { dateFromIsoformat(record.date); } catch (cause) { if (isA(cause, "ValueError")) error(); throw cause; }
      }
      seen.add(identity);
      const raw = get(record, "messages");
      if (!Array.isArray(raw)) error();
      const messages = [];
      for (let entry of raw) {
        entry = _object(entry);
        const role = get(entry, "role");
        if ((role !== "user" && role !== "assistant" && role !== "system") || typeof get(entry, "text") !== "string") error();
        const message = { role, text: entry.text };
        if (typeof get(entry, "timestamp") === "string") message.timestamp = entry.timestamp;
        messages.push(message);
      }
      const result = {};
      for (const key of required) result[key] = record[key];
      result.messages = messages;
      for (const key of ["summary", "origin"]) if (typeof get(record, key) === "string") result[key] = record[key];
      if (typeof get(record, "favorite") === "boolean") result.favorite = record.favorite;
      if (typeof get(record, "thumbnail") === "string") result.thumbnail = _thumbnail(record.thumbnail);
      if (typeof get(record, "link") === "string") result.link = _link(record.link);
      restored.push(result);
    }
    return restored;
  }
  function _jsonEntries(record, source, fallbackDate, name) {
    let rows = record;
    if (isDict(record)) {
      if (get(record, "format") === APP_BACKUP) return _archiveBackup(get(record, "records"));
      rows = [record];
      for (const key of ["records", "conversations", "chats", "entries"]) if (Array.isArray(get(record, key))) { rows = record[key]; break; }
    }
    if (!Array.isArray(rows)) return [];
    if (rows.length && rows.every(row => isDict(row) && _role(get(row, "role")))) rows = [{ messages: rows, title: nameStem(_fileName(name)) }];
    const found = [], activity = [];
    const geminiPath = lower(name).includes("gemini");
    for (const entry of rows) {
      if (!isDict(entry)) continue;
      const hint = [_str(get(entry, "header")), pyStrLike(get(entry, "products", []), false), pyStrLike(get(entry, "activityControls", []), false)].join(" ");
      if (isDict(get(entry, "mapping"))) found.push(_chatgpt(entry, fallbackDate));
      else if (hasOwn(entry, "time") && (lower(hint).includes("gemini") || _geminiUrl(get(entry, "titleUrl")) || geminiPath || source === "gemini")) activity.push(entry);
      else found.push(_generic(entry, source, fallbackDate));
    }
    return found.filter(item => item).concat(_activityRecords(activity, fallbackDate));
  }
  function parseFile(filename, payload, sourceHint) {
    const name = _fileName(filename);
    const suffix = lower(nameSuffix(name));
    const fallbackDate = _fileDate(filename);
    const source = SOURCES.has(sourceHint) ? sourceHint : "other";
    if (suffix === ".json") {
      let data;
      const text = _decoded(payload, false);
      try {
        data = jsonLoads(text);
      } catch (error) {
        if (isA(error, "JSONDecodeError", "RecursionError")) fail("ValueError", MSG.badJson);
        throw error;
      }
      return _jsonEntries(data, source, fallbackDate, filename);
    }
    if (suffix === ".jsonl") {
      const detected = _sniffJsonl(_lineRecords(payload, ""), filename);
      const selected = detected || (source === "claude" || source === "codex" || source === "gemini" ? source : "");
      const rows = _lineRecords(payload, selected);
      if (selected) { const result = _lineSession(rows, filename, selected, fallbackDate); return result ? [result] : []; }
      return _jsonEntries([...rows], source, fallbackDate, filename);
    }
    if (![".txt", ".md", ".html", ".htm"].includes(suffix)) fail("ValueError", MSG.badSuffix);
    let text = _decoded(payload, true);
    if (suffix === ".html" || suffix === ".htm") {
      if (lower(name) === "chat.html") {
        const embedded = JSON_DATA.exec(text);
        if (embedded) {
          let data;
          try {
            data = jsonRawDecode(text, embedded.index + embedded[0].length)[0];
          } catch (error) {
            if (isA(error, "JSONDecodeError", "RecursionError")) fail("ValueError", MSG.badChatHtml);
            throw error;
          }
          return _jsonEntries(data, "chatgpt", fallbackDate, filename);
        }
      }
      const parser = new TextHTML();
      new HTMLParser(parser).feedAll(text);
      if (["myactivity", "내활동"].includes(lower(nameStem(name)).split(" ").join("")) || parser.activity.length) {
        return _activityHtml(parser, fallbackDate, source === "gemini" || lower(filename).includes("gemini"));
      }
      text = parser.text.join("");
    }
    const result = _makeRecord(source, _plainMessages(text), { title: nameStem(name), fallbackDate });
    return result ? [result] : [];
  }

  // ---------------------------------------------------------------- server.py: upload and ZIP
  const TEXT_SUFFIXES = new Set([".json", ".jsonl", ".ndjson", ".txt", ".md", ".markdown", ".htm", ".html"]);
  const TEXT_ALIASES = { ".ndjson": ".jsonl", ".markdown": ".md" };
  function parseTextFile(name, payload, source) {
    const suffix = lower(winSuffix(name));
    if (hasOwn(TEXT_ALIASES, suffix)) name = winWithSuffix(name, TEXT_ALIASES[suffix]);
    return parseFile(name, payload, source);
  }
  const u16 = (b, o) => b[o] | (b[o + 1] << 8);
  const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + b[o + 3] * 0x1000000;
  const u64 = (b, o) => u32(b, o) + u32(b, o + 4) * 0x100000000;
  const readAt = (buffer, position, size) => buffer.subarray(Math.min(Math.max(position, 0), buffer.length), Math.min(Math.max(position + size, 0), buffer.length));
  const hasSig = (b, o, c, d) => b[o] === 0x50 && b[o + 1] === 0x4b && b[o + 2] === c && b[o + 3] === d;
  const badZip = message => new PyError("BadZipFile", message);
  function sanitizeName(name) {
    const nul = name.indexOf("\u0000");
    if (nul >= 0) name = name.slice(0, nul);
    return name.split("\\").join("/");
  }
  function endRecord64(buffer, offset, record) {
    offset -= 20;
    if (offset < 0) return record;
    const data = readAt(buffer, offset, 20);
    if (data.length !== 20) fail("OSError", "Unknown I/O error");
    if (!hasSig(data, 0, 6, 7)) return record;
    const diskno = u32(data, 4), reloff = u64(data, 8), disks = u32(data, 16);
    if (diskno !== 0 || disks > 1) throw badZip("zipfiles that span multiple disks are not supported");
    offset -= 56;
    if (reloff > offset) throw badZip("Corrupt zip64 end of central directory locator");
    let extra = offset - reloff;
    let block = readAt(buffer, reloff, 56);
    if (block.length !== 56) fail("OSError", "Unknown I/O error");
    if (!hasSig(block, 0, 6, 6) && reloff !== offset) {
      extra = 0;
      block = readAt(buffer, offset, 56);
      if (block.length !== 56) fail("OSError", "Unknown I/O error");
    }
    if (!hasSig(block, 0, 6, 6)) throw badZip("Zip64 end of central directory record not found");
    const size = u64(block, 4), dirsize = u64(block, 40), diroffset = u64(block, 48);
    if (diroffset + dirsize !== reloff || size + 12 !== 56 + extra) throw badZip("Corrupt zip64 end of central directory record");
    return { ...record, size: dirsize, offset: diroffset, location: offset - extra };
  }
  function endRecord(buffer) {
    const size = buffer.length;
    let data = readAt(buffer, Math.max(0, size - 22), 22);
    if (data.length === 22 && hasSig(data, 0, 5, 6) && data[20] === 0 && data[21] === 0) {
      return endRecord64(buffer, size - 22, { size: u32(data, 12), offset: u32(data, 16), location: size - 22 });
    }
    const maxCommentStart = Math.max(size - 65535 - 22, 0);
    data = readAt(buffer, maxCommentStart, 65535 + 22);
    let start = -1;
    for (let i = data.length - 4; i >= 0; i--) if (hasSig(data, i, 5, 6)) { start = i; break; }
    if (start >= 0) {
      const rec = data.subarray(start, start + 22);
      if (rec.length !== 22) return null;
      return endRecord64(buffer, maxCommentStart + start, { size: u32(rec, 12), offset: u32(rec, 16), location: maxCommentStart + start });
    }
    return null;
  }
  function openZip(buffer) {   // zipfile.ZipFile(io.BytesIO(buffer))._RealGetContents()
    let end;
    try {
      end = endRecord(buffer);
    } catch (error) {
      if (isA(error, "OSError")) throw badZip("File is not a zip file");
      throw error;
    }
    if (!end) throw badZip("File is not a zip file");
    const concat = end.location - end.size - end.offset;
    const startDir = end.offset + concat;
    if (startDir < 0) throw badZip("Bad offset for central directory");
    const directory = readAt(buffer, startDir, end.size);
    let p = 0;
    const read = count => { const out = directory.subarray(Math.min(p, directory.length), Math.min(p + count, directory.length)); p += out.length; return out; };
    const entries = [];
    let total = 0;
    while (total < end.size) {
      const c = read(46);
      if (c.length !== 46) throw badZip("Truncated central directory");
      if (!hasSig(c, 0, 1, 2)) throw badZip("Bad magic number for central directory");
      const flags = u16(c, 8), nameLength = u16(c, 28), extraLength = u16(c, 30), commentLength = u16(c, 32);
      const nameBytes = read(nameLength);
      const nameCrc = crc32(nameBytes);
      const original = flags & 0x800 ? decodeUtf8(nameBytes) : decodeCp437(nameBytes);
      const info = {
        orig_filename: original, filename: sanitizeName(original), extra: read(extraLength),
        extract_version: c[6], flag_bits: flags, compress_type: u16(c, 10), CRC: u32(c, 16),
        compress_size: u32(c, 20), file_size: u32(c, 24), header_offset: u32(c, 42), end_offset: null,
      };
      read(commentLength);
      if (info.extract_version > 63) fail("NotImplementedError", "zip file version");
      let extra = info.extra;
      while (extra.length >= 4) {
        const type = u16(extra, 0), length = u16(extra, 2);
        if (length + 4 > extra.length) throw badZip("Corrupt extra field");
        let data = extra.subarray(4, length + 4);
        if (type === 0x0001) {
          const take = () => { if (data.length < 8) throw badZip("Corrupt zip64 extra field."); const value = u64(data, 0); data = data.subarray(8); return value; };
          if (info.file_size === 0xffffffff) info.file_size = take();
          if (info.compress_size === 0xffffffff) info.compress_size = take();
          if (info.header_offset === 0xffffffff) info.header_offset = take();
        } else if (type === 0x7075) {
          if (data.length < 5) throw badZip("Corrupt unicode path extra field (0x7075)");
          if (data[0] === 1 && u32(data, 1) === nameCrc) {
            let unicodeName;
            try { unicodeName = decodeUtf8(data.subarray(5)); } catch { throw badZip("Corrupt unicode path extra field (0x7075): invalid utf-8 bytes"); }
            if (unicodeName) info.filename = sanitizeName(unicodeName);
          }
        }
        extra = extra.subarray(length + 4);
      }
      info.header_offset += concat;
      entries.push(info);
      total += 46 + nameLength + extraLength + commentLength;
    }
    let endOffset = startDir;
    const order = entries.map((entry, index) => [entry, index]).sort((a, b) => a[0].header_offset - b[0].header_offset || a[1] - b[1]).reverse();
    for (const [entry] of order) { entry.end_offset = endOffset; endOffset = entry.header_offset; }
    return { buffer, entries };
  }
  const isDir = entry => entry.filename.endsWith("/");
  async function inflateRaw(bytes, limit) {
    const stream = new DecompressionStream("deflate-raw");
    const writer = stream.writable.getWriter();
    writer.write(bytes).catch(() => {});
    writer.close().catch(() => {});
    const reader = stream.readable.getReader();
    const chunks = [];
    let size = 0, error = null, over = false;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.length;
        if (size > limit) { over = true; reader.cancel().catch(() => {}); break; }
      }
    } catch (cause) {
      error = cause;
    }
    const out = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; }
    return { out, error, over };
  }
  async function zipRead(zip, entry) {   // archive.open(entry).read(...) for an entry that fits the limit
    const buffer = zip.buffer;
    const header = readAt(buffer, entry.header_offset, 30);
    if (header.length !== 30) throw badZip("Truncated file header");
    if (!hasSig(header, 0, 3, 4)) throw badZip("Bad magic number for file header");
    const nameBytes = readAt(buffer, entry.header_offset + 30, u16(header, 26));
    const tell = entry.header_offset + 30 + nameBytes.length + u16(header, 28);
    if (entry.flag_bits & 0x20) fail("NotImplementedError", "compressed patched data (flag bit 5)");
    if (entry.flag_bits & 0x40) fail("NotImplementedError", "strong encryption (flag bit 6)");
    const localName = u16(header, 6) & 0x800 ? decodeUtf8(nameBytes) : decodeCp437(nameBytes);
    if (localName !== entry.orig_filename) throw badZip("File name in directory and header differ.");
    if (entry.end_offset !== null && tell + entry.compress_size > entry.end_offset && entry.end_offset !== entry.header_offset) throw badZip("Overlapped entries (possible zip bomb)");
    if (![0, 8, 12, 14].includes(entry.compress_type)) fail("NotImplementedError", "That compression method is not supported");
    if (entry.compress_type === 12 || entry.compress_type === 14) fail("NotImplementedError", "bzip2 and lzma are not supported on the phone");
    const available = readAt(buffer, tell, entry.compress_size);
    const size = entry.file_size;
    let out;
    if (entry.compress_size > 0 && !available.length) fail("EOFError", "");
    if (entry.compress_type === 0) {
      out = available.subarray(0, Math.min(available.length, size));
      if (!(available.length >= entry.compress_size || out.length >= size)) fail("EOFError", "");
    } else if (!entry.compress_size) {
      out = new Uint8Array(0);
    } else {
      const inflated = await inflateRaw(available, size);
      out = inflated.out.subarray(0, size);
      if (inflated.error && out.length < size && available.length < entry.compress_size) fail("EOFError", "");
    }
    if (crc32(out) !== entry.CRC) throw badZip("Bad CRC-32");
    return out;
  }
  function zipCandidates(entries, source) {
    const files = entries.filter(entry => !isDir(entry) && !entry.filename.split("/").includes("__MACOSX") && TEXT_SUFFIXES.has(lower(winSuffix(entry.filename))));
    const chatgpt = files.filter(entry => CHATGPT_EXPORT.test(winName(entry.filename)));
    if (chatgpt.length && (source === "" || source === "chatgpt")) return chatgpt.slice().sort((a, b) => cpCompare(a.filename, b.filename));
    if (source === "" || source === "gemini") {
      const gemini = files.filter(entry => lower(entry.filename).includes("gemini") && lower(nameStem(winName(entry.filename))).split(" ").join("") === "myactivity");
      if (gemini.length) {
        const json = gemini.filter(entry => lower(winSuffix(entry.filename)) === ".json");
        return json.length ? json : gemini;
      }
    }
    return files;
  }
  function rasterType(data) {
    if (startsWithBytes(data, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
    if (startsWithBytes(data, 0xff, 0xd8, 0xff)) return "jpeg";
    if (startsWithBytes(data, 0x47, 0x49, 0x46, 0x38, 0x37, 0x61) || startsWithBytes(data, 0x47, 0x49, 0x46, 0x38, 0x39, 0x61)) return "gif";
    if (startsWithBytes(data, 0x52, 0x49, 0x46, 0x46) && data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) return "webp";
    return "";
  }
  async function attachZipCovers(zip, entries, records) {
    const images = entries
      .filter(entry => !isDir(entry) && !(entry.flag_bits & 1) && entry.file_size > 0 && entry.file_size <= MAX_COVER
        && [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(lower(winSuffix(entry.filename))))
      .map(entry => [nameStem(winName(entry.filename)), entry])
      .sort((a, b) => cpCompare(a[0], b[0]));
    const names = images.map(item => item[0]);
    let coverBytes = 0;
    const cached = new Map();
    for (const record of records.values()) {
      const key = hasOwn(record, "imageKey") ? record.imageKey : "";
      delete record.imageKey;
      if (typeof key !== "string" || !ASSET_KEY.test(key) || truthy(get(record, "thumbnail"))) continue;
      let lo = 0, hi = names.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cpCompare(names[mid], key) < 0) lo = mid + 1; else hi = mid; }
      for (let index = lo; index < names.length; index++) {
        const [name, entry] = images[index];
        if (!name.startsWith(key)) break;
        if (name !== key && !"-_.".includes(name[key.length])) continue;
        if (coverBytes + entry.file_size > MAX_ZIP_COVERS) break;
        if (!cached.has(entry.header_offset)) {
          let raw;
          try {
            raw = await zipRead(zip, entry);
          } catch (error) {
            if (isA(error, "ValueError", "OSError", "NotImplementedError", "BadZipFile")) continue;
            throw error;
          }
          const media = rasterType(raw);
          if (!media || raw.length !== entry.file_size) continue;
          cached.set(entry.header_offset, "data:image/" + media + ";base64," + base64(raw));
        }
        record.thumbnail = cached.get(entry.header_offset);
        coverBytes += entry.file_size;
        break;
      }
    }
  }
  async function importZip(upload, source) {
    const collected = new Map();
    let skipped = 0;
    let zip;
    try {
      zip = openZip(upload);
    } catch (error) {
      if (isA(error, "BadZipFile")) throw requestError(400, MSG.zipBad);
      throw error;
    }
    const entries = zip.entries;
    if (entries.length > MAX_ZIP_ENTRIES) throw requestError(413, MSG.zipTooMany);
    const selected = zipCandidates(entries, source);
    if (selected.reduce((sum, entry) => sum + entry.file_size, 0) > MAX_ARCHIVE) throw requestError(413, MSG.zipTooBig);
    for (const entry of selected) {
      if (entry.file_size > MAX_UPLOAD || entry.flag_bits & 1) { skipped++; continue; }
      let records;
      try {
        const payload = await zipRead(zip, entry);
        if (payload.length > MAX_UPLOAD) { skipped++; continue; }
        records = parseTextFile(entry.filename, payload, source);
      } catch (error) {
        if (isA(error, "ValueError", "TypeError", "KeyError", "RecursionError", "OSError", "NotImplementedError", "BadZipFile")) { skipped++; continue; }
        throw error;
      }
      if (!records.length) skipped++;
      for (const record of records) if (!collected.has(record.id)) collected.set(record.id, record);
    }
    if ([...collected.values()].some(record => truthy(get(record, "imageKey")))) await attachZipCovers(zip, entries, collected);
    return { records: [...collected.values()], warnings: skipped ? [MSG.zipSkipped(thousands(skipped))] : [] };
  }
  async function importUpload(name, upload, source) {
    const suffix = lower(winSuffix(name));
    if (suffix === ".zip") return importZip(upload, source);
    if (!TEXT_SUFFIXES.has(suffix)) throw requestError(415, MSG.uploadType);
    try {
      const records = parseTextFile(name, upload, source);
      for (const record of records) delete record.imageKey;
      return { records, warnings: [] };
    } catch (error) {
      if (isA(error, "ValueError", "TypeError", "KeyError", "RecursionError")) throw requestError(400, MSG.importEmpty);
      throw error;
    }
  }

  return {
    MSG, PyError, isA, importUpload, parseFile, pyStr, strip, splitWs, cpLength, oneLinePrefix, dateFromIsoformat, thousands,
    limits: { MAX_UPLOAD, MAX_ARCHIVE },
    internals: { fromIsoformat, fromTimestampUtc, isoformat, _when, _link, _geminiUrl, urlsplit, unescape, splitlines, _plainMessages, _fileDate, _activityWhen, jsonLoads, dumpsAscii, sha256Hex, HTMLParser, TextHTML, winWithSuffix, winName },
  };
});
