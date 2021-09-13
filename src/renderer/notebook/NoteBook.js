import React from 'react';
import { NetworkGraph } from '../my-graph/src';

const vscode = acquireVsCodeApi();

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this.graphRef = React.createRef();
    }

    selectNodesAndSiblings() {
        console.log('selectChange.node', ids);

        const { nodes, edges } = this.graph.data;
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

        console.log(this.graph.data);
        this.graph.rerender({ restartForce: false });
    }

    componentDidMount() {
        const graph = new NetworkGraph({
            width: window.innerWidth,
            height: window.innerHeight,
            behaviors: ['clickSelect', 'zoom']
        });
        this.graphRef.current.appendChild(graph.svgSelection.node());

        this.graph = graph;

        graph.on('selectChange.node', (ids) => vscode.postMessage({
            command: 'selectNote',
            data: {
                id: ids[0]
            }
        }));

        window.addEventListener('resize', () => {
            const { innerWidth: width, innerHeight: height } = window;
            this.graph.setViewBox(-width / 2, -height / 2, width, height);
        });

        window.document.body.addEventListener('click', () => {
            this.graph.clearSelect();
            vscode.postMessage({ command: 'clearSelect' });
        });

        window.addEventListener('message', event => {

            const message = event.data;

            if (message.command === 'refresh') {
                location.reload();
            } else if (message.command === 'selectNodesAndSiblings') {
                this.selectNodesAndSiblings(message.data.ids);
            } else {
                const data = { nodes: message.nodes, edges: message.links };

                data.nodes.forEach(n => n.label = n.id);
                data.edges.forEach(e => {
                    e.id = `${e.source}-${e.target}`;
                });

                this.graph.render(data, {
                    autoLayout: true
                });

            }

        });

        vscode.postMessage({
            command: 'getGraphDataOfNoteBook'
        });
    }

    render() {
        return (
            <div className="notebook">
                <div className="search-box-wrapper">
                    {/* <search-box placeholder="搜索" class="my-search-box"></search-box> */}
                </div>
                <div className="graph" ref={this.graphRef}></div>
            </div>
        )
    }

}