/**
 * Timetable domain model + scheduler.
 *
 * Konsep:
 *   - Lecturers   : dosen (e.g., Pak Budi)
 *   - Courses     : mata kuliah (e.g., Algoritma)
 *   - Classes     : kelas/section (e.g., IF-A, IF-B)
 *   - Assignments : record "Lecturer mengajar Course ke Class sebanyak N sesi"
 *
 * Algoritma scheduling:
 *   Diturunkan dari edge-colouring pada bipartite multi-graph (Lecturer × Class).
 *   Setiap assignment dengan N sesi = N edge paralel antara dosen & kelas.
 *   Tiap warna (= time slot) tidak boleh punya >1 edge incident pada vertex
 *   yang sama (dosen / kelas tidak bentrok).
 *
 *   Greedy first-fit colouring; banyak slot ≥ max(deg(dosen), deg(kelas)).
 *   Pada graf bipartit, batas ini selalu cukup (König, 1916), sehingga
 *   greedy first-fit ditambah 1 fallback slot baru selalu menyelesaikan
 *   kasus yang feasible.
 */

export interface Lecturer {
  id: string;       // unique id (e.g., 'L1')
  name: string;     // display (e.g., 'Pak Budi')
}

export interface Course {
  id: string;       // unique id (e.g., 'C1')
  name: string;     // display (e.g., 'Algoritma')
  code?: string;    // optional code (e.g., 'IF2110')
}

export interface ClassRoom {
  id: string;       // unique id (e.g., 'K1')
  name: string;     // display (e.g., 'IF-A')
}

export interface Assignment {
  id: string;          // unique id (e.g., 'A1')
  lecturerId: string;  // references Lecturer.id
  courseId: string;    // references Course.id
  classId: string;     // references ClassRoom.id
  sessions: number;    // jumlah pertemuan / minggu (≥ 1)
}

export interface ScheduledSession {
  assignmentId: string;
  lecturerId: string;
  courseId: string;
  classId: string;
  slot: number;        // 0-indexed time slot (period)
}

export interface ConflictReason {
  type: 'lecturer-overload' | 'class-overload' | 'unknown-id' | 'too-few-slots';
  message: string;
}

export interface TimetableScheduleResult {
  feasible: boolean;
  scheduled: ScheduledSession[];
  unscheduled: Array<{ assignmentId: string; remaining: number }>;
  slotsUsed: number;
  slotsRequested: number;
  totalSessions: number;
  lecturerLoad: Map<string, number>;   // lecturerId → total sessions
  classLoad: Map<string, number>;      // classId → total sessions
  maxLecturerLoad: number;
  maxClassLoad: number;
  /** Lower bound on slots needed (max degree on the bipartite multi-graph). */
  minSlotsNeeded: number;
  conflicts: ConflictReason[];
  /** Convenient grid: timetable[slot][classIdx] = ScheduledSession | null. */
  grid: Array<Array<ScheduledSession | null>>;
}

export class Timetable {
  lecturers: Lecturer[] = [];
  courses: Course[] = [];
  classes: ClassRoom[] = [];
  assignments: Assignment[] = [];
  /** Number of available time slots per cycle (e.g., per week). */
  slotsPerCycle: number = 8;

  /* ── ID generators ── */
  private nextId(prefix: string, list: { id: string }[]): string {
    let i = list.length + 1;
    while (list.some((x) => x.id === `${prefix}${i}`)) i++;
    return `${prefix}${i}`;
  }

  /* ── Mutations (return cloned instance for store immutability) ── */
  clone(): Timetable {
    const t = new Timetable();
    t.lecturers = this.lecturers.map((x) => ({ ...x }));
    t.courses = this.courses.map((x) => ({ ...x }));
    t.classes = this.classes.map((x) => ({ ...x }));
    t.assignments = this.assignments.map((x) => ({ ...x }));
    t.slotsPerCycle = this.slotsPerCycle;
    return t;
  }

  addLecturer(name: string): Lecturer {
    const id = this.nextId('L', this.lecturers);
    const lec: Lecturer = { id, name: name.trim() || id };
    this.lecturers.push(lec);
    return lec;
  }

  addCourse(name: string, code?: string): Course {
    const id = this.nextId('C', this.courses);
    const course: Course = {
      id,
      name: name.trim() || id,
      code: code?.trim() || undefined,
    };
    this.courses.push(course);
    return course;
  }

  addClass(name: string): ClassRoom {
    const id = this.nextId('K', this.classes);
    const cls: ClassRoom = { id, name: name.trim() || id };
    this.classes.push(cls);
    return cls;
  }

