// https://code.visualstudio.com/api/extension-guides/tree-view

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const NoteBook = require('./NoteBook');
// const { debounce } = require('throttle-debounce');
const duplexLinkPlugin = require('./markdown-it-duplex-link');

const extensionName = 'vscode-note-book';

function activate(context) {

    const cwd = vscode.workspace.workspaceFolders[0];

    if (!cwd) return;

    const noteBookStoragePath = path.join(cwd.uri.fsPath, '.note_book');

    if (!fs.existsSync(noteBookStoragePath)) {
        vscode.window.showInformationMessage(`${noteBookStoragePath}不存在，请执行init命令新建笔记本！`);
    }

    const noteBook = new NoteBook({ localStoragePath: noteBookStoragePath });

    const commands = [
        {
            id: `${extensionName}.init`,
            fn: function () {
                noteBook.scan(cwd.uri.fsPath);
                noteBook.store(true);
                vscode.window.showInformationMessage(`笔记本初始化完成！`);
            }
        },
        {
            id: `${extensionName}.scan`,
            fn: function () {
                noteBook.scan(cwd.uri.fsPath);
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

    });

    vscode.workspace.onDidDeleteFiles(function ({ files }) {

        for(let file of files) {

            if (!noteBook.isNote(file.fsPath)) continue;

            let noteName = path.basename(file.fsPath);

            noteBook.deleteNote(noteName);

        }

    });

    vscode.workspace.onDidRenameFiles(function ({ files }) {

        for(let file of files) {

            if (!noteBook.isNote(file.fsPath)) continue;

            let noteName = path.basename(file.fsPath);

            // noteBook.deleteNote(noteName);

        }

    });

    vscode.workspace.onDidSaveTextDocument(function (document) {

        if (!noteBook.isNote(document)) return;

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
                            noteName = path.basename(vscode.window.activeTextEditor.document.fileName),
                            note = noteBook.getNote(noteName);

                        if (!note) {

                            note = noteBook.createNote(noteName, '', links);

                        } else {

                            note.callees = links;

                        }

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
