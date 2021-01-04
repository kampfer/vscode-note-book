// document.body.innerHTML = (new Date()).toString();

import NetworkGraph from './NetworkGraph';

import './notebook.css';

const vscode = acquireVsCodeApi();

// window加载完毕（load事件）时innerWidth、innerHeight可能等于0
// 放在messge事件的回调中才能取到正常的innerWidth、innerHeight
const graph = new NetworkGraph({
    container: 'body',
    width: window.innerWidth,
    height: window.innerHeight,
    useClickSelect: true,
    useZoom: true
});

graph.on('selectChange.node', (ids) => vscode.postMessage({
    command: 'selectNote',
    data: {
        id: ids[0]
    }
}));

window.addEventListener('resize', () => {
    const { innerWidth: width, innerHeight: height } = window;
    graph.setViewBox(-width / 2, -height / 2, width, height);
});

window.document.body.addEventListener('click', () => {
    graph.clearSelect()
    vscode.postMessage({ command: 'clearSelect' });
});

function selectNodesAndSiblings(ids) {
    console.log('selectChange.node', ids);

    const { nodes, edges } = graph.data;
    const activatedNodes = [];
    for(let edge of edges) {
        const flag = ids.includes(edge.source.id) || ids.includes(edge.target.id);
        edge.activated = flag;
        if (flag) {
            activatedNodes.push(edge.source.id);
            activatedNodes.push(edge.target.id);
        }
    }
    for(let node of nodes) {
        const flag = activatedNodes.includes(node.id);
        node.activated = flag;
    }
    
    console.log(graph.data);
    graph.rerender({ restartForce: false });
}

function render() {
    vscode.postMessage({
        command: 'getGraphDataOfNoteBook'
    });
}

window.addEventListener('message', event => {

    const message = event.data;

    if (message.command === 'refresh') {
        location.reload();
    } else if (message.command === 'selectNodesAndSiblings') {
        selectNodesAndSiblings(message.data.ids);
    } else {
        const data = { nodes: message.nodes, edges: message.links };

        data.nodes.forEach(n => n.label = n.id);
        data.edges.forEach(e => {
            e.id = `${e.source}-${e.target}`;
            e.label = e.id;
        });

        graph.render(data);

    }

});

render();
