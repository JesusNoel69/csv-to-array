import {
  isEmpty,
  normalizeRows,
  quote,
  getMatrixType,
  mapType,
} from "./utils.js";

export function toCSharpMatrix(values, allowFirsts, versionSelect) {
  const csVersion = getCsVersion(versionSelect);
  const isModern = csVersion >= 12;
  const useVar = csVersion >= 3 && !isModern;

  const bodyRows = normalizeRows(values, allowFirsts);
  const matrixType = getMatrixType(bodyRows);
  const typeCs = mapType(matrixType, "cs");

  const rowsCs = bodyRows.map((row) =>
    renderRow(row, matrixType, typeCs, isModern),
  );

  const header = `// C# version: ${Number.isFinite(csVersion) ? csVersion : "unknown"}\n`;
  const { declarationPrefix, closing } = renderDeclaration(
    typeCs,
    isModern,
    useVar,
  );

  return header + declarationPrefix + rowsCs.join(",\n") + closing;
}

function getCsVersion(versionSelect) {
  const n = Number(versionSelect?.value);
  return Number.isFinite(n) ? n : NaN;
}

function renderRow(row, matrixType, typeCs, isModern) {
  const items = row.map((v) => formatValueForCSharp(v, matrixType)).join(", ");
  return isModern ? `    [${items}]` : `    new ${typeCs}[] { ${items} }`;
}

function renderDeclaration(typeCs, isModern, useVar) {
  if (isModern) {
    return {
      declarationPrefix: `${typeCs}[][] matrix = [\n`,
      closing: `\n];`,
    };
  }

  if (useVar) {
    return {
      declarationPrefix: `var matrix = new ${typeCs}[][] {\n`,
      closing: `\n};`,
    };
  }

  return {
    declarationPrefix: `${typeCs}[][] matrix = new ${typeCs}[][] {\n`,
    closing: `\n};`,
  };
}

function formatValueForCSharp(v, matrixType) {
  if (isEmpty(v)) {
    return "null";
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
    default: //string type default
      return quote(s);
  }
}
