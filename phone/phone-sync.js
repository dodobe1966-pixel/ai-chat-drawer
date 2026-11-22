/* AI Chat Drawer, phone edition: syncing with the home PC.
 * Only when this phone app is opened from the PC's own address (the PC server serves it at /phone/).
 * Opened anywhere else (a plain web host), /api/status is not the PC server and this file does nothing.
 * The builder fills in TEXT for the language of the build. */
(function () {
  "use strict";
  const TEXT = {"noteReady": "PC와 맞추기", "noteJust": "PC와 맞춤 · 방금", "noteMinutes": "PC와 맞춤 · {n}분 전", "noteHours": "PC와 맞춤 · {n}시간 전", "noteLogin": "PC 입장 암호 넣기", "noteRunning": "PC와 맞추는 중…", "noteFailed": "PC와 맞추기 (다시)", "offline": "인터넷이 끊겨 있습니다. 연결된 뒤 다시 눌러 주세요.", "failed": "PC와 맞추지 못했습니다. PC가 켜져 있는지 확인하고 다시 눌러 주세요.", "done": "집 PC와 맞췄습니다. 대화 {n}개", "same": "이미 PC와 같습니다. 대화 {n}개"};
  const state = { active: false, login: false, running: false, note: "" };

  function toast(message) {
    let box = document.getElementById("pc-sync-toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "pc-sync-toast";
      box.setAttribute("role", "status");
      box.style.cssText = "position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9999;"
        + "max-width:calc(100vw - 32px);background:#1f2430;color:#fff;font-size:15px;line-height:1.45;padding:12px 16px;border-radius:12px;"
        + "box-shadow:0 10px 30px #0004;text-align:center";
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { box.hidden = true; }, 4200);
  }

  function setNote(text) {
    state.note = text;
    const note = document.getElementById("sync-note");
    if (note) note.textContent = text;
  }

  function lastText() {
    try {
      const at = Number(localStorage.getItem("pc-sync-at") || 0);
      if (!at) return TEXT.noteReady;
      const minutes = Math.round((Date.now() - at) / 60000);
      if (minutes < 1) return TEXT.noteJust;
      if (minutes < 60) return TEXT.noteMinutes.replace("{n}", minutes);
      return TEXT.noteHours.replace("{n}", Math.round(minutes / 60));
    } catch {
      return TEXT.noteReady;
    }
  }

  async function detect() {
    try {
      const response = await fetch("/api/status", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) {
        state.active = state.login = true;
        setNote(TEXT.noteLogin);
        return;
      }
      if (!response.ok || !(response.headers.get("Content-Type") || "").includes("application/json")) return;
      const data = await response.json();
      if (data && typeof data.instance === "string" && data.instance !== "phone") {
        state.active = true;
        setNote(lastText());
      }
    } catch { /* no PC here, or offline: stay a phone-only app */ }
  }

  async function run(byHand) {
    if (!state.active || state.running) return;
    if (state.login) {
      if (byHand) location.href = "/phone-login";
      return;
    }
    if (!navigator.onLine) {
      if (byHand) toast(TEXT.offline);
      return;
    }
    state.running = true;
    setNote(TEXT.noteRunning);
    try {
      const result = await window.PhoneApi.syncWithPc("/");
      try { localStorage.setItem("pc-sync-at", String(Date.now())); } catch { /* note only */ }
      setNote(lastText());
      if (result.phoneChanged) {
        try { sessionStorage.setItem("pc-sync-message", TEXT.done.replace("{n}", result.total)); } catch { /* note only */ }
        location.reload();
        return;
      }
      if (byHand) toast(TEXT.same.replace("{n}", result.total));
    } catch (error) {
      if (error && error.login) {
        state.login = true;
        setNote(TEXT.noteLogin);
        if (byHand) location.href = "/phone-login";
      } else {
        setNote(TEXT.noteFailed);
        toast((error && error.message) || TEXT.failed);
      }
    } finally {
      state.running = false;
    }
  }

  window.PhoneSync = {
    get active() { return state.active; },
    get note() { return state.note; },
    run,
  };

  window.addEventListener("load", async () => {
    try {
      const message = sessionStorage.getItem("pc-sync-message");
      if (message) {
        sessionStorage.removeItem("pc-sync-message");
        toast(message);
        await detect();
        return;   // just synced before this reload
      }
    } catch { /* note only */ }
    await detect();
    if (state.active && !state.login) run(false);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || !state.active || state.login) return;
    let at = 0;
    try { at = Number(localStorage.getItem("pc-sync-at") || 0); } catch { /* note only */ }
    if (Date.now() - at > 10 * 60000) run(false);   // back to the app after a while: sync again
  });
})();
