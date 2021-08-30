import mxgraph from '@mxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Connections/Anchors',
  argTypes: {
    ...globalTypes,
    rubberBand: {
      type: 'boolean',
      defaultValue: true,
    },
  },
};

const Template = ({ label, ...args }) => {
  const {
    Graph,
    InternalEvent,
    Rubberband,
    ConnectionHandler,
    ConnectionConstraint,
    Geometry,
    Polyline,
    Point,
    CellState,
  } = mxgraph;

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  class MyCustomConnectionHandler extends ConnectionHandler {
    // Enables connect preview for the default edge style
    createEdgeState(me) {
      const edge = graph.createEdge(null, null, null, null, null);
      return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge));
    }
  }

  class MyCustomGraph extends Graph {
    getAllConnectionConstraints(terminal, source) {
      // Overridden to define per-shape connection points
      if (terminal != null && terminal.shape != null) {
        if (terminal.shape.stencil != null) {
          if (terminal.shape.stencil.constraints != null) {
            return terminal.shape.stencil.constraints;
          }
        } else if (terminal.shape.constraints != null) {
          return terminal.shape.constraints;
        }
      }
      return null;
    }

    createConnectionHandler() {
      return new MyCustomConnectionHandler(this);
    }
  }

  class MyCustomGeometryClass extends Geometry {
    // Defines the default constraints for the vertices
    constraints = [
      new ConnectionConstraint(new Point(0.25, 0), true),
      new ConnectionConstraint(new Point(0.5, 0), true),
      new ConnectionConstraint(new Point(0.75, 0), true),
      new ConnectionConstraint(new Point(0, 0.25), true),
      new ConnectionConstraint(new Point(0, 0.5), true),
      new ConnectionConstraint(new Point(0, 0.75), true),
      new ConnectionConstraint(new Point(1, 0.25), true),
      new ConnectionConstraint(new Point(1, 0.5), true),
      new ConnectionConstraint(new Point(1, 0.75), true),
      new ConnectionConstraint(new Point(0.25, 1), true),
      new ConnectionConstraint(new Point(0.5, 1), true),
      new ConnectionConstraint(new Point(0.75, 1), true),
    ];
  }

  // Edges have no connection points
  Polyline.prototype.constraints = null;

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);
  graph.setConnectable(true);

  // Specifies the default edge style
  graph.getStylesheet().getDefaultEdgeStyle().edgeStyle = 'orthogonalEdgeStyle';

  // Enables rubberband selection
  if (args.rubberBand) new Rubberband(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Hello,',
      position: [20, 20],
      size: [80, 30],
      geometryClass: MyCustomGeometryClass,
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'World!',
      position: [200, 150],
      size: [80, 30],
      geometryClass: MyCustomGeometryClass,
    });
    const e1 = graph.insertEdge({
      parent,
      value: '',
      position: v1,
      size: v2,
    });
  });

  return container;
};

export const Default = Template.bind({});
