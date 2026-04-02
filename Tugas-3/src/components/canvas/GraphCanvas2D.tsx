import { useRef, useEffect, useCallback } from 'react';
import { useGraphStore } from '../../store/useGraphStore';

export default function GraphCanvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graph = useGraphStore((s) => s.graph);
  const positions = useGraphStore((s) => s.positions);
  const nodeColors = useGraphStore((s) => s.nodeColors);
  const edgeColors = useGraphStore((s) => s.edgeColors);
  const selectedNode = useGraphStore((s) => s.selectedNode);
  const hoveredNode = useGraphStore((s) => s.hoveredNode);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const setHoveredNode = useGraphStore((s) => s.setHoveredNode);
  const showEdgeWeights = useGraphStore((s) => s.showEdgeWeights);

  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(30);
  const draggingRef = useRef(false);
  const draggingNodeRef = useRef<string | null>(null);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const lastClickRef = useRef<{ name: string | null; time: number }>({ name: null, time: 0 });

  const worldToScreen = useCallback((wx: number, wy: number, cw: number, ch: number) => {
    const zoom = zoomRef.current;
    const pan = panRef.current;
    return {
      x: cw / 2 + (wx + pan.x) * zoom,
      y: ch / 2 + (-wy + pan.y) * zoom,
    };
  }, []);

  const screenToWorld = useCallback((sx: number, sy: number, cw: number, ch: number) => {
    const zoom = zoomRef.current;
    const pan = panRef.current;
    return {
      x: (sx - cw / 2) / zoom - pan.x,
      y: -((sy - ch / 2) / zoom - pan.y),
    };
  }, []);

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

    ctx.fillStyle = '#080c1f';
    ctx.fillRect(0, 0, cw, ch);

    const gridSize = 2;
    const zoom = zoomRef.current;
    const pan = panRef.current;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const startX = Math.floor((-cw / 2 / zoom - pan.x) / gridSize) * gridSize;
    const endX = Math.ceil((cw / 2 / zoom - pan.x) / gridSize) * gridSize;
    const startY = Math.floor((-ch / 2 / zoom + pan.y) / gridSize) * gridSize;
    const endY = Math.ceil((ch / 2 / zoom + pan.y) / gridSize) * gridSize;
    for (let x = startX; x <= endX; x += gridSize) {
      const s = worldToScreen(x, 0, cw, ch);
      ctx.beginPath();
      ctx.moveTo(s.x, 0);
      ctx.lineTo(s.x, ch);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += gridSize) {
      const s = worldToScreen(0, y, cw, ch);
      ctx.beginPath();
      ctx.moveTo(0, s.y);
      ctx.lineTo(cw, s.y);
      ctx.stroke();
    }

    const edges = graph.getEdges();
    for (const [from, to] of edges) {
      const fp = positions.get(from);
      const tp = positions.get(to);
      if (!fp || !tp) continue;

      const fs = worldToScreen(fp.x, fp.y, cw, ch);
      const ts = worldToScreen(tp.x, tp.y, cw, ch);

      const eKey1 = `${from}-${to}`;
      const eKey2 = `${to}-${from}`;
      const eColor = edgeColors[eKey1] || edgeColors[eKey2] || null;
      const isHighlight = hoveredNode === from || hoveredNode === to || selectedNode === from || selectedNode === to;

      ctx.strokeStyle = eColor || (isHighlight ? 'rgba(0,240,255,0.5)' : 'rgba(100,116,139,0.35)');
      ctx.lineWidth = eColor ? 4 : isHighlight ? 3.2 : 2.2;
      ctx.beginPath();
      ctx.moveTo(fs.x, fs.y);
      ctx.lineTo(ts.x, ts.y);
      ctx.stroke();

      if (graph.isDirected) {
        const dx = ts.x - fs.x;
        const dy = ts.y - fs.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 20) {
          const nx = dx / len;
          const ny = dy / len;
          const nodeR = 12;
          const ax = ts.x - nx * nodeR;
          const ay = ts.y - ny * nodeR;
          const arrowSize = 14;
          ctx.fillStyle = eColor || 'rgba(100,116,139,0.4)';
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - nx * arrowSize + ny * arrowSize * 0.5, ay - ny * arrowSize - nx * arrowSize * 0.5);
          ctx.lineTo(ax - nx * arrowSize - ny * arrowSize * 0.5, ay - ny * arrowSize + nx * arrowSize * 0.5);
          ctx.closePath();
          ctx.fill();
        }
      }

      if (graph.isWeighted && showEdgeWeights) {
        const weight = graph.getWeight(from, to);
        if (weight !== undefined && weight !== Infinity) {
          const mx = (fs.x + ts.x) / 2;
          const my = (fs.y + ts.y) / 2;
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(mx, my, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(100,116,139,0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#e2e8f0';
          ctx.font = '500 10px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(weight.toString(), mx, my);
        }
      }
    }

    const nodes = graph.nodeNames;
    for (const name of nodes) {
      const pos = positions.get(name);
      if (!pos) continue;

      const s = worldToScreen(pos.x, pos.y, cw, ch);
      const isSelected = selectedNode === name;
      const isHovered = hoveredNode === name;
      const color = nodeColors[name] || '#00f0ff';
      const radius = isSelected ? 14 : isHovered ? 12 : 10;

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = isSelected ? 25 : isHovered ? 18 : 10;

      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, radius * 3);
      grd.addColorStop(0, color + '3a');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(s.x, s.y + radius + 4, radius * 0.6, 0, Math.PI, true);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(name, s.x, s.y - radius - 4);
    }
  }, [graph, positions, nodeColors, edgeColors, selectedNode, hoveredNode, showEdgeWeights, worldToScreen]);

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

  useEffect(() => {
    let raf: number;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoomRef.current = Math.max(5, Math.min(200, zoomRef.current * delta));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const sx = (e.clientX - rect.left);
      const sy = (e.clientY - rect.top);
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;

      const nodes = graph.nodeNames;
      let clickedNode: string | null = null;
      for (const name of nodes) {
        const pos = positions.get(name);
        if (!pos) continue;
        const s = worldToScreen(pos.x, pos.y, cw, ch);
        const dx = sx - s.x;
        const dy = sy - s.y;
        if (dx * dx + dy * dy < 15 * 15) {
          clickedNode = name;
          break;
        }
      }

      if (clickedNode) {
        const now = performance.now();
        const last = lastClickRef.current;
        if (selectedNode === clickedNode && last.name === clickedNode && now - last.time < 350) {
          setSelectedNode(null);
          draggingNodeRef.current = null;
          lastClickRef.current = { name: null, time: 0 };
          return;
        }

        draggingNodeRef.current = clickedNode;
        setSelectedNode(clickedNode);
        lastClickRef.current = { name: clickedNode, time: now };
      } else {
        draggingRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    }
  }, [graph, positions, selectedNode, setSelectedNode, worldToScreen]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNodeRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      const { x, y } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, cw, ch);
      useGraphStore.getState().updatePosition(draggingNodeRef.current, { x, y });
      return;
    }

    if (draggingRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      panRef.current.x += dx / zoomRef.current;
      panRef.current.y += dy / zoomRef.current;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    let found: string | null = null;
    for (const name of graph.nodeNames) {
      const pos = positions.get(name);
      if (!pos) continue;
      const s = worldToScreen(pos.x, pos.y, cw, ch);
      const dx = sx - s.x;
      const dy = sy - s.y;
      if (dx * dx + dy * dy < 15 * 15) {
        found = name;
        break;
      }
    }

    setHoveredNode(found);
    document.body.style.cursor = found ? 'pointer' : draggingRef.current ? 'grabbing' : 'default';
  }, [graph, positions, setHoveredNode, worldToScreen]);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
    draggingNodeRef.current = null;
    document.body.style.cursor = 'default';
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full"
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1.5 text-xs text-gray-400 flex items-center gap-3">
        <span>Scroll to zoom</span>
        <span className="w-px h-3 bg-gray-700" />
        <span>Drag to pan</span>
        <span className="w-px h-3 bg-gray-700" />
        <span>Click node to select</span>
      </div>
    </div>
  );
}
