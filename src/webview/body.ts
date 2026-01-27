export default function htmlBodyContent() {
  const toolbar = `<div id="toolbar">
        <button id="save" style="border: none; background: none; cursor: pointer">
        <svg width="30" height="30" viewBox="0 0 30 28" fill="none">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M23.464 3.205h-20.259v25.59h25.59v-20.259l-5.331-5.331zM21.331 4.271v7.464h-10.662v-7.464h10.662zM27.729 27.729h-23.457v-23.457h5.331v8.53h12.795v-8.53h0.625l4.706 4.707v18.751z"
            fill="#0078d7"
          ></path>
          <path
            d="M18.153 6.404h1.066v3.199h-1.066v-3.199z"
            fill="#0078d7"
          ></path>
          <path
            d="M10.669 20.265h10.662v1.066h-10.662v-1.066z"
            fill="#0078d7"
          ></path>
          <path
            d="M10.669 23.464h10.662v1.066h-10.662v-1.066z"
            fill="#0078d7"
          ></path>
        </svg>
      </button>
        <button id="menu">Menu</button>
        <button id="add-row">Agregar fila</button>
        <button id="add-col">Agregar columna</button>
    </div>
    `;
  const menu = `<dialog id="menu-dialog">
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
    </dialog>`;
  return toolbar + menu;
}
