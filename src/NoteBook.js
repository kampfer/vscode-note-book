const fs = require('fs');
const path = require('path');
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

            data = { tags: [] };

        }

        this.data = data;

    }

    store() {

        clearTimeout(this._timer);

        this._timer = setTimeout(() => fs.writeFileSync(this.localStoragePath, JSON.stringify(this.data)), 50);

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

}

module.exports = NoteBook;