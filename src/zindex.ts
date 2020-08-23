import { AppState } from "./types";
import { ExcalidrawElement } from "./element/types";
import { getElementsInGroup } from "./groups";
import { findLastIndex, findIndex } from "./utils";

const toContiguousGroups = (array: number[]) => {
  let cursor = 0;
  return array.reduce((acc, value, index) => {
    if (index > 0 && array[index - 1] !== value - 1) {
      cursor = ++cursor;
    }
    (acc[cursor] || (acc[cursor] = [])).push(value);
    return acc;
  }, [] as number[][]);
};

const getSuitableIndex = (
  appState: AppState,
  elements: ExcalidrawElement[],
  boundaryIndex: number,
  direction: "left" | "right",
) => {
  const sourceElement = elements[boundaryIndex];

  const candidateIndex =
    direction === "left"
      ? findLastIndex(
          elements,
          (element) => {
            return !element.isDeleted;
          },
          Math.max(0, boundaryIndex - 1),
        )
      : findIndex(
          elements,
          (element, idx) => {
            return !element.isDeleted;
          },
          boundaryIndex + 1,
        );

  const nextElement = elements[candidateIndex];

  if (!nextElement) {
    return -1;
  }

  if (appState.editingGroupId) {
    if (
      // candidate element is a sibling in current editing group → return
      sourceElement?.groupIds.join("") === nextElement?.groupIds.join("")
    ) {
      return candidateIndex;
    } else if (!nextElement?.groupIds.includes(appState.editingGroupId)) {
      // candidate element is outside current editing group → prevent
      return -1;
    }
  }

  if (!nextElement.groupIds.length) {
    return candidateIndex;
  }

  const targetGroupId = appState.editingGroupId
    ? nextElement.groupIds[
        nextElement.groupIds.indexOf(appState.editingGroupId) - 1
      ]
    : nextElement.groupIds[nextElement.groupIds.length - 1];

  const elementsInGroup = getElementsInGroup(elements, targetGroupId);

  if (elementsInGroup.length) {
    // assumes getElementsInGroup() returned elements are sorted
    //  by zIndex (ascending)
    return direction === "left"
      ? elements.indexOf(elementsInGroup[0])
      : elements.indexOf(elementsInGroup[elementsInGroup.length - 1]);
  }

  return candidateIndex;
};

const shiftElements = (
  appState: AppState,
  elements: ExcalidrawElement[],
  indicesToMove: number[],
  direction: "left" | "right",
) => {
  const groupedIndices = toContiguousGroups(indicesToMove);

  groupedIndices.forEach((indices, i) => {
    const leadingIndex = indices[0];
    const trailingIndex = indices[indices.length - 1];
    const boundaryIndex = direction === "left" ? leadingIndex : trailingIndex;

    const targetIndex = getSuitableIndex(
      appState,
      elements,
      boundaryIndex,
      direction,
    );

    if (targetIndex === -1 || boundaryIndex === targetIndex) {
      return;
    }

    const leadingElements =
      direction === "left"
        ? elements.slice(0, targetIndex)
        : elements.slice(0, leadingIndex);
    const targetElements = elements.slice(leadingIndex, trailingIndex + 1);
    const displacedElements =
      direction === "left"
        ? elements.slice(targetIndex, leadingIndex)
        : elements.slice(trailingIndex + 1, targetIndex + 1);
    const trailingElements =
      direction === "left"
        ? elements.slice(trailingIndex + 1)
        : elements.slice(targetIndex + 1);

    elements =
      direction === "left"
        ? [
            ...leadingElements,
            ...targetElements,
            ...displacedElements,
            ...trailingElements,
          ]
        : [
            ...leadingElements,
            ...displacedElements,
            ...targetElements,
            ...trailingElements,
          ];
  });

  return elements;
};

export const moveOneLeft = (
  appState: AppState,
  elements: ExcalidrawElement[],
  indicesToMove: number[],
) => {
  return shiftElements(appState, elements, indicesToMove, "left");
};

export const moveOneRight = (
  appState: AppState,
  elements: ExcalidrawElement[],
  indicesToMove: number[],
) => {
  return shiftElements(appState, elements, indicesToMove, "right");
};

export const moveAllLeft = (
  appState: AppState,
  elements: ExcalidrawElement[],
  indicesToMove: number[],
) => {
  const targetElements: ExcalidrawElement[] = [];
  const displacedElements: ExcalidrawElement[] = [];

  if (appState.editingGroupId) {
    const groupElements = getElementsInGroup(elements, appState.editingGroupId);
    const leadingIndex = elements.indexOf(groupElements[0]);
    const trailingIndex = leadingIndex + groupElements.length - 1;

    groupElements.forEach((element, index) => {
      if (indicesToMove.indexOf(index + leadingIndex) > -1) {
        targetElements.push(element);
      } else {
        displacedElements.push(element);
      }
    });

    const leadingElements = elements.slice(0, leadingIndex);
    const trailingElements = elements.slice(leadingIndex + trailingIndex + 1);

    return [
      ...leadingElements,
      ...targetElements,
      ...displacedElements,
      ...trailingElements,
    ];
  }

  elements.forEach((element, index) => {
    if (indicesToMove.indexOf(index) > -1) {
      targetElements.push(element);
    } else {
      displacedElements.push(element);
    }
  });

  return targetElements.concat(displacedElements);
};

export const moveAllRight = (
  appState: AppState,
  elements: ExcalidrawElement[],
  indicesToMove: number[],
) => {
  const targetElements: ExcalidrawElement[] = [];
  const displacedElements: ExcalidrawElement[] = [];

  if (appState.editingGroupId) {
    const groupElements = getElementsInGroup(elements, appState.editingGroupId);
    const leadingIndex = elements.indexOf(groupElements[0]);
    const trailingIndex = leadingIndex + groupElements.length - 1;

    groupElements.forEach((element, index) => {
      if (indicesToMove.indexOf(index + leadingIndex) > -1) {
        targetElements.push(element);
      } else {
        displacedElements.push(element);
      }
    });

    const leadingElements = elements.slice(0, leadingIndex);
    const trailingElements = elements.slice(trailingIndex + 1);

    return [
      ...leadingElements,
      ...displacedElements,
      ...targetElements,
      ...trailingElements,
    ];
  }

  elements.forEach((element, index) => {
    if (indicesToMove.indexOf(index) > -1) {
      targetElements.push(element);
    } else {
      displacedElements.push(element);
    }
  });

  return displacedElements.concat(targetElements);
};
