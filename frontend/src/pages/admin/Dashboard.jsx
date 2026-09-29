import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, GraduationCap, BookOpen, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const COLORS = ['#0066CC', '#22c55e', '#ef4444', '#f59e0b'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;
  const { stats, feeChart, attendanceChart, classDistribution } = data || {};

  const statCards = [
    { icon: Users, label: 'Total Students', value: stats?.totalStudents, color: 'text-primary' },
    { icon: GraduationCap, label: 'Total Teachers', value: stats?.totalTeachers, color: 'text-green-600' },
    { icon: BookOpen, label: 'Total Classes', value: stats?.totalClasses, color: 'text-purple-600' },
    { icon: DollarSign, label: 'Pending Fees', value: stats?.feesPending, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">{label}</p><p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? 0}</p></div>
              <Icon className={`w-10 h-10 ${color} opacity-20`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold mb-4">Fee Summary</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={feeChart || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }) => `${status}: ${count}`}>
                {(feeChart || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-bold mb-4">Students per Class</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={(classDistribution || []).slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0066CC" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {attendanceChart?.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-4">Recent Absent Count (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={attendanceChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center"><p className="text-sm text-gray-500">Fees Paid</p><p className="text-2xl font-bold text-green-600">{stats?.feesPaid}</p></div>
        <div className="card text-center"><p className="text-sm text-gray-500">Fees Unpaid</p><p className="text-2xl font-bold text-red-600">{stats?.feesUnpaid}</p></div>
        <div className="card text-center"><p className="text-sm text-gray-500">Fees Pending</p><p className="text-2xl font-bold text-orange-600">{stats?.feesPending}</p></div>
      </div>
    </div>
  );
}
