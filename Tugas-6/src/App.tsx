import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network, Play, RotateCcw, Download, Upload, Plus, Minus, Trash2,
  ChevronLeft, ChevronRight, Search, GitBranch, CircleDot, Route,
  Waypoints, Layers, Split, Ruler, RefreshCw, Target, Hexagon,
  Info, X, Zap, Eye, EyeOff, Clock, ArrowRight, Settings,
  Triangle, Diamond, Star, Box, Circle, Sparkles, Grid3x3, ToggleLeft, ToggleRight, Cuboid, Square, MapPin,
  Users, Calendar, ExternalLink
} from 'lucide-react';
import GraphCanvas3D from './components/canvas/GraphCanvas3D';
import GraphCanvas2D from './components/canvas/GraphCanvas2D';
import IslandCanvas from './components/canvas/IslandCanvas';
import { ResultDetailsModal } from './components/ResultDetailsModal';
import { useGraphStore } from './store/useGraphStore';
import { Grid } from './core/Graph';
import { GraphAlgorithms } from './core/GraphAlgorithms';
import { useForceSimulation } from './hooks/useForceSimulation';
import { useAlgorithmAnimation } from './hooks/useAlgorithmAnimation';

/* ============================================
   PRESET DEFINITIONS
   ============================================ */
const PRESETS = [
  { id: 'petersen', name: 'Petersen', icon: Hexagon, desc: 'Classic Petersen graph', badge: 'Famous' },
  { id: 'k5', name: 'K₅', icon: Star, desc: 'Complete graph on 5 vertices', badge: 'Complete' },
  { id: 'k6', name: 'K₆', icon: Star, desc: 'Complete graph on 6 vertices', badge: 'Complete' },
  { id: 'k33', name: 'K₃,₃', icon: Split, desc: 'Complete bipartite 3,3', badge: 'Bipartite' },
  { id: 'k44', name: 'K₄,₄', icon: Split, desc: 'Complete bipartite 4,4', badge: 'Bipartite' },
  { id: 'cycle5', name: 'C₅', icon: Circle, desc: 'Cycle on 5 vertices', badge: 'Cycle' },
  { id: 'cycle6', name: 'C₆', icon: Circle, desc: 'Cycle on 6 vertices', badge: 'Cycle' },
  { id: 'cycle8', name: 'C₈', icon: Circle, desc: 'Cycle on 8 vertices', badge: 'Cycle' },
  { id: 'star5', name: 'S₅', icon: Sparkles, desc: 'Star with 5 leaves', badge: 'Star' },
  { id: 'star8', name: 'S₈', icon: Sparkles, desc: 'Star with 8 leaves', badge: 'Star' },
  { id: 'cube', name: 'Cube', icon: Box, desc: '3-dimensional cube graph', badge: '3D' },
  { id: 'wheel6', name: 'W₆', icon: Target, desc: 'Wheel on 6 rim nodes', badge: 'Wheel' },
  { id: 'wheel8', name: 'W₈', icon: Target, desc: 'Wheel on 8 rim nodes', badge: 'Wheel' },
  { id: 'binaryTree3', name: 'Binary Tree', icon: GitBranch, desc: 'Depth-3 binary tree (Tₙ)', badge: 'Tree' },
  { id: 'path5', name: 'P₅', icon: ArrowRight, desc: 'Path graph on 5 vertices', badge: 'Path' },
  { id: 'path8', name: 'P₈', icon: ArrowRight, desc: 'Path graph on 8 vertices', badge: 'Path' },
  { id: 'prism5', name: 'Y₅', icon: Cuboid, desc: 'Pentagonal prism (C₅ □ K₂)', badge: 'Prism' },
  { id: 'prism6', name: 'Y₆', icon: Cuboid, desc: 'Hexagonal prism (C₆ □ K₂)', badge: 'Prism' },
  { id: 'genPetersen7_2', name: 'P(7,2)', icon: Hexagon, desc: 'Generalized Petersen P(7,2)', badge: 'Gen-Pet' },
  { id: 'genPetersen8_3', name: 'P(8,3)', icon: Hexagon, desc: 'Möbius–Kantor-like P(8,3)', badge: 'Gen-Pet' },
  { id: 'circulant8_1_3', name: 'C₈(1,3)', icon: Circle, desc: 'Circulant graph C₈(1,3)', badge: 'Circulant' },
  { id: 'circulant10_1_2', name: 'C₁₀(1,2)', icon: Circle, desc: 'Circulant graph C₁₀(1,2)', badge: 'Circulant' },
  { id: 'hypercube3', name: 'Q₃', icon: Box, desc: 'Hypercube H(3) — 8 vertices', badge: 'Hypercube' },
  { id: 'hypercube4', name: 'Q₄', icon: Box, desc: 'Hypercube H(4) — 16 vertices', badge: 'Hypercube' },
  { id: 'grid3x3', name: 'Grid 3×3', icon: Layers, desc: '3×3 grid graph', badge: 'Grid' },
  { id: 'grid4x4', name: 'Grid 4×4', icon: Layers, desc: '4×4 grid graph', badge: 'Grid' },
  { id: 'directedAcyclic', name: 'DAG', icon: ArrowRight, desc: 'Directed acyclic graph', badge: 'Directed' },
  { id: 'directedCyclic', name: 'Directed Cycle', icon: RefreshCw, desc: 'Directed graph with cycle', badge: 'Directed' },
  { id: 'disconnected', name: 'Disconnected', icon: Triangle, desc: 'Graph with 3 components', badge: 'Multi' },
  { id: 'tspSample4', name: 'TSP-Sample-4', icon: Route, desc: '4-city complete weighted graph for TSP', badge: 'TSP' },
  { id: 'tspSample5', name: 'TSP-Sample-5', icon: Route, desc: '5-city complete weighted graph for TSP', badge: 'TSP' },
  { id: 'tspSample6', name: 'TSP-Sample-6', icon: Route, desc: '6-city complete weighted graph for TSP', badge: 'TSP' },
  { id: 'tspSample7', name: 'TSP-Sample-7', icon: Route, desc: '7-city complete weighted graph for TSP', badge: 'TSP' },
  // ---- Kelas Graf Penting (urutan sesuai daftar tugas) ----
  { id: 'completeK7', name: 'K₇', icon: Star, desc: 'Graf lengkap pada 7 vertex', badge: 'Complete' },
  { id: 'bipartiteK25', name: 'K₂,₅', icon: Split, desc: 'Graf bipartit lengkap K₂,₅', badge: 'Bipartite' },
  { id: 'treeT4', name: 'T (d=4)', icon: GitBranch, desc: 'Pohon Tₙ — binary tree kedalaman 4', badge: 'Tree' },
  { id: 'cycleC7', name: 'C₇', icon: Circle, desc: 'Siklus Cₙ pada 7 vertex', badge: 'Cycle' },
  { id: 'pathP6', name: 'P₆', icon: ArrowRight, desc: 'Lintasan Pₙ pada 6 vertex', badge: 'Path' },
  { id: 'wheelW5', name: 'W₅', icon: Target, desc: 'Graf roda Wₙ dengan 5 rim', badge: 'Wheel' },
  { id: 'prismY4', name: 'Y₄', icon: Cuboid, desc: 'Graf prisma Y₄ (C₄ □ K₂)', badge: 'Prism' },
  { id: 'petersenOrder', name: 'Petersen', icon: Hexagon, desc: 'Petersen graph (klasik)', badge: 'Famous' },
  { id: 'genPetersen9_2', name: 'P(9,2)', icon: Hexagon, desc: 'Generalized Petersen P(9,2)', badge: 'Gen-Pet' },
  { id: 'circulant7_1_2', name: 'C₇(1,2)', icon: Circle, desc: 'Circulant graph C₇(1,2)', badge: 'Circulant' },
  { id: 'hypercubeQ2', name: 'Q₂', icon: Box, desc: 'Hypercube H(2) = C₄', badge: 'Hypercube' },
  { id: 'gridG5x5', name: 'G(5,5)', icon: Layers, desc: 'Grid graph G(5,5)', badge: 'Grid' },
  { id: 'tspKota8', name: 'TSP-Kota-8', icon: MapPin, desc: '8 Indonesian cities with Euclidean distances', badge: 'TSP' },
  { id: 'tspGrid9', name: 'TSP-Grid-9', icon: Grid3x3, desc: '9 cities on a 3×3 grid (Euclidean)', badge: 'TSP' },
  { id: 'tspCluster8', name: 'TSP-Cluster-8', icon: CircleDot, desc: '8 cities in 2 clusters', badge: 'TSP' },
  { id: 'tspEuclidean10', name: 'TSP-Euc-10', icon: Route, desc: '10 random Euclidean points', badge: 'TSP' },
  { id: 'assignKaryawan44', name: 'Penugasan 4×4', icon: Users, desc: '4 karyawan × 4 pekerjaan (bipartit)', badge: 'Penugasan' },
  { id: 'assignKaryawan35', name: 'Penugasan 3×5', icon: Users, desc: '3 karyawan × 5 pekerjaan (bipartit)', badge: 'Penugasan' },
  { id: 'assignKaryawan69', name: 'Penugasan 6×9', icon: Users, desc: '6 karyawan × 9 pekerjaan (bipartit)', badge: 'Penugasan' },
  { id: 'timetableExample34', name: 'Jadwal 3×4', icon: Calendar, desc: '3 guru × 4 kelas', badge: 'Jadwal' },
  { id: 'timetableExample45', name: 'Jadwal 4×5', icon: Calendar, desc: '4 guru × 5 kelas (beban bervariasi)', badge: 'Jadwal' },
  { id: 'timetableExample56', name: 'Jadwal 5×6', icon: Calendar, desc: '5 guru × 6 kelas (kompleks)', badge: 'Jadwal' },
];

