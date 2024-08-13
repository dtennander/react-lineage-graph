import * as d3 from "d3";
import React, { useRef, useEffect, useMemo, memo, ReactNode } from "react";
import styled from "styled-components";
import { useSetNode } from "./LineageContext";
import { renderToString } from "react-dom/server";

export type Node = {
  name: string;
  dependencies: string[];
};

type D3Node = d3.SimulationNodeDatum &
  Node & {
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

/**
 * Renders a lineage graph using d3
 * @param nodes - The nodes of the graph
 */
export const LineageRender = memo(
  ({ nodes, children }: { nodes: Node[]; children(node: Node): ReactNode }) => {
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
      const node = drawNodes(zoomableGroup, d3Nodes, null, (node) =>
        children ? renderToString(children(node)) : node.name,
      );
      const simulation = createForceSimulation(svgRef.current, d3Nodes, links);

      node.call(handleDrag(simulation));
      node.on("click", function (e, d) {
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
    }, [svgRef, d3Nodes, links, setPickedNode, nodes]);
    return <StyledSvg ref={svgRef} width="100%" height="100%" />;
  },
);

const createLinks = (nodes: D3Node[]): d3.SimulationLinkDatum<D3Node>[] => {
  return nodes
    .map((d) => d.dependencies.map((dep) => ({ target: d, source: dep })))
    .flat();
};

const addDepth = (nodes: Node[]): D3Node[] => {
  const nodeMap = new Map<string, D3Node>(
    nodes.map((node) => [node.name, { ...node, depth: 0 }]),
  );
  const stack: [D3Node, string[]][] = Array.from(nodeMap.values()).map((v) => [
    v,
    [],
  ]);
  while (stack.length > 0) {
    const [d3Node, visited] = stack.pop()!;
    d3Node.dependencies.forEach((dep) => {
      const depNode = nodeMap.get(dep);
      if (!depNode) throw new Error(`Node ${dep} not found`);
      depNode.depth = Math.max(depNode.depth, d3Node.depth + 1);
      stack.push([depNode, visited.concat(d3Node.name)]);
    });
  }
  return Array.from(nodeMap.values());
};

/********  D3 Functions ********/

// Draws nodes on the canvas
const drawNodes = <E extends Element>(
  svg: d3.Selection<E, unknown, null, undefined>,
  nodes: D3Node[],
  pickedNode: Node | null,
  nodeGenerator: (node: Node) => string,
) => {
  const nodeBoxes = svg
    .append("g")
    .selectAll("g")
    .data<D3Node>(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .classed("selected", (d) => d.name === pickedNode?.name);
  nodeBoxes
    .append("rect")
    .attr("width", 250)
    .attr("height", 50)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("x", -125)
    .attr("y", -25);
  nodeBoxes
    .append("foreignObject")
    .attr("width", 250)
    .attr("height", 50)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("x", -125)
    .attr("y", -25)
    .append("xhtml:div")
    .style("width", "100%")
    .style("height", "100%")
    .html(nodeGenerator);
  return nodeBoxes;
};

const drawLinks = <E extends Element>(
  svg: d3.Selection<E, unknown, null, undefined>,
  links: d3.SimulationLinkDatum<D3Node>[],
) => {
  return svg
    .append("g")
    .selectAll("line")
    .data<d3.SimulationLinkDatum<D3Node>>(links)
    .enter()
    .append("path")
    .attr("class", "link");
};

// Creates a simulation with forces

const createForceSimulation = (
  canvas: SVGSVGElement,
  nodes: D3Node[],
  links: d3.SimulationLinkDatum<D3Node>[],
) => {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  return d3
    .forceSimulation<D3Node>(nodes)
    .force(
      "link",
      d3
        .forceLink<D3Node, d3.SimulationLinkDatum<D3Node>>(links)
        .id((d) => d.name)
        .distance(200)
        .strength(0.1),
    )
    .force("dontCollide", d3.forceCollide<D3Node>(100).strength(0.1))
    .force("align", d3.forceY(height / 2).strength(0.1))
    .force(
      "onDepth",
      d3.forceX<D3Node>((d) => width * 0.75 - 300 * d.depth).strength(1),
    )
    .force("center", d3.forceCenter(width / 2, height / 2).strength(1));
};

const updatePositions =
  <
    E extends Element,
    D extends d3.SimulationNodeDatum,
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
      const midX = sourceX + (targetX - sourceX) / 2;
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
