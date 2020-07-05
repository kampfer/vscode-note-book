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

    console.log(data);

    let note = getNote(getCurrentNoteName());

    if (note && note.upLinks && note.upLinks.length > 0) {

        let rootElem = document.createElement('div');

        rootElem.innerHTML = `
            <h1>被${note.upLinks.length}篇笔记引用：</h1>
            <ol>${note.upLinks.map(caller => `<li><a href="${caller}">${caller}</a></li>`).join('')}</dl>
        `;

        document.body.appendChild(rootElem);

    }

});
