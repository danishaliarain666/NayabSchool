import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileText } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Admissions() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    student_name: '', father_name: '', date_of_birth: '', gender: 'Male',
    applying_class: '', phone: '', address: '', previous_school: '',
  });

  useEffect(() => {
    api.get('/public/about').then((r) => {
      const admissions = r.data.data.content?.filter((c) => c.page_key === 'admissions') || [];
      setContent(admissions);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/public/admissions', form);
      toast.success('Application submitted successfully!');
      setForm({ student_name: '', father_name: '', date_of_birth: '', gender: 'Male', applying_class: '', phone: '', address: '', previous_school: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  const requirements = content.find((c) => c.section_key === 'requirements');
  const fees = content.find((c) => c.section_key === 'fees');

  return (
    <div className="animate-fade-in">
      <section className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Admissions</h1>
          <p className="text-blue-100 mt-2">Join Nayab English Grammar High School</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> {requirements?.title || 'Requirements'}</h2>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{requirements?.content}</p>
          </div>
          <div className="card">
            <h2 className="text-xl font-bold mb-3">Fee Structure</h2>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{fees?.content}</p>
          </div>
          <a href="/api/public/prospectus" target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
            <Download className="w-4 h-4" /> Download Prospectus
          </a>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Admission Application Form</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'student_name', label: 'Student Name', type: 'text', required: true },
              { name: 'father_name', label: 'Father Name', type: 'text', required: true },
              { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
              { name: 'applying_class', label: 'Applying Class', type: 'text', required: true },
              { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
              { name: 'previous_school', label: 'Previous School', type: 'text' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium mb-1">{f.label}</label>
                <input type={f.type} required={f.required} className="input-field" value={form[f.name]}
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
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea className="input-field" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Submitting...' : 'Submit Application'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
