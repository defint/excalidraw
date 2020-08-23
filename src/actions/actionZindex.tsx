import React from "react";
import {
  moveOneLeft,
  moveOneRight,
  moveAllLeft,
  moveAllRight,
} from "../zindex";
import { KEYS, isDarwin } from "../keys";
import { t } from "../i18n";
import { getShortcutKey } from "../utils";
import { register } from "./register";
import {
  SendBackwardIcon,
  BringToFrontIcon,
  SendToBackIcon,
  BringForwardIcon,
} from "../components/icons";
import { ExcalidrawElement } from "../element/types";
import { AppState } from "../types";

const getSelectedElementIndices = (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
) => {
  let selectedIndices: number[] = [];
  let deletedIndices: number[] = [];
  let includeDeletedIndex = null;
  let i = -1;
  while (++i < elements.length) {
    if (appState.selectedElementIds[elements[i].id]) {
      if (deletedIndices.length) {
        selectedIndices = selectedIndices.concat(deletedIndices);
        deletedIndices = [];
      }
      selectedIndices.push(i);
      includeDeletedIndex = i + 1;
    } else if (elements[i].isDeleted && includeDeletedIndex === i) {
      includeDeletedIndex = i + 1;
      deletedIndices.push(i);
    } else {
      deletedIndices = [];
    }
  }
  return selectedIndices;
};

const moveElements = (
  func: typeof moveOneLeft,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
) => {
  const indices = getSelectedElementIndices(elements, appState);
  return func(appState, elements.slice(), indices);
};

export const actionSendBackward = register({
  name: "sendBackward",
  perform: (elements, appState) => {
    return {
      elements: moveElements(moveOneLeft, elements, appState),
      appState,
      commitToHistory: true,
    };
  },
  contextItemLabel: "labels.sendBackward",
  keyPriority: 40,
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && !event.shiftKey && event.code === "BracketLeft",
  PanelComponent: ({ updateData, appState }) => (
    <button
      type="button"
      className="zIndexButton"
      onClick={() => updateData(null)}
      title={`${t("labels.sendBackward")} — ${getShortcutKey("CtrlOrCmd+[")}`}
    >
      <SendBackwardIcon appearance={appState.appearance} />
    </button>
  ),
});

export const actionBringForward = register({
  name: "bringForward",
  perform: (elements, appState) => {
    return {
      elements: moveElements(moveOneRight, elements, appState),
      appState,
      commitToHistory: true,
    };
  },
  contextItemLabel: "labels.bringForward",
  keyPriority: 40,
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && !event.shiftKey && event.code === "BracketRight",
  PanelComponent: ({ updateData, appState }) => (
    <button
      type="button"
      className="zIndexButton"
      onClick={() => updateData(null)}
      title={`${t("labels.bringForward")} — ${getShortcutKey("CtrlOrCmd+]")}`}
    >
      <BringForwardIcon appearance={appState.appearance} />
    </button>
  ),
});

export const actionSendToBack = register({
  name: "sendToBack",
  perform: (elements, appState) => {
    return {
      elements: moveElements(moveAllLeft, elements, appState),
      appState,
      commitToHistory: true,
    };
  },
  contextItemLabel: "labels.sendToBack",
  keyTest: (event) => {
    return isDarwin
      ? event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === "BracketLeft"
      : event[KEYS.CTRL_OR_CMD] &&
          event.shiftKey &&
          event.code === "BracketLeft";
  },
  PanelComponent: ({ updateData, appState }) => (
    <button
      type="button"
      className="zIndexButton"
      onClick={() => updateData(null)}
      title={`${t("labels.sendToBack")} — ${
        isDarwin
          ? getShortcutKey("CtrlOrCmd+Alt+[")
          : getShortcutKey("CtrlOrCmd+Shift+[")
      }`}
    >
      <SendToBackIcon appearance={appState.appearance} />
    </button>
  ),
});

export const actionBringToFront = register({
  name: "bringToFront",
  perform: (elements, appState) => {
    return {
      elements: moveElements(moveAllRight, elements, appState),
      appState,
      commitToHistory: true,
    };
  },
  contextItemLabel: "labels.bringToFront",
  keyTest: (event) => {
    return isDarwin
      ? event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === "BracketRight"
      : event[KEYS.CTRL_OR_CMD] &&
          event.shiftKey &&
          event.code === "BracketRight";
  },
  PanelComponent: ({ updateData, appState }) => (
    <button
      type="button"
      className="zIndexButton"
      onClick={(event) => updateData(null)}
      title={`${t("labels.bringToFront")} — ${
        isDarwin
          ? getShortcutKey("CtrlOrCmd+Alt+]")
          : getShortcutKey("CtrlOrCmd+Shift+]")
      }`}
    >
      <BringToFrontIcon appearance={appState.appearance} />
    </button>
  ),
});
