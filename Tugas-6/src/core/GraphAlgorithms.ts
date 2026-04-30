import { Graph, Grid } from './Graph';

class MinPriorityQueue<T> {
  private heap: { value: T; priority: number }[] = [];

  get size() { return this.heap.length; }

  push(value: T, priority: number) {
    this.heap.push({ value, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): { value: T; priority: number } | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[i].priority >= this.heap[parent].priority) break;
      [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
      i = parent;
    }
  }

  private sinkDown(i: number) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
      if (right < n && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}

export interface TraversalResult {
  order: string[];
  visited: Set<string>;
}

export interface PathResult {
  exists: boolean;
  path: string[];
}

export interface BipartiteResult {
  isBipartite: boolean;
  partitionA: string[];
  partitionB: string[];
}

export interface CycleResult {
  hasCycle: boolean;
  cycle: string[];
}

export interface DiameterResult {
  diameter: number;
  path: string[];
}

export interface GirthResult {
  girth: number;
  cycle: string[];
}

export interface ConnectivityResult {
  isConnected: boolean;
  isStronglyConnected: boolean;
  componentCount: number;
  components: string[][];
  largestComponentSize: number;
}

export interface TSPResult {
  bestTour: string[];
  bestCost: number;
  permutationsChecked: number;
  allTours: Array<{ tour: string[]; cost: number }>;
  feasible: boolean;
}

export interface TSPGreedyStep {
  from: string;
  to: string;
  weight: number;
  candidates: Array<{ city: string; weight: number }>;
}

export interface TSPGreedyResult {
  tour: string[];
  totalCost: number;
  steps: TSPGreedyStep[];
  feasible: boolean;
}

export interface PersonnelAssignmentResult {
  isBipartite: boolean;
  partitionA: string[];
  partitionB: string[];
  matching: Array<[string, string]>;
  matchingSize: number;
  unmatchedA: string[];
  unmatchedB: string[];
  augmentingPaths: Array<string[]>;
}

export interface TimeTableingResult {
  isBipartite: boolean;
  partitionX: string[];
  partitionY: string[];
  maxDegree: number;
  totalEdges: number;
  minPeriodsNeeded: number;
  roomConstraint: number;
  matchings: Array<Array<[string, string]>>;
  periodUtilization: number[];
  isBalanced: boolean;
  isValid: boolean;
  timetable: string[][];
  balanceDetails: string;
}

export interface AlgorithmStepEvent {
  type: 'visit' | 'enqueue' | 'dequeue' | 'backtrack' | 'highlight-edge' | 'highlight-node' | 'color-node' | 'color-edge' | 'result';
  nodes?: string[];
  edges?: Array<[string, string]>;
  color?: string;
  message?: string;
  delay?: number;
}

export class GraphAlgorithms {
  static depthFirstSearch(graph: Graph, startName: string): TraversalResult {
    const order: string[] = [];
    const visited = new Set<string>();

    const startId = graph.getId(startName);
    const stack: number[] = [startId];
    const visitedIds = new Set<number>([startId]);

    while (stack.length > 0) {
      const current = stack.pop()!;
      const currentName = graph.getName(current);
      order.push(currentName);
      visited.add(currentName);

      const neighbors = graph.getAdjList(current);
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const neighbor = neighbors[i];
        if (!visitedIds.has(neighbor)) {
          visitedIds.add(neighbor);
          stack.push(neighbor);
        }
      }
    }

    return { order, visited };
  }

  static breadthFirstSearch(graph: Graph, startName: string): TraversalResult {
    const order: string[] = [];
    const visited = new Set<string>();

    const startId = graph.getId(startName);
    const queue: number[] = [startId];
    const visitedIds = new Set<number>([startId]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentName = graph.getName(current);
      order.push(currentName);
      visited.add(currentName);

      for (const neighbor of graph.getAdjList(current)) {
        if (!visitedIds.has(neighbor)) {
          visitedIds.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return { order, visited };
  }

  static findPath(graph: Graph, fromName: string, toName: string): PathResult {
    const fromId = graph.getId(fromName);
    const toId = graph.getId(toName);

    const visited = new Set<number>([fromId]);
    const parent = new Map<number, number>();
    const queue: number[] = [fromId];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === toId) {
        const path: string[] = [];
        let node = toId;
        while (node !== fromId) {
          path.unshift(graph.getName(node));
          node = parent.get(node)!;
        }
        path.unshift(graph.getName(fromId));
        return { exists: true, path };
      }

      for (const neighbor of graph.getAdjList(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    return { exists: false, path: [] };
  }

  static pathExists(graph: Graph, fromName: string, toName: string): boolean {
    return this.findPath(graph, fromName, toName).exists;
  }

  static isConnected(graph: Graph, strongly: boolean = false): ConnectivityResult {
    if (graph.isEmpty) {
      return {
        isConnected: true,
        isStronglyConnected: true,
        componentCount: 0,
        components: [],
        largestComponentSize: 0,
      };
    }

    const components: string[][] = [];
    const visitedGlobal = new Set<number>();
    let largestComponentSize = 0;

    for (let i = 0; i < graph.size; i++) {
      if (!visitedGlobal.has(i)) {
        const component: string[] = [];
        const stack: number[] = [i];
        visitedGlobal.add(i);

        while (stack.length > 0) {
          const current = stack.pop()!;
          component.push(graph.getName(current));

          for (const neighbor of graph.getAdjList(current)) {
            if (!visitedGlobal.has(neighbor)) {
              visitedGlobal.add(neighbor);
              stack.push(neighbor);
            }
          }
        }

        components.push(component);
        largestComponentSize = Math.max(largestComponentSize, component.length);
      }
    }

    const isConnected = components.length === 1;

    let isStronglyConnected = isConnected;
    if (strongly && graph.isDirected && isConnected) {
      const transposed = new Graph(true);
      for (let i = 0; i < graph.size; i++) {
        transposed.addNode(graph.getName(i));
      }
      for (let i = 0; i < graph.size; i++) {
        for (const neighbor of graph.getAdjList(i)) {
          transposed.addEdge(graph.getName(neighbor), graph.getName(i));
        }
      }

      const visited2 = new Set<number>([0]);
      const stack2: number[] = [0];
      while (stack2.length > 0) {
        const current = stack2.pop()!;
        for (const neighbor of transposed.getAdjList(current)) {
          if (!visited2.has(neighbor)) {
            visited2.add(neighbor);
            stack2.push(neighbor);
          }
        }
      }

      isStronglyConnected = visited2.size === graph.size;
    }

    return {
      isConnected,
      isStronglyConnected,
      componentCount: components.length,
      components,
      largestComponentSize,
    };
  }

  static findComponentCount(graph: Graph): number {
    return this.isConnected(graph).componentCount;
  }

  static findLargestComponent(graph: Graph): number {
    return this.isConnected(graph).largestComponentSize;
  }

  static isBipartite(graph: Graph): BipartiteResult {
    if (graph.isEmpty) {
      return { isBipartite: true, partitionA: [], partitionB: [] };
    }

    const color = new Array<number>(graph.size).fill(-1);
    const partitionA: string[] = [];
    const partitionB: string[] = [];
    let bipartite = true;

    for (let start = 0; start < graph.size && bipartite; start++) {
      if (color[start] !== -1) continue;

      color[start] = 0;
      const queue: number[] = [start];

      while (queue.length > 0 && bipartite) {
        const current = queue.shift()!;

        for (const neighbor of graph.getAdjList(current)) {
          if (color[neighbor] === -1) {
            color[neighbor] = 1 - color[current];
            queue.push(neighbor);
          } else if (color[neighbor] === color[current]) {
            bipartite = false;
            break;
          }
        }
      }
    }

    if (bipartite) {
      for (let i = 0; i < graph.size; i++) {
        if (color[i] === 0) {
          partitionA.push(graph.getName(i));
        } else {
          partitionB.push(graph.getName(i));
        }
      }
    }

    return { isBipartite: bipartite, partitionA, partitionB };
  }

  static diameter(graph: Graph): DiameterResult {
    if (graph.isEmpty) {
      return { diameter: 0, path: [] };
    }

    const n = graph.size;
    let maxDiameter = 0;
    let diameterPath: string[] = [];

    for (let source = 0; source < n; source++) {
      const dist = new Array<number>(n).fill(-1);
      const parent = new Array<number>(n).fill(-1);
      dist[source] = 0;
      const queue: number[] = [source];

      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const neighbor of graph.getAdjList(current)) {
          if (dist[neighbor] === -1) {
            dist[neighbor] = dist[current] + 1;
            parent[neighbor] = current;
            queue.push(neighbor);
          }
        }
      }

      let maxDist = 0;
      let farthestNode = source;
      for (let i = 0; i < n; i++) {
        if (dist[i] > maxDist) {
          maxDist = dist[i];
          farthestNode = i;
        }
      }

      if (maxDist > maxDiameter) {
        maxDiameter = maxDist;
        const path: string[] = [];
        let node = farthestNode;
        while (node !== -1) {
          path.unshift(graph.getName(node));
          node = parent[node];
        }
        diameterPath = path;
      }
    }

    return { diameter: maxDiameter, path: diameterPath };
  }

  static detectCycle(graph: Graph): CycleResult {
    if (graph.isEmpty) {
      return { hasCycle: false, cycle: [] };
    }

    const n = graph.size;

    if (graph.isDirected) {
      const WHITE = 0, GRAY = 1, BLACK = 2;
      const color = new Array<number>(n).fill(WHITE);
      const parent = new Array<number>(n).fill(-1);

      for (let start = 0; start < n; start++) {
        if (color[start] !== WHITE) continue;

        const stack: Array<{ node: number; neighborIdx: number }> = [
          { node: start, neighborIdx: 0 },
        ];
        color[start] = GRAY;

        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          const neighbors = graph.getAdjList(top.node);

          if (top.neighborIdx >= neighbors.length) {
            color[top.node] = BLACK;
            stack.pop();
            continue;
          }

          const neighbor = neighbors[top.neighborIdx];
          top.neighborIdx++;

          if (color[neighbor] === GRAY) {
            const cycle: string[] = [];
            cycle.push(graph.getName(neighbor));
            for (let i = stack.length - 1; i >= 0; i--) {
              cycle.push(graph.getName(stack[i].node));
              if (stack[i].node === neighbor) break;
            }
            cycle.reverse();
            return { hasCycle: true, cycle };
          }

          if (color[neighbor] === WHITE) {
            color[neighbor] = GRAY;
            parent[neighbor] = top.node;
            stack.push({ node: neighbor, neighborIdx: 0 });
          }
        }
      }

      return { hasCycle: false, cycle: [] };
    } else {
      const visited = new Array<boolean>(n).fill(false);
      const parentArr = new Array<number>(n).fill(-1);

      for (let start = 0; start < n; start++) {
        if (visited[start]) continue;

        const stack: Array<{ node: number; neighborIdx: number }> = [
          { node: start, neighborIdx: 0 },
        ];
        visited[start] = true;

        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          const neighbors = graph.getAdjList(top.node);

          if (top.neighborIdx >= neighbors.length) {
            stack.pop();
            continue;
          }

          const neighbor = neighbors[top.neighborIdx];
          top.neighborIdx++;

          if (!visited[neighbor]) {
            visited[neighbor] = true;
            parentArr[neighbor] = top.node;
            stack.push({ node: neighbor, neighborIdx: 0 });
          } else if (neighbor !== parentArr[top.node]) {
            const cycle: string[] = [graph.getName(neighbor)];
            for (let i = stack.length - 1; i >= 0; i--) {
              cycle.push(graph.getName(stack[i].node));
              if (stack[i].node === neighbor) break;
            }
            return { hasCycle: true, cycle };
          }
        }
      }

      return { hasCycle: false, cycle: [] };
    }
  }

