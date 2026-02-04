import { getMatrixType, normalizeRows, isEmpty, quote } from "./utils.js";

export function toPythonMatrix(values, allowFirsts) {
  const bodyRows = normalizeRows(values, allowFirsts);
  const matrixType = getMatrixType(bodyRows);
  const decls = bodyRows.map((row) => renderPythonRow(row, matrixType));
  const header = `// Python version: 2.x+\n`;
  let declaration = `matrix = [\n${decls.join("").slice(0, -1)}\n]`; //slice remove last ','
  return header + declaration;
}

function renderPythonRow(row, matrixType) {
  const formatedRow = row.map((v) => formatValueForPython(v, matrixType));

  return `[${formatedRow.join(", ")}],`;
}

function formatValueForPython(v, matrixType) {
  if (isEmpty(v)) {
    return "None";
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
