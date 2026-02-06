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

let editColMode = false;

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
    editColBtn: document.getElementById("edit-col"),

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
    el.editColBtn,
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
  /**/
  document.addEventListener("click", (e) => {
    if (!editColMode) {
      return;
    }

    const rowBtn = e.target.closest(".del-row");
    if (rowBtn) {
      const r = Number(rowBtn.dataset.row);
      deleteRow(r);
      reindexGrid();
      return;
    }

    const colBtn = e.target.closest(".del-col");
    if (colBtn) {
      const c = Number(colBtn.dataset.col);
      deleteCol(c);
      reindexGrid();
      return;
    }
  });

  /**/
  el.menuBtn.addEventListener("click", () => el.dialog.showModal());

  el.editColBtn.addEventListener("click", () => {
    editColMode = !editColMode;

    document.body.classList.toggle("edit-col-mode", editColMode);

    el.editColBtn.textContent = editColMode
      ? "Edit column (ON)"
      : "Edit column";
  });

  // table click
  el.table.addEventListener("click", (event) => {
    const cell = event.target.closest("td");
    if (!cell) {
      return;
    }

    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);

    if (editColMode && r === 0) {
      if (c === 0) {
        return;
      }

      openColumnEditor(el.table, c);
      return;
    }

    highlight(el.table, r, c);
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

function deleteRow(r) {
  const table = document.getElementById("grid");
  const tr = table?.querySelectorAll("tr")[r];
  if (tr) {
    tr.remove();
  }
}

function deleteCol(c) {
  const table = document.getElementById("grid");
  if (!table) {
    return;
  }

  table.querySelectorAll("tr").forEach((tr) => {
    const td = tr.querySelectorAll("td")[c];
    if (td) {
      td.remove();
    }
  });
}

function reindexGrid() {
  const table = document.getElementById("grid");
  if (!table) {
    return;
  }

  const trs = Array.from(table.querySelectorAll("tr"));
  trs.forEach((tr, r) => {
    const tds = Array.from(tr.querySelectorAll("td"));
    tds.forEach((td, c) => {
      td.dataset.row = String(r);
      td.dataset.col = String(c);

      const rb = td.querySelector(".del-row");
      if (rb) {
        rb.dataset.row = String(r);
      }

      const cb = td.querySelector(".del-col");
      if (cb) {
        cb.dataset.col = String(c);
      }
    });
  });
}

function openColumnEditor(table, colIndex) {
  const headerCell = table.querySelector(
    `td[data-row="0"][data-col="${colIndex}"]`,
  );
  if (!headerCell) {
    return;
  }

  const current = (headerCell.innerText || "").trim();
  const next = prompt(`New column name ${colIndex}:`, current);
  if (next === null) {
    return;
  }

  headerCell.innerText = next;
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
