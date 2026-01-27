export function toCSharpMatrix(values, allowFirsts, versionSelect) {
  const csVersion = getCsVersion(versionSelect);
  const isModern = csVersion >= 12;
  const useVar = csVersion >= 3 && !isModern;

  const bodyRows = normalizeRows(values, allowFirsts);
  const matrixType = getMatrixType(bodyRows);
  const typeCs = mapType(matrixType);

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

function normalizeRows(values, allowFirsts) {
  const startRow = allowFirsts ? 1 : 0;
  const startCol = allowFirsts ? 1 : 0;

  let rows = values
    .slice(startRow)
    .map((row) => row.slice(startCol))
    .filter((row) => row.some((cell) => !isEmpty(cell)));

  // remove empty columns
  if (rows.length === 0) {
    return rows;
  }

  const colCount = rows[0].length;
  const keep = new Array(colCount).fill(false);

  for (const row of rows) {
    for (let c = 0; c < colCount; c++) {
      if (!keep[c] && !isEmpty(row[c])) {
        keep[c] = true;
      }
    }
  }

  const colsToKeep = [];
  for (let c = 0; c < colCount; c++) {
    if (keep[c]) {
      colsToKeep.push(c);
    }
  }

  return rows.map((row) => colsToKeep.map((c) => row[c]));
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

function mapType(matrixType) {
  switch (matrixType) {
    case "int":
      return "int";
    case "double":
      return "double";
    case "bool":
      return "bool";
    default:
      return "string";
  }
}

function getMatrixType(bodyRows) {
  let type = null;

  for (const row of bodyRows) {
    for (const cellRaw of row) {
      const t = inferCellType(cellRaw);
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

  return type ?? "string";
}

function formatValueForCSharp(v, matrixType) {
  if (isEmpty(v)) {
    return "null";
  }

  const s = String(v).trim();

  switch (matrixType) {
    case "int": {
      const n = parseInt(s, 10);
      return Number.isNaN(n) ? quote(s) : String(n);
    }
    case "double": {
      const num = Number(s.replace(",", "."));
      return Number.isNaN(num) ? quote(s) : String(num);
    }
    case "bool": {
      const lower = s.toLowerCase();
      return lower === "true" ? "true" : "false";
    }
    default:
      return quote(s);
  }
}

function quote(s) {
  return `"${String(s).replace(/"/g, '\\"')}"`;
}

function isEmpty(v) {
  return String(v ?? "").trim() === "";
}

function inferCellType(v) {
  if (isEmpty(v)) {
    return "null";
  }

  const s = String(v).trim();
  const lower = s.toLowerCase();

  if (lower === "true" || lower === "false") {
    return "bool";
  }
  if (/^[+-]?\d+$/.test(s)) {
    return "int";
  }
  if (/^[+-]?\d*\.\d+$/.test(s)) {
    return "double";
  }
  return "string";
}
