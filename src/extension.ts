import * as vscode from "vscode";
import { readFileSync } from "fs";
import htmlBodyContent from "./webview/body";

export function activate(context: vscode.ExtensionContext) {
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
      /*const webviewFolder = vscode.Uri.joinPath(
        context.extensionUri,
        "webview",
      );*/
      const webviewFolder = vscode.Uri.joinPath(
        context.extensionUri,
        "src",
        "webview",
      );

      const cssFile = vscode.Uri.joinPath(webviewFolder, "styles.css");
      const mainJsFile = vscode.Uri.joinPath(webviewFolder, "main.js");

      /*try {
        await vscode.workspace.fs.stat(cssFile);
        vscode.window.showInformationMessage(
          "CSS existe: " + cssFile.toString(),
        );
      } catch {
        vscode.window.showErrorMessage(
          "NO existe CSS en: " + cssFile.toString(),
        );
      }*/

      const panel = vscode.window.createWebviewPanel(
        "csvTableView",
        `CSV Table: ${fileUri.path.split("/").pop()}`,
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          localResourceRoots: [webviewFolder],
        },
      );
      const cssUri = panel.webview.asWebviewUri(
        cssFile,
        //vscode.Uri.joinPath(webviewFolder, "styles.css"),
      );
      const mainJsUri = panel.webview.asWebviewUri(mainJsFile);

      vscode.window.showInformationMessage(cssUri.toString());
      //html table
      panel.webview.html = getWebviewContent(
        text,
        panel.webview,
        cssUri,
        mainJsUri,
      );
      panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === "saveCsv") {
          const updatedCsv = message.data as string;
          const enc = new TextEncoder();
          await vscode.workspace.fs.writeFile(fileUri, enc.encode(updatedCsv));
          vscode.window.showInformationMessage("CSV guardado desde la tabla");
        }
      });
    },
  );

  context.subscriptions.push(disposable);
}

//ToDo: fix this
//this could be breake if you use a " or ' or ' these speial characters should't be used
function getWebviewContent(
  csvText: string,
  webview: vscode.Webview,
  cssUri: vscode.Uri,
  mainJsUri: vscode.Uri,
): string {
  const rows = csvText.split(/\r?\n/).filter((r) => r.length > 0);

  const htmlRows = rows
    .map((row, rowIndex) => {
      const cells = row.split(",");
      const tds = cells
        .map(
          (c, colIndex) =>
            `<td contenteditable="true" data-row="${rowIndex}" data-col="${colIndex}" ${
              rowIndex === 0 && colIndex === 0 ? 'class="first-cell"' : ""
            } >${c}
		 	
		  </td>`,
        )
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");
  const nonce = String(Date.now());
  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${cssUri}">
</head>
<body>
  ${htmlBodyContent()}
    <table id="grid">
        ${htmlRows}
    </table>
    <script nonce="${nonce}" type="module" src="${mainJsUri}"></script>
</body>
</html>
`;
}

export function deactivate() {}
