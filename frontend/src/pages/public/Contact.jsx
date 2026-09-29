import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Phone, Mail } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Contact() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  useEffect(() => {
    api.get('/public/contact-info').then((r) => setSettings(r.data.data)).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/public/contact', form);
      toast.success('Message sent successfully!');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="animate-fade-in">
      <section className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Contact Us</h1>
          <p className="text-blue-100 mt-2">We'd love to hear from you</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {[
            { icon: MapPin, label: 'Address', value: settings.address },
            { icon: Phone, label: 'Phone', value: settings.phone },
            { icon: Mail, label: 'Email', value: settings.email },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg"><Icon className="w-6 h-6 text-primary" /></div>
              <div><p className="font-semibold">{label}</p><p className="text-gray-500 text-sm">{value}</p></div>
            </div>
          ))}
          <div className="rounded-xl overflow-hidden h-64">
            <iframe title="Map" src={settings.map_embed} width="100%" height="100%" style={{ border: 0 }} loading="lazy" />
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {['name', 'email', 'phone', 'subject'].map((f) => (
              <div key={f}>
                <label className="block text-sm font-medium mb-1 capitalize">{f}</label>
                <input type={f === 'email' ? 'email' : 'text'} required={f !== 'phone'} className="input-field"
                  value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea required rows={4} className="input-field" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Sending...' : 'Send Message'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
