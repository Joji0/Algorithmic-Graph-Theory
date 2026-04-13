export class Graph {
  private directed_: boolean;
  private weighted_: boolean;
  private id_: Map<string, number>;
  private name_: string[];
  private adjList_: number[][];
  private edgeWeights_: Map<string, number>;

  constructor(directed: boolean = false, weighted: boolean = false) {
    this.directed_ = directed;
    this.weighted_ = weighted;
    this.id_ = new Map();
    this.name_ = [];
    this.adjList_ = [];
    this.edgeWeights_ = new Map();
  }

  get isDirected(): boolean {
    return this.directed_;
  }

  get isWeighted(): boolean {
    return this.weighted_;
  }

  get size(): number {
    return this.id_.size;
  }

  get isEmpty(): boolean {
    return this.id_.size === 0;
  }

  get nodeNames(): string[] {
    return [...this.name_];
  }

  get nodeIds(): Map<string, number> {
    return new Map(this.id_);
  }

  getId(name: string): number {
    const id = this.id_.get(name);
    if (id === undefined) {
      throw new Error(`Node "${name}" does not exist in the graph.`);
    }
    return id;
  }

  getName(id: number): string {
    if (id < 0 || id >= this.name_.length) {
      throw new Error(`Node ID ${id} is out of range.`);
    }
    return this.name_[id];
  }

  getAdjList(): number[][];
  getAdjList(id: number): number[];
  getAdjList(id?: number): number[][] | number[] {
    if (id !== undefined) {
      if (id < 0 || id >= this.adjList_.length) {
        throw new Error(`Node ID ${id} is out of range.`);
      }
      return [...this.adjList_[id]];
    }
    return this.adjList_.map((neighbors) => [...neighbors]);
  }

  hasNode(name: string): boolean {
    return this.id_.has(name);
  }

  hasEdge(from: string, to: string): boolean {
    if (!this.id_.has(from) || !this.id_.has(to)) return false;
    const fromId = this.id_.get(from)!;
    const toId = this.id_.get(to)!;
    return this.adjList_[fromId].includes(toId);
  }

  addNode(name: string): void {
    if (this.id_.has(name)) return;
    this.id_.set(name, this.id_.size);
    this.name_.push(name);
    this.adjList_.push([]);
  }

  addEdge(from: string, to: string, weight: number = 1): void {
    this.addNode(from);
    this.addNode(to);

    const fromId = this.id_.get(from)!;
    const toId = this.id_.get(to)!;

    if (!this.adjList_[fromId].includes(toId)) {
      this.adjList_[fromId].push(toId);
    }
    this.edgeWeights_.set(`${fromId}->${toId}`, weight);

    if (!this.directed_) {
      if (!this.adjList_[toId].includes(fromId)) {
        this.adjList_[toId].push(fromId);
      }
      this.edgeWeights_.set(`${toId}->${fromId}`, weight);
    }
  }

  removeNode(name: string): void {
    if (!this.id_.has(name)) return;

    const nodeId = this.id_.get(name)!;
    this.id_.delete(name);
    this.name_.splice(nodeId, 1);
    this.adjList_.splice(nodeId, 1);

    for (const [key, id] of this.id_) {
      if (id > nodeId) {
        this.id_.set(key, id - 1);
      }
    }

    for (const neighbors of this.adjList_) {
      for (let i = neighbors.length - 1; i >= 0; i--) {
        if (neighbors[i] === nodeId) {
          neighbors.splice(i, 1);
        } else if (neighbors[i] > nodeId) {
          neighbors[i]--;
        }
      }
    }
  }

  removeEdge(from: string, to: string): void {
    if (!this.id_.has(from) || !this.id_.has(to)) return;

    const fromId = this.id_.get(from)!;
    const toId = this.id_.get(to)!;

    this.adjList_[fromId] = this.adjList_[fromId].filter((n) => n !== toId);
    this.edgeWeights_.delete(`${fromId}->${toId}`);

    if (!this.directed_) {
      this.adjList_[toId] = this.adjList_[toId].filter((n) => n !== fromId);
      this.edgeWeights_.delete(`${toId}->${fromId}`);
    }
  }

  getWeight(from: string, to: string): number {
    if (!this.id_.has(from) || !this.id_.has(to)) return Infinity;
    const fromId = this.id_.get(from)!;
    const toId = this.id_.get(to)!;
    return this.edgeWeights_.get(`${fromId}->${toId}`) ?? Infinity;
  }

  getWeightById(fromId: number, toId: number): number {
    return this.edgeWeights_.get(`${fromId}->${toId}`) ?? Infinity;
  }

  getEdges(): Array<[string, string, number]> {
    const edges: Array<[string, string, number]> = [];
    const seen = new Set<string>();

    for (let i = 0; i < this.adjList_.length; i++) {
      for (const neighbor of this.adjList_[i]) {
        const edgeKey = this.directed_
          ? `${i}->${neighbor}`
          : `${Math.min(i, neighbor)}-${Math.max(i, neighbor)}`;

        if (!seen.has(edgeKey)) {
          seen.add(edgeKey);
          edges.push([
            this.name_[i],
            this.name_[neighbor],
            this.getWeightById(i, neighbor)
          ]);
        }
      }
    }

    return edges;
  }

  getDegree(name: string): number {
    const id = this.getId(name);
    return this.adjList_[id].length;
  }

  getNeighbors(name: string): string[] {
    const id = this.getId(name);
    return this.adjList_[id].map((nId) => this.name_[nId]);
  }

  clone(): Graph {
    const g = new Graph(this.directed_, this.weighted_);
    for (const name of this.name_) {
      g.addNode(name);
    }
    for (const [from, to, weight] of this.getEdges()) {
      g.addEdge(from, to, weight);
    }
    return g;
  }

  clear(): void {
    this.id_.clear();
    this.name_ = [];
    this.adjList_ = [];
    this.edgeWeights_.clear();
  }

  toJSON(): object {
    return {
      directed: this.directed_,
      weighted: this.weighted_,
      nodes: [...this.name_],
      edges: this.getEdges(),
    };
  }

  static fromJSON(data: { directed: boolean; weighted?: boolean; nodes: string[]; edges: [string, string, number?][] }): Graph {
    const isWeighted = data.weighted ?? false;
    const g = new Graph(data.directed, isWeighted);
    for (const node of data.nodes) {
      g.addNode(node);
    }
    for (const edge of data.edges) {
      const from = edge[0];
      const to = edge[1];
      const weight = edge.length > 2 && edge[2] !== undefined ? edge[2] : 1;
      g.addEdge(from, to, weight);
    }
    return g;
  }
}