  static girth(graph: Graph): GirthResult {
    if (graph.isEmpty) {
      return { girth: Infinity, cycle: [] };
    }

    const n = graph.size;
    let minGirth = Infinity;
    let shortestCycle: string[] = [];

    for (let source = 0; source < n; source++) {
      const dist = new Array<number>(n).fill(-1);
      const parent = new Array<number>(n).fill(-1);
      dist[source] = 0;
      const queue: number[] = [source];

      while (queue.length > 0) {
        const current = queue.shift()!;

        for (const neighbor of graph.getAdjList(current)) {
          if (dist[neighbor] === -1) {
            dist[neighbor] = dist[current] + 1;
            parent[neighbor] = current;
            queue.push(neighbor);
          } else if (graph.isDirected || neighbor !== parent[current]) {
            const cycleLength = dist[current] + dist[neighbor] + 1;
            if (cycleLength < minGirth) {
              minGirth = cycleLength;

              const pathA: string[] = [];
              let nodeA = current;
              while (nodeA !== -1) {
                pathA.unshift(graph.getName(nodeA));
                nodeA = parent[nodeA];
              }

              const pathB: string[] = [];
              let nodeB = neighbor;
              while (nodeB !== -1 && nodeB !== source) {
                pathB.push(graph.getName(nodeB));
                nodeB = parent[nodeB];
              }

              shortestCycle = [...pathA, ...pathB];
            }
          }
        }
      }
    }

    return {
      girth: minGirth === Infinity ? Infinity : minGirth,
      cycle: shortestCycle,
    };
  }

  static djikstra(graph: Graph, startName: string): { distances: Map<string, number>, previous: Map<string, string | null> } {
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const visited = new Set<string>();
    const pq = new MinPriorityQueue<string>();

    for (const name of graph.nodeNames) {
      distances.set(name, Infinity);
      previous.set(name, null);
    }
    distances.set(startName, 0);
    pq.push(startName, 0);

    while (pq.size > 0) {
      const { value: currentName, priority: currentDist } = pq.pop()!;

      if (visited.has(currentName)) continue;
      visited.add(currentName);

      if (currentDist > distances.get(currentName)!) continue;

      const currentId = graph.getId(currentName);

      for (const neighborId of graph.getAdjList(currentId)) {
        const neighborName = graph.getName(neighborId);
        if (!visited.has(neighborName)) {
          const weight = graph.isWeighted ? graph.getWeightById(currentId, neighborId) : 1;
          const tentativeDistance = currentDist + weight;
          if (tentativeDistance < distances.get(neighborName)!) {
            distances.set(neighborName, tentativeDistance);
            previous.set(neighborName, currentName);
            pq.push(neighborName, tentativeDistance);
          }
        }
      }
    }

    return { distances, previous };
  }

  static prims(graph: Graph, startName: string): Array<[string, string, number]> {
    const mstEdges: Array<[string, string, number]> = [];
    const visited = new Set<number>();
    const startId = graph.getId(startName);

    visited.add(startId);

    while (visited.size < graph.size) {
      let minEdge: [number, number] | null = null;
      let minWeight = Infinity;

      for (const u of visited) {
        for (const v of graph.getAdjList(u)) {
          if (!visited.has(v)) {
            const weight = graph.isWeighted ? graph.getWeightById(u, v) : 1;
            if (weight < minWeight) {
              minWeight = weight;
              minEdge = [u, v];
            }
          }
        }
      }

      if (minEdge) {
        const weight = graph.isWeighted ? graph.getWeightById(minEdge[0], minEdge[1]) : 1;
        mstEdges.push([graph.getName(minEdge[0]), graph.getName(minEdge[1]), weight]);
        visited.add(minEdge[1]);
      } else {
        break; // Disconnected component
      }
    }

    return mstEdges;
  }

