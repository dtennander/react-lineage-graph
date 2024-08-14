# React Lineage Graph

Small react library to create a lineage graph using D3 and React.

## Usage

The Library is composed of a main component `LineageView` that takes a `data` that
should be rendered as a property.

The library then contains a few components that can be used to customize
the rendering of the graph.

- `LineageDetails` - Component that takes a function as a child
  that should return the details element.
- `Title` - Tells the view to render a title.

### Example

```jsx
import React from 'react';

const ExampleGraph => () => {
  const data = {
    nodes: [
      { id: 'A', label: 'Node A' },
      { id: 'B', label: 'Node B' },
      { id: 'C', label: 'Node C' },
    ],
    links: [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'C' },
    ],
  };

  return (
    <LineageView
      data={data}
      NodeComponent={({node}) => <circle r={5} fill="blue"/>}
    >
      {/*
        You can add any children here that you want to be displayed on the graph.
        For example, you could add a tooltip or a legend.
      */}
      <LineageDetails/>
    </LineageView>
  );
};
```
