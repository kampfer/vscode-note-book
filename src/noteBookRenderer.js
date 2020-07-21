// document.body.innerHTML = (new Date()).toString();

const vscode = acquireVsCodeApi();

const types = ['downLink', 'upLink'];
const color = d3.scaleOrdinal(types, d3.schemeCategory10);
const height = window.innerHeight;
const width = window.innerWidth;
const normalColor = color('downLink');
const activeColor = color('upLink');

let rootElem, linkElems, nodeElems, circleElems, links, nodes;

const drag = simulation => {

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

function linkArc(d) {
    const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
    return `
      M${d.source.x},${d.source.y}
      A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
    `;
}

function findRelatedNodesAndLinks(links, id) {

    function find(links, id, direction, result) {

        for (let i = 0, l = links.length; i < l; i++) {

            let link = links[i];

            if (direction === 'up') {

                if (link.target.id === id) {

                    result.relatedLinks.push(i);
                    find(links, link.source.id, direction, result);

                }

            } else if (direction === 'down') {

                if (link.source.id === id) {

                    result.relatedLinks.push(i);
                    find(links, link.target.id, direction, result);

                }

            }

        }

        if (result.relatedNodes.indexOf(id) < 0) result.relatedNodes.push(id);

    }

    const result = {
        relatedNodes: [],
        relatedLinks: []
    };

    find(links, id, 'up', result);
    find(links, id, 'down', result);

    return result;

}

function renderNoteBook(data) {

    links = data.links;
    nodes = data.nodes;

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("x", d3.forceX())
        .force("y", d3.forceY());

    const svg = d3.create("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .style("font", "12px sans-serif");

    // Per-type markers, as they don't inherit styles.
    svg.append("defs").selectAll("marker")
        .data(types)
        .join("marker")
        .attr("id", d => `arrow-${d}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -0.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", color)
        .attr("d", "M0,-5L10,0L0,5");

    const link = svg.append("g")
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("stroke", d => color(d.type))
        .attr("marker-end", d => `url(${new URL(`#arrow-${d.type}`, location)})`);

    const node = svg.append("g")
        .attr("fill", "currentColor")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(drag(simulation));

    node.on('click', ({ id }) => {

        selectNode(id);

        vscode.postMessage({
            command: 'openNote',
            data: { id }
        });

    });

    const circles = node.append("circle")
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("r", 4);

    node.append("text")
        .attr("x", 8)
        .attr("y", "0.31em")
        .text(d => d.id);

    simulation.on("tick", () => {
        link.attr("d", linkArc);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    rootElem = svg;
    linkElems = link;
    nodeElems = node;
    circleElems = circles;

    let state = vscode.getState();

    if (state && state.currentNode) selectNode(state.currentNode);

    document.body.appendChild(rootElem.node());

}

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
    rootElem.attr("viewBox", [-width / 2, -height / 2, width, height]);

}

window.addEventListener('message', event => {

    const message = event.data;

    if (message.command === 'refresh') {
        location.reload();
    } else if (message.command === 'selectNode') {
        selectNode(event.data.data.id);
    } else {
        renderNoteBook(event.data);
    }

});

window.addEventListener('resize', () => resizeView());

vscode.postMessage({
    command: 'getGraphDataOfNoteBook'
});