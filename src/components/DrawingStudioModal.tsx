import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Save,
  PenTool,
  Pencil,
  Paintbrush,
  Highlighter,
  Eraser,
  Sparkles,
  Check,
  Paperclip,
  Pipette,
  PaintBucket,
  Type,
  Smile,
  Minus,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Heart,
  Star,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { PaperStyle } from '../types';
import ImageCompression from '../utils/imageCompression';
import SecureStorage from '../utils/storage';

interface DrawingStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachToEntry?: (imageDataUrl: string) => void;
  onSaveArtwork?: (artwork: { id?: string; title: string; imageData: string; paperStyle: PaperStyle }) => void;
  initialTitle?: string;
  initialPaperStyle?: PaperStyle;
  initialImage?: string;
  artworkId?: string; // If updating an existing artwork
  userId?: string;
  source?: 'dashboard' | 'editor';
}

type ToolType =
  | 'pen'
  | 'pencil'
  | 'brush'
  | 'highlighter'
  | 'glow'
  | 'spray'
  | 'calligraphy'
  | 'rainbow'
  | 'eraser'
  | 'fill'
  | 'eyedropper'
  | 'text'
  | 'sticker'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'heart'
  | 'star'
  | 'bubble';

type LineDashStyle = 'solid' | 'dashed' | 'dotted';
type TextFontFamily = 'Caveat, cursive' | 'Inter, sans-serif' | 'Georgia, serif' | 'Courier New, monospace';

const STICKER_LIST = [
  '⭐', '✨', '❤️', '🌸', '☕', '🐱', '🌿', '☀️', '🌙',
  '🎵', '☁️', '🎂', '🦋', '🎨', '🌈', '🐾', '🔥', '💎', '💡', '🎉'
];

const PRESET_COLORS = [
  '#0f172a', // Slate black
  '#475569', // Muted slate
  '#94a3b8', // Light slate
  '#e11d48', // Crimson rose
  '#f97316', // Sunset orange
  '#eab308', // Warm amber
  '#10b981', // Emerald green
  '#06b6d4', // Cyan
  '#3b82f6', // Ocean blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#78350f', // Warm earthy brown
  '#ffffff', // Chalk white
];

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 650;

