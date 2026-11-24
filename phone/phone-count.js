/* AI Chat Drawer, phone edition: anonymous open counter.
 * Only on the public web copy (github.io). It asks GitHub for a 1-byte release file, and GitHub adds one to that
 * file's download count. Nothing else is sent: no chats, no names, no IDs. The phone keeps only three small marks
 * (first open done, last counted day, home-screen app counted) so the same phone is not counted twice.
 *   first-<phone>-<lang>  first time this browser opened the app (not counted inside the home-screen app)
 *   app-<phone>-<lang>    first time it was opened as the home-screen app (installed)
 *   day-<phone>-<lang>    first open of each day, either way
 * <phone> is iphone, android or other; <lang> is ko or en. */
(function () {
  "use strict";
  if (!/\.github\.io$/i.test(location.hostname)) return;
  const BASE = "https://github.com/dodobe1966-pixel/ai-chat-drawer/releases/download/usage/";
  const KEY = "ai-chat-drawer-count";
  const ua = navigator.userAgent || "";
  const phone = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "iphone"
    : /Android/.test(ua) ? "android" : "other";
  const lang = (document.documentElement.lang || "").toLowerCase().startsWith("en") ? "en" : "ko";
  const installed = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (error) { return {}; }
  }
  function save(marks) {
    try { localStorage.setItem(KEY, JSON.stringify(marks)); } catch (error) { /* private mode: count again next time */ }
  }
  function today() {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  }
  function hit(kind) {
    return fetch(BASE + kind + "-" + phone + "-" + lang + ".txt", {
      mode: "no-cors", cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer"
    }).then(function () { return true; }, function () { return false; });
  }

  function run() {
    if (navigator.onLine === false) return;
    const marks = load();
    const day = today();
    const jobs = [];
    if (installed && !marks.app) jobs.push(["app", "app", true]);
    if (!installed && !marks.first) jobs.push(["first", "first", true]);
    if (marks.day !== day) jobs.push(["day", "day", day]);
    jobs.reduce(function (chain, job) {
      return chain.then(function () {
        return hit(job[0]).then(function (ok) {
          if (!ok) return;
          const now = load();
          now[job[1]] = job[2];
          save(now);
        });
      });
    }, Promise.resolve());
  }

  if (document.readyState === "complete") setTimeout(run, 1500);
  else window.addEventListener("load", function () { setTimeout(run, 1500); });
})();
