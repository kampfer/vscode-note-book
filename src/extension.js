const vscode = require('vscode');
const { walk } = require('./utils');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    const cwd = vscode.workspace.workspaceFolders[0];

    if (!cwd) return;

    const fsPath = cwd.uri.fsPath;

    walk(fsPath, function (root, dirs, files) {
        if (root[0] !== '.') {
            console.log(root, dirs, files);
        }
    });

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('vscode-note-book.helloWorld', function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from vscode-note-book!');
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
