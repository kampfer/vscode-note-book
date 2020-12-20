import * as d3 from 'd3';
import * as math from './math';

import './graph.css';

export default class NetworkGraph {

    constructor({
        container,
        width = 300,
        height = 150,
        useZoom = false,
        useBrush = false,
        useDrag = true,
        defaultNode = {
            size: 30,
            style: {}
        },
        defaultEdge = {
            style: {
                stroke: '#66B7DC',
            }
        },
    } = {}) {

        this.defaultEdge = defaultEdge;
        this.defaultNode = defaultNode;
        this.useZoom = useZoom;
        this.useBrush = useBrush;
        this.useDrag = useDrag;

        let svgSelection;
        if (container) {
            svgSelection = d3.select(container).append('svg');
        } else {
            svgSelection = d3.create('svg');
        }

        svgSelection.attr('viewBox', [-width / 2, -height / 2, width, height])
            .attr('width', width)
            .attr('height', height);

        const simulation = d3.forceSimulation();
        const linkForce = d3.forceLink().id(d => d.id).distance(200);

        simulation.stop();

        simulation.force('edge', linkForce)
            .force('change', d3.forceManyBody().strength(-500))
            .force('x', d3.forceX().strength(0.05))
            .force('y', d3.forceY().strength(0.05));

        const handleTick = () => {

            console.log('simulation tick');

            if (this.edgeSelection) {
                this.edgeSelection.call(this.updateEdges);
            }

            if (this.nodeSelection) {
                this.nodeSelection.call(this.updateNodes);
            }

        };

        simulation.on('tick', handleTick);

        if (this.useDrag) {
            this.d3Drag = d3.drag()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();   // 重新激活force tick
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);   // 动画可以停止
                    d.fx = null;
                    d.fy = null;
                });
        }

        // 力导布局
        this.forceSimulation = simulation;
        this.linkForce = linkForce;

        // d3 selection
        this.svgSelection = svgSelection;
        this.defsSelection = svgSelection.append('defs');
        this.gSelection = svgSelection.append('g');
        this.nodeSelection = null;
        this.edgeSelection = null;
        this.edgePathSelection = null;

    }

    static registerNode(nodeType, config) {
        NetworkGraph.nodeConstrutors[nodeType] = config;
    }

    static registerEdge(edgeType, config) {
        NetworkGraph.edgeConstructors[edgeType] = config;
    }

    static getNodeConstructor(nodeType) {
        const constructor = NetworkGraph.nodeConstrutors[nodeType];
        if (constructor) return constructor;
        return NetworkGraph.nodeConstrutors.default;
    }

    static getEdgeConstructor(edgeType) {
        const constructor = NetworkGraph.edgeConstructors[edgeType];
        if (constructor) return constructor;
        return NetworkGraph.edgeConstructors.default;
    }

    render(data, {
        restartForce = true
    } = {}) {

        const { nodes, edges } = this.parse(data);

        this.forceSimulation.stop();

        this.forceSimulation.nodes(nodes);
        this.linkForce.links(edges);

        this.gSelection.selectAll('path.edge')
            .data(edges, d => d.id)
            .join(enter => this.createEdges(enter))
            .classed('selected', d => d.selected)
            .classed('hidden', d => d.visible === false);

        // 节点
        // 约定所有节点都拥有class='.node-group'
        this.gSelection.selectAll('.node-group')
            // 必须给key，否则改变元素顺序时，展示会错乱
            .data(nodes, d => d.id)
            .join(enter => this.createNodes(enter))
            .classed('selected', d => d.selected)
            .classed('activated', d => d.activated)
            .classed('hidden', d => d.visible === false);

        this.edgeSelection = this.gSelection.selectAll('path.edge');
        this.nodeSelection = this.gSelection.selectAll('g.node-group');
        this.edgeLabelSelection = this.gSelection.selectAll('text.edge-label');

        const selectedNodes = this.nodeSelection.filter(d => d.selected);
        const selectedEdges = this.edgeSelection.filter(d => d.selected);

        this.gSelection.classed('hasSelected', selectedNodes.size() > 0 || selectedEdges.size() > 0);

        // 选中的元素放在最后，这样展示时会在最上层
        selectedEdges.raise();
        this.edgeLabelSelection.filter(d => d.selected).raise();
        selectedNodes.raise();

        if (restartForce) {
            this.forceSimulation.alpha(1);
            this.forceSimulation.restart();
        }

    }

    // 初始化时source是字符串，之后d3将它替换为对象
    getSourceId(edge) {
        if (typeof edge.source === 'string') {
            return edge.source;
        } else {
            return edge.source.id;
        }
    }

    // 初始化时target是字符串，之后d3将它替换为对象
    getTargetId(edge) {
        if (typeof edge.target === 'string') {
            return edge.target;
        } else {
            return edge.target.id;
        }
    }

    parse(data) {
        const { edges, nodes } = data;
        const sames = {};

        // 在最后添加假数据占位，避免调用d3.raise时移动了最后一个元素，导致d3.order不工作，边盖在点上
        if (!this.fakeDataAppended) {
            this.fakeDataAppended = true;
            edges.push({
                source: '__fake_source__',
                target: '__fake_target__',
                visible: false,
            });

            nodes.push({
                id: '__fake_source__',
                visible: false
            }, {
                id: '__fake_target__',
                visible: false
            });
        }

        edges.forEach(edge => {

            const sourceId = this.getSourceId(edge);
            const targetId = this.getTargetId(edge);
            let direction = `${sourceId}-${targetId}`;
            if (sames[direction] === undefined) sames[direction] = 0;
            edge.sameIndex = ++sames[direction];

        });

        edges.forEach((edge, i) => {

            const sourceId = this.getSourceId(edge);
            const targetId = this.getTargetId(edge);
            const same = sames[`${sourceId}-${targetId}`] || 0;
            const sameAlt = sames[`${targetId}-${sourceId}`] || 0;

            edge.sameTotal = same + sameAlt;
            edge.sameTotalHalf = edge.sameTotal / 2;
            edge.sameUneven = edge.sameTotal % 2 !== 0;
            edge.sameMiddleLink = edge.sameUneven === true && Math.ceil(edge.sameTotalHalf) === edge.sameIndex;
            edge.sameLowerHalf = edge.sameIndex > edge.sameTotalHalf;
            edge.sameIndexCorrected = edge.sameLowerHalf ? (Math.ceil(edge.sameTotalHalf) - edge.sameIndex) : edge.sameIndex;

        });

        return data;
    }

    createNodes(enter) {
        const nodeSelection = enter.append(d => {
            const constructor = NetworkGraph.getNodeConstructor(d.type);
            const selection = constructor.create(d, this);
            return selection.node();
        });

        nodeSelection.attr('id', d => d.id)
            .classed('node-group', true);

        if (this.useDrag && this.d3Drag) nodeSelection.call(this.d3Drag);

        return nodeSelection;
    }

    updateNodes(nodeSelection) {
        const graph = this;
        // 这里对每个节点单独执行更新操作
        // TODO: 先筛选出每类节点，然后批量更新每类节点，会不会更快？
        nodeSelection.each(function(d, i, nodes) {
            const constructor = NetworkGraph.getNodeConstructor(d.type);
            const selection = d3.select(this);
            constructor.update(selection, d, graph);
        });
    }

    createEdges(enter) {
        const edgeSelection = enter.append(d => {
            const constructor = NetworkGraph.getEdgeConstructor(d.type);
            const selection = constructor.create(d, this);
            return selection.node();
        });
        return edgeSelection;
    }

    updateEdges(edgeSelection) {
        const graph = this;
        edgeSelection.each(function(d) {
            const constructor = NetworkGraph.getEdgeConstructor(d.type);
            const selection = d3.select(this);
            constructor.update(selection, d, graph);
        });
    }

}

