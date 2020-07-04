// 检查代码是否生效
// document.body.innerHTML = (new Date).toString();

function getSettings() {

    let elem = document.getElementById('vscode-markdown-preview-data');

    return JSON.parse(elem.dataset.settings);
}

function getSource() {

    let settings = getSettings();

    return decodeURIComponent(settings.source);

}

function getCurrentNoteName() {

    let source = getSource(),
        index = source.lastIndexOf('/');

    return source.substr(index + 1);

}

function getNote(noteName) {

    return data.notes[noteName];

}

window.addEventListener('load', function () {

    let note = getNote(getCurrentNoteName());

    if (note && note.callers) {

        let rootElem = document.createElement('div');

        rootElem.innerHTML = `
            <h1>被引用${note.callers.length}处</h1>
            <dl>${note.callers.map(caller => `<dt><a href="${caller}">${caller}</a></dt>`).join('${caller}')}</dl>
        `;

        document.body.appendChild(rootElem);

    }

});
