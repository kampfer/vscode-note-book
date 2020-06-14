// https://code.visualstudio.com/api/extension-guides/tree-view

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const Tags = require('./Tags');
const Notes = require('./Notes');

const extensionName = 'vscode-note-book';

function activate(context) {

    let cwd = vscode.workspace.workspaceFolders[0];

    if (!cwd) return;

    let fsPath = cwd.uri.fsPath;  // 工作目录的地址
    let localStoragePath = path.join(fsPath, '.note_books');
    let tagsStoragePath = path.join(localStoragePath, 'tags.json');
    let notesStoragePath = path.join(localStoragePath, 'notes.json');

    const tags = new Tags(tagsStoragePath);
    const notes = new Notes(notesStoragePath);

    const commands = [
        {
            id: `${extensionName}.init`,
            fn: function () {

                let existsNoteBooks = fs.existsSync(localStoragePath);

                if (!existsNoteBooks) {

                    fs.mkdirSync(localStoragePath);
                    fs.openSync(path.join(localStoragePath, 'notes.json'), '[]');
                    fs.openSync(path.join(localStoragePath, 'tags.json'), '[]');

                } else {

                    vscode.window.showInformationMessage('./.note_books已存在，不需要重复初始化。');

                }

            }
        },
        {
            id: `${extensionName}.scanTags`,
            fn: function () {

                tags.extractTagsFromFolder(fsPath);

            }
        }
    ];

    vscode.workspace.onDidChangeWorkspaceFolders(function () {
        console.log('onDidChangeWorkspaceFolders');
    });

    vscode.workspace.onDidSaveTextDocument(function () {

        let textEditor = vscode.window.activeTextEditor,
            document = textEditor.document;

        tags.extractTagsFromDocument(document);

        console.log('onDidSaveTextDocument');

    });

    // https://code.visualstudio.com/api/extension-guides/command#creating-new-commands
    for (let command of commands) {

        let disposable = vscode.commands.registerCommand(command.id, command.fn);

        context.subscriptions.push(disposable);

    }

}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
