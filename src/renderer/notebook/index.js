// document.body.innerHTML = (new Date()).toString();

import * as d3 from 'd3';
import NetworkGraph from './NetworkGraph';

import './notebook.css';

const vscode = acquireVsCodeApi();

NetworkGraph.registerNode('test', {

    create(datum, graph) {

        const defsSelection = graph.defsSelection;

        if (defsSelection.select('#circle-image').empty()) {
            // 圆形裁剪路径
            defsSelection.append('clipPath')
                .attr('id', 'circle-image')
                .append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', 30);
        }

        const groupSelection = d3.create('svg:g').datum(datum);

        groupSelection.classed('virtual-node', datum.virtual);

        groupSelection.append('circle')
            .classed('outer-circle', true)
            .attr('r', 34);

        groupSelection.append('circle')
            .classed('inner-circle', true)
            .attr('r', 30);

        groupSelection.append('image')
            .classed('node-image', true)
            .attr('clip-path', 'url(#circle-image)')
            .attr('xlink:href', d => d.image)
            .attr('width', 60)
            .attr('height', 60)
            .attr('x', -30)
            .attr('y', -30);

        groupSelection.append('text')
            .text(datum.label)
            .classed('node-label', true)
            .attr('x', 0)
            .attr('y', 34 + 16)
            .attr('text-anchor', 'middle')

        return groupSelection;
    },
    
    update(selection, d, graph) {
        selection.attr('transform', d => `translate(${d.x}, ${d.y})`);
    }

});

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

vscode.postMessage({
    command: 'getGraphDataOfNoteBook'
});