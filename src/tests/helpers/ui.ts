import { ToolName } from "../queries/toolQueries";
import { fireEvent, GlobalTestState } from "../test-utils";
import { KEYS, Key } from "../../keys";
import { ExcalidrawElement } from "../../element/types";
import { API } from "./api";

const { h } = window;

let altKey = false;
let shiftKey = false;
let ctrlKey = false;

export class Keyboard {
  static withModifierKeys = (
    modifiers: { alt?: boolean; shift?: boolean; ctrl?: boolean },
    cb: () => void,
  ) => {
    const prevAltKey = altKey;
    const prevShiftKey = shiftKey;
    const prevCtrlKey = ctrlKey;

    altKey = !!modifiers.alt;
    shiftKey = !!modifiers.shift;
    ctrlKey = !!modifiers.ctrl;

    try {
      cb();
    } finally {
      altKey = prevAltKey;
      shiftKey = prevShiftKey;
      ctrlKey = prevCtrlKey;
    }
  };

  static hotkeyDown = (hotkey: Key) => {
    const key = KEYS[hotkey];
    if (typeof key !== "string") {
      throw new Error("must provide a hotkey, not a key code");
    }
    Keyboard.keyDown(key);
  };

  static hotkeyUp = (hotkey: Key) => {
    const key = KEYS[hotkey];
    if (typeof key !== "string") {
      throw new Error("must provide a hotkey, not a key code");
    }
    Keyboard.keyUp(key);
  };

  static keyDown = (key: string) => {
    fireEvent.keyDown(document, {
      key,
      ctrlKey,
      shiftKey,
      altKey,
      keyCode: key.toUpperCase().charCodeAt(0),
      which: key.toUpperCase().charCodeAt(0),
    });
  };

  static keyUp = (key: string) => {
    fireEvent.keyUp(document, {
      key,
      ctrlKey,
      shiftKey,
      altKey,
      keyCode: key.toUpperCase().charCodeAt(0),
      which: key.toUpperCase().charCodeAt(0),
    });
  };

  static hotkeyPress = (key: Key) => {
    Keyboard.hotkeyDown(key);
    Keyboard.hotkeyUp(key);
  };

  static keyPress = (key: string) => {
    Keyboard.keyDown(key);
    Keyboard.keyUp(key);
  };
}

export class Pointer {
  private clientX = 0;
  private clientY = 0;

  constructor(
    private readonly pointerType: "mouse" | "touch" | "pen",
    private readonly pointerId = 1,
  ) {}

  reset() {
    this.clientX = 0;
    this.clientY = 0;
  }

  getPosition() {
    return [this.clientX, this.clientY];
  }

  restorePosition(x = 0, y = 0) {
    this.clientX = x;
    this.clientY = y;
    fireEvent.pointerMove(GlobalTestState.canvas, this.getEvent());
  }

  private getEvent() {
    return {
      clientX: this.clientX,
      clientY: this.clientY,
      pointerType: this.pointerType,
      pointerId: this.pointerId,
      altKey,
      shiftKey,
      ctrlKey,
    };
  }

  move(dx: number, dy: number) {
    if (dx !== 0 || dy !== 0) {
      this.clientX += dx;
      this.clientY += dy;
      fireEvent.pointerMove(GlobalTestState.canvas, this.getEvent());
    }
  }

  down(dx = 0, dy = 0) {
    this.move(dx, dy);
    fireEvent.pointerDown(GlobalTestState.canvas, this.getEvent());
  }

  up(dx = 0, dy = 0) {
    this.move(dx, dy);
    fireEvent.pointerUp(GlobalTestState.canvas, this.getEvent());
  }

  click(dx = 0, dy = 0) {
    this.down(dx, dy);
    this.up();
  }

  doubleClick(dx = 0, dy = 0) {
    this.move(dx, dy);
    fireEvent.doubleClick(GlobalTestState.canvas, this.getEvent());
  }

  select(
    /** if multiple elements supplied, they're shift-selected */
    elements: ExcalidrawElement | ExcalidrawElement[],
  ) {
    API.clearSelection();
    Keyboard.withModifierKeys({ shift: true }, () => {
      elements = Array.isArray(elements) ? elements : [elements];
      elements.forEach((element) => {
        this.reset();
        this.click(element.x, element.y);
      });
    });
    this.reset();
  }

  clickOn(element: ExcalidrawElement) {
    this.reset();
    this.click(element.x, element.y);
    this.reset();
  }
}

const mouse = new Pointer("mouse");

export class UI {
  static clickTool = (toolName: ToolName) => {
    fireEvent.click(GlobalTestState.renderResult.getByToolName(toolName));
  };

  static createElement(
    type: ToolName,
    {
      x = 0,
      y = x,
      size = 10,
    }: {
      x?: number;
      y?: number;
      size?: number;
    },
  ) {
    UI.clickTool(type);
    mouse.reset();
    mouse.down(x, y);
    mouse.reset();
    mouse.up(x + size, y + size);
    return h.elements[h.elements.length - 1];
  }

  static group(elements: ExcalidrawElement[]) {
    mouse.select(elements);
    Keyboard.withModifierKeys({ ctrl: true }, () => {
      Keyboard.keyPress("g");
    });
  }
}
