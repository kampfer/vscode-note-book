// https://code.visualstudio.com/api/extension-guides/tree-view

const vscode = require('vscode');
const path = require('path');
// const fs = require('fs');
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
    vscode.workspace.onDidCreateFiles(function ({ files }) {

        for(let file of files) {

            if (!noteBook.isNote(file.fsPath)) continue;

            let noteName = path.basename(file.fsPath);

            noteBook.createNote(noteName);

        }

        noteBook.store();

    });

    vscode.workspace.onDidDeleteFiles(function ({ files }) {

        for(let file of files) {

            if (!noteBook.isNote(file.fsPath)) continue;

            let noteName = path.basename(file.fsPath);

            noteBook.deleteNote(noteName);

        }

        noteBook.store();

    });

    vscode.workspace.onDidRenameFiles(function ({ files }) {

        for(let file of files) {

            if (!noteBook.isNote(file.fsPath)) continue;

            let noteName = path.basename(file.fsPath);

            // noteBook.deleteNote(noteName);

        }

        noteBook.store();

    });

    vscode.workspace.onDidSaveTextDocument(function (document) {

        if (document.languageId !== 'markdown') return;

        noteBook.store();

        console.log('onDidSaveTextDocument');

    });

    return {
        extendMarkdownIt(md) {

            return md.use(require('markdown-it-codepen'))
                .use(duplexLinkPlugin)
                .use(function (md) {

                    // core.ruler列表的最后一条规则一定是最后被执行的
                    // 可以在此处完成一些必须在文档被全部解析完之后执行的任务
                    // 比如将更新当前文档的duplex links列表，或者加入codepen的embed.js
                    md.core.ruler.push('note-book', function (state) {

                        let links = noteBook.extractDuplexLinksFromMarkdownItState(state),
                            doc = utils.getCurrentNote(),
                            noteName = doc ? utils.getNoteName(doc) : undefined,
                            note = noteBook.getNote(noteName);

                        if (!note) return;

                        note.callees = links;

                        for (let j = 0, k = note.callees.length; j < k; j++) {

                            let callee = note.callees[j];

                            noteBook.addCallerOfNote(callee, noteName);

                        }

                    });

                });

        }
    };

}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
