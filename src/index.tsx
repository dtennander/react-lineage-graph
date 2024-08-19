import styled from "styled-components";
import { LineageRender, Node } from "./LineageRender";
import { LineageProvider, useNode } from "./LineageContext";
import React from "react";

const StyledView = styled.div`
  display: relative;
  overflow: auto;
  width: 100%;
  height: 100%;

  font-family: sans-serif;
`;

const Background = styled.div`
  background-image: radial-gradient(circle, gray 1px, transparent 1px);
  background-size: 10px 10px;
`;

type LineageViewProps<T> = {
  /**
   * The nodes of the lineage graph
   */
  nodes: Node<T>[];
  /**
   * Any children to render on top of the lineage graph
   * Expected Children are:
   * - Details
   */
  children?: React.ReactNode;
  /**
   * A custom component to render each node
   */
  nodeComponent?: React.ComponentType<{ node: Node<T> }>;
};

/**
 * LineageView is the main compononent of the library.
 * It renders the provided nodes as a lineage graph, and allows for custom node rendering by passing a NodeComponent.
 *
 * The children you can add to this will be rendered ontop of the lineage graph. Expected Children are:
 * - Details
 */
export const LineageView = <T,>({
  children,
  nodes,
  nodeComponent,
}: LineageViewProps<T>) => {
  return (
    <StyledView>
      <LineageProvider>
        <Background style={{ width: "100%", height: "100%" }}>
          <LineageRender nodes={nodes} NodeComponent={nodeComponent} />
          {children}
        </Background>
      </LineageProvider>
    </StyledView>
  );
};

const GlassPlane = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 0.5em 1em;
`;

/**
 * A component that displays the details of the currently selected node.
 * It will be rendered on top of the lineage graph.
 */
export const Details = () => {
  const pickedNode = useNode();
  if (!pickedNode) return null;
  return (
    <div style={{ position: "absolute", bottom: "1em", left: "1em" }}>
      <GlassPlane>
        <h3>{pickedNode?.name}</h3>
        <ul>
          {Object.entries(pickedNode || {}).map(([key, value]) => (
            <li key={key}>
              <strong>{key}</strong>: {value.toString()}
            </li>
          ))}
        </ul>
      </GlassPlane>
    </div>
  );
};
