import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, BookOpen } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', section: 'A', academic_year: '2025-2026', class_teacher_id: '', capacity: 40 });
  const [subjectClassId, setSubjectClassId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [editSubject, setEditSubject] = useState(null);

  const fetch = async () => {
    const [c, t] = await Promise.all([api.get('/admin/classes'), api.get('/admin/teachers')]);
    setClasses(c.data.data);
    setTeachers(t.data.data);
    setLoading(false);
  };
  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    if (!subjectClassId) {
      setSubjects([]);
      return;
    }
    api.get('/admin/subjects', { params: { classId: subjectClassId } }).then((r) => setSubjects(r.data.data));
  }, [subjectClassId]);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '', section: 'A', academic_year: '2025-2026', class_teacher_id: '', capacity: 40 });
    setShowModal(true);
  };
  const openEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name, section: c.section, academic_year: c.academic_year, class_teacher_id: c.class_teacher_id || '', capacity: c.capacity });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/admin/classes/${editId}`, form);
        toast.success('Class updated');
      } else {
        await api.post('/admin/classes', form);
        toast.success('Class added');
      }
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete class "${name}"?`)) return;
    try {
      await api.delete(`/admin/classes/${id}`);
      toast.success('Class deleted');
      fetch();
    } catch {
      toast.error('Delete failed');
    }
  };

  const addSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !subjectClassId) return;
    try {
      await api.post('/admin/subjects', { name: newSubject.trim(), class_id: subjectClassId });
      setNewSubject('');
      const r = await api.get('/admin/subjects', { params: { classId: subjectClassId } });
      setSubjects(r.data.data);
      toast.success('Subject added');
    } catch {
      toast.error('Could not add subject');
    }
  };

  const saveSubjectRename = async () => {
    if (!editSubject?.name?.trim()) return;
    try {
      await api.put(`/admin/subjects/${editSubject.id}`, { name: editSubject.name, max_marks: editSubject.max_marks || 100 });
      setEditSubject(null);
      const r = await api.get('/admin/subjects', { params: { classId: subjectClassId } });
      setSubjects(r.data.data);
      toast.success('Subject updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const removeSubject = async (id) => {
    if (!confirm('Remove this subject?')) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      setSubjects((s) => s.filter((x) => x.id !== id));
      toast.success('Subject removed');
    } catch {
      toast.error('Remove failed');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Classes & Subjects</h1>
          <p className="text-sm text-gray-500">Manage sections and subject lists for each class</p>
        </div>
        <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {classes.map((c) => (
            <div key={c.id} className={`card cursor-pointer transition ring-2 ${subjectClassId === String(c.id) ? 'ring-gold' : 'ring-transparent hover:ring-gold/30'}`} onClick={() => setSubjectClassId(String(c.id))}>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-primary">
                  {c.name} - {c.section}
                </h3>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => openEdit(c)} className="p-1 text-primary">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(c.id, `${c.name} - ${c.section}`)} className="p-1 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Teacher: {c.class_teacher_name || 'Not assigned'}</p>
              <p className="text-sm text-gray-500">
                Students: {c.student_count} / {c.capacity}
              </p>
              <p className="text-xs text-gold mt-2 font-medium">Tap to edit subjects →</p>
            </div>
          ))}
        </div>

        <div className="card h-fit sticky top-4">
          <h3 className="font-bold flex items-center gap-2 text-navy dark:text-gold">
            <BookOpen className="w-5 h-5" /> Subjects
          </h3>
          {!subjectClassId ? (
            <p className="text-sm text-gray-500 mt-4">Select a class card to add or change subjects.</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mt-2 mb-4">{classes.find((c) => String(c.id) === subjectClassId)?.name} subjects</p>
              <form onSubmit={addSubject} className="flex gap-2 mb-4">
                <input className="input-field flex-1" placeholder="New subject name" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
                <button type="submit" className="btn-primary px-3">
                  Add
                </button>
              </form>
              <ul className="space-y-2">
                {subjects.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm border-b dark:border-gray-800 pb-2">
                    {editSubject?.id === s.id ? (
                      <>
                        <input className="input-field flex-1 py-1" value={editSubject.name} onChange={(e) => setEditSubject({ ...editSubject, name: e.target.value })} />
                        <button type="button" className="text-xs text-primary" onClick={saveSubjectRename}>
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <span>{s.name}</span>
                        <div className="flex gap-1">
                          <button type="button" className="p-1 text-primary" onClick={() => setEditSubject({ id: s.id, name: s.name, max_marks: s.max_marks })}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" className="p-1 text-red-600" onClick={() => removeSubject(s.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
                {!subjects.length && <li className="text-gray-400 text-sm">No subjects yet — add above.</li>}
              </ul>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold">{editId ? 'Edit Class' : 'Add Class'}</h2>
              <button type="button" onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Class Name</label>
                <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Section</label>
                <input className="input-field" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Academic Year</label>
                <input className="input-field" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Class Teacher</label>
                <select className="input-field" value={form.class_teacher_id} onChange={(e) => setForm({ ...form, class_teacher_id: e.target.value })}>
                  <option value="">None</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Capacity</label>
                <input type="number" className="input-field" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">
                  {editId ? 'Update' : 'Add'}
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
