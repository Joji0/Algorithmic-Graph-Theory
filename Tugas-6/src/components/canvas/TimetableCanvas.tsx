import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, Trash2, Play, Users, BookOpen, School,
  GraduationCap, AlertTriangle, CheckCircle2, Sparkles, Download, Upload,
} from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore';

const SLOT_PALETTE = [
  '#00f0ff', '#a855f7', '#10b981', '#f97316', '#ec4899',
  '#facc15', '#3b82f6', '#ef4444', '#06b6d4', '#84cc16',
  '#e879f9', '#fb923c', '#2dd4bf', '#f472b6', '#a3e635',
  '#c084fc',
];

function colorFor(idx: number) {
  return SLOT_PALETTE[idx % SLOT_PALETTE.length];
}

export default function TimetableCanvas() {
  const timetable = useGraphStore((s) => s.timetable);
  const result = useGraphStore((s) => s.timetableResult);
  const addLecturer = useGraphStore((s) => s.addTimetableLecturer);
  const addCourse = useGraphStore((s) => s.addTimetableCourse);
  const addClass = useGraphStore((s) => s.addTimetableClass);
  const addAssignment = useGraphStore((s) => s.addTimetableAssignment);
  const removeLecturer = useGraphStore((s) => s.removeTimetableLecturer);
  const removeCourse = useGraphStore((s) => s.removeTimetableCourse);
  const removeClass = useGraphStore((s) => s.removeTimetableClass);
  const removeAssignment = useGraphStore((s) => s.removeTimetableAssignment);
  const setSlots = useGraphStore((s) => s.setTimetableSlots);
  const runSchedule = useGraphStore((s) => s.runTimetableSchedule);
  const loadPreset = useGraphStore((s) => s.loadTimetablePreset);
  const clearAll = useGraphStore((s) => s.clearTimetable);
  const importJSON = useGraphStore((s) => s.importTimetableJSON);
  const exportJSON = useGraphStore((s) => s.exportTimetableJSON);

  const [tab, setTab] = useState<'data' | 'assign' | 'json'>('data');
  const [lecturerName, setLecturerName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [className, setClassName] = useState('');

  const [aLecturer, setALecturer] = useState('');
  const [aCourse, setACourse] = useState('');
  const [aClass, setAClass] = useState('');
  const [aSessions, setASessions] = useState('1');

  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const lecturerById = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of timetable.lecturers) m.set(l.id, l.name);
    return m;
  }, [timetable.lecturers]);

  const courseById = useMemo(() => {
    const m = new Map<string, { name: string; code?: string }>();
    for (const c of timetable.courses) m.set(c.id, { name: c.name, code: c.code });
    return m;
  }, [timetable.courses]);

  const classById = useMemo(() => {
    const m = new Map<string, string>();
    for (const k of timetable.classes) m.set(k.id, k.name);
    return m;
  }, [timetable.classes]);

  const handleAddLecturer = () => {
    const v = lecturerName.trim();
    if (!v) return;
    addLecturer(v);
    setLecturerName('');
  };
  const handleAddCourse = () => {
    const v = courseName.trim();
    if (!v) return;
    addCourse(v, courseCode.trim() || undefined);
    setCourseName('');
    setCourseCode('');
  };
  const handleAddClass = () => {
    const v = className.trim();
    if (!v) return;
    addClass(v);
    setClassName('');
  };
  const handleAddAssignment = () => {
    if (!aLecturer || !aCourse || !aClass) return;
    const n = Math.max(1, parseInt(aSessions, 10) || 1);
    addAssignment(aLecturer, aCourse, aClass, n);
    setASessions('1');
  };

  const handleExport = () => {
    setJsonText(exportJSON());
    setJsonError('');
    setTab('json');
  };

  const handleImport = () => {
    try {
      importJSON(jsonText);
      setJsonError('');
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const conflicts = result?.conflicts ?? [];
  const unscheduled = result?.unscheduled ?? [];

  return (
    <div className="absolute inset-0 pt-14 flex">
      {/* ========================== LEFT: data input ========================== */}
      <aside className="w-[380px] border-r border-white/5 glass-heavy flex flex-col">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neon-cyan" />
              Timetabling
            </h2>
            <div className="flex gap-1">
              <button onClick={handleExport} className="btn-icon !p-1.5" title="Export JSON">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setTab('json')} className="btn-icon !p-1.5" title="Import JSON">
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button onClick={clearAll} className="btn-icon !p-1.5 hover:!text-red-400 hover:!border-red-400/30" title="Clear">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="tab-bar">
            {(['data', 'assign', 'json'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`tab-item flex-1 ${tab === t ? 'active' : ''}`}
              >
                {t === 'data' ? 'Data' : t === 'assign' ? 'Penugasan' : 'JSON'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            {tab === 'data' && (
              <motion.div
                key="data"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Preset Cepat
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => loadPreset('smallIF')} className="btn-secondary !text-xs !py-2">
                      Kecil
                    </button>
                    <button onClick={() => loadPreset('mediumIF')} className="btn-secondary !text-xs !py-2">
                      Sedang
                    </button>
                    <button onClick={() => loadPreset('largeIF')} className="btn-secondary !text-xs !py-2">
                      Besar
                    </button>
                  </div>
                </div>

                {/* Slots */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Slot Waktu / Siklus
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={timetable.slotsPerCycle}
                      onChange={(e) => setSlots(parseInt(e.target.value, 10) || 1)}
                      className="input-field flex-1"
                    />
                    <span className="text-xs text-gray-500">slot</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Jumlah periode tersedia (e.g. 8 = 8 jam ajar per minggu).
                    Tiap dosen & kelas tidak boleh punya 2 sesi di slot yang sama.
                  </p>
                </div>

                <div className="divider" />

                {/* Lecturers */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Dosen ({timetable.lecturers.length})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={lecturerName}
                      onChange={(e) => setLecturerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLecturer()}
                      placeholder="Nama dosen"
                      className="input-field flex-1"
                    />
                    <button onClick={handleAddLecturer} className="btn-primary !px-3">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {timetable.lecturers.map((l) => (
                      <div key={l.id} className="flex items-center justify-between text-xs p-2 rounded bg-white/[0.03] hover:bg-white/[0.06] group">
                        <span className="text-gray-300">{l.name}</span>
                        <button
                          onClick={() => removeLecturer(l.id)}
                          className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {timetable.lecturers.length === 0 && (
                      <p className="text-[11px] text-gray-600 italic">Belum ada dosen.</p>
                    )}
                  </div>
                </div>

                {/* Courses */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> Mata Kuliah ({timetable.courses.length})
                  </label>
                  <div className="grid grid-cols-[1fr,80px,auto] gap-2">
                    <input
                      type="text"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="Nama matkul"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="Kode"
                      className="input-field"
                    />
                    <button onClick={handleAddCourse} className="btn-primary !px-3">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {timetable.courses.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-xs p-2 rounded bg-white/[0.03] hover:bg-white/[0.06] group">
                        <span className="text-gray-300">
                          {c.name}
                          {c.code && <span className="ml-1.5 text-[10px] text-gray-500">({c.code})</span>}
                        </span>
                        <button
                          onClick={() => removeCourse(c.id)}
                          className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {timetable.courses.length === 0 && (
                      <p className="text-[11px] text-gray-600 italic">Belum ada matkul.</p>
                    )}
                  </div>
                </div>

                {/* Classes */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <School className="w-3 h-3" /> Kelas ({timetable.classes.length})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
                      placeholder="Nama kelas (mis. IF-A)"
                      className="input-field flex-1"
                    />
                    <button onClick={handleAddClass} className="btn-primary !px-3">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {timetable.classes.map((k) => (
                      <div key={k.id} className="flex items-center justify-between text-xs p-2 rounded bg-white/[0.03] hover:bg-white/[0.06] group">
                        <span className="text-gray-300">{k.name}</span>
                        <button
                          onClick={() => removeClass(k.id)}
                          className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {timetable.classes.length === 0 && (
                      <p className="text-[11px] text-gray-600 italic">Belum ada kelas.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'assign' && (
              <motion.div
                key="assign"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3 h-3" /> Tambah Penugasan
                  </label>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider">Dosen</label>
                    <select value={aLecturer} onChange={(e) => setALecturer(e.target.value)} className="select-field">
                      <option value="">Pilih dosen…</option>
                      {timetable.lecturers.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider">Mata Kuliah</label>
                    <select value={aCourse} onChange={(e) => setACourse(e.target.value)} className="select-field">
                      <option value="">Pilih matkul…</option>
                      {timetable.courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.code ? ` (${c.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider">Kelas</label>
                    <select value={aClass} onChange={(e) => setAClass(e.target.value)} className="select-field">
                      <option value="">Pilih kelas…</option>
                      {timetable.classes.map((k) => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider">Sesi / minggu</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={aSessions}
                      onChange={(e) => setASessions(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <button
                    onClick={handleAddAssignment}
                    disabled={!aLecturer || !aCourse || !aClass}
                    className="btn-primary w-full flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Penugasan
                  </button>
                </div>

                <div className="divider" />

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Daftar Penugasan ({timetable.assignments.length})
                  </label>
                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                    {timetable.assignments.map((a) => {
                      const lname = lecturerById.get(a.lecturerId) ?? '?';
                      const cinfo = courseById.get(a.courseId);
                      const kname = classById.get(a.classId) ?? '?';
                      return (
                        <div key={a.id} className="text-xs p-2.5 rounded bg-white/[0.03] hover:bg-white/[0.06] group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-200 font-medium truncate">
                                {cinfo?.name ?? '?'}{cinfo?.code ? ` · ${cinfo.code}` : ''}
                              </div>
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                {lname} → {kname}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="badge text-[10px] bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
                                {a.sessions}× / minggu
                              </span>
                              <button
                                onClick={() => removeAssignment(a.id)}
                                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {timetable.assignments.length === 0 && (
                      <p className="text-[11px] text-gray-600 italic">Belum ada penugasan.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'json' && (
              <motion.div
                key="json"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Import / Export JSON
                </label>
                <textarea
                  value={jsonText}
                  onChange={(e) => { setJsonText(e.target.value); setJsonError(''); }}
                  placeholder='{"lecturers":[],"courses":[],"classes":[],"assignments":[],"slotsPerCycle":8}'
                  className="input-field !h-64 resize-none text-xs font-mono"
                  spellCheck={false}
                />
                {jsonError && <p className="text-xs text-red-400">{jsonError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleImport} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Import
                  </button>
                  <button onClick={handleExport} className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Run button pinned at bottom */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={runSchedule}
            disabled={timetable.assignments.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Play className="w-4 h-4" />
            Susun Jadwal
          </button>
        </div>
      </aside>

      {/* ========================== RIGHT: schedule view ========================== */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <ScheduleSummary />
        <ScheduleGrid />
        {(conflicts.length > 0 || unscheduled.length > 0) && <ConflictsPanel />}
        <LecturerLoadPanel />
      </div>
    </div>
  );
}

/* ============================================================
   SUMMARY
   ============================================================ */
function ScheduleSummary() {
  const result = useGraphStore((s) => s.timetableResult);
  const timetable = useGraphStore((s) => s.timetable);

  if (!result) {
    return (
      <div className="p-6 rounded-xl glass-medium border border-white/5 text-center">
        <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Belum ada jadwal.</p>
        <p className="text-xs text-gray-500 mt-1">
          Tambahkan dosen, matkul, kelas, lalu klik <span className="text-neon-cyan">Susun Jadwal</span>.
        </p>
        <p className="text-[11px] text-gray-600 mt-3">
          Saat ini: {timetable.lecturers.length} dosen · {timetable.courses.length} matkul · {timetable.classes.length} kelas · {timetable.assignments.length} penugasan
        </p>
      </div>
    );
  }

  const ok = result.feasible;
  return (
    <div className={`p-4 rounded-xl border flex items-center gap-3 ${ok ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-amber-500/5 border-amber-500/30'}`}>
      {ok ? (
        <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
      ) : (
        <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
      )}
      <div className="flex-1">
        <p className={`text-sm font-medium ${ok ? 'text-emerald-300' : 'text-amber-300'}`}>
          {ok ? 'Jadwal feasible.' : 'Ada konflik / sesi belum terjadwal.'}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {result.totalSessions} sesi · {result.slotsUsed}/{result.slotsRequested} slot terpakai · min slot dibutuhkan = {result.minSlotsNeeded}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   GRID — slot × class
   ============================================================ */
function ScheduleGrid() {
  const timetable = useGraphStore((s) => s.timetable);
  const result = useGraphStore((s) => s.timetableResult);

  const classes = timetable.classes;
  if (classes.length === 0) return null;

  const slots = result?.slotsRequested ?? timetable.slotsPerCycle;
  const grid = result?.grid ?? Array.from({ length: slots }, () => Array(classes.length).fill(null));

  // Map assignmentId -> color
  const assignmentColor = useMemo(() => {
    const m = new Map<string, string>();
    timetable.assignments.forEach((a, i) => m.set(a.id, colorFor(i)));
    return m;
  }, [timetable.assignments]);

  return (
    <div className="rounded-xl glass-medium border border-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neon-cyan" />
          Jadwal Mingguan
        </h3>
        <p className="text-[11px] text-gray-500">slot × kelas</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-white/[0.03]">
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-20">Slot</th>
              {classes.map((c) => (
                <th key={c.id} className="px-3 py-2 text-left text-[11px] font-semibold text-gray-300 uppercase tracking-wider min-w-[150px]">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, slotIdx) => (
              <tr key={slotIdx} className="border-t border-white/5">
                <td className="px-3 py-2 text-xs text-gray-400 font-mono align-top">
                  Slot {slotIdx + 1}
                </td>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2 py-2 align-top">
                    {cell ? (
                      <ScheduleCell
                        sessionAssignmentId={cell.assignmentId}
                        color={assignmentColor.get(cell.assignmentId) ?? '#00f0ff'}
                      />
                    ) : (
                      <div className="h-12 rounded border border-dashed border-white/5 flex items-center justify-center text-[11px] text-gray-700">
                        —
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScheduleCell({ sessionAssignmentId, color }: { sessionAssignmentId: string; color: string }) {
  const timetable = useGraphStore((s) => s.timetable);
  const a = timetable.assignments.find((x) => x.id === sessionAssignmentId);
  if (!a) return null;
  const lec = timetable.lecturers.find((x) => x.id === a.lecturerId);
  const course = timetable.courses.find((x) => x.id === a.courseId);

  return (
    <div
      className="h-12 px-2 py-1 rounded border flex flex-col justify-center"
      style={{
        background: `${color}1a`,
        borderColor: `${color}55`,
      }}
    >
      <div className="text-xs font-semibold truncate" style={{ color }}>
        {course?.name ?? '?'}
      </div>
      <div className="text-[10px] text-gray-400 truncate">
        {lec?.name ?? '?'}
        {course?.code ? ` · ${course.code}` : ''}
      </div>
    </div>
  );
}

/* ============================================================
   CONFLICTS
   ============================================================ */
function ConflictsPanel() {
  const result = useGraphStore((s) => s.timetableResult);
  const timetable = useGraphStore((s) => s.timetable);
  if (!result) return null;
  const { conflicts, unscheduled } = result;
  if (conflicts.length === 0 && unscheduled.length === 0) return null;

  return (
    <div className="rounded-xl bg-amber-500/5 border border-amber-500/30 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-amber-500/20 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-amber-300">Konflik & Sesi Belum Terjadwal</h3>
      </div>
      <div className="p-4 space-y-2">
        {conflicts.map((c, i) => (
          <p key={i} className="text-xs text-amber-200">
            <span className="text-amber-500 mr-1.5">•</span>{c.message}
          </p>
        ))}
        {unscheduled.map((u, i) => {
          const a = timetable.assignments.find((x) => x.id === u.assignmentId);
          if (!a) return null;
          const lname = timetable.lecturers.find((l) => l.id === a.lecturerId)?.name ?? '?';
          const cname = timetable.courses.find((c) => c.id === a.courseId)?.name ?? '?';
          const kname = timetable.classes.find((k) => k.id === a.classId)?.name ?? '?';
          return (
            <p key={`u${i}`} className="text-xs text-amber-200">
              <span className="text-amber-500 mr-1.5">•</span>
              {lname} – {cname} → {kname} (sisa {u.remaining} sesi)
            </p>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   LOAD STATS
   ============================================================ */
function LecturerLoadPanel() {
  const timetable = useGraphStore((s) => s.timetable);
  const result = useGraphStore((s) => s.timetableResult);

  // Even without scheduling, compute static load for visibility.
  const lecturerLoad = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of timetable.assignments) {
      m.set(a.lecturerId, (m.get(a.lecturerId) ?? 0) + a.sessions);
    }
    return m;
  }, [timetable.assignments]);

  const classLoad = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of timetable.assignments) {
      m.set(a.classId, (m.get(a.classId) ?? 0) + a.sessions);
    }
    return m;
  }, [timetable.assignments]);

  const cap = timetable.slotsPerCycle;

  if (timetable.lecturers.length === 0 && timetable.classes.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <LoadCard
        title="Beban Dosen"
        icon={<Users className="w-4 h-4 text-neon-cyan" />}
        items={timetable.lecturers.map((l) => ({
          id: l.id,
          name: l.name,
          load: lecturerLoad.get(l.id) ?? 0,
        }))}
        cap={cap}
      />
      <LoadCard
        title="Beban Kelas"
        icon={<School className="w-4 h-4 text-neon-orange" />}
        items={timetable.classes.map((c) => ({
          id: c.id,
          name: c.name,
          load: classLoad.get(c.id) ?? 0,
        }))}
        cap={cap}
      />
      {result && <></>}
    </div>
  );
}

function LoadCard({
  title, icon, items, cap,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{ id: string; name: string; load: number }>;
  cap: number;
}) {
  return (
    <div className="rounded-xl glass-medium border border-white/5 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      </div>
      <div className="p-3 space-y-1.5">
        {items.length === 0 && <p className="text-[11px] text-gray-600 italic">Belum ada data.</p>}
        {items.map((it) => {
          const ratio = cap > 0 ? Math.min(1, it.load / cap) : 0;
          const overload = it.load > cap;
          return (
            <div key={it.id} className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 truncate">{it.name}</span>
                <span className={`font-mono ${overload ? 'text-red-400' : 'text-gray-400'}`}>
                  {it.load} / {cap}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${overload ? 'bg-red-500' : 'bg-gradient-to-r from-neon-cyan to-neon-purple'}`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
