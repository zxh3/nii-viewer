import { SLICE_TYPE, DRAG_MODE } from "@niivue/niivue";

export const sliceTypeOptions = [
  {
    label: "Axial",
    value: SLICE_TYPE.AXIAL,
    shortcut: "1",
  },
  {
    label: "Coronal",
    value: SLICE_TYPE.CORONAL,
    shortcut: "2",
  },
  {
    label: "Sagittal",
    value: SLICE_TYPE.SAGITTAL,
    shortcut: "3",
  },
  {
    label: "Render",
    value: SLICE_TYPE.RENDER,
    shortcut: "4",
  },
  {
    label: "Multiplanar",
    value: SLICE_TYPE.MULTIPLANAR,
    shortcut: "5",
  },
];

export const dragModes = [
  { label: "Contrast", value: DRAG_MODE.contrast },
  { label: "Measurement", value: DRAG_MODE.measurement },
  { label: "Pan", value: DRAG_MODE.pan },
  { label: "None", value: DRAG_MODE.none },
];

export const getSliceTypeLabel = (sliceType: SLICE_TYPE): string => {
  return (
    sliceTypeOptions.find((opt) => opt.value === sliceType)?.label || "Unknown"
  );
};

export const getDragModeLabel = (dragMode: DRAG_MODE): string => {
  return dragModes.find((mode) => mode.value === dragMode)?.label || "Unknown";
};
