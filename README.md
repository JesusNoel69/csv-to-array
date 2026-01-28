# csv-to-array

`csv-to-array` is a Visual Studio Code extension that converts CSV files into ready-to-use **C# jagged arrays (`T[][]`)**.

It displays your CSV in an interactive spreadsheet-like editor, lets you modify the data, and generates clean, idiomatic C# code using jagged arrays, which are more flexible and commonly used than multidimensional arrays.

This project was originally designed to convert CSV-based automaton representations into C# data structures.

---

## Features

- 📂 **Open CSV in an editable grid**
  - Load any `.csv` file into a clean interactive table inside VS Code.
  - Add or delete rows and columns.
  - Edit cell values in real-time.

- 🔢 **Generate C# arrays**

- 🔢 **Generate C# jagged arrays**
  - Converts CSV rows into a **jagged array (`T[][]`)**
  - Each CSV row becomes an independent C# array
  - Output is formatted and ready to paste

- 🧾 **Header handling**
  - Ignore first row as header (optional)
  - Ignore first column as header (optional)

- 📋 **Copy to clipboard**
  - One-click button to copy the generated C# code.

- 🧮 **Numeric-friendly**
  - Designed primarily for numeric matrix datasets.
  - String values are automatically wrapped in quotes.

---

## Demo

![csv-to-array demo](./images/demo.gif)

## Usage

## 📌 Example

### CSV Input

<pre class="overflow-visible!" data-start="519" data-end="544"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>1,2,3
4,5,6
7,8,9
</span></span></code></div></div></pre>

### Generated C# jagged array (old syntax)

<pre class="overflow-visible!" data-start="573" data-end="657"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-csharp"><span><span>int</span><span>[][] matrix =
{
    new int[] { </span><span>1</span><span>, </span><span>2</span><span>, </span><span>3</span><span> },
    new int[] { </span><span>4</span><span>, </span><span>5</span><span>, </span><span>6</span><span> },
    new int[] { </span><span>7</span><span>, </span><span>8</span><span>, </span><span>9</span><span> }
};
</span></span></code></div></div></pre>

### Generated C# jagged array (collection syntax)

<pre class="overflow-visible!" data-start="573" data-end="657"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-csharp"><span><span>int</span><span>[][] matrix =
[
    [ </span><span>1</span><span>, </span><span>2</span><span>, </span><span>3</span><span> ],
    [ </span><span>4</span><span>, </span><span>5</span><span>, </span><span>6</span><span> ],
    [ </span><span>7</span><span>, </span><span>8</span><span>, </span><span>9</span><span> ]
];
</span></span></code></div></div></pre>

---

## 📦 Requirements

- Visual Studio Code **1.xx.x** or later
- No external dependencies required

---

## 🐞 Known Issues

- Large CSVs may take longer to render.
- Mixed data types may require manual cleanup.
- Only C# jagged array generation (`T[][]`) is supported.
- Speially characters for strings is not supported yet.

---

## 📝 Release Notes

### 0.0.1

- Initial release of **csv-to-array**
- CSV grid editor (Webview)
- Add/remove rows and columns
- Generate C# 2D array and 1D vector
- Copy generated array to clipboard

### 0.0.2

- Switched C# output from multidimensional arrays (`T[,]`) to **jagged arrays (`T[][]`)**
- Removed 1D vector generation
- Cleaner and more idiomatic C# output
- Improved compatibility with real-world C# codebases

---

> 💡 Why jagged arrays?
>
> Jagged arrays (`T[][]`) are more flexible, easier to manipulate, and more commonly used in modern C# codebases than multidimensional arrays (`T[,]`).

---

## 🤝 Contributing

Contributions are welcome!

Feel free to open issues, suggest enhancements, or submit pull requests.
