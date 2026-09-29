import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, Download, X, Printer, Users } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const emptyForm = {
  student_id: '', roll_number: '', full_name: '', father_name: '', gender: 'Male',
  date_of_birth: '', class_id: '', section: 'A', address: '', phone: '',
  admission_date: '', fee_status: 'pending',
};

const RECORD_TABS = [
  { key: 'active', label: 'Active' },
  { key: 'all', label: 'All Records' },
  { key: 'slc', label: 'Left (SLC)' },
  { key: 'inactive', label: 'Inactive' },
];

const SLC_REMARKS = {
  character: ['Character Satisfactory', 'Character Good', 'Character Excellent'],
  attendance: ['Attendance Regular', 'Attendance Satisfactory', 'Irregular — see office'],
  fee: ['Fee Status Cleared', 'Dues Pending', 'Partial Payment Received'],
};

const emptySlc = { reason: 'Leaving school after completion / transfer', character: '', attendance: '', fee: '', extra: '' };

function shortName(name, max = 28) {
  if (!name) return '-';
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [recordFilter, setRecordFilter] = useState('active');
  const [slcStudent, setSlcStudent] = useState(null);
  const [slcForm, setSlcForm] = useState(emptySlc);
  const [showDataPrint, setShowDataPrint] = useState(false);
  const [dataPrintOpts, setDataPrintOpts] = useState({ includeContact: true, includeFee: true });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const byClass = !classFilter && !search && recordFilter === 'active' ? '1' : '0';
      const res = await api.get('/admin/students', {
        params: { page, limit: 50, search, classId: classFilter, record: recordFilter, byClass },
      });
      setStudents(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/admin/classes').then((r) => setClasses(r.data.data));
    api.get('/admin/results/exams').then((r) => setExams(r.data.data));
  }, []);

  useEffect(() => { fetchStudents(); }, [page, search, classFilter, recordFilter]);

  useEffect(() => {
    if (classFilter && exams.length) {
      const match = exams.find((e) => String(e.class_id) === String(classFilter));
      if (match) setExamId(String(match.id));
    }
  }, [classFilter, exams]);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm, student_id: `GR-${Date.now().toString().slice(-4)}` });
    setPhoto(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({
      student_id: s.student_id, roll_number: s.roll_number, full_name: s.full_name,
      father_name: s.father_name, gender: s.gender, date_of_birth: s.date_of_birth?.split('T')[0],
      class_id: s.class_id, section: s.section, address: s.address || '', phone: s.phone || '',
      admission_date: s.admission_date?.split('T')[0], fee_status: s.fee_status,
    });
    setPhoto(null);
    setPhotoPreview(s.photo || null);
    setShowModal(true);
  };

  const uploadStudentPhoto = async (studentId, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      await api.put(`/admin/students/${studentId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Photo updated');
      fetchStudents();
    } catch {
      toast.error('Photo upload failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);
      if (editId) {
        await api.put(`/admin/students/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Student updated');
      } else {
        await api.post('/admin/students', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Student added');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove "${name}" from active records?`)) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Student removed');
      fetchStudents();
    } catch {
      toast.error('Delete failed');
    }
  };

  const printMarkSheets = async () => {
    if (!examId) return toast.error('Select examination first');
    if (!classFilter) return toast.error('Select a class first');
    const { downloadWithAuth } = await import('../../utils/download');
    const params = new URLSearchParams({ examId, classId: classFilter });
    try {
      await downloadWithAuth(`/admin/results/export/bulk-pdf?${params}`, `marksheets-class.pdf`);
      toast.success('Class mark sheets downloading…');
    } catch {
      toast.error('Print failed — check exam & students');
    }
  };

  const printStudentData = async () => {
    const { downloadWithAuth } = await import('../../utils/download');
    const params = new URLSearchParams({
      includeContact: dataPrintOpts.includeContact ? '1' : '0',
      includeFee: dataPrintOpts.includeFee ? '1' : '0',
      record: recordFilter,
    });
    if (classFilter) params.set('classId', classFilter);
    if (search) params.set('search', search);
    await downloadWithAuth(`/admin/students/export/data-pdf?${params}`, 'student-data.pdf');
    setShowDataPrint(false);
    toast.success('Student data PDF downloading…');
  };

  const exportExcel = async () => {
    const { downloadWithAuth } = await import('../../utils/download');
    await downloadWithAuth('/admin/students/export/excel', 'students.xlsx');
  };

  const promoteClass = async () => {
    if (!classFilter) return toast.error('Select a class first');
    const onlyPassed = confirm('Promote only PASSED students?\n\nOK = Passed only\nCancel = All students');
    try {
      const res = await api.post('/admin/students/promote-class', { classId: classFilter, onlyPassed });
      toast.success(res.data.message);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Promotion failed');
    }
  };

  const openSlcModal = (student) => {
    setSlcStudent(student);
    setSlcForm({ ...emptySlc });
  };

  const submitLeavingCertificate = async (e) => {
    e.preventDefault();
    if (!slcStudent) return;
    const params = new URLSearchParams({ reason: slcForm.reason });
    if (slcForm.character) params.set('character', slcForm.character);
    if (slcForm.attendance) params.set('attendance', slcForm.attendance);
    if (slcForm.fee) params.set('fee', slcForm.fee);
    if (slcForm.extra) params.set('extra', slcForm.extra);
    const { downloadWithAuth } = await import('../../utils/download');
    await downloadWithAuth(`/admin/students/${slcStudent.id}/leaving-certificate?${params}`, `slc-${slcStudent.student_id}.pdf`);
    setSlcStudent(null);
    fetchStudents();
    toast.success('Leaving Certificate generated — student moved to records');
  };

  const printSingleMarksheet = async (studentId) => {
    if (!examId) return toast.error('Select examination first');
    const { downloadWithAuth } = await import('../../utils/download');
    await downloadWithAuth(`/admin/results/export/pdf?studentId=${studentId}&examId=${examId}`, `result-${studentId}.pdf`);
  };

  const activeTotal = pagination.total || 0;
  const selectedClass = classes.find((c) => String(c.id) === String(classFilter));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="page-title">Student Records</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {activeTotal} in this view
            {pagination.currentClass && ` · Class ${pagination.currentClass.name} (${pagination.currentClass.section})`}
            {selectedClass && !pagination.byClass && ` · ${selectedClass.name} (${selectedClass.student_count || 0})`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Print & tools bar */}
      <div className="card p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Print & Export</p>
        <div className="flex flex-wrap gap-2 items-center">
          <select className="input-field sm:w-56 text-sm" value={examId} onChange={(e) => setExamId(e.target.value)}>
            <option value="">Select Examination</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name} ({classes.find((c) => c.id === e.class_id)?.name || 'Class'})</option>)}
          </select>
          <button type="button" disabled={!examId || !classFilter} onClick={() => printMarkSheets()} className="btn-secondary text-sm inline-flex items-center gap-1">
            <Printer className="w-4 h-4" /> Print class mark sheets
          </button>
          <button type="button" onClick={() => setShowDataPrint(true)} className="btn-secondary text-sm inline-flex items-center gap-1">
            <Printer className="w-4 h-4" /> Print student data
          </button>
          <button onClick={exportExcel} className="btn-secondary text-sm inline-flex items-center gap-1">
            <Download className="w-4 h-4" /> Excel
          </button>
          {classFilter && (
            <button onClick={promoteClass} className="btn-secondary text-sm">Promote Class</button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {RECORD_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setRecordFilter(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${recordFilter === t.key ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pl-10" placeholder="Search name, G.R No., roll…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input-field sm:w-48" value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} - {c.section} ({c.student_count || 0})</option>
            ))}
          </select>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/80">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-3 px-3 w-12">Photo</th>
                    <th className="py-3 px-3">G.R No.</th>
                    <th className="py-3 px-3">Roll</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3 hidden lg:table-cell">Father Name</th>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3">Fee</th>
                    {recordFilter !== 'active' && <th className="py-3 px-3">Status</th>}
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                      <td className="py-2 px-3">
                        <label className="cursor-pointer block w-9 h-9 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 border dark:border-gray-700" title="Upload photo">
                          {s.photo ? (
                            <img src={s.photo} alt="" loading="lazy" decoding="async" width={36} height={36} className="w-full h-full object-cover" />
                          ) : (
                            <span className="flex items-center justify-center h-full text-[9px] text-gray-400">+</span>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadStudentPhoto(s.id, e.target.files[0])} />
                        </label>
                      </td>
                      <td className="py-2 px-3 font-mono text-xs font-semibold text-primary">{s.student_id}</td>
                      <td className="py-2 px-3">{s.roll_number}</td>
                      <td className="py-2 px-3 font-medium max-w-[180px]" title={s.full_name}>{recordFilter === 'all' ? s.full_name : shortName(s.full_name, 32)}</td>
                      <td className="py-2 px-3 hidden lg:table-cell text-gray-500" title={s.father_name}>{shortName(s.father_name, 24)}</td>
                      <td className="py-2 px-3">{s.class_name?.split(' - ')[0]}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.fee_status === 'paid' ? 'bg-green-100 text-green-700' : s.fee_status === 'unpaid' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{s.fee_status}</span>
                      </td>
                      {recordFilter !== 'active' && (
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : s.has_slc ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'}`}>
                            {s.is_active ? 'Active' : s.has_slc ? 'SLC Issued' : 'Inactive'}
                          </span>
                        </td>
                      )}
                      <td className="py-2 px-3">
                        <div className="flex gap-0.5">
                          <button onClick={() => printSingleMarksheet(s.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Mark Sheet"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(s)} className="p-1.5 text-primary hover:bg-primary/10 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                          {s.is_active && (
                            <button onClick={() => openSlcModal(s)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded text-xs font-bold" title="SLC">SLC</button>
                          )}
                          <button onClick={() => handleDelete(s.id, s.full_name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Remove"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!students.length && (
                    <tr><td colSpan={recordFilter !== 'active' ? 9 : 8} className="py-10 text-center text-gray-500">No students found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-4 space-y-2">
                {pagination.byClass && (
                  <p className="text-center text-sm text-gray-500">
                    One class per page: 1st → 10th, then Nursery, KG1, KG2
                  </p>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded text-sm min-w-[2.25rem] ${p === page ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      {pagination.byClass ? p : p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {slcStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Leaving Certificate</h2>
              <button onClick={() => setSlcStudent(null)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{slcStudent.full_name} · G.R {slcStudent.student_id} · Roll {slcStudent.roll_number}</p>
            <form onSubmit={submitLeavingCertificate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reason for leaving</label>
                <input className="input-field" value={slcForm.reason} onChange={(e) => setSlcForm({ ...slcForm, reason: e.target.value })} required />
              </div>
              {[
                { key: 'character', label: 'Character (optional)' },
                { key: 'attendance', label: 'Attendance (optional)' },
                { key: 'fee', label: 'Fee status (optional)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <select className="input-field" value={slcForm[key]} onChange={(e) => setSlcForm({ ...slcForm, [key]: e.target.value })}>
                    <option value="">— Skip —</option>
                    {SLC_REMARKS[key].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1">Extra remarks (optional)</label>
                <textarea className="input-field" rows={2} value={slcForm.extra} onChange={(e) => setSlcForm({ ...slcForm, extra: e.target.value })} />
              </div>
              <p className="text-xs text-gray-500">Principal signature area stays blank on PDF for physical sign.</p>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Generate SLC PDF</button>
                <button type="button" onClick={() => setSlcStudent(null)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editId ? 'Edit Student' : 'Add Student'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
              {[
                { name: 'student_id', label: 'G.R Number (Unique ID)', required: true },
                { name: 'roll_number', label: 'Roll Number', type: 'number', required: true },
                { name: 'full_name', label: 'Student Name', required: true },
                { name: 'father_name', label: 'Father Name', required: true },
                { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
                { name: 'phone', label: 'Phone' },
                { name: 'admission_date', label: 'Admission Date', type: 'date', required: true },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium mb-1">{f.label}</label>
                  <input type={f.type || 'text'} required={f.required} className="input-field" value={form[f.name]}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option>Male</option><option>Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select required className="input-field" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                  <option value="">Select Class</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Section</label>
                <input className="input-field" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fee Status</label>
                <select className="input-field" value={form.fee_status} onChange={(e) => setForm({ ...form, fee_status: e.target.value })}>
                  <option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="pending">Pending</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Photo (from PC)</label>
                <div className="flex items-center gap-4">
                  {(photoPreview || photo) && (
                    <img src={photo ? URL.createObjectURL(photo) : photoPreview} alt="" loading="lazy" className="w-16 h-20 object-cover rounded border" />
                  )}
                  <input type="file" accept="image/*" className="input-field flex-1" onChange={(e) => {
                    const f = e.target.files[0];
                    setPhoto(f);
                    if (f) setPhotoPreview(URL.createObjectURL(f));
                  }} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea className="input-field" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : editId ? 'Update' : 'Add Student'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDataPrint && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold">Print student data (PDF)</h2>
              <button type="button" onClick={() => setShowDataPrint(false)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Uses current class filter and search. This is not a mark sheet — only student records.</p>
            <label className="flex items-center gap-2 text-sm mb-2">
              <input type="checkbox" checked={dataPrintOpts.includeContact} onChange={(e) => setDataPrintOpts({ ...dataPrintOpts, includeContact: e.target.checked })} />
              Include phone & address
            </label>
            <label className="flex items-center gap-2 text-sm mb-6">
              <input type="checkbox" checked={dataPrintOpts.includeFee} onChange={(e) => setDataPrintOpts({ ...dataPrintOpts, includeFee: e.target.checked })} />
              Include fee status
            </label>
            <button type="button" onClick={printStudentData} className="btn-primary w-full">Download PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}