export class Grid {
  private rows_: number;
  private cols_: number;
  private grid_: boolean[];

  constructor(rows: number, cols: number) {
    this.rows_ = rows;
    this.cols_ = cols;
    this.grid_ = new Array(rows * cols).fill(false);
  }

  get rows(): number { return this.rows_; }
  get cols(): number { return this.cols_; }
  get size(): number { return this.grid_.length; }

  at(index: number): boolean;
  at(row: number, col: number): boolean;
  at(rowOrIndex: number, col?: number): boolean {
    if (col !== undefined) {
      return this.grid_[rowOrIndex * this.cols_ + col];
    }
    return this.grid_[rowOrIndex];
  }

  set(row: number, col: number, value: boolean): void {
    this.grid_[row * this.cols_ + col] = value;
  }

  setByIndex(index: number, value: boolean): void {
    this.grid_[index] = value;
  }

  clone(): Grid {
    const cloned = new Grid(this.rows_, this.cols_);
    for (let i = 0; i < this.grid_.length; i++) {
      cloned.setByIndex(i, this.grid_[i]);
    }
    return cloned;
  }

  neighbors(index: number): number[] {
    const result: number[] = [];
    const row = Math.floor(index / this.cols_);
    const col = index % this.cols_;
    if (row > 0) result.push((row - 1) * this.cols_ + col);
    if (row < this.rows_ - 1) result.push((row + 1) * this.cols_ + col);
    if (col > 0) result.push(row * this.cols_ + (col - 1));
    if (col < this.cols_ - 1) result.push(row * this.cols_ + (col + 1));
    return result;
  }

  getGridData(): boolean[][] {
    const data: boolean[][] = [];
    for (let r = 0; r < this.rows_; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < this.cols_; c++) {
        row.push(this.grid_[r * this.cols_ + c]);
      }
      data.push(row);
    }
    return data;
  }
}

