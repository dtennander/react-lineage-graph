import styled from "styled-components";
import { LineageRender, Node } from "./LineageRender";
import { LineageProvider, useNode } from "./LineageContext";
import React from "react";

export const StyledView = styled.div`
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

type LineageViewProps = {
  nodes: Node[];
  children: React.ReactNode;
  nodeComponent?: React.ComponentType<{ node: Node }>;
};

export const LineageView = ({
  children,
  nodes,
  nodeComponent,
}: LineageViewProps) => {
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

export const LineageLabel = () => {
  return (
    <div style={{ position: "absolute", top: "1em", left: "1em" }}>
      <GlassPlane>
        <h1>Lineage Label</h1>
      </GlassPlane>
    </div>
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
              <strong>{key}</strong>: {value}
            </li>
          ))}
        </ul>
      </GlassPlane>
    </div>
  );
};

export const NodeRender: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div>{children}</div>;
};
