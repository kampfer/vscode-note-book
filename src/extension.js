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
            return md.use(require('markdown-it-codepen'))
                // 参考markdown-it link规则实现`[[xxx]]`语法
                // https://github.com/markdown-it/markdown-it/blob/master/lib/rules_inline/link.js
                .use(function (md) {

                    md.inline.ruler.before('emphasis', 'duplexLink', function (state, silent) {

                        if (silent) return false;

                        let content = state.src;

                        // 0x5b === '['
                        if (content.charCodeAt(state.pos) !== 0x5b) return false;

                        let labelStart = state.pos + 2,
                            labelEnd = labelStart;

                        while(labelEnd < state.posMax) {

                            // 0x5d === ']'
                            if (content.charCodeAt(labelEnd) === 0x5d && content.charCodeAt(labelEnd + 1) === 0x5d) {
                                labelEnd++;
                                break;
                            }

                            labelEnd++;

                        }

                        if (labelEnd < 0 || labelEnd > state.posMax) return false;

                        let title = content.substring(labelStart, labelEnd - 1),
                            href = `${title}.md`,
                            token;

                        // <a href="somePath">title</a>
                        // ^^^^^^^^^^^^^^^^^^^
                        token = state.push('link_open', 'a', 1);
                        token.attrs = [
                            ['href', href],
                            ['title', title]
                        ];

                        // <a href="somePath">title</a>
                        //                    ^^^^^
                        token = state.push('text', '', 0);
                        token.content = title;

                        // <a href="somePath">title</a>
                        //                         ^^^^
                        token = state.push('link_close', 'a', -1);

                        // markdown-it从新pos开始继续分析剩下文档内容
                        state.pos = labelEnd + 1;

                        return true;

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
