// document.body.innerHTML = (new Date()).toString();

import * as d3 from 'd3';
import NetworkGraph from './NetworkGraph';

import './graph.css';

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

function selectNode(id) {

    vscode.setState({ currentNode: id });

    const { relatedNodes, relatedLinks } = findRelatedNodesAndLinks(links, id);

    nodeElems.attr('fill', d => relatedNodes.indexOf(d.id) >= 0 ? activeColor : 'currentColor');

    linkElems.attr('stroke', d => relatedLinks.indexOf(d.index) >= 0 ? activeColor : normalColor)
        .attr('marker-end', d => relatedLinks.indexOf(d.index) >= 0 ?
            `url(${new URL(`#arrow-upLink`, location)})` :
            `url(${new URL(`#arrow-downLink`, location)})`);

    circleElems.attr('stroke', d => d.id === id ? 'white' : (relatedNodes.indexOf(d.id) >= 0 ? activeColor : 'white'));

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

        data.nodes.forEach(n => n.label = n.id);
        data.edges.forEach(e => {
            e.id = `${e.source}-${e.target}`;
            e.label = e.id;
        });

        // test
        data.nodes.push({
            id: Math.random().toString(),
            label: 'test',
            type: 'test',
            image: 'https://pic2.zhimg.com/80/v2-eb983559a5ebb774ea07cedf73288da8_720w.jpg',
        });

        // window加载完毕（load事件）时innerWidth、innerHeight可能等于0
        // 放在messge事件的回调中才能取到正常的innerWidth、innerHeight
        let graph = new NetworkGraph({
            container: 'body',
            width: window.innerWidth,
            height: window.innerHeight
        });

        graph.render(data);
    }

});

// window.addEventListener('resize', () => resizeView());

vscode.postMessage({
    command: 'getGraphDataOfNoteBook'
});