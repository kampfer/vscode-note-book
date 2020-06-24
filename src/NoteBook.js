const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const { walk } = require('./utils');

const testTagsReg = /\\begin\{tags\}([\s\w*]*)\\end\{tags\}/;

class NoteBook {

    constructor({
        rootPath,
        localStoragePath = path.join(rootPath, '.note_book')
    }) {

        this.rootPath = rootPath;

        this.localStoragePath = localStoragePath;

        let data = null;

        try {

            let content = fs.readFileSync(this.localStoragePath);

            data = JSON.parse(content.toString());

        } catch (e) {

            console.log(`读取${this.localStoragePath}失败~`);

            data = {
                tags: [],
                notes: {}
            };

        }

        this.data = data;

    }

    store() {

        clearTimeout(this._timer);

        this._timer = setTimeout(() => fs.writeFileSync(this.localStoragePath, JSON.stringify(this.data)), 50);

    }

    getCurrentNotePath() {
        let textEditor = vscode.window.activeTextEditor,
            document = textEditor.document;
        return document.uri.fsPath;
    }

    existsNoteBook() {
        return fs.existsSync(this.localStoragePath);
    }

    init() {
        if (!this.existsNoteBook()) {
            this.store();
        }
    }

    scan() {
        try {
            // 忽略.开头的文件夹
            walk(this.rootPath, (roots, dirs, files) => {

                if (!files) return;

                for (let i = 0, l = files.length; i < l; i++) {

                    let file = files[i];

                    if (path.extname(file) !== '.md') continue;

                    let content = fs.readFileSync(file).toString(),
                        tagsOfDocument = this.extractTags(content);

                    if (tagsOfDocument) {

                        tagsOfDocument.forEach(tagName => this.addTagToNote(tagName, file));

                    }

                }

            }, true);
        } catch (e) { debugger; }
    }

    extractTags(resource) {
        let tagsContent = resource.match(testTagsReg),
            tagsOfDocument;

        if (tagsContent) tagsOfDocument = tagsContent[0].split('\n').filter((v, i, arr) => i !== 0 && i !== arr.length - 1);

        return tagsOfDocument;
    }

    createTag(tagName, notes = []) {
        this.data.tags.push({ tagName, notes });
    }

    deleteTag(tagName) {

        let tags = this.data.tags;

        for (let i = 0, l = tags.length; i < l; i++) {

            if (tags[i].tagName === tagName) {

                tags.splice(i, 1);

                break;

            }

        }

    }

    getTag(tagName) {

        let tags = this.data.tags;

        for (let i = 0, l = tags.length; i < l; i++) {

            if (tags[i].tagName === tagName) return tags[i];

        }

        return null;

    }

    extractTagsFromDocument(document) {

        let tagsOfDocument = this.extractTags(document.getText());

        if (tagsOfDocument) tagsOfDocument.forEach(tagName => this.addTagToNote(tagName, document.uri.fsPath));

    }

    addTagToNote(tagName, notePath) {

        let tag = this.getTag(tagName),
            needUpdate = false;

        if (tag) {

            let notes = tag.notes,
                hasNote = false;

            for (let i = 0, l = notes.length; i < l; i++) {

                if (notes[i] === notePath) hasNote = true;

            }

            if (hasNote === false) {

                notes.push(notePath);

                needUpdate = true;

            }

        } else {

            this.createTag(tagName, [notePath]);

            needUpdate = true;

        }

        if (needUpdate) this.store();

        console.log(needUpdate);

    }

    // path引用的note：callees
    // 引用path的note：callers
    createNote(path, callers = [], callees = []) {
        return this.data.notes[path] = { callers, callees, path };
    }

    deleteNote(path) {
        delete this.data.notes[path];
    }

    getNote(notePath) {
        return this.data.notes[notePath];
    }

    // caller引用callee
    addDuplexLink(caller, callee) {

        let callerNote = this.getNote(caller),
            calleeNote = this.getNote(callee);

        if (callerNote) {

            let calleeExits = false;

            for (let i = 0, l = callerNote.callees.length; i < l; i++) {

                if (callerNote.callees[i] === callee) {

                    calleeExits = true;
                    break;

                }

            }

            if (!calleeExits) callerNote.callees.push(callee);

        } else {

            this.createNote(caller, [], [callee]);

        }

        if (calleeNote) {

            let callerExits = false;

            for (let i = 0, l = calleeNote.callers.length; i < l; i++) {

                if (calleeNote.callers[i] === caller) {

                    callerExits = true;
                    break;

                }

            }

            if (!callerExits) calleeNote.callers.push(caller);

        } else {

            this.createNote(callee, [caller], []);

        }

    }

}

module.exports = NoteBook;