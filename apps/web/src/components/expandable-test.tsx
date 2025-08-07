import { ChevronDown } from "lucide-react";
import * as React from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

type ExpandableTextProps = {
  children: React.ReactNode;
  className?: string;
  clampLines?: number;
  gradientHeight?: number;
  initiallyExpanded?: boolean;
  expandLabel?: string;
  collapseLabel?: string;
  id?: string;
};

/**
 * ExpandableText
 * - Designed for use inside a shadcn/ui <CardContent>.
 * - Clamps content to N lines with a soft gradient fade and "Show more" button.
 * - Automatically detects overflow; the button only appears if needed.
 */
export function ExpandableText({
  children,
  className,
  clampLines = 6,
  gradientHeight = 56,
  initiallyExpanded = false,
  expandLabel = "Show more",
  collapseLabel = "Show less",
  id,
}: ExpandableTextProps) {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const reactId = React.useId();
  const contentId = id ?? `expandable-text-${reactId}`;

  const [expanded, setExpanded] = React.useState(initiallyExpanded);
  const [maxHeightPx, setMaxHeightPx] = React.useState<number | null>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  const recalc = React.useCallback(() => {
    const el = contentRef.current;
    if (!el)
      return;

    // Compute per-line height in pixels
    const styles = window.getComputedStyle(el);
    let lineHeight = Number.parseFloat(styles.lineHeight);
    if (Number.isNaN(lineHeight)) {
      const fontSize = Number.parseFloat(styles.fontSize) || 16;
      lineHeight = fontSize * 1.5;
    }

    const maxH = Math.max(0, Math.round(lineHeight * clampLines));
    setMaxHeightPx(maxH);

    // Temporarily remove max-height to measure full scroll height
    // const prevMaxHeight = el.style.maxHeight;
    el.style.maxHeight = "none";
    const fullScrollHeight = el.scrollHeight;
    // Restore collapsed max-height if not expanded
    if (!expanded) {
      el.style.maxHeight = `${maxH}px`;
    }
    else {
      el.style.maxHeight = "none";
    }

    // Determine if content overflows the clamped height
    setIsOverflowing(fullScrollHeight > maxH + 1);
    setReady(true);
  }, [clampLines, expanded]);

  React.useEffect(() => {
    // Initial measure after mount and when content changes
    recalc();
    // Recalculate on resize of the element or viewport
    const el = contentRef.current;
    if (!el)
      return;

    const ro = new ResizeObserver(() => recalc());
    ro.observe(el);

    const onWinResize = () => recalc();
    window.addEventListener("resize", onWinResize, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
    };
  }, [children, recalc]);

  const showGradient = ready && isOverflowing && !expanded;
  const showToggle = ready && isOverflowing;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <div
          id={contentId}
          ref={contentRef}
          className={cn(
            "text-sm leading-relaxed text-muted-foreground",
            "transition-[max-height] duration-300 ease-in-out",
            // Ensure overflow is hidden while collapsed
            !expanded && "overflow-hidden",
          )}
          style={{
            maxHeight: expanded ? undefined : maxHeightPx ?? undefined,
          }}
          aria-live="polite"
        >
          {children}
        </div>

        {showGradient && (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0",
              "bg-gradient-to-b from-transparent to-card",
            )}
            style={{ height: `${gradientHeight}px` }}
          />
        )}
      </div>

      {showToggle && (
        <div className="flex justify-center">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1"
            aria-expanded={expanded}
            aria-controls={contentId}
            onClick={() => setExpanded(v => !v)}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expanded ? "rotate-180" : "rotate-0",
              )}
            />
            <span>{expanded ? collapseLabel : expandLabel}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export default ExpandableText;
