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

    return source.substring(index + 1, source.length - 3);

}

function getNote(noteName) {

    return data.notes[noteName];

}

function getDuplexLinks(target) {

    let links = data.links;

    if (!links) return;

    return links.filter(link => link.target === target);

}

window.addEventListener('load', function () {

    console.log(data);

    let noteName = getCurrentNoteName(),
        links = getDuplexLinks(noteName);

    if (links && links.length > 0) {

        let rootElem = document.createElement('div');

        rootElem.innerHTML = `
            <h1>被${links.length}篇笔记引用：</h1>
            ${links.map((link, index) => `
                <p>${index + 1}.&nbsp;<a href="${link.source}.md">${link.source}</a></p>
                <blockquote>${link.context}</blockquote>
            `).join('')}
        `;

        document.body.appendChild(rootElem);

    }

});
