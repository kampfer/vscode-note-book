const fs = require('fs');
const path = require('path');
const EventEmitter = require('events')
const { walk } = require('./utils');
const { debounce } = require('throttle-debounce');
const MarkdownIt = require('markdown-it');
const markdownItDuplexLinkPlugin = require('./markdown-it-duplex-link');

class NoteBook extends EventEmitter {

    constructor({
        localStoragePath
    } = {}) {

        super();

        this.localStoragePath = localStoragePath;

        this.store = debounce(1000, this.store);

        let md = new MarkdownIt();
        this.md = md.use(require('markdown-it-codepen')).use(markdownItDuplexLinkPlugin(this, true));

        this._data = null;

        this.loadData(this.localStoragePath);

    }

    empty() {
        return !!this._data && Object.keys(this._data.notes).length === 0
    }

    loadData(dataPath) {

        try {

            this._data = JSON.parse(fs.readFileSync(this.localStoragePath));

        } catch (e) {

            // do nothing

        }

        if (!this._data) this._data = { notes: {} };

    }

    reset() {
        this._data = { notes: {} };
    }

    store() {

        fs.writeFileSync(this.localStoragePath, JSON.stringify(this._data));

        this.emit('store');

        console.log(`写入${this.localStoragePath}`);

    }

    // 忽略隐藏文件夹（.开头的文件夹）
    // 忽略不存在的note（引用不存在的note并不会生成link）
    scan(noteBookDir) {

        this.reset();

        // 遍历工作目录，找出所有note并创建空记录（此时不提取link，因为无法正确判断note是否存在）
        walk(noteBookDir, (roots, dirs, files) => {

            if (!files) return;

            for (let i = 0, l = files.length; i < l; i++) {

                let file = files[i];

                if (path.extname(file) !== '.md') continue;

                let noteName = path.basename(file, '.md');

                this.createNote(noteName, file);

            }

        }, true);

        let notes = Object.keys(this._data.notes);

        // 提取link
        for (let i = 0, l = notes.length; i < l; i++) {

            let noteName = notes[i],
                note = this.getNote(noteName),
                content = fs.readFileSync(note.path).toString(),
                links = this.extractDuplexLinksFromFileContent(content);

            links.forEach(link => this.addLink(noteName, link.target, link.context));

        }

    }

    // return [{ target, context }, ...]
    extractDuplexLinksFromFileContent(content) {

        let tokens = this.md.parse(content, {}),
            links = [];

        for (let i = 0, l = tokens.length; i < l; i++) {

            let token = tokens[i];

            if (token.type === 'inline') {

                let children = token.children;

                if (children) {

                    for (let j = 0, k = children.length; j < k; j++) {

                        let child = children[j];

                        if (child.isDuplexLink) {

                            links.push({
                                target: child.content,
                                context: token.content
                            });

                        }

                    }

                }

            }

        }

        return links;

    }

    createNote(name, path) {
        if (this._data.notes[name]) return;
        return this._data.notes[name] = { name, path };
    }

    deleteNote(noteName) {

        let note = this.getNote(noteName);

        if (!note) return;

        delete this._data.notes[noteName];
        this.deleteLinksBySource(noteName);
        this.deleteLinksByTarget(noteName);

    }

    getNote(noteName) {
        return this._data.notes[noteName];
    }

    getAllNotes() {
        return this._data.notes;
    }

    getAllLinks() {
        return this._data.links;
    }

    addLink(source, target, context) {

        let links = this._data.links;

        if (!links) {
            this._data.links = links = [];
        }

        links.push({ source, target, context });

    }

    deleteLinksBySource(source) {

        let links = this._data.links;

        if (!links) return;

        for(let i = 0, l = links.length; i < l; i++) {

            let link = links[i];

            if (link.source === source) {

                links.splice(i, 1);
                i -= 1;
                l -= 1;

            }

        }

    }

    deleteLinksByTarget(target) {

        let links = this._data.links;

        if (!links) return;

        for(let i = 0, l = links.length; i < l; i++) {

            let link = links[i];

            if (link.target === target) {

                links.splice(i, 1);
                i -= 1;
                l -= 1;

            }

        }

    }

    deleteLinkBySourceTarget(source, target) {

        let links = this._data.links;

        if (!links) return;

        for(let i = 0, l = links.length; i < l; i++) {

            let link = links[i];

            if (link.source === source && link.target === target) {

                return links.splice(i, 1);

            }

        }

    }

    getLinksBySouce(source) {

        let links = this._data.links;

        if (!links) return;

        return links.filter(link => link.source === source);

    }

    getLinksByTarget(target) {

        let links = this._data.links;

        if (!links) return;

        return links.filter(link => link.target === target);

    }

    getLinkBySourceTarget(source, target) {

        let links = this._data.links;

        if (!links) return;

        for(let i = 0, l = links.length; i < l; i++) {

            let link = links[i];

            if (link.source === source && link.target === target) return link;

        }

    }

    toJSON() {}

}

NoteBook.DOWN_LINK = 'downLink';
NoteBook.UP_LINK = 'upLink';

module.exports = NoteBook;