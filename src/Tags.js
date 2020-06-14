const fs = require('fs');

class Tags {

    constructor(storePath) {

        this._storePath = storePath;

        /**
         * 数据格式：
         * [
         *      {
         *          tagName: 'test',
         *          notes: [
         *              'notePath1',
         *              'notePath2',
         *          ],
         *      },
         *      {
         *          tagName: 'test',
         *          notes: [
         *              'notePath1',
         *              'notePath2',
         *          ],
         *      }
         *      ...
         * ]
         */
        if (storePath) {

            this._tags = JSON.parse(fs.readFileSync(storePath));

        } else {

            this._tags = [];

        }


    }

    extractTagsFromDocument(document) {

        let documentContent = document.getText(),
            tagsContent = documentContent.match(Tags.testReg),
            tagsOfDocument;

        if (tagsContent) tagsOfDocument = tagsContent[0].split('\n').filter((v, i, arr) => i !== 0 && i !== arr.length - 1);

        if (tagsOfDocument) tagsOfDocument.forEach(tagName => this.addTagToNote(tagName, document.uri.fsPath));

    }

    hasTag(tagName) {

        let tags = this._tags;

        for (let i = 0, l = tags.length; i < l; i++) {

            if (tags[i].name === tagName) return true;

        }

        return false;

    }

    hasNote(tagName, note) {

        let tag = this.getTag(tagName);

        if (tag) {

            let notes = tag.notes,
                hasNote = false;

            for (let i = 0, l = notes.length; i < l; i++) {

                if (notes[i].name === note.name) hasNote = true;

            }

            return hasNote;

        }

        return false;

    }

    createTag(tagName, notes = []) {
        this._tags.push({ tagName, notes });
    }

    getTag(tagName) {

        let tags = this._tags;

        for (let i = 0, l = tags.length; i < l; i++) {

            if (tags[i].tagName === tagName) return tags[i];

        }

        return null;

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

    store() {

        clearTimeout(this._timer);

        this._timer = setTimeout(() => fs.writeFileSync(this._storePath, JSON.stringify(this._tags)), 50);

    }

}

Tags.testReg = /\\begin\{tags\}([\s\w*]*)\\end\{tags\}/;

module.exports = Tags;
