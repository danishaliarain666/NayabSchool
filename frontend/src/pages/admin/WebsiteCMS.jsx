import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function WebsiteCMS() {
  const [content, setContent] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);
  const [tab, setTab] = useState('content');
  const [branding, setBranding] = useState({});
  const [galleryForm, setGalleryForm] = useState({ title: '', description: '', category: 'events', image_url: '', is_featured: false });

  const fetch = async () => {
    setLoading(true);
    try {
      const [c, g, s] = await Promise.all([api.get('/admin/website-content'), api.get('/admin/gallery'), api.get('/admin/school-settings')]);
      setContent(c.data.data);
      setGallery(g.data.data);
      setBranding(s.data.data || {});
    } finally {
      setLoading(false);
    }
  };

  const saveBranding = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/school-settings', branding);
      toast.success('School branding updated');
    } catch {
      toast.error('Failed to update branding');
    }
  };

  const uploadBrandingFile = async (file, type) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    try {
      const res = await api.post('/admin/school-settings/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBranding({ ...branding, [res.data.data.key]: res.data.data.url });
      toast.success('Image uploaded from PC');
    } catch {
      toast.error('Upload failed');
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/website-content', { page_key: edit.page_key, section_key: edit.section_key, title: edit.title, content: edit.content });
      toast.success('Content updated');
      setEdit(null);
      fetch();
    } catch {
      toast.error('Failed');
    }
  };

  const addGallery = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/gallery', galleryForm);
      toast.success('Gallery item added');
      setGalleryForm({ title: '', description: '', category: 'events', image_url: '', is_featured: false });
      fetch();
    } catch {
      toast.error('Failed');
    }
  };

  const deleteGallery = async (id) => {
    if (!confirm('Delete this image?')) return;
    await api.delete(`/admin/gallery/${id}`);
    toast.success('Deleted');
    fetch();
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Website CMS</h1>
      <div className="flex gap-2">
        <button onClick={() => setTab('content')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'content' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>Content</button>
        <button onClick={() => setTab('gallery')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'gallery' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>Gallery</button>
        <button onClick={() => setTab('branding')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'branding' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>Logo & Social</button>
      </div>

      {tab === 'branding' && (
        <form onSubmit={saveBranding} className="card space-y-4">
          <p className="text-sm text-gray-500">Update school logo, photos, and social media links. Source: {branding.data_source || 'Manual'}</p>
          {[
            { key: 'logo_url', label: 'School Logo URL (monogram)' },
            { key: 'school_photo_url', label: 'School Photo / Banner URL' },
            { key: 'instagram_url', label: 'Instagram URL' },
            { key: 'facebook_url', label: 'Facebook URL' },
            { key: 'whatsapp_url', label: 'WhatsApp Channel URL' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'tagline', label: 'Tagline' },
            { key: 'principal_name', label: 'Principal Name (marksheet / website)' },
            { key: 'exam_controller_name', label: 'Examination Incharge Name' },
            { key: 'principal_stamp_url', label: 'Principal Stamp Image URL (PNG/JPG for marksheet)' },
            { key: 'school_timing', label: 'School Timings (for AI chat)' },
            { key: 'fee_structure', label: 'Fee Structure (for AI chat)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm mb-1">{label}</label>
              <input className="input-field" value={branding[key] || ''} onChange={(e) => setBranding({ ...branding, [key]: e.target.value })} />
            </div>
          ))}
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t dark:border-gray-700">
            <div>
              <label className="block text-sm mb-1">Upload Logo from PC</label>
              <input type="file" accept="image/*" onChange={(e) => uploadBrandingFile(e.target.files[0], 'logo')} className="text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Upload Banner from PC</label>
              <input type="file" accept="image/*" onChange={(e) => uploadBrandingFile(e.target.files[0], 'banner')} className="text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm mb-1">Upload Principal Stamp (marksheet — auto print each time)</label>
              <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={(e) => uploadBrandingFile(e.target.files[0], 'stamp')} className="text-sm" />
              <p className="text-xs text-gray-500 mt-1">Leaving Certificate principal area stays blank for hand signature.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            {branding.logo_url && <img src={branding.logo_url} alt="Logo preview" className="w-24 h-24 rounded-lg object-cover border" />}
            {branding.principal_stamp_url && <img src={branding.principal_stamp_url} alt="Stamp preview" className="w-24 h-24 rounded-lg object-contain border" />}
          </div>
          <button type="submit" className="btn-primary">Save Branding</button>
        </form>
      )}

      {tab === 'content' && (
        <div className="space-y-4">
          {content.map((c) => (
            <div key={c.id} className="card flex justify-between items-start">
              <div>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{c.page_key} / {c.section_key}</span>
                <h3 className="font-semibold mt-1">{c.title}</h3>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-line line-clamp-3">{c.content}</p>
              </div>
              <button onClick={() => setEdit(c)} className="btn-secondary text-sm">Edit</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'gallery' && (
        <div className="space-y-6">
          <form onSubmit={addGallery} className="card grid sm:grid-cols-2 gap-4">
            <div><label className="block text-sm mb-1">Title</label><input required className="input-field" value={galleryForm.title} onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })} /></div>
            <div><label className="block text-sm mb-1">Category</label><select className="input-field" value={galleryForm.category} onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}><option value="events">Events</option><option value="class_activities">Class Activities</option><option value="sports">Sports</option><option value="annual_function">Annual Function</option></select></div>
            <div className="sm:col-span-2"><label className="block text-sm mb-1">Image URL (link)</label><input className="input-field" placeholder="https://..." value={galleryForm.image_url} onChange={(e) => setGalleryForm({ ...galleryForm, image_url: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="block text-sm mb-1">Or upload from PC</label><input type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files[0]; if (!file) return;
              const fd = new FormData(); fd.append('image', file); fd.append('title', galleryForm.title || 'School Photo'); fd.append('description', galleryForm.description || ''); fd.append('category', galleryForm.category); fd.append('is_featured', galleryForm.is_featured);
              try { await api.post('/admin/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Photo uploaded'); fetch(); } catch { toast.error('Upload failed'); }
            }} className="text-sm" /></div>
            <div className="sm:col-span-2"><label className="block text-sm mb-1">Description</label><input className="input-field" value={galleryForm.description} onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })} /></div>
            <div><label className="flex items-center gap-2"><input type="checkbox" checked={galleryForm.is_featured} onChange={(e) => setGalleryForm({ ...galleryForm, is_featured: e.target.checked })} /> Featured on homepage</label></div>
            <button type="submit" className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Image</button>
          </form>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gallery.map((g) => (
              <div key={g.id} className="card p-0 overflow-hidden">
                <img src={g.image_url} alt={g.title} className="w-full h-32 object-cover" />
                <div className="p-3 flex justify-between items-start">
                  <div><p className="font-medium text-sm">{g.title}</p><p className="text-xs text-gray-500 capitalize">{g.category?.replace('_', ' ')}</p></div>
                  <button onClick={() => deleteGallery(g.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="font-bold">Edit: {edit.page_key} / {edit.section_key}</h2>
            <div><label className="block text-sm mb-1">Title</label><input className="input-field" value={edit.title || ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
            <div><label className="block text-sm mb-1">Content</label><textarea rows={6} className="input-field" value={edit.content || ''} onChange={(e) => setEdit({ ...edit, content: e.target.value })} /></div>
            <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">Save</button><button type="button" onClick={() => setEdit(null)} className="btn-secondary">Cancel</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
