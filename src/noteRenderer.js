const vscode = acquireVsCodeApi();

window.addEventListener('message', event => {

    const links = event.data;

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

vscode.postMessage({
    command: 'getDuplexLinks',
    data: {
        id: NOTE_NAME
    }
});
