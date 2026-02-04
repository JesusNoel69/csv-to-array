import { getMatrixType, normalizeRows, isEmpty, quote } from "./utils.js";

export function toJsMatrix(values, allowFirsts) {
  const bodyRows = normalizeRows(values, allowFirsts);
  const matrixType = getMatrixType(bodyRows);
  const decls = bodyRows.map((row) => renderJsRow(row, matrixType));
  const header = `// JavaScript version: ES6/ES2015\n`;
  let declaration = `const matrix = [${decls.join("")}];`;
  return header + declaration;
}

function renderJsRow(row, matrixType) {
  const formatedRow = row.map((v) => formatValueForJs(v, matrixType));
  return `[${formatedRow.join(", ")}],`;
}
function formatValueForJs(v, matrixType) {
  if (isEmpty(v)) {
    return "undefined";
  }
  const s = String(v).trim();
  switch (matrixType) {
    case "integer": {
      const n = parseInt(s, 10);
      return Number.isNaN(n) ? quote(s) : String(n);
    }
    case "float": {
      const num = Number(s.replace(",", "."));
      return Number.isNaN(num) ? quote(s) : String(num);
    }
    case "boolean": {
      const lower = s.toLowerCase();
      return lower === "true" ? "true" : "false";
    }
    default:
      return quote(s);
  }
}
