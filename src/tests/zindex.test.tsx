import React from "react";
import ReactDOM from "react-dom";
import { render } from "./test-utils";
import App from "../components/App";
import { reseed } from "../random";
import { newElement } from "../element";
import {
  actionSendBackward,
  actionBringForward,
  actionBringToFront,
  actionSendToBack,
} from "../actions";
import { ExcalidrawElement } from "../element/types";

// Unmount ReactDOM from root
ReactDOM.unmountComponentAtNode(document.getElementById("root")!);

beforeEach(() => {
  localStorage.clear();
  reseed(7);
});

const { h } = window;

const populateElements = (
  elements: {
    id: string;
    isDeleted?: boolean;
    isSelected?: boolean;
    groupIds?: string[];
  }[],
) => {
  const selectedElementIds: any = {};

  h.elements = elements.map(
    ({ id, isDeleted = false, isSelected = false, groupIds = [] }) => {
      const element: Mutable<ExcalidrawElement> = newElement({
        type: "rectangle",
        x: 100,
        y: 100,
        strokeColor: h.state.currentItemStrokeColor,
        backgroundColor: h.state.currentItemBackgroundColor,
        fillStyle: h.state.currentItemFillStyle,
        strokeWidth: h.state.currentItemStrokeWidth,
        strokeStyle: h.state.currentItemStrokeStyle,
        strokeSharpness: h.state.currentItemStrokeSharpness,
        roughness: h.state.currentItemRoughness,
        opacity: h.state.currentItemOpacity,
      });
      element.id = id;
      element.isDeleted = isDeleted;
      element.groupIds = groupIds;
      if (isSelected) {
        selectedElementIds[element.id] = true;
      }
      return element;
    },
  );

  return selectedElementIds;
};

type Actions =
  | typeof actionBringForward
  | typeof actionSendBackward
  | typeof actionBringToFront
  | typeof actionSendToBack;

const assertZindex = ({
  elements,
  appState,
  operations,
}: {
  elements: {
    id: string;
    isDeleted?: true;
    isSelected?: true;
    groupIds?: string[];
  }[];
  appState?: {
    editingGroupId: string | null;
  };
  operations: [Actions, string[]][];
}) => {
  const selectedElementIds = populateElements(elements);

  h.setState({
    ...h.state,
    selectedElementIds,
    editingGroupId: appState?.editingGroupId || null,
  });

  operations.forEach(([action, expected]) => {
    h.app.actionManager.executeAction(action);
    expect(h.elements.map((element) => element.id)).toEqual(expected);
    expect(h.state.selectedElementIds).toEqual(selectedElementIds);
  });
};

