import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Screenshot } from "@/types/screenshot";
import { getSliceTypeLabel } from "@/utils/labels";

interface ScreenshotCardProps {
  screenshot: Screenshot;
  onDelete: (id: string) => void;
  onView: (screenshot: Screenshot) => void;
}

export function ScreenshotCard({
  screenshot,
  onDelete,
  onView,
}: ScreenshotCardProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="relative group border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
      {/* Thumbnail Image - clickable to view details */}
      <div
        className="relative aspect-video bg-black cursor-pointer"
        onClick={() => onView(screenshot)}
        title="Click to view details"
      >
        <img
          src={screenshot.dataUrl}
          alt={`Screenshot from ${formatTime(screenshot.metadata.timestamp)}`}
          className="w-full h-full object-contain"
        />

        {/* Delete button overlay */}
        <Button
          variant="destructive"
          size="icon-sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering onView
            onDelete(screenshot.id);
          }}
          title="Delete screenshot"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Metadata */}
      <div className="p-2 space-y-1">
        <div className="text-xs text-muted-foreground">
          {formatTime(screenshot.metadata.timestamp)}
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">
            {getSliceTypeLabel(screenshot.metadata.sliceType)}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">
            {screenshot.metadata.colormap}
          </span>
        </div>
      </div>
    </div>
  );
}
