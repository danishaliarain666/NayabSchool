import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TeacherAttendance() {
  const [params] = useSearchParams();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(params.get('class') || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [absentIds, setAbsentIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/teacher/classes').then((r) => setClasses(r.data.data));
  }, []);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    api.get(`/teacher/attendance/${classId}`, { params: { date } })
      .then((r) => {
        setStudents(r.data.data.students);
        setAbsentIds(r.data.data.students.filter((s) => s.status === 'absent').map((s) => s.id));
      })
      .finally(() => setLoading(false));
  }, [classId, date]);

  const toggleAbsent = (id) => {
    setAbsentIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!classId) return toast.error('Select a class');
    setSaving(true);
    try {
      const res = await api.post('/teacher/attendance', { classId: parseInt(classId), date, absentStudentIds: absentIds });
      toast.success(`Saved: ${res.data.data.present} present, ${res.data.data.absent} absent`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Mark Attendance</h1>
      <p className="text-sm text-gray-500">Absent-only system: check absent students only. All others are marked present automatically.</p>

      <div className="card flex flex-col sm:flex-row gap-4">
        <select className="input-field flex-1" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
        </select>
        <input type="date" className="input-field sm:w-48" value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={handleSave} disabled={saving || !classId} className="btn-primary">{saving ? 'Saving...' : 'Save Attendance'}</button>
      </div>

      {loading ? <LoadingSpinner /> : students.length > 0 && (
        <div className="card">
          <div className="flex justify-between mb-4">
            <p className="font-medium">{students.length} students — {absentIds.length} absent</p>
            <button onClick={() => setAbsentIds([])} className="text-sm text-primary">Mark All Present</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {students.map((s) => (
              <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${absentIds.includes(s.id) ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <input type="checkbox" checked={absentIds.includes(s.id)} onChange={() => toggleAbsent(s.id)} className="w-4 h-4" />
                <div>
                  <p className="font-medium text-sm">{s.full_name}</p>
                  <p className="text-xs text-gray-500">Roll: {s.roll_number}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