  static kruskal(graph: Graph): Array<[string, string, number]> {
    const mstEdges: Array<[string, string, number]> = [];
    const parent = new Array<number>(graph.size).fill(0).map((_, i) => i);

    const find = (i: number): number => {
      if (parent[i] === i) return i;
      return parent[i] = find(parent[i]);
    };

    const union = (i: number, j: number): boolean => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent[rootI] = rootJ;
        return true;
      }
      return false;
    };

    const edges = graph.getEdges();
    if (graph.isWeighted) {
      edges.sort((a, b) => a[2] - b[2]); // Sort by weight
    }

    for (const [uName, vName] of edges) {
      const u = graph.getId(uName);
      const v = graph.getId(vName);

      if (union(u, v)) {
        const weight = graph.isWeighted ? graph.getWeight(uName, vName) : 1;
        mstEdges.push([uName, vName, weight]);
        if (mstEdges.length === graph.size - 1) break;
      }
    }

    return mstEdges;
  }


  static tsp(graph: Graph, startName: string): TSPResult {
    const n = graph.size;
    if (n === 0) {
      return { bestTour: [], bestCost: 0, permutationsChecked: 0, allTours: [], feasible: false };
    }
    const startId = graph.getId(startName);

    const w: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row = new Array<number>(n).fill(Infinity);
      for (const nb of graph.getAdjList(i)) {
        row[nb] = graph.isWeighted ? graph.getWeightById(i, nb) : 1;
      }
      w[i] = row;
    }

    const others: number[] = [];
    for (let i = 0; i < n; i++) if (i !== startId) others.push(i);

    const allTours: Array<{ tour: string[]; cost: number }> = [];
    let bestCost = Infinity;
    let bestTour: string[] = [];
    let permutationsChecked = 0;

    const permute = (arr: number[], k: number) => {
      if (k === 1) {
        permutationsChecked++;
        let cost = 0;
        let valid = true;
        let prev = startId;
        for (const v of arr) {
          const e = w[prev][v];
          if (e === Infinity) { valid = false; break; }
          cost += e;
          prev = v;
        }
        if (valid) {
          const closing = w[prev][startId];
          if (closing === Infinity) valid = false;
          else cost += closing;
        }
        if (valid) {
          const tourNames = [startId, ...arr, startId].map((id) => graph.getName(id));
          allTours.push({ tour: tourNames, cost });
          if (cost < bestCost) {
            bestCost = cost;
            bestTour = tourNames;
          }
        }
        return;
      }
      for (let i = 0; i < k; i++) {
        permute(arr, k - 1);
        const swapIdx = k % 2 === 0 ? i : 0;
        [arr[swapIdx], arr[k - 1]] = [arr[k - 1], arr[swapIdx]];
      }
    };

    if (others.length === 0) {
      return {
        bestTour: [startName, startName],
        bestCost: 0,
        permutationsChecked: 1,
        allTours: [{ tour: [startName, startName], cost: 0 }],
        feasible: true,
      };
    }

    permute(others.slice(), others.length);

    return {
      bestTour,
      bestCost: bestCost === Infinity ? Infinity : bestCost,
      permutationsChecked,
      allTours,
      feasible: bestCost !== Infinity,
    };
  }

  static tspNearestNeighbor(graph: Graph, startName: string): TSPGreedyResult {
    const n = graph.size;
    if (n === 0) {
      return { tour: [], totalCost: 0, steps: [], feasible: false };
    }
    const startId = graph.getId(startName);

    const w: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row = new Array<number>(n).fill(Infinity);
      for (const nb of graph.getAdjList(i)) {
        row[nb] = graph.isWeighted ? graph.getWeightById(i, nb) : 1;
      }
      w[i] = row;
    }

    const visited = new Array<boolean>(n).fill(false);
    visited[startId] = true;
    const tourIds: number[] = [startId];
    const steps: TSPGreedyStep[] = [];
    let totalCost = 0;
    let current = startId;

    for (let step = 0; step < n - 1; step++) {
      let bestNb = -1;
      let bestW = Infinity;
      const candidates: Array<{ city: string; weight: number }> = [];
      for (let v = 0; v < n; v++) {
        if (visited[v] || v === current) continue;
        const weight = w[current][v];
        if (weight === Infinity) continue;
        candidates.push({ city: graph.getName(v), weight });
        if (weight < bestW) {
          bestW = weight;
          bestNb = v;
        }
      }
      if (bestNb === -1) {
        return { tour: tourIds.map((id) => graph.getName(id)), totalCost, steps, feasible: false };
      }
      steps.push({
        from: graph.getName(current),
        to: graph.getName(bestNb),
        weight: bestW,
        candidates: candidates.sort((a, b) => a.weight - b.weight),
      });
      visited[bestNb] = true;
      tourIds.push(bestNb);
      totalCost += bestW;
      current = bestNb;
    }

    const closing = w[current][startId];
    if (closing === Infinity) {
      return { tour: tourIds.map((id) => graph.getName(id)), totalCost, steps, feasible: false };
    }
    steps.push({
      from: graph.getName(current),
      to: startName,
      weight: closing,
      candidates: [{ city: startName, weight: closing }],
    });
    tourIds.push(startId);
    totalCost += closing;

    return {
      tour: tourIds.map((id) => graph.getName(id)),
      totalCost,
      steps,
      feasible: true,
    };
  }

  static findIslandCount(grid: Grid): number {
    let islands = 0;
    const visited = new Array<boolean>(grid.size).fill(false);

    for (let i = 0; i < grid.size; i++) {
      if (!visited[i] && grid.at(i)) {
        islands++;
        const stack: number[] = [i];
        visited[i] = true;
        while (stack.length > 0) {
          const current = stack.pop()!;
          for (const neighbor of grid.neighbors(current)) {
            if (!visited[neighbor] && grid.at(neighbor)) {
              visited[neighbor] = true;
              stack.push(neighbor);
            }
          }
        }
      }
    }

    return islands;
  }

  static personnelAssignment(graph: Graph): PersonnelAssignmentResult {
    const bipartiteResult = this.isBipartite(graph);
    if (!bipartiteResult.isBipartite) {
      return {
        isBipartite: false,
        partitionA: [],
        partitionB: [],
        matching: [],
        matchingSize: 0,
        unmatchedA: [],
        unmatchedB: [],
        augmentingPaths: [],
      };
    }

    const { partitionA, partitionB } = bipartiteResult;
    const setA = new Set(partitionA);
    const setB = new Set(partitionB);

    // Build adjacency restricted to A→B edges
    const adjA = new Map<string, string[]>();
    for (const u of partitionA) {
      const uId = graph.getId(u);
      adjA.set(u, graph.getAdjList(uId).map((id) => graph.getName(id)).filter((v) => setB.has(v)));
    }

    const matchA = new Map<string, string>(); // A→B
    const matchB = new Map<string, string>(); // B→A
    const augmentingPaths: Array<string[]> = [];

    for (const u of partitionA) {
      if (matchA.has(u)) continue;

      // BFS alternating tree from unmatched A-vertex u
      // parentA[w] = the B-vertex that reached w (for A-vertices in tree)
      // parentB[v] = the A-vertex that reached v (for B-vertices in tree)
      const parentB = new Map<string, string>(); // B-vertex → A-vertex that found it via free edge
      const parentA = new Map<string, string>(); // A-vertex → B-vertex that sent us back via matched edge
      const visitedA = new Set<string>([u]);
      const visitedB = new Set<string>();
      const queue: string[] = [u]; // queue of A-vertices to expand
      let foundB: string | null = null;

      bfsLoop:
      while (queue.length > 0) {
        const a = queue.shift()!;
        for (const b of (adjA.get(a) ?? [])) {
          if (visitedB.has(b)) continue;
          visitedB.add(b);
          parentB.set(b, a);

          if (!matchB.has(b)) {
            // Found augmenting path — unmatched B vertex
            foundB = b;
            break bfsLoop;
          }

          // Follow matched edge back to an A-vertex
          const aNext = matchB.get(b)!;
          if (!visitedA.has(aNext)) {
            visitedA.add(aNext);
            parentA.set(aNext, b);
            queue.push(aNext);
          }
        }
      }

      if (foundB !== null) {
        // Reconstruct augmenting path and augment
        const path: string[] = [];
        let b: string | null = foundB;
        let a: string | null = u;

        // Walk back from foundB to u
        const pathEdges: Array<[string, string]> = [];
        let curB: string | null = foundB;
        while (curB !== null) {
          const curA: string = parentB.get(curB)!;
          pathEdges.push([curA, curB]);
          curB = parentA.get(curA) ?? null;
        }

        // Augment: flip all edges along the path
        for (const [pa, pb] of pathEdges) {
          matchA.set(pa, pb);
          matchB.set(pb, pa);
        }

        // Build path array for display
        path.push(u);
        let bWalk: string | null = foundB;
        while (bWalk !== null) {
          const aWalk: string = parentB.get(bWalk)!;
          // Insert in correct order by retracing
          bWalk = parentA.get(aWalk) ?? null;
        }
        // Rebuild path in order: u → b1 → a1 → b2 → a2 → ... → foundB
        const orderedPath: string[] = [u];
        let walkB: string | null = foundB;
        const bStack: string[] = [];
        const aStack: string[] = [];
        while (walkB !== null) {
          const walkA: string = parentB.get(walkB)!;
          bStack.push(walkB);
          if (walkA !== u) aStack.push(walkA);
          walkB = parentA.get(walkA) ?? null;
        }
        aStack.reverse();
        bStack.reverse();
        for (let i = 0; i < bStack.length; i++) {
          if (i < aStack.length) orderedPath.push(aStack[i]);
          orderedPath.push(bStack[i]);
        }
        augmentingPaths.push(orderedPath);
      }
    }

    const matching: Array<[string, string]> = [];
    for (const [a, b] of matchA.entries()) matching.push([a, b]);

    const unmatchedA = partitionA.filter((a) => !matchA.has(a));
    const unmatchedB = partitionB.filter((b) => !matchB.has(b));

    return {
      isBipartite: true,
      partitionA,
      partitionB,
      matching,
      matchingSize: matching.length,
      unmatchedA,
      unmatchedB,
      augmentingPaths,
    };
  }

  static timetableEdgeColouring(graph: Graph, roomConstraint: number = 3): TimeTableingResult {
    const bipartiteResult = this.isBipartite(graph);
    if (!bipartiteResult.isBipartite) {
      return {
        isBipartite: false,
        partitionX: [],
        partitionY: [],
        maxDegree: 0,
        totalEdges: 0,
        minPeriodsNeeded: 0,
        roomConstraint,
        matchings: [],
        periodUtilization: [],
        isBalanced: false,
        isValid: false,
        timetable: [],
        balanceDetails: 'Graph is not bipartite.',
      };
    }

    const { partitionA: partitionX, partitionB: partitionY } = bipartiteResult;
    const setY = new Set(partitionY);

    // Expand edges by weight
    const edgeList: Array<[string, string]> = [];
    const adjacency = new Map<string, Map<string, number>>();
    const degree = new Map<string, number>();

    for (const x of partitionX) {
      const xId = graph.getId(x);
      for (const yId of graph.getAdjList(xId)) {
        const y = graph.getName(yId);
        const weight = graph.isWeighted ? graph.getWeightById(xId, yId) : 1;
        for (let i = 0; i < weight; i++) {
          edgeList.push([x, y]);
        }
        adjacency.set(x, (adjacency.get(x) ?? new Map()).set(y, (adjacency.get(x)?.get(y) ?? 0) + 1));
        degree.set(x, (degree.get(x) ?? 0) + 1);
        degree.set(y, (degree.get(y) ?? 0) + 1);
      }
    }

    const totalEdges = edgeList.length;
    const maxDegree = Math.max(...Array.from(degree.values()), 0);
    const minPeriodsNeeded = Math.max(maxDegree, Math.ceil(totalEdges / roomConstraint));

    // Greedy edge colouring
    const edgeColor = new Map<string, number>();
    let p = minPeriodsNeeded;
    let matchings: Array<Array<[string, string]>> = Array.from({ length: p }, () => []);
    const usedInPeriod = new Map<number, Set<string>>();
    for (let i = 0; i < p; i++) {
      usedInPeriod.set(i, new Set());
    }

    for (const [x, y] of edgeList) {
      let assigned = false;
      for (let color = 0; color < p; color++) {
        const used = usedInPeriod.get(color)!;
        if (!used.has(x) && !used.has(y)) {
          edgeColor.set(`${x}|${y}`, color);
          matchings[color].push([x, y]);
          used.add(x);
          used.add(y);
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        p++;
        matchings.push([[x, y]]);
        usedInPeriod.set(p - 1, new Set([x, y]));
      }
    }

    const periodUtilization = matchings.map((m) => m.length);
    let isBalanced = Math.max(...periodUtilization) - Math.min(...periodUtilization, Infinity) <= 1;
    let balanceDetails = '';

    // Balance matchings if room constraint active and needed
    if (roomConstraint > 0 && !isBalanced) {
      const balanceSteps: string[] = [];
      let iterations = 0;
      const maxIterations = 100;

      while (!isBalanced && iterations < maxIterations) {
        const minIdx = periodUtilization.indexOf(Math.min(...periodUtilization));
        const maxIdx = periodUtilization.indexOf(Math.max(...periodUtilization));

        if (periodUtilization[maxIdx] - periodUtilization[minIdx] <= 1) break;

        // Find augmenting path: BFS in subgraph of max and min matchings
        const subgraphEdges = new Map<string, Set<string>>();
        for (const [x, y] of matchings[maxIdx]) {
          if (!subgraphEdges.has(x)) subgraphEdges.set(x, new Set());
          if (!subgraphEdges.has(y)) subgraphEdges.set(y, new Set());
          subgraphEdges.get(x)!.add(y);
          subgraphEdges.get(y)!.add(x);
        }
        for (const [x, y] of matchings[minIdx]) {
          if (!subgraphEdges.has(x)) subgraphEdges.set(x, new Set());
          if (!subgraphEdges.has(y)) subgraphEdges.set(y, new Set());
          subgraphEdges.get(x)!.add(y);
          subgraphEdges.get(y)!.add(x);
        }

        let pathFound = false;
        outer:
        for (const startNode of subgraphEdges.keys()) {
          const parent = new Map<string, string>();
          const queue = [startNode];
          const visited = new Set([startNode]);

          while (queue.length > 0 && !pathFound) {
            const u = queue.shift()!;
            for (const v of subgraphEdges.get(u) ?? []) {
              if (!visited.has(v)) {
                visited.add(v);
                parent.set(v, u);
                queue.push(v);

                // Check if path ends in min matching with different color
                const edgeInMin = matchings[minIdx].some(([a, b]) => (a === u && b === v) || (a === v && b === u));
                const edgeInMax = matchings[maxIdx].some(([a, b]) => (a === u && b === v) || (a === v && b === u));
                if ((edgeInMin && edgeInMax === false) || (edgeInMax && edgeInMin === false)) {
                  // Reconstruct path
                  const path: string[] = [v];
                  let curr = v;
                  while (parent.has(curr)) {
                    curr = parent.get(curr)!;
                    path.unshift(curr);
                  }

                  // Flip edges along path
                  for (let i = 0; i < path.length - 1; i++) {
                    const edge: [string, string] = [path[i], path[i + 1]];
                    const idx1 = matchings[maxIdx].findIndex(([a, b]) => (a === edge[0] && b === edge[1]) || (a === edge[1] && b === edge[0]));
                    const idx2 = matchings[minIdx].findIndex(([a, b]) => (a === edge[0] && b === edge[1]) || (a === edge[1] && b === edge[0]));

                    if (idx1 >= 0) {
                      matchings[minIdx].push(edge);
                      matchings[maxIdx].splice(idx1, 1);
                    } else if (idx2 >= 0) {
                      matchings[maxIdx].push(edge);
                      matchings[minIdx].splice(idx2, 1);
                    }
                  }

                  periodUtilization[maxIdx]--;
                  periodUtilization[minIdx]++;
                  balanceSteps.push(`Swap: Period ${maxIdx + 1} → Period ${minIdx + 1}`);
                  pathFound = true;
                  break outer;
                }
              }
            }
          }

          if (pathFound) break;
        }

        if (!pathFound) break;
        isBalanced = Math.max(...periodUtilization) - Math.min(...periodUtilization, Infinity) <= 1;
        iterations++;
      }

      balanceDetails = balanceSteps.length > 0 ? balanceSteps.join('; ') : 'No balancing needed.';
    } else {
      balanceDetails = roomConstraint <= 0 ? 'No room constraint.' : 'Already balanced.';
    }

    // Build timetable
    const timetable: string[][] = Array.from({ length: p }, () => Array(partitionY.length).fill('-'));
    for (let t = 0; t < p; t++) {
      for (const [x, y] of matchings[t]) {
        const yIdx = partitionY.indexOf(y);
        if (yIdx >= 0) {
          timetable[t][yIdx] = x;
        }
      }
    }

    const isValid = p >= minPeriodsNeeded && isBalanced && Math.max(...periodUtilization) <= roomConstraint;

    return {
      isBipartite: true,
      partitionX,
      partitionY,
      maxDegree,
      totalEdges,
      minPeriodsNeeded,
      roomConstraint,
      matchings,
      periodUtilization,
      isBalanced,
      isValid,
      timetable,
      balanceDetails,
    };
  }

  static getAnimationSteps(
    graph: Graph,
    algorithm: string,
    startNode?: string,
    endNode?: string
  ): AlgorithmStepEvent[] {
    const steps: AlgorithmStepEvent[] = [];

    switch (algorithm) {
      /* --------- DFS --------- */
      case 'dfs': {
        if (!startNode) return steps;
        const startId = graph.getId(startNode);
        const visitedIds = new Set<number>();
        const parentMap = new Map<number, number>();
        const stack: Array<{ id: number; parent: number | null }> = [{ id: startId, parent: null }];

        steps.push({ type: 'highlight-node', nodes: [startNode], color: '#00f0ff', message: `Start DFS from ${startNode}`, delay: 400 });

        while (stack.length > 0) {
          const frame = stack.pop()!;
          const current = frame.id;
          const currentParent = frame.parent;
          if (visitedIds.has(current)) continue;
          visitedIds.add(current);

          const currentName = graph.getName(current);
          steps.push({ type: 'visit', nodes: [currentName], color: '#10b981', message: `Visit ${currentName}`, delay: 350 });

          // color tree edge from parent (if exists)
          if (currentParent !== null) {
            const pName = graph.getName(currentParent);
            steps.push({
              type: 'highlight-edge',
              edges: [[pName, currentName]],
              color: '#a855f7',
              message: `Tree edge ${pName} → ${currentName}`,
              delay: 200,
            });
          }

          const neighbors = graph.getAdjList(current);
          for (let i = neighbors.length - 1; i >= 0; i--) {
            const neighbor = neighbors[i];
            if (!visitedIds.has(neighbor)) {
              parentMap.set(neighbor, current);
              stack.push({ id: neighbor, parent: current });
            }
          }
        }
        break;
      }

      /* --------- BFS --------- */
      case 'bfs': {
        if (!startNode) return steps;
        const startId = graph.getId(startNode);
        const visitedIds = new Set<number>([startId]);
        const queue: number[] = [startId];

        steps.push({ type: 'highlight-node', nodes: [startNode], color: '#00f0ff', message: `Start BFS from ${startNode}`, delay: 400 });

        while (queue.length > 0) {
          const current = queue.shift()!;
          const currentName = graph.getName(current);
          steps.push({ type: 'visit', nodes: [currentName], color: '#10b981', message: `Visit ${currentName}`, delay: 350 });

          for (const neighbor of graph.getAdjList(current)) {
            if (!visitedIds.has(neighbor)) {
              visitedIds.add(neighbor);
              queue.push(neighbor);
              const neighborName = graph.getName(neighbor);
              steps.push({
                type: 'highlight-edge',
                edges: [[currentName, neighborName]],
                color: '#3b82f6',
                message: `Discover ${neighborName} via ${currentName}`,
                delay: 200,
              });
              steps.push({ type: 'highlight-node', nodes: [neighborName], color: '#60a5fa', message: `Enqueue ${neighborName}`, delay: 100 });
            }
          }
        }
        break;
      }

      /* --------- PATH --------- */
      case 'path': {
        if (!startNode || !endNode) return steps;
        steps.push({ type: 'highlight-node', nodes: [startNode], color: '#00f0ff', message: `Find path from ${startNode} to ${endNode}`, delay: 400 });
        steps.push({ type: 'highlight-node', nodes: [endNode], color: '#f97316', message: `Target: ${endNode}`, delay: 300 });

        // BFS exploration animation
        const fromId = graph.getId(startNode);
        const toId = graph.getId(endNode);
        const visited = new Set<number>([fromId]);
        const parent = new Map<number, number>();
        const bfsQueue: number[] = [fromId];
        let found = false;

        while (bfsQueue.length > 0 && !found) {
          const current = bfsQueue.shift()!;
          const currentName = graph.getName(current);
          steps.push({ type: 'visit', nodes: [currentName], color: '#6366f1', message: `Exploring ${currentName}`, delay: 250 });

          for (const neighbor of graph.getAdjList(current)) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              parent.set(neighbor, current);
              bfsQueue.push(neighbor);
              const neighborName = graph.getName(neighbor);
              steps.push({
                type: 'highlight-edge',
                edges: [[currentName, neighborName]],
                color: '#818cf8',
                message: `Explore edge ${currentName} → ${neighborName}`,
                delay: 150,
              });
              if (neighbor === toId) { found = true; break; }
            }
          }
        }

        // Trace path
        const result = this.findPath(graph, startNode, endNode);
        if (result.exists) {
          steps.push({ type: 'highlight-node', nodes: graph.nodeNames, color: '#334155', message: 'Tracing shortest path...', delay: 300 });
          for (const node of result.path) {
            steps.push({ type: 'color-node', nodes: [node], color: '#10b981', message: `Path node: ${node}`, delay: 250 });
          }
          for (let i = 0; i < result.path.length - 1; i++) {
            steps.push({
              type: 'color-edge',
              edges: [[result.path[i], result.path[i + 1]]],
              color: '#10b981',
              message: `Path edge: ${result.path[i]} → ${result.path[i + 1]}`,
              delay: 250,
            });
          }
        }
        break;
      }

      /* --------- CONNECTIVITY --------- */
      case 'connectivity': {
        if (graph.isEmpty) break;
        const startId = 0;
        const startName = graph.getName(startId);
        steps.push({ type: 'highlight-node', nodes: [startName], color: '#00f0ff', message: `Check connectivity from ${startName}`, delay: 400 });

        const vis = new Set<number>([startId]);
        const q: number[] = [startId];

        while (q.length > 0) {
          const current = q.shift()!;
          const currentName = graph.getName(current);
          steps.push({ type: 'visit', nodes: [currentName], color: '#10b981', message: `Reached ${currentName}`, delay: 200 });

          for (const neighbor of graph.getAdjList(current)) {
            if (!vis.has(neighbor)) {
              vis.add(neighbor);
              q.push(neighbor);
              const neighborName = graph.getName(neighbor);
              steps.push({
                type: 'highlight-edge',
                edges: [[currentName, neighborName]],
                color: '#22d3ee',
                message: `Connected: ${currentName} → ${neighborName}`,
                delay: 120,
              });
            }
          }
        }

        // Color unreachable nodes red
        const unreachable = graph.nodeNames.filter((_, i) => !vis.has(i));
        if (unreachable.length > 0) {
          for (const node of unreachable) {
            steps.push({ type: 'color-node', nodes: [node], color: '#ef4444', message: `Unreachable: ${node}`, delay: 150 });
          }
        }
        break;
      }

      /* --------- COMPONENTS --------- */
      case 'components': {
        const compColors = ['#00f0ff', '#a855f7', '#10b981', '#f97316', '#ec4899', '#facc15', '#3b82f6', '#ef4444'];
        const visitedGlobal = new Set<number>();

        let compIdx = 0;
        for (let i = 0; i < graph.size; i++) {
          if (visitedGlobal.has(i)) continue;
          const color = compColors[compIdx % compColors.length];
          const seedName = graph.getName(i);
          steps.push({ type: 'highlight-node', nodes: [seedName], color, message: `Component ${compIdx + 1}: start from ${seedName}`, delay: 350 });

          const stack: number[] = [i];
          visitedGlobal.add(i);

          while (stack.length > 0) {
            const current = stack.pop()!;
            const currentName = graph.getName(current);
            steps.push({ type: 'color-node', nodes: [currentName], color, message: `Component ${compIdx + 1}: ${currentName}`, delay: 150 });

            for (const neighbor of graph.getAdjList(current)) {
              if (!visitedGlobal.has(neighbor)) {
                visitedGlobal.add(neighbor);
                stack.push(neighbor);
                steps.push({
                  type: 'color-edge',
                  edges: [[currentName, graph.getName(neighbor)]],
                  color,
                  delay: 120,
                });
              }
            }
          }
          compIdx++;
        }
        break;
      }

      /* --------- BIPARTITE --------- */
      case 'bipartite': {
        if (graph.isEmpty) break;
        const colorArr = new Array<number>(graph.size).fill(-1);
        const partColors = ['#00f0ff', '#f97316'];
        let bipartite = true;
        let conflictEdge: [string, string] | null = null;

        const preferredStarts: number[] = [];
        const seenPreferred = new Set<number>();
        if (startNode) {
          try {
            const id = graph.getId(startNode);
            preferredStarts.push(id);
            seenPreferred.add(id);
          } catch {
            // ignore invalid start node
          }
        }
        for (let i = 0; i < graph.size; i++) {
          if (!seenPreferred.has(i)) preferredStarts.push(i);
        }

        for (const start of preferredStarts) {
          if (!bipartite) break;
          if (colorArr[start] !== -1) continue;
          colorArr[start] = 0;
          const bq: number[] = [start];
          const startName = graph.getName(start);
          steps.push({ type: 'color-node', nodes: [startName], color: partColors[0], message: `Color ${startName} → Set A`, delay: 300 });

          while (bq.length > 0 && bipartite) {
            const current = bq.shift()!;
            const currentName = graph.getName(current);
            const currentColor = colorArr[current];

            for (const neighbor of graph.getAdjList(current)) {
              const neighborName = graph.getName(neighbor);
              if (colorArr[neighbor] === -1) {
                colorArr[neighbor] = 1 - currentColor;
                bq.push(neighbor);
                const setLabel = colorArr[neighbor] === 0 ? 'A' : 'B';
                steps.push({
                  type: 'highlight-edge',
                  edges: [[currentName, neighborName]],
                  color: partColors[colorArr[neighbor]],
                  message: `Edge ${currentName} → ${neighborName}`,
                  delay: 150,
                });
                steps.push({
                  type: 'color-node',
                  nodes: [neighborName],
                  color: partColors[colorArr[neighbor]],
                  message: `Color ${neighborName} → Set ${setLabel}`,
                  delay: 200,
                });
              } else if (colorArr[neighbor] === currentColor) {
                bipartite = false;
                conflictEdge = [currentName, neighborName];
                steps.push({
                  type: 'color-edge',
                  edges: [[currentName, neighborName]],
                  color: '#ef4444',
                  message: `Conflict! ${currentName} and ${neighborName} same set`,
                  delay: 400,
                });
                steps.push({ type: 'color-node', nodes: [currentName, neighborName], color: '#ef4444', message: 'Odd cycle detected!', delay: 400 });
                break;
              }
            }
          }
        }
        break;
      }

      /* --------- DIAMETER --------- */
      case 'diameter': {
        if (graph.isEmpty) break;
        const result = this.diameter(graph);

        // Animate BFS from one end of diameter path
        if (result.path.length > 0) {
          const bfsStart = result.path[0];
          const bfsStartId = graph.getId(bfsStart);
          steps.push({ type: 'highlight-node', nodes: [bfsStart], color: '#facc15', message: `BFS from ${bfsStart} to find farthest node`, delay: 400 });

          const vis = new Set<number>([bfsStartId]);
          const q: number[] = [bfsStartId];

          while (q.length > 0) {
            const current = q.shift()!;
            const currentName = graph.getName(current);
            steps.push({ type: 'visit', nodes: [currentName], color: '#a3a3a3', message: `BFS visit ${currentName}`, delay: 150 });

            for (const neighbor of graph.getAdjList(current)) {
              if (!vis.has(neighbor)) {
                vis.add(neighbor);
                q.push(neighbor);
                steps.push({
                  type: 'highlight-edge',
                  edges: [[currentName, graph.getName(neighbor)]],
                  color: '#525252',
                  delay: 80,
                });
              }
            }
          }

          // Highlight diameter path
          steps.push({ type: 'highlight-node', nodes: graph.nodeNames, color: '#334155', message: 'Highlighting diameter path...', delay: 300 });
          for (const node of result.path) {
            steps.push({ type: 'color-node', nodes: [node], color: '#facc15', message: `Diameter path: ${node}`, delay: 250 });
          }
          for (let i = 0; i < result.path.length - 1; i++) {
            steps.push({
              type: 'color-edge',
              edges: [[result.path[i], result.path[i + 1]]],
              color: '#facc15',
              message: `Diameter edge: ${result.path[i]} → ${result.path[i + 1]}`,
              delay: 250,
            });
          }
        }
        break;
      }

      /* --------- CYCLE --------- */
      case 'cycle': {
        if (graph.isEmpty) break;

        // Animate DFS exploration
        const n = graph.size;
        const visited = new Array<boolean>(n).fill(false);
        const parentArr = new Array<number>(n).fill(-1);
        let cycleFound = false;

        for (let start = 0; start < n && !cycleFound; start++) {
          if (visited[start]) continue;

          const dfsStack: Array<{ node: number; neighborIdx: number }> = [
            { node: start, neighborIdx: 0 },
          ];
          visited[start] = true;
          const startName = graph.getName(start);
          steps.push({ type: 'visit', nodes: [startName], color: '#f97316', message: `DFS from ${startName}`, delay: 300 });

          while (dfsStack.length > 0 && !cycleFound) {
            const top = dfsStack[dfsStack.length - 1];
            const neighbors = graph.getAdjList(top.node);

            if (top.neighborIdx >= neighbors.length) {
              steps.push({ type: 'color-node', nodes: [graph.getName(top.node)], color: '#6b7280', message: `Backtrack from ${graph.getName(top.node)}`, delay: 120 });
              dfsStack.pop();
              continue;
            }

            const neighbor = neighbors[top.neighborIdx];
            top.neighborIdx++;
            const neighborName = graph.getName(neighbor);

            if (!visited[neighbor]) {
              visited[neighbor] = true;
              parentArr[neighbor] = top.node;
              steps.push({
                type: 'highlight-edge',
                edges: [[graph.getName(top.node), neighborName]],
                color: '#f97316',
                message: `Explore edge → ${neighborName}`,
                delay: 150,
              });
              steps.push({ type: 'visit', nodes: [neighborName], color: '#f97316', message: `Visit ${neighborName}`, delay: 200 });
              dfsStack.push({ node: neighbor, neighborIdx: 0 });
            } else if (!graph.isDirected && neighbor !== parentArr[top.node]) {
              cycleFound = true;
            } else if (graph.isDirected) {
              // Check if still on stack (gray node)
              const onStack = dfsStack.some(frame => frame.node === neighbor);
              if (onStack) cycleFound = true;
            }
          }
        }

        // Highlight the cycle itself
        const result = this.detectCycle(graph);
        if (result.hasCycle && result.cycle.length > 0) {
          steps.push({ type: 'highlight-node', nodes: graph.nodeNames, color: '#334155', message: 'Highlighting cycle...', delay: 300 });
          for (const node of result.cycle) {
            steps.push({ type: 'color-node', nodes: [node], color: '#ef4444', message: `Cycle node: ${node}`, delay: 250 });
          }
          for (let i = 0; i < result.cycle.length - 1; i++) {
            steps.push({
              type: 'color-edge',
              edges: [[result.cycle[i], result.cycle[i + 1]]],
              color: '#ef4444',
              message: `Cycle edge: ${result.cycle[i]} → ${result.cycle[i + 1]}`,
              delay: 250,
            });
          }
        }
        break;
      }

      /* --------- GIRTH --------- */
      case 'girth': {
        if (graph.isEmpty) break;
        const result = this.girth(graph);

        if (result.girth !== Infinity && result.cycle.length > 0) {
          // Animate BFS from first node of the cycle to show exploration
          const searchStart = result.cycle[0];
          const searchStartId = graph.getId(searchStart);
          steps.push({ type: 'highlight-node', nodes: [searchStart], color: '#ec4899', message: `BFS from ${searchStart} searching for shortest cycle`, delay: 400 });

          const vis = new Set<number>([searchStartId]);
          const q: number[] = [searchStartId];
          let stepsCount = 0;
          const maxExploreSteps = Math.min(graph.size * 3, 40);

          while (q.length > 0 && stepsCount < maxExploreSteps) {
            const current = q.shift()!;
            const currentName = graph.getName(current);
            steps.push({ type: 'visit', nodes: [currentName], color: '#d946ef', message: `Explore ${currentName}`, delay: 120 });
            stepsCount++;

            for (const neighbor of graph.getAdjList(current)) {
              if (!vis.has(neighbor)) {
                vis.add(neighbor);
                q.push(neighbor);
                steps.push({
                  type: 'highlight-edge',
                  edges: [[currentName, graph.getName(neighbor)]],
                  color: '#a855f7',
                  delay: 80,
                });
                stepsCount++;
              }
            }
          }

          // Highlight the shortest cycle
          steps.push({ type: 'highlight-node', nodes: graph.nodeNames, color: '#334155', message: `Shortest cycle found (length ${result.girth})`, delay: 300 });
          for (const node of result.cycle) {
            steps.push({ type: 'color-node', nodes: [node], color: '#ec4899', message: `Girth node: ${node}`, delay: 250 });
          }
          for (let i = 0; i < result.cycle.length - 1; i++) {
            steps.push({
              type: 'color-edge',
              edges: [[result.cycle[i], result.cycle[i + 1]]],
              color: '#ec4899',
              message: `Girth edge: ${result.cycle[i]} → ${result.cycle[i + 1]}`,
              delay: 250,
            });
          }
          // Close the cycle
          if (result.cycle.length > 2) {
            steps.push({
              type: 'color-edge',
              edges: [[result.cycle[result.cycle.length - 1], result.cycle[0]]],
              color: '#ec4899',
              message: `Close cycle: ${result.cycle[result.cycle.length - 1]} → ${result.cycle[0]}`,
              delay: 250,
            });
          }
        }
        break;
      }

      /* --------- DJIKSTRA --------- */
      case 'djikstra': {
        if (!startNode || graph.isEmpty) break;
        steps.push({ type: 'highlight-node', nodes: [startNode], color: '#facc15', message: `Start Djikstra from ${startNode}`, delay: 400 });

        const distances = new Map<string, number>();
        const previous = new Map<string, string | null>();
        const visited = new Set<string>();
        const pq = new MinPriorityQueue<string>();

        for (const name of graph.nodeNames) {
          distances.set(name, Infinity);
          previous.set(name, null);
        }
        distances.set(startNode, 0);
        pq.push(startNode, 0);

        const allVisited: string[] = [];

        while (pq.size > 0) {
          const { value: currentName, priority: currentDist } = pq.pop()!;

          if (visited.has(currentName)) continue;
          if (currentDist > distances.get(currentName)!) continue;

          visited.add(currentName);
          allVisited.push(currentName);

          // Highlight current node being processed (bright yellow)
          steps.push({ type: 'visit', nodes: [currentName], color: '#facc15', message: `Dequeue ${currentName} from PQ (Dist: ${currentDist === Infinity ? '∞' : currentDist})`, delay: 300 });

          if (endNode && currentName === endNode) {
            // Fade current to visited before breaking
            steps.push({ type: 'color-node', nodes: [currentName], color: '#64748b', message: '', delay: 50 });
            break;
          }

          const currentId = graph.getId(currentName);

          for (const neighborId of graph.getAdjList(currentId)) {
            const neighborName = graph.getName(neighborId);
            if (!visited.has(neighborName)) {
              const weight = graph.isWeighted ? graph.getWeightById(currentId, neighborId) : 1;
              const tentative = currentDist + weight;

              steps.push({ type: 'highlight-edge', edges: [[currentName, neighborName]], color: '#94a3b8', message: `Checking edge ${currentName} → ${neighborName} (Weight: ${weight})`, delay: 150 });

              if (tentative < distances.get(neighborName)!) {
                 distances.set(neighborName, tentative);
                 previous.set(neighborName, currentName);
                 pq.push(neighborName, tentative);
                 // Neighbor gets a "queued" color (light blue)
                 steps.push({ type: 'visit', nodes: [neighborName], color: '#38bdf8', message: `Update dist ${neighborName}: ${tentative}, enqueue to PQ`, delay: 150 });
              }
            }
          }

          // Fade current node to muted after processing (slate gray)
          steps.push({ type: 'color-node', nodes: [currentName], color: '#64748b', message: '', delay: 50 });
        }

        // Dim all visited nodes
        steps.push({ type: 'color-node', nodes: allVisited, color: '#334155', message: 'Dimming explored nodes...', delay: 200 });

        if (endNode) {
          // --- With end node: highlight shortest path ---
          if (distances.get(endNode)! !== Infinity) {
             const pathEdges: Array<[string, string]> = [];
             const pathNodes: string[] = [];
             let curr: string | null = endNode;
             while (curr !== null) {
                pathNodes.push(curr);
                const prev: string | null = previous.get(curr) ?? null;
                if (prev) pathEdges.push([prev, curr]);
                curr = prev;
             }
             pathNodes.reverse();
             pathEdges.reverse();

             steps.push({ type: 'highlight-node', nodes: pathNodes, color: '#22c55e', message: `Shortest Path: ${pathNodes.join(' → ')} (Dist: ${distances.get(endNode)})`, delay: 400 });
             steps.push({ type: 'highlight-edge', edges: pathEdges, color: '#16a34a', message: `Path length: ${pathEdges.length} edges`, delay: 300 });
          } else {
             steps.push({ type: 'highlight-node', nodes: [startNode], color: '#ef4444', message: `No path found to ${endNode}`, delay: 400 });
          }
        } else {
          // --- No end node: highlight shortest path tree ---
          const treeEdges: Array<[string, string]> = [];
          const reachableNodes: string[] = [];
          for (const [node, prev] of previous.entries()) {
            if (prev !== null) {
              treeEdges.push([prev, node]);
              reachableNodes.push(node);
            }
          }
          reachableNodes.push(startNode);

          steps.push({ type: 'highlight-node', nodes: reachableNodes, color: '#22c55e', message: `Shortest path tree from ${startNode} (${reachableNodes.length} nodes)`, delay: 400 });
          if (treeEdges.length > 0) {
            steps.push({ type: 'highlight-edge', edges: treeEdges, color: '#16a34a', message: `Tree edges: ${treeEdges.length}`, delay: 300 });
          }
        }
        break;
      }

      /* --------- PRIMS --------- */
      case 'prims': {
        if (!startNode || graph.isEmpty) break;
        steps.push({ type: 'highlight-node', nodes: [startNode], color: '#14b8a6', message: `Start Prim's MST from ${startNode}`, delay: 400 });

        const mstEdges = this.prims(graph, startNode);
        for (const [u, v] of mstEdges) {
          steps.push({ type: 'highlight-edge', edges: [[u,v]], color: '#0f766e', message: `MST Edge: ${u} - ${v}`, delay: 250 });
          steps.push({ type: 'visit', nodes: [u, v], color: '#14b8a6', message: `Node in MST: ${v}`, delay: 100 });
        }
        break;
      }

      /* --------- TSP ---------
         Brute-force visualisation: build every permutation city-by-city
         (like DFS explores a branch), show running cost, compare against
         best-so-far, then reveal the optimum at the end.                 */
      case 'tsp': {
        if (!startNode || graph.isEmpty) break;
        const n = graph.size;
        const startId = graph.getId(startNode);

        // Weight matrix — Infinity marks "no edge".
        const w: number[][] = [];
        for (let i = 0; i < n; i++) {
          const row = new Array<number>(n).fill(Infinity);
          for (const nb of graph.getAdjList(i)) {
            row[nb] = graph.isWeighted ? graph.getWeightById(i, nb) : 1;
          }
          w[i] = row;
        }
        const others: number[] = [];
        for (let i = 0; i < n; i++) if (i !== startId) others.push(i);

        // Lexicographic permutation generator so the walk-through is
        // predictable and readable.
        const permutations: number[][] = [];
        const permute = (arr: number[], start: number) => {
          if (start === arr.length) { permutations.push(arr.slice()); return; }
          for (let i = start; i < arr.length; i++) {
            [arr[start], arr[i]] = [arr[i], arr[start]];
            permute(arr, start + 1);
            [arr[start], arr[i]] = [arr[i], arr[start]];
          }
        };
        permute(others.slice().sort((a, b) => a - b), 0);

        const allEdges = graph.getEdges().map(([u, v]) => [u, v] as [string, string]);
        const totalPerms = permutations.length;

        // Colour palette
        const C_DIM_NODE   = '#1e293b';
        const C_DIM_EDGE   = '#334155';
        const C_START      = '#f59e0b';  // amber — start/end anchor
        const C_CURRENT    = '#38bdf8';  // cyan — node currently being added
        const C_EDGE_TRY   = '#fbbf24';  // yellow — edge in tour being built
        const C_EDGE_CLOSE = '#f97316';  // orange — closing edge back to start
        const C_INVALID    = '#ef4444';  // red — infeasible (missing edge)
        const C_IMPROVED   = '#10b981';  // green — new best found
        const C_FINAL      = '#22c55e';  // bright green — optimum reveal
        const C_STALE      = '#475569';  // slate — rejected worse candidate

        // Reset everything.
        steps.push({
          type: 'color-node',
          nodes: graph.nodeNames,
          color: C_DIM_NODE,
          message: `TSP brute-force from ${startNode}: ${totalPerms} permutations to explore`,
          delay: 400,
        });
        steps.push({
          type: 'color-edge',
          edges: allEdges,
          color: C_DIM_EDGE,
          delay: 100,
        });
        steps.push({
          type: 'highlight-node',
          nodes: [startNode],
          color: C_START,
          message: `Anchor city: ${startNode} (tour must start and end here)`,
          delay: 450,
        });

        // How many permutations get the full detailed walk-through.
        // The rest are shown as fast "flash compare" so the viewer still
        // sees the brute force cover the whole space.
        const DETAILED_LIMIT = 6;
        const detailedCount = Math.min(DETAILED_LIMIT, totalPerms);

        let bestCost = Infinity;
        let bestTour: string[] = [];
        let feasibleFound = 0;

        const walkPermutation = (perm: number[], idx: number, detailed: boolean) => {
          const tourIds = [startId, ...perm, startId];
          const tourNames = tourIds.map((id) => graph.getName(id));

          if (detailed) {
            // Clear canvas for this permutation.
            steps.push({
              type: 'color-node',
              nodes: graph.nodeNames.filter((nm) => nm !== startNode),
              color: C_DIM_NODE,
              delay: 150,
            });
            steps.push({ type: 'color-edge', edges: allEdges, color: C_DIM_EDGE, delay: 60 });
            steps.push({
              type: 'highlight-node',
              nodes: [startNode],
              color: C_START,
              message: `Permutation ${idx + 1}/${totalPerms}: trying ${tourNames.join(' → ')}`,
              delay: 350,
            });
          }

          // Build the tour edge-by-edge.
          let runningCost = 0;
          let invalid = false;
          for (let i = 0; i < tourIds.length - 1; i++) {
            const u = tourIds[i], v = tourIds[i + 1];
            const edgeW = w[u][v];
            const uName = graph.getName(u), vName = graph.getName(v);
            const isClosing = i === tourIds.length - 2;

            if (edgeW === Infinity) {
              // Missing edge — infeasible permutation.
              if (detailed) {
                steps.push({
                  type: 'color-node',
                  nodes: [vName],
                  color: C_INVALID,
                  message: `No edge ${uName} → ${vName}: infeasible, abort permutation`,
                  delay: 380,
                });
              }
              invalid = true;
              break;
            }
            runningCost += edgeW;

            if (detailed) {
              steps.push({
                type: 'color-edge',
                edges: [[uName, vName]],
                color: isClosing ? C_EDGE_CLOSE : C_EDGE_TRY,
                message: isClosing
                  ? `Close tour ${uName} → ${vName} (w=${edgeW}). Total cost: ${runningCost}`
                  : `Add edge ${uName} → ${vName} (w=${edgeW}). Running cost: ${runningCost}`,
                delay: 260,
              });
              if (!isClosing) {
                steps.push({
                  type: 'color-node',
                  nodes: [vName],
                  color: C_CURRENT,
                  delay: 140,
                });
              }
            }
          }

          if (invalid) return;
          feasibleFound++;

          // Compare against best-so-far.
          if (runningCost < bestCost) {
            const previousBest = bestCost === Infinity ? '∞' : bestCost.toString();
            bestCost = runningCost;
            bestTour = tourNames;

            if (detailed) {
              const tourEdges: Array<[string, string]> = [];
              for (let i = 0; i < tourNames.length - 1; i++) tourEdges.push([tourNames[i], tourNames[i + 1]]);
              steps.push({
                type: 'color-edge',
                edges: tourEdges,
                color: C_IMPROVED,
                message: `New best! ${runningCost} < previous best ${previousBest}`,
                delay: 500,
              });
              steps.push({
                type: 'color-node',
                nodes: tourNames,
                color: C_IMPROVED,
                delay: 250,
              });
            }
          } else if (detailed) {
            steps.push({
              type: 'color-node',
              nodes: tourNames.filter((nm) => nm !== startNode),
              color: C_STALE,
              message: `Cost ${runningCost} ≥ best ${bestCost}: discard, keep current best`,
              delay: 350,
            });
          }
        };

        // Detailed walks: first few permutations in enumeration order.
        for (let i = 0; i < detailedCount; i++) {
          walkPermutation(permutations[i], i, true);
        }

        // Fast-scan remainder: show each tour as a quick edge flash.
        if (totalPerms > detailedCount) {
          steps.push({
            type: 'color-node',
            nodes: graph.nodeNames.filter((nm) => nm !== startNode),
            color: C_DIM_NODE,
            message: `Fast-scanning remaining ${totalPerms - detailedCount} permutations...`,
            delay: 500,
          });
          steps.push({ type: 'color-edge', edges: allEdges, color: C_DIM_EDGE, delay: 80 });

          for (let i = detailedCount; i < totalPerms; i++) {
            const perm = permutations[i];
            const tourIds = [startId, ...perm, startId];
            const tourNames = tourIds.map((id) => graph.getName(id));

            // Compute cost & validity silently.
            let cost = 0;
            let valid = true;
            for (let j = 0; j < tourIds.length - 1; j++) {
              const e = w[tourIds[j]][tourIds[j + 1]];
              if (e === Infinity) { valid = false; break; }
              cost += e;
            }
            if (!valid) continue;
            feasibleFound++;

            const tourEdges: Array<[string, string]> = [];
            for (let j = 0; j < tourNames.length - 1; j++) tourEdges.push([tourNames[j], tourNames[j + 1]]);

            const isNewBest = cost < bestCost;
            if (isNewBest) {
              bestCost = cost;
              bestTour = tourNames;
            }

            steps.push({
              type: 'color-edge',
              edges: allEdges,
              color: C_DIM_EDGE,
              delay: 30,
            });
            steps.push({
              type: 'color-edge',
              edges: tourEdges,
              color: isNewBest ? C_IMPROVED : C_STALE,
              message: isNewBest
                ? `Perm ${i + 1}/${totalPerms}: ${tourNames.join(' → ')} cost ${cost} — NEW BEST`
                : `Perm ${i + 1}/${totalPerms}: ${tourNames.join(' → ')} cost ${cost} (best ${bestCost})`,
              delay: 140,
            });
          }
        }

        // Final reveal — clear everything, then paint the optimum in bright green.
        steps.push({
          type: 'color-node',
          nodes: graph.nodeNames,
          color: C_DIM_NODE,
          delay: 300,
        });
        steps.push({ type: 'color-edge', edges: allEdges, color: C_DIM_EDGE, delay: 100 });

        if (bestCost !== Infinity) {
          steps.push({
            type: 'highlight-node',
            nodes: [startNode],
            color: C_START,
            message: `Exhaustive search complete: ${feasibleFound}/${totalPerms} feasible tours`,
            delay: 500,
          });
          for (let i = 0; i < bestTour.length - 1; i++) {
            const u = bestTour[i], v = bestTour[i + 1];
            steps.push({
              type: 'color-edge',
              edges: [[u, v]],
              color: C_FINAL,
              message: `Optimal edge ${i + 1}/${bestTour.length - 1}: ${u} → ${v}`,
              delay: 260,
            });
            if (v !== startNode) {
              steps.push({ type: 'color-node', nodes: [v], color: C_FINAL, delay: 120 });
            }
          }
          steps.push({
            type: 'color-node',
            nodes: [startNode],
            color: C_FINAL,
            message: `Optimal tour: ${bestTour.join(' → ')} with cost ${bestCost}`,
            delay: 500,
          });
        } else {
          steps.push({
            type: 'color-node',
            nodes: [startNode],
            color: C_INVALID,
            message: 'No Hamiltonian circuit exists — TSP infeasible',
            delay: 500,
          });
        }
        break;
      }

      /* --------- TSP NEAREST NEIGHBOR (Greedy) ---------
         Rosenkrantz, Stearns & Lewis (1977). At each step, move to the
         nearest unvisited city. O(n^2), not optimal but usually close.    */
      case 'tspGreedy': {
        if (!startNode || graph.isEmpty) break;
        const result = this.tspNearestNeighbor(graph, startNode);
        const allEdges = graph.getEdges().map(([u, v]) => [u, v] as [string, string]);

        const C_DIM_NODE  = '#1e293b';
        const C_DIM_EDGE  = '#334155';
        const C_START     = '#f59e0b';
        const C_CURRENT   = '#38bdf8';
        const C_CAND      = '#fbbf24';
        const C_PICK      = '#10b981';
        const C_EDGE_TOUR = '#22c55e';
        const C_CLOSE     = '#f97316';
        const C_INVALID   = '#ef4444';

        steps.push({
          type: 'color-node',
          nodes: graph.nodeNames,
          color: C_DIM_NODE,
          message: `Greedy TSP (Nearest Neighbor) from ${startNode}`,
          delay: 400,
        });
        steps.push({ type: 'color-edge', edges: allEdges, color: C_DIM_EDGE, delay: 100 });
        steps.push({
          type: 'highlight-node',
          nodes: [startNode],
          color: C_START,
          message: `Start city: ${startNode}`,
          delay: 400,
        });

        let runningCost = 0;
        const visitedNames = new Set<string>([startNode]);

        for (let i = 0; i < result.steps.length; i++) {
          const s = result.steps[i];
          const isClosing = i === result.steps.length - 1 && result.feasible;

          if (!isClosing) {
            const candEdges = s.candidates
              .filter((c) => !visitedNames.has(c.city))
              .map((c) => [s.from, c.city] as [string, string]);
            if (candEdges.length > 0) {
              steps.push({
                type: 'color-edge',
                edges: candEdges,
                color: C_CAND,
                message: `From ${s.from}: ${s.candidates.length} candidate(s). Nearest = ${s.to} (w=${s.weight})`,
                delay: 420,
              });
            }
          }

          runningCost += s.weight;
          steps.push({
            type: 'color-edge',
            edges: [[s.from, s.to]],
            color: isClosing ? C_CLOSE : C_EDGE_TOUR,
            message: isClosing
              ? `Close tour ${s.from} → ${s.to} (w=${s.weight}). Total cost: ${runningCost}`
              : `Pick nearest: ${s.from} → ${s.to} (w=${s.weight}). Running cost: ${runningCost}`,
            delay: 320,
          });
          if (!isClosing) {
            steps.push({
              type: 'color-node',
              nodes: [s.to],
              color: i === result.steps.length - 1 ? C_PICK : C_CURRENT,
              delay: 180,
            });
            visitedNames.add(s.to);
          }
        }

        if (!result.feasible) {
          steps.push({
            type: 'color-node',
            nodes: [startNode],
            color: C_INVALID,
            message: 'Greedy got stuck — no edge to an unvisited city (or cannot close tour)',
            delay: 500,
          });
        } else {
          const tourEdges: Array<[string, string]> = [];
          for (let i = 0; i < result.tour.length - 1; i++) tourEdges.push([result.tour[i], result.tour[i + 1]]);
          steps.push({
            type: 'color-edge',
            edges: tourEdges,
            color: C_EDGE_TOUR,
            message: `Greedy tour: ${result.tour.join(' → ')} (cost ${result.totalCost}) — heuristic, not guaranteed optimal`,
            delay: 600,
          });
          steps.push({
            type: 'color-node',
            nodes: result.tour,
            color: C_PICK,
            delay: 250,
          });
        }
        break;
      }

      /* --------- KRUSKAL --------- */
      case 'kruskal': {
        if (graph.isEmpty) break;
        steps.push({ type: 'highlight-node', nodes: graph.nodeNames, color: '#6366f1', message: `Calculate Kruskal's MST`, delay: 400 });

        const mstEdges = this.kruskal(graph);
        for (const [u, v] of mstEdges) {
          steps.push({ type: 'highlight-edge', edges: [[u,v]], color: '#4338ca', message: `Selected Edge: ${u} - ${v}`, delay: 250 });
          steps.push({ type: 'visit', nodes: [u, v], color: '#6366f1', message: `Nodes in MST`, delay: 100 });
        }
        break;
      }

      /* --------- PERSONNEL ASSIGNMENT (M-Alternating Tree) --------- */
      case 'personnelAssignment': {
        if (graph.isEmpty) break;

        const C_A = '#00f0ff';     // partition A (workers) — cyan
        const C_B = '#f97316';     // partition B (jobs) — orange
        const C_ROOT = '#facc15';  // current root A-vertex being expanded — yellow
        const C_FREE = '#22d3ee';  // free edge explored in tree — light cyan
        const C_MATCHED_BACK = '#a855f7'; // matched back-edge in tree — purple
        const C_AUG_PATH = '#facc15'; // augmenting path highlight — yellow
        const C_MATCH_FINAL = '#10b981'; // final matched edge/node — green
        const C_UNMATCHED = '#475569';   // unmatched node at end — slate

        // Phase 1: bipartite check & color partitions
        const bipartiteResult = this.isBipartite(graph);
        if (!bipartiteResult.isBipartite) {
          steps.push({
            type: 'color-node',
            nodes: graph.nodeNames,
            color: '#ef4444',
            message: 'Graph is NOT bipartite — Personnel Assignment cannot run',
            delay: 500,
          });
          break;
        }

        const { partitionA, partitionB } = bipartiteResult;
        const setB = new Set(partitionB);

        steps.push({
          type: 'color-node',
          nodes: partitionA,
          color: C_A,
          message: `Partition A (pekerja / workers): {${partitionA.join(', ')}}`,
          delay: 400,
        });
        steps.push({
          type: 'color-node',
          nodes: partitionB,
          color: C_B,
          message: `Partition B (pekerjaan / jobs): {${partitionB.join(', ')}}`,
          delay: 400,
        });
        steps.push({
          type: 'highlight-node',
          nodes: graph.nodeNames,
          color: '#1e293b',
          message: 'Starting M-Alternating Tree algorithm — building maximum matching',
          delay: 300,
        });

        // Build adjacency A→B
        const adjA = new Map<string, string[]>();
        for (const u of partitionA) {
          const uId = graph.getId(u);
          adjA.set(u, graph.getAdjList(uId).map((id) => graph.getName(id)).filter((v) => setB.has(v)));
        }

        const matchA = new Map<string, string>();
        const matchB = new Map<string, string>();

        for (const u of partitionA) {
          if (matchA.has(u)) continue;

          // Highlight root
          steps.push({
            type: 'highlight-node',
            nodes: [u],
            color: C_ROOT,
            message: `Build alternating tree from unmatched worker: ${u}`,
            delay: 350,
          });

          // BFS alternating tree
          const parentB = new Map<string, string>();
          const parentA = new Map<string, string>();
          const visitedA = new Set<string>([u]);
          const visitedB = new Set<string>();
          const queue: string[] = [u];
          let foundB: string | null = null;

          bfsAnim:
          while (queue.length > 0) {
            const a = queue.shift()!;
            for (const b of (adjA.get(a) ?? [])) {
              if (visitedB.has(b)) continue;
              visitedB.add(b);
              parentB.set(b, a);

              steps.push({
                type: 'highlight-edge',
                edges: [[a, b]],
                color: C_FREE,
                message: `Explore free edge ${a} — ${b}`,
                delay: 220,
              });
              steps.push({
                type: 'highlight-node',
                nodes: [b],
                color: C_B,
                message: `Visit job node ${b}`,
                delay: 100,
              });

              if (!matchB.has(b)) {
                foundB = b;
                steps.push({
                  type: 'highlight-node',
                  nodes: [b],
                  color: C_ROOT,
                  message: `${b} is unmatched — augmenting path found!`,
                  delay: 300,
                });
                break bfsAnim;
              }

              // Follow matched back-edge
              const aNext = matchB.get(b)!;
              steps.push({
                type: 'highlight-edge',
                edges: [[b, aNext]],
                color: C_MATCHED_BACK,
                message: `Follow matched edge ${b} — ${aNext} (already in M)`,
                delay: 220,
              });
              if (!visitedA.has(aNext)) {
                visitedA.add(aNext);
                parentA.set(aNext, b);
                queue.push(aNext);
                steps.push({
                  type: 'highlight-node',
                  nodes: [aNext],
                  color: C_A,
                  message: `Add ${aNext} to alternating tree`,
                  delay: 120,
                });
              }
            }
          }

          if (foundB !== null) {
            // Reconstruct augmenting path edges
            const pathEdges: Array<[string, string]> = [];
            let curB: string | null = foundB;
            while (curB !== null) {
              const curA: string = parentB.get(curB)!;
              pathEdges.push([curA, curB]);
              curB = parentA.get(curA) ?? null;
            }

            // Build ordered path for display
            const orderedPath: string[] = [u];
            const bStack: string[] = [];
            const aStack: string[] = [];
            let walkB: string | null = foundB;
            while (walkB !== null) {
              const walkA: string = parentB.get(walkB)!;
              bStack.push(walkB);
              if (walkA !== u) aStack.push(walkA);
              walkB = parentA.get(walkA) ?? null;
            }
            aStack.reverse();
            bStack.reverse();
            for (let i = 0; i < bStack.length; i++) {
              if (i < aStack.length) orderedPath.push(aStack[i]);
              orderedPath.push(bStack[i]);
            }

            // Highlight augmenting path
            steps.push({
              type: 'color-node',
              nodes: orderedPath,
              color: C_AUG_PATH,
              message: `Augmenting path: ${orderedPath.join(' → ')}`,
              delay: 500,
            });
            const augEdges: Array<[string, string]> = pathEdges.map(([a, b]) => [a, b]);
            steps.push({
              type: 'color-edge',
              edges: augEdges,
              color: C_AUG_PATH,
              message: 'Augmenting path — about to flip matching',
              delay: 400,
            });

            // Augment
            for (const [pa, pb] of pathEdges) {
              matchA.set(pa, pb);
              matchB.set(pb, pa);
            }

            // Show new matched edges in green
            const newMatchEdges: Array<[string, string]> = pathEdges.map(([a, b]) => [a, b]);
            steps.push({
              type: 'color-edge',
              edges: newMatchEdges,
              color: C_MATCH_FINAL,
              message: `Matching updated — size now ${matchA.size}`,
              delay: 400,
            });
            steps.push({
              type: 'color-node',
              nodes: orderedPath,
              color: C_MATCH_FINAL,
              message: `Matched: ${u} ↔ ${foundB}`,
              delay: 250,
            });
          } else {
            steps.push({
              type: 'color-node',
              nodes: [u],
              color: C_UNMATCHED,
              message: `No augmenting path from ${u} — remains unmatched`,
              delay: 300,
            });
          }
        }

        // Final summary: recolor all matched edges/nodes green, unmatched slate
        const allMatchedEdges: Array<[string, string]> = [];
        const allMatchedNodes: string[] = [];
        for (const [a, b] of matchA.entries()) {
          allMatchedEdges.push([a, b]);
          allMatchedNodes.push(a, b);
        }
        if (allMatchedEdges.length > 0) {
          steps.push({
            type: 'color-edge',
            edges: allMatchedEdges,
            color: C_MATCH_FINAL,
            message: `Maximum matching — size ${matchA.size}`,
            delay: 500,
          });
          steps.push({
            type: 'color-node',
            nodes: allMatchedNodes,
            color: C_MATCH_FINAL,
            message: `Matched nodes`,
            delay: 250,
          });
        }
        const unmatchedNodes = [...partitionA, ...partitionB].filter((n) => !allMatchedNodes.includes(n));
        if (unmatchedNodes.length > 0) {
          steps.push({
            type: 'color-node',
            nodes: unmatchedNodes,
            color: C_UNMATCHED,
            message: `Unmatched nodes: ${unmatchedNodes.join(', ')}`,
            delay: 300,
          });
        }
        break;
      }

      /* --------- TIMETABLING (Edge Colouring) --------- */
      case 'timetabling': {
        const result = this.timetableEdgeColouring(graph, 3);
        if (!result.isBipartite) {
          steps.push({
            type: 'color-node',
            nodes: graph.nodeNames,
            color: '#ef4444',
            message: 'Not bipartite — Timetabling cannot run',
            delay: 500,
          });
          break;
        }

        const C_X = '#00f0ff';     // teachers cyan
        const C_Y = '#f97316';     // classes orange
        const C_PERIOD = '#10b981'; // period assignment green

        // Phase 1: bipartite coloring
        steps.push({
          type: 'color-node',
          nodes: result.partitionX,
          color: C_X,
          message: `Guru: {${result.partitionX.join(', ')}}`,
          delay: 400,
        });
        steps.push({
          type: 'color-node',
          nodes: result.partitionY,
          color: C_Y,
          message: `Kelas: {${result.partitionY.join(', ')}}`,
          delay: 400,
        });

        // Phase 2: show each matching/period
        const periodColors = ['#00f0ff', '#f97316', '#a855f7', '#facc15', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
        for (let t = 0; t < result.matchings.length; t++) {
          const pColor = periodColors[t % periodColors.length];
          steps.push({
            type: 'highlight-node',
            nodes: graph.nodeNames,
            color: '#1e293b',
            message: `Periode ${t + 1}: ${result.periodUtilization[t]} kelas`,
            delay: 300,
          });
          for (const [x, y] of result.matchings[t]) {
            steps.push({
              type: 'highlight-edge',
              edges: [[x, y]],
              color: pColor,
              message: `${x} → ${y}`,
              delay: 150,
            });
            steps.push({
              type: 'color-node',
              nodes: [x, y],
              color: pColor,
              delay: 100,
            });
          }
        }

        // Phase 3: final summary
        const allEdges: Array<[string, string]> = result.matchings.flat();
        steps.push({
          type: 'color-edge',
          edges: allEdges,
          color: C_PERIOD,
          message: `Jadwal selesai: ${result.matchings.length} periode`,
          delay: 500,
        });
        steps.push({
          type: 'color-node',
          nodes: graph.nodeNames,
          color: C_PERIOD,
          message: `Valid: ${result.isValid ? 'Ya' : 'Tidak'}`,
          delay: 300,
        });
        break;
      }
    }

    return steps;
  }
}
