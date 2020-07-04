const vscode = require('vscode');
const MarkdownIt = require('markdown-it');
const utils = require('./utils');

class Previewer {

    constructor(noteBook) {
        this.md = new MarkdownIt();
        this.noteBook = noteBook;
    }

    open(note) {

        let noteName = utils.getNoteName(note);

        const panel = vscode.window.createWebviewPanel(
            Previewer.webviewType,
            this.getTitle(noteName),
            vscode.ViewColumn.one,
            {}
        );

        panel.webview.html = this.getWebviewContent(note);

    }

    getTitle(noteName) {
        return `预览-${noteName}`;
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
                </head>
                <body>
                    ${body}
                </body>
                </html>`;

    }

}

Previewer.webviewType = 'vscode-note-book-preview';

Previewer.webviewContentTpl =
`<html`

module.exports = Previewer;
