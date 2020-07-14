const vscode = require('vscode');
const MarkdownIt = require('markdown-it');
const utils = require('./utils');
const markdownItCodepen = require('markdown-it-codepen');
const markdownItDuplexLink = require('./markdown-it-duplex-link');
const markdownItTexmath = require('markdown-it-texmath');
const path = require('path');
const hljs = require('highlight.js');

class NoteView {

    constructor(noteBook) {

        this.noteBook = noteBook;

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
            vscode.ViewColumn.one,
            {}
        );

        this._panel = panel;

        panel.webview.html = this.getWebviewContent(note);

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
            `<link rel="stylesheet" href="${this.asWebviewUri(path.join(__dirname, 'vscode-github-markdown-preview-style-master/base.css'))}">`,
            `<link rel="stylesheet" href="${this.asWebviewUri(path.join(__dirname, 'vscode-github-markdown-preview-style-master/github-markdown.css'))}">`,
            `<link rel="stylesheet" href="${this.asWebviewUri(path.join(nodeModulesPath, 'highlight.js/styles/github.css'))}">`,
            `<link  rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css">`,
            `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/markdown-it-texmath/css/texmath.min.css">`,
        );

        return styles.join('\n');

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
                    ${this.getStyles()}
                </head>
                <body class="vscode-body">
                    ${body}
                </body>
                </html>`;

    }

    asWebviewUri(uri) {

        return this._panel.webview.asWebviewUri(vscode.Uri.file(uri));

    }

}

NoteView.webviewType = 'vscode-note-book-preview';

module.exports = NoteView;
