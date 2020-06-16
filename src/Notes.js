const fs = require('fs');
const path = require('path');
const { walk } = require('./utils');

class Notes {

    constructor(storagePath) {

        this._storagePath = storagePath;

        if (storagePath) {

            let notes;

            try {

                notes = JSON.parse(fs.readFileSync(storePath));

            } catch(e) {}

            this._tags = tags ? tags : [];

        } else {

            this._tags = [];

        }

    }

}

Notes.testSupLinksReg  = /\\begin\{supLinks\}([\s\w*]*)\\end\{supLinks\}/;

Notes.testSubLinksReg  = /\\begin\{subLinks\}([\s\w*]*)\\end\{subLinks\}/;

module.exports = Notes;
