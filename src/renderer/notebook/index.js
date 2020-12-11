// document.body.innerHTML = (new Date()).toString();

import NetworkGraph from './NetworkGraph';

import './graph.css';

const vscode = acquireVsCodeApi();

const graph = new NetworkGraph({
    container: 'body',
    width: window.innerWidth,
    height: window.innerHeight
});

NetworkGraph.registerNode('note', {
    create(selection, graph) {
        const nodeSelection = selection.append('circle');
        return nodeSelection;
    }
});

function selectNode(id) {

    vscode.setState({ currentNode: id });

    const { relatedNodes, relatedLinks } = findRelatedNodesAndLinks(links, id);

    nodeElems.attr('fill', d => relatedNodes.indexOf(d.id) >= 0 ? activeColor : 'currentColor');

    linkElems.attr('stroke', d => relatedLinks.indexOf(d.index) >= 0 ? activeColor : normalColor)
        .attr('marker-end', d => relatedLinks.indexOf(d.index) >= 0 ?
            `url(${new URL(`#arrow-upLink`, location)})` :
            `url(${new URL(`#arrow-downLink`, location)})`);

    circleElems.attr('stroke', d => d.id === id ? 'white': (relatedNodes.indexOf(d.id) >= 0 ? activeColor : 'white'));

}

function resizeView() {

    const width = window.innerWidth;
    const height = window.innerHeight;
    if (rootElem) rootElem.attr("viewBox", [-width / 2, -height / 2, width, height]);

}

window.addEventListener('message', event => {

    const message = event.data;

    if (message.command === 'refresh') {
        location.reload();
    } else if (message.command === 'selectNote') {
        selectNode(message.data.id);
    } else {
        const data = { nodes: message.nodes, edges: message.links };
        graph.render(data);
    }

});

// window.addEventListener('resize', () => resizeView());

vscode.postMessage({
    command: 'getGraphDataOfNoteBook'
});