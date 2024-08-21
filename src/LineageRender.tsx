import * as d3 from "d3";
import { useRef, useEffect, useMemo, memo } from "react";
import styled from "styled-components";
import { useSetNode } from "./LineageContext";
import { createRoot, Container } from "react-dom/client";

/**
 * A Node in the lineage graph. It has a name, dependencies, and any other properties you want to add to it.
 */
export type Node<T> = T & {
  /**
   * The name of the node, used to reference it in the dependencies Array
   * @example "node1"
   */
  name: string;
  /**
   * The names of the nodes this node depends on
   * @example ["node2", "node3"]
   */
  dependencies: string[];
};

type D3Node<T> = d3.SimulationNodeDatum &
  Node<T> & {
    depth: number;
  };

const StyledSvg = styled.svg`
  .node rect {
    fill: lightblue;
    stroke: steelblue;
    stroke-width: 2px;
  }

  .node.selected rect {
    fill: lightgreen;
  }

  .link {
    fill: none;
    stroke: #aaa;
    stroke-width: 2px;
  }
`;

type LineageRenderProps<T> = {
  nodes: Node<T>[];
  NodeComponent?: React.ComponentType<{ node: Node<T> }>;
};

// Used just to help the TS compiler to understand generic types better.
// https://stackoverflow.com/questions/57477395/typescript-generic-class-equivalent-for-react-memo
const genericMemo: <T>(component: T) => T = memo;

/**
 * Renders a lineage graph using d3
 * @param nodes - The nodes of the graph
 */
export const LineageRender = genericMemo(
  <T,>({ nodes, NodeComponent }: LineageRenderProps<T>) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const d3Nodes = useMemo(() => addDepth(nodes), [nodes]);
    const links = useMemo(() => createLinks(d3Nodes), [d3Nodes]);
    const setPickedNode = useSetNode();
    useEffect(() => {
      if (!svgRef.current) return;
      const svg = d3.select(svgRef.current);
      const zoomableGroup = svg.append("g");
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 5])
        .on("zoom", (event) => {
          zoomableGroup.attr("transform", event.transform);
        });

      svg.call(zoom);
      const link = drawLinks(zoomableGroup, links);
      const node = drawNodes(
        zoomableGroup,
        d3Nodes,
        null,
        NodeComponent &&
          ((node, ref) => {
            const root = createRoot(ref as Container);
            root.render(<NodeComponent node={node} />);
          }),
      );
      const simulation = createForceSimulation(svgRef.current, d3Nodes, links);

      node.call(handleDrag(simulation));
      node.on("click", function (_, d) {
        setPickedNode(nodes.find((n) => n.name === d.name) ?? null);
        d3.selectAll("*").classed("selected", false);
        d3.select(this).classed("selected", true);
      });
      simulation.on("tick", updatePositions(node, link));
      let firstEnd = true;
      simulation.on("end", () => {
        if (!firstEnd) return;
        firstEnd = false;
        const width = svgRef.current!.clientWidth;
        const height = svgRef.current!.clientHeight;
        const bounds = svg.node()?.getBBox();
        const fullWidth = bounds?.width ?? 0;
        const fullHeight = bounds?.height ?? 0;
        const midX = bounds!.x + fullWidth / 2;
        const midY = bounds!.y + fullHeight / 2;

        const scale = 0.9 / Math.max(fullWidth / width, fullHeight / height);
        const translate = [width / 2 - scale * midX, height / 2 - scale * midY];
        svg
          .transition()
          .duration(750)
          .call(
            zoom.transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale),
          );
      });
      // return cleanup function
      return () => {
        simulation.stop();
        svg.selectAll("*").remove();
      };
    }, [svgRef, d3Nodes, links, setPickedNode, nodes, NodeComponent]);
    return <StyledSvg ref={svgRef} width="100%" height="100%" />;
  },
);

const createLinks = <T,>(
  nodes: Map<string, D3Node<T>>,
): d3.SimulationLinkDatum<D3Node<T>>[] => {
  return Array.from(nodes.values())
    .map((d) =>
      d.dependencies.map((dep) => ({
        target: d,
        source: nodes.get(dep) || dep,
      })),
    )
    .flat();
};

