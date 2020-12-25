import * as dat from 'dat.gui';

function randomNode(data) {
    return data.nodes[Math.floor(Math.random() * data.nodes.length)];
}

const random = function(n) { // 生成n位长度的字符串
    var str = "abcdefghijklmnopqrstuvwxyz0123456789"; // 可以作为常量放到random外面
    var result = "";
    for(var i = 0; i < n; i++) {
        result += str[parseInt(Math.random() * str.length)];
    }
    return result;
}

function makeData(nodeCount, edgeCount) {
    const data = { nodes: [], edges: [] };
    for(let i = 0; i < nodeCount; i++) {
        let id = random(10);
        data.nodes.push({
            id,
            label: id
        });
    }
    for(let i = 0; i < edgeCount; i++) {
        let id = random(10);
        let target = randomNode(data);
        let source = randomNode(data);
        while(source === target) {
            target = randomNode(data);
        }
        data.edges.push({
            id,
            label: id,
            source: source.id,
            target: target.id,
        });
    }
    return data;
}

export const settings = {
    'use mock data': false,
    'node': 100,
    'edge': 300,
    'display edge': true,
    'display edge arrow': true,
    'display edge label': true,
    'display node label': true,
};

export function init({
    graph,
    render
}) {

    function renderRandom() {
        const data = makeData(settings.node, settings.edge);
        graph.render(data);
    }

    const panel = new dat.GUI({ width: 310 });
    
    const folder1 = panel.addFolder('图元数量');
    folder1.add(settings, 'use mock data').listen().onChange(v => v ? renderRandom() : render());
    folder1.add(settings, 'node', 0, 1000, 1).listen().onChange(render);
    folder1.add(settings, 'edge', 0, 3000, 1).listen().onChange(render);
    folder1.open();

    const folder2 = panel.addFolder('渲染');
    folder2.add(settings, 'display edge');
    folder2.add(settings, 'display edge arrow');
    folder2.add(settings, 'display edge label');
    folder2.add(settings, 'display node label');

    if (settings['use mock data']) {
        renderRandom();
    }

    return settings;

}