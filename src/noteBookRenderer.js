// document.body.innerHTML = (new Date()).toString();

const vscode = acquireVsCodeApi();

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

const types = ['downLink', 'upLink'];
const color = d3.scaleOrdinal(types, d3.schemeCategory10);
const height = window.innerHeight;
const width = window.innerWidth;

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

window.addEventListener('message', event => {

    const message = event.data;

    const { links, nodes, } = message;

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

    node.on('dblclick', ({ id }) => {
        vscode.postMessage({
            command: 'openNote',
            data: { id }
        })
    });

    node.on('click', ({ id }) => {

        const color2 = color('upLink');
        const color3 = color('downLink');

        const { relatedNodes, relatedLinks } = findRelatedNodesAndLinks(links, id);

        node.attr('fill', d => relatedNodes.indexOf(d.id) >= 0 ? color2 : 'currentColor');

        link.attr('stroke', d => relatedLinks.indexOf(d.index) >= 0 ? color2 : color3)
            .attr('marker-end', d => relatedLinks.indexOf(d.index) >= 0 ?
                `url(${new URL(`#arrow-upLink`, location)})` :
                `url(${new URL(`#arrow-downLink`, location)})`);

        circles.attr('stroke', d => d.id === id ? color2 : 'white');

    });

    const circles = node.append("circle")
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("r", 4);

    node.append("text")
        .attr("x", 8)
        .attr("y", "0.31em")
        .text(d => d.id);
    // .clone(true).lower()
    // .attr("fill", "none")
    // .attr("stroke", "white")
    // .attr("stroke-width", 3);

    simulation.on("tick", () => {
        link.attr("d", linkArc);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    document.body.appendChild(svg.node());

});

vscode.postMessage({
    command: 'getGraphDataOfNoteBook'
});