const addDepth = <T,>(nodes: Node<T>[]): Map<string, D3Node<T>> => {
  const nodeMap = new Map(
    nodes.map((node) => [
      node.name,
      {
        ...node,
        depth: -1,
        shortestPath: [],
        ins: nodes.filter((n) => n.dependencies.includes(node.name)).length,
      },
    ]),
  );
  const stack: [D3Node<T> & { shortestPath: string[] }, string[]][] =
    Array.from(nodeMap.values())
      .filter((n) => n.ins === 0)
      .map((v) => [v, []]);
  while (stack.length > 0) {
    const [d3Node, visited] = stack.pop()!;
    if (d3Node.depth === -1 || visited.length < d3Node.depth) {
      d3Node.depth = visited.length;
      d3Node.shortestPath = visited;
    }
    d3Node.dependencies.forEach((dep) => {
      const depNode = nodeMap.get(dep);
      if (!depNode) throw new Error(`Node ${dep} not found`);
      if (!visited.includes(depNode.name)) {
        stack.push([depNode, visited.concat(d3Node.name)]);
      }
    });
  }
  return nodeMap;
};

/********  D3 Functions ********/

// Draws nodes on the canvas
const drawNodes = <E extends Element, T>(
  svg: d3.Selection<E, unknown, null, undefined>,
  nodes: Map<string, D3Node<T>>,
  pickedNode: Node<T> | null,
  nodeRenderer?: (node: Node<T>, ref: d3.BaseType) => void,
) => {
  const nodeBoxes = svg
    .append("g")
    .selectAll("g")
    .data<D3Node<T>>(nodes.values())
    .enter()
    .append("g")
    .attr("class", "node")
    .classed("selected", (d) => d.name === pickedNode?.name);
  if (nodeRenderer) {
    const divs = nodeBoxes
      .append("foreignObject")
      .attr("width", 250)
      .attr("height", 50)
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("x", -125)
      .attr("y", -25)
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%");
    divs.each((node, i, refs) => nodeRenderer(node, refs[i]));
  } else {
    nodeBoxes
      .append("rect")
      .attr("width", 250)
      .attr("height", 50)
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("x", -125)
      .attr("y", -25);
  }
  return nodeBoxes;
};

const drawLinks = <E extends Element, T>(
  svg: d3.Selection<E, unknown, null, undefined>,
  links: d3.SimulationLinkDatum<D3Node<T>>[],
) => {
  return svg
    .append("g")
    .selectAll("line")
    .data<d3.SimulationLinkDatum<D3Node<T>>>(links)
    .enter()
    .append("path")
    .attr("class", "link");
};

// Creates a simulation with forces

const createForceSimulation = <T,>(
  canvas: SVGSVGElement,
  nodes: Map<string, D3Node<T>>,
  links: d3.SimulationLinkDatum<D3Node<T>>[],
) => {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  return d3
    .forceSimulation<D3Node<T>>(Array.from(nodes.values()))
    .force(
      "link",
      d3
        .forceLink<D3Node<T>, d3.SimulationLinkDatum<D3Node<T>>>(links)
        .id((d) => d.name)
        .distance(200)
        .strength(0.1),
    )
    .force("dontCollide", d3.forceCollide<D3Node<T>>(100).strength(0.1))
    .force("align", d3.forceY(height / 2).strength(0.1))
    .force(
      "onDepth",
      d3.forceX<D3Node<T>>((d) => width * 0.75 - 300 * d.depth).strength(1),
    )
    .force("center", d3.forceCenter(width / 2, height / 2).strength(1));
};

const updatePositions =
  <
    E extends Element,
    T,
    D extends D3Node<T>,
    P extends Element,
    LE extends Element,
  >(
    nodes: d3.Selection<E, D, P, unknown>,
    links: d3.Selection<LE, d3.SimulationLinkDatum<D>, P, unknown>,
  ) =>
  () => {
    links.attr("d", (d) => {
      const sourceNode = d.source as D;
      const targetNode = d.target as D;
      const sourceX = sourceNode.x! + 125;
      const sourceY = sourceNode.y!;
      const targetX = targetNode.x! - 125;
      const targetY = targetNode.y!;
      const isBackwards = sourceX - 50 > targetX;
      const midX = sourceX + (targetX - sourceX) / 2;
      if (isBackwards) {
        const directionY = targetY - sourceY > 0 ? -1 : 1;
        return `M${sourceX},${sourceY} C${sourceX + 150},${sourceY - directionY * 150} ${targetX - 150},${targetY + directionY * 150} ${targetX},${targetY}`;
      }
      return `M${sourceX},${sourceY} C${midX},${sourceY} ${midX},${targetY} ${targetX},${targetY}`;
    });
    nodes.attr("transform", (d) => `translate(${d.x},${d.y})`);
  };

// Dragging functions
const handleDrag = <E extends Element, D extends d3.SimulationNodeDatum>(
  simulation: d3.Simulation<D, undefined>,
) => {
  return d3
    .drag<E, D>()
    .on("start", (e, d) => {
      if (!e.active) simulation.alphaTarget(0.1).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (e, d) => {
      d.fx = e.x;
      d.fy = e.y;
    })
    .on("end", (e, d) => {
      if (!e.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
};
