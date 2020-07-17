// https://code.visualstudio.com/api/extension-guides/tree-view

const vscode = require('vscode');
const path = require('path');
const NoteBook = require('./NoteBook');
const duplexLinkPlugin = require('./markdown-it-duplex-link');
const utils = require('./utils');
const NoteBookView = require('./NoteBookView');

const extensionName = 'vscode-note-book';

function activate(context) {

    // 通过配置控制插件是否生效
    if (!vscode.workspace.getConfiguration('NoteBook').get('enabled')) return;

    const cwd = vscode.workspace.workspaceFolders[0];
    const noteBook = new NoteBook({ localStoragePath: path.join(__dirname, './data.js') });
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
    vscode.workspace.onDidDeleteFiles(function ({ files }) {

        for(let file of files) {

            if (!utils.isNote(file.fsPath)) continue;

            let noteName = getNoteName(file.fsPath);

            noteBook.deleteNote(noteName);

        }

        noteBook.store();

    });

    vscode.workspace.onDidRenameFiles(function ({ files }) {

        for(let file of files) {

            if (!utils.isNote(file.fsPath)) continue;

            let noteName = getNoteName(file.fsPath);

            noteBook.deleteNote(noteName);

            let links = noteBook.extractDuplexLinksFromFileContent(file.toString());

            noteBook.setNote(noteName, file.fsPath, links);

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

    return {
        extendMarkdownIt(md) {

            return md.use(require('markdown-it-codepen'))
                .use(duplexLinkPlugin(noteBook, true));

        }
    };

}

const getCurrentDocument = function () {

    if (vscode.window.activeTextEditor) {

        return vscode.window.activeTextEditor.document;

    }

    return null;

};

const getNoteName = function (fsPath) {

    return path.basename(fsPath, '.md');

}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