/* ============================================
   ALGORITHM DEFINITIONS
   ============================================ */
const ALGORITHMS = [
  {
    id: 'dfs', name: 'Depth-First Search', desc: 'Traverse the graph using DFS',
    icon: Search, badge: 'Traversal', cardClass: 'algo-card-dfs',
    needsStart: true, needsEnd: false, category: 'traversal',
  },
  {
    id: 'bfs', name: 'Breadth-First Search', desc: 'Traverse the graph using BFS',
    icon: Waypoints, badge: 'Traversal', cardClass: 'algo-card-bfs',
    needsStart: true, needsEnd: false, category: 'traversal',
  },
  {
    id: 'path', name: 'Path Existence', desc: 'Check if a path exists between two nodes',
    icon: Route, badge: 'Path', cardClass: 'algo-card-path',
    needsStart: true, needsEnd: true, category: 'traversal',
  },
  {
    id: 'connectivity', name: 'Connectivity Check', desc: 'Check if the graph is connected',
    icon: Network, badge: 'Connectivity', cardClass: 'algo-card-connectivity',
    needsStart: false, needsEnd: false, category: 'structure',
  },
  {
    id: 'components', name: 'Connected Components', desc: 'Find all connected components',
    icon: Layers, badge: 'Components', cardClass: 'algo-card-components',
    needsStart: false, needsEnd: false, category: 'structure',
  },
  {
    id: 'islands', name: 'Island Count', desc: 'Count islands in a grid graph (Tugas 2)',
    icon: Grid3x3, badge: 'Grid', cardClass: 'algo-card-components',
    needsStart: false, needsEnd: false, category: 'structure',
  },
  {
    id: 'bipartite', name: 'Bipartite Check', desc: 'Determine if the graph is bipartite',
    icon: Split, badge: 'Bipartite', cardClass: 'algo-card-bipartite',
    needsStart: true, needsEnd: false, category: 'property',
  },
  {
    id: 'diameter', name: 'Graph Diameter', desc: 'Find the diameter of the graph',
    icon: Ruler, badge: 'Diameter', cardClass: 'algo-card-diameter',
    needsStart: false, needsEnd: false, category: 'property',
  },
  {
    id: 'cycle', name: 'Cycle Detection', desc: 'Detect cycles in the graph',
    icon: RefreshCw, badge: 'Cycle', cardClass: 'algo-card-cycle',
    needsStart: false, needsEnd: false, category: 'property',
  },
  {
    id: 'girth', name: 'Girth (Shortest Cycle)', desc: 'Find the shortest cycle length',
    icon: Diamond, badge: 'Girth', cardClass: 'algo-card-girth',
    needsStart: false, needsEnd: false, category: 'property',
  },
  {
    id: 'djikstra', name: 'Djikstra', desc: 'Find shortest paths from a start node',
    icon: Route, badge: 'Shortest Path', cardClass: 'algo-card-path',
    needsStart: true, needsEnd: 'optional', category: 'weighted',
  },
  {
    id: 'prims', name: "Prim's Algorithm", desc: 'Find Minimum Spanning Tree starting from a node',
    icon: GitBranch, badge: 'MST', cardClass: 'algo-card-components',
    needsStart: true, needsEnd: false, category: 'weighted',
  },
  {
    id: 'kruskal', name: "Kruskal's Algorithm", desc: 'Find Minimum Spanning Tree of the whole graph',
    icon: Network, badge: 'MST', cardClass: 'algo-card-connectivity',
    needsStart: false, needsEnd: false, category: 'weighted',
  },
  {
    id: 'tsp', name: 'TSP (Brute Force)', desc: 'Exact Traveling Salesman via Hamiltonian circuit enumeration',
    icon: Route, badge: 'TSP', cardClass: 'algo-card-path',
    needsStart: true, needsEnd: false, category: 'weighted',
  },
  {
    id: 'tspGreedy', name: 'TSP (Greedy NN)', desc: 'Nearest Neighbor heuristic (Rosenkrantz–Stearns–Lewis, 1977) — fast, not guaranteed optimal',
    icon: Route, badge: 'TSP', cardClass: 'algo-card-path',
    needsStart: true, needsEnd: false, category: 'weighted',
  },
  {
    id: 'personnelAssignment',
    name: 'Penugasan Personel',
    desc: 'Pencocokan bipartit maksimum via M-Alternating Tree (augmenting paths)',
    icon: Users, badge: 'Matching', cardClass: 'algo-card-bipartite',
    needsStart: false, needsEnd: false, category: 'matching',
  },
  {
    id: 'timetabling',
    name: 'Jadwal Kelas',
    desc: 'Edge colouring pada bipartit (Guru × Kelas) dengan penyeimbangan periode',
    icon: Calendar, badge: 'Scheduling', cardClass: 'algo-card-bipartite',
    needsStart: false, needsEnd: false, category: 'matching',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'traversal', label: 'Traversal' },
  { id: 'structure', label: 'Structure' },
  { id: 'property', label: 'Properties' },
  { id: 'weighted', label: 'Weighted' },
  { id: 'matching', label: 'Matching' },
];

