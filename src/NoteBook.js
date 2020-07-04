const fs = require('fs');
const path = require('path');
const { walk } = require('./utils');
const { debounce } = require('throttle-debounce');
const MarkdownIt = require('markdown-it');
const markdownItDuplexLinkPlugin = require('./markdown-it-duplex-link');

function findDuplexLinks(token, arr) {

    if (token.type === 'inline' && token.children) {

        for(let i = 0, l = token.children.length; i < l; i++) {

            let child = token.children[i];

            if (child.isDuplexLink) {

                arr.push(`${child.content}.md`);

            } else {

                findDuplexLinks(child, arr);

            }

        }

    } else if (token.isDuplexLink) {

        arr.push(`${token.content}.md`);

    }

}

class NoteBook {

    constructor({
        localStoragePath
    }) {

        this.localStoragePath = localStoragePath;

        this.store = debounce(1000, this.store);

        let md = new MarkdownIt();
        md.use(require('markdown-it-codepen')).use(markdownItDuplexLinkPlugin);
        this.md = md;

        try {

            let { data } = require(this.localStoragePath);

            this._data = data;

        } catch (e) {

            this._data = {
                notes: {}
            };

        }

    }

    reset() {
        // this._modified = false;
        this._data = { notes: {} };
    }

    store(force) {

        fs.writeFileSync(this.localStoragePath, `(function (exports) { exports.data = ${JSON.stringify(this._data)};})(typeof exports !== 'undefined' ? exports : window);`);

        console.log(`写入${this.localStoragePath}`);

    }

    scan(noteBookDir) {

        this.reset();

        // 忽略.开头的文件夹
        walk(noteBookDir, (roots, dirs, files) => {

            if (!files) return;

            for (let i = 0, l = files.length; i < l; i++) {

                let file = files[i];

                if (path.extname(file) !== '.md') continue;

                let noteName = path.basename(file),
                    note = this.getNote(noteName);

                if (!note) note = this.createNote(noteName);

                let content = fs.readFileSync(file).toString(),
                    links = this.extractDuplexLinksFromFileContent(content);

                note.callees = links;

            }

        }, true);

        let notes = Object.keys(this._data.notes);

        for (let i = 0, l = notes.length; i < l; i++) {

            let noteName = notes[i],
                note = this.getNote(noteName);

            if (!note.callees) continue;

            for (let j = 0, k = note.callees.length; j < k; j++) {

                let callee = note.callees[j];

                this.addCallerOfNote(callee, noteName);

            }

        }

    }

    extractDuplexLinksFromFileContent(content) {

        let tokens = this.md.parse(content, {}),
            links;

        for (let i = 0, l = tokens.length; i < l; i++) {

            let token = tokens[i];

            if (token.type === 'inline') {

                let children = token.children;

                if (children) {

                    for (let j = 0, k = children.length; j < k; j++) {

                        let child = children[j];

                        if (child.isDuplexLink) {

                            if (!links) links = [];

                            links.push(`${child.content}.md`);

                        }

                    }

                }

            }

        }

        return links;

    }

    extractDuplexLinksFromMarkdownItState(state) {

        let tokens = state.tokens,
            links = [];

        for(let i = 0, l = tokens.length; i < l; i++) {

            let token = tokens[i];

            findDuplexLinks(token, links);

        }

        console.log(links);

        return links;

    }

    // path引用的note：callees
    // 引用path的note：callers
    createNote(name, path, callees, callers) {
        if (this._data.notes[name]) return;
        // this._modified = true;
        return this._data.notes[name] = { callers, callees, path };
    }

    deleteNote(noteName) {
        if (!this._data.notes[noteName]) return;
        // this._modified = true;
        delete this._data.notes[noteName];
    }

    getNote(noteName) {
        return this._data.notes[noteName];
    }

    deleteCalleeOfNote(noteName, callee) {

        let note = this.getNote(noteName);

        if (!note || !note.callees) return;

        let index = note.callees.indexOf(callee);

        if (index >= 0) note.callees.splice(index, 1);

    }

    addCalleeOfNote(noteName, callee) {

        let note = this.getNote(noteName);

        if (!note) return;

        if (!note.callees) note.callees = [];

        let index = note.callees.indexOf(callee);

        if (index < 0) note.callees.push(callee);

    }

    deleteCallerOfNote(noteName, caller) {

        let note = this.getNote(noteName);

        if (!note || !note.callers) return;

        let index = note.callers.indexOf(caller);

        if (index >= 0) note.callers.splice(index, 1);

    }

    addCallerOfNote(noteName, caller) {

        let note = this.getNote(noteName);

        if (!note) return;

        if (!note.callers) note.callers = [];

        let index = note.callers.indexOf(caller);

        if (index < 0) note.callers.push(caller);

    }

    setCalleesOfNote(noteName, callees) {}

    isNote(fsPath) {
        return path.extname(fsPath) === '.md';
    }

}

module.exports = NoteBook;