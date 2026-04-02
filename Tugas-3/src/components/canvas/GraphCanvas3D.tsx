import { useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useGraphStore, NodePosition } from '../../store/useGraphStore';

interface Node3DProps {
  name: string;
  position: [number, number, number];
  color: string;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

function Node3D({ name, position, color, isSelected, isHovered, onClick, onPointerOver, onPointerOut }: Node3DProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const lastClickRef = useRef(0);

  const baseScale = isSelected ? 1.4 : isHovered ? 1.2 : 1.0;
  const targetScale = useRef(baseScale);
  targetScale.current = baseScale;

  useFrame((_, delta) => {
    if (meshRef.current) {
      const s = meshRef.current.scale.x;
      const t = targetScale.current;
      const newScale = THREE.MathUtils.lerp(s, t, 1 - Math.pow(0.001, delta));
      meshRef.current.scale.setScalar(newScale);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(meshRef.current.scale.x * 2.2);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isHovered || isSelected ? 0.25 : 0.1;
    }
    if (ringRef.current && isSelected) {
      ringRef.current.rotation.z += delta * 1.5;
      ringRef.current.rotation.x += delta * 0.8;
    }
  });

  const nodeColor = new THREE.Color(color);

  return (
    <group position={position}>
      <mesh
        ref={glowRef}
        position={[0, 0, 0]}
      >
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          const now = performance.now();
          if (isSelected && now - lastClickRef.current < 350) {
            onPointerOut();
            useGraphStore.getState().setSelectedNode(null);
          } else {
            onClick();
          }
          lastClickRef.current = now;
        }}
        onPointerOver={(e) => { e.stopPropagation(); onPointerOver(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); onPointerOut(); document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={isSelected ? 1.0 : isHovered ? 0.7 : 0.5}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {isSelected && (
        <mesh ref={ringRef}>
          <torusGeometry args={[0.4, 0.02, 16, 48]} />
          <meshBasicMaterial color={nodeColor} transparent opacity={0.6} />
        </mesh>
      )}

      <Text
        position={[0, 0.48, 0]}
        fontSize={0.36}
        color="#f8fafc"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.035}
        outlineColor="#020617"
      >
        {name}
      </Text>

      {(isHovered || isSelected) && (
        <Html
          position={[0, -0.5, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div className="node-tooltip">
            <span className="font-bold" style={{ color }}>{name}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

interface Edge3DProps {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  isDirected: boolean;
  opacity?: number;
  weight?: number;
}

function Edge3D({ from, to, color, isDirected, opacity = 0.75, weight }: Edge3DProps) {
  const edgeColor = useMemo(() => new THREE.Color(color), [color]);

  const { points, length, midpoint, quaternion } = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const dir = end.clone().sub(start);
    const len = dir.length();
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const quat = new THREE.Quaternion();
    if (len > 0) {
      quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    }
    return {
      points: [start, end],
      length: len,
      midpoint: mid,
      quaternion: quat,
    };
  }, [from, to]);

  return (
    <group>
      {length > 0.01 && (
        <mesh position={[midpoint.x, midpoint.y, midpoint.z]} quaternion={quaternion}>
          <cylinderGeometry args={[0.06, 0.06, length, 8, 1, true]} />
          <meshStandardMaterial
            color={edgeColor}
            transparent
            opacity={opacity}
            emissive={edgeColor}
            emissiveIntensity={0.15}
          />
        </mesh>
      )}

      {isDirected && (
        <ArrowHead from={from} to={to} color={color} opacity={opacity} />
      )}

      {weight !== undefined && (
        <Text
          position={[midpoint.x, midpoint.y + 0.25, midpoint.z]}
          fontSize={0.28}
          color="#f8fafc"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#0f172a"
        >
          {weight.toString()}
        </Text>
      )}
    </group>
  );
}

function ArrowHead({ from, to, color, opacity = 0.6 }: { from: [number, number, number]; to: [number, number, number]; color: string; opacity?: number }) {
  const direction = useMemo(() => {
    const dir = new THREE.Vector3(
      to[0] - from[0],
      to[1] - from[1],
      to[2] - from[2]
    );
    dir.normalize();
    return dir;
  }, [from, to]);

  const position = useMemo(() => {
    const dir = new THREE.Vector3(
      to[0] - from[0],
      to[1] - from[1],
      to[2] - from[2]
    );
    const len = dir.length();
    dir.normalize();
    const offset = Math.min(0.35, len * 0.15);
    return new THREE.Vector3(
      to[0] - dir.x * offset,
      to[1] - dir.y * offset,
      to[2] - dir.z * offset
    );
  }, [from, to]);

  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    return q;
  }, [direction]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <coneGeometry args={[0.15, 0.35, 12]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

function CameraController() {
  const { camera } = useThree();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      camera.position.set(12, 8, 12);
      camera.lookAt(0, 0, 0);
      initializedRef.current = true;
    }
  }, [camera]);

  return null;
}

export default function GraphCanvas3D() {
  const graph = useGraphStore((s) => s.graph);
  const positions = useGraphStore((s) => s.positions);
  const nodeColors = useGraphStore((s) => s.nodeColors);
  const edgeColors = useGraphStore((s) => s.edgeColors);
  const selectedNode = useGraphStore((s) => s.selectedNode);
  const hoveredNode = useGraphStore((s) => s.hoveredNode);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const setHoveredNode = useGraphStore((s) => s.setHoveredNode);
  const showEdgeWeights = useGraphStore((s) => s.showEdgeWeights);

  const defaultNodeColor = '#00f0ff';
  const defaultEdgeColor = '#334155';

  const getNodeColor = useCallback(
    (name: string) => nodeColors[name] || defaultNodeColor,
    [nodeColors]
  );

  const getEdgeColor = useCallback(
    (from: string, to: string) => {
      const key1 = `${from}-${to}`;
      const key2 = `${to}-${from}`;
      return edgeColors[key1] || edgeColors[key2] || defaultEdgeColor;
    },
    [edgeColors]
  );

  const getEdgeOpacity = useCallback(
    (from: string, to: string) => {
      const key1 = `${from}-${to}`;
      const key2 = `${to}-${from}`;
      if (edgeColors[key1] || edgeColors[key2]) return 0.8;
      if (hoveredNode && (from === hoveredNode || to === hoveredNode)) return 0.7;
      if (selectedNode && (from === selectedNode || to === selectedNode)) return 0.6;
      return 0.85;
    },
    [edgeColors, hoveredNode, selectedNode]
  );

  const nodes = graph.nodeNames;
  const edges = graph.getEdges();

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [12, 8, 12], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        onPointerMissed={() => setSelectedNode(null)}
      >
        <color attach="background" args={['#07071a']} />
        <fog attach="fog" args={['#07071a', 50, 120]} />

        <ambientLight intensity={0.8} />
        <hemisphereLight args={['#b0c4ff', '#1a1a3a', 0.6]} />
        <pointLight position={[15, 20, 15]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-15, -10, -15]} intensity={0.5} color="#60a5fa" />
        <pointLight position={[10, -15, 10]} intensity={0.4} color="#c084fc" />
        <pointLight position={[-10, 10, -10]} intensity={0.3} color="#22d3ee" />

        <Stars radius={60} depth={50} count={2500} factor={4} saturation={0.2} fade speed={0.5} />

        <CameraController />

        {edges.map(([from, to], idx) => {
          const fromPos = positions.get(from);
          const toPos = positions.get(to);
          if (!fromPos || !toPos) return null;

          let weight = graph.isWeighted && showEdgeWeights ? graph.getWeight(from, to) : undefined;
          if (weight === Infinity) weight = undefined;

          return (
            <Edge3D
              key={`edge-${idx}-${from}-${to}`}
              from={[fromPos.x, fromPos.y, fromPos.z]}
              to={[toPos.x, toPos.y, toPos.z]}
              color={getEdgeColor(from, to)}
              isDirected={graph.isDirected}
              opacity={getEdgeOpacity(from, to)}
              weight={weight}
            />
          );
        })}

        {nodes.map((name) => {
          const pos = positions.get(name);
          if (!pos) return null;

          return (
            <Node3D
              key={`node-${name}`}
              name={name}
              position={[pos.x, pos.y, pos.z]}
              color={getNodeColor(name)}
              isSelected={selectedNode === name}
              isHovered={hoveredNode === name}
              onClick={() => setSelectedNode(selectedNode === name ? null : name)}
              onPointerOver={() => setHoveredNode(name)}
              onPointerOut={() => setHoveredNode(null)}
            />
          );
        })}

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          autoRotate
          autoRotateSpeed={0.3}
          dampingFactor={0.1}
          enableDamping
          minDistance={3}
          maxDistance={60}
        />

        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.15} darkness={0.4} />
        </EffectComposer>
      </Canvas>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1.5 text-xs text-gray-400 flex items-center gap-3">
        <span>Scroll to zoom</span>
        <span className="w-px h-3 bg-gray-700" />
        <span>Drag to rotate</span>
        <span className="w-px h-3 bg-gray-700" />
        <span>Click node to select</span>
      </div>
    </div>
  );
}
