import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Reports() {
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/attendance'), api.get('/admin/fees/report')])
      .then(([a, f]) => { setAttendance(a.data.data); setFees(f.data.data); })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Reports</h1>

      <div className="card">
        <h2 className="font-bold mb-4">Fee Report Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          {fees.map((f) => (
            <div key={f.status} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-sm capitalize text-gray-500">{f.status}</p>
              <p className="text-xl font-bold">{f.count} records</p>
              <p className="text-xs">Total: Rs. {f.total} | Paid: Rs. {f.paid || 0}</p>
              <p className="text-xs text-red-500">Outstanding: Rs. {f.outstanding || 0}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-bold mb-4">Attendance Report</h2>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th className="py-2 text-left">Date</th><th className="py-2 text-left">Class</th><th className="py-2 text-right">Total</th><th className="py-2 text-right">Absent</th><th className="py-2 text-right">Present</th></tr></thead>
          <tbody>
            {attendance.slice(0, 30).map((r, i) => (
              <tr key={i} className="border-b dark:border-gray-800">
                <td className="py-2">{r.date?.split('T')[0] || r.date}</td><td className="py-2">{r.class_name}</td>
                <td className="py-2 text-right">{r.total_students}</td>
                <td className="py-2 text-right text-red-600">{r.absent_count}</td>
                <td className="py-2 text-right text-green-600">{r.total_students - r.absent_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