describe("z-index manipulation", () => {
  it("send back", () => {
    render(<App />);

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", isDeleted: true },
        { id: "C", isDeleted: true },
        { id: "D", isSelected: true },
      ],
      operations: [
        [actionSendBackward, ["D", "A", "B", "C"]],
        // noop
        [actionSendBackward, ["D", "A", "B", "C"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A", isSelected: true },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true },
      ],
      operations: [
        // noop
        [actionSendBackward, ["A", "B", "C"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A", isDeleted: true },
        { id: "B" },
        { id: "C", isDeleted: true },
        { id: "D", isSelected: true },
      ],
      operations: [[actionSendBackward, ["A", "D", "B", "C"]]],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", isDeleted: true },
        { id: "C", isDeleted: true },
        { id: "D", isSelected: true },
        { id: "E", isSelected: true },
        { id: "F" },
      ],
      operations: [
        [actionSendBackward, ["D", "E", "A", "B", "C", "F"]],
        // noop
        [actionSendBackward, ["D", "E", "A", "B", "C", "F"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B" },
        { id: "C", isDeleted: true },
        { id: "D", isDeleted: true },
        { id: "E", isSelected: true },
        { id: "F" },
        { id: "G", isSelected: true },
      ],
      operations: [
        [actionSendBackward, ["A", "E", "B", "C", "D", "G", "F"]],
        [actionSendBackward, ["E", "A", "G", "B", "C", "D", "F"]],
        [actionSendBackward, ["E", "G", "A", "B", "C", "D", "F"]],
        // noop
        [actionSendBackward, ["E", "G", "A", "B", "C", "D", "F"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B" },
        { id: "C", isDeleted: true },
        { id: "D", isSelected: true },
        { id: "E", isDeleted: true },
        { id: "F", isSelected: true },
        { id: "G" },
      ],
      operations: [
        [actionSendBackward, ["A", "D", "E", "F", "B", "C", "G"]],
        [actionSendBackward, ["D", "E", "F", "A", "B", "C", "G"]],
        // noop
        [actionSendBackward, ["D", "E", "F", "A", "B", "C", "G"]],
      ],
    });

    // grouped elements should be atomic
    // -------------------------------------------------------------------------

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g1"] },
        { id: "D", isDeleted: true },
        { id: "E", isDeleted: true },
        { id: "F", isSelected: true },
      ],
      operations: [
        [actionSendBackward, ["A", "F", "B", "C", "D", "E"]],
        [actionSendBackward, ["F", "A", "B", "C", "D", "E"]],
        // noop
        [actionSendBackward, ["F", "A", "B", "C", "D", "E"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", groupIds: ["g2", "g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g1"] },
        { id: "E", isDeleted: true },
        { id: "F", isSelected: true },
      ],
      operations: [
        [actionSendBackward, ["A", "F", "B", "C", "D", "E"]],
        [actionSendBackward, ["F", "A", "B", "C", "D", "E"]],
        // noop
        [actionSendBackward, ["F", "A", "B", "C", "D", "E"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g2", "g1"] },
        { id: "E", isDeleted: true },
        { id: "F", isSelected: true },
      ],
      operations: [
        [actionSendBackward, ["A", "F", "B", "C", "D", "E"]],
        [actionSendBackward, ["F", "A", "B", "C", "D", "E"]],
        // noop
        [actionSendBackward, ["F", "A", "B", "C", "D", "E"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B1", groupIds: ["g1"] },
        { id: "C1", groupIds: ["g1"] },
        { id: "D2", groupIds: ["g2"], isSelected: true },
        { id: "E2", groupIds: ["g2"], isSelected: true },
      ],
      appState: {
        editingGroupId: null,
      },
      operations: [[actionSendBackward, ["A", "D2", "E2", "B1", "C1"]]],
    });

    // in-group siblings
    // -------------------------------------------------------------------------

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g2", "g1"], isSelected: true },
      ],
      appState: {
        editingGroupId: "g2",
      },
      operations: [
        [actionSendBackward, ["A", "B", "D", "C"]],
        // noop (prevented)
        [actionSendBackward, ["A", "B", "D", "C"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", groupIds: ["g2", "g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g1"], isSelected: true },
      ],
      appState: {
        editingGroupId: "g1",
      },
      operations: [
        [actionSendBackward, ["A", "D", "B", "C"]],
        // noop (prevented)
        [actionSendBackward, ["A", "D", "B", "C"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g2", "g1"], isSelected: true },
        { id: "D", groupIds: ["g2", "g1"], isDeleted: true },
        { id: "E", groupIds: ["g2", "g1"], isSelected: true },
      ],
      appState: {
        editingGroupId: "g1",
      },
      operations: [
        [actionSendBackward, ["A", "C", "D", "E", "B"]],
        // noop (prevented)
        [actionSendBackward, ["A", "C", "D", "E", "B"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g2", "g1"] },
        { id: "E", groupIds: ["g3", "g1"], isSelected: true },
        { id: "F", groupIds: ["g3", "g1"], isSelected: true },
      ],
      appState: {
        editingGroupId: "g1",
      },
      operations: [
        [actionSendBackward, ["A", "B", "E", "F", "C", "D"]],
        [actionSendBackward, ["A", "E", "F", "B", "C", "D"]],
        // noop (prevented)
        [actionSendBackward, ["A", "E", "F", "B", "C", "D"]],
      ],
    });
  });

  it("bring forward", () => {
    render(<App />);

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true },
        { id: "D", isDeleted: true },
        { id: "E" },
      ],
      operations: [
        [actionBringForward, ["A", "D", "E", "B", "C"]],
        // noop
        [actionBringForward, ["A", "D", "E", "B", "C"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A", isSelected: true },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true },
      ],
      operations: [
        // noop
        [actionBringForward, ["A", "B", "C"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A", isSelected: true },
        { id: "B", isDeleted: true },
        { id: "C", isDeleted: true },
        { id: "D" },
        { id: "E", isSelected: true },
        { id: "F", isDeleted: true },
        { id: "G" },
      ],
      operations: [
        [actionBringForward, ["B", "C", "D", "A", "F", "G", "E"]],
        [actionBringForward, ["B", "C", "D", "F", "G", "A", "E"]],
        // noop
        [actionBringForward, ["B", "C", "D", "F", "G", "A", "E"]],
      ],
    });

    // grouped elements should be atomic
    // -------------------------------------------------------------------------

    assertZindex({
      elements: [
        { id: "A", isSelected: true },
        { id: "B", isDeleted: true },
        { id: "C", isDeleted: true },
        { id: "D", groupIds: ["g1"] },
        { id: "E", groupIds: ["g1"] },
        { id: "F" },
      ],
      operations: [
        [actionBringForward, ["B", "C", "D", "E", "A", "F"]],
        [actionBringForward, ["B", "C", "D", "E", "F", "A"]],
        // noop
        [actionBringForward, ["B", "C", "D", "E", "F", "A"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", isSelected: true },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g2", "g1"] },
        { id: "E", groupIds: ["g1"] },
        { id: "F" },
      ],
      operations: [
        [actionBringForward, ["A", "C", "D", "E", "B", "F"]],
        [actionBringForward, ["A", "C", "D", "E", "F", "B"]],
        // noop
        [actionBringForward, ["A", "C", "D", "E", "F", "B"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", isSelected: true },
        { id: "C", groupIds: ["g1"] },
        { id: "D", groupIds: ["g2", "g1"] },
        { id: "E", groupIds: ["g2", "g1"] },
        { id: "F" },
      ],
      operations: [
        [actionBringForward, ["A", "C", "D", "E", "B", "F"]],
        [actionBringForward, ["A", "C", "D", "E", "F", "B"]],
        // noop
        [actionBringForward, ["A", "C", "D", "E", "F", "B"]],
      ],
    });

    // in-group siblings
    // -------------------------------------------------------------------------

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", groupIds: ["g2", "g1"], isSelected: true },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g1"] },
      ],
      appState: {
        editingGroupId: "g2",
      },
      operations: [
        [actionBringForward, ["A", "C", "B", "D"]],
        // noop (prevented)
        [actionBringForward, ["A", "C", "B", "D"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A", groupIds: ["g1"], isSelected: true },
        { id: "B", groupIds: ["g2", "g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D" },
      ],
      appState: {
        editingGroupId: "g1",
      },
      operations: [
        [actionBringForward, ["B", "C", "A", "D"]],
        // noop (prevented)
        [actionBringForward, ["B", "C", "A", "D"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A", groupIds: ["g2", "g1"], isSelected: true },
        { id: "B", groupIds: ["g2", "g1"], isSelected: true },
        { id: "C", groupIds: ["g1"] },
        { id: "D" },
      ],
      appState: {
        editingGroupId: "g1",
      },
      operations: [
        [actionBringForward, ["C", "A", "B", "D"]],
        // noop (prevented)
        [actionBringForward, ["C", "A", "B", "D"]],
      ],
    });
  });

  it.only("bring to front", () => {
    render(<App />);

    // in-group sorting
    // -------------------------------------------------------------------------

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g1"], isSelected: true },
        { id: "D", groupIds: ["g1"] },
        { id: "E", groupIds: ["g1"], isSelected: true },
        { id: "F", groupIds: ["g2", "g1"] },
        { id: "G", groupIds: ["g2", "g1"] },
        { id: "H", groupIds: ["g3", "g1"] },
        { id: "I", groupIds: ["g3", "g1"] },
      ],
      appState: {
        editingGroupId: "g1",
      },
      operations: [
        [actionBringToFront, ["A", "B", "D", "F", "G", "H", "I", "C", "E"]],
        // noop (prevented)
        [actionBringToFront, ["A", "B", "D", "F", "G", "H", "I", "C", "E"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", groupIds: ["g2", "g1"], isSelected: true },
        { id: "D", groupIds: ["g2", "g1"] },
        { id: "C", groupIds: ["g1"] },
      ],
      appState: {
        editingGroupId: "g2",
      },
      operations: [
        [actionBringToFront, ["A", "D", "B", "C"]],
        // noop (prevented)
        [actionBringToFront, ["A", "D", "B", "C"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "0" },
        { id: "A", isSelected: true },
        { id: "B", isDeleted: true },
        { id: "C", isDeleted: true },
        { id: "D" },
        { id: "E", isSelected: true },
        { id: "F", isDeleted: true },
        { id: "G" },
      ],
      operations: [
        [actionBringToFront, ["0", "B", "C", "D", "F", "G", "A", "E"]],
        // noop
        [actionBringToFront, ["0", "B", "C", "D", "F", "G", "A", "E"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A", isSelected: true },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true },
      ],
      operations: [
        // noop
        [actionBringToFront, ["A", "B", "C"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true },
      ],
      operations: [
        // noop
        [actionBringToFront, ["A", "B", "C"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A", isSelected: true },
        { id: "B", isSelected: true },
        { id: "C" },
      ],
      operations: [
        [actionBringToFront, ["C", "A", "B"]],
        // noop
        [actionBringToFront, ["C", "A", "B"]],
      ],
    });
  });

  it.only("send to back", () => {
    render(<App />);

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", isDeleted: true },
        { id: "C" },
        { id: "D", isDeleted: true },
        { id: "E", isSelected: true },
        { id: "F", isDeleted: true },
        { id: "G" },
        { id: "H", isSelected: true },
        { id: "I" },
      ],
      operations: [
        [actionSendToBack, ["E", "H", "A", "B", "C", "D", "F", "G", "I"]],
        // noop
        [actionSendToBack, ["E", "H", "A", "B", "C", "D", "F", "G", "I"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A", isSelected: true },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true },
      ],
      operations: [
        // noop
        [actionSendToBack, ["A", "B", "C"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A", isSelected: true },
        { id: "B", isSelected: true },
        { id: "C" },
      ],
      operations: [
        // noop
        [actionSendToBack, ["A", "B", "C"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true },
      ],
      operations: [
        [actionSendToBack, ["B", "C", "A"]],
        // noop
        [actionSendToBack, ["B", "C", "A"]],
      ],
    });

    // in-group sorting
    // -------------------------------------------------------------------------

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", groupIds: ["g2", "g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g3", "g1"] },
        { id: "E", groupIds: ["g3", "g1"] },
        { id: "F", groupIds: ["g1"], isSelected: true },
        { id: "G", groupIds: ["g1"] },
        { id: "H", groupIds: ["g1"], isSelected: true },
        { id: "I", groupIds: ["g1"] },
      ],
      appState: {
        editingGroupId: "g1",
      },
      operations: [
        [actionSendToBack, ["A", "F", "H", "B", "C", "D", "E", "G", "I"]],
        // noop (prevented)
        [actionSendToBack, ["A", "F", "H", "B", "C", "D", "E", "G", "I"]],
      ],
    });

    assertZindex({
      elements: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g2", "g1"], isSelected: true },
      ],
      appState: {
        editingGroupId: "g2",
      },
      operations: [
        [actionSendToBack, ["A", "B", "D", "C"]],
        // noop (prevented)
        [actionSendToBack, ["A", "B", "D", "C"]],
      ],
    });
  });
});
