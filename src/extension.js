// https://code.visualstudio.com/api/extension-guides/tree-view

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const NoteBook = require('./NoteBook');
// const { debounce } = require('throttle-debounce');

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
            }
        },
        {
            id: `${extensionName}.scan`,
            fn: function () {
                noteBook.scan(cwd.uri.fsPath);
            }
        }
    ];

    // 注册vscode命令
    // https://code.visualstudio.com/api/extension-guides/command#creating-new-commands
    for (let command of commands) {

        let disposable = vscode.commands.registerCommand(command.id, command.fn);

        context.subscriptions.push(disposable);

    }

    vscode.workspace.onDidChangeWorkspaceFolders(function () {
        console.log('onDidChangeWorkspaceFolders');
    });

    let mdState;

    /**
     * 编辑note可能出现的几种情况：
     * 1. 添加callee
     *      1.1. 在note.callees中添加记录
     *      1.2. 在callee.callers中添加记录
     * 2. 修改callee
     *      2.1. 删除旧的callee（情况1）
     *      2.1. 添加新的callee（情况3）
     * 3. 删除callee
     *      3.1. 删除note.callees中的记录
     *      3.2. 删除callee.caller中的记录
     */
    vscode.workspace.onDidSaveTextDocument(function (textDocument) {

        let currentNoteName = path.basename(textDocument.fileName),
            tokens = mdState.tokens,
            duplexLinks = [];

        for(let token of tokens) {

            if (token._isDuplexLink) duplexLinks.push(`${token.content}.md`);

        }

        noteBook.setDuplexLinksOfNote(currentNoteName, duplexLinks);

        noteBook.store();

        console.log('onDidSaveTextDocument');

    });

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

                        while (labelEnd < state.posMax) {

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
                        token._isDuplexLink = true;

                        // <a href="somePath">title</a>
                        //                         ^^^^
                        token = state.push('link_close', 'a', -1);

                        // markdown-it从新pos开始继续分析剩下文档内容
                        state.pos = labelEnd + 1;

                        mdState = state;

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
