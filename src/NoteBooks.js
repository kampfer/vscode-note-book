const fs = require('fs');
const path = require('path');
const { walk } = require('./utils');

const testTagsReg = /\\begin\{tags\}([\s\w*]*)\\end\{tags\}/;
const testSupLinksReg = /\\begin\{supLinks\}([\s\w*]*)\\end\{supLinks\}/;
const testSubLinksReg = /\\begin\{subLinks\}([\s\w*]*)\\end\{subLinks\}/;

class NoteBooks {

    constructor(rootPath) {

        this.rootPath = rootPath;

        this._data = {

            tags: [],

            notes: []

        };

    }

    store() {

        clearTimeout(this._timer);

        this._timer = setTimeout(() => fs.writeFileSync(this._storePath, JSON.stringify(this._tags)), 50);

    }

    scan(folder) {

        // 忽略.开头的文件夹
        walk(folder, (roots, dirs, files) => {

            if (!files) return;

            for (let i = 0, l = files.length; i < l; i++) {

                let file = files[i];

                if (path.extname(file) !== '.md') continue;

                let content = fs.readFileSync(file).toString(),
                    tagsOfDocument = this.extractTags(content),
                    supLinksOfDocument = this.extractSupLinks(content),
                    subLinksOfDocument = this.extractSubLinks(content);

                if (tagsOfDocument) {

                    tagsOfDocument.forEach(tagName => this.addTagToNote(tagName, file));

                }

                if (supLinksOfDocument) {
                    
                }

                if (subLinksOfDocument) {

                }

            }

        }, true);

    }

    extractTags(resource) {
        let tagsContent = resource.match(testTagsReg),
            tagsOfDocument;

        if (tagsContent) tagsOfDocument = tagsContent[0].split('\n').filter((v, i, arr) => i !== 0 && i !== arr.length - 1);

        return tagsOfDocument;
    }

    extractSupLinks() { }

    extractSubLinks() { }

    createTag() { }

    deleteTag() { }

    getTag() { }

    createNote() { }

    deleteNote() { }

    getNote() { }

}

module.exports = NoteBooks;