/* ============================================
   HEADER COMPONENT
   ============================================ */
function Header() {
  const graph = useGraphStore((s) => s.graph);
  const isAnimating = useGraphStore((s) => s.isAnimating);
  const viewMode = useGraphStore((s) => s.viewMode);
  const setViewMode = useGraphStore((s) => s.setViewMode);
  const graphMode = useGraphStore((s) => s.graphMode);
  const setGraphMode = useGraphStore((s) => s.setGraphMode);
  const islandGrid = useGraphStore((s) => s.islandGrid);
  const showEdgeWeights = useGraphStore((s) => s.showEdgeWeights);
  const setShowEdgeWeights = useGraphStore((s) => s.setShowEdgeWeights);

  return (
    <header className="absolute top-0 left-0 right-0 z-30 h-14">
      <div className="h-full flex items-center justify-between px-4 glass-medium border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 flex items-center justify-center">
            <Network className="w-4 h-4 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-sm font-bold gradient-text-cyan-purple tracking-wide">
              Graph Theory Explorer
            </h1>
            <p className="text-[10px] text-gray-500 -mt-0.5">
              Interactive Graph Algorithms Lab
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Graph Mode Toggle */}
          <div className="flex items-center gap-1 stat-card !p-0.5">
            <button
              onClick={() => setGraphMode('undirected')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${graphMode === 'undirected' ? 'bg-neon-green/15 text-neon-green' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Undirected
            </button>
            <button
              onClick={() => setGraphMode('directed')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${graphMode === 'directed' ? 'bg-neon-orange/15 text-neon-orange' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <ArrowRight className="w-3 h-3 inline mr-1" />Directed
            </button>
            <button
              onClick={() => setGraphMode('island')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${graphMode === 'island' ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Grid3x3 className="w-3 h-3 inline mr-1" />Island
            </button>
          </div>

          {graph.isWeighted && graphMode !== 'island' && (
            <div className="flex items-center gap-1 stat-card !p-0.5 px-2">
              <input
                type="checkbox"
                id="show-weights"
                checked={showEdgeWeights}
                onChange={(e) => setShowEdgeWeights(e.target.checked)}
                className="w-3 h-3 accent-neon-purple rounded cursor-pointer"
              />
              <label htmlFor="show-weights" className="text-xs text-gray-500 font-medium cursor-pointer hover:text-gray-300 select-none">
                Weights
              </label>
            </div>
          )}

          {/* Stats */}
          {graphMode !== 'island' ? (
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="stat-card !p-1.5 !px-3 flex items-center gap-2">
                <CircleDot className="w-3 h-3 text-neon-cyan" />
                <span className="font-mono">{graph.size}</span>
                <span className="text-gray-500">nodes</span>
              </div>
              <div className="stat-card !p-1.5 !px-3 flex items-center gap-2">
                <GitBranch className="w-3 h-3 text-neon-purple" />
                <span className="font-mono">{graph.getEdges().length}</span>
                <span className="text-gray-500">edges</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="stat-card !p-1.5 !px-3 flex items-center gap-2">
                <Grid3x3 className="w-3 h-3 text-neon-cyan" />
                <span className="font-mono">{islandGrid.rows}×{islandGrid.cols}</span>
                <span className="text-gray-500">grid</span>
              </div>
            </div>
          )}

          {/* 2D/3D toggle — only for graph modes */}
          {graphMode !== 'island' && (
            <div className="flex items-center gap-1 stat-card !p-0.5">
              <button
                onClick={() => setViewMode('2d')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${viewMode === '2d' ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Square className="w-3 h-3 inline mr-1" />2D
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${viewMode === '3d' ? 'bg-neon-purple/15 text-neon-purple' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Cuboid className="w-3 h-3 inline mr-1" />3D
              </button>
            </div>
          )}

          {isAnimating && (
            <div className="flex items-center gap-2 badge-cyan text-xs">
              <Zap className="w-3 h-3 animate-pulse" />
              <span>Running...</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ============================================
   LEFT PANEL — GRAPH SETUP
   ============================================ */
function LeftPanel() {
  const graph = useGraphStore((s) => s.graph);
  const loadPreset = useGraphStore((s) => s.loadPreset);
  const addNode = useGraphStore((s) => s.addNode);
  const addEdge = useGraphStore((s) => s.addEdge);
  const removeNode = useGraphStore((s) => s.removeNode);
  const clearGraph = useGraphStore((s) => s.clearGraph);
  const selectedNode = useGraphStore((s) => s.selectedNode);
  const leftPanelOpen = useGraphStore((s) => s.leftPanelOpen);
  const toggleLeftPanel = useGraphStore((s) => s.toggleLeftPanel);
  const importJSON = useGraphStore((s) => s.importJSON);
  const exportJSON = useGraphStore((s) => s.exportJSON);

  const setGraphMode = useGraphStore((s) => s.setGraphMode);
  const graphMode = useGraphStore((s) => s.graphMode);

  const [newNodeName, setNewNodeName] = useState('');
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('1');
  const [showJSON, setShowJSON] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [activeSection, setActiveSection] = useState<'presets' | 'manual' | 'json'>('presets');
  const [presetSearch, setPresetSearch] = useState('');

  const handleAddNode = useCallback(() => {
    if (newNodeName.trim()) {
      addNode(newNodeName.trim());
      setNewNodeName('');
    }
  }, [newNodeName, addNode]);

  const handleAddEdge = useCallback(() => {
    if (edgeFrom.trim() && edgeTo.trim()) {
      const weight = graph.isWeighted ? parseFloat(edgeWeight) || 1 : 1;
      addEdge(edgeFrom.trim(), edgeTo.trim(), weight);
      setEdgeFrom('');
      setEdgeTo('');
      setEdgeWeight('1');
    }
  }, [edgeFrom, edgeTo, edgeWeight, addEdge, graph.isWeighted]);

  const handleImport = useCallback(() => {
    try {
      importJSON(jsonInput);
      setJsonError('');
      setShowJSON(false);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }, [jsonInput, importJSON]);

  const handleExport = useCallback(() => {
    const json = exportJSON();
    setJsonInput(json);
    setShowJSON(true);
  }, [exportJSON]);

  const filteredPresets = PRESETS.filter((p) =>
    p.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
    p.desc.toLowerCase().includes(presetSearch.toLowerCase()) ||
    p.badge.toLowerCase().includes(presetSearch.toLowerCase())
  );

  return (
    <>
      <button
        onClick={toggleLeftPanel}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-40 btn-icon rounded-l-none !rounded-r-lg !p-1.5"
        style={{ left: leftPanelOpen ? '340px' : '0px', transition: 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {leftPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      <div
        className={`absolute left-0 top-14 bottom-0 w-[340px] z-30 glass-heavy border-r border-white/5 overflow-hidden flex flex-col panel-left ${!leftPanelOpen ? 'closed' : ''}`}
      >
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Settings className="w-4 h-4 text-neon-cyan" />
              Graph Setup
            </h2>
            <div className="flex gap-1">
              <button onClick={handleExport} className="btn-icon !p-1.5" title="Export JSON">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setShowJSON(true); setActiveSection('json'); }} className="btn-icon !p-1.5" title="Import JSON">
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button onClick={clearGraph} className="btn-icon !p-1.5 hover:!text-red-400 hover:!border-red-400/30" title="Clear Graph">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="tab-bar">
            {(['presets', 'manual', 'json'] as const).map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`tab-item flex-1 ${activeSection === section ? 'active' : ''}`}
              >
                {section === 'presets' ? 'Presets' : section === 'manual' ? 'Manual' : 'JSON'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence mode="wait">
            {activeSection === 'presets' && (
              <motion.div
                key="presets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    placeholder="Search presets..."
                    className="input-field !pl-9"
                  />
                </div>

                <div className="space-y-1.5">
                  {filteredPresets.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => loadPreset(preset.id)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all duration-200 group hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 group-hover:bg-neon-cyan/10 transition-colors">
                          <Icon className="w-4 h-4 text-gray-400 group-hover:text-neon-cyan transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                              {preset.name}
                            </span>
                            <span className="badge text-[10px] bg-white/5 text-gray-500 border border-white/5">
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">{preset.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeSection === 'manual' && (
              <motion.div
                key="manual"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="card flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowRight className={`w-4 h-4 ${graphMode === 'directed' ? 'text-neon-orange' : 'text-gray-500'}`} />
                    <span className="text-xs font-medium text-gray-300">Directed Graph</span>
                  </div>
                  <button
                    onClick={() => setGraphMode(graphMode === 'directed' ? 'undirected' : 'directed')}
                    className={`toggle ${graphMode === 'directed' ? 'active' : ''}`}
                  />
                </div>

                <div className="card flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waypoints className={`w-4 h-4 ${graph.isWeighted ? 'text-neon-cyan' : 'text-gray-500'}`} />
                    <span className="text-xs font-medium text-gray-300">Weighted Graph</span>
                  </div>
                  <button
                    onClick={() => useGraphStore.getState().setGraphWeighted(!graph.isWeighted)}
                    className={`toggle ${graph.isWeighted ? 'active' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Add Node</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNodeName}
                      onChange={(e) => setNewNodeName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
                      placeholder="Node name"
                      className="input-field flex-1"
                    />
                    <button onClick={handleAddNode} className="btn-primary !px-3 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>

                <div className="divider" />

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Add Edge</label>
                  <div className="flex gap-2">
                    <select
                      value={edgeFrom}
                      onChange={(e) => setEdgeFrom(e.target.value)}
                      className="select-field flex-1"
                    >
                      <option value="">From</option>
                      {graph.nodeNames.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <ArrowRight className="w-4 h-4 text-gray-500 self-center flex-shrink-0" />
                    <select
                      value={edgeTo}
                      onChange={(e) => setEdgeTo(e.target.value)}
                      className="select-field flex-1"
                    >
                      <option value="">To</option>
                      {graph.nodeNames.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  {graph.isWeighted && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={edgeWeight}
                        onChange={(e) => setEdgeWeight(e.target.value)}
                        placeholder="Weight"
                        className="input-field flex-1"
                      />
                    </div>
                  )}
                  <button onClick={handleAddEdge} className="btn-primary w-full flex items-center justify-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    Add Edge
                  </button>
                </div>

                <div className="divider" />

                {selectedNode && (
                  <div className="card card-active space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CircleDot className="w-4 h-4 text-neon-cyan" />
                        <span className="text-sm font-semibold text-white">{selectedNode}</span>
                      </div>
                      <button
                        onClick={() => removeNode(selectedNode)}
                        className="btn-danger !px-2 !py-1 text-xs flex items-center gap-1"
                      >
                        <Minus className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                    <div className="text-xs text-gray-400">
                      <span>Degree: {graph.getDegree(selectedNode)}</span>
                      <span className="mx-2">·</span>
                      <span>Neighbors: {graph.getNeighbors(selectedNode).join(', ') || 'none'}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Nodes ({graph.size})
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {graph.nodeNames.map((name) => (
                      <span
                        key={name}
                        className={`badge cursor-pointer transition-all ${
                          selectedNode === name ? 'badge-cyan' : 'bg-white/5 text-gray-400 border border-white/5 hover:border-white/10'
                        }`}
                        onClick={() => useGraphStore.getState().setSelectedNode(
                          selectedNode === name ? null : name
                        )}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Edges ({graph.getEdges().length})
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {graph.getEdges().map(([from, to], idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-white/[0.03] group"
                      >
                        <span className="text-gray-400">
                          <span className="text-gray-300">{from}</span>
                          <span className="mx-1.5 text-gray-600">{graph.isDirected ? '→' : '—'}</span>
                          <span className="text-gray-300">{to}</span>
                        </span>
                        <button
                          onClick={() => useGraphStore.getState().removeEdge(from, to)}
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'json' && (
              <motion.div
                key="json"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  JSON Import / Export
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => { setJsonInput(e.target.value); setJsonError(''); }}
                  placeholder='{"directed": false, "nodes": ["A","B","C"], "edges": [["A","B"],["B","C"]]}'
                  className="input-field !h-48 resize-none text-xs"
                  spellCheck={false}
                />
                {jsonError && (
                  <p className="text-xs text-red-400">{jsonError}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={handleImport} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Import
                  </button>
                  <button onClick={handleExport} className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

/* ============================================
   RIGHT PANEL — ALGORITHMS & RESULTS
   ============================================ */
function RightPanel() {
  const graph = useGraphStore((s) => s.graph);
  const runAlgorithm = useGraphStore((s) => s.runAlgorithm);
  const isAnimating = useGraphStore((s) => s.isAnimating);
  const results = useGraphStore((s) => s.results);
  const clearResults = useGraphStore((s) => s.clearResults);
  const clearColors = useGraphStore((s) => s.clearColors);
  const rightPanelOpen = useGraphStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useGraphStore((s) => s.toggleRightPanel);
  const animationSpeed = useGraphStore((s) => s.animationSpeed);
  const setAnimationSpeed = useGraphStore((s) => s.setAnimationSpeed);
  const selectedNode = useGraphStore((s) => s.selectedNode);

  const setGridGraph = useGraphStore((s) => s.setGridGraph);

  const [activeTab, setActiveTab] = useState<'algorithms' | 'results'>('algorithms');
  const [selectedAlgo, setSelectedAlgo] = useState<string | null>(null);
  const [startNode, setStartNode] = useState('');
  const [endNode, setEndNode] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [gridRows, setGridRows] = useState('3');
  const [gridCols, setGridCols] = useState('3');
  const [gridInput, setGridInput] = useState('110\n010\n001');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    message: string;
    details: string[];
    algorithm?: string;
    timestamp?: number;
  } | null>(null);
  
  // Panel resize state
  const [panelWidth, setPanelWidth] = useState(380);
  const dragRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (selectedNode && !startNode) {
      setStartNode(selectedNode);
    }
  }, [selectedNode]);

  // Resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setPanelWidth(Math.max(300, Math.min(newWidth, window.innerWidth - 200)));
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
    };

    if (isResizingRef.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, []);

  const handleOpenModal = (result: (typeof results)[0]) => {
    setModalData({
      title: result.title,
      message: result.message,
      details: result.details,
      algorithm: result.algorithm,
      timestamp: result.timestamp,
    });
    setModalOpen(true);
  };

  const handleRun = useCallback(() => {
    if (!selectedAlgo || isAnimating) return;
    const algo = ALGORITHMS.find((a) => a.id === selectedAlgo);
    if (!algo) return;

    if (selectedAlgo === 'islands') {
      const rows = parseInt(gridRows) || 0;
      const cols = parseInt(gridCols) || 0;
      if (rows > 0 && cols > 0) {
        const grid = new Grid(rows, cols);
        const lines = gridInput.trim().split('\n');
        for (let r = 0; r < Math.min(rows, lines.length); r++) {
          for (let c = 0; c < Math.min(cols, lines[r].length); c++) {
            grid.set(r, c, lines[r][c] === '1');
          }
        }
        setGridGraph(grid);
      }
      runAlgorithm('islands');
      setActiveTab('results');
      return;
    }

    if (graph.isEmpty) return;
    if (algo.needsStart && !startNode) return;
    if (algo.needsEnd === true && !endNode) return;

    runAlgorithm(
      selectedAlgo,
      algo.needsStart ? startNode : undefined,
      (algo.needsEnd === true || algo.needsEnd === 'optional') ? endNode : undefined
    );
    setActiveTab('results');
  }, [selectedAlgo, startNode, endNode, runAlgorithm, isAnimating, graph, gridRows, gridCols, gridInput, setGridGraph]);

  const handleClear = useCallback(() => {
    clearColors();
    clearResults();
  }, [clearColors, clearResults]);

  const filteredAlgorithms = ALGORITHMS.filter(
    (a) => categoryFilter === 'all' || a.category === categoryFilter
  );

  return (
    <>
      <button
        onClick={toggleRightPanel}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-40 btn-icon rounded-r-none !rounded-l-lg !p-1.5"
        style={{ right: rightPanelOpen ? '380px' : '0px', transition: 'right 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {rightPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div
        ref={dragRef}
        className={`absolute right-0 top-14 bottom-0 z-30 glass-heavy border-l border-white/5 overflow-hidden flex flex-col panel-right ${!rightPanelOpen ? 'closed' : ''}`}
        style={{ width: `${panelWidth}px` }}
      >
        {/* Resize handle */}
        <div
          onMouseDown={() => (isResizingRef.current = true)}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-neon-cyan/50 transition-colors group"
          title="Drag to resize panel"
        >
          {/* Visual indicator bar */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-neon-cyan/20 group-hover:bg-neon-cyan/80 rounded-full transition-all opacity-0 group-hover:opacity-100" />
        </div>

        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-purple" />
              Algorithms
            </h2>
            <div className="flex gap-1">
              <button onClick={handleClear} className="btn-icon !p-1.5" title="Clear results">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="tab-bar">
            <button
              onClick={() => setActiveTab('algorithms')}
              className={`tab-item flex-1 ${activeTab === 'algorithms' ? 'active' : ''}`}
            >
              Algorithms
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`tab-item flex-1 relative ${activeTab === 'results' ? 'active' : ''}`}
            >
              Results
              {results.length > 0 && (
                <span className="ml-1.5 w-4 h-4 rounded-full bg-neon-purple/20 text-neon-purple text-[10px] inline-flex items-center justify-center">
                  {results.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'algorithms' && (
              <motion.div
                key="algorithms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex gap-1 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`badge text-[10px] cursor-pointer transition-all ${
                        categoryFilter === cat.id
                          ? 'badge-cyan'
                          : 'bg-white/5 text-gray-500 border border-white/5 hover:border-white/10'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {filteredAlgorithms.map((algo) => {
                    const Icon = algo.icon;
                    const isSelected = selectedAlgo === algo.id;
                    return (
                      <div
                        key={algo.id}
                        onClick={() => setSelectedAlgo(isSelected ? null : algo.id)}
                        className={`algo-card ${algo.cardClass} ${isSelected ? 'card-active' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 algo-icon" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-200">{algo.name}</span>
                              <span className="algo-badge badge text-[10px]">{algo.badge}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">{algo.desc}</p>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-white/5 space-y-3" onClick={(e) => e.stopPropagation()}>
                                {algo.id === 'islands' && (
                                  <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider">Grid Dimensions</label>
                                    <div className="flex gap-2">
                                      <input type="number" value={gridRows} onChange={(e) => setGridRows(e.target.value)} placeholder="Rows" className="input-field flex-1" min="1" max="20" />
                                      <span className="text-gray-500 self-center text-xs">×</span>
                                      <input type="number" value={gridCols} onChange={(e) => setGridCols(e.target.value)} placeholder="Cols" className="input-field flex-1" min="1" max="20" />
                                    </div>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider">Grid Data (0/1 per row)</label>
                                    <textarea
                                      value={gridInput}
                                      onChange={(e) => setGridInput(e.target.value)}
                                      placeholder="110\n010\n001"
                                      className="input-field !h-24 resize-none text-xs font-mono"
                                      spellCheck={false}
                                    />
                                  </div>
                                )}

                                {algo.needsStart && (
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider">Start Node</label>
                                    <select
                                      value={startNode}
                                      onChange={(e) => setStartNode(e.target.value)}
                                      className="select-field"
                                    >
                                      <option value="">Select start node</option>
                                      {graph.nodeNames.map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                                {(algo.needsEnd === true || algo.needsEnd === 'optional') && (
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider">{algo.needsEnd === 'optional' ? 'End Node (Optional)' : 'End Node'}</label>
                                    <select
                                      value={endNode}
                                      onChange={(e) => setEndNode(e.target.value)}
                                      className="select-field"
                                    >
                                      <option value="">{algo.needsEnd === 'optional' ? 'To all nodes' : 'Select end node'}</option>
                                      {graph.nodeNames.map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Animation Speed</span>
                                    <span className="text-neon-cyan">{animationSpeed}x</span>
                                  </label>
                                  <input
                                    type="range"
                                    min="0.25"
                                    max="4"
                                    step="0.25"
                                    value={animationSpeed}
                                    onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                                    className="w-full h-1 rounded-full appearance-none bg-white/10 accent-neon-cyan"
                                  />
                                </div>

                                <button
                                  onClick={handleRun}
                                  disabled={isAnimating || graph.isEmpty || (algo.needsStart && !startNode) || (algo.needsEnd === true && !endNode)}
                                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  Run {algo.name}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {results.length === 0 ? (
                  <div className="text-center py-12">
                    <Info className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No results yet.</p>
                    <p className="text-xs text-gray-600 mt-1">Select an algorithm and run it.</p>
                  </div>
                ) : (
                  results.map((result, idx) => {
                    const algo = ALGORITHMS.find((a) => a.id === result.algorithm);
                    const Icon = algo?.icon || Info;
                    const isExpanded = showDetails === idx;

                    return (
                      <motion.div
                        key={result.timestamp}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`card cursor-pointer ${algo?.cardClass || ''}`}
                        onClick={() => setShowDetails(isExpanded ? null : idx)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 algo-icon" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-200">{result.title}</span>
                              <span className="text-[10px] text-gray-500">
                                <Clock className="w-3 h-3 inline mr-0.5" />
                                {new Date(result.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 font-mono">{result.message}</p>

                            {/* "More" Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(result);
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-medium hover:bg-neon-cyan/20 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              More
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                                    {result.details.map((detail, dIdx) => (
                                      <p key={dIdx} className="text-[11px] text-gray-500 font-mono">
                                        {detail}
                                      </p>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ResultDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData?.title || ''}
        message={modalData?.message || ''}
        details={modalData?.details || []}
        algorithm={modalData?.algorithm}
        timestamp={modalData?.timestamp}
      />
    </>
  );
}

/* ============================================
   MAIN APP
   ============================================ */
export default function App() {
  const initPositions = useGraphStore((s) => s.initPositions);
  const viewMode = useGraphStore((s) => s.viewMode);
  const graphMode = useGraphStore((s) => s.graphMode);

  useForceSimulation();
  useAlgorithmAnimation();

  useEffect(() => {
    initPositions();
  }, []);

  return (
    <div className="w-screen h-screen bg-mesh bg-dots overflow-hidden relative">
      <Header />
      {graphMode !== 'island' && <LeftPanel />}
      {graphMode !== 'island' && <RightPanel />}

      <main className="absolute inset-0 pt-14">
        {graphMode === 'island' ? (
          <IslandCanvas />
        ) : viewMode === '3d' ? (
          <GraphCanvas3D />
        ) : (
          <GraphCanvas2D />
        )}
      </main>
    </div>
  );
}
