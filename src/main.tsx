import React from "react";
import ReactDOM from "react-dom/client";
import { Details, LineageLabel, LineageView } from ".";

const simpleGraph = [
  {
    name: "root",
    dependencies: ["dep1", "dep2"],
  },
  {
    name: "dep1",
    dependencies: ["dep3"],
  },
  {
    name: "dep2",
    dependencies: ["dep3"],
  },
  {
    name: "dep3",
    dependencies: ["dep4"],
  },
  {
    name: "dep4",
    dependencies: ["dep5", "dep6", "dep7"],
  },
  {
    name: "dep5",
    dependencies: [],
  },
  {
    name: "dep6",
    dependencies: ["dep8"],
  },
  {
    name: "dep7",
    dependencies: [],
  },
  {
    name: "dep8",
    dependencies: [],
  },
];

const NiceNode = ({ node }: { node: { name: string } }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "lightgray",
        borderRadius: "5px",
        height: "100%",
        width: "100%",
        justifyContent: "space-around",
      }}
      onClick={() => alert(node.name)}
    >
      <h4>{node.name}</h4>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div style={{ width: "100vw", height: "98vh" }}>
      <LineageView nodes={simpleGraph} nodeComponent={NiceNode}>
        <LineageLabel />
        <Details />
      </LineageView>
    </div>
  </React.StrictMode>,
);
