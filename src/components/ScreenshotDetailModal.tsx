import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Screenshot } from "@/types/screenshot";
import { getSliceTypeLabel, getDragModeLabel } from "@/utils/labels";

interface ScreenshotDetailModalProps {
  screenshot: Screenshot;
  onClose: () => void;
}

export function ScreenshotDetailModal({
  screenshot,
  onClose,
}: ScreenshotDetailModalProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Handle clicking outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle Escape key to close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="relative max-w-6xl max-h-[90vh] w-full bg-background rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Screenshot Details</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Image */}
          <div className="bg-black rounded-lg overflow-hidden">
            <img
              src={screenshot.dataUrl}
              alt="Screenshot"
              className="w-full h-auto"
            />
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">
              Metadata
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Timestamp */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Timestamp
                </div>
                <div className="text-sm">
                  {formatTime(screenshot.metadata.timestamp)}
                </div>
              </div>

              {/* Slice Type */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Slice Type
                </div>
                <div className="text-sm">
                  {getSliceTypeLabel(screenshot.metadata.sliceType)}
                </div>
              </div>

              {/* Colormap */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Colormap
                </div>
                <div className="text-sm capitalize">
                  {screenshot.metadata.colormap}
                </div>
              </div>

              {/* Drag Mode */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Drag Mode
                </div>
                <div className="text-sm">
                  {getDragModeLabel(screenshot.metadata.dragMode)}
                </div>
              </div>

              {/* Background */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Background
                </div>
                <div className="text-sm">
                  {screenshot.metadata.isDarkBackground ? "Dark" : "Light"}
                </div>
              </div>

              {/* Colorbar */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Colorbar
                </div>
                <div className="text-sm">
                  {screenshot.metadata.isColorbar ? "Visible" : "Hidden"}
                </div>
              </div>

              {/* Radiological Convention */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Radiological Convention
                </div>
                <div className="text-sm">
                  {screenshot.metadata.isRadiological ? "Yes" : "No"}
                </div>
              </div>

              {/* 3D Crosshair */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  3D Crosshair
                </div>
                <div className="text-sm">
                  {screenshot.metadata.show3Dcrosshair ? "Visible" : "Hidden"}
                </div>
              </div>

              {/* Clip Plane */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Clip Plane
                </div>
                <div className="text-sm">
                  {screenshot.metadata.showClipPlane ? "Enabled" : "Disabled"}
                </div>
              </div>

              {/* Multiplanar Render */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Multiplanar Render
                </div>
                <div className="text-sm">
                  {screenshot.metadata.showMultiplanarRender
                    ? "Visible"
                    : "Hidden"}
                </div>
              </div>

              {/* Intensity */}
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Intensity
                </div>
                <div className="text-sm font-mono">
                  {screenshot.metadata.intensity || "N/A"}
                </div>
              </div>

              {/* Fractions */}
              {screenshot.metadata.frac.length > 0 && (
                <div className="md:col-span-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Fractions
                  </div>
                  <div className="text-sm font-mono break-all">
                    {Array.from(screenshot.metadata.frac).join(", ")}
                  </div>
                </div>
              )}
            </div>

            {/* Vox */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Vox
              </div>
              <div className="text-sm font-mono break-all">
                {Array.from(screenshot.metadata.vox).join(", ")}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/50">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
