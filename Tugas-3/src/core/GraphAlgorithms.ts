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
    }

    return steps;
  }
}
