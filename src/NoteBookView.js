// https://observablehq.com/@d3/arc-diagram
// https://observablehq.com/@d3/mobile-patent-suits

const vscode = require('vscode');
const path = require('path');
const NodeView = require('./NoteView');

class NoteBookView {

    constructor({
        noteBook,
        extensionContext,
        root
    } = {}) {

        this.noteBook = noteBook;
        this.extensionContext = extensionContext;
        this.root = root;

        this.onDidStore = this.refreshView.bind(this);
        this.noteBook.on('store', this.onDidStore);

    }

    open() {

        const panel = vscode.window.createWebviewPanel(
            NoteBookView.webviewType,
            this.getTitle(),
            vscode.ViewColumn.One,
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
                    case 'openNote':
                        return this.createNoteView(message.data.id);
                }

            },
            undefined,
            this.extensionContext.subscriptions
        );

        this._panel = panel;

        this._panel.webview.html = this.getWebviewContent();

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

    getWebviewContent() {

        const panel = this._panel;
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

        const nodes = this.noteBook.getAllNotes();
        const links = this.noteBook.getAllLinks();

        return {
            nodes: nodes ? Object.keys(nodes).map(id => ({ id })) : [],
            links: links ? links.map(({source, target}) => ({ source, target, type: 'downLink' })) : []
        };

    }

    createNoteView(noteName) {

        const note = this.noteBook.getNote(noteName);
        const noteView = new NodeView({
            noteBook: this.noteBook,
            extensionContext: this.extensionContext,
            root: this.root,
        });

        vscode.workspace.openTextDocument(note.path).then(note => noteView.open(note));

    }

    refreshView() {

        this._panel.webview.postMessage({
            command: 'refresh'
        });

    }

    dispose() {

        this.noteBook.off('store', this.onDidStore);

    }

}

NoteBookView.webviewType = 'vscode-note-book-view';

module.exports = NoteBookView;
