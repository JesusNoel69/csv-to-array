export function normalizeRows(values, allowFirsts) {
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
export function quote(s) {
  return `"${String(s).replace(/"/g, '\\"')}"`;
}

export function isEmpty(v) {
  return String(v ?? "").trim() === "";
}
export function getMatrixType(bodyRows) {
  let type = null;

  for (const row of bodyRows) {
    for (const cellRaw of row) {
      const t = inferCellType(cellRaw);
      if (t === "nullable") {
        continue;
      }

      if (!type) {
        type = t;
      } else if (type !== t) {
        //float, integer, string, nullable
        if (
          (type === "integer" && t === "float") ||
          (type === "float" && t === "integer")
        ) {
          type = "float";
        } else {
          return "string";
        }
      }
    }
  }

  return type ?? "string";
}

export function inferCellType(v) {
  if (isEmpty(v)) {
    return "nullable";
  }

  const s = String(v).trim();
  const lower = s.toLowerCase();

  if (lower === "true" || lower === "false") {
    return "boolean";
  }
  if (/^[+-]?\d+$/.test(s)) {
    return "integer";
  }
  if (/^[+-]?\d*\.\d+$/.test(s)) {
    return "float";
  }
  return "string";
}

export function mapType(matrixType, type) {
  const TYPE_MAP = {
    cs: { integer: "int", float: "double", boolean: "bool", string: "string" },
    c: { integer: "int", float: "float", boolean: "bool", string: "char*" },
  };

  const langType = TYPE_MAP[type] ?? TYPE_MAP.cs;
  return langType[matrixType] ?? langType.string ?? "string";
}

export function getVersion(versionSelect) {
  const n = Number(versionSelect?.value);
  return Number.isFinite(n) ? n : NaN;
}
