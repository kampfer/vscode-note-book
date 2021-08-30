// https://code.visualstudio.com/api/extension-guides/tree-view
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const NoteBook = require('./main/NoteBook');
const utils = require('./main/utils');
const NoteBookView = require('./main/NoteBookView');
const extendMarkdownIt = require('./main/extendMarkdownIt');

const extensionName = 'vscode-note-book';

function activate(context) {

    // 通过配置控制插件是否生效
    if (!vscode.workspace.getConfiguration('NoteBook').get('enabled')) return;

    // 笔记本应该只有一个目录
    const cwd = vscode.workspace.workspaceFolders[0];
    const storagePath = path.join(cwd.uri.fsPath, '.vscode', 'noteBook.json');
    const noteBook = new NoteBook({ localStoragePath: storagePath });
    const noteBookView = new NoteBookView({ noteBook, extensionContext: context, root: cwd });

    const commands = [
        {
            id: `${extensionName}.scan`,
            fn: function () {
                noteBook.scan(cwd.uri.fsPath);
                noteBook.store();
                vscode.window.showInformationMessage(`扫描${cwd.uri.fsPath}完成！`);
            }
        },
        {
            id: `${extensionName}.viewNoteBook`,
            fn: function () {
                noteBookView.open();
            }
        }
    ];

    // 注册vscode命令
    // https://code.visualstudio.com/api/extension-guides/command#creating-new-commands
    for (let command of commands) {

        let disposable = vscode.commands.registerCommand(command.id, command.fn);

        context.subscriptions.push(disposable);

    }

    // 注册事件
    // https://code.visualstudio.com/api/references/vscode-api#workspace
    vscode.workspace.onDidCreateFiles(({ files }) => {

        for(let file of files) {

            if (!utils.isNote(file.fsPath)) continue;

            let noteName = getNoteName(file.fsPath);

            noteBook.createNote(noteName, file.fsPath);

        }

    });

    vscode.workspace.onDidDeleteFiles(function ({ files }) {

        for(let file of files) {

            if (!utils.isNote(file.fsPath)) continue;

            let noteName = getNoteName(file.fsPath);

            noteBook.deleteNote(noteName);

        }

        noteBook.store();

    });

    vscode.workspace.onDidRenameFiles(function ({ files }) {

        for(const { newUri, oldUri } of files) {

            if (utils.isNote(oldUri.fsPath)) {

                let noteName = getNoteName(oldUri.fsPath);

                noteBook.deleteNote(noteName);

            }

            if (utils.isNote(newUri.fsPath)) {

                let noteName = getNoteName(newUri.fsPath),
                    file = fs.readFileSync(newUri.fsPath),
                    links = noteBook.extractDuplexLinksFromFileContent(file.toString());

                noteBook.createNote(noteName, newUri.fsPath);
                links.forEach(link => noteBook.addLink(noteName, link.target, link.context));

            }

        }

        noteBook.store();

    });

    vscode.workspace.onDidSaveTextDocument(function (document) {

        if (document.languageId !== 'markdown') return;

        let noteName = utils.getNoteName(document),
            links = noteBook.extractDuplexLinksFromFileContent(document.getText());

        noteBook.deleteLinksBySource(noteName);

        links.forEach(link => noteBook.addLink(noteName, link.target, link.context));

        noteBook.store();

    });

    if (!fs.existsSync(storagePath)) {
        vscode.window.showInformationMessage(`${storagePath}不存在，请执行扫描命令！`);
    }

    // 存在笔记本，直接打开关系图
    if (!noteBook.empty()) noteBookView.open();

    return {
        extendMarkdownIt(md) {
            return extendMarkdownIt(md, noteBook);
        }
    };

}

// const getCurrentDocument = function () {

//     if (vscode.window.activeTextEditor) {

//         return vscode.window.activeTextEditor.document;

//     }

//     return null;

// };

const getNoteName = function (fsPath) {

    return path.basename(fsPath, '.md');

}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
