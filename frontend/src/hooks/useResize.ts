import { styled } from "@stitches/react";
import { useState, useEffect, useRef } from "react";

export const ResizableContainer = styled("div", {
  display: "flex",
  width: "100vw",
  flex: 1,
  height: '100%',
  variants: {
    resizing: {
      true: {
        userSelect: 'none'
      }
    }
  }
});

export const LeftPanel = styled("div", {
  variants: {
    padded: {
      true: {
        padding: '12px'
      }
    }
  }
});

export const RightPanel = styled(LeftPanel, {
  flexGrow: 1,
});

export const Resizer = styled("div", {
  width: 5,
  cursor: "ew-resize",
  backgroundColor: "#ccc",
  position: "relative",
  zIndex: 10,
  "&:hover": {
    backgroundColor: "#aaa",
  },
});

export const useResize = (opts?: { initialWidth?: number, minWidth?: number, maxWidth?: number }) => {
  const [leftWidth, setLeftWidth] = useState(opts?.initialWidth ?? 600);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (containerRef.current && resizing) {
        event.preventDefault();
        const newLeftWidth =
          event.clientX - containerRef.current.getBoundingClientRect().left;
        setLeftWidth(Math.max(opts?.minWidth ?? 0, Math.min(newLeftWidth, opts?.maxWidth ?? Infinity)));
      }
    };

    const handleMouseUp = () => {
      if (resizing) {
        setResizing(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, opts?.minWidth, opts?.maxWidth]);

  const startResizing = () => setResizing(true);

  return {
    leftWidth,
    containerRef,
    startResizing,
    resizing,
  };
};