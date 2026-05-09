function $(id) {
  return document.getElementById(id);
}

const lineNumbers = $("line-numbers");
const textarea = $("text");

function updateLineNumbers() {
  const count = Math.max(1, textarea.value.split("\n").length);
  let html = "";
  for (let i = 1; i <= count; i++) {
    html += "<div>" + i + "</div>";
  }
  lineNumbers.innerHTML = html;
}

function syncScroll() {
  lineNumbers.scrollTop = textarea.scrollTop;
}

textarea.addEventListener("input", updateLineNumbers);
textarea.addEventListener("scroll", syncScroll);
updateLineNumbers();

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

  const pct = Math.min(100, (bytes / MAX_BYTES) * 100);
  const fill = $("progress-fill");
  fill.style.width = pct + "%";
  if (pct > 85) {
    fill.classList.add("warn");
  } else {
    fill.classList.remove("warn");
  }
  $("progress-kb").textContent = (bytes / 1024).toFixed(1) + " " + UNIT_KB;
}

textarea.addEventListener("input", updateStats);
updateStats();

const preview = $("preview");

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
    preview.innerHTML = '<p class="preview-empty">Markdown and code preview</p>';
    return;
  }

  const lines = text.split("\n");
  const html = [];
  let paragraph = [];
  let code = [];
  let codeLang = "";

  function flushParagraph() {
    if (paragraph.length > 0) {
      html.push("<p>" + inlineMarkdown(paragraph.join(" ")) + "</p>");
      paragraph = [];
    }
  }

  function flushCode() {
    const langClass = codeLang ? ' language-' + escapeHtml(codeLang) : "";
    html.push('<pre class="code-block' + langClass + '"><code>' + escapeHtml(code.join("\n")) + "</code></pre>");
    code = [];
    codeLang = "";
  }

  for (const line of lines) {
    const fence = line.match(/^```\s*([A-Za-z0-9_-]+)?\s*$/);
    if (fence && codeLang === "" && code.length === 0) {
      flushParagraph();
      codeLang = fence[1] || "plain";
      continue;
    }
    if (fence && (codeLang !== "" || code.length > 0)) {
      flushCode();
      continue;
    }
    if (codeLang !== "" || code.length > 0) {
      code.push(line);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
    } else if (/^#{1,3}\s+/.test(line)) {
      flushParagraph();
      const level = line.match(/^#+/)[0].length;
      html.push("<h" + level + ">" + inlineMarkdown(line.replace(/^#{1,3}\s+/, "")) + "</h" + level + ">");
    } else {
      paragraph.push(line.trim());
    }
  }

  flushParagraph();
  if (codeLang !== "" || code.length > 0) flushCode();
  preview.innerHTML = html.join("");
}

textarea.addEventListener("input", function() {
  renderPreview(textarea.value);
});
renderPreview(textarea.value);

const encryptToggle = $("encrypt-toggle");
const passwordGroup = $("password-group");

if (encryptToggle && passwordGroup) {
  encryptToggle.addEventListener("change", function() {
    if (encryptToggle.checked) {
      passwordGroup.classList.add("shown");
      $("password").focus();
    } else {
      passwordGroup.classList.remove("shown");
      $("password").value = "";
    }
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
let dragCounter = 0;

const editorWrap = $("editor-wrap");

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
  if (files && files.length > 0) {
    loadFile(files[0]);
  }
});

function loadFile(file) {
  file.text().then(function(value) {
    textarea.value = value.replace(/\n$/, "");
    updateLineNumbers();
    updateStats();
    renderPreview(textarea.value);

    // Set title to filename
    $("title").value = file.name;
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
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    $("form").submit();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    $("form").submit();
  }
});