export class PresetGraphs {
  static petersen(): Graph {
    const g = new Graph(false);
    const outer = ['A', 'B', 'C', 'D', 'E'];
    const inner = ['F', 'G', 'H', 'I', 'J'];

    for (const n of [...outer, ...inner]) g.addNode(n);

    for (let i = 0; i < 5; i++) {
      g.addEdge(outer[i], outer[(i + 1) % 5]);
      g.addEdge(outer[i], inner[i]);
      g.addEdge(inner[i], inner[(i + 2) % 5]);
    }

    return g;
  }

  static complete(n: number): Graph {
    const g = new Graph(false);
    const nodes: string[] = [];
    for (let i = 0; i < n; i++) {
      const name = String.fromCharCode(65 + i);
      nodes.push(name);
      g.addNode(name);
    }
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        g.addEdge(nodes[i], nodes[j]);
      }
    }
    return g;
  }

  static completeBipartite(m: number, n: number): Graph {
    const g = new Graph(false);
    const setA: string[] = [];
    const setB: string[] = [];

    for (let i = 0; i < m; i++) {
      const name = `U${i + 1}`;
      setA.push(name);
      g.addNode(name);
    }
    for (let i = 0; i < n; i++) {
      const name = `V${i + 1}`;
      setB.push(name);
      g.addNode(name);
    }

    for (const a of setA) {
      for (const b of setB) {
        g.addEdge(a, b);
      }
    }

    return g;
  }

  static cycle(n: number): Graph {
    const g = new Graph(false);
    const nodes: string[] = [];
    for (let i = 0; i < n; i++) {
      const name = String.fromCharCode(65 + i);
      nodes.push(name);
      g.addNode(name);
    }
    for (let i = 0; i < n; i++) {
      g.addEdge(nodes[i], nodes[(i + 1) % n]);
    }
    return g;
  }

  static star(n: number): Graph {
    const g = new Graph(false);
    g.addNode('Center');
    for (let i = 0; i < n; i++) {
      const name = `L${i + 1}`;
      g.addNode(name);
      g.addEdge('Center', name);
    }
    return g;
  }

  static cube(): Graph {
    const g = new Graph(false);
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (const n of nodes) g.addNode(n);

    g.addEdge('A', 'B'); g.addEdge('B', 'C'); g.addEdge('C', 'D'); g.addEdge('D', 'A');
    g.addEdge('E', 'F'); g.addEdge('F', 'G'); g.addEdge('G', 'H'); g.addEdge('H', 'E');
    g.addEdge('A', 'E'); g.addEdge('B', 'F'); g.addEdge('C', 'G'); g.addEdge('D', 'H');

    return g;
  }

  static wheel(n: number): Graph {
    const g = new Graph(false);
    g.addNode('Hub');
    const rimNodes: string[] = [];
    for (let i = 0; i < n; i++) {
      const name = String.fromCharCode(65 + i);
      rimNodes.push(name);
      g.addNode(name);
      g.addEdge('Hub', name);
    }
    for (let i = 0; i < n; i++) {
      g.addEdge(rimNodes[i], rimNodes[(i + 1) % n]);
    }
    return g;
  }

  static binaryTree(depth: number): Graph {
    const g = new Graph(false);
    const queue: Array<{ name: string; level: number }> = [{ name: '1', level: 0 }];
    g.addNode('1');

    let idx = 1;
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.level >= depth) continue;

      const leftName = String(++idx);
      const rightName = String(++idx);
      g.addNode(leftName);
      g.addNode(rightName);
      g.addEdge(current.name, leftName);
      g.addEdge(current.name, rightName);
      queue.push({ name: leftName, level: current.level + 1 });
      queue.push({ name: rightName, level: current.level + 1 });
    }

    return g;
  }

  static grid(rows: number, cols: number): Graph {
    const g = new Graph(false);
    const getName = (r: number, c: number) => `(${r},${c})`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        g.addNode(getName(r, c));
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (c + 1 < cols) g.addEdge(getName(r, c), getName(r, c + 1));
        if (r + 1 < rows) g.addEdge(getName(r, c), getName(r + 1, c));
      }
    }

    return g;
  }

  static directedAcyclic(): Graph {
    const g = new Graph(true);
    const nodes = ['S', 'A', 'B', 'C', 'D', 'T'];
    for (const n of nodes) g.addNode(n);
    g.addEdge('S', 'A'); g.addEdge('S', 'B');
    g.addEdge('A', 'C'); g.addEdge('A', 'D');
    g.addEdge('B', 'D'); g.addEdge('C', 'T');
    g.addEdge('D', 'T');
    return g;
  }

  static directedCyclic(): Graph {
    const g = new Graph(true);
    const nodes = ['A', 'B', 'C', 'D', 'E'];
    for (const n of nodes) g.addNode(n);
    g.addEdge('A', 'B'); g.addEdge('B', 'C');
    g.addEdge('C', 'D'); g.addEdge('D', 'B');
    g.addEdge('D', 'E');
    return g;
  }

  static disconnected(): Graph {
    const g = new Graph(false);
    g.addEdge('A', 'B'); g.addEdge('B', 'C'); g.addEdge('A', 'C');
    g.addEdge('D', 'E'); g.addEdge('E', 'F');
    g.addNode('G');
    return g;
  }

  /** 4-city TSP: small enough for brute-force demo */
  static tspSample4(): Graph {
    const g = new Graph(false, true);
    const cities = ['A', 'B', 'C', 'D'];
    for (const c of cities) g.addNode(c);
    g.addEdge('A', 'B', 10); g.addEdge('A', 'C', 15); g.addEdge('A', 'D', 20);
    g.addEdge('B', 'C', 35); g.addEdge('B', 'D', 25);
    g.addEdge('C', 'D', 30);
    return g;
  }

  /** 5-city TSP */
  static tspSample5(): Graph {
    const g = new Graph(false, true);
    const cities = ['A', 'B', 'C', 'D', 'E'];
    for (const c of cities) g.addNode(c);
    g.addEdge('A', 'B', 12); g.addEdge('A', 'C', 10); g.addEdge('A', 'D', 19); g.addEdge('A', 'E', 8);
    g.addEdge('B', 'C', 3);  g.addEdge('B', 'D', 7);  g.addEdge('B', 'E', 2);
    g.addEdge('C', 'D', 6);  g.addEdge('C', 'E', 20);
    g.addEdge('D', 'E', 4);
    return g;
  }

  /** 6-city TSP */
  static tspSample6(): Graph {
    const g = new Graph(false, true);
    const cities = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (const c of cities) g.addNode(c);
    g.addEdge('A', 'B', 12); g.addEdge('A', 'C', 29); g.addEdge('A', 'D', 22); g.addEdge('A', 'E', 13); g.addEdge('A', 'F', 24);
    g.addEdge('B', 'C', 19); g.addEdge('B', 'D', 3);  g.addEdge('B', 'E', 18); g.addEdge('B', 'F', 14);
    g.addEdge('C', 'D', 21); g.addEdge('C', 'E', 7);  g.addEdge('C', 'F', 28);
    g.addEdge('D', 'E', 9);  g.addEdge('D', 'F', 5);
    g.addEdge('E', 'F', 27);
    return g;
  }

  /** 7-city TSP — maximum practical for brute-force (5040 permutations) */
  static tspSample7(): Graph {
    const g = new Graph(false, true);
    const cities = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    for (const c of cities) g.addNode(c);
    g.addEdge('A', 'B', 7);  g.addEdge('A', 'C', 20); g.addEdge('A', 'D', 21); g.addEdge('A', 'E', 12); g.addEdge('A', 'F', 23); g.addEdge('A', 'G', 8);
    g.addEdge('B', 'C', 15); g.addEdge('B', 'D', 6);  g.addEdge('B', 'E', 18); g.addEdge('B', 'F', 11); g.addEdge('B', 'G', 25);
    g.addEdge('C', 'D', 10); g.addEdge('C', 'E', 4);  g.addEdge('C', 'F', 16); g.addEdge('C', 'G', 9);
    g.addEdge('D', 'E', 14); g.addEdge('D', 'F', 3);  g.addEdge('D', 'G', 22);
    g.addEdge('E', 'F', 17); g.addEdge('E', 'G', 5);
    g.addEdge('F', 'G', 13);
    return g;
  }
}
