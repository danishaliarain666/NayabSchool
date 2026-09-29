import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const REMARK_OPTIONS = ['Work Hard', 'Satisfactory', 'Excellent', 'Super Excellent'];

export default function TeacherMarks() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ student_id: '', subject_id: '', exam_id: '', marks_obtained: '', max_marks: 100 });
  const [remarkForm, setRemarkForm] = useState({ student_id: '', subject_id: '', remark: 'Satisfactory' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/teacher/classes').then((r) => setClasses(r.data.data));
  }, []);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    Promise.all([
      api.get(`/teacher/students/${classId}`),
      api.get('/teacher/results/subjects', { params: { classId } }),
      api.get('/teacher/results/exams'),
    ]).then(([s, sub, ex]) => {
      setStudents(s.data.data);
      setSubjects(sub.data.data);
      setExams(ex.data.data.filter((e) => e.class_id == classId));
    }).finally(() => setLoading(false));
  }, [classId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teacher/results', form);
      toast.success('Marks saved');
      setForm({ ...form, marks_obtained: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const saveRemark = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teacher/weekly-remarks', remarkForm);
      toast.success('Weekly remark saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Marks & Weekly Remarks</h1>

      <select className="input-field max-w-xs" value={classId} onChange={(e) => setClassId(e.target.value)}>
        <option value="">Select Class</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
      </select>

      {loading ? <LoadingSpinner /> : classId && (
        <>
          <form onSubmit={handleSubmit} className="card grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-sm mb-1">Student</label>
              <select required className="input-field" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>
                <option value="">Select</option>{students.map((s) => <option key={s.id} value={s.id}>{s.roll_number} - {s.full_name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm mb-1">Subject</label>
              <select required className="input-field" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                <option value="">Select</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm mb-1">Exam</label>
              <select required className="input-field" value={form.exam_id} onChange={(e) => setForm({ ...form, exam_id: e.target.value })}>
                <option value="">Select</option>{exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm mb-1">Marks Obtained</label>
              <input type="number" required min="0" max="100" className="input-field" value={form.marks_obtained} onChange={(e) => setForm({ ...form, marks_obtained: e.target.value })} />
            </div>
            <div><label className="block text-sm mb-1">Max Marks</label>
              <input type="number" className="input-field" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: e.target.value })} />
            </div>
            <div className="flex items-end"><button type="submit" className="btn-primary w-full">Save Marks</button></div>
          </form>

          <form onSubmit={saveRemark} className="card border-l-4 border-l-gold">
            <h2 className="font-bold text-lg mb-3">Weekly Remarks (Subject-wise)</h2>
            <p className="text-sm text-gray-500 mb-4">Class Teacher: choose remark for marksheet — Work Hard, Satisfactory, Excellent, Super Excellent</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label className="block text-sm mb-1">Student</label>
                <select required className="input-field" value={remarkForm.student_id} onChange={(e) => setRemarkForm({ ...remarkForm, student_id: e.target.value })}>
                  <option value="">Select</option>{students.map((s) => <option key={s.id} value={s.id}>{s.roll_number} - {s.full_name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm mb-1">Subject</label>
                <select required className="input-field" value={remarkForm.subject_id} onChange={(e) => setRemarkForm({ ...remarkForm, subject_id: e.target.value })}>
                  <option value="">Select</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm mb-1">Remark</label>
                <select required className="input-field" value={remarkForm.remark} onChange={(e) => setRemarkForm({ ...remarkForm, remark: e.target.value })}>
                  {REMARK_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex items-end"><button type="submit" className="btn-primary w-full">Save Remark</button></div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
