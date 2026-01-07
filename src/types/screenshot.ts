import { SLICE_TYPE, DRAG_MODE } from "@niivue/niivue";

export interface Screenshot {
  id: string;
  dataUrl: string; // base64 PNG from canvas.toDataURL()
  metadata: ScreenshotMetadata;
}

export interface ScreenshotMetadata {
  sourceUrl: string;
  timestamp: number;
  sliceType: SLICE_TYPE;
  colormap: string;
  isColorbar: boolean;
  isRadiological: boolean;
  show3Dcrosshair: boolean;
  showClipPlane: boolean;
  isDarkBackground: boolean;
  dragMode: DRAG_MODE;
  showMultiplanarRender: boolean;
  intensity: string;
  frac: Float32Array;
  vox: Float32Array;
}
