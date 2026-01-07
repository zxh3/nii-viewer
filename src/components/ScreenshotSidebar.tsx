import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import type { Screenshot } from "@/types/screenshot";
import { ScreenshotCard } from "./ScreenshotCard";
import { ScreenshotDetailModal } from "./ScreenshotDetailModal";

interface ScreenshotSidebarProps {
  screenshots: Screenshot[];
  isOpen: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}

export default function ScreenshotSidebar({
  screenshots,
  isOpen,
  onToggle,
  onDelete,
  onClear,
  onSubmit,
}: ScreenshotSidebarProps) {
  const hasScreenshots = screenshots.length > 0;
  const [selectedScreenshot, setSelectedScreenshot] =
    useState<Screenshot | null>(null);

  return (
    <>
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        {isOpen && (
          <>
            <h3 className="font-semibold text-sm">
              Screenshots ({screenshots.length})
            </h3>
            <div className="flex gap-1">
              {hasScreenshots && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClear}
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggle}
                title="Collapse sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
        {!isOpen && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            title="Expand sidebar"
            className="w-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Screenshot Grid or Empty State */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {hasScreenshots ? (
            screenshots.map((screenshot) => (
              <ScreenshotCard
                key={screenshot.id}
                screenshot={screenshot}
                onDelete={onDelete}
                onView={setSelectedScreenshot}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm">
              <p>No screenshots yet</p>
              <p className="text-xs mt-1">
                Use File → Screen Shot to capture
              </p>
            </div>
          )}
        </div>
      )}

      {/* Submit button footer - always visible when there are screenshots */}
      {isOpen && hasScreenshots && (
        <div className="p-3 border-t bg-background flex-shrink-0">
          <Button onClick={onSubmit} className="w-full">
            Submit {screenshots.length} Screenshot
            {screenshots.length !== 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>

    {/* Screenshot Detail Modal */}
    {selectedScreenshot && (
      <ScreenshotDetailModal
        screenshot={selectedScreenshot}
        onClose={() => setSelectedScreenshot(null)}
      />
    )}
    </>
  );
}
