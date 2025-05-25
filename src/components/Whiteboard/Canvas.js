import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Box } from "@mui/material";
import TextTool from "./TextTool";
import useSocket from "../hooks/useSocket";
import {
  getCursorPosition,
  clearCanvas,
  drawRect,
  drawCircle,
  loadImageToCanvas,
  canvasToDataURL,
} from "../utils/canvasUtils";

const ERASER_RADIUS = 18; // px

const Canvas = forwardRef(
  (
    {
      roomId,
      tool,
      color,
      width,
      initialImageData,
      initialElements = [],
      onStackChange,
    },
    ref
  ) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const initialImageDataRef = useRef(initialImageData);
    const colorRef = useRef(color);
    const widthRef = useRef(width);
    const [isDrawing, setIsDrawing] = useState(false);
    const [elements, setElements] = useState(initialElements || []);
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [currentPath, setCurrentPath] = useState([]);
    const [previewShape, setPreviewShape] = useState(null); // {type, x, y, w, h, color, ...}
    const [eraserPos, setEraserPos] = useState(null); // {x, y}
    const [eraserRect, setEraserRect] = useState(null); // {x1, y1, x2, y2}
    const [editingTextId, setEditingTextId] = useState(null);
    const [pendingText, setPendingText] = useState("");

    // Add new state for text formatting
    const [textFormatting, setTextFormatting] = useState({
      fontSize: 18,
      fontFamily: "Arial, sans-serif",
      fontStyle: {
        bold: false,
        italic: false,
        underline: false,
      },
    });

    // New dragging state
    const [dragging, setDragging] = useState({
      isDragging: false,
      elementId: null,
      initialMouseX: 0,
      initialMouseY: 0,
      originalElementX: 0,
      originalElementY: 0,
      originalElementX2: 0, // <-- use these consistently
      originalElementY2: 0,
    });
    // Removed hoveredElementId as it's less relevant with a dedicated drag tool

    const {
      socket,
      emitDrawStart,
      emitDrawMove,
      emitDrawEnd,
      onEvent,
      emitSyncElements,
    } = useSocket();

    // --- Undo/Redo logic using undoStack and redoStack ---

    const handleUndo = useCallback(() => {
      setUndoStack((prevUndoStack) => {
        if (prevUndoStack.length === 0) return prevUndoStack;
        const prevState = prevUndoStack[prevUndoStack.length - 1];
        setRedoStack((prevRedoStack) => [elements, ...prevRedoStack]);
        setElements(prevState);
        if (roomId && emitSyncElements) {
          emitSyncElements(roomId, prevState);
        }
        // Explicitly return the new undoStack (without the last state)
        return prevUndoStack.slice(0, -1);
      });
    }, [roomId, emitSyncElements, elements]);

    const handleRedo = useCallback(() => {
      setRedoStack((prevRedoStack) => {
        if (prevRedoStack.length === 0) return prevRedoStack;
        const nextState = prevRedoStack[0];
        setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
        setElements(nextState);
        if (roomId && emitSyncElements) {
          emitSyncElements(roomId, nextState);
        }
        // Explicitly return the new redoStack (without the first state)
        return prevRedoStack.slice(1);
      });
    }, [roomId, emitSyncElements, elements]);

    // Fix redrawCanvas with useCallback
    const redrawCanvas = useCallback(() => {
      const ctx = contextRef.current;
      if (!ctx) return;
      clearCanvas(ctx, canvasRef.current);

      elements.forEach((element) => {
        switch (element.type) {
          case "text":
            // Only draw text if not being edited
            if (element.id !== editingTextId) {
              ctx.save();
              const fontStyles = [];
              if (element.fontStyle?.bold) fontStyles.push("bold");
              if (element.fontStyle?.italic) fontStyles.push("italic");
              fontStyles.push(element.fontSize || "18px");
              fontStyles.push(element.fontFamily || "Arial, sans-serif");

              ctx.font = fontStyles.join(" ");
              ctx.fillStyle = element.color || "#000";
              ctx.textBaseline = "top";

              // Wrap text if width/height is set
              if (element.width && element.height) {
                const words = (element.text || "").split(" ");
                let line = "";
                let y = element.y;
                const lineHeight = parseInt(element.fontSize || "18", 10) + 2;

                for (let n = 0; n < words.length; n++) {
                  const testLine = line + words[n] + " ";
                  const metrics = ctx.measureText(testLine);
                  const testWidth = metrics.width;

                  if (testWidth > element.width && n > 0) {
                    ctx.fillText(line, element.x, y);
                    if (element.fontStyle?.underline) {
                      const metrics = ctx.measureText(line);
                      ctx.beginPath();
                      ctx.lineWidth = 1;
                      ctx.strokeStyle = element.color || "#000";
                      ctx.moveTo(element.x, y + lineHeight - 2);
                      ctx.lineTo(element.x + metrics.width, y + lineHeight - 2);
                      ctx.stroke();
                    }
                    line = words[n] + " ";
                    y += lineHeight;
                  } else {
                    line = testLine;
                  }
                }
                ctx.fillText(line, element.x, y);
                if (element.fontStyle?.underline) {
                  const metrics = ctx.measureText(line);
                  ctx.beginPath();
                  ctx.lineWidth = 1;
                  ctx.strokeStyle = element.color || "#000";
                  ctx.moveTo(element.x, y + lineHeight - 2);
                  ctx.lineTo(element.x + metrics.width, y + lineHeight - 2);
                  ctx.stroke();
                }
              } else {
                ctx.fillText(element.text, element.x, element.y);
              }
              ctx.restore();
            }
            break;
          case "rectangle":
            drawRect(
              ctx,
              element.x,
              element.y,
              element.width,
              element.height,
              element.color,
              element.lineWidth
            );
            break;
          case "circle":
            drawCircle(
              ctx,
              element.x,
              element.y,
              element.radius,
              element.color,
              element.lineWidth
            );
            break;
          case "path":
            if (element.points && element.points.length > 1) {
              ctx.save();
              ctx.strokeStyle = element.color;
              ctx.lineWidth = element.width;
              ctx.beginPath();
              ctx.moveTo(element.points[0].x, element.points[0].y);
              for (let i = 1; i < element.points.length; i++) {
                ctx.lineTo(element.points[i].x, element.points[i].y);
              }
              ctx.stroke();
              ctx.restore();
            }
            break;
          case "erase-rect":
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = "rgba(0,0,0,1)";
            ctx.fillRect(element.x, element.y, element.width, element.height);
            ctx.globalCompositeOperation = "source-over";
            ctx.restore();
            break;
          case "line":
            drawLine(
              ctx,
              element.x1,
              element.y1,
              element.x2,
              element.y2,
              element.color,
              element.width
            );
            break;
          case "arrow":
            drawArrow(
              ctx,
              element.x1,
              element.y1,
              element.x2,
              element.y2,
              element.color,
              element.width
            );
            break;
          default:
            break;
        }

        // Handle filled shapes
        if (element.fill) {
          fillShape(ctx, element, element.fill);
        }
      });

      // Draw shape preview
      if (
        previewShape &&
        (previewShape.type === "rectangle" ||
          previewShape.type === "circle" ||
          previewShape.type === "text-area")
      ) {
        ctx.save();
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        if (previewShape.type === "rectangle") {
          const x = previewShape.x1;
          const y = previewShape.y1;
          const w = previewShape.x2 - previewShape.x1;
          const h = previewShape.y2 - previewShape.y1;
          ctx.strokeRect(x, y, w, h);
        } else if (previewShape.type === "circle") {
          const x = previewShape.x1;
          const y = previewShape.y1;
          const w = previewShape.x2 - previewShape.x1;
          const h = previewShape.y2 - previewShape.y1;
          const radius = Math.sqrt(w * w + h * h) / 2;
          const centerX = x + w / 2;
          const centerY = y + h / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (previewShape.type === "text-area") {
          const x = previewShape.x1;
          const y = previewShape.y1;
          const w = previewShape.x2 - previewShape.x1;
          const h = previewShape.y2 - previewShape.y1;
          ctx.strokeRect(x, y, w, h);
        }
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Draw preview shape
      if (previewShape) {
        switch (previewShape.type) {
          case "line":
            drawLine(
              ctx,
              previewShape.x1,
              previewShape.y1,
              previewShape.x2,
              previewShape.y2,
              previewShape.color,
              previewShape.width
            );
            break;
          case "arrow":
            drawArrow(
              ctx,
              previewShape.x1,
              previewShape.y1,
              previewShape.x2,
              previewShape.y2,
              previewShape.color,
              previewShape.width
            );
            break;
          default:
            // No default preview shape
            break;
        }
      }

      // Draw eraser dashed rectangle while dragging
      if (eraserRect && tool === "eraser") {
        ctx.save();
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        const x = eraserRect.x1;
        const y = eraserRect.y1;
        const w = eraserRect.x2 - eraserRect.x1;
        const h = eraserRect.y2 - eraserRect.y1;
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
        ctx.restore();
      }
      // Draw eraser dashed circle at cursor (when not dragging)
      if (eraserPos && tool === "eraser" && !eraserRect) {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 2;
        ctx.arc(eraserPos.x, eraserPos.y, ERASER_RADIUS, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }, [elements, editingTextId, previewShape, eraserRect, eraserPos, tool]); // Add dependencies

    // Initialize canvas - now without color/width dependencies
    useEffect(() => {
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;

      // Set canvas size to match parent size in pixels
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      const context = canvas.getContext("2d");
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = colorRef.current;
      context.lineWidth = widthRef.current;
      context.imageSmoothingEnabled = false;

      contextRef.current = context;

      // Handle window resize
      const handleResize = () => {
        const prevData = canvas.toDataURL();
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        // Restore context properties after resize
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = colorRef.current;
        context.lineWidth = widthRef.current;
        context.imageSmoothingEnabled = false;

        // Redraw canvas
        const img = new Image();
        img.onload = () => {
          context.drawImage(img, 0, 0);
          redrawCanvas();
        };
        img.src = prevData;
      };

      window.addEventListener("resize", handleResize);

      // Load initial data if available
      if (initialImageDataRef.current) {
        loadImageToCanvas(context, initialImageDataRef.current)
          .then(() => {
            // loaded
          })
          .catch((err) => {
            console.error("Error loading initial whiteboard image:", err);
          });
      }

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, [redrawCanvas]); // No dependencies needed now

    // Replace direct color/width effect with ref updates
    useEffect(() => {
      if (contextRef.current) {
        contextRef.current.strokeStyle = colorRef.current;
        contextRef.current.lineWidth = widthRef.current;
      }
    }, [color, width]);

    // Update redrawCanvas to use refs
    useEffect(() => {
      redrawCanvas();
    }, [redrawCanvas]);

    // Set up socket event listeners for drawing
    useEffect(() => {
      // Other user started drawing
      const drawStartCleanup = onEvent("draw-start", (data) => {
        const { x, y, color, width } = data;
        const ctx = contextRef.current;

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x, y);
      });

      // Other user is drawing
      const drawMoveCleanup = onEvent("draw-move", (data) => {
        const { x, y } = data;
        const ctx = contextRef.current;

        ctx.lineTo(x, y);
        ctx.stroke();
      });

      // Other user stopped drawing
      const drawEndCleanup = onEvent("draw-end", () => {
        contextRef.current.closePath();
      });

      // Other user added shape
      const addShapeCleanup = onEvent("add-shape", (data) => {
        const { type, x, y, width, height, color } = data;

        if (type === "rectangle") {
          drawRect(contextRef.current, x, y, width, height, color, 2);
        } else if (type === "circle") {
          const radius = Math.sqrt(width * width + height * height) / 2;
          drawCircle(
            contextRef.current,
            x + width / 2,
            y + height / 2,
            radius,
            color,
            2
          );
        }
      });

      // Listen for element updates (for dragging)
      const updateElementCleanup = onEvent("update-element", (data) => {
        const { element } = data;
        setElements((prev) =>
          prev.map((el) => (el.id === element.id ? element : el))
        );
      });

      const RedoUndoCleanup = onEvent("sync-elements", (data) => {
        if (Array.isArray(data.elements)) {
          setElements(data.elements);
          setUndoStack([]); // Optional: clear undo/redo stacks to avoid conflicts
          setRedoStack([]);
        }
      });

      return () => {
        drawStartCleanup();
        drawMoveCleanup();
        drawEndCleanup();
        addShapeCleanup();
        updateElementCleanup();
        RedoUndoCleanup();
      };
    }, [onEvent]);

    // Listen for add-element events from other users
    useEffect(() => {
      if (!socket) return;
      const cleanup = onEvent("add-element", (data) => {
        const { element } = data;
        setElements((prev) => {
          if (element.id && prev.some((el) => el.id === element.id))
            return prev;
          return [...prev, element];
        });
      });
      return cleanup;
    }, [socket, onEvent]);

    // Separate keyboard shortcuts effect
    useEffect(() => {
      const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
          e.preventDefault();
          handleUndo();
        } else if (
          (e.ctrlKey || e.metaKey) &&
          (e.key === "y" || (e.shiftKey && e.key === "z"))
        ) {
          e.preventDefault();
          handleRedo();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleUndo, handleRedo]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      clearCanvas: () => {
        clearCanvas(contextRef.current, canvasRef.current);
        setElements([]);
        setUndoStack([]);
        setRedoStack([]);
      },
      getCanvasImage: () => {
        return canvasToDataURL(canvasRef.current);
      },
      getElements: () => {
        return elements;
      },
      undo: handleUndo,
      redo: handleRedo,
      getCanvas: () => {
        return canvasRef.current;
      },
    }));

    // Notify parent about undo/redo availability
    useEffect(() => {
      if (typeof onStackChange === "function") {
        onStackChange({
          canUndo: undoStack.length > 0,
          canRedo: redoStack.length > 0,
        });
      }
    }, [undoStack, redoStack, onStackChange]);

    // Always redraw canvas after elements change
    useEffect(() => {
      redrawCanvas();
    }, [elements, redrawCanvas]);

    // Add new helper functions for line and arrow
    const drawLine = (ctx, x1, y1, x2, y2, color, width) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    const drawArrow = (ctx, x1, y1, x2, y2, color, width) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;

      // Draw line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Draw arrow head
      const headLength = 15;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const fillShape = (ctx, element, color) => {
      ctx.save();
      ctx.fillStyle = color;

      if (element.type === "rectangle") {
        ctx.fillRect(element.x, element.y, element.width, element.height);
      } else if (element.type === "circle") {
        ctx.beginPath();
        ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.restore();
    };

    // Mouse events for drawing
    const startDrawing = (event) => {
      const { x, y } = getCursorPosition(canvasRef.current, event);

      if (tool === "pen") {
        contextRef.current.beginPath();
        contextRef.current.moveTo(x, y);
        setIsDrawing(true);
        setCurrentPath([{ x, y }]);
        emitDrawStart(roomId, x, y, color, width);
        return;
      }

      if (tool === "text") {
        const { x, y } = getCursorPosition(canvasRef.current, event);
        setIsDrawing(false);
        setStartX(x);
        setStartY(y);
        setEditingTextId("pending"); // or null, just to show the editor
        setPreviewShape(null);
        // Do NOT create or add a text element here!
        return;
      }

      if (tool === "rectangle" || tool === "circle") {
        setStartX(x);
        setStartY(y);
        setIsDrawing(true);
        setPreviewShape({
          type: tool,
          x1: x,
          y1: y,
          x2: x,
          y2: y,
          color,
          width,
        });
        return;
      }

      if (tool === "eraser") {
        setIsDrawing(true);
        setStartX(x);
        setStartY(y);
        setEraserRect({ x1: x, y1: y, x2: x, y2: y });
        return;
      }

      if (tool === "paint") {
        // Find shape under cursor and fill it
        const clickedElement = elements.findLast((el) => {
          if (el.type === "rectangle") {
            return (
              x >= el.x &&
              x <= el.x + el.width &&
              y >= el.y &&
              y <= el.y + el.height
            );
          } else if (el.type === "circle") {
            const dx = x - el.x;
            const dy = y - el.y;
            return Math.sqrt(dx * dx + dy * dy) <= el.radius;
          }
          return false;
        });

        if (clickedElement) {
          const newElement = {
            ...clickedElement,
            id: Date.now() + Math.random(),
            fill: color,
          };
          setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
          setRedoStack([]);
          setElements((prev) => [...prev, newElement]);
          if (socket) {
            socket.emit("add-element", { roomId, element: newElement });
          }
        }
        return;
      }

      if (tool === "line" || tool === "arrow") {
        setStartX(x);
        setStartY(y);
        setIsDrawing(true);
        setPreviewShape({
          type: tool,
          x1: x,
          y1: y,
          x2: x,
          y2: y,
          color,
          width: contextRef.current.lineWidth,
        });
        return;
      }
    };

    const draw = (event) => {
      if (!isDrawing) {
        if (tool === "eraser") {
          // Show eraser circle even if not drawing
          const { x, y } = getCursorPosition(canvasRef.current, event);
          setEraserPos({ x, y });
        }
        return;
      }
      const { x, y } = getCursorPosition(canvasRef.current, event);

      if (tool === "pen") {
        contextRef.current.lineTo(x, y);
        contextRef.current.stroke();
        setCurrentPath((prev) => [...prev, { x, y }]);
        emitDrawMove(roomId, x, y);
        return;
      }

      if (tool === "text") {
        setPreviewShape((prev) =>
          prev
            ? { ...prev, x2: x, y2: y }
            : { type: "text-area", x1: startX, y1: startY, x2: x, y2: y }
        );
        redrawCanvas();
        return;
      }

      if (tool === "rectangle" || tool === "circle") {
        setPreviewShape((prev) =>
          prev
            ? { ...prev, x2: x, y2: y }
            : { type: tool, x1: startX, y1: startY, x2: x, y2: y, color, width }
        );
        redrawCanvas();
        return;
      }

      if (tool === "eraser") {
        setEraserRect((prev) =>
          prev
            ? { ...prev, x2: x, y2: y }
            : { x1: startX, y1: startY, x2: x, y2: y }
        );
        redrawCanvas();
        return;
      }

      if (tool === "line" || tool === "arrow") {
        setPreviewShape((prev) => ({
          ...prev,
          x2: x,
          y2: y,
        }));
        redrawCanvas();
        return;
      }
    };

    const stopDrawing = (event) => {
      if (!isDrawing) return;

      if (tool === "text") {
        const { x, y } = getCursorPosition(canvasRef.current, event);
        setIsDrawing(false);
        // Calculate area
        const x1 = startX;
        const y1 = startY;
        const x2 = x;
        const y2 = y;
        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const widthArea = Math.abs(x2 - x1);
        const heightArea = Math.abs(y2 - y1);
        // Add a new text element with empty text and set it to editing
        const id = Date.now();
        const newTextElement = {
          id,
          type: "text",
          x: left,
          y: top,
          width: widthArea,
          height: heightArea,
          text: "",
          color,
          fontSize: `${Math.max(14, width * 5)}px`, // Use tool width as a factor for initial font size
          fontFamily: textFormatting.fontFamily,
          fontStyle: textFormatting.fontStyle,
        };
        setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
        setRedoStack([]);
        setElements((prev) => [...prev, newTextElement]);
        setEditingTextId(id);
        setPreviewShape(null);
        if (socket) {
          socket.emit("add-element", { roomId, element: newTextElement });
        }
        return;
      }

      if (tool === "rectangle" || tool === "circle") {
        const { x, y } = getCursorPosition(canvasRef.current, event);
        const w = x - startX;
        const h = y - startY;

        if (tool === "rectangle") {
          const newElement = {
            id: Date.now() + Math.random(),
            type: "rectangle",
            x: startX,
            y: startY,
            width: w,
            height: h,
            color,
            lineWidth: contextRef.current.lineWidth,
          };
          setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
          setRedoStack([]);
          setElements((prev) => {
            if (socket)
              socket.emit("add-element", { roomId, element: newElement });
            return [...prev, newElement];
          });
        } else if (tool === "circle") {
          const radius = Math.sqrt(w * w + h * h) / 2;
          const centerX = startX + w / 2;
          const centerY = startY + h / 2;

          const newElement = {
            id: Date.now() + Math.random(),
            type: "circle",
            x: centerX,
            y: centerY,
            radius,
            color,
            lineWidth: contextRef.current.lineWidth,
          };
          setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
          setRedoStack([]);
          setElements((prev) => {
            if (socket)
              socket.emit("add-element", { roomId, element: newElement });
            return [...prev, newElement];
          });
        }
        setIsDrawing(false);
        setPreviewShape(null);
        return;
      }

      if (tool === "eraser") {
        const { x, y } = getCursorPosition(canvasRef.current, event);
        const x1 = startX;
        const y1 = startY;
        const x2 = x;
        const y2 = y;
        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const right = Math.max(x1, x2);
        const bottom = Math.max(y1, y2);

        // Instead of removing elements, erase only the area by drawing a white rectangle
        const eraseElement = {
          id: Date.now() + Math.random(),
          type: "erase-rect",
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
        };
        setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
        setRedoStack([]);
        setElements((prev) => {
          if (socket)
            socket.emit("add-element", { roomId, element: eraseElement });
          return [...prev, eraseElement];
        });

        setIsDrawing(false);
        setEraserRect(null);
        setEraserPos(null);
        return;
      }

      if (tool === "pen") {
        contextRef.current.closePath();
        emitDrawEnd(roomId);

        const newElement = {
          id: Date.now() + Math.random(), // unique id
          type: "path",
          color,
          width: contextRef.current.lineWidth,
          points: currentPath,
        };
        setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
        setRedoStack([]);
        setElements((prev) => {
          // Emit to others
          if (socket)
            socket.emit("add-element", { roomId, element: newElement });
          return [...prev, newElement];
        });
        setCurrentPath([]);
        setIsDrawing(false);
        return;
      }

      if (tool === "line" || tool === "arrow") {
        const { x, y } = getCursorPosition(canvasRef.current, event);
        const newElement = {
          id: Date.now() + Math.random(),
          type: tool,
          x1: startX,
          y1: startY,
          x2: x,
          y2: y,
          color,
          width: contextRef.current.lineWidth,
        };

        setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
        setRedoStack([]);
        setElements((prev) => [...prev, newElement]);
        if (socket) {
          socket.emit("add-element", { roomId, element: newElement });
        }
        setIsDrawing(false);
        setPreviewShape(null);
        return;
      }
    };

    // Update text formatting state handler
    const handleTextFormatting = (updates) => {
      setTextFormatting((prev) => ({
        ...prev,
        ...updates,
      }));

      if (editingTextId) {
        setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
        setRedoStack([]);
        setElements((prev) =>
          prev.map((el) =>
            el.id === editingTextId ? { ...el, ...updates } : el
          )
        );
      }
    };

    // Helper: hit test for elements for dragging
    const hitTestElement = (x, y) => {
      // Check from topmost to bottom
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.type === "rectangle") {
          if (
            x >= el.x &&
            x <= el.x + el.width &&
            y >= el.y &&
            y <= el.y + el.height
          ) {
            return el;
          }
        } else if (el.type === "circle") {
          const dx = x - el.x;
          const dy = y - el.y;
          if (Math.sqrt(dx * dx + dy * dy) <= el.radius) {
            return el;
          }
        } else if (el.type === "text") {
          // For text, consider a larger hit area or its actual rendered bounds
          // This is a simplification; a more robust solution would measure text width/height
          if (
            x >= el.x &&
            x <= el.x + (el.width || 200) && // Approximate width for hit test
            y >= el.y &&
            y <= el.y + (el.height || 30) // Approximate height for hit test
          ) {
            return el;
          }
        } else if (el.type === "path") {
          // Check if near any point in path
          if (el.points && el.points.length > 1) {
            for (let j = 0; j < el.points.length - 1; j++) {
              const p1 = el.points[j];
              const p2 = el.points[j + 1];

              // Check distance to line segment
              const distToSegment = (px, py, x1, y1, x2, y2) => {
                const L2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
                if (L2 === 0) return Math.hypot(px - x1, py - y1); // p1 and p2 are the same point

                const t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / L2;
                let closestX, closestY;
                if (t < 0) {
                  closestX = x1;
                  closestY = y1;
                } else if (t > 1) {
                  closestX = x2;
                  closestY = y2;
                } else {
                  closestX = x1 + t * (x2 - x1);
                  closestY = y1 + t * (y2 - y1);
                }
                return Math.hypot(px - closestX, py - closestY);
              };

              if (distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) < 8) {
                return el; // Element found
              }
            }
          }
        } else if (el.type === "line" || el.type === "arrow") {
          // Check if near the line segment
          const { x1, y1, x2, y2 } = el;
          const length = Math.hypot(x2 - x1, y2 - y1);
          if (length === 0) continue; // Avoid division by zero

          const dot =
            ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (length * length);
          const closestX = x1 + dot * (x2 - x1);
          const closestY = y1 + dot * (y2 - y1);

          // Check if closest point is on segment
          const onSegment =
            closestX >= Math.min(x1, x2) &&
            closestX <= Math.max(x1, x2) &&
            closestY >= Math.min(y1, y2) &&
            closestY <= Math.max(y1, y2);

          if (!onSegment) continue;

          const dist = Math.hypot(closestX - x, closestY - y);
          if (dist < 8) {
            // Tolerance for line hit
            return el;
          }
        }
      }
      return null;
    };

    // Mouse down: start drag if over element (unless currently drawing)
    const handleCanvasMouseDown = (event) => {
      const { x, y } = getCursorPosition(canvasRef.current, event);

      if (tool === "drag") {
        const clickedElement = hitTestElement(x, y);
        if (clickedElement) {
          let originalX,
            originalY,
            originalElementX2 = 0,
            originalElementY2 = 0;
          if (clickedElement.type === "path") {
            originalX = clickedElement.points[0].x;
            originalY = clickedElement.points[0].y;
          } else if (
            clickedElement.type === "line" ||
            clickedElement.type === "arrow"
          ) {
            originalX = clickedElement.x1;
            originalY = clickedElement.y1;
            originalElementX2 = clickedElement.x2;
            originalElementY2 = clickedElement.y2;
          } else {
            originalX = clickedElement.x;
            originalY = clickedElement.y;
          }

          setDragging({
            isDragging: true,
            elementId: clickedElement.id,
            initialMouseX: x,
            initialMouseY: y,
            originalElementX: originalX,
            originalElementY: originalY,
            originalElementX2, // <-- set here
            originalElementY2,
          });
          // Bring the dragged element to the top
          setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
          setRedoStack([]);
          setElements((prev) => {
            const idx = prev.findIndex((e) => e.id === clickedElement.id);
            if (idx === -1) return prev;
            const arr = [...prev];
            const [dragged] = arr.splice(idx, 1);
            arr.push(dragged);
            return arr;
          });
          event.preventDefault();
          return;
        }
      } else {
        startDrawing(event);
      }
    };

    // Mouse move: handle drag or draw logic
    const handleCanvasMouseMove = (event) => {
      const { x, y } = getCursorPosition(canvasRef.current, event);

      // Drag logic
      if (dragging.isDragging && dragging.elementId) {
        const dx = x - dragging.initialMouseX;
        const dy = y - dragging.initialMouseY;

        setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
        setRedoStack([]);
        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== dragging.elementId) return el;

            if (
              el.type === "rectangle" ||
              el.type === "text" ||
              el.type === "circle"
            ) {
              return {
                ...el,
                x: dragging.originalElementX + dx,
                y: dragging.originalElementY + dy,
              };
            } else if (el.type === "path") {
              const offsetX = dragging.originalElementX + dx - el.points[0].x;
              const offsetY = dragging.originalElementY + dy - el.points[0].y;

              return {
                ...el,
                points: el.points.map((pt) => ({
                  x: pt.x + offsetX,
                  y: pt.y + offsetY,
                })),
              };
            } else if (el.type === "line" || el.type === "arrow") {
              // Use the correct property names for both endpoints
              return {
                ...el,
                x1: dragging.originalElementX + dx,
                y1: dragging.originalElementY + dy,
                x2: dragging.originalElementX2 + dx,
                y2: dragging.originalElementY2 + dy,
              };
            }
            return el;
          })
        );
        redrawCanvas();
        event.preventDefault();
        return;
      }

      // Drawing logic (only if not dragging)
      if (!dragging.isDragging) {
        draw(event);
        if (tool === "rectangle" || tool === "circle" || tool === "text") {
          redrawCanvas();
        }
      }
    };

    // Mouse up: stop dragging
    const handleCanvasMouseUp = (event) => {
      if (dragging.isDragging) {
        setDragging({
          isDragging: false,
          elementId: null,
          initialMouseX: 0,
          initialMouseY: 0,
          originalElementX: 0,
          originalElementY: 0,
          originalElementX2: 0,
          originalElementY2: 0,
        });
        // Emit updated element position to other clients
        const updatedElement = elements.find(
          (el) => el.id === dragging.elementId
        );
        if (updatedElement && socket) {
          socket.emit("update-element", { roomId, element: updatedElement });
        }
        event.preventDefault();
        return;
      }
      stopDrawing(event);
    };

    // Mouse leave: stop dragging if needed
    const handleCanvasMouseLeave = (event) => {
      if (dragging.isDragging) {
        setDragging({
          isDragging: false,
          elementId: null,
          initialMouseX: 0,
          initialMouseY: 0,
          originalElementX: 0,
          originalElementY: 0,
          originalElementX2: 0,
          originalElementY2: 0,
        });
        // Emit updated element position if it was dragged
        const updatedElement = elements.find(
          (el) => el.id === dragging.elementId
        );
        if (updatedElement && socket) {
          socket.emit("update-element", { roomId, element: updatedElement });
        }
      }
      setEraserPos(null);
      stopDrawing(event);
    };

    // Update the text editor JSX in return statement
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f0f0f0",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <canvas
          ref={canvasRef}
          className={
            tool === "eraser"
              ? ""
              : tool === "text"
              ? "text-cursor"
              : tool === "pen"
              ? "pen-cursor"
              : tool === "rectangle" || tool === "circle"
              ? "shape-cursor"
              : tool === "drag"
              ? "drag-cursor" // New cursor for drag tool
              : ""
          }
          style={{
            background: "#fff",
            border: "2px solid #e0e0e0",
            borderRadius: "8px",
            boxShadow: "0 2px 12px 0 rgba(0,0,0,0.07)",
            width: "98%",
            height: "98%",
            display: "block",
            margin: "auto",
            cursor: dragging.isDragging
              ? "grabbing"
              : tool === "text"
              ? "text"
              : tool === "eraser"
              ? "crosshair" // Eraser tool often uses crosshair
              : tool === "drag"
              ? "grab" // Grab cursor for drag tool
              : undefined,
            touchAction: "none", // Add this to prevent scrolling on touch devices
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
          onTouchStart={handleCanvasMouseDown} // Use same handlers for touch
          onTouchMove={handleCanvasMouseMove}
          onTouchEnd={handleCanvasMouseUp}
        />
        {/* Drag icons removed as dragging is now based on tool selection */}
        {editingTextId && (
          <div
            style={{
              position: "absolute",
              left: elements.find((e) => e.id === editingTextId)?.x || 0,
              top: elements.find((e) => e.id === editingTextId)?.y || 0,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              background: "white",
              padding: "12px",
              borderRadius: "8px",
              boxShadow: "0 3px 14px rgba(0,0,0,0.15)",
              zIndex: 1000,
              minWidth: "300px",
              border: "1px solid #e0e0e0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px",
                background: "#f8f9fa",
                borderRadius: "4px",
                marginBottom: "8px",
                cursor: "move",
              }}
            >
              <TextTool
                fontSize={textFormatting.fontSize}
                onFontSizeChange={(size) =>
                  handleTextFormatting({ fontSize: size })
                }
                fontFamily={textFormatting.fontFamily}
                onFontFamilyChange={(family) =>
                  handleTextFormatting({ fontFamily: family })
                }
                fontStyle={textFormatting.fontStyle}
                onFontStyleChange={(style) =>
                  handleTextFormatting({ fontStyle: style })
                }
              />
              <button
                onClick={() => setEditingTextId(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "20px",
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "4px",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                  e.currentTarget.style.color = "#333";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#666";
                }}
              >
                ×
              </button>
            </div>

            <textarea
              autoFocus
              value={pendingText}
              onChange={(e) => {
                setPendingText(e.target.value);
                setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
                setRedoStack([]);
                setElements((prev) =>
                  prev.map((el) =>
                    el.id === editingTextId
                      ? { ...el, text: e.target.value }
                      : el
                  )
                );
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditingTextId(null);
                }
              }}
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "12px",
                fontFamily: textFormatting.fontFamily,
                fontWeight: textFormatting.fontStyle.bold ? "bold" : "normal",
                fontStyle: textFormatting.fontStyle.italic
                  ? "italic"
                  : "normal",
                textDecoration: textFormatting.fontStyle.underline
                  ? "underline"
                  : "none",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                outline: "none",
                resize: "both",
                color: color,
                fontSize: `${textFormatting.fontSize}px`,
                lineHeight: "1.5",
                background: "#ffffff",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
              }}
            />
            <button
              style={{
                marginTop: "8px",
                padding: "8px 16px",
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "16px",
                alignSelf: "flex-end",
              }}
              onClick={() => {
                setEditingTextId(null);
                if (pendingText.trim()) {
                  const id = Date.now();
                  const newTextElement = {
                    id,
                    type: "text",
                    x: startX,
                    y: startY,
                    width: 100, // Set a default width or calculate based on content
                    height: 50, // Set a default height or calculate based on content
                    text: pendingText,
                    color,
                    fontSize: `${Math.max(14, width * 5)}px`, // Use tool width as a factor for initial font size
                    fontFamily: textFormatting.fontFamily,
                    fontStyle: textFormatting.fontStyle,
                  };
                  setUndoStack((prevUndoStack) => [...prevUndoStack, elements]);
                  setRedoStack([]);
                  setElements((prev) => [...prev, newTextElement]);
                  if (socket) {
                    socket.emit("add-element", {
                      roomId,
                      element: newTextElement,
                    });
                  }
                  setPendingText(""); // Clear the input after saving
                }
              }}
            >
              Done
            </button>
          </div>
        )}
      </Box>
    );
  }
);

export default Canvas;
