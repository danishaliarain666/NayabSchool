import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, X, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { downloadWithAuth } from '../../utils/download';

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [report, setReport] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [status, setStatus] = useState('');
  const [classId, setClassId] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [printScope, setPrintScope] = useState('class');
  const [printStatus, setPrintStatus] = useState('');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ student_id: '', fee_type: 'Monthly Fee', amount: '', paid_amount: 0, status: 'pending', due_date: '', paid_date: '', academic_year: '2025-2026' });

  const fetch = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (status) params.status = status;
      if (classId) params.classId = classId;
      else params.byClass = '1';
      const [f, r, s, c] = await Promise.all([
        api.get('/admin/fees', { params }),
        api.get('/admin/fees/report'),
        api.get('/admin/students', { params: { limit: 100 } }),
        api.get('/admin/classes'),
      ]);
      setFees(f.data.data);
      setPagination(f.data.pagination || {});
      setReport(r.data.data);
      setStudents(s.data.data);
      setClasses(c.data.data);
    } catch {
      toast.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [status, classId, page]);

  const openEdit = (f) => {
    setEditId(f.id);
    setForm({ student_id: f.student_id, fee_type: f.fee_type, amount: f.amount, paid_amount: f.paid_amount, status: f.status, due_date: f.due_date?.split('T')[0], paid_date: f.paid_date?.split('T')[0] || '', academic_year: f.academic_year });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ student_id: '', fee_type: 'Monthly Fee', amount: '', paid_amount: 0, status: 'pending', due_date: new Date().toISOString().split('T')[0], paid_date: '', academic_year: '2025-2026' });
    setShowModal(true);
  };

  const quickStatus = async (id, st) => {
    try {
      await api.patch(`/admin/fees/${id}/status`, { status: st });
      toast.success('Status updated');
      fetch();
    } catch {
      toast.error('Could not update status');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/admin/fees/${editId}`, form);
        toast.success('Fee updated');
      } else {
        await api.post('/admin/fees', form);
        toast.success('Fee record added');
      }
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const printFees = async () => {
    const params = new URLSearchParams({ scope: printScope });
    if (printStatus) params.set('status', printStatus);
    if (printScope === 'class') {
      const cid = classId || pagination.currentClass?.id;
      if (!cid) return toast.error('Select a class or go to a class page');
      params.set('classId', cid);
    }
    await downloadWithAuth(`/admin/fees/export/pdf?${params}`, 'fee-report.pdf');
    setShowPrint(false);
    toast.success('Fee report PDF downloading…');
  };

  const classLabel = classId
    ? classes.find((c) => String(c.id) === String(classId))
    : pagination.currentClass;

  if (loading && !fees.length) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="text-sm text-gray-500">
            One class per page {classLabel && `· ${classLabel.name} (${classLabel.section})`}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowPrint(true)} className="btn-secondary text-sm inline-flex items-center gap-1"><Printer className="w-4 h-4" /> Print report</button>
          <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Fee</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {report.map((r) => (
          <div key={r.status} className="card text-center">
            <p className="text-sm text-gray-500 capitalize">{r.status}</p>
            <p className="text-2xl font-bold">{r.count}</p>
            <p className="text-xs text-gray-400">Total: Rs. {r.total} | Paid: Rs. {r.paid || 0}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <select className="input-field max-w-xs" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="pending">Pending</option>
        </select>
        <select className="input-field max-w-xs" value={classId} onChange={(e) => { setClassId(e.target.value); setPage(1); }}>
          <option value="">Browse classes (pages)</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-gray-50 dark:bg-gray-800/50"><th className="py-2 px-3 text-left">Student</th><th className="py-2 px-3 text-left">Type</th><th className="py-2 px-3 text-right">Amount</th><th className="py-2 px-3 text-right">Paid</th><th className="py-2 px-3">Status</th><th className="py-2 px-3">Due</th><th className="py-2 px-3">Action</th></tr></thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f.id} className="border-b dark:border-gray-800">
                <td className="py-2 px-3">{f.full_name}</td><td className="py-2 px-3">{f.fee_type}</td>
                <td className="py-2 px-3 text-right">Rs. {f.amount}</td><td className="py-2 px-3 text-right">Rs. {f.paid_amount}</td>
                <td className="py-2 px-3">
                  <select className="input-field py-1 text-xs max-w-[7rem]" value={f.status} onChange={(e) => quickStatus(f.id, e.target.value)}>
                    <option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="pending">Pending</option>
                  </select>
                </td>
                <td className="py-2 px-3">{f.due_date?.split('T')[0]}</td>
                <td className="py-2 px-3"><button type="button" onClick={() => openEdit(f)} className="text-primary"><Pencil className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {!fees.length && <tr><td colSpan={7} className="py-8 text-center text-gray-500">No fee records for this view</td></tr>}
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

      {showPrint && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4"><h2 className="font-bold">Print fee report</h2><button type="button" onClick={() => setShowPrint(false)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Students</label>
                <select className="input-field" value={printScope} onChange={(e) => setPrintScope(e.target.value)}>
                  <option value="class">Current class only</option>
                  <option value="all">All classes (whole school)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Fee status filter</label>
                <select className="input-field" value={printStatus} onChange={(e) => setPrintStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="paid">Paid only</option>
                  <option value="unpaid">Unpaid only</option>
                  <option value="pending">Pending only</option>
                </select>
              </div>
              <button type="button" onClick={printFees} className="btn-primary w-full">Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4"><h2 className="font-bold">{editId ? 'Edit Fee' : 'Add Fee'}</h2><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSave} className="space-y-4">
              {!editId && (
                <div><label className="block text-sm mb-1">Student</label><select required className="input-field" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}><option value="">Select</option>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.student_id})</option>)}</select></div>
              )}
              <div><label className="block text-sm mb-1">Fee Type</label><input className="input-field" value={form.fee_type} onChange={(e) => setForm({ ...form, fee_type: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1">Amount</label><input type="number" required className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div><label className="block text-sm mb-1">Paid Amount</label><input type="number" className="input-field" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm mb-1">Status</label><select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="pending">Pending</option></select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1">Due Date</label><input type="date" required className="input-field" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <div><label className="block text-sm mb-1">Paid Date</label><input type="date" className="input-field" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} /></div>
              </div>
              <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">Save</button><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
