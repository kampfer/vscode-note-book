const fs = require('fs');
const path = require('path');
const { walk } = require('./utils');
const { debounce } = require('throttle-debounce');
const MarkdownIt = require('markdown-it');
const markdownItDuplexLinkPlugin = require('./markdown-it-duplex-link');

class NoteBook {

    constructor({
        localStoragePath
    }) {

        this.localStoragePath = localStoragePath;

        this._modified = false;

        this.store = debounce(1000, this.store);

        let data = null;

        try {

            let content = fs.readFileSync(this.localStoragePath);

            data = JSON.parse(content.toString());

        } catch (e) {

            data = {
                notes: {}
            };

        }

        this.data = data;

    }

    reset() {
        this._modified = false;
        this.data = { notes: {} };
    }

    store(force) {

        if (!this._modified && !force) return;

        this._modified = false;

        fs.writeFileSync(this.localStoragePath, JSON.stringify(this.data));

        console.log(`写入${this.localStoragePath}`);

    }

    scan(noteBookDir) {

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
                    links = this.extractDuplexLinks(content);

                note.callees = links;

            }

        }, true);

        let notes = Object.keys(this.data.notes);

        for (let i = 0, l = notes.length; i < l; i++) {

            let noteName = notes[i],
                note = this.getNote(noteName);

            for (let j = 0, k = note.callees.length; j < k; j++) {

                let callee = note.callees[j];

                this.addCallerOfNote(callee, noteName);

            }

        }

    }

    extractDuplexLinks(content) {

        let md = new MarkdownIt();
        md.use(require('markdown-it-codepen')).use(markdownItDuplexLinkPlugin());

        let tokens = md.parse(content, {}),
            links = [];

        for (let i = 0, l = tokens.length; i < l; i++) {

            let token = tokens[i];

            if (token.type === 'inline') {

                let children = token.children;

                if (children) {

                    for (let j = 0, k = children.length; j < k; j++) {

                        let child = children[j];

                        if (child.isDuplexLink) links.push(`${child.content}.md`);

                    }

                }

            }

        }

        return links;

    }

    // path引用的note：callees
    // 引用path的note：callers
    createNote(name, path, callees, callers) {
        this._modified = true;
        return this.data.notes[name] = { callers, callees, path };
    }

    deleteNote(path) {
        this._modified = true;
        delete this.data.notes[path];
    }

    getNote(noteName) {
        return this.data.notes[noteName];
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

    // 先删除后添加
    // setCalleesOfNote(noteName, callees) {

    //     let note = this.getNote(noteName);

    //     if (note) {

    //         let oldCallees = note.callees;

    //     } else {

    //         note = this.createNote(noteName, callees);

    //     }

    //     note.callees = [...callees];

    //     for(let i = 0, l = oldCallees.length; i < l; i++) {

    //         let oldCallee = oldCallees[i];

    //         // 旧记录在新记录中不存在，需要删除旧记录
    //         if (callees.indexOf(oldCallee) < 0) {

    //             // 删除note.callees中的记录
    //             // this.deleteCalleeOfNote(noteName, oldCallee);

    //             // 删除oldCallee.callers中的记录
    //             this.deleteCallerOfNote(oldCallee, noteName);

    //         }

    //     }

    //     for(let i = 0, l = callees.length; i < l; i++) {

    //         let callee = callees[i];

    //         // 新记录在旧记录中不存在，需要添加新记录
    //         if (oldCallees.indexOf(callee) < 0) {

    //             // 在note.callee中添加新记录
    //             // this.addCalleeOfNote(noteName, callee);

    //             // 在callee.caller中添加新记录
    //             this.addCallerOfNote(callee, noteName);

    //         }

    //     }

    // }

    // addDuplexLink(note, link) {



    // }

}

module.exports = NoteBook;