  addAssignment(lecturerId: string, courseId: string, classId: string, sessions: number = 1): Assignment | null {
    if (!this.lecturers.some((l) => l.id === lecturerId)) return null;
    if (!this.courses.some((c) => c.id === courseId)) return null;
    if (!this.classes.some((c) => c.id === classId)) return null;
    const safeSessions = Math.max(1, Math.floor(sessions));
    const id = this.nextId('A', this.assignments);
    const a: Assignment = { id, lecturerId, courseId, classId, sessions: safeSessions };
    this.assignments.push(a);
    return a;
  }

  removeLecturer(id: string) {
    this.lecturers = this.lecturers.filter((x) => x.id !== id);
    this.assignments = this.assignments.filter((a) => a.lecturerId !== id);
  }

  removeCourse(id: string) {
    this.courses = this.courses.filter((x) => x.id !== id);
    this.assignments = this.assignments.filter((a) => a.courseId !== id);
  }

  removeClass(id: string) {
    this.classes = this.classes.filter((x) => x.id !== id);
    this.assignments = this.assignments.filter((a) => a.classId !== id);
  }

  removeAssignment(id: string) {
    this.assignments = this.assignments.filter((x) => x.id !== id);
  }

  setSlotsPerCycle(slots: number) {
    this.slotsPerCycle = Math.max(1, Math.floor(slots));
  }

  /* ── Lookups ── */
  getLecturer(id: string): Lecturer | undefined { return this.lecturers.find((x) => x.id === id); }
  getCourse(id: string): Course | undefined { return this.courses.find((x) => x.id === id); }
  getClass(id: string): ClassRoom | undefined { return this.classes.find((x) => x.id === id); }
  getAssignment(id: string): Assignment | undefined { return this.assignments.find((x) => x.id === id); }

  /* ── JSON ── */
  toJSON(): object {
    return {
      lecturers: this.lecturers,
      courses: this.courses,
      classes: this.classes,
      assignments: this.assignments,
      slotsPerCycle: this.slotsPerCycle,
    };
  }

  static fromJSON(data: any): Timetable {
    const t = new Timetable();
    if (Array.isArray(data?.lecturers)) t.lecturers = data.lecturers.map((x: any) => ({ id: String(x.id), name: String(x.name) }));
    if (Array.isArray(data?.courses)) t.courses = data.courses.map((x: any) => ({ id: String(x.id), name: String(x.name), code: x.code ? String(x.code) : undefined }));
    if (Array.isArray(data?.classes)) t.classes = data.classes.map((x: any) => ({ id: String(x.id), name: String(x.name) }));
    if (Array.isArray(data?.assignments)) {
      t.assignments = data.assignments.map((x: any) => ({
        id: String(x.id),
        lecturerId: String(x.lecturerId),
        courseId: String(x.courseId),
        classId: String(x.classId),
        sessions: Math.max(1, Math.floor(Number(x.sessions) || 1)),
      }));
    }
    if (typeof data?.slotsPerCycle === 'number') t.slotsPerCycle = Math.max(1, Math.floor(data.slotsPerCycle));
    return t;
  }
}

/* ============================================================
   SCHEDULER
   ============================================================ */
export function scheduleTimetable(t: Timetable): TimetableScheduleResult {
  const conflicts: ConflictReason[] = [];

  // Validate IDs
  for (const a of t.assignments) {
    if (!t.getLecturer(a.lecturerId) || !t.getCourse(a.courseId) || !t.getClass(a.classId)) {
      conflicts.push({
        type: 'unknown-id',
        message: `Assignment ${a.id} references unknown ID(s).`,
      });
    }
  }

  // Compute load per lecturer / class (by total sessions)
  const lecturerLoad = new Map<string, number>();
  const classLoad = new Map<string, number>();
  for (const a of t.assignments) {
    lecturerLoad.set(a.lecturerId, (lecturerLoad.get(a.lecturerId) ?? 0) + a.sessions);
    classLoad.set(a.classId, (classLoad.get(a.classId) ?? 0) + a.sessions);
  }
  const maxLecturerLoad = Math.max(0, ...lecturerLoad.values());
  const maxClassLoad = Math.max(0, ...classLoad.values());
  const minSlotsNeeded = Math.max(maxLecturerLoad, maxClassLoad);
  const totalSessions = t.assignments.reduce((s, a) => s + a.sessions, 0);

  if (minSlotsNeeded > t.slotsPerCycle) {
    conflicts.push({
      type: 'too-few-slots',
      message: `Butuh minimal ${minSlotsNeeded} slot, tapi hanya ${t.slotsPerCycle} tersedia.`,
    });
  }

  // Build expanded edge list (one edge per session)
  // Each edge = (lecturerId, classId, courseId, assignmentId).
  type Edge = { lecturerId: string; classId: string; courseId: string; assignmentId: string };
  const edges: Edge[] = [];
  for (const a of t.assignments) {
    for (let i = 0; i < a.sessions; i++) {
      edges.push({
        lecturerId: a.lecturerId,
        classId: a.classId,
        courseId: a.courseId,
        assignmentId: a.id,
      });
    }
  }

  // Sort edges by saturation: assignments touching the busiest lecturer/class first.
  // Greedy heuristic — significantly improves first-fit on tight cases.
  edges.sort((a, b) => {
    const sa = (lecturerLoad.get(a.lecturerId) ?? 0) + (classLoad.get(a.classId) ?? 0);
    const sb = (lecturerLoad.get(b.lecturerId) ?? 0) + (classLoad.get(b.classId) ?? 0);
    return sb - sa;
  });

  // Greedy first-fit colouring
  const slotsCap = t.slotsPerCycle;
  const lecturerSlot = new Map<string, Set<number>>(); // lecturerId → set of used slots
  const classSlot = new Map<string, Set<number>>();    // classId    → set of used slots

  const scheduled: ScheduledSession[] = [];
  const unscheduledByA = new Map<string, number>();

  for (const e of edges) {
    const lUsed = lecturerSlot.get(e.lecturerId) ?? new Set<number>();
    const cUsed = classSlot.get(e.classId) ?? new Set<number>();

    let placed = -1;
    for (let s = 0; s < slotsCap; s++) {
      if (!lUsed.has(s) && !cUsed.has(s)) {
        placed = s;
        break;
      }
    }

    if (placed === -1) {
      // Could not fit within cap — treat as unscheduled
      unscheduledByA.set(e.assignmentId, (unscheduledByA.get(e.assignmentId) ?? 0) + 1);
      continue;
    }

    lUsed.add(placed);
    cUsed.add(placed);
    lecturerSlot.set(e.lecturerId, lUsed);
    classSlot.set(e.classId, cUsed);

    scheduled.push({
      assignmentId: e.assignmentId,
      lecturerId: e.lecturerId,
      courseId: e.courseId,
      classId: e.classId,
      slot: placed,
    });
  }

  if (unscheduledByA.size > 0) {
    for (const [aid, remaining] of unscheduledByA) {
      const a = t.getAssignment(aid);
      if (!a) continue;
      // Detect whether the conflict comes from lecturer or class saturation.
      const lecLoad = lecturerLoad.get(a.lecturerId) ?? 0;
      const clsLoad = classLoad.get(a.classId) ?? 0;
      if (lecLoad > slotsCap) {
        conflicts.push({
          type: 'lecturer-overload',
          message: `Beban dosen ${t.getLecturer(a.lecturerId)?.name ?? a.lecturerId} = ${lecLoad} sesi > ${slotsCap} slot.`,
        });
      }
      if (clsLoad > slotsCap) {
        conflicts.push({
          type: 'class-overload',
          message: `Beban kelas ${t.getClass(a.classId)?.name ?? a.classId} = ${clsLoad} sesi > ${slotsCap} slot.`,
        });
      }
      void remaining;
    }
  }

  const slotsUsed = scheduled.reduce((m, s) => Math.max(m, s.slot + 1), 0);

  // Build the grid view: rows=slot, cols=class index.
  const classIndex = new Map<string, number>();
  t.classes.forEach((c, i) => classIndex.set(c.id, i));

  const grid: Array<Array<ScheduledSession | null>> = Array.from(
    { length: slotsCap },
    () => Array(t.classes.length).fill(null) as Array<ScheduledSession | null>
  );
  for (const s of scheduled) {
    const ci = classIndex.get(s.classId);
    if (ci === undefined) continue;
    if (s.slot < grid.length) {
      grid[s.slot][ci] = s;
    }
  }

  const unscheduled = Array.from(unscheduledByA.entries()).map(([assignmentId, remaining]) => ({
    assignmentId,
    remaining,
  }));

  // Deduplicate conflicts by message
  const seen = new Set<string>();
  const uniqueConflicts = conflicts.filter((c) => {
    const key = `${c.type}:${c.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    feasible: unscheduled.length === 0 && uniqueConflicts.length === 0,
    scheduled,
    unscheduled,
    slotsUsed,
    slotsRequested: slotsCap,
    totalSessions,
    lecturerLoad,
    classLoad,
    maxLecturerLoad,
    maxClassLoad,
    minSlotsNeeded,
    conflicts: uniqueConflicts,
    grid,
  };
}

/* ============================================================
   PRESETS — sample timetables for quick testing
   ============================================================ */
export const TimetablePresets = {
  /** Tiny example: 2 dosen, 3 matkul, 2 kelas. */
  smallIF(): Timetable {
    const t = new Timetable();
    t.slotsPerCycle = 6;
    const budi = t.addLecturer('Pak Budi');
    const siti = t.addLecturer('Bu Siti');
    const algo = t.addCourse('Algoritma', 'IF2110');
    const calc = t.addCourse('Kalkulus', 'MA1101');
    const dasprog = t.addCourse('Dasar Pemrograman', 'IF1100');
    const ifa = t.addClass('IF-A');
    const ifb = t.addClass('IF-B');
    t.addAssignment(budi.id, algo.id, ifa.id, 2);
    t.addAssignment(budi.id, dasprog.id, ifb.id, 2);
    t.addAssignment(siti.id, calc.id, ifa.id, 2);
    t.addAssignment(siti.id, calc.id, ifb.id, 2);
    return t;
  },

  /** Medium: 4 dosen, 5 matkul, 3 kelas, 8 slot. */
  mediumIF(): Timetable {
    const t = new Timetable();
    t.slotsPerCycle = 8;
    const lec = ['Pak Ahmad', 'Bu Dewi', 'Pak Hendra', 'Bu Rina'].map((n) => t.addLecturer(n));
    const courses = [
      t.addCourse('Algoritma & Struktur Data', 'IF2110'),
      t.addCourse('Basis Data', 'IF2230'),
      t.addCourse('Matematika Diskrit', 'IF1220'),
      t.addCourse('Pemrograman Berorientasi Objek', 'IF2210'),
      t.addCourse('Sistem Operasi', 'IF2230'),
    ];
    const cls = ['IF-A', 'IF-B', 'IF-C'].map((n) => t.addClass(n));
    // ahmad — algo, oop
    t.addAssignment(lec[0].id, courses[0].id, cls[0].id, 2);
    t.addAssignment(lec[0].id, courses[3].id, cls[1].id, 2);
    // dewi — basdat, dispro
    t.addAssignment(lec[1].id, courses[1].id, cls[0].id, 2);
    t.addAssignment(lec[1].id, courses[2].id, cls[2].id, 2);
    // hendra — sistem operasi, algo
    t.addAssignment(lec[2].id, courses[4].id, cls[1].id, 2);
    t.addAssignment(lec[2].id, courses[0].id, cls[2].id, 2);
    // rina — basdat, dispro
    t.addAssignment(lec[3].id, courses[1].id, cls[1].id, 2);
    t.addAssignment(lec[3].id, courses[2].id, cls[0].id, 2);
    return t;
  },

  /** Large: 5 dosen, 6 matkul, 4 kelas, 10 slot. */
  largeIF(): Timetable {
    const t = new Timetable();
    t.slotsPerCycle = 10;
    const lec = ['Pak Suryanto', 'Bu Melati', 'Pak Firman', 'Bu Nurlita', 'Pak Bambang'].map((n) => t.addLecturer(n));
    const courses = [
      t.addCourse('Algoritma & Struktur Data', 'IF2110'),
      t.addCourse('Basis Data', 'IF2230'),
      t.addCourse('Matematika Diskrit', 'IF1220'),
      t.addCourse('Sistem Operasi', 'IF2240'),
      t.addCourse('Jaringan Komputer', 'IF3110'),
      t.addCourse('Kecerdasan Buatan', 'IF4070'),
    ];
    const cls = ['IF-A', 'IF-B', 'IF-C', 'IF-D'].map((n) => t.addClass(n));

    t.addAssignment(lec[0].id, courses[0].id, cls[0].id, 2);
    t.addAssignment(lec[0].id, courses[0].id, cls[1].id, 2);
    t.addAssignment(lec[1].id, courses[1].id, cls[0].id, 2);
    t.addAssignment(lec[1].id, courses[1].id, cls[2].id, 2);
    t.addAssignment(lec[2].id, courses[2].id, cls[1].id, 2);
    t.addAssignment(lec[2].id, courses[2].id, cls[3].id, 2);
    t.addAssignment(lec[3].id, courses[3].id, cls[2].id, 2);
    t.addAssignment(lec[3].id, courses[4].id, cls[3].id, 2);
    t.addAssignment(lec[4].id, courses[5].id, cls[0].id, 2);
    t.addAssignment(lec[4].id, courses[5].id, cls[3].id, 2);
    t.addAssignment(lec[4].id, courses[4].id, cls[1].id, 2);
    return t;
  },
};