const DrawingStudioModal: React.FC<DrawingStudioModalProps> = ({
  isOpen,
  onClose,
  onAttachToEntry,
  onSaveArtwork,
  initialTitle = '',
  initialPaperStyle = 'blank',
  initialImage,
  artworkId,
  userId,
  source
}) => {
  const [title, setTitle] = useState(
    initialTitle || `Artwork ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  );
  const [paperStyle, setPaperStyle] = useState<PaperStyle>(initialPaperStyle);
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#0f172a');
  const [brushSize, setBrushSize] = useState(6);
  const [opacity, setOpacity] = useState(1);
  const [lineDash, setLineDash] = useState<LineDashStyle>('solid');
  const [fillShape, setFillShape] = useState(false);
  const [saveToGalleryAlso, setSaveToGalleryAlso] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Sticker & Text Tool states
  const [selectedSticker, setSelectedSticker] = useState('⭐');
  const [customText, setCustomText] = useState('My Diary Memory');
  const [textFont, setTextFont] = useState<TextFontFamily>('Caveat, cursive');

  // Undo/Redo Stacks
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Canvas Refs
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Drawing state
  const isDrawingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rainbowHueRef = useRef<number>(0);

  // Render the chosen paper background onto bgCanvas
  const renderBackground = useCallback(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (paperStyle === 'blank') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (paperStyle === 'ruled') {
      ctx.fillStyle = '#fcfbf8';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(85, 0);
      ctx.lineTo(85, CANVAS_HEIGHT);
      ctx.stroke();

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let y = 60; y < CANVAS_HEIGHT; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
    } else if (paperStyle === 'grid') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#e8edf3';
      ctx.lineWidth = 1;
      const gridSize = 24;

      for (let x = gridSize; x < CANVAS_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = gridSize; y < CANVAS_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
    } else if (paperStyle === 'dots') {
      ctx.fillStyle = '#fafaf9';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#94a3b8';
      const dotSpacing = 24;
      for (let x = dotSpacing; x < CANVAS_WIDTH; x += dotSpacing) {
        for (let y = dotSpacing; y < CANVAS_HEIGHT; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (paperStyle === 'vintage') {
      const grad = ctx.createRadialGradient(
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 80,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.75
      );
      grad.addColorStop(0, '#fef9e7');
      grad.addColorStop(0.7, '#f7eed2');
      grad.addColorStop(1, '#e8dcba');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#cfbd97';
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, CANVAS_WIDTH - 32, CANVAS_HEIGHT - 32);
    } else if (paperStyle === 'dark') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const darkGrid = 28;
      for (let x = darkGrid; x < CANVAS_WIDTH; x += darkGrid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = darkGrid; y < CANVAS_HEIGHT; y += darkGrid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
    }
  }, [paperStyle]);

  // Adjust default color when switching to dark paper style
  useEffect(() => {
    if (paperStyle === 'dark' && color === '#0f172a') {
      setColor('#ffffff');
    } else if (paperStyle !== 'dark' && color === '#ffffff') {
      setColor('#0f172a');
    }
  }, [paperStyle, color]);

  // Auto-save draft of in-progress artwork to sessionStorage
  const saveDraft = useCallback(() => {
    if (!userId) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    try {
      const imageData = canvas.toDataURL('image/png');
      SecureStorage.saveArtworkDraft({
        userId,
        artworkId,
        title,
        paperStyle,
        imageData,
        isOpen: true,
        source: source || (onAttachToEntry ? 'editor' : 'dashboard')
      });
    } catch (err) {
      console.warn('Could not save artwork draft:', err);
    }
  }, [userId, artworkId, title, paperStyle, source, onAttachToEntry]);

  // Save state to undo history
  const pushHistory = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const snapshot = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const next = [...trimmed, snapshot];
      if (next.length > 25) {
        next.shift();
      }
      return next;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 24));
    setTimeout(saveDraft, 50);
  }, [historyIndex, saveDraft]);

  // Protect against accidental refresh or tab close
  useEffect(() => {
    if (!isOpen) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (historyIndex > 0) {
        saveDraft();
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOpen, historyIndex, saveDraft]);

  // Initialize canvas on mount / open
  useEffect(() => {
    if (!isOpen) return;

    renderBackground();

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (initialImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const initialSnapshot = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        setHistory([initialSnapshot]);
        setHistoryIndex(0);
      };
      img.src = initialImage;
    } else {
      const blankSnapshot = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      setHistory([blankSnapshot]);
      setHistoryIndex(0);
    }
  }, [isOpen, renderBackground, initialImage]);

  // Re-render paper background when style changes
  useEffect(() => {
    if (isOpen) {
      renderBackground();
    }
  }, [isOpen, paperStyle, renderBackground]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetIndex = historyIndex - 1;
    const targetState = history[targetIndex];
    if (targetState) {
      ctx.putImageData(targetState, 0, 0);
      setHistoryIndex(targetIndex);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetIndex = historyIndex + 1;
    const targetState = history[targetIndex];
    if (targetState) {
      ctx.putImageData(targetState, 0, 0);
      setHistoryIndex(targetIndex);
    }
  }, [history, historyIndex]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === '[') {
        setBrushSize((s) => Math.max(1, s - 2));
      } else if (e.key === ']') {
        setBrushSize((s) => Math.min(50, s + 2));
      } else if (e.key.toLowerCase() === 'b') {
        setActiveTool('pen');
      } else if (e.key.toLowerCase() === 'e') {
        setActiveTool('eraser');
      } else if (e.key.toLowerCase() === 'g') {
        setActiveTool('glow');
      } else if (e.key.toLowerCase() === 'f') {
        setActiveTool('fill');
      } else if (e.key.toLowerCase() === 'i') {
        setActiveTool('eyedropper');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleUndo, handleRedo]);

  // Clear canvas
  const handleClear = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    pushHistory();
  };

  // Calculate coordinates relative to 1000x650 coordinate system
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current || drawingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Setup Dash Style
  const applyDash = (ctx: CanvasRenderingContext2D) => {
    if (lineDash === 'dashed') {
      ctx.setLineDash([brushSize * 2.5, brushSize * 1.5]);
    } else if (lineDash === 'dotted') {
      ctx.setLineDash([brushSize * 0.7, brushSize * 1.8]);
    } else {
      ctx.setLineDash([]);
    }
  };

  // Apply tool styling to 2D context
  const applyToolStyle = (ctx: CanvasRenderingContext2D, tool: ToolType) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    applyDash(ctx);

    if (tool === 'pencil') {
      ctx.lineWidth = Math.max(1, brushSize * 0.7);
      ctx.globalAlpha = Math.min(opacity, 0.85);
    } else if (tool === 'brush') {
      ctx.lineWidth = brushSize * 1.6;
      ctx.globalAlpha = Math.min(opacity, 0.45);
    } else if (tool === 'highlighter') {
      ctx.lineWidth = brushSize * 2.4;
      ctx.globalAlpha = 0.35;
      ctx.lineCap = 'square';
      ctx.setLineDash([]);
    } else if (tool === 'glow') {
      ctx.shadowColor = color;
      ctx.shadowBlur = Math.max(8, brushSize * 2.5);
      ctx.lineWidth = Math.max(2, brushSize);
      ctx.globalAlpha = 1;
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2.5;
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }
  };

  // Eyedropper Color Picker implementation
  const pickColorAt = (x: number, y: number) => {
    const compCanvas = document.createElement('canvas');
    compCanvas.width = CANVAS_WIDTH;
    compCanvas.height = CANVAS_HEIGHT;
    const compCtx = compCanvas.getContext('2d');
    if (!compCtx) return;

    if (bgCanvasRef.current) compCtx.drawImage(bgCanvasRef.current, 0, 0);
    if (drawingCanvasRef.current) compCtx.drawImage(drawingCanvasRef.current, 0, 0);

    const px = Math.min(CANVAS_WIDTH - 1, Math.max(0, Math.round(x)));
    const py = Math.min(CANVAS_HEIGHT - 1, Math.max(0, Math.round(y)));
    const pixel = compCtx.getImageData(px, py, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
    setColor(hex);
    setActiveTool('pen');
  };

  // Spray Paint / Airbrush implementation
  const drawSpray = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) => {
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity * 0.6;
    const density = Math.max(15, Math.round(radius * 3));
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      ctx.fillRect(px, py, 1.3, 1.3);
    }
  };

  // Calligraphy Stroke implementation
  const drawCalligraphy = (
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number }
  ) => {
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    const halfWidth = brushSize * 0.8;
    // Angle fixed at 45 degrees
    const angle = Math.PI / 4;
    const dx = Math.cos(angle) * halfWidth;
    const dy = -Math.sin(angle) * halfWidth;

    ctx.beginPath();
    ctx.moveTo(from.x - dx, from.y - dy);
    ctx.lineTo(from.x + dx, from.y + dy);
    ctx.lineTo(to.x + dx, to.y + dy);
    ctx.lineTo(to.x - dx, to.y - dy);
    ctx.closePath();
    ctx.fill();
  };

  // Flood Fill / Paint Bucket implementation (BFS)
  const performFloodFill = (startX: number, startY: number) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imgData.data;

    const sx = Math.round(startX);
    const sy = Math.round(startY);
    if (sx < 0 || sx >= CANVAS_WIDTH || sy < 0 || sy >= CANVAS_HEIGHT) return;

    const startIdx = (sy * CANVAS_WIDTH + sx) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];

    // Compute fill RGBA
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.fillStyle = color;
    tempCtx.fillRect(0, 0, 1, 1);
    const fillPixel = tempCtx.getImageData(0, 0, 1, 1).data;
    const fillR = fillPixel[0];
    const fillG = fillPixel[1];
    const fillB = fillPixel[2];
    const fillA = Math.round(opacity * 255);

    if (
      Math.abs(targetR - fillR) < 8 &&
      Math.abs(targetG - fillG) < 8 &&
      Math.abs(targetB - fillB) < 8 &&
      Math.abs(targetA - fillA) < 8
    ) {
      return;
    }

    const matchesTarget = (idx: number) => {
      return (
        Math.abs(data[idx] - targetR) <= 35 &&
        Math.abs(data[idx + 1] - targetG) <= 35 &&
        Math.abs(data[idx + 2] - targetB) <= 35 &&
        Math.abs(data[idx + 3] - targetA) <= 35
      );
    };

    const queue: [number, number][] = [[sx, sy]];
    const visited = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
    visited[sy * CANVAS_WIDTH + sx] = 1;

    while (queue.length > 0) {
      const [cx, cy] = queue.pop()!;
      const idx = (cy * CANVAS_WIDTH + cx) * 4;

      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = fillA;

      const neighbors: [number, number][] = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < CANVAS_WIDTH && ny >= 0 && ny < CANVAS_HEIGHT) {
          const nPos = ny * CANVAS_WIDTH + nx;
          if (!visited[nPos]) {
            visited[nPos] = 1;
            if (matchesTarget(nPos * 4)) {
              queue.push([nx, ny]);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    pushHistory();
  };

  // Draw Shape Helper
  const drawShape = (
    ctx: CanvasRenderingContext2D,
    tool: ToolType,
    start: { x: number; y: number },
    end: { x: number; y: number },
    fill: boolean
  ) => {
    applyToolStyle(ctx, tool);

    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (tool === 'arrow') {
      const headLength = Math.max(12, brushSize * 3);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // Arrow head
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLength * Math.cos(angle - Math.PI / 6),
        end.y - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        end.x - headLength * Math.cos(angle + Math.PI / 6),
        end.y - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    } else if (tool === 'rectangle') {
      const width = end.x - start.x;
      const height = end.y - start.y;
      ctx.beginPath();
      ctx.rect(start.x, start.y, width, height);
      if (fill) ctx.fill();
      ctx.stroke();
    } else if (tool === 'circle') {
      const radiusX = Math.abs(end.x - start.x) / 2;
      const radiusY = Math.abs(end.y - start.y) / 2;
      const centerX = Math.min(start.x, end.x) + radiusX;
      const centerY = Math.min(start.y, end.y) + radiusY;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, Math.max(1, radiusX), Math.max(1, radiusY), 0, 0, Math.PI * 2);
      if (fill) ctx.fill();
      ctx.stroke();
    } else if (tool === 'triangle') {
      const bx = Math.min(start.x, end.x);
      const by = Math.min(start.y, end.y);
      const bw = Math.abs(end.x - start.x);
      const bh = Math.abs(end.y - start.y);

      ctx.beginPath();
      ctx.moveTo(bx + bw / 2, by);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx, by + bh);
      ctx.closePath();
      if (fill) ctx.fill();
      ctx.stroke();
    } else if (tool === 'heart') {
      const bx = Math.min(start.x, end.x);
      const by = Math.min(start.y, end.y);
      const bw = Math.abs(end.x - start.x);
      const bh = Math.abs(end.y - start.y);

      ctx.beginPath();
      ctx.moveTo(bx + bw / 2, by + bh * 0.3);
      ctx.bezierCurveTo(bx + bw / 2, by, bx, by, bx, by + bh * 0.375);
      ctx.bezierCurveTo(bx, by + bh * 0.6, bx + bw / 2, by + bh * 0.85, bx + bw / 2, by + bh);
      ctx.bezierCurveTo(bx + bw / 2, by + bh * 0.85, bx + bw, by + bh * 0.6, bx + bw, by + bh * 0.375);
      ctx.bezierCurveTo(bx + bw, by, bx + bw / 2, by, bx + bw / 2, by + bh * 0.3);
      ctx.closePath();
      if (fill) ctx.fill();
      ctx.stroke();
    } else if (tool === 'star') {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rOuter = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
      const rInner = rOuter * 0.45;
      const spikes = 5;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - rOuter);
      for (let i = 0; i < spikes; i++) {
        let sx = cx + Math.cos(rot) * rOuter;
        let sy = cy + Math.sin(rot) * rOuter;
        ctx.lineTo(sx, sy);
        rot += step;
        sx = cx + Math.cos(rot) * rInner;
        sy = cy + Math.sin(rot) * rInner;
        ctx.lineTo(sx, sy);
        rot += step;
      }
      ctx.lineTo(cx, cy - rOuter);
      ctx.closePath();
      if (fill) ctx.fill();
      ctx.stroke();
    } else if (tool === 'bubble') {
      const bx = Math.min(start.x, end.x);
      const by = Math.min(start.y, end.y);
      const bw = Math.max(30, Math.abs(end.x - start.x));
      const bh = Math.max(20, Math.abs(end.y - start.y));
      const r = Math.min(16, bh / 3);

      ctx.beginPath();
      ctx.moveTo(bx + r, by);
      ctx.lineTo(bx + bw - r, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
      ctx.lineTo(bx + bw, by + bh - r);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
      ctx.lineTo(bx + Math.min(bw * 0.5, 60), by + bh);
      ctx.lineTo(bx + Math.min(bw * 0.35, 40), by + bh + Math.min(24, bh * 0.3));
      ctx.lineTo(bx + Math.min(bw * 0.3, 30), by + bh);
      ctx.lineTo(bx + r, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.closePath();
      if (fill) ctx.fill();
      ctx.stroke();
    }
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getCoordinates(e);

    // Eyedropper tool
    if (activeTool === 'eyedropper') {
      pickColorAt(pos.x, pos.y);
      return;
    }

    // Paint Bucket Fill tool
    if (activeTool === 'fill') {
      performFloodFill(pos.x, pos.y);
      return;
    }

    // Sticker Stamp tool
    if (activeTool === 'sticker') {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = Math.max(22, brushSize * 4.5);
      ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedSticker, pos.x, pos.y);
      pushHistory();
      return;
    }

    // Text Tool
    if (activeTool === 'text') {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const fontSize = Math.max(16, brushSize * 3);
      ctx.font = `${fontSize}px ${textFont}`;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(customText, pos.x, pos.y);
      pushHistory();
      return;
    }

    isDrawingRef.current = true;
    startPosRef.current = pos;
    lastPosRef.current = pos;

    const isShape = ['line', 'arrow', 'rectangle', 'circle', 'triangle', 'heart', 'star', 'bubble'].includes(
      activeTool
    );

    if (!isShape) {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (activeTool === 'spray') {
        drawSpray(ctx, pos.x, pos.y, brushSize * 2);
      } else if (activeTool === 'calligraphy') {
        drawCalligraphy(ctx, pos, pos);
      } else {
        applyToolStyle(ctx, activeTool);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const currentPos = getCoordinates(e);

    // Live Sticker/Text preview under cursor when idle
    if (!isDrawingRef.current && (activeTool === 'sticker' || activeTool === 'text')) {
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const overlayCtx = overlayCanvas.getContext('2d');
        if (overlayCtx) {
          overlayCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          if (activeTool === 'sticker') {
            const size = Math.max(22, brushSize * 4.5);
            overlayCtx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
            overlayCtx.textAlign = 'center';
            overlayCtx.textBaseline = 'middle';
            overlayCtx.globalAlpha = 0.7;
            overlayCtx.fillText(selectedSticker, currentPos.x, currentPos.y);
          } else {
            const fontSize = Math.max(16, brushSize * 3);
            overlayCtx.font = `${fontSize}px ${textFont}`;
            overlayCtx.fillStyle = color;
            overlayCtx.globalAlpha = 0.7;
            overlayCtx.textAlign = 'left';
            overlayCtx.textBaseline = 'top';
            overlayCtx.fillText(customText, currentPos.x, currentPos.y);
          }
        }
      }
      return;
    }

    if (!isDrawingRef.current) return;
    e.preventDefault();

    const isShape = ['line', 'arrow', 'rectangle', 'circle', 'triangle', 'heart', 'star', 'bubble'].includes(
      activeTool
    );

    if (isShape) {
      const overlayCanvas = overlayCanvasRef.current;
      if (!overlayCanvas) return;
      const overlayCtx = overlayCanvas.getContext('2d');
      if (!overlayCtx) return;

      overlayCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawShape(overlayCtx, activeTool, startPosRef.current, currentPos, fillShape);
    } else {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (activeTool === 'spray') {
        drawSpray(ctx, currentPos.x, currentPos.y, brushSize * 2);
      } else if (activeTool === 'calligraphy') {
        drawCalligraphy(ctx, lastPosRef.current, currentPos);
      } else if (activeTool === 'rainbow') {
        rainbowHueRef.current = (rainbowHueRef.current + 4) % 360;
        ctx.strokeStyle = `hsl(${rainbowHueRef.current}, 95%, 55%)`;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      } else {
        applyToolStyle(ctx, activeTool);
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      }

      lastPosRef.current = currentPos;
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    e.preventDefault();
    const endPos = getCoordinates(e);

    const isShape = ['line', 'arrow', 'rectangle', 'circle', 'triangle', 'heart', 'star', 'bubble'].includes(
      activeTool
    );

    if (isShape) {
      const canvas = drawingCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawShape(ctx, activeTool, startPosRef.current, endPos, fillShape);
        }
      }

      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const overlayCtx = overlayCanvas.getContext('2d');
        overlayCtx?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }

    pushHistory();
  };

  // Generate flattened composite image
  const getCompositeImageDataUrl = async (): Promise<string> => {
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = CANVAS_WIDTH;
    compositeCanvas.height = CANVAS_HEIGHT;
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get composite canvas context');

    if (bgCanvasRef.current) {
      ctx.drawImage(bgCanvasRef.current, 0, 0);
    }
    if (drawingCanvasRef.current) {
      ctx.drawImage(drawingCanvasRef.current, 0, 0);
    }

    const rawDataUrl = compositeCanvas.toDataURL('image/png', 0.95);
    const compressed = await ImageCompression.compressImage(rawDataUrl, 1600, 1040, 0.85);
    return compressed;
  };

  // Download directly to user computer
  const handleDownload = async () => {
    try {
      const dataUrl = await getCompositeImageDataUrl();
      const link = document.createElement('a');
      link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'artwork'}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download artwork:', err);
    }
  };

  // Save Artwork
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const imageData = await getCompositeImageDataUrl();

      if (onAttachToEntry) {
        onAttachToEntry(imageData);
        if (saveToGalleryAlso && onSaveArtwork) {
          onSaveArtwork({
            id: artworkId,
            title: title.trim() || 'Diary Sketch',
            imageData,
            paperStyle
          });
        }
        if (userId) {
          SecureStorage.clearArtworkDraft(userId);
        }
        setSaveSuccessMsg('Attached to entry!');
        setTimeout(() => {
          onClose();
        }, 600);
      } else if (onSaveArtwork) {
        onSaveArtwork({
          id: artworkId,
          title: title.trim() || 'My Artwork',
          imageData,
          paperStyle
        });
        if (userId) {
          SecureStorage.clearArtworkDraft(userId);
        }
        setSaveSuccessMsg(artworkId ? 'Changes Saved!' : 'Saved to Art Gallery!');
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err) {
      console.error('Failed to save artwork:', err);
      alert('Failed to save artwork. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (historyIndex > 0) {
      if (window.confirm('Do you want to discard your unsaved artwork changes?')) {
        if (userId) {
          SecureStorage.clearArtworkDraft(userId);
        }
        onClose();
      }
    } else {
      if (userId) {
        SecureStorage.clearArtworkDraft(userId);
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-6xl max-h-[96vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-sm border-b border-purple-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Art..."
                  className="bg-white/10 hover:bg-white/20 focus:bg-white/25 text-white placeholder-white/50 text-base font-semibold px-2 py-0.5 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all max-w-[200px] sm:max-w-[280px]"
                />
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                {artworkId ? 'Editing Saved Artwork' : onAttachToEntry ? 'Diary Sketch & Illustration Studio' : 'Digital Art Studio & Sketchbook'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowShortcutsModal(true)}
              title="Keyboard Shortcuts"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <div className="h-5 w-px bg-white/20 mx-0.5" />
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              title="Clear Canvas"
              className="p-2 rounded-lg bg-white/10 hover:bg-red-500/80 text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="h-5 w-px bg-white/20 mx-0.5" />
            <button
              onClick={handleDownload}
              title="Download PNG to Device"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs sm:text-sm font-semibold shadow-md transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saveSuccessMsg ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{saveSuccessMsg}</span>
                </>
              ) : onAttachToEntry ? (
                <>
                  <Paperclip className="w-4 h-4" />
                  <span>{isSaving ? 'Attaching...' : 'Attach to Entry'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : artworkId ? 'Update Art' : 'Save Artwork'}</span>
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Body: Tools + Canvas */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-slate-100">
          
          {/* Left Toolbar */}
          <div className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-3 lg:p-4 flex flex-col space-y-4 overflow-y-auto max-h-56 lg:max-h-[calc(96vh-65px)]">
            
            {/* Brushes & Pens */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Brushes & Media
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'pen', label: 'Pen', icon: PenTool },
                  { id: 'pencil', label: 'Pencil', icon: Pencil },
                  { id: 'brush', label: 'Paint', icon: Paintbrush },
                  { id: 'highlighter', label: 'Marker', icon: Highlighter },
                  { id: 'glow', label: 'Glow', icon: Sparkles },
                  { id: 'spray', label: 'Spray', icon: Sparkles },
                  { id: 'calligraphy', label: 'Chisel', icon: PenTool },
                  { id: 'rainbow', label: 'Rainbow', icon: Sparkles },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTool === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTool(t.id as ToolType)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-600/30'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={t.label}
                    >
                      <Icon className="w-4 h-4 mb-0.5" />
                      <span className="text-[11px]">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smart Tools: Fill, Pipette, Eraser, Text, Sticker */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Studio Utilities
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 'fill', label: 'Fill', icon: PaintBucket },
                  { id: 'eyedropper', label: 'Picker', icon: Pipette },
                  { id: 'eraser', label: 'Eraser', icon: Eraser },
                  { id: 'text', label: 'Text', icon: Type },
                  { id: 'sticker', label: 'Stamp', icon: Smile },
                ].map((u) => {
                  const Icon = u.icon;
                  const isActive = activeTool === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setActiveTool(u.id as ToolType)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-600/30'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={u.label}
                    >
                      <Icon className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px]">{u.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sticker Drawer (visible when sticker tool is active) */}
            {activeTool === 'sticker' && (
              <div className="bg-purple-50/70 border border-purple-200/80 p-2.5 rounded-xl animate-fade-in">
                <label className="text-[11px] font-bold text-purple-900 block mb-1.5">
                  Pick a Stamp:
                </label>
                <div className="grid grid-cols-5 gap-1 text-lg">
                  {STICKER_LIST.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedSticker(st)}
                      className={`p-1.5 rounded-lg hover:scale-125 transition-transform ${
                        selectedSticker === st ? 'bg-purple-200 ring-2 ring-purple-500' : 'hover:bg-purple-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-purple-700 mt-2 italic text-center">
                  Click on canvas to stamp {selectedSticker} (Adjust size via slider below)
                </p>
              </div>
            )}

            {/* Text Tool Panel (visible when text tool is active) */}
            {activeTool === 'text' && (
              <div className="bg-purple-50/70 border border-purple-200/80 p-2.5 rounded-xl space-y-2 animate-fade-in">
                <label className="text-[11px] font-bold text-purple-900 block">
                  Text to Stamp:
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Type text..."
                  className="w-full px-2 py-1 text-xs border border-purple-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <div className="flex gap-1">
                  {[
                    { id: 'Caveat, cursive', label: 'Script' },
                    { id: 'Inter, sans-serif', label: 'Clean' },
                    { id: 'Georgia, serif', label: 'Serif' },
                    { id: 'Courier New, monospace', label: 'Mono' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTextFont(f.id as TextFontFamily)}
                      className={`flex-1 py-1 text-[10px] rounded border transition-colors ${
                        textFont === f.id
                          ? 'bg-purple-600 text-white border-purple-600 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-purple-700 italic text-center">
                  Click on canvas to place text
                </p>
              </div>
            )}

            {/* Shapes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Shapes & Stencils
                </label>
                <button
                  type="button"
                  onClick={() => setFillShape(!fillShape)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                    fillShape ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {fillShape ? 'Fill: On' : 'Fill: Off'}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'line', label: 'Line', icon: Minus },
                  { id: 'arrow', label: 'Arrow', icon: ArrowRight },
                  { id: 'rectangle', label: 'Box', icon: Square },
                  { id: 'circle', label: 'Circle', icon: Circle },
                  { id: 'triangle', label: 'Triangle', icon: Triangle },
                  { id: 'heart', label: 'Heart', icon: Heart },
                  { id: 'star', label: 'Star', icon: Star },
                  { id: 'bubble', label: 'Bubble', icon: MessageSquare },
                ].map((s) => {
                  const Icon = s.icon;
                  const isActive = activeTool === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveTool(s.id as ToolType)}
                      className={`flex items-center justify-center py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-600/30'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={s.label}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stroke Line Style */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Stroke Style
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'solid', label: 'Solid ──' },
                  { id: 'dashed', label: 'Dashed ╌' },
                  { id: 'dotted', label: 'Dotted ┈' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setLineDash(d.id as LineDashStyle)}
                    className={`py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                      lineDash === d.id
                        ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Color Palette
                </label>
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] text-slate-400 font-mono">{color}</span>
                  <div
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-inner"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border transition-transform ${
                      color.toLowerCase() === c.toLowerCase()
                        ? 'scale-125 border-purple-600 ring-2 ring-purple-400/50'
                        : 'border-slate-300 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0"
                />
                <span className="text-xs text-slate-600 font-medium">Custom Color Picker</span>
              </div>
            </div>

            {/* Brush Size & Opacity */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Size: {brushSize}px</span>
                  <div
                    className="rounded-full bg-slate-900"
                    style={{
                      width: Math.min(24, Math.max(4, brushSize)),
                      height: Math.min(24, Math.max(4, brushSize))
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="48"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Opacity: {Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Paper Backgrounds */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Paper Style
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-medium">
                {[
                  { id: 'blank', label: 'Blank' },
                  { id: 'ruled', label: 'Ruled' },
                  { id: 'grid', label: 'Grid' },
                  { id: 'dots', label: 'Dots' },
                  { id: 'vintage', label: 'Vintage' },
                  { id: 'dark', label: 'Dark' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPaperStyle(p.id as PaperStyle)}
                    className={`py-1.5 px-2 rounded-lg border transition-all ${
                      paperStyle === p.id
                        ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional checkbox if attaching to entry */}
            {onAttachToEntry && onSaveArtwork && (
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveToGalleryAlso}
                    onChange={(e) => setSaveToGalleryAlso(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Also save copy to Art Gallery</span>
                </label>
              </div>
            )}
          </div>

          {/* Center Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden relative">
            <div
              className="relative w-full max-w-[1000px] aspect-[1000/650] rounded-xl overflow-hidden shadow-xl border border-slate-300 bg-white cursor-crosshair select-none"
              style={{ touchAction: 'none' }}
            >
              {/* Layer 1: Paper Background Canvas */}
              <canvas
                ref={bgCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Layer 2: Main User Drawing Canvas */}
              <canvas
                ref={drawingCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Layer 3: Interactive Overlay Canvas (handles pointer events and live shape previews) */}
              <canvas
                ref={overlayCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <span>Keyboard Shortcuts</span>
              </h3>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Undo</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border rounded font-mono font-bold">Ctrl + Z</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Redo</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border rounded font-mono font-bold">Ctrl + Y</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Brush Size +/-</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border rounded font-mono font-bold">[ or ]</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Pen Brush</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border rounded font-mono font-bold">B</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Eraser</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border rounded font-mono font-bold">E</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Glow Brush</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border rounded font-mono font-bold">G</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Paint Bucket Fill</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border rounded font-mono font-bold">F</kbd>
              </div>
              <div className="flex justify-between py-1">
                <span>Color Eyedropper</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border rounded font-mono font-bold">I</kbd>
              </div>
            </div>
            <button
              onClick={() => setShowShortcutsModal(false)}
              className="mt-6 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingStudioModal;
