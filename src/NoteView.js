const vscode = require('vscode');
const MarkdownIt = require('markdown-it');
const EventEmitter = require('events');
const utils = require('./utils');
const markdownItCodepen = require('markdown-it-codepen');
const markdownItDuplexLink = require('./markdown-it-duplex-link');
const markdownItTexmath = require('markdown-it-texmath');
const markdownItMermaid = require('markdown-it-mermaid-plugin');
const path = require('path');
const hljs = require('highlight.js');

class NoteView extends EventEmitter {

    constructor({
        noteBook,
        extensionContext,
        root,
    }) {

        super();

        this.noteBook = noteBook;

        this.extensionContext = extensionContext;

        this.root = root;

        const md = new MarkdownIt({
            highlight: function (str, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(lang, str).value;
                    } catch (e) {
                        // noop
                    }
                }

                return ''; // use external default escaping
            }
        });
        md.use(markdownItCodepen)
            .use(markdownItDuplexLink(noteBook, true))
            .use(markdownItMermaid)
            .use(markdownItTexmath, {
                engine: require('katex'),
                delimiters: 'julia',
                katexOptions: { macros: { "\\RR": "\\mathbb{R}" } }
            });

        this.md = md;

    }

    open(note) {

        let noteName = utils.getNoteName(note);

        const panel = vscode.window.createWebviewPanel(
            NoteView.webviewType,
            this.getTitle(noteName),
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: this.getLocalResourceRoots()
            }
        );

        panel.webview.onDidReceiveMessage(
            message => {

                const noteBook = this.noteBook;

                switch (message.command) {
                    case 'getDuplexLinks':
                        return panel.webview.postMessage(noteBook.getLinksByTarget(message.data.id));
                    case 'selectNote':
                        return this.emit('selectNote', { id: path.basename(message.data.href, '.md') });
                }

            },
            undefined,
            this.extensionContext.subscriptions
        );

        panel.onDidDispose(
            () => {
                this._panel = null;
            },
            null,
            this.extensionContext.subscriptions
        );

        this._panel = panel;

        panel.webview.html = this.getWebviewContent(note);

    }

    openBySelf(note) {

        if (!this._panel) {
            this.open(note);
        } else {
            this._panel.webview.html = this.getWebviewContent(note);
            this._panel.title = path.basename(note.uri.path, '.md');
        }

    }

    getLocalResourceRoots() {
        const roots =  [vscode.Uri.file(this.extensionContext.extensionPath)];
        const workspaceRoots = vscode.workspace.workspaceFolders.map(folder => folder.uri);
        if (workspaceRoots) roots.push(...workspaceRoots);
        return roots;
    }

    getTitle(noteName) {
        return `${noteName}`;
    }

    getStyles() {

        const styles = [
            `<style>
            .markdown-body {
                box-sizing: border-box;
                min-width: 200px;
                max-width: 980px;
                margin: 0 auto;
                padding: 45px;
            }

            @media (max-width: 767px) {
                .markdown-body {
                    padding: 15px;
                }
            }

            .cp_embed_wrapper {
                margin-bottom: 16px;
            }
            </style>`
        ];
        const nodeModulesPath = path.join(__dirname, '../node_modules');

        styles.push(
            `<link rel="stylesheet" href="${this.asWebviewUri(path.join(__dirname, '../dist/note.css'))}">`
        );

        return styles.join('\n');

    }

    getScripts() {
        return [
            `<script src="${this.asWebviewUri(path.join(__dirname, '../note.js'))}" charset="UTF-8"></script>`
        ].join('\n');
    }

    getWebviewContent(note) {

        let noteContent = note.getText(),
            noteName = utils.getNoteName(note),
            body = this.md.render(noteContent);

        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${this.getTitle(noteName)}</title>
                    <base href="${this.asWebviewUri(note.uri.fsPath)}">
                    ${this.getStyles()}
                    <script>const NOTE_NAME = '${noteName}';</script>
                </head>
                <body class="vscode-body">
                    ${body}
                    ${this.getScripts()}
                </body>
                </html>`;

    }

    asWebviewUri(uri) {

        return this._panel.webview.asWebviewUri(vscode.Uri.file(uri));

    }

}

NoteView.webviewType = 'vscode-note-view';

module.exports = NoteView;
