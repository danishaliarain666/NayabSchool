import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '', type: 'general', is_published: 1, publish_date: new Date().toISOString().split('T')[0], expiry_date: '' });
  const [editId, setEditId] = useState(null);

  const fetch = () => api.get('/admin/announcements').then((r) => setItems(r.data.data)).finally(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/admin/announcements/${editId}`, form);
        toast.success('Updated');
      } else {
        await api.post('/admin/announcements', form);
        toast.success('Announcement added');
      }
      setForm({ title: '', content: '', type: 'general', is_published: 1, publish_date: new Date().toISOString().split('T')[0], expiry_date: '' });
      setEditId(null);
      fetch();
    } catch {
      toast.error('Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    await api.delete(`/admin/announcements/${id}`);
    toast.success('Deleted');
    fetch();
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Announcements</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-sm mb-1">Title</label><input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="block text-sm mb-1">Type</label>
            <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="general">General</option><option value="urgent">Urgent</option><option value="event">Event</option><option value="holiday">Holiday</option>
            </select>
          </div>
        </div>
        <div><label className="block text-sm mb-1">Content</label><textarea required rows={3} className="input-field" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
        <button type="submit" className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" /> {editId ? 'Update' : 'Add'} Announcement</button>
      </form>

      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="card flex justify-between items-start">
            <div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{a.type}</span>
              <h3 className="font-semibold mt-1">{a.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{a.content}</p>
              <p className="text-xs text-gray-400 mt-1">{a.publish_date}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditId(a.id); setForm({ title: a.title, content: a.content, type: a.type, is_published: a.is_published, publish_date: a.publish_date?.split('T')[0], expiry_date: a.expiry_date?.split('T')[0] || '' }); }} className="p-2 text-primary"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(a.id)} className="p-2 text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
