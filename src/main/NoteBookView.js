// https://observablehq.com/@d3/arc-diagram
// https://observablehq.com/@d3/mobile-patent-suits

const vscode = require('vscode');
const path = require('path');
const NoteView = require('./NoteView');

class NoteBookView {

    constructor({
        noteBook,
        extensionContext,
        root
    } = {}) {

        this.noteBook = noteBook;
        this.extensionContext = extensionContext;
        this.root = root;

        this.currentNote = undefined;

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

                switch (message.command) {
                    case 'getGraphDataOfNoteBook':
                        return panel.webview.postMessage(this.getNetworkData());
                    case 'selectNote':
                        return this.selectNote(message.data.id);
                    case 'clearSelect':
                        return this.currentNote = null;
                }

            },
            undefined,
            this.extensionContext.subscriptions
        );

        panel.onDidDispose(
            () => {
                this._panel = null;
                this.noteBook.off('store', this.onDidStore);
            },
            null,
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
            vscode.Uri.file(path.join(__dirname, '../dist/notebook.js')),
        ].map(src => `<script src="${panel.webview.asWebviewUri(src)}" charset="UTF-8"></script>`).join('\n');
    }

    getStyles() {
        return [
            `<link rel="stylesheet" href="${this.asWebviewUri(path.join(__dirname, '../dist/notebook.css'))}">`
        ].join('\n');
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
                    ${this.getStyles()}
                </head>
                <body>
                    <div id="app"></div>
                    ${this.getScripts(panel)}
                </body>
                </html>`;

    }

    getNetworkData() {

        const nodes = this.noteBook.getAllNotes();
        const links = this.noteBook.getAllLinks();

        return {
            nodes: nodes ? Object.keys(nodes).map(id => ({ id })) : [],
            links: links ? links.map(({ source, target }) => ({ source, target, type: 'downLink' })) : []
        };

    }

    selectNote(noteName) {

        const note = this.noteBook.getNote(noteName);

        if (!note) {
            vscode.window.showInformationMessage(`笔记【${noteName}】不存在！`);
            return;
        }

        if (note === this.currentNote) return;

        this.currentNote = note;

        if (!this._noteView) {
            this._noteView = new NoteView({
                noteBook: this.noteBook,
                extensionContext: this.extensionContext,
                root: this.root,
            });
            // 在笔记本详情中点击其他笔记的链接会触发selectNode
            this._noteView.on('selectNote', ({ id }) => this.selectNote(id));
        }

        vscode.workspace.openTextDocument(note.path)
            .then(
                note => this._noteView.openBySelf(note),
                () => vscode.window.showInformationMessage(`笔记【${noteName}】不存在！`)
            );

        this._panel.webview.postMessage({
            command: 'selectNodesAndSiblings',
            data: {
                ids: [noteName]
            }
        });

    }

    refreshView() {

        if (this._panel) {
            this._panel.webview.postMessage({
                command: 'refresh'
            });
        }

    }

    dispose() {

        this.noteBook.off('store', this.onDidStore);
        if (this._noteView) this._noteView.off('selectNote');

    }

    asWebviewUri(uri) {

        return this._panel.webview.asWebviewUri(vscode.Uri.file(uri));

    }

}

NoteBookView.webviewType = 'vscode-note-book-view';

module.exports = NoteBookView;
