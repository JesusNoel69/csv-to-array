import {
  getMatrixType,
  getVersion,
  normalizeRows,
  isEmpty,
  quote,
  mapType,
} from "./utils.js";

/*
// C90-ish
int r0[] = { 1, 2, 3 };
int r1[] = { 4, 5 };
int r2[] = { 6, 7, 8, 9 };

int* matrix[] = { r0, r1, r2 };   // jagged 
int lens[]     = { 3, 2, 4 };     // sizes by row

// C99-ish 
#include <stdlib.h>

int** matrix = (int**)malloc(3 * sizeof(int*));
int lens[3] = { 3, 2, 4 };

matrix[0] = (int*)malloc(lens[0] * sizeof(int));
matrix[1] = (int*)malloc(lens[1] * sizeof(int));
matrix[2] = (int*)malloc(lens[2] * sizeof(int));

//fil
matrix[0][0]=1; matrix[0][1]=2; matrix[0][2]=3;
matrix[1][0]=4; matrix[1][1]=5;
matrix[2][0]=6; matrix[2][1]=7; matrix[2][2]=8; matrix[2][3]=9;

// C11-ish
#include <stdlib.h>

size_t rows = 3;
size_t lens[] = { 3, 2, 4 };

int** matrix = (int**)calloc(rows, sizeof(int*));
for (size_t i = 0; i < rows; i++) {
    matrix[i] = (int*)calloc(lens[i], sizeof(int));
}


*/
export function toCMatrix(values, allowFirsts, versionSelect) {
  const cVersion = getVersion(versionSelect);

  const bodyRows = normalizeRows(values, allowFirsts);
  const matrixType = getMatrixType(bodyRows);
  const typeC = mapType(matrixType, "c"); //replace string for enum or constant value
  const decls = bodyRows.map((row, i) =>
    renderCRow(row, matrixType, typeC, cVersion, i),
  );
  console.log(typeC);
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
    return header + declaration + "\n" + arrays.join("\n") + c99Free(rowLength);
  }
}
function c99Free(length) {
  return `//use matrix before free\nfor (int i = 0; i < ${length}; i++) free(matrix[i]);\n free(matrix);\n`;
}
/*
// C90-ish
  int* matrix[] = { r0, r1, r2 };   // jagged array
  //maybe don't need lens
  int lens[]     = { 3, 2, 4 };     // sizes by row

// C99-ish 
  #include <stdlib.h>

  int** matrix = (int**)malloc(3 * sizeof(int*));

  int lens[3] = { 3, 2, 4 };
*/
function renderC90Declaration(names, type) {
  return `${type}* matrix[] = { ${names.join(", ")} };`;
}
function renderC99Declaration(rows, type) {
  const rowLength = rows[0].length;
  const rowsLength = rows.length;
  return `${type}*** matrix = malloc(${rowsLength} * sizeof *matrix);\nfor (int i = 0; i < ${rowsLength}; i++){ \nmatrix[i] = malloc(${rowLength} * sizeof *matrix[i]);\n}\n`;
}
/*
// C90-ish
int r0[] = { 1, 2, 3 };
int r1[] = { 4, 5 };
int r2[] = { 6, 7, 8, 9 };

// C99-ish 
matrix[0] = (int*)malloc(lens[0] * sizeof(int));
matrix[1] = (int*)malloc(lens[1] * sizeof(int));
matrix[2] = (int*)malloc(lens[2] * sizeof(int));

*/
function renderCRow(row, matrixType, typeC, version, count) {
  const formatedRow = row.map((v) => formatValueForC(v, matrixType));
  const elemCount = row.length;

  if (version === 90) {
    const items = formatedRow.join(", ");
    const name = `r${count}`;
    return { array: `${typeC} ${name}[] = { ${items} };`, name };
  } else if (version === 99) {
    let arrayValue = "";
    console.log(formatedRow);
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
      return lower === "true" ? "true" : "false";
    }
    default:
      return quote(s);
  }
}
