import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "csv-to-array" is now active!');

  const disposable = vscode.commands.registerCommand(
    "csv-to-array.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from csv-to-array!");
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
