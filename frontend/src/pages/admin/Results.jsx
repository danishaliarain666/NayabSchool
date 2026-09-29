import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Eye, Pencil, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { downloadWithAuth } from '../../utils/download';

export default function Results() {
  const [summaries, setSummaries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [classId, setClassId] = useState('');
  const [examId, setExamId] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ student_id: '', subject_id: '', exam_id: '', marks_obtained: '', max_marks: 100 });

  useEffect(() => {
    api.get('/admin/classes').then((r) => setClasses(r.data.data));
    api.get('/admin/results/exams').then((r) => setExams(r.data.data));
  }, []);

  const activeClassId = classId || pagination.currentClass?.id;
  const examsForClass = activeClassId
    ? exams.filter((e) => String(e.class_id) === String(activeClassId))
    : exams;

  useEffect(() => {
    if (!activeClassId || !exams.length) return;
    const match = exams.find((e) => String(e.class_id) === String(activeClassId));
    if (match && String(examId) !== String(match.id)) {
      setExamId(String(match.id));
    }
  }, [activeClassId, exams, page]);

  useEffect(() => {
    if (!examId) {
      setSummaries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = { examId, page };
    if (classId) params.classId = classId;
    else params.byClass = '1';
    api
      .get('/admin/results/summary', { params })
      .then((r) => {
        setSummaries(r.data.data);
        setPagination(r.data.pagination || {});
      })
      .catch(() => toast.error('Could not load results'))
      .finally(() => setLoading(false));
  }, [classId, examId, page]);

  useEffect(() => {
    const cid = classId || pagination.currentClass?.id;
    if (!cid) return;
    Promise.all([
      api.get('/admin/students', { params: { classId: cid, limit: 200 } }),
      api.get('/admin/results/subjects', { params: { classId: cid } }),
    ]).then(([s, sub]) => {
      setStudents(s.data.data);
      setSubjects(sub.data.data);
    });
  }, [classId, pagination.currentClass?.id]);

  useEffect(() => {
    if (classId && examId) {
      setForm((f) => ({ ...f, exam_id: examId }));
    }
  }, [classId, examId]);

  const openView = async (stu) => {
    setViewStudent(stu);
    const res = await api.get('/admin/results/student-detail', {
      params: { studentId: stu.student_id, examId },
    });
    setDetailRows(res.data.data);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    try {
      await api.put(`/admin/results/${editRow.id}`, {
        marks_obtained: editRow.marks_obtained,
        max_marks: editRow.max_marks,
      });
      toast.success('Marks updated');
      setEditRow(null);
      openView(viewStudent);
      const params = { examId, page };
      if (classId) params.classId = classId;
      else params.byClass = '1';
      const r = await api.get('/admin/results/summary', { params });
      setSummaries(r.data.data);
    } catch {
      toast.error('Update failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/results', { ...form, exam_id: examId || form.exam_id });
      toast.success('Result saved');
      setShowForm(false);
      setPage(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const classLabel = classId
    ? classes.find((c) => String(c.id) === String(classId))
    : pagination.currentClass;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="page-title">Results</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overall grade from total marks · Top 3 positions per class
            {classLabel && ` · ${classLabel.name}${classLabel.section ? ` (${classLabel.section})` : ''}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input-field sm:w-44" value={examId} onChange={(e) => { setExamId(e.target.value); setPage(1); }}>
            <option value="">Select exam</option>
            {(activeClassId ? examsForClass : exams).map((e) => (
              <option key={e.id} value={e.id}>{e.name} {activeClassId ? '' : `(${classes.find((c) => c.id === e.class_id)?.name || 'Class'})`}</option>
            ))}
          </select>
          <select className="input-field sm:w-44" value={classId} onChange={(e) => { setClassId(e.target.value); setPage(1); }}>
            <option value="">Browse by class (pages)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
            ))}
          </select>
          <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary text-sm inline-flex items-center gap-1" disabled={!examId || !(classId || pagination.currentClass)}>
            <Plus className="w-4 h-4" /> Add marks
          </button>
        </div>
      </div>

      {!examId && <div className="card text-center text-gray-500 py-10">Select an examination to view class results.</div>}

      {showForm && examId && (
        <form onSubmit={handleSubmit} className="card grid sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div><label className="block text-sm mb-1">Student</label><select required className="input-field" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}><option value="">Select</option>{students.map((s) => <option key={s.id} value={s.id}>{s.roll_number} - {s.full_name}</option>)}</select></div>
          <div><label className="block text-sm mb-1">Subject</label><select required className="input-field" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}><option value="">Select</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label className="block text-sm mb-1">Marks</label><input type="number" required min="0" className="input-field" value={form.marks_obtained} onChange={(e) => setForm({ ...form, marks_obtained: e.target.value })} /></div>
          <button type="submit" className="btn-primary">Save</button>
        </form>
      )}

      {examId && (loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/80">
              <tr>
                <th className="py-3 px-3 text-left">Roll</th>
                <th className="py-3 px-3 text-left">Student</th>
                <th className="py-3 px-3 text-right">Obtained</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-right">%</th>
                <th className="py-3 px-3 text-center">Grade</th>
                <th className="py-3 px-3 text-center">Position</th>
                <th className="py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.student_id} className="border-t dark:border-gray-800">
                  <td className="py-2 px-3">{s.roll_number}</td>
                  <td className="py-2 px-3 font-medium">{s.full_name}</td>
                  <td className="py-2 px-3 text-right">{s.total_obtained}</td>
                  <td className="py-2 px-3 text-right">{s.total_max}</td>
                  <td className="py-2 px-3 text-right">{s.total_max ? s.percentage : '—'}</td>
                  <td className="py-2 px-3 text-center font-bold text-primary">{s.grade}</td>
                  <td className="py-2 px-3 text-center">
                    {s.position ? <span className="px-2 py-0.5 rounded-full bg-gold/20 text-amber-900 text-xs font-bold">{s.position}</span> : '—'}
                  </td>
                  <td className="py-2 px-3">
                    <button type="button" onClick={() => openView(s)} className="text-primary inline-flex items-center gap-1 text-xs"><Eye className="w-3.5 h-3.5" /> View / Edit</button>
                  </td>
                </tr>
              ))}
              {!summaries.length && (
                <tr><td colSpan={8} className="py-8 text-center text-gray-500">No marks for this class and exam yet.</td></tr>
              )}
            </tbody>
          </table>

          {!classId && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t dark:border-gray-800">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-sm inline-flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Previous class</button>
              <span className="text-sm text-gray-500">Class page {page} of {pagination.totalPages}</span>
              <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-sm inline-flex items-center gap-1">Next class <ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      ))}

      {viewStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between mb-4">
              <div>
                <h2 className="font-bold">{viewStudent.full_name}</h2>
                <p className="text-xs text-gray-500">Subject marks (grades are overall only)</p>
              </div>
              <button type="button" onClick={() => { setViewStudent(null); setEditRow(null); }}><X className="w-5 h-5" /></button>
            </div>
            <table className="w-full text-sm mb-4">
              <thead><tr className="border-b"><th className="py-2 text-left">Subject</th><th className="py-2 text-right">Marks</th><th className="py-2 w-16" /></tr></thead>
              <tbody>
                {detailRows.map((r) => (
                  <tr key={r.id} className="border-b dark:border-gray-800">
                    <td className="py-2">{r.subject_name}</td>
                    <td className="py-2 text-right">
                      {editRow?.id === r.id ? (
                        <span className="inline-flex gap-1 items-center">
                          <input type="number" className="input-field w-16 py-1" value={editRow.marks_obtained} onChange={(e) => setEditRow({ ...editRow, marks_obtained: e.target.value })} />
                          / {r.max_marks}
                        </span>
                      ) : (
                        `${r.marks_obtained} / ${r.max_marks}`
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {editRow?.id === r.id ? (
                        <button type="button" className="text-xs text-primary" onClick={saveEdit}>Save</button>
                      ) : (
                        <button type="button" onClick={() => setEditRow(r)} className="text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm border-t pt-3">
              Overall: <strong>{viewStudent.total_obtained}/{viewStudent.total_max}</strong> · Grade <strong>{viewStudent.grade}</strong>
              {viewStudent.position && <> · <strong>{viewStudent.position}</strong> position</>}
            </p>
            <button type="button" className="btn-secondary w-full mt-4 text-sm" onClick={() => downloadWithAuth(`/admin/results/export/pdf?studentId=${viewStudent.student_id}&examId=${examId}`, `result-${viewStudent.student_id}.pdf`)}>
              Print mark sheet (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
