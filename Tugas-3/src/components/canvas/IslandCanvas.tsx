import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { Play, Trash2, Grid3x3, SkipForward, Activity, GripHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

const ISLAND_PALETTE = [
  '#00f0ff', '#a855f7', '#10b981', '#f97316', '#ec4899',
  '#facc15', '#3b82f6', '#ef4444', '#06b6d4', '#84cc16',
  '#e879f9', '#fb923c', '#2dd4bf', '#f472b6', '#a3e635',
  '#c084fc',
];

/* ── Draggable + collapsible floating panel ── */
function useDraggable(initialX: number, initialY: number) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const nx = e.clientX - offset.current.x;
    const ny = e.clientY - offset.current.y;
    setPos({ x: nx, y: ny });
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return { pos, setPos, dragHandlers: { onPointerDown, onPointerMove, onPointerUp } };
}

export default function IslandCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const islandGrid = useGraphStore((s) => s.islandGrid);
  const islandColors = useGraphStore((s) => s.islandColors);
  const islandCount = useGraphStore((s) => s.islandCount);
  const islandComponentSizes = useGraphStore((s) => s.islandComponentSizes);
  const islandComponents = useGraphStore((s) => s.islandComponents);
  const isIslandAnimating = useGraphStore((s) => s.isIslandAnimating);
  const islandAnimationSpeed = useGraphStore((s) => s.islandAnimationSpeed);
  const islandAnimationIndex = useGraphStore((s) => s.islandAnimationIndex);
  const islandAnimationSteps = useGraphStore((s) => s.islandAnimationSteps);
  const paintIslandCell = useGraphStore((s) => s.paintIslandCell);
  const clearIslandGrid = useGraphStore((s) => s.clearIslandGrid);
  const runIslandCount = useGraphStore((s) => s.runIslandCount);
  const setIslandGrid = useGraphStore((s) => s.setIslandGrid);
  const advanceIslandAnimation = useGraphStore((s) => s.advanceIslandAnimation);
  const skipIslandAnimation = useGraphStore((s) => s.skipIslandAnimation);
  const setIslandAnimationSpeed = useGraphStore((s) => s.setIslandAnimationSpeed);

  const paintingRef = useRef(false);
  const paintValueRef = useRef(true);
  const [gridRows, setGridRows] = useState(islandGrid.rows.toString());
  const [gridCols, setGridCols] = useState(islandGrid.cols.toString());
  const [collapsed, setCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(420);

  const { pos, dragHandlers } = useDraggable(16, 16);

  const rows = islandGrid.rows;
  const cols = islandGrid.cols;
  const PADDING = 30;
  const MAX_CELL_SIZE = 60;

  const computeLayout = useCallback(
    (cw: number, ch: number) => {
      const cellSize = Math.min(
        (cw - PADDING * 2) / cols,
        (ch - PADDING * 2) / rows,
        MAX_CELL_SIZE,
      );
      const gridW = cols * cellSize;
      const gridH = rows * cellSize;
      const startX = (cw - gridW) / 2;
      const startY = (ch - gridH) / 2;
      return { cellSize, startX, startY, gridW, gridH };
    },
    [cols, rows]
  );

  const getCellFromEvent = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;

      const { cellSize, startX, startY } = computeLayout(cw, ch);

      const col = Math.floor((x - startX) / cellSize);
      const row = Math.floor((y - startY) / cellSize);

      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        return { row, col };
      }
      return null;
    },
    [computeLayout, rows, cols]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    // Background
    ctx.fillStyle = '#080c1f';
    ctx.fillRect(0, 0, cw, ch);

    // Subtle dot grid in background
    ctx.fillStyle = 'rgba(255,255,255,0.015)';
    for (let x = 0; x < cw; x += 20) {
      for (let y = 0; y < ch; y += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const { cellSize, startX, startY, gridW, gridH } = computeLayout(cw, ch);

    // Draw cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        const idx = r * cols + c;
        const isLand = islandGrid.at(r, c);
        const colorId = islandColors[idx];

        if (isLand) {
          if (colorId >= 0) {
            const color = ISLAND_PALETTE[colorId % ISLAND_PALETTE.length];
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
          } else {
            ctx.fillStyle = '#22d3ee';
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 6;
          }
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        const gap = 2;
        const radius = Math.max(3, cellSize * 0.15);
        const bx = x + gap;
        const by = y + gap;
        const csize = cellSize - gap * 2;

        // Rounded rect
        ctx.beginPath();
        ctx.moveTo(bx + radius, by);
        ctx.lineTo(bx + csize - radius, by);
        ctx.quadraticCurveTo(bx + csize, by, bx + csize, by + radius);
        ctx.lineTo(bx + csize, by + csize - radius);
        ctx.quadraticCurveTo(bx + csize, by + csize, bx + csize - radius, by + csize);
        ctx.lineTo(bx + radius, by + csize);
        ctx.quadraticCurveTo(bx, by + csize, bx, by + csize - radius);
        ctx.lineTo(bx, by + radius);
        ctx.quadraticCurveTo(bx, by, bx + radius, by);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = isLand ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Island label when colored
        if (isLand && colorId >= 0 && cellSize >= 20) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.font = `bold ${Math.min(12, cellSize * 0.32)}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${colorId + 1}`, x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    // Grid label
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${rows} × ${cols} grid`, cw / 2, startY + gridH + 12);
  }, [islandGrid, islandColors, computeLayout, rows, cols]);

  // Resize handler
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      draw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  // Render loop
  useEffect(() => {
    let raf: number;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const cell = getCellFromEvent(e);
      if (!cell) return;
      paintingRef.current = true;
      const currentVal = islandGrid.at(cell.row, cell.col);
      paintValueRef.current = !currentVal;
      paintIslandCell(cell.row, cell.col, !currentVal);
    },
    [islandGrid, paintIslandCell, getCellFromEvent]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!paintingRef.current) return;
      const cell = getCellFromEvent(e);
      if (!cell) return;
      paintIslandCell(cell.row, cell.col, paintValueRef.current);
    },
    [paintIslandCell, getCellFromEvent]
  );

  const handleMouseUp = useCallback(() => {
    paintingRef.current = false;
  }, []);

  const handleGridResize = useCallback(() => {
    const r = parseInt(gridRows) || 1;
    const c = parseInt(gridCols) || 1;
    const clampR = Math.max(1, Math.min(50, r));
    const clampC = Math.max(1, Math.min(50, c));
    setIslandGrid(clampR, clampC);
  }, [gridRows, gridCols, setIslandGrid]);

  useEffect(() => {
    if (!isIslandAnimating) return;
    const id = setInterval(() => {
      advanceIslandAnimation();
    }, islandAnimationSpeed);
    return () => clearInterval(id);
  }, [isIslandAnimating, advanceIslandAnimation, islandAnimationSpeed]);

  const largestSize = useMemo(() => Math.max(0, ...islandComponentSizes), [islandComponentSizes]);
  const smallestSize = useMemo(() => (islandComponentSizes.length ? Math.min(...islandComponentSizes) : 0), [islandComponentSizes]);
  const averageSize = useMemo(() => {
    if (!islandComponentSizes.length) return 0;
    const total = islandComponentSizes.reduce((sum, size) => sum + size, 0);
    return total / islandComponentSizes.length;
  }, [islandComponentSizes]);

  const progress = islandAnimationSteps.length === 0 ? 0 : islandAnimationIndex / islandAnimationSteps.length;
  const stepsPerSecond = Math.round(1000 / islandAnimationSpeed);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-crosshair"
      />

      {/* ── Draggable floating panel ── */}
      <div
        className="absolute z-20 select-none"
        style={{
          left: pos.x,
          top: pos.y,
          width: collapsed ? 'auto' : Math.min(panelWidth, window.innerWidth - 32),
          maxWidth: collapsed ? 'auto' : '95vw',
        }}
      >
        <div className="glass-heavy rounded-2xl border border-white/[0.06] shadow-2xl shadow-black/40 overflow-hidden">
          {/* ── Drag handle bar ── */}
          <div
            {...dragHandlers}
            className="flex items-center justify-between px-4 py-2 cursor-grab active:cursor-grabbing bg-white/[0.03] border-b border-white/[0.06]"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-gray-500" />
              <Grid3x3 className="w-3.5 h-3.5 text-neon-cyan" />
              <span className="text-xs font-semibold text-gray-300">Island Explorer</span>
              <span className="text-[10px] text-gray-500 font-mono">{islandGrid.rows}×{islandGrid.cols}</span>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md hover:bg-white/10 text-gray-400 transition-colors"
            >
              {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* ── Collapsible body ── */}
          {!collapsed && (
            <div className="px-4 py-3 flex flex-col gap-3">
              {/* Grid controls row */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number"
                  value={gridRows}
                  onChange={(e) => setGridRows(e.target.value)}
                  className="w-14 h-7 rounded-lg bg-white/5 border border-white/10 text-center text-xs text-gray-200 focus:border-neon-cyan/50 focus:outline-none"
                  min="1" max="50"
                />
                <span className="text-gray-500 text-xs">×</span>
                <input
                  type="number"
                  value={gridCols}
                  onChange={(e) => setGridCols(e.target.value)}
                  className="w-14 h-7 rounded-lg bg-white/5 border border-white/10 text-center text-xs text-gray-200 focus:border-neon-cyan/50 focus:outline-none"
                  min="1" max="50"
                />
                <button onClick={handleGridResize} className="h-7 px-2.5 rounded-lg bg-neon-cyan/10 text-neon-cyan text-[11px] font-semibold hover:bg-neon-cyan/20 transition-colors border border-neon-cyan/20">
                  Resize
                </button>
                <button onClick={clearIslandGrid} className="h-7 px-2.5 rounded-lg bg-white/5 text-gray-400 text-[11px] hover:bg-red-500/10 hover:text-red-400 transition-colors border border-white/10 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>

              {/* Speed slider */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500 uppercase tracking-[0.25em] shrink-0">Speed</span>
                <input
                  type="range" min={1} max={35} step={1}
                  value={Math.min(35, Math.max(1, stepsPerSecond))}
                  onChange={(e) => {
                    const v = Math.max(1, parseInt(e.target.value, 10));
                    setIslandAnimationSpeed(Math.round(1000 / v));
                  }}
                  className="flex-1 accent-neon-cyan h-1"
                />
                <span className="text-[10px] text-gray-400 font-mono w-14 text-right">{stepsPerSecond} st/s</span>
              </div>

              {/* Stats 2×2 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="stat-card !p-2 text-center">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Islands</p>
                  <p className="text-lg font-bold text-neon-green leading-tight">{islandCount ?? 0}</p>
                </div>
                <div className="stat-card !p-2 text-center">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Largest</p>
                  <p className="text-lg font-bold text-neon-cyan leading-tight">{largestSize}</p>
                </div>
                <div className="stat-card !p-2 text-center">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Smallest</p>
                  <p className="text-lg font-bold text-neon-purple leading-tight">{smallestSize}</p>
                </div>
                <div className="stat-card !p-2 text-center">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Average</p>
                  <p className="text-lg font-bold text-white leading-tight">{averageSize.toFixed(1)}</p>
                </div>
              </div>

              {/* Action buttons + progress */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={runIslandCount} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-green/20 text-neon-green text-[11px] font-semibold border border-neon-green/30 hover:bg-neon-green/25">
                  <Play className="w-3 h-3" /> Run
                </button>
                <button onClick={skipIslandAnimation} disabled={islandAnimationSteps.length === 0}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-gray-300 text-[11px] font-semibold border border-white/10 hover:bg-white/10 disabled:opacity-30">
                  <SkipForward className="w-3 h-3" /> Skip
                </button>
                <button onClick={advanceIslandAnimation} disabled={islandAnimationSteps.length === 0}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-gray-300 text-[11px] font-semibold border border-white/10 hover:bg-white/10 disabled:opacity-30">
                  <Activity className="w-3 h-3" /> Step
                </button>
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden min-w-[40px]">
                  <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{islandAnimationSteps.length === 0 ? '—' : `${Math.round(progress * 100)}%`}</span>
              </div>

              {/* Component legend (scrollable) */}
              {islandCount !== null && islandCount > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {islandComponents.map((component, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 flex items-center gap-1.5 text-[10px] text-gray-400">
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: ISLAND_PALETTE[idx % ISLAND_PALETTE.length] }} />
                      {idx + 1}: {component.length}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {!collapsed && (
            <div
              className="absolute bottom-2 right-2 w-3 h-3 cursor-se-resize opacity-60 hover:opacity-90 transition"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const startWidth = panelWidth;
                const handleMove = (moveEvent: PointerEvent) => {
                  const delta = moveEvent.clientX - startX;
                  const next = Math.max(320, Math.min(640, startWidth + delta));
                  setPanelWidth(next);
                };
                const handleUp = () => {
                  window.removeEventListener('pointermove', handleMove);
                  window.removeEventListener('pointerup', handleUp);
                };
                window.addEventListener('pointermove', handleMove);
                window.addEventListener('pointerup', handleUp);
              }}
            >
              <div className="w-full h-full bg-white/20 rotate-45 rounded" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom hint bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1.5 text-xs text-gray-400 flex items-center gap-3">
        <span>Click to toggle cells</span>
        <span className="w-px h-3 bg-gray-700" />
        <span>Drag to paint</span>
        <span className="w-px h-3 bg-gray-700" />
        <span>Drag panel to reposition</span>
      </div>
    </div>
  );
}
