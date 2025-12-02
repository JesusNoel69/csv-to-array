import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "csv-to-array" is now active!');

  const disposable = vscode.commands.registerCommand(
    "csv-to-array.runConverter",
    async () => {
      //csv type
      const uri = await vscode.window.showOpenDialog({
        filters: { "CSV Files": ["csv"] },
        canSelectMany: false,
      });

      if (!uri || uri.length === 0) {
        return;
      }
      const fileUri = uri[0];
      //read file content
      const fileData = await vscode.workspace.fs.readFile(fileUri);
      const text = Buffer.from(fileData).toString("utf8");

      // webview
      const panel = vscode.window.createWebviewPanel(
        "csvTableView",
        `CSV Table: ${fileUri.path.split("/").pop()}`,
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
        }
      );
      //html table
      panel.webview.html = getWebviewContent(text);
      panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === "saveCsv") {
          const updatedCsv = message.data as string;
          const enc = new TextEncoder();
          await vscode.workspace.fs.writeFile(fileUri, enc.encode(updatedCsv));
          vscode.window.showInformationMessage("CSV guardado desde la tabla");
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}
function getWebviewContent(csvText: string): string {
  const rows = csvText.split(/\r?\n/).filter((r) => r.length > 0);

  const htmlRows = rows
    .map((row, rowIndex) => {
      const cells = row.split(",");
      const tds = cells
        .map(
          (c, colIndex) =>
            `<td contenteditable="true" data-row="${rowIndex}" data-col="${colIndex}">${c}</td>`
        )
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");
  vscode.window.showInformationMessage(htmlRows);

  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CSV To Array</title>
    <meta charset="UTF-8" />
    <style>
      table {
        border-collapse: collapse;
        width: 100%;
      }
      td {
        border: 1px solid #ccc;
        padding: 4px;
        min-width: 80px;
      }
      td:focus {
        outline: 2px solid #007acc;
      }
	td.highlight {
        background-color: #3b82f680;
      }
      #toolbar {
        margin-bottom: 8px;
      }
      button {
        margin-right: 4px;
      }
      output {
        width: 100%;
      }
      .container-label {
        width: 100%;
        display: flex;
        justify-content: space-between;
      }
      select {
        min-width: 30%;
      }
      #menu-dialog {
        border-radius: 0.5rem 0.7rem;
        width: 70%;
      }
      .center {
        text-align: center;
      }
      #copy-button {
        max-height: fit-content;
        bottom: 0;
      }
      #copy {
        display: block;
        max-height: 22px;
        width: 100%;
        border: solid 2.5px;
        padding: 0.5rem 1rem;
        border-radius: 0.2rem 0.3rem;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
    </style>
  </head>
