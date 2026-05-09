function $(id) {
  return document.getElementById(id);
}

document.addEventListener('keydown', onKey);
const copyButton = $("copy-button");
copyButton.addEventListener("click", copy);
const TOAST_CONTENT = copyButton.dataset.toastContent;
const TOAST_URL = copyButton.dataset.toastUrl;

document.querySelectorAll('#line-numbers a').forEach(a => {
  a.addEventListener('click', (e) => {
    if (!e.shiftKey) return;
    const m = a.getAttribute('href').match(/^#L(\d+)$/);
    const current = window.location.hash.match(/^#L(\d+)(?:-L\d+)?$/);
    if (!m || !current) return;
    e.preventDefault();
    const clicked = parseInt(m[1], 10);
    const base = parseInt(current[1], 10);
    const from = Math.min(base, clicked);
    const to = Math.max(base, clicked);
    history.replaceState(null, '', from === to ? '#L' + from : '#L' + from + '-L' + to);
    highlightLines(false);
  });
});

function showToast(text, timeout) {
  let toast = $("toast");

  toast.innerText = text;
  toast.classList.toggle("hidden");
  toast.classList.toggle("shown");

  setTimeout(() => {
    toast.classList.toggle("hidden");
    toast.classList.toggle("shown");
  }, timeout);
}

function copy() {
  const code = document.querySelector('.src-code code');
  if (!code) return;
  const content = code.textContent.trim();

  navigator.clipboard.writeText(content)
    .then(() => {
      showToast(TOAST_CONTENT, 1500);
    }, function(err) {
      console.error("failed to copy content", err);
    });
}

function onKey(e) {
  if (e.keyCode == 27) {
    const overlay = document.getElementById("overlay");
    if (overlay && overlay.style.display == "block") {
      overlay.style.display = "none";
    }
    return;
  }

  if (e.ctrlKey || e.metaKey) {
    return;
  }

  const pasteId = document.body.dataset.pasteId;

  if (e.key == 'n') {
    window.location.href = "/";
  }
  else if (e.key == 'r' && pasteId) {
    window.location.href = "/raw/" + pasteId;
  }
  else if (e.key == 'y') {
    navigator.clipboard.writeText(window.location.href);
    showToast(TOAST_URL, 1500);
  }
  else if (e.key == 'p') {
    window.location.href = window.location.href.split("?")[0];
  }
  else if (e.key == 'c') {
    copy();
  }
  else if (e.key == 'w') {
    document.body.classList.toggle('line-wrap');
  }
  else if (e.key == 'm') {
    const toggle = document.getElementById('view-toggle');
    if (toggle) window.location.href = toggle.href;
  }
  else if (e.key == '?') {
    toggleOverlay();
  }
}

function toggleOverlay() {
  const overlay = document.getElementById('overlay');
  if (!overlay) return;
  overlay.style.display = overlay.style.display != 'block' ? 'block' : 'none';
  if (!overlay.dataset.bound) {
    overlay.addEventListener('click', () => { overlay.style.display = 'none'; });
    overlay.dataset.bound = '1';
  }
}
