<template>
    <div class="notebook">
        <div class="search-box-wrapper">
            <search-box placeholder="搜索" class="my-search-box"></search-box>
        </div>
        <div class="graph"></div>
    </div>
</template>

<script>
import { NetworkGraph } from '../my-graph/src';
import SearchBox from './SearchBox.vue';

const vscode = acquireVsCodeApi();

export default {
    components: {
        SearchBox
    },
    data() {
        return {
            test: 'test'
        }
    },
    methods: {
        selectNodesAndSiblings(ids) {
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
    },
    created() {
        this.graph = new NetworkGraph({
            width: window.innerWidth,
            height: window.innerHeight,
            behaviors: ['clickSelect', 'zoom']
        });

        this.graph.on('selectChange.node', (ids) => vscode.postMessage({
            command: 'selectNote',
            data: {
                id: ids[0]
            }
        }));
    },
    mounted() {
        this.$el.querySelector('.graph').appendChild(this.graph.svgSelection.node());

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
                    e.label = e.id;
                });

                this.graph.render(data, {
                    autoLayout: true
                });

            }

        });

        vscode.postMessage({
            command: 'getGraphDataOfNoteBook'
        });
    },
    unmounted() {

    }
}
</script>

<style lang="css" scoped>
.search-box-wrapper {
    padding: 20px;
    position: fixed;
    left: 0;
    top: 0;
    width: 200px;
}
</style>