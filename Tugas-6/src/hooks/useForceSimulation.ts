import { useEffect, useRef } from 'react';
import { useGraphStore, NodePosition } from '../store/useGraphStore';

export function useForceSimulation() {
  const graph = useGraphStore((s) => s.graph);
  const viewMode = useGraphStore((s) => s.viewMode);

  const simRef = useRef({
    iteration: 0,
    temperature: 1.0,
    settled: false,
  });

  useEffect(() => {
    simRef.current = { iteration: 0, temperature: 1.0, settled: false };
  }, [graph, viewMode]);

  useEffect(() => {
    let rafId: number;

    const tick = () => {
      const sim = simRef.current;
      const state = useGraphStore.getState();
      const currentViewMode = state.viewMode;

      if (currentViewMode === '2d') {
        sim.settled = false;
      }

      if (sim.settled || graph.isEmpty) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const nodes = graph.nodeNames;
      const n = nodes.length;
      if (n === 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const currentPositions = state.positions;
      const posArray: NodePosition[] = nodes.map(
        (name) => ({ ...(currentPositions.get(name) || { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }) })
      );

      const repulsionStrength = 15.0;
      const idealEdgeLength = 3.0;
      const springStrength = 0.04;
      const centerGravity = 0.003;
      const damping = 0.75;
      const minDist = 0.3;
      const is2D = currentViewMode === '2d';

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = posArray[i].x - posArray[j].x;
          const dy = posArray[i].y - posArray[j].y;
          const dz = is2D ? 0 : posArray[i].z - posArray[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || minDist;
          const force = repulsionStrength / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          const fz = (dz / dist) * force;
          posArray[i].vx += fx;
          posArray[i].vy += fy;
          posArray[i].vz += fz;
          posArray[j].vx -= fx;
          posArray[j].vy -= fy;
          posArray[j].vz -= fz;
        }
      }

      const edges = graph.getEdges();
      for (const [fromName, toName] of edges) {
        const i = graph.getId(fromName);
        const j = graph.getId(toName);
        const dx = posArray[j].x - posArray[i].x;
        const dy = posArray[j].y - posArray[i].y;
        const dz = is2D ? 0 : posArray[j].z - posArray[i].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || minDist;
        const displacement = dist - idealEdgeLength;
        const force = displacement * springStrength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;
        posArray[i].vx += fx;
        posArray[i].vy += fy;
        posArray[i].vz += fz;
        posArray[j].vx -= fx;
        posArray[j].vy -= fy;
        posArray[j].vz -= fz;
      }

      let totalMovement = 0;
      const newPositions = new Map(currentPositions);

      for (let i = 0; i < n; i++) {
        posArray[i].vx -= posArray[i].x * centerGravity;
        posArray[i].vy -= posArray[i].y * centerGravity;
        if (!is2D) posArray[i].vz -= posArray[i].z * centerGravity;
        if (is2D) posArray[i].vz = -posArray[i].z * 0.3;

        posArray[i].vx *= damping;
        posArray[i].vy *= damping;
        posArray[i].vz *= damping;

        const maxV = 1.5 * sim.temperature;
        const v = Math.sqrt(posArray[i].vx ** 2 + posArray[i].vy ** 2 + posArray[i].vz ** 2);
        if (v > maxV) {
          posArray[i].vx = (posArray[i].vx / v) * maxV;
          posArray[i].vy = (posArray[i].vy / v) * maxV;
          posArray[i].vz = (posArray[i].vz / v) * maxV;
        }

        posArray[i].x += posArray[i].vx;
        posArray[i].y += posArray[i].vy;
        posArray[i].z += posArray[i].vz;

        totalMovement += Math.abs(posArray[i].vx) + Math.abs(posArray[i].vy) + Math.abs(posArray[i].vz);

        newPositions.set(nodes[i], posArray[i]);
      }

      useGraphStore.setState({ positions: newPositions });

      sim.iteration++;
      if (!is2D) {
        if (sim.iteration > 60) {
          sim.temperature = Math.max(0.05, sim.temperature * 0.998);
        }

        if (totalMovement / n < 0.003 && sim.iteration > 150) {
          sim.settled = true;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [graph, viewMode]);
}
