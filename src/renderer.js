const vscode = acquireVsCodeApi();

// 检查代码是否生效
document.body.innerHTML = Object.keys(vscode).join('/');
// document.body.innerHTML = (new Date).toString();

vscode.postMessage({
    command: 'getUplinksOfNote',
    args: {
        noteName: 'someName'
    }
});