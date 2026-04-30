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

  /** Path graph P_n — n vertices connected in a straight line (n-1 edges). */
  static path(n: number): Graph {
    const g = new Graph(false);
    const nodes: string[] = [];
    for (let i = 0; i < n; i++) {
      const name = `P${i + 1}`;
      nodes.push(name);
      g.addNode(name);
    }
    for (let i = 0; i < n - 1; i++) {
      g.addEdge(nodes[i], nodes[i + 1]);
    }
    return g;
  }

  /**
   * Prism graph Y_n = C_n □ K_2 — two n-cycles with matched rungs (n ≥ 3).
   * 2n vertices, 3n edges. Y_3 = K_{3,3}-minus-perfect-matching (triangular prism).
   */
  static prism(n: number): Graph {
    const g = new Graph(false);
    const outer: string[] = [];
    const inner: string[] = [];
    for (let i = 0; i < n; i++) {
      outer.push(`A${i + 1}`);
      inner.push(`B${i + 1}`);
      g.addNode(outer[i]);
      g.addNode(inner[i]);
    }
    for (let i = 0; i < n; i++) {
      g.addEdge(outer[i], outer[(i + 1) % n]);
      g.addEdge(inner[i], inner[(i + 1) % n]);
      g.addEdge(outer[i], inner[i]);
    }
    return g;
  }

  /**
   * Generalized Petersen graph P(n, k) — 2n vertices: outer cycle u_0..u_{n-1},
   * inner "star" v_0..v_{n-1} with v_i ~ v_{i+k mod n}, plus spokes u_i ~ v_i.
   * Requires n ≥ 3 and 1 ≤ k < n/2. P(5,2) = Petersen, P(n,1) = prism Y_n.
   */
  static generalizedPetersen(n: number, k: number): Graph {
    const g = new Graph(false);
    const outer: string[] = [];
    const inner: string[] = [];
    for (let i = 0; i < n; i++) {
      outer.push(`U${i}`);
      inner.push(`V${i}`);
      g.addNode(outer[i]);
      g.addNode(inner[i]);
    }
    for (let i = 0; i < n; i++) {
      g.addEdge(outer[i], outer[(i + 1) % n]);
      g.addEdge(outer[i], inner[i]);
      // Avoid duplicate inner edges when 2k ≡ 0 (mod n).
      const j = (i + k) % n;
      if (!g.hasEdge(inner[i], inner[j])) {
        g.addEdge(inner[i], inner[j]);
      }
    }
    return g;
  }

  /**
   * Circulant graph C_n(a_1, …, a_r) — n vertices on a cycle; each vertex i
   * is joined to i ± a_j (mod n) for every jump a_j. C_n(1) = cycle C_n,
   * C_n(1, 2) adds chords to next-next neighbours.
   */
  static circulant(n: number, jumps: number[]): Graph {
    const g = new Graph(false);
    const nodes: string[] = [];
    for (let i = 0; i < n; i++) {
      nodes.push(`C${i}`);
      g.addNode(nodes[i]);
    }
    for (let i = 0; i < n; i++) {
      for (const a of jumps) {
        const mod = ((a % n) + n) % n;
        if (mod === 0) continue;
        const j = (i + mod) % n;
        if (!g.hasEdge(nodes[i], nodes[j])) g.addEdge(nodes[i], nodes[j]);
      }
    }
    return g;
  }

  /**
   * Hypercube graph Q_n (a.k.a. H(n)) — 2^n vertices labelled by binary
   * strings of length n; edge between strings that differ in exactly one bit.
   * Q_1 = K_2, Q_2 = C_4, Q_3 = 3-cube.
   */
  static hypercube(n: number): Graph {
    const g = new Graph(false);
    const size = 1 << n;
    const label = (x: number) => (n === 0 ? '0' : x.toString(2).padStart(n, '0'));
    for (let i = 0; i < size; i++) g.addNode(label(i));
    for (let i = 0; i < size; i++) {
      for (let b = 0; b < n; b++) {
        const j = i ^ (1 << b);
        if (i < j) g.addEdge(label(i), label(j));
      }
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

  /** TSP 8 Kota Indonesia — cities with approximate Euclidean distances */
  static tspKota8(): Graph {
    const g = new Graph(false, true);
    const cities = ['JKT', 'BDG', 'SMG', 'YOG', 'SBY', 'PLB', 'MDN', 'MKS'];
    for (const c of cities) g.addNode(c);
    g.addEdge('JKT', 'BDG', 141); g.addEdge('JKT', 'SMG', 224); g.addEdge('JKT', 'YOG', 316); g.addEdge('JKT', 'SBY', 447); g.addEdge('JKT', 'PLB', 141); g.addEdge('JKT', 'MDN', 447); g.addEdge('JKT', 'MKS', 300);
    g.addEdge('BDG', 'SMG', 224); g.addEdge('BDG', 'YOG', 283); g.addEdge('BDG', 'SBY', 424); g.addEdge('BDG', 'PLB', 200); g.addEdge('BDG', 'MDN', 316); g.addEdge('BDG', 'MKS', 412);
    g.addEdge('SMG', 'YOG', 100); g.addEdge('SMG', 'SBY', 224); g.addEdge('SMG', 'PLB', 361); g.addEdge('SMG', 'MDN', 361); g.addEdge('SMG', 'MKS', 283);
    g.addEdge('YOG', 'SBY', 141); g.addEdge('YOG', 'PLB', 447); g.addEdge('YOG', 'MDN', 316); g.addEdge('YOG', 'MKS', 361);
    g.addEdge('SBY', 'PLB', 583); g.addEdge('SBY', 'MDN', 400); g.addEdge('SBY', 'MKS', 412);
    g.addEdge('PLB', 'MDN', 510); g.addEdge('PLB', 'MKS', 412);
    g.addEdge('MDN', 'MKS', 640);
    return g;
  }

  /** TSP 3×3 Grid — 9 points on a grid with Euclidean distances */
  static tspGrid9(): Graph {
    const g = new Graph(false, true);
    const cities = ['G00', 'G01', 'G02', 'G10', 'G11', 'G12', 'G20', 'G21', 'G22'];
    for (const c of cities) g.addNode(c);
    g.addEdge('G00', 'G01', 100); g.addEdge('G00', 'G02', 200); g.addEdge('G00', 'G10', 100); g.addEdge('G00', 'G11', 141); g.addEdge('G00', 'G12', 224); g.addEdge('G00', 'G20', 200); g.addEdge('G00', 'G21', 224); g.addEdge('G00', 'G22', 283);
    g.addEdge('G01', 'G02', 100); g.addEdge('G01', 'G10', 141); g.addEdge('G01', 'G11', 100); g.addEdge('G01', 'G12', 141); g.addEdge('G01', 'G20', 224); g.addEdge('G01', 'G21', 200); g.addEdge('G01', 'G22', 224);
    g.addEdge('G02', 'G10', 224); g.addEdge('G02', 'G11', 141); g.addEdge('G02', 'G12', 100); g.addEdge('G02', 'G20', 283); g.addEdge('G02', 'G21', 224); g.addEdge('G02', 'G22', 200);
    g.addEdge('G10', 'G11', 100); g.addEdge('G10', 'G12', 200); g.addEdge('G10', 'G20', 100); g.addEdge('G10', 'G21', 141); g.addEdge('G10', 'G22', 224);
    g.addEdge('G11', 'G12', 100); g.addEdge('G11', 'G20', 141); g.addEdge('G11', 'G21', 100); g.addEdge('G11', 'G22', 141);
    g.addEdge('G12', 'G20', 224); g.addEdge('G12', 'G21', 141); g.addEdge('G12', 'G22', 100);
    g.addEdge('G20', 'G21', 100); g.addEdge('G20', 'G22', 200);
    g.addEdge('G21', 'G22', 100);
    return g;
  }

  /** TSP Cluster 8 — 8 cities in 2 clusters (tests clustering heuristics) */
  static tspCluster8(): Graph {
    const g = new Graph(false, true);
    const cities = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'];
    for (const c of cities) g.addNode(c);
    g.addEdge('C1', 'C2', 100); g.addEdge('C1', 'C3', 100); g.addEdge('C1', 'C4', 141); g.addEdge('C1', 'C5', 707); g.addEdge('C1', 'C6', 781); g.addEdge('C1', 'C7', 781); g.addEdge('C1', 'C8', 849);
    g.addEdge('C2', 'C3', 141); g.addEdge('C2', 'C4', 100); g.addEdge('C2', 'C5', 640); g.addEdge('C2', 'C6', 707); g.addEdge('C2', 'C7', 721); g.addEdge('C2', 'C8', 781);
    g.addEdge('C3', 'C4', 100); g.addEdge('C3', 'C5', 640); g.addEdge('C3', 'C6', 721); g.addEdge('C3', 'C7', 707); g.addEdge('C3', 'C8', 781);
    g.addEdge('C4', 'C5', 566); g.addEdge('C4', 'C6', 640); g.addEdge('C4', 'C7', 640); g.addEdge('C4', 'C8', 707);
    g.addEdge('C5', 'C6', 100); g.addEdge('C5', 'C7', 100); g.addEdge('C5', 'C8', 141);
    g.addEdge('C6', 'C7', 141); g.addEdge('C6', 'C8', 100);
    g.addEdge('C7', 'C8', 100);
    return g;
  }

  /** TSP Euclidean 10 — 10 random-like points with Euclidean distances */
  static tspEuclidean10(): Graph {
    const g = new Graph(false, true);
    const cities = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'];
    for (const c of cities) g.addNode(c);
    g.addEdge('P1', 'P2', 361); g.addEdge('P1', 'P3', 510); g.addEdge('P1', 'P4', 806); g.addEdge('P1', 'P5', 608); g.addEdge('P1', 'P6', 806); g.addEdge('P1', 'P7', 825); g.addEdge('P1', 'P8', 583); g.addEdge('P1', 'P9', 1000); g.addEdge('P1', 'P10', 900);
    g.addEdge('P2', 'P3', 361); g.addEdge('P2', 'P4', 510); g.addEdge('P2', 'P5', 316); g.addEdge('P2', 'P6', 447); g.addEdge('P2', 'P7', 608); g.addEdge('P2', 'P8', 224); g.addEdge('P2', 'P9', 640); g.addEdge('P2', 'P10', 762);
    g.addEdge('P3', 'P4', 361); g.addEdge('P3', 'P5', 640); g.addEdge('P3', 'P6', 608); g.addEdge('P3', 'P7', 316); g.addEdge('P3', 'P8', 447); g.addEdge('P3', 'P9', 707); g.addEdge('P3', 'P10', 412);
    g.addEdge('P4', 'P5', 632); g.addEdge('P4', 'P6', 424); g.addEdge('P4', 'P7', 224); g.addEdge('P4', 'P8', 412); g.addEdge('P4', 'P9', 412); g.addEdge('P4', 'P10', 447);
    g.addEdge('P5', 'P6', 316); g.addEdge('P5', 'P7', 806); g.addEdge('P5', 'P8', 224); g.addEdge('P5', 'P9', 539); g.addEdge('P5', 'P10', 1000);
    g.addEdge('P6', 'P7', 640); g.addEdge('P6', 'P8', 224); g.addEdge('P6', 'P9', 224); g.addEdge('P6', 'P10', 860);
    g.addEdge('P7', 'P8', 583); g.addEdge('P7', 'P9', 632); g.addEdge('P7', 'P10', 224);
    g.addEdge('P8', 'P9', 424); g.addEdge('P8', 'P10', 781);
    g.addEdge('P9', 'P10', 854);
    return g;
  }
}
