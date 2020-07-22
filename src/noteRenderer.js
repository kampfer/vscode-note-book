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

const passThroughLinkSchemes = ['http:', 'https:', 'mailto:', 'vscode:', 'vscode-insiders:'];

// 处理笔记中的点击事件，特别是指向其他笔记的链接
document.addEventListener('click', function (e) {

    let node = e.target;

    // 从触发事件的元素开始往上遍历，寻找带链接的父辈
    while(node) {

        if (node.tagName === 'A') {

            if (node.href.startsWith('#')) return;

            // 略过已知的链接协议
            if (passThroughLinkSchemes.some(scheme => node.href.startsWith(scheme))) return;

            // 点击其他笔记
            vscode.postMessage({
                command: 'selectNote',
                data: {
                    href: node.getAttribute('href') // 不能使用node.href，因为会自动转换为绝对地址，不好处理
                }
            });
            e.preventDefault();
            e.stopPropagation();

            return;

        } else {

            node = node.parentNode;

        }

    }

});

vscode.postMessage({
    command: 'getDuplexLinks',
    data: {
        id: NOTE_NAME
    }
});
