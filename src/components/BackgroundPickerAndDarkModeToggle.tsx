import React from "react";
import { ActionManager } from "../actions/manager";
import { AppState } from "../types";
import { DarkModeToggle } from "./DarkModeToggle";
import { GridSetting } from "./GridSetting";

export const BackgroundPickerAndDarkModeToggle = ({
  appState,
  setAppState,
  actionManager,
}: {
  actionManager: ActionManager;
  appState: AppState;
  setAppState: any;
}) => (
  <div style={{ display: "flex" }}>
    {actionManager.renderAction("changeViewBackgroundColor")}
    <div style={{ marginInlineStart: "0.25rem" }}>
      <DarkModeToggle
        value={appState.appearance}
        onChange={(appearance) => {
          setAppState({ appearance });
        }}
      />
    </div>
    <div style={{ marginInlineStart: "0.25rem" }}>
      <GridSetting
        value={appState.gridSize}
        onChange={(gridSize) => {
          setAppState({ gridSize: gridSize === 0 ? null : gridSize });
        }}
      />
    </div>
  </div>
);
