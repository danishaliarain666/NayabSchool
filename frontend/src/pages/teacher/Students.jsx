import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TeacherStudents() {
  const [params] = useSearchParams();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(params.get('class') || '');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/teacher/classes').then((r) => setClasses(r.data.data));
  }, []);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    api.get(`/teacher/students/${classId}`).then((r) => setStudents(r.data.data)).finally(() => setLoading(false));
  }, [classId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Class Students</h1>

      <select className="input-field max-w-xs" value={classId} onChange={(e) => setClassId(e.target.value)}>
        <option value="">Select Class</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
      </select>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="py-3 text-left">Roll</th><th className="py-3 text-left">ID</th><th className="py-3 text-left">Name</th><th className="py-3 text-left">Father</th><th className="py-3 text-left">Gender</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b dark:border-gray-800">
                  <td className="py-2">{s.roll_number}</td><td className="py-2 font-mono text-xs">{s.student_id}</td>
                  <td className="py-2 font-medium">{s.full_name}</td><td className="py-2">{s.father_name}</td><td className="py-2">{s.gender}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
