// https://code.visualstudio.com/api/extension-guides/tree-view

const vscode = require('vscode');
// const path = require('path');
// const fs = require('fs');
const NoteBook = require('./NoteBook');

const extensionName = 'vscode-note-book';

function activate(context) {

    let cwd = vscode.workspace.workspaceFolders[0];

    if (!cwd) return;

    let noteBook = new NoteBook({ rootPath: cwd.uri.fsPath });

    const commands = [
        {
            id: `${extensionName}.init`,
            fn: function () {
                noteBook.init();
            }
        },
        {
            id: `${extensionName}.scan`,
            fn: function () {
                noteBook.scan();
            }
        }
    ];

    vscode.workspace.onDidChangeWorkspaceFolders(function () {
        console.log('onDidChangeWorkspaceFolders');
    });

    vscode.workspace.onDidSaveTextDocument(function () {

        let textEditor = vscode.window.activeTextEditor,
            document = textEditor.document;

        noteBook.extractTagsFromDocument(document);

        console.log('onDidSaveTextDocument');

    });

    // https://code.visualstudio.com/api/extension-guides/command#creating-new-commands
    for (let command of commands) {

        let disposable = vscode.commands.registerCommand(command.id, command.fn);

        context.subscriptions.push(disposable);

    }

    return {
        extendMarkdownIt(md) {
            return md.use(require('markdown-it-codepen'));
        }
    };

}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
