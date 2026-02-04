import { toCMatrix } from "./c.js";
import { toCSharpMatrix } from "./csharp.js";
import { toJsMatrix } from "./js.js";
import { toPythonMatrix } from "./python.js";

const vscode = acquireVsCodeApi();

const versionsByLanguage = {
  "C#": [1.0, 12.0],
  C: [90, 99, 11],
  JavaScript: ["ES6/ES2015"],
  Python: ["2.x+"],
};

let matrixTextCopied = "";

document.addEventListener("DOMContentLoaded", () => {
  const el = getElementsOrNull();
  if (!el) {
    return;
  }
  initLanguageVersion(el);
  wireEvents(el);
});

function getElementsOrNull() {
  const el = {
    dialog: document.getElementById("menu-dialog"),
    menuBtn: document.getElementById("menu"),
    table: document.getElementById("grid"),

    saveBtn: document.getElementById("save"),
    applyBtn: document.getElementById("apply-button"),
    addRowBtn: document.getElementById("add-row"),
    addColBtn: document.getElementById("add-col"),
    copyBtn: document.getElementById("copy-button"),

    firsts: document.getElementById("firsts"),
    output: document.getElementById("copy"),

    selectLanguage: document.getElementById("language"),
    selectVersion: document.getElementById("version"),
  };

  const required = [
    el.dialog,
    el.menuBtn,
    el.table,
    el.saveBtn,
    el.applyBtn,
    el.addRowBtn,
    el.addColBtn,
    el.copyBtn,
    el.firsts,
    el.output,
    el.selectLanguage,
    el.selectVersion,
  ];

  if (required.some((x) => !x)) {
    return null;
  }
  return el;
}

function initLanguageVersion({ selectLanguage, selectVersion }) {
  fillOptions(selectLanguage, Object.keys(versionsByLanguage));

  const firstLang = selectLanguage.value || "C#";
  fillOptions(selectVersion, versionsByLanguage[firstLang] ?? []);

  selectLanguage.addEventListener("change", () => {
    const lang = selectLanguage.value;
    fillOptions(selectVersion, versionsByLanguage[lang] ?? []);
  });
}

function wireEvents(el) {
  el.menuBtn.addEventListener("click", () => el.dialog.showModal());

  // table click
  el.table.addEventListener("click", (event) => {
    const cell = event.target.closest("td");
    if (!cell) {
      return;
    }
    highlight(el.table, Number(cell.dataset.row), Number(cell.dataset.col));
  });

  el.saveBtn.addEventListener("click", () => {
    const csv = tableToCsv(el.table);
    vscode.postMessage({ command: "saveCsv", data: csv });
  });

  el.applyBtn.addEventListener("click", () => {
    matrixTextCopied = convertToArray(el);
    el.output.textContent = matrixTextCopied;
  });

  el.addRowBtn.addEventListener("click", () => addRow(el.table));
  el.addColBtn.addEventListener("click", () => addColumn(el.table));

  el.copyBtn.addEventListener("click", () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(matrixTextCopied).catch((err) => {
        console.warn("It does not copy", err);
      });
    }
  });
}

function fillOptions(selectEl, items) {
  selectEl.innerHTML = "";
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = String(item);
    opt.textContent = String(item);
    selectEl.appendChild(opt);
  }
}

function getTableValues(table) {
  const rows = table.querySelectorAll("tr");
  const values = [];
  rows.forEach((row) => {
    const rowValues = [];
    row.querySelectorAll("td").forEach((td) => {
      rowValues.push((td.textContent || "").trim());
    });
    values.push(rowValues);
  });
  return values;
}

function convertToArray({ table, firsts, selectVersion, selectLanguage }) {
  const values = getTableValues(table);
  const allowFirsts = !firsts.checked;
  if (selectLanguage.value === "C") {
    return toCMatrix(values, allowFirsts, selectVersion);
  } else if (selectLanguage.value === "JavaScript") {
    return toJsMatrix(values, allowFirsts);
  } else if (selectLanguage.value === "Python") {
    return toPythonMatrix(values, allowFirsts);
  }
  return toCSharpMatrix(values, allowFirsts, selectVersion);
}

function highlight(table, rowIndex, colIndex) {
  const rows = table.querySelectorAll("tr");

  // remove remark
  rows.forEach((tr) =>
    tr.querySelectorAll("td").forEach((td) => td.classList.remove("highlight")),
  );
  rows.forEach((tr, rIdx) => {
    const tds = tr.querySelectorAll("td");
    if (rIdx <= rowIndex && tds[colIndex]) {
      tds[colIndex].classList.add("highlight");
    }
  });
  const clickedRow = rows[rowIndex];
  if (clickedRow) {
    clickedRow.querySelectorAll("td").forEach((td, cIdx) => {
      if (cIdx <= colIndex) {
        td.classList.add("highlight");
      }
    });
  }
}

function tableToCsv(table) {
  const rows = [];
  table.querySelectorAll("tr").forEach((tr) => {
    const values = Array.from(tr.querySelectorAll("td")).map((td) => {
      let text = (td.innerText || "").replace(/"/g, '""');
      if (text.includes(",") || text.includes('"') || text.includes("\n")) {
        text = `"${text}"`;
      }
      return text;
    });
    rows.push(values.join(","));
  });
  return rows.join("\n");
}

function addRow(table) {
  const firstRow = table.querySelector("tr");
  let colCount = firstRow ? firstRow.querySelectorAll("td").length : 0;
  if (colCount === 0) {
    colCount = 1;
  }

  const newTr = document.createElement("tr");
  const currentRowCount = table.querySelectorAll("tr").length;

  for (let colIndex = 0; colIndex < colCount; colIndex++) {
    const td = document.createElement("td");
    td.contentEditable = "true";
    td.dataset.row = String(currentRowCount);
    td.dataset.col = String(colIndex);
    td.innerText = "";
    newTr.appendChild(td);
  }

  table.appendChild(newTr);
}

function addColumn(table) {
  const rows = table.querySelectorAll("tr");

  let colIndexToUse = 0;
  if (rows.length > 0) {
    colIndexToUse = rows[0].querySelectorAll("td").length;
  }

  rows.forEach((tr, rowIndex) => {
    const td = document.createElement("td");
    td.contentEditable = "true";
    td.dataset.row = String(rowIndex);
    td.dataset.col = String(colIndexToUse);
    td.innerText = "";
    tr.appendChild(td);
  });

  if (rows.length === 0) {
    const newTr = document.createElement("tr");
    const td = document.createElement("td");
    td.contentEditable = "true";
    td.dataset.row = "0";
    td.dataset.col = "0";
    td.innerText = "";
    newTr.appendChild(td);
    table.appendChild(newTr);
  }
}
