// https://code.visualstudio.com/api/extension-guides/tree-view

const vscode = require('vscode');
const { walk } = require('./utils');
const path = require('path');
const fs = require('fs');

const cwd = vscode.workspace.workspaceFolders[0];
const fsPath = cwd.uri.fsPath;  // 工作目录的地址

function activate(context) {

    if (!cwd) return;

    // https://code.visualstudio.com/api/extension-guides/command#creating-new-commands
    let disposable = vscode.commands.registerCommand('vscode-note-book.init', function () {

        const localStoragePath = path.join(fsPath, '.note_books');
        const existsNoteBooks = fs.existsSync(localStoragePath);

        if (!existsNoteBooks) {

            fs.mkdirSync(localStoragePath);

        } else {

            vscode.window.showInformationMessage('./.note_books已存在，不需要重复初始化。');

        }

    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
