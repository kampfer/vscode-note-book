const fs = require('fs');
const path = require('path');
const { walk } = require('./utils');
const { debounce } = require('throttle-debounce');
const MarkdownIt = require('markdown-it');
const markdownItDuplexLinkPlugin = require('./markdown-it-duplex-link');

class NoteBook {

    constructor({
        localStoragePath
    } = {}) {

        this.localStoragePath = localStoragePath;

        this.store = debounce(1000, this.store);

        let md = new MarkdownIt();

        md.use(require('markdown-it-codepen')).use(markdownItDuplexLinkPlugin(this));

        this.md = md;

        this._data = null;

        this.loadData(this.localStoragePath);

    }

    loadData(dataPath) {

        try {

            let { data } = require(dataPath);

            this._data = data;

        } catch (e) {

            // do nothing

        }

        if (!this._data) this._data = { notes: {} };

    }

    reset() {
        // this._modified = false;
        this._data = { notes: {} };
    }

    store() {

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

                if (links) note.downLinks = links;

            }

        }, true);

        let notes = Object.keys(this._data.notes);

        for (let i = 0, l = notes.length; i < l; i++) {

            let noteName = notes[i],
                note = this.getNote(noteName);

            if (!note.downLinks) continue;

            for (let j = 0, k = note.downLinks.length; j < k; j++) {

                let callee = note.downLinks[j];

                this.addLinkToNote(callee, NoteBook.UP_LINK, noteName);

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

    // uplinks：引用当前note的note的列表
    // downlinks：当前note引用的note的列表
    // 根据downlinks设置uplinks
    createNote(name, path, downLinks, upLinks) {
        if (this._data.notes[name]) return;
        // this._modified = true;
        return this._data.notes[name] = { upLinks, downLinks, path };
    }

    deleteNote(noteName) {

        let note = this.getNote(noteName);

        if (!note) return;

        if (Array.isArray(note.downLinks)) {

            note.downLinks.forEach(link => this.deleteLinkOfNote(link, NoteBook.UP_LINK, noteName));

        }

        delete this._data.notes[noteName];
    }

    getNote(noteName) {
        return this._data.notes[noteName];
    }

    // 比较两个列表，返回修改操作集合。
    // 通过将返回结果应用在list1上可以获得list2。
    diffList(list1 = [], list2 = []) {

        let diffs = [];

        for (let i = 0, l = list1.length; i < l; i++) {

            if (list2.indexOf(list1[i]) < 0) {

                diffs.push({ type: 'delete', index: i, value: list1[i] });

            }

        }

        for (let i = 0, l = list2.length; i < l; i++) {

            if (list1.indexOf(list2[i]) < 0) {

                diffs.push({ type: 'add', index: i, value: list2[i] });

            }

        }

        return diffs;

    }

    setNote(noteName, path, downLinks, upLinks) {

        let note = this.getNote(noteName);

        // 不传downlinks和uplinks参数，避免之后的diffs结果为空
        if (!note) note = this.createNote(noteName, path);

        if (note.path !== path) note.path = path;

        if (Array.isArray(downLinks)) {

            let oldDownLinks = note.downLinks,
                diffs = this.diffList(oldDownLinks, downLinks);

            note.downLinks = downLinks;

            diffs.forEach(diff => {

                if (diff.type === 'add') {

                    this.addLinkToNote(noteName, NoteBook.DOWN_LINK, diff.value);
                    this.addLinkToNote(diff.value, NoteBook.UP_LINK, noteName);

                } else if (diff.type === 'delete') {

                    this.deleteLinkOfNote(noteName, NoteBook.DOWN_LINK, diff.index);
                    this.deleteLinkOfNote(diff.value, NoteBook.UP_LINK, noteName);

                }

            });

        }

        if (Array.isArray(upLinks)) {

            let oldUpLinks = note.upLinks,
                diffs = this.diffList(oldUpLinks, upLinks);

            note.upLinks = upLinks;

            diffs.forEach(diff => {

                if (diff.type === 'add') {

                    this.addLinkToNote(noteName, NoteBook.UP_LINK, diff.value);
                    this.addLinkToNote(diff.value, NoteBook.DOWN_LINK, noteName);


                } else if (diff.type === 'delete') {

                    this.deleteLinkOfNote(noteName, NoteBook.UP_LINK, diff.index);
                    this.deleteLinkOfNote(diff.value, NoteBook.DOWN_LINK, noteName);

                }

            });

        }

    }

    deleteLinkOfNote(noteName, type, link) {

        let note = this.getNote(noteName);

        if (!note) return;

        let links;

        if (type === NoteBook.DOWN_LINK) {

            links = note.downLinks;

        } else if (type === NoteBook.UP_LINK) {

            links = note.upLinks;

        }

        if (!links) return;

        let index = link;

        if (typeof index !== 'number') index = links.indexOf(link);

        if (index >= 0) links.splice(index, 1);

    }

    addLinkToNote(noteName, type, link) {

        let note = this.getNote(noteName);

        if (!note) return;

        let links;

        if (type === NoteBook.DOWN_LINK) {

            links = note.downLinks;

        } else if (type === NoteBook.UP_LINK) {

            links = note.upLinks;

        }

        if (!links) {

            links = [];

            if (type === NoteBook.DOWN_LINK) {

                note.downLinks = links;

            } else if (type === NoteBook.UP_LINK) {

                note.upLinks = links;

            }

        }

        let index = links.indexOf(link);

        if (index < 0) links.push(link);

    }

}

NoteBook.DOWN_LINK = 'downLink';
NoteBook.UP_LINK = 'upLink';

module.exports = NoteBook;