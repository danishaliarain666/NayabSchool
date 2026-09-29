import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/dashboard').then((r) => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Teacher Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.classes?.map((c) => (
          <div key={c.id} className="card">
            <h3 className="font-bold text-primary">{c.name} - {c.section}</h3>
            <p className="text-sm text-gray-500 mt-1">{c.student_count} students</p>
            <div className="flex gap-2 mt-3">
              <Link to={`/teacher/attendance?class=${c.id}`} className="btn-primary text-xs py-1.5 px-3">Attendance</Link>
              <Link to={`/teacher/students?class=${c.id}`} className="btn-secondary text-xs py-1.5 px-3">Students</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
