import {
  getMatrixType,
  getVersion,
  normalizeRows,
  isEmpty,
  quote,
  mapType,
} from "./utils.js";

export function toCMatrix(values, allowFirsts, versionSelect) {
  const cVersion = getVersion(versionSelect);

  const bodyRows = normalizeRows(values, allowFirsts);
  const matrixType = getMatrixType(bodyRows);
  const typeC = mapType(matrixType, "c"); //replace string for enum or constant value
  const decls = bodyRows.map((row, i) =>
    renderCRow(row, matrixType, typeC, cVersion, i),
  );
  const arrays = decls.map((d) => d.array);
  const names = decls.map((d) => d?.name);

  const header = `// C version: ${Number.isFinite(cVersion) ? cVersion : "unknown"}\n`;
  let declaration = "";

  if (cVersion === 90) {
    declaration = renderC90Declaration(names, typeC);

    return header + arrays.join("\n") + "\n" + declaration;
  } else if (cVersion === 99) {
    declaration = renderC99Declaration(bodyRows, typeC);
    const rowLength = bodyRows[0].length;

    //arrays should be filler and declaration returns a for statement for create
    return header + declaration + "\n" + arrays.join("\n") + cFree(rowLength);
  } else if (cVersion === 11) {
    declaration = renderC11Declaration(bodyRows, typeC);
    const rowLength = bodyRows[0].length;

    return header + declaration + "\n" + arrays.join("\n") + cFree(rowLength);
  }
}
function cFree(length) {
  return `//use matrix before free\nfor (int i = 0; i < ${length}; i++) free(matrix[i]);\n free(matrix);\n`;
}
function renderC90Declaration(names, type) {
  return `${type}* matrix[] = { ${names.join(", ")} };`;
}
function renderC99Declaration(rows, type) {
  const rowLength = rows[0].length;
  const rowsLength = rows.length;
  return `${type}** matrix = malloc(${rowsLength} * sizeof *matrix);\nfor (int i = 0; i < ${rowsLength}; i++){ \nmatrix[i] = malloc(${rowLength} * sizeof *matrix[i]);\n}\n`;
}
function renderC11Declaration(rows, type) {
  const rowLength = rows[0].length;
  const rowsLength = rows.length;
  return `size_t rows = ${rowsLength};\n${type}** matrix = calloc(rows, sizeof *matrix);\nfor (size_t i = 0; i < rows; i++){ \nmatrix[i] = calloc(rows, sizeof *matrix[i]);\n}\n`;
}

function renderCRow(row, matrixType, typeC, version, count) {
  const formatedRow = row.map((v) => formatValueForC(v, matrixType));
  const elemCount = row.length;

  if (version === 90) {
    const items = formatedRow.join(", ");
    const name = `r${count}`;
    return { array: `${typeC} ${name}[] = { ${items} };`, name };
  } else if (version === 99 || version === 11) {
    let arrayValue = "";
    for (let index = 0; index < elemCount; index++) {
      arrayValue += `matrix[${count}][${index}] =${formatedRow[index]};\n`;
    }
    return {
      array: arrayValue,
      name: undefined,
    };
  }
}
function formatValueForC(v, matrixType) {
  if (isEmpty(v)) {
    return '" "';
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
      return lower === "true" ? "1" : "0";
    }
    default:
      return quote(s);
  }
}
