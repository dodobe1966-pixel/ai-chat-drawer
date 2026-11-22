/* AI Chat Drawer, phone edition: registers the offline cache and asks the browser to keep saved chats. */
(function () {
  "use strict";
  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* the app still works online */ });
    });
  }
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then(function (kept) {
      if (!kept) return navigator.storage.persist();
      return kept;
    }).catch(function () { /* the browser decides; the guide asks for backups */ });
  }
})();
