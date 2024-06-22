import React from 'react'
import ReactDOM from 'react-dom/client'
import { Details, LineageLabel, LineageView, Minimap } from '.'


const simpleGraph = [
  {
    name: "root",
    dependencies: [
      "dep1",
      "dep2",
    ],
  }, {
    name: "dep1",
    dependencies: [
      "dep3",
    ],
  },
  {
    name: "dep2",
    dependencies: [
      "dep3",
    ],
  }, {
    name: "dep3",
    dependencies: [
      "dep4",
    ],
  }, {
    name: "dep4",
    dependencies: [
      "dep5",
    ],
  }, {
    name: "dep5",
    dependencies: [],
  },
]


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ width: "100vw", height: "98vh" }}>
      <LineageView nodes={simpleGraph}>
        <LineageLabel />
        <Details />
        <Minimap />
      </LineageView>
    </div>

  </React.StrictMode>,
)
