// https://observablehq.com/@d3/arc-diagram
// https://observablehq.com/@d3/mobile-patent-suits

const vscode = require('vscode');
const path = require('path');

class NoteBookView {

    constructor({
        noteBook,
        extensionContext
    } = {}) {

        this.noteBook = noteBook;
        this.extensionContext = extensionContext;

    }

    open() {

        const panel = vscode.window.createWebviewPanel(
            NoteBookView.webviewType,
            this.getTitle(),
            vscode.ViewColumn.one,
            {
                enableScripts: true
            }
        );

        panel.webview.onDidReceiveMessage(
            message => {

                const noteBook = this.noteBook;

                switch (message.command) {
                    case 'getGraphDataOfNoteBook':
                        return panel.webview.postMessage(this.getNetworkData());
                }

            },
            undefined,
            this.extensionContext.subscriptions
        );

        panel.webview.html = this.getWebviewContent(panel);

    }

    getTitle() {
        return 'Note Book View';
    }

    // https://github.com/microsoft/vscode/blob/master/extensions/markdown-language-features/src/features/previewContentProvider.ts#L198
    getCsp() {
        // return '<meta http-equiv="Content-Security-Policy" content="">';
        return '';
    }

    getScripts(panel) {

        return [
            // vscode.Uri.file(
            //     path.join(this.extensionContext.extensionPath, 'src', 'd3.js')
            // ),
            vscode.Uri.file(
                path.join(this.extensionContext.extensionPath, 'src', 'noteBookRenderer.js')
            ),
        ].map(src => `<script src="${panel.webview.asWebviewUri(src)}" charset="UTF-8"></script>`).join('\n');

    }

    getWebviewContent(panel) {

        const csp = this.getCsp();

        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    ${csp}
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Note Book View</title>
                    <script src="https://d3js.org/d3.v5.min.js"></script>
                </head>
                <body>
                    ${this.getScripts(panel)}
                </body>
                </html>`;

    }

    getNetworkData() {

        const nodes = Object.keys(this.noteBook.getAllNotes()).map(id => ({ id }));
        const links = this.noteBook.getAllLinks().map(({source, target}) => ({ source, target, type: 'downLink' }));

        return { nodes, links };

    }

}

NoteBookView.webviewType = 'vscode-note-book-view';

module.exports = NoteBookView;
