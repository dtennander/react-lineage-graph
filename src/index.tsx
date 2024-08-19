import styled from "styled-components";
import { LineageRender, Node } from "./LineageRender";
import {
  LineageProvider,
  useFullScreen,
  useNode,
  useSetFullScreen,
} from "./LineageContext";
import React from "react";

const StyledView = styled.div<{ $fullscreen?: boolean }>`
  position: ${(props) => (props.$fullscreen ? "absolute" : "relative")};
  ${({ $fullscreen }) => ($fullscreen ? "top: 0; left: 0;" : "")}
  overflow: auto;
  width: ${(props) => (props.$fullscreen ? "100vw" : "100%")};
  height: ${(props) => (props.$fullscreen ? "100vh" : "100%")};

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

  /**
   * Whether to start in fullscreen mode
   */
  fullscreen?: boolean;
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
  fullscreen,
}: LineageViewProps<T>) => {
  return (
    <LineageProvider fullscreenDefault={fullscreen || false}>
      <LineageViewInternal nodes={nodes} nodeComponent={nodeComponent}>
        {children}
      </LineageViewInternal>
    </LineageProvider>
  );
};

const LineageViewInternal = <T,>({
  children,
  nodes,
  nodeComponent,
}: LineageViewProps<T>) => {
  const fullscreen = useFullScreen();
  return (
    <StyledView $fullscreen={fullscreen}>
      <Background style={{ width: "100%", height: "100%" }}>
        <LineageRender nodes={nodes} NodeComponent={nodeComponent} />
        {children}
      </Background>
    </StyledView>
  );
};

const GlassPlane = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 0.5em 0.5em;
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

const GlassPlaneButton = styled.button`
  position: absolute;
  bottom: 1em;
  right: 1em;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 0.5em 0.5em;
  display: flex;
  justify-content: center;
  align-items: center;

  &:active {
    transform: scale(0.95);
  }
`;
/**
 * Adds a button to the screen that toggles fullscreen mode.
 */
export const FullScreen = () => {
  const setFullScreen = useSetFullScreen();
  return (
    <GlassPlaneButton onClick={() => setFullScreen((fs) => !fs)}>
      <svg
        width="2.5em"
        height="2.5em"
        viewBox="0 0 32 32"
        id="i-fullscreen"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentcolor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M4 12 L4 4 12 4 M20 4 L28 4 28 12 M4 20 L4 28 12 28 M28 20 L28 28 20 28" />
      </svg>
    </GlassPlaneButton>
  );
};