<body>
    <div id="toolbar">
        <button id="save">Guardar CSV</button>
        <button id="menu">Menu CSV</button>
        <button id="add-row">Agregar fila</button>
        <button id="add-col">Agregar columna</button>
    </div>
    
      <dialog id="menu-dialog">
      <p class="center">Menu</p>
      <hr />
      <form method="dialog">
        <div class="container-label">
          <label for="language">Language</label>
          <select id="language"></select>
        </div>
        <div class="container-label">
          <label for="version">Version</label>
          <select id="version"></select>
        </div>
        <div class="container-label">
          <label for="firsts">Allow first col and first row</label>
          <input type="checkbox" id="firsts" name="firsts" value="rowColum" />
        </div>

        <!---<label for="copy">Copy</label>-->
        <div class="container-label">
          <output id="copy"></output><br />
          <button
            id="copy-button"
            style="border: none; background: none; cursor: pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M21 8C21 6.34315 19.6569 5 18 5H10C8.34315 5 7 6.34315 7 8V20C7 21.6569 8.34315 23 10 23H18C19.6569 23 21 21.6569 21 20V8ZM19 8C19 7.44772 18.5523 7 18 7H10C9.44772 7 9 7.44772 9 8V20C9 20.5523 9.44772 21 10 21H18C18.5523 21 19 20.5523 19 20V8Z"
                fill="#0F0F0F"
              />
              <path
                d="M6 3H16C16.5523 3 17 2.55228 17 2C17 1.44772 16.5523 1 16 1H6C4.34315 1 3 2.34315 3 4V18C3 18.5523 3.44772 19 4 19C4.55228 19 5 18.5523 5 18V4C5 3.44772 5.44772 1.44772 5 2C5 3.44772 5.44772 3 6 3Z"
                fill="#0F0F0F"
              />
            </svg>
          </button>
          <br />
        </div>
        <div class="container-label">
          <button type="button" id="apply-button">Apply</button>
          <button type="submit" id="close-button">Close</button>
        </div>
      </form>
    </dialog>

    <table id="grid">
        ${htmlRows}
    </table>

    <script>
      const vscode = acquireVsCodeApi();
      /*const csharpVersions = [1.0, 3.0, 9.0];
      const languages = ["C#"];
      */
      const versionsByLanguage = {
        "C#": [1.0, 3.0, 9.0],
        /*Java: [8, 11, 17],
        TypeScript: [4.8, 5.0],*/
      };
      let matrixTextCopied = "";
      const selectLanguage = document.getElementById("language");
      let selectVersion = document.getElementById("version");

      document.addEventListener("DOMContentLoaded", function () {
        selectLanguage.append(
          ...createOptions(Object.keys(versionsByLanguage))
        );
        const firstLang = selectLanguage.value;
        selectVersion.innerHTML = "";
        selectVersion.append(...createOptions(versionsByLanguage[firstLang]));
      });

      selectLanguage.addEventListener("change", () => {
        const lang = selectLanguage.value;
        const versions = versionsByLanguage[lang];

        selectVersion.innerHTML = "";
        selectVersion.append(...createOptions(versions));
      });
      function createOptions(itemsList) {
        let elementsAppended = [];
        for (item of itemsList) {
          const newOption = document.createElement("option");
          newOption.value = item;
          newOption.textContent = item;
          elementsAppended.push(newOption);
        }
        return elementsAppended;
      }

      const dialog = document.getElementById("menu-dialog");
      document.getElementById("menu").addEventListener("click", function () {
        dialog.showModal();
      });
		const table = document.getElementById("grid");
      table.addEventListener("click", function (event) {
        const cell = event.target.closest("td");
        if (!cell) {
          return;
        }

        const rowIndex = Number(cell.dataset.row);
        const colIndex = Number(cell.dataset.col);

        console.log("Celda clickeada -> fila:", rowIndex, "columna:", colIndex);

        const rows = table.querySelectorAll("tr");

        rows.forEach(function (tr) {
          tr.querySelectorAll("td").forEach(function (td) {
            td.classList.remove("highlight");
          });
        });

        rows.forEach(function (tr, rIdx) {
          const tds = tr.querySelectorAll("td");
          if (rIdx <= rowIndex && tds[colIndex]) {
            tds[colIndex].classList.add("highlight");
          }
        });

        const clickedRow = rows[rowIndex];
        if (clickedRow) {
          const tds = clickedRow.querySelectorAll("td");
          tds.forEach(function (td, cIdx) {
            if (cIdx <= colIndex) {
              td.classList.add("highlight");
            }
          });
        }
      });
      function getTableValues() {
        //const table = document.getElementById("grid");
        const rows = table.querySelectorAll("tr");
        const values = [];

        rows.forEach(function (row) {
          const rowValues = [];
          const tds = row.querySelectorAll("td");
          tds.forEach(function (td) {
            rowValues.push((td.textContent || "").trim());
          });
          values.push(rowValues);
        });

        return values;
      }

      function toCSharpMatrix(values) {
        const allowFirsts = !document.getElementById("firsts").checked;

        const versionSelect = document.getElementById("version");
        let csVersionNumber = 0;
        if (versionSelect && versionSelect.value) {
          csVersionNumber = Number(versionSelect.value);
        }

        let startRow = 0;
        let startCol = 0;
        if (allowFirsts) {
          startRow = 1;
          startCol = 1;
        }

        let bodyRows = values.slice(startRow).map(function (row) {
          return row.slice(startCol);
        });

        // empty rows deleted
        bodyRows = bodyRows.filter(function (row) {
          return row.some(function (cell) {
            return (cell || "").trim() !== "";
          });
        });

        // empty cols deleted
        if (bodyRows.length > 0) {
          var colCount = bodyRows[0].length;
          var colsToKeep = [];
          for (var col = 0; col < colCount; col++) {
            var hasValue = bodyRows.some(function (row) {
              return (row[col] || "").trim() !== "";
            });
            if (hasValue) {
              colsToKeep.push(col);
            }
          }

          bodyRows = bodyRows.map(function (row) {
            return colsToKeep.map(function (col) {
              return row[col];
            });
          });
        }

        const matrixType = getMatrixType(bodyRows);

        const rowsCs = bodyRows.map(function (row) {
          const items = row
            .map(function (v) {
              return formatValueForCSharp(v, matrixType);
            })
            .join(", ");
          return "    { " + items + " }";
        });

        let typeCs;
        if (matrixType === "int") {
          typeCs = "int";
        } else if (matrixType === "double") {
          typeCs = "double";
        } else if (matrixType === "bool") {
          typeCs = "bool";
        } else {
          typeCs = "string";
        }
        let declarationPrefix;
        if (csVersionNumber >= 3) {
          // new syntax
          declarationPrefix = "var matrix = new " + typeCs + "[,] {\\n";
        } else {
          // traditional
          declarationPrefix =
            typeCs + "[,] matrix = new " + typeCs + "[,] {\\n";
        }

        const cs =
          "// C# version: " +
          (versionSelect ? versionSelect.value : "unknown") +
          "\\n" +
          declarationPrefix +
          rowsCs.join(",\\n") +
          "\\n};";

        return cs;
      }

      function inferCellType(v) {
        v = (v || "").trim();
        if (v === "") return "null";

        const lower = v.toLowerCase();
        if (lower === "true" || lower === "false") return "bool";

        // integers
        if (/^[+-]?\\d+$/.test(v)) return "int";

        // doubles
        if (/^[+-]?\\d*\\.\\d+$/.test(v)) return "double";

        return "string";
      }

      function getMatrixType(bodyRows) {
        var type = null;

        for (var i = 0; i < bodyRows.length; i++) {
          var row = bodyRows[i];
          for (var j = 0; j < row.length; j++) {
            var cell = (row[j] || "").trim();
            var t = inferCellType(cell);
            if (t === "null") {
              continue;
            }

            if (!type) {
              type = t;
            } else if (type !== t) {
              if (
                (type === "int" && t === "double") ||
                (type === "double" && t === "int")
              ) {
                type = "double";
              } else {
                return "string";
              }
            }
          }
        }

        if (!type) {
          return "string"; //all empty
        }
        return type;
      }

      function formatValueForCSharp(v, matrixType) {
        v = (v || "").trim();
        if (v === "") {
          return "null";
        }

        if (matrixType === "int") {
          const n = parseInt(v, 10);
          if (!isNaN(n)) {
            return String(n);
          }
          // fallback string
          const safeStr = v.replace(/"/g, '\\"');
          return '"' + safeStr + '"';
        }

        if (matrixType === "double") {
          const normalized = v.replace(",", ".");
          const num = Number(normalized);
          if (!isNaN(num)) {
            return String(num);
          }
          const safeStr2 = v.replace(/"/g, '\\"');
          return '"' + safeStr2 + '"';
        }

        if (matrixType === "bool") {
          const lower = v.toLowerCase();
          return lower === "true" ? "true" : "false";
        }

        // string
        const safe = v.replace(/"/g, '\\"');
        return '"' + safe + '"';
      }

      function convertToArray() {
        const values = getTableValues();
        const csharpMatrix = toCSharpMatrix(values);
        matrixTextCopied = csharpMatrix;
        const output = document.getElementById("copy");
        output.textContent = csharpMatrix;
      }

      function tableToCsv() {
        const rows = [];
        const trs = document.querySelectorAll("#grid tr");
        trs.forEach(function (tr) {
          const cells = Array.from(tr.querySelectorAll("td"));
          const values = cells.map(function (td) {
            let text = td.innerText.replace(/"/g, '""');
            //this break the table because not continued to next items null
            //if (text.includes(',') || text.includes('"') || text.includes('\\n')) {
            //    text = '"' + text + '"';
            //}
            return text;
          });
          rows.push(values.join(","));
        });
        return rows.join("\\n");
      }

      function addRow() {
        const table = document.getElementById("grid");
        const firstRow = table.querySelector("tr");
        let colCount = 0;

        if (firstRow) {
          colCount = firstRow.querySelectorAll("td").length;
        }
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

      function addColumn() {
        const table = document.getElementById("grid");
        const rows = table.querySelectorAll("tr");

        let colIndexToUse = 0;
        if (rows.length > 0) {
          const firstRowCells = rows[0].querySelectorAll("td");
          colIndexToUse = firstRowCells.length;
        }

        rows.forEach(function (tr, rowIndex) {
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

      document.getElementById("save").addEventListener("click", function () {
        const csv = tableToCsv();
        vscode.postMessage({ command: "saveCsv", data: csv });
      });

      document
        .getElementById("apply-button")
        .addEventListener("click", function () {
          convertToArray();
        });

      document.getElementById("add-row").addEventListener("click", function () {
        addRow();
      });

      document.getElementById("add-col").addEventListener("click", function () {
        addColumn();
      });

      document
        .getElementById("copy-button")
        .addEventListener("click", function () {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
              .writeText(matrixTextCopied)
              .catch(function (err) {
                console.warn("It does not copy", err);
              });
          }
        });
    </script>

</body>
</html>
`;
}

export function deactivate() {}
