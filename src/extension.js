// https://code.visualstudio.com/api/extension-guides/tree-view

const vscode = require('vscode');
const path = require('path');
const NoteBook = require('./NoteBook');
const duplexLinkPlugin = require('./markdown-it-duplex-link');
const utils = require('./utils');

const extensionName = 'vscode-note-book';

function activate(context) {

    // TODO: 通过配置激活此插件。默认配置应该是false。
    if (false) return;

    const cwd = vscode.workspace.workspaceFolders[0];

    const noteBook = new NoteBook({ localStoragePath: path.join(__dirname, './data.js') });

    const commands = [
        {
            id: `${extensionName}.scan`,
            fn: function () {
                noteBook.scan(cwd.uri.fsPath);
                noteBook.store();
                vscode.window.showInformationMessage(`扫描${cwd.uri.fsPath}完成！`);
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

            let noteName = path.basename(file.fsPath);

            noteBook.deleteNote(noteName);

        }

        noteBook.store();

    });

    vscode.workspace.onDidRenameFiles(function ({ files }) {

        for(let file of files) {

            if (!utils.isNote(file.fsPath)) continue;

            let noteName = path.basename(file.fsPath);

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

        noteBook.setNote(noteName, document.fileName, links);

        noteBook.store();

        console.log('onDidSaveTextDocument');

    });

    return {
        extendMarkdownIt(md) {

            return md.use(require('markdown-it-codepen'))
                .use(duplexLinkPlugin(noteBook, true));

        }
    };

}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
