import { useRef, useState, useCallback } from "react";
import { Niivue, SLICE_TYPE, SHOW_RENDER, DRAG_MODE } from "@niivue/niivue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";

const sliceTypeOptions = [
  {
    label: "Axial",
    value: SLICE_TYPE.AXIAL,
  },
  {
    label: "Coronal",
    value: SLICE_TYPE.CORONAL,
  },
  {
    label: "Sagittal",
    value: SLICE_TYPE.SAGITTAL,
  },
  {
    label: "Render",
    value: SLICE_TYPE.RENDER,
  },
  {
    label: "Multiplanar (A+C+S)",
    value: SLICE_TYPE.MULTIPLANAR,
  },
];

const colormaps = ["gray", "plasma", "viridis", "inferno"];

const dragModes = [
  { label: "Contrast", value: DRAG_MODE.contrast },
  { label: "Measurement", value: DRAG_MODE.measurement },
  { label: "Pan", value: DRAG_MODE.pan },
  { label: "None", value: DRAG_MODE.none },
];

const NiiViewer = () => {
  const [imageUrl, setImageUrl] = useState(
    "https://s3.amazonaws.com/openneuro.org/ds007122/sub-01/ses-01/anat/sub-01_ses-01_T1w.nii.gz?versionId=pw4fvQg5wq.9H4uWaoVAzRVBjznhIbXK&AWSAccessKeyId=AKIARTA7OOV5WQ3DGSOB&Signature=7fsZV4YFGC60PxSh4YDrTVyTUjI%3D&Expires=1768221668"
  );
  const [frac, setFrac] = useState<Float32Array>(new Float32Array());
  const [intensity, setIntensity] = useState<string>("");
  const [sliceType, setSliceType] = useState<SLICE_TYPE>(
    SLICE_TYPE.MULTIPLANAR
  );
  const [isColorbar, setIsColorbar] = useState(true);
  const [isRadiological, setIsRadiological] = useState(false);
  const [show3Dcrosshair, setShow3Dcrosshair] = useState(true);
  const [showClipPlane, setShowClipPlane] = useState(false);
  const [colormap, setColormap] = useState("gray");
  const [isDarkBackground, setIsDarkBackground] = useState(true);
  const [dragMode, setDragMode] = useState<DRAG_MODE>(DRAG_MODE.contrast);
  const [showMultiplanarRender, setShowMultiplanarRender] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nvRef = useRef<Niivue | null>(null);

  const handleIntensityChange = useCallback(
    (data: { string: string; frac: Float32Array }) => {
      setFrac(data.frac);
      setIntensity(data.string);
    },
    []
  );

  const loadVolumes = useCallback(async () => {
    if (nvRef.current) {
      nvRef.current.cleanup();
    }
    const nv = new Niivue({
      dragAndDropEnabled: true,
      show3Dcrosshair: show3Dcrosshair,
      // @ts-expect-error - onLocationChange is not typed
      onLocationChange: handleIntensityChange,
    });
    nv.opts.isColorbar = isColorbar;
    nv.setRadiologicalConvention(isRadiological);
    nv.setRenderAzimuthElevation(120, 10);
    nv.setSliceMM(true);
    nv.opts.multiplanarShowRender = showMultiplanarRender
      ? SHOW_RENDER.ALWAYS
      : SHOW_RENDER.NEVER;
    nv.graph.autoSizeMultiplanar = false;
    nv.graph.opacity = 1.0;
    nv.opts.dragMode = dragMode;

    if (isDarkBackground) {
      nv.opts.backColor = [0, 0, 0, 1];
    } else {
      nv.opts.backColor = [1, 1, 1, 1];
    }

    nvRef.current = nv;
    if (!canvasRef.current) throw new Error("Canvas not found");
    await nv.attachToCanvas(canvasRef.current);

    if (showClipPlane) {
      nv.setClipPlane([0.3, 270, 0]);
    } else {
      nv.setClipPlane([2, 270, 0]);
    }

    const volumeList = [
      {
        url: imageUrl,
      },
    ];
    await nv.loadVolumes(volumeList);
    nv.setSliceType(sliceType);
  }, [
    imageUrl,
    isColorbar,
    isRadiological,
    show3Dcrosshair,
    showClipPlane,
    isDarkBackground,
    dragMode,
    sliceType,
    showMultiplanarRender,
    handleIntensityChange,
  ]);

  const onSaveImage = useCallback(() => {
    if (nvRef.current) {
      nvRef.current.saveScene("ScreenShot.png");
    }
  }, []);

  const onShowHeader = useCallback(() => {
    if (nvRef.current && nvRef.current.volumes.length > 0) {
      alert(nvRef.current.volumes[0].hdr?.toFormattedString());
    }
  }, []);

  const handleSliceTypeChange = useCallback(
    (type: SLICE_TYPE, withRender?: boolean) => {
      setSliceType(type);
      if (type === SLICE_TYPE.MULTIPLANAR) {
        setShowMultiplanarRender(withRender ?? true);
      }
      if (nvRef.current) {
        if (type === SLICE_TYPE.MULTIPLANAR) {
          nvRef.current.opts.multiplanarShowRender = withRender
            ? SHOW_RENDER.ALWAYS
            : SHOW_RENDER.NEVER;
        }
        nvRef.current.setSliceType(type);
      }
    },
    []
  );

  const handleColormapChange = useCallback((cm: string) => {
    setColormap(cm);
    if (nvRef.current && nvRef.current.volumes.length > 0) {
      nvRef.current.volumes[0].colormap = cm;
      nvRef.current.updateGLVolume();
    }
  }, []);

  const handleColorbarToggle = useCallback(() => {
    const newValue = !isColorbar;
    setIsColorbar(newValue);
    if (nvRef.current) {
      nvRef.current.opts.isColorbar = newValue;
      nvRef.current.drawScene();
    }
  }, [isColorbar]);

  const handleRadiologicalToggle = useCallback(() => {
    const newValue = !isRadiological;
    setIsRadiological(newValue);
    if (nvRef.current) {
      nvRef.current.opts.isRadiologicalConvention = newValue;
      nvRef.current.drawScene();
    }
  }, [isRadiological]);

  const handleCrosshairToggle = useCallback(() => {
    const newValue = !show3Dcrosshair;
    setShow3Dcrosshair(newValue);
    if (nvRef.current) {
      nvRef.current.opts.show3Dcrosshair = newValue;
      nvRef.current.drawScene();
    }
  }, [show3Dcrosshair]);

  const handleClipPlaneToggle = useCallback(() => {
    const newValue = !showClipPlane;
    setShowClipPlane(newValue);
    if (nvRef.current) {
      if (newValue) {
        nvRef.current.setClipPlane([0.3, 270, 0]);
      } else {
        nvRef.current.setClipPlane([2, 270, 0]);
      }
      nvRef.current.drawScene();
    }
  }, [showClipPlane]);

  const handleBackgroundToggle = useCallback(() => {
    const newValue = !isDarkBackground;
    setIsDarkBackground(newValue);
    if (nvRef.current) {
      if (newValue) {
        nvRef.current.opts.backColor = [0, 0, 0, 1];
      } else {
        nvRef.current.opts.backColor = [1, 1, 1, 1];
      }
      nvRef.current.drawScene();
    }
  }, [isDarkBackground]);

  const handleDragModeChange = useCallback((mode: DRAG_MODE) => {
    setDragMode(mode);
    if (nvRef.current) {
      nvRef.current.opts.dragMode = mode;
    }
  }, []);

  return (
    <div className="flex flex-col h-screen]">
      {/* Header with Dropdown Menus */}
      <div className="flex gap-2 p-2 bg-background">
        {/* File Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              File
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onSaveImage}>
              Screen Shot
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowHeader}>
              Show Header
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href="https://github.com/niivue/niivue"
                target="_blank"
                rel="noopener noreferrer"
              >
                About
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {sliceTypeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() =>
                  handleSliceTypeChange(
                    option.value,
                    option.value === SLICE_TYPE.MULTIPLANAR
                  )
                }
              >
                <span className="flex items-center gap-2">
                  {sliceType === option.value && <Check className="h-4 w-4" />}
                  {option.label}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleColorbarToggle}>
              <span className="flex items-center gap-2">
                {isColorbar && <Check className="h-4 w-4" />}
                Colorbar
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleRadiologicalToggle}>
              <span className="flex items-center gap-2">
                {isRadiological && <Check className="h-4 w-4" />}
                Radiological
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCrosshairToggle}>
              <span className="flex items-center gap-2">
                {show3Dcrosshair && <Check className="h-4 w-4" />}
                Render Crosshair
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleClipPlaneToggle}>
              <span className="flex items-center gap-2">
                {showClipPlane && <Check className="h-4 w-4" />}
                Render Clip Plane
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Color Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Color
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {colormaps.map((cm) => (
              <DropdownMenuItem
                key={cm}
                onClick={() => handleColormapChange(cm)}
              >
                <span className="flex items-center gap-2">
                  {colormap === cm && <Check className="h-4 w-4" />}
                  {cm.charAt(0).toUpperCase() + cm.slice(1)}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleBackgroundToggle}>
              <span className="flex items-center gap-2">
                {isDarkBackground && <Check className="h-4 w-4" />}
                Dark Background
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Drag Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Drag
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {dragModes.map((mode) => (
              <DropdownMenuItem
                key={mode.value}
                onClick={() => handleDragModeChange(mode.value)}
              >
                <span className="flex items-center gap-2">
                  {dragMode === mode.value && <Check className="h-4 w-4" />}
                  {mode.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* File URL Input and Load Button */}
      <div className="p-3 border-t bg-background">
        <div className="flex gap-2 w-full">
          <Input
            className="flex-1"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter nii file URL"
          />
          <Button size="sm" onClick={loadVolumes} disabled={!imageUrl}>
            Load
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <main className="flex-1 p-3">
        <div className="p-3 w-full h-[80vh] border border-neutral-600 rounded-md">
          <canvas ref={canvasRef} />
        </div>
      </main>

      {!!intensity && (
        <div className="p-2 bg-background text-sm text-muted-foreground">
          Intensity: {intensity || "\u00A0"}
        </div>
      )}
      {!!frac.length && (
        <div className="p-2 bg-background text-sm text-muted-foreground">
          Fractions: {frac.join(", ") || "\u00A0"}
        </div>
      )}
    </div>
  );
};

export default NiiViewer;