NetworkGraph.nodeConstrutors = {
    default: {
        options: {
            size: 15,
            labelSize: 14
        },
        // TODO：create是否一定需要返回一个node，是否可以直接在svg添加标签？
        create(datum, graph) {
            // 必须手动绑定数据
            const groupSelection = d3.create('svg:g').datum(datum);
            const size = this.options.size;
            const labelSize = this.options.labelSize;

            groupSelection.append('circle')
                .classed('node', true)
                .attr('r', size);

            groupSelection.append('text')
                .text(datum.label)
                .attr('x', 0)
                .attr('y', size + labelSize)
                .style('font-size', labelSize)
                .attr('text-anchor', 'middle')
                .classed('node-label', true);

            return groupSelection;
        },
        update(selection, datum, graph) {
            selection.attr('transform', d => `translate(${d.x}, ${d.y})`);
        }
    }
};

NetworkGraph.edgeConstructors = {
    default: {
        getNodeSize(d) {
            if (d.size) return d.size;
            const constructor = NetworkGraph.getNodeConstructor(d.type);
            return constructor.options.size;
        },
        // TODO：create是否一定需要返回一个node，是否可以直接在svg添加标签？
        create(datum, graph) {
            const defsSelection = graph.defsSelection;
            const markerSelection = defsSelection.selectAll('marker.arrow');

            if (markerSelection.empty()) {
                markerSelection.data(['default', 'selected'])
                    .join('marker')
                    .attr('id', d => `arrow-${d}`)
                    .attr('class', d => `arrow ${d}`)
                    .attr('viewbox', '0 -5 10 10')
                    .attr('refX', 0)
                    .attr('refY', 0)
                    .attr('markerWidth', 6)
                    .attr('markerHeight', 6)
                    .attr('overflow', 'visible')
                    .attr('orient', 'auto-start-reverse')
                    .append('svg:path')
                    .attr('d', 'M 0,-5 L 10 ,0 L 0,5');
            }

            const pathSelection = d3.create('svg:path').datum(datum);

            pathSelection.classed('edge', true)
                .attr('id', `edge-${datum.id}`)
                .attr('fill', 'none');

            // 直接在graph中添加边的label，因为create只能返回返回一个node
            const textSelection = graph.gSelection.append('svg:text').datum(datum);

            textSelection.classed('edge-label', true)
                .classed('hidden', datum.visible === false)
                .append('textPath')
                .text(`关系：${datum.label}`)
                .attr('xlink:href', `#edge-${datum.id}`)
                .attr('text-anchor', 'middle')
                .attr('startOffset', '50%');

            return pathSelection;
        },
        update(selection, datum, graph) {
            // 拖动点时保证箭头的指向正确
            if (datum.target.x < datum.source.x) {  // 反
                selection.attr('marker-start', `url(${new URL(`#arrow-${datum.selected ? 'selected' : 'default'}`, location)}`);
                selection.attr('marker-end', 'none');
            } else {    // 正
                selection.attr('marker-start', 'none');
                selection.attr('marker-end', `url(${new URL(`#arrow-${datum.selected ? 'selected' : 'default'}`, location)}`);
            }
            selection.attr('d', this.linkArc.bind(this));
        },
        linkArc(d) {
            // const r = 34;
            const arrowSize = 10;
            const delta = 15;
            const angle = 15;

            let sourceR = this.getNodeSize(d.source),
                targetR = this.getNodeSize(d.target),
                startX,
                startY,
                endX,
                endY,
                sourceX,
                sourceY,
                targetX,
                targetY;

            // 默认起点在左侧，终点在右侧。当拖动节点导致起点和终点位置反转时，计算path时需要反转起点和终点保证文字的朝向正常
            if (d.target.x < d.source.x) { // 反
                startX = d.target.x;
                startY = d.target.y;
                endX = d.source.x;
                endY = d.source.y;
                sourceR += arrowSize;
                // targetR = r;
            } else {    // 正
                startX = d.source.x;
                startY = d.source.y;
                endX = d.target.x;
                endY = d.target.y;
                // sourceR = r;
                targetR += arrowSize;
            }

            const intersectSourcePoints = math.getIntersectPointBetweenCircleAndLine(startX, startY, endX, endY, startX, startY, sourceR);
            if (math.onSegement([startX, startY], [endX, endY], intersectSourcePoints[0])) {
                sourceX = intersectSourcePoints[0][0];
                sourceY = intersectSourcePoints[0][1];
            } else {
                sourceX = intersectSourcePoints[1][0];
                sourceY = intersectSourcePoints[1][1];
            }

            const intersectTargetPoints = math.getIntersectPointBetweenCircleAndLine(startX, startY, endX, endY, endX, endY, targetR);
            if (math.onSegement([startX, startY], [endX, endY], intersectTargetPoints[0])) {
                targetX = intersectTargetPoints[0][0];
                targetY = intersectTargetPoints[0][1];
            } else {
                targetX = intersectTargetPoints[1][0];
                targetY = intersectTargetPoints[1][1];
            }

            if (d.sameTotal === 1 || d.sameMiddleLink) {
                return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
            } else {
                [sourceX, sourceY] = math.rotatePoint(sourceX, sourceY, startX, startY, -angle * d.sameIndexCorrected);
                [targetX, targetY] = math.rotatePoint(targetX, targetY, endX, endY, angle * d.sameIndexCorrected);

                const middlePoints = math.getMiddlePointOfBezierCurve(sourceX, sourceY, targetX, targetY, delta * d.sameIndexCorrected);
                let middlePoint;
                if (math.checkSameSide(startX, startY, endX, endY, sourceX, sourceY, ...middlePoints[0]) > 0) {
                    middlePoint = middlePoints[0];
                } else {
                    middlePoint = middlePoints[1];
                }

                const controlPoint = math.getControlPointOfBezierCurve([sourceX, sourceY], middlePoint, [targetX, targetY]);

                return `M ${sourceX} ${sourceY} Q ${controlPoint[0]} ${controlPoint[1]} ${targetX} ${targetY}`;
            }
        }
    }
};