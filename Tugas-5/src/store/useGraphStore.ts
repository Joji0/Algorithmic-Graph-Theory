import { create } from 'zustand';
import { Graph, Grid, PresetGraphs } from '../core/Graph';
import { GraphAlgorithms, AlgorithmStepEvent } from '../core/GraphAlgorithms';

export interface NodePosition {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface NodeColorMap {
  [nodeName: string]: string;
}

export interface EdgeColorMap {
  [edgeKey: string]: string;
}

export interface AlgorithmResult {
  algorithm: string;
  title: string;
  message: string;
  details: string[];
  timestamp: number;
}

interface IslandAnimationStep {
  cell: number;
  component: number;
}

const buildEmptyIslandState = (grid: Grid) => ({
  islandGrid: grid,
  islandColors: new Array(grid.size).fill(-1),
  islandFinalColors: new Array(grid.size).fill(-1),
  islandCount: null as number | null,
  islandComponents: [] as number[][],
  islandComponentSizes: [] as number[],
  islandAnimationSteps: [] as IslandAnimationStep[],
  islandAnimationIndex: 0,
  isIslandAnimating: false,
  islandAnimationSpeed: 90,
});

interface GraphState {
  graph: Graph;
  gridGraph: Grid | null;
  positions: Map<string, NodePosition>;
  nodeColors: NodeColorMap;
  edgeColors: EdgeColorMap;
  selectedNode: string | null;
  hoveredNode: string | null;
  isAnimating: boolean;
  animationSteps: AlgorithmStepEvent[];
  currentStepIndex: number;
  results: AlgorithmResult[];
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  animationSpeed: number;
  viewMode: '2d' | '3d';
  graphMode: 'undirected' | 'directed' | 'island';
  islandGrid: Grid;
  islandColors: number[];  // per-cell island id for coloring after counting
  islandFinalColors: number[];
  islandCount: number | null;
  islandComponents: number[][];
  islandComponentSizes: number[];
  islandAnimationSteps: IslandAnimationStep[];
  islandAnimationIndex: number;
  isIslandAnimating: boolean;
  islandAnimationSpeed: number;
  showEdgeWeights: boolean;

  setGraph: (graph: Graph) => void;
  loadPreset: (name: string) => void;
  addNode: (name: string) => void;
  addEdge: (from: string, to: string, weight?: number) => void;
  removeNode: (name: string) => void;
  removeEdge: (from: string, to: string) => void;
  clearGraph: () => void;
  setDirected: (directed: boolean) => void;
  setSelectedNode: (node: string | null) => void;
  setHoveredNode: (node: string | null) => void;
  updatePosition: (name: string, pos: Partial<NodePosition>) => void;
  initPositions: () => void;
  setNodeColor: (name: string, color: string) => void;
  setEdgeColor: (from: string, to: string, color: string) => void;
  clearColors: () => void;
  runAlgorithm: (algorithm: string, startNode?: string, endNode?: string) => void;
  setAnimating: (animating: boolean) => void;
  setCurrentStepIndex: (index: number) => void;
  addResult: (result: AlgorithmResult) => void;
  clearResults: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setAnimationSpeed: (speed: number) => void;
  setViewMode: (mode: '2d' | '3d') => void;
  setGridGraph: (grid: Grid | null) => void;
  setGraphWeighted: (weighted: boolean) => void;
  setShowEdgeWeights: (show: boolean) => void;
  setGraphMode: (mode: 'undirected' | 'directed' | 'island') => void;
  setIslandGrid: (rows: number, cols: number) => void;
  toggleIslandCell: (row: number, col: number) => void;
  paintIslandCell: (row: number, col: number, value: boolean) => void;
  clearIslandGrid: () => void;
  runIslandCount: () => void;
  advanceIslandAnimation: () => void;
  skipIslandAnimation: () => void;
  setIslandAnimationSpeed: (ms: number) => void;
  importJSON: (json: string) => void;
  exportJSON: () => string;
}

function randomPosition(scale: number = 8): NodePosition {
  return {
    x: (Math.random() - 0.5) * scale,
    y: (Math.random() - 0.5) * scale,
    z: (Math.random() - 0.5) * scale,
    vx: 0,
    vy: 0,
    vz: 0,
  };
}

function generatePositions(graph: Graph): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  const n = graph.size;
  const radius = Math.max(3, n * 0.8);

  graph.nodeNames.forEach((name, i) => {
    const phi = Math.acos(-1 + (2 * i) / Math.max(n, 1));
    const theta = Math.sqrt(n * Math.PI) * phi;

    positions.set(name, {
      x: radius * Math.cos(theta) * Math.sin(phi) + (Math.random() - 0.5) * 0.5,
      y: radius * Math.sin(theta) * Math.sin(phi) + (Math.random() - 0.5) * 0.5,
      z: radius * Math.cos(phi) + (Math.random() - 0.5) * 0.5,
      vx: 0,
      vy: 0,
      vz: 0,
    });
  });

  return positions;
}

export const initialGraph = new Graph(false);
const initialGrid = new Grid(10, 10);

export const useGraphStore = create<GraphState>((set, get) => ({
  graph: initialGraph,
  gridGraph: null,
  positions: new Map(),
  nodeColors: {},
  edgeColors: {},
  selectedNode: null,
  hoveredNode: null,
  isAnimating: false,
  animationSteps: [],
  currentStepIndex: 0,
  results: [],
  leftPanelOpen: true,
  rightPanelOpen: true,
  animationSpeed: 1,
  viewMode: '3d',
  graphMode: 'undirected',
  showEdgeWeights: true,
  ...buildEmptyIslandState(initialGrid),

  setGraph: (graph: Graph) => {
    const positions = generatePositions(graph);
    set({ graph, positions, nodeColors: {}, edgeColors: {}, selectedNode: null, hoveredNode: null });
  },

  loadPreset: (name: string) => {
    let graph: Graph;
    switch (name) {
      case 'petersen': graph = PresetGraphs.petersen(); break;
      case 'k5': graph = PresetGraphs.complete(5); break;
      case 'k6': graph = PresetGraphs.complete(6); break;
      case 'k33': graph = PresetGraphs.completeBipartite(3, 3); break;
      case 'k44': graph = PresetGraphs.completeBipartite(4, 4); break;
      case 'cycle5': graph = PresetGraphs.cycle(5); break;
      case 'cycle6': graph = PresetGraphs.cycle(6); break;
      case 'cycle8': graph = PresetGraphs.cycle(8); break;
      case 'star5': graph = PresetGraphs.star(5); break;
      case 'star8': graph = PresetGraphs.star(8); break;
      case 'cube': graph = PresetGraphs.cube(); break;
      case 'wheel6': graph = PresetGraphs.wheel(6); break;
      case 'wheel8': graph = PresetGraphs.wheel(8); break;
      case 'binaryTree3': graph = PresetGraphs.binaryTree(3); break;
      case 'grid3x3': graph = PresetGraphs.grid(3, 3); break;
      case 'grid4x4': graph = PresetGraphs.grid(4, 4); break;
      case 'directedAcyclic': graph = PresetGraphs.directedAcyclic(); break;
      case 'directedCyclic': graph = PresetGraphs.directedCyclic(); break;
      case 'disconnected': graph = PresetGraphs.disconnected(); break;
      case 'tspSample4': graph = PresetGraphs.tspSample4(); break;
      case 'tspSample5': graph = PresetGraphs.tspSample5(); break;
      case 'tspSample6': graph = PresetGraphs.tspSample6(); break;
      case 'tspSample7': graph = PresetGraphs.tspSample7(); break;
      default: graph = PresetGraphs.petersen(); break;
    }
    const positions = generatePositions(graph);
    set({ graph, positions, nodeColors: {}, edgeColors: {}, selectedNode: null, isAnimating: false, animationSteps: [], currentStepIndex: 0 });
  },

  addNode: (name: string) => {
    const { graph, positions } = get();
    if (graph.hasNode(name)) return;
    graph.addNode(name);
    const newPositions = new Map(positions);
    newPositions.set(name, randomPosition());
    set({ graph: graph.clone(), positions: newPositions });
  },

  addEdge: (from: string, to: string, weight?: number) => {
    const { graph, positions } = get();
    const hadFrom = graph.hasNode(from);
    const hadTo = graph.hasNode(to);
    graph.addEdge(from, to, weight);
    const newPositions = new Map(positions);
    if (!hadFrom) newPositions.set(from, randomPosition());
    if (!hadTo) newPositions.set(to, randomPosition());
    set({ graph: graph.clone(), positions: newPositions });
  },

  removeNode: (name: string) => {
    const { graph, positions } = get();
    graph.removeNode(name);
    const newPositions = new Map(positions);
    newPositions.delete(name);
    set({ graph: graph.clone(), positions: newPositions, selectedNode: null });
  },

  removeEdge: (from: string, to: string) => {
    const { graph } = get();
    graph.removeEdge(from, to);
    set({ graph: graph.clone() });
  },

  clearGraph: () => {
    set({
      graph: new Graph(false),
      positions: new Map(),
      nodeColors: {},
      edgeColors: {},
      selectedNode: null,
      hoveredNode: null,
      isAnimating: false,
      animationSteps: [],
      currentStepIndex: 0,
    });
  },

  setDirected: (directed: boolean) => {
    const { graph } = get();
    const newGraph = new Graph(directed, graph.isWeighted);
    for (const name of graph.nodeNames) {
      newGraph.addNode(name);
    }
    for (const [from, to, weight] of graph.getEdges()) {
      newGraph.addEdge(from, to, weight);
    }
    set({ graph: newGraph });
  },

  setSelectedNode: (node: string | null) => set({ selectedNode: node }),
  setHoveredNode: (node: string | null) => set({ hoveredNode: node }),

  updatePosition: (name: string, pos: Partial<NodePosition>) => {
    const { positions } = get();
    const current = positions.get(name);
    if (!current) return;
    const newPositions = new Map(positions);
    newPositions.set(name, { ...current, ...pos });
    set({ positions: newPositions });
  },

  initPositions: () => {
    const { graph } = get();
    const positions = generatePositions(graph);
    set({ positions });
  },

  setNodeColor: (name: string, color: string) => {
    set((state) => ({ nodeColors: { ...state.nodeColors, [name]: color } }));
  },

  setEdgeColor: (from: string, to: string, color: string) => {
    const key = `${from}-${to}`;
    const keyReverse = `${to}-${from}`;
    set((state) => ({
      edgeColors: { ...state.edgeColors, [key]: color, [keyReverse]: color },
    }));
  },

  clearColors: () => set({ nodeColors: {}, edgeColors: {} }),

  runAlgorithm: (algorithm: string, startNode?: string, endNode?: string) => {
    const { graph } = get();

    get().clearColors();

    try {
      const steps = GraphAlgorithms.getAnimationSteps(graph, algorithm, startNode, endNode);

      let resultMessage = '';
      let details: string[] = [];

      switch (algorithm) {
        case 'dfs': {
          if (!startNode) return;
          const result = GraphAlgorithms.depthFirstSearch(graph, startNode);
          resultMessage = `DFS from ${startNode}: ${result.order.join(' → ')}`;
          details = [`Nodes visited: ${result.order.length}`, `Order: ${result.order.join(', ')}`];
          break;
        }
        case 'bfs': {
          if (!startNode) return;
          const result = GraphAlgorithms.breadthFirstSearch(graph, startNode);
          resultMessage = `BFS from ${startNode}: ${result.order.join(' → ')}`;
          details = [`Nodes visited: ${result.order.length}`, `Order: ${result.order.join(', ')}`];
          break;
        }
        case 'path': {
          if (!startNode || !endNode) return;
          const result = GraphAlgorithms.findPath(graph, startNode, endNode);
          resultMessage = result.exists
            ? `Path: ${result.path.join(' → ')}`
            : `No path from ${startNode} to ${endNode}`;
          details = result.exists
            ? [`Path length: ${result.path.length - 1}`, `Path: ${result.path.join(' → ')}`]
            : [`No path exists between these nodes.`];
          break;
        }
        case 'connectivity': {
          const result = GraphAlgorithms.isConnected(graph, true);
          resultMessage = result.isConnected ? 'Graph is connected' : 'Graph is NOT connected';
          details = [
            `Connected: ${result.isConnected}`,
            `Strongly connected: ${result.isStronglyConnected}`,
            `Components: ${result.componentCount}`,
            `Largest component: ${result.largestComponentSize}`,
          ];
          break;
        }
        case 'components': {
          const result = GraphAlgorithms.isConnected(graph);
          resultMessage = `Components: ${result.componentCount}`;
          details = [
            `Number of components: ${result.componentCount}`,
            `Largest component size: ${result.largestComponentSize}`,
            ...result.components.map((c, i) => `Component ${i + 1}: {${c.join(', ')}}`),
          ];
          break;
        }
        case 'bipartite': {
          const result = GraphAlgorithms.isBipartite(graph);
          resultMessage = result.isBipartite ? 'Graph IS bipartite' : 'Graph is NOT bipartite';
          details = result.isBipartite
            ? [
                `Partition A: {${result.partitionA.join(', ')}}`,
                `Partition B: {${result.partitionB.join(', ')}}`,
              ]
            : ['The graph contains an odd cycle.'];
          break;
        }
        case 'diameter': {
          const result = GraphAlgorithms.diameter(graph);
          resultMessage = `Diameter: ${result.diameter}`;
          details = [
            `Diameter: ${result.diameter}`,
            `Longest shortest path: ${result.path.join(' → ')}`,
          ];
          break;
        }
        case 'cycle': {
          const result = GraphAlgorithms.detectCycle(graph);
          resultMessage = result.hasCycle ? `Cycle found: ${result.cycle.join(' → ')}` : 'No cycle detected';
          details = result.hasCycle
            ? [`Cycle: ${result.cycle.join(' → ')}`, `Cycle length: ${result.cycle.length - 1}`]
            : ['The graph is acyclic.'];
          break;
        }
        case 'girth': {
          const result = GraphAlgorithms.girth(graph);
          resultMessage = result.girth !== Infinity ? `Girth: ${result.girth}` : 'Girth: ∞ (no cycle)';
          details =
            result.girth !== Infinity
              ? [`Girth (shortest cycle): ${result.girth}`, `Cycle: ${result.cycle.join(' → ')}`]
              : ['No cycle exists in the graph. Girth is infinite.'];
          break;
        }
        case 'islands': {
          const gridGraph = get().gridGraph;
          if (!gridGraph || gridGraph.size === 0) {
            resultMessage = 'No grid loaded. Enter a grid in the algorithm panel first.';
            details = ['Load a grid to count islands.'];
          } else {
            const count = GraphAlgorithms.findIslandCount(gridGraph);
            resultMessage = `Islands: ${count}`;
            details = [`Grid size: ${gridGraph.rows} × ${gridGraph.cols}`, `Number of islands: ${count}`];
          }
          break;
        }
        case 'djikstra': {
          if (!startNode) return;
          const result = GraphAlgorithms.djikstra(graph, startNode);
          
          if (endNode) {
            const dist = result.distances.get(endNode);
            resultMessage = `Distance to ${endNode}: ${dist === Infinity ? 'Unreachable' : dist}`;
            if (dist !== Infinity) {
              const path = [];
              let curr: string | null = endNode;
              while (curr !== null) {
                path.push(curr);
                curr = result.previous.get(curr) || null;
              }
              path.reverse();
              details = [`Path: ${path.join(' → ')}`, `Total distance: ${dist}`];
            } else {
              details = ['The target node is unreachable from the start node.'];
            }
          } else {
            resultMessage = `Shortest paths from ${startNode}`;
            details = Array.from(result.distances.entries()).map(([node, dist]) => `${node}: ${dist === Infinity ? '∞' : dist}`);
          }
          break;
        }
        case 'prims': {
          if (!startNode) return;
          const result = GraphAlgorithms.prims(graph, startNode);
          const isComplete = graph.size > 0 && result.length === graph.size - 1;
          resultMessage = isComplete ? `Prim's MST built from ${startNode}` : `Prim's MST (Partial) from ${startNode}`;
          details = [
            `MST formed: ${isComplete ? 'Yes' : 'No (Disconnected Graph)'}`,
            `Total edges: ${result.length}`, 
            `Total weight: ${result.reduce((sum, [u, v, weight]) => sum + (weight || 0), 0)}`,
            ...result.map(([u, v, weight]) => `${u} - ${v} (Weight: ${weight})`)
          ];
          break;
        }
        case 'tsp': {
          if (!startNode) return;
          const result = GraphAlgorithms.tsp(graph, startNode);
          if (!result.feasible) {
            resultMessage = `No Hamiltonian circuit from ${startNode}`;
            details = [
              `Permutations checked: ${result.permutationsChecked}`,
              'Graph does not contain a Hamiltonian circuit — TSP is infeasible on this input.',
            ];
          } else {
            resultMessage = `Optimal tour: ${result.bestTour.join(' → ')} (cost ${result.bestCost})`;
            details = [
              `Start / end: ${startNode}`,
              `Cities visited: ${graph.size}`,
              `Total permutations checked: ${result.permutationsChecked}`,
              `Feasible tours found: ${result.allTours.length}`,
              `Optimal tour cost: ${result.bestCost}`,
              `Optimal tour: ${result.bestTour.join(' → ')}`,
            ];
          }
          break;
        }
        case 'kruskal': {
          const result = GraphAlgorithms.kruskal(graph);
          const isComplete = graph.size > 0 && result.length === graph.size - 1;
          resultMessage = isComplete ? `Kruskal's MST computed` : `Kruskal's Spanning Forest computed`;
          details = [
            `MST formed: ${isComplete ? 'Yes' : 'No (Disconnected Graph)'}`,
            `Total edges: ${result.length}`, 
            `Total weight: ${result.reduce((sum, [u, v, weight]) => sum + (weight || 0), 0)}`,
            ...result.map(([u, v, weight]) => `${u} - ${v} (Weight: ${weight})`)
          ];
          break;
        }
      }

      const algorithmTitles: Record<string, string> = {
        dfs: 'Depth-First Search',
        bfs: 'Breadth-First Search',
        path: 'Path Existence',
        connectivity: 'Connectivity Check',
        components: 'Connected Components',
        islands: 'Island Count (Grid)',
        bipartite: 'Bipartite Check',
        diameter: 'Graph Diameter',
        cycle: 'Cycle Detection',
        girth: 'Girth (Shortest Cycle)',
        djikstra: 'Djikstra Shortest Path',
        prims: "Prim's MST",
        kruskal: "Kruskal's MST",
        tsp: 'TSP (Brute-force Hamiltonian)',
      };

      set({
        animationSteps: steps,
        currentStepIndex: 0,
        isAnimating: true,
      });

      get().addResult({
        algorithm,
        title: algorithmTitles[algorithm] || algorithm,
        message: resultMessage,
        details,
        timestamp: Date.now(),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      get().addResult({
        algorithm,
        title: algorithm,
        message: `Error: ${message}`,
        details: [message],
        timestamp: Date.now(),
      });
    }
  },

  setAnimating: (animating: boolean) => set({ isAnimating: animating }),
  setCurrentStepIndex: (index: number) => set({ currentStepIndex: index }),

  addResult: (result: AlgorithmResult) => {
    set((state) => ({ results: [result, ...state.results].slice(0, 20) }));
  },

  clearResults: () => set({ results: [] }),

  toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),

  setAnimationSpeed: (speed: number) => set({ animationSpeed: speed }),

  setViewMode: (mode: '2d' | '3d') => set({ viewMode: mode }),

  setGridGraph: (grid: Grid | null) => set({ gridGraph: grid }),

  setShowEdgeWeights: (show: boolean) => set({ showEdgeWeights: show }),

  setGraphWeighted: (weighted: boolean) => {
    const { graph } = get();
    if (graph.isWeighted !== weighted) {
      const newGraph = new Graph(graph.isDirected, weighted);
      for (const name of graph.nodeNames) newGraph.addNode(name);
      for (const [from, to, weight] of graph.getEdges()) newGraph.addEdge(from, to, weight);
      set({ graph: newGraph });
    }
  },

  setGraphMode: (mode: 'undirected' | 'directed' | 'island') => {
    if (mode === 'undirected') {
      const { graph } = get();
      if (graph.isDirected) {
        const newGraph = new Graph(false, graph.isWeighted);
        for (const name of graph.nodeNames) newGraph.addNode(name);
        for (const [from, to, weight] of graph.getEdges()) newGraph.addEdge(from, to, weight);
        set({ graphMode: mode, graph: newGraph });
      } else {
        set({ graphMode: mode });
      }
    } else if (mode === 'directed') {
      const { graph } = get();
      if (!graph.isDirected) {
        const newGraph = new Graph(true, graph.isWeighted);
        for (const name of graph.nodeNames) newGraph.addNode(name);
        for (const [from, to, weight] of graph.getEdges()) newGraph.addEdge(from, to, weight);
        set({ graphMode: mode, graph: newGraph });
      } else {
        set({ graphMode: mode });
      }
    } else {
      const gridCopy = get().islandGrid.clone();
      set({ graphMode: mode, ...buildEmptyIslandState(gridCopy) });
    }
  },

  setIslandGrid: (rows: number, cols: number) => {
    const grid = new Grid(rows, cols);
    set(buildEmptyIslandState(grid));
  },

  toggleIslandCell: (row: number, col: number) => {
    const { islandGrid } = get();
    const newGrid = islandGrid.clone();
    const current = newGrid.at(row, col);
    newGrid.set(row, col, !current);
    set(buildEmptyIslandState(newGrid));
  },

  paintIslandCell: (row: number, col: number, value: boolean) => {
    const { islandGrid } = get();
    if (islandGrid.at(row, col) === value) return;
    const newGrid = islandGrid.clone();
    newGrid.set(row, col, value);
    set(buildEmptyIslandState(newGrid));
  },

  clearIslandGrid: () => {
    const { islandGrid } = get();
    const cleared = new Grid(islandGrid.rows, islandGrid.cols);
    set(buildEmptyIslandState(cleared));
  },

  runIslandCount: () => {
    const { islandGrid } = get();
    const grid = islandGrid.clone();
    const n = grid.size;
    const visited = new Array<boolean>(n).fill(false);
    const colors = new Array<number>(n).fill(-1);
    const components: number[][] = [];
    const componentSizes: number[] = [];
    const steps: IslandAnimationStep[] = [];
    let islands = 0;

    for (let i = 0; i < n; i++) {
      if (!visited[i] && grid.at(i)) {
        const stack: number[] = [i];
        visited[i] = true;
        const compCells: number[] = [];
        while (stack.length > 0) {
          const current = stack.pop()!;
          compCells.push(current);
          colors[current] = islands;
          steps.push({ cell: current, component: islands });

          for (const neighbor of grid.neighbors(current)) {
            if (!visited[neighbor] && grid.at(neighbor)) {
              visited[neighbor] = true;
              stack.push(neighbor);
            }
          }
        }
        components.push(compCells);
        componentSizes.push(compCells.length);
        islands++;
      }
    }

    const countMessage = `Islands: ${islands}`;
    get().addResult({
      algorithm: 'islands',
      title: 'Island Count (Grid)',
      message: countMessage,
      details: [`Grid size: ${grid.rows} × ${grid.cols}`, `Number of islands: ${islands}`],
      timestamp: Date.now(),
    });

    set({
      islandCount: islands,
      islandComponents: components,
      islandComponentSizes: componentSizes,
      islandFinalColors: colors,
      islandAnimationSteps: steps,
      islandAnimationIndex: 0,
      islandColors: new Array(n).fill(-1),
      isIslandAnimating: steps.length > 0,
    });
  },

  advanceIslandAnimation: () => {
    set((state) => {
      if (!state.isIslandAnimating || state.islandAnimationSteps.length === 0) {
        return {};
      }

      const nextIndex = Math.min(state.islandAnimationSteps.length, state.islandAnimationIndex + 1);
      if (nextIndex === state.islandAnimationIndex) return {};

      const newColors = state.islandColors.slice();
      const step = state.islandAnimationSteps[nextIndex - 1];
      newColors[step.cell] = step.component;

      const finished = nextIndex >= state.islandAnimationSteps.length;
      return {
        islandColors: finished ? state.islandFinalColors.slice() : newColors,
        islandAnimationIndex: nextIndex,
        isIslandAnimating: !finished,
      };
    });
  },

  skipIslandAnimation: () => {
    set((state) => ({
      islandColors: state.islandFinalColors.slice(),
      islandAnimationIndex: state.islandAnimationSteps.length,
      isIslandAnimating: false,
    }));
  },

  setIslandAnimationSpeed: (ms: number) => set({ islandAnimationSpeed: Math.max(20, ms) }),

  importJSON: (json: string) => {
    try {
      const data = JSON.parse(json);
      const graph = Graph.fromJSON(data);
      const positions = generatePositions(graph);
      set({ graph, positions, nodeColors: {}, edgeColors: {}, selectedNode: null });
    } catch {
      throw new Error('Invalid JSON format');
    }
  },

  exportJSON: () => {
    const { graph } = get();
    return JSON.stringify(graph.toJSON(), null, 2);
  },
}));
