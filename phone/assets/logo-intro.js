(function () {
  var intro = document.getElementById("logo-intro");
  if (!intro) return;
  var seen = false;
  try { seen = sessionStorage.getItem("logo-intro") === "1"; sessionStorage.setItem("logo-intro", "1"); } catch (error) { seen = false; }
  if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { intro.remove(); return; }
  function close() { intro.classList.add("is-done"); setTimeout(function () { intro.remove(); }, 650); }
  intro.addEventListener("click", close);
  setTimeout(close, 2600);
})();
