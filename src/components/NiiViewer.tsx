import { useRef, useState, useCallback, useEffect } from "react";
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
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import ScreenshotSidebar from "./ScreenshotSidebar";
import type { Screenshot } from "@/types/screenshot";
import {
  sliceTypeOptions,
  dragModes,
  getSliceTypeLabel,
  getDragModeLabel,
} from "@/utils/labels";

const colormaps = ["gray", "plasma", "viridis", "inferno"];

const NiiViewer = () => {
  const [sourceUrl, setSourceUrl] = useState(
    "https://niivue.github.io/niivue-demo-images/mni152.nii.gz"
  );
  const [vox, setVox] = useState<Float32Array>(new Float32Array());
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
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [canScreenshot, setCanScreenshot] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nvRef = useRef<Niivue | null>(null);

  const submitScreenshots = useCallback(() => {
    if (!window.parent || screenshots.length === 0) {
      console.error("Cannot submit: no parent or no screenshots");
      return;
    }

    window.parent.postMessage(
      {
        type: "submission",
        payload: {
          items: screenshots.map((screenshot) => ({
            content: {
              type: "dataUrl",
              data: screenshot.dataUrl,
            },
            metadata: {
              ...screenshot.metadata,
              sliceType: getSliceTypeLabel(screenshot.metadata.sliceType),
              dragMode: getDragModeLabel(screenshot.metadata.dragMode),
              frac: Array.from(screenshot.metadata.frac),
              vox: Array.from(screenshot.metadata.vox),
            },
          })),
        },
      },
      "http://localhost:1234"
    );

    console.log(`Submitted ${screenshots.length} screenshots`);
  }, [screenshots]);

  const handleLocationChange = useCallback(
    (data: { string: string; frac: Float32Array; vox: Float32Array }) => {
      setVox(data.vox);
      setFrac(data.frac);
      setIntensity(data.string);
      setCanScreenshot(true);
    },
    [setVox, setFrac, setIntensity]
  );

  const loadVolumes = useCallback(async () => {
    setCanScreenshot(false);
    if (nvRef.current) {
      nvRef.current.cleanup();
    }
    const nv = new Niivue({
      dragAndDropEnabled: true,
      show3Dcrosshair: show3Dcrosshair,
      // @ts-expect-error - onLocationChange is not typed
      onLocationChange: handleLocationChange,
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
        url: sourceUrl,
      },
    ];
    await nv.loadVolumes(volumeList);
    nv.setSliceType(sliceType);
  }, [
    sourceUrl,
    isColorbar,
    isRadiological,
    show3Dcrosshair,
    showClipPlane,
    isDarkBackground,
    dragMode,
    sliceType,
    showMultiplanarRender,
    handleLocationChange,
  ]);

  const captureScreenshot = useCallback(() => {
    if (!nvRef.current || !canvasRef.current || !canScreenshot) return;

    // Force render to ensure canvas is up-to-date
    nvRef.current.drawScene();

    // Capture canvas as base64 PNG
    const dataUrl = canvasRef.current.toDataURL("image/png");

    const newScreenshot: Screenshot = {
      id: `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dataUrl,
      metadata: {
        timestamp: Date.now(),
        sliceType,
        colormap,
        isColorbar,
        isRadiological,
        show3Dcrosshair,
        showClipPlane,
        isDarkBackground,
        dragMode,
        showMultiplanarRender,
        intensity,
        frac: new Float32Array(frac), // Clone array
        vox: new Float32Array(vox),
        sourceUrl,
      },
    };

    setScreenshots((prev) => [...prev, newScreenshot]);
  }, [
    canScreenshot,
    sliceType,
    colormap,
    isColorbar,
    isRadiological,
    show3Dcrosshair,
    showClipPlane,
    isDarkBackground,
    dragMode,
    showMultiplanarRender,
    intensity,
    frac,
    vox,
    sourceUrl,
  ]);

  const deleteScreenshot = useCallback((id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearAllScreenshots = useCallback(() => {
    if (screenshots.length === 0) return;
    if (window.confirm(`Delete all ${screenshots.length} screenshots?`)) {
      setScreenshots([]);
    }
  }, [screenshots.length]);

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

  // Keyboard shortcuts for view switching and screenshot
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Number keys 1-5 for view switching
      switch (event.key) {
        case "1":
          handleSliceTypeChange(SLICE_TYPE.AXIAL);
          break;
        case "2":
          handleSliceTypeChange(SLICE_TYPE.CORONAL);
          break;
        case "3":
          handleSliceTypeChange(SLICE_TYPE.SAGITTAL);
          break;
        case "4":
          handleSliceTypeChange(SLICE_TYPE.RENDER);
          break;
        case "5":
          handleSliceTypeChange(SLICE_TYPE.MULTIPLANAR, true);
          break;
        case "s":
        case "S":
          // Take screenshot with 'S' key
          captureScreenshot();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSliceTypeChange, captureScreenshot]);

  return (
    <div className="flex flex-col h-screen">
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
            <DropdownMenuItem onClick={captureScreenshot}>
              <span className="flex items-center justify-between w-full gap-4">
                <span>Screen Shot</span>
                <Kbd>S</Kbd>
              </span>
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
                <span className="flex items-center justify-between w-full gap-4">
                  <span className="flex items-center gap-2">
                    {sliceType === option.value && (
                      <Check className="h-4 w-4" />
                    )}
                    {option.label}
                  </span>
                  <Kbd>{option.shortcut}</Kbd>
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
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Enter nii file URL"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={loadVolumes}
            disabled={!sourceUrl}
          >
            Load
          </Button>
        </div>
      </div>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <main className="flex-1 p-3">
          <div className="w-full h-full p-4 border border-neutral-600 rounded-md">
            <canvas ref={canvasRef} />
          </div>
        </main>

        {/* Screenshot sidebar - always rendered to prevent layout shift */}
        <aside
          className={cn(
            "transition-all duration-300 border-l bg-background flex-shrink-0",
            isSidebarOpen ? "w-80" : "w-12"
          )}
        >
          <ScreenshotSidebar
            screenshots={screenshots}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((prev) => !prev)}
            onDelete={deleteScreenshot}
            onClear={clearAllScreenshots}
            onSubmit={submitScreenshots}
          />
        </aside>
      </div>
    </div>
  );
};

export default NiiViewer;
