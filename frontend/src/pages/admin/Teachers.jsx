import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Users, Wallet, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const DESIGNATIONS = ['Teacher', 'Security Guard', 'Clerk', 'Massi', 'Principal', 'C.E.O'];

const emptyForm = {
  employee_id: '',
  full_name: '',
  father_name: '',
  gender: 'Male',
  phone: '',
  email: '',
  qualification: '',
  subject: '',
  designation: 'Teacher',
  joining_date: '',
  createLogin: false,
  loginEmail: '',
  loginPassword: '',
};

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(null);
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const fetch = async () => {
    try {
      const [t, s] = await Promise.all([api.get('/admin/teachers'), api.get('/admin/teachers/summary')]);
      setTeachers(t.data.data);
      setSummary(s.data.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetch();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };
  const openEdit = (t) => {
    setEditId(t.id);
    setForm({
      employee_id: t.employee_id,
      full_name: t.full_name,
      father_name: t.father_name || '',
      gender: t.gender,
      phone: t.phone || t.login_phone || '',
      email: t.email || '',
      qualification: t.qualification || '',
      subject: t.subject || '',
      designation: t.designation || 'Teacher',
      joining_date: t.joining_date?.split('T')[0] || '',
      createLogin: false,
      loginEmail: '',
      loginPassword: '',
    });
    setShowModal(true);
  };

  const openLoginEdit = (t) => {
    setShowLoginModal(t);
    setLoginForm({ phone: t.login_phone || t.phone || '', password: '' });
  };

  const saveLogin = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/teachers/${showLoginModal.id}/login`, loginForm);
      toast.success('Phone / password saved');
      setShowLoginModal(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const toggleSalaryPaid = async (t) => {
    const next = t.salary_paid === 'paid' ? 'unpaid' : 'paid';
    try {
      await api.patch(`/admin/teachers/${t.id}/payroll`, { salary_paid: next });
      toast.success(next === 'paid' ? 'Marked as paid' : 'Marked as unpaid');
      fetch();
    } catch {
      toast.error('Could not update salary status');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, createLogin: form.createLogin ? 'true' : 'false' };
      if (editId) {
        await api.put(`/admin/teachers/${editId}`, payload);
        toast.success('Teacher updated');
      } else {
        await api.post('/admin/teachers', payload);
        toast.success('Teacher added');
      }
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove teacher "${name}" from active list?`)) return;
    try {
      await api.delete(`/admin/teachers/${id}`);
      toast.success('Removed');
      fetch();
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const totalSalary = Number(summary?.total_salary || 0);
  const fmt = (n) => n.toLocaleString('en-PK');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="page-title">Staff & Payroll</h1>
          <p className="text-sm text-gray-500 mt-1">Teachers, clerks, guards — salary, payroll, and login · mark attendance under Attendance → Staff</p>
        </div>
        <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Staff</p>
            <p className="text-2xl font-bold">{summary?.total_teachers ?? teachers.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-green-700" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Monthly Salary</p>
            <p className="text-2xl font-bold">Rs. {fmt(totalSalary)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Salary Paid / Unpaid</p>
            <p className="text-lg font-bold">
              <span className="text-green-600">{summary?.salary_paid_count ?? 0} paid</span>
              <span className="text-gray-400 mx-2">·</span>
              <span className="text-red-600">{summary?.salary_unpaid_count ?? 0} unpaid</span>
            </p>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
              <th className="py-3 px-2 text-left">Name</th>
              <th className="py-3 px-2 text-left">Designation</th>
              <th className="py-3 px-2 text-left">Phone (login)</th>
              <th className="py-3 px-2 text-right">Salary</th>
              <th className="py-3 px-2 text-center">Paid?</th>
              <th className="py-3 px-2 text-center">Classes</th>
              <th className="py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id} className="border-b dark:border-gray-800 hover:bg-gray-50/50">
                <td className="py-3 px-2">
                  <p className="font-medium">{t.full_name}</p>
                  <p className="text-xs text-gray-400">{t.employee_id}</p>
                </td>
                <td className="py-3 px-2">{t.designation || t.subject || '—'}</td>
                <td className="py-3 px-2">{t.login_phone || t.phone || '—'}</td>
                <td className="py-3 px-2 text-right">Rs. {fmt(Number(t.monthly_salary || 30000))}</td>
                <td className="py-3 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => toggleSalaryPaid(t)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      t.salary_paid === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {t.salary_paid === 'paid' ? 'Paid' : 'Unpaid'}
                  </button>
                </td>
                <td className="py-3 px-2 text-center text-xs">{t.classes_assigned || 0} class(es)</td>
                <td className="py-3 px-2">
                  <div className="flex gap-1 justify-end flex-wrap">
                    <button type="button" onClick={() => openLoginEdit(t)} className="text-xs px-2 py-1 rounded bg-navy/5 text-navy dark:text-gold">
                      Login
                    </button>
                    <button onClick={() => openEdit(t)} className="p-1.5 text-primary hover:bg-primary/10 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t.id, t.full_name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold">Login for {showLoginModal.full_name}</h2>
              <button type="button" onClick={() => setShowLoginModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveLogin} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Mobile number</label>
                <input required className="input-field" value={loginForm.phone} onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })} placeholder="03XXXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm mb-1">New password (leave blank to keep)</label>
                <input type="password" className="input-field" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="Optional" />
              </div>
              <p className="text-xs text-gray-500">Teachers sign in with this number and password on the staff login page.</p>
              <button type="submit" className="btn-primary w-full">
                Save
              </button>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">{editId ? 'Edit Teacher' : 'Add Teacher'}</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">Designation</label>
                <input list="staff-designations" className="input-field" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Teacher, Clerk, Security Guard…" />
                <datalist id="staff-designations">
                  {DESIGNATIONS.map((d) => <option key={d} value={d} />)}
                </datalist>
              </div>
              {[
                { k: 'employee_id', l: 'Employee ID' },
                { k: 'full_name', l: 'Full Name' },
                { k: 'father_name', l: 'Father Name' },
                { k: 'phone', l: 'Phone' },
                { k: 'email', l: 'Email' },
                { k: 'qualification', l: 'Qualification' },
                { k: 'subject', l: 'Subject / Role' },
              ].map(({ k, l }) => (
                <div key={k}>
                  <label className="block text-sm mb-1">{l}</label>
                  <input required={['employee_id', 'full_name'].includes(k)} className="input-field" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="block text-sm mb-1">Gender</label>
                <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Joining Date</label>
                <input type="date" className="input-field" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
              </div>
              {!editId && (
                <>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={form.createLogin} onChange={(e) => setForm({ ...form, createLogin: e.target.checked })} /> Create portal login
                    </label>
                  </div>
                  {form.createLogin && (
                    <>
                      <div>
                        <label className="block text-sm mb-1">Login Email</label>
                        <input type="email" className="input-field" value={form.loginEmail} onChange={(e) => setForm({ ...form, loginEmail: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Login Password</label>
                        <input type="password" className="input-field" value={form.loginPassword} onChange={(e) => setForm({ ...form, loginPassword: e.target.value })} />
                      </div>
                    </>
                  )}
                </>
              )}
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" className="btn-primary flex-1">
                  {editId ? 'Update' : 'Add'} Teacher
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
