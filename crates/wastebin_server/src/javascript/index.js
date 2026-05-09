function $(id) {
  return document.getElementById(id);
}

const textarea = $("text");
const preview = $("preview");
const stats = $("stats");
const MAX_BYTES = parseInt(stats.dataset.maxBytes, 10) || 1024 * 1024;
const UNIT_KB = stats.dataset.unitKb;
const UNIT_MB = stats.dataset.unitMb;
const LABEL_LIMIT = stats.dataset.labelLimit;

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " " + UNIT_MB;
  return (bytes / 1024).toFixed(0) + " " + UNIT_KB;
}

$("progress-limit").textContent = LABEL_LIMIT + " " + formatSize(MAX_BYTES);

function updateStats() {
  const text = textarea.value;
  const lines = Math.max(1, text.split("\n").length);
  const chars = text.length;
  let bytes;
  try { bytes = new Blob([text]).size; } catch(e) { bytes = text.length; }

  $("stat-lines").textContent = lines;
  $("stat-chars").textContent = chars;
  $("stat-bytes").textContent = bytes.toLocaleString();
  $("progress-kb").textContent = (bytes / 1024).toFixed(1) + " " + UNIT_KB;

  const pct = Math.min(100, (bytes / MAX_BYTES) * 100);
  const fill = $("progress-fill");
  fill.style.width = pct + "%";
  fill.classList.toggle("warn", pct > 85);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, function(ch) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[ch];
  });
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
}

function renderPreview(text) {
  if (!text.trim()) {
    preview.innerHTML = '<p class="preview-empty">Nothing to preview yet.</p>';
    return;
  }

  const lines = text.split("\n");
  const html = [];
  let paragraph = [];
  let code = [];
  let inCode = false;
  let codeLang = "";
  let listOpen = false;

  function closeList() {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  }

  function flushParagraph() {
    if (paragraph.length > 0) {
      closeList();
      html.push("<p>" + inlineMarkdown(paragraph.join(" ")) + "</p>");
      paragraph = [];
    }
  }

  function flushCode() {
    const langClass = codeLang ? " language-" + escapeHtml(codeLang) : "";
    html.push('<pre class="code-block' + langClass + '"><code>' + escapeHtml(code.join("\n")) + "</code></pre>");
    code = [];
    codeLang = "";
    inCode = false;
  }

  for (const line of lines) {
    const fence = line.match(/^```\s*([A-Za-z0-9_+#.-]+)?\s*$/);
    if (fence && !inCode) {
      flushParagraph();
      closeList();
      inCode = true;
      codeLang = fence[1] || "";
      continue;
    }
    if (fence && inCode) {
      flushCode();
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      closeList();
    } else if (/^#{1,6}\s+/.test(line)) {
      flushParagraph();
      closeList();
      const level = line.match(/^#+/)[0].length;
      html.push("<h" + level + ">" + inlineMarkdown(line.replace(/^#{1,6}\s+/, "")) + "</h" + level + ">");
    } else if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push("<li>" + inlineMarkdown(line.replace(/^[-*]\s+/, "")) + "</li>");
    } else {
      paragraph.push(line.trim());
    }
  }

  flushParagraph();
  closeList();
  if (inCode) flushCode();
  preview.innerHTML = html.join("");
}

function updateAll() {
  updateStats();
  renderPreview(textarea.value);
}

textarea.addEventListener("input", updateAll);
updateAll();

for (const button of document.querySelectorAll(".tab-button")) {
  button.addEventListener("click", function() {
    for (const tab of document.querySelectorAll(".tab-button")) tab.classList.remove("active");
    for (const panel of document.querySelectorAll(".tab-panel")) panel.classList.remove("active");
    button.classList.add("active");
    $("tab-" + button.dataset.tab).classList.add("active");
    if (button.dataset.tab === "preview") renderPreview(textarea.value);
  });
}

$("burn-after-reading").addEventListener("change", function() {
  const disabled = this.checked;
  const radios = document.querySelectorAll('#expiry-list input[type="radio"]');
  for (const radio of radios) {
    radio.disabled = disabled;
  }
});

const overlay = $("drop-overlay");
const editorWrap = $("editor-wrap");
let dragCounter = 0;

editorWrap.addEventListener("dragenter", function(e) {
  e.preventDefault();
  dragCounter++;
  overlay.classList.add("active");
});

editorWrap.addEventListener("dragleave", function(e) {
  e.preventDefault();
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    overlay.classList.remove("active");
  }
});

editorWrap.addEventListener("dragover", function(e) {
  e.preventDefault();
});

editorWrap.addEventListener("drop", function(e) {
  e.preventDefault();
  dragCounter = 0;
  overlay.classList.remove("active");
  const files = e.dataTransfer && e.dataTransfer.files;
  if (files && files.length > 0) loadFile(files[0]);
});

function loadFile(file) {
  file.text().then(function(value) {
    textarea.value = value.replace(/\n$/, "");
    $("title").value = file.name;
    updateAll();
  });
}

$("open").addEventListener("click", function() {
  const input = document.createElement("input");
  input.type = "file";
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (file) loadFile(file);
  };
  input.click();
});

textarea.addEventListener("keydown", function(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "Enter")) {
    e.preventDefault();
    $("form").submit();
  }
});
