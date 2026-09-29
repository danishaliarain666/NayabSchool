import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Submissions() {
  const [tab, setTab] = useState('contact');
  const [contacts, setContacts] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        api.get('/admin/submissions/contact'),
        api.get('/admin/submissions/admissions'),
      ]);
      setContacts(c.data.data);
      setAdmissions(a.data.data);
    } catch {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const markRead = async (id) => {
    await api.put(`/admin/submissions/contact/${id}/read`);
    fetch();
  };

  const updateAdmission = async (id, status) => {
    await api.put(`/admin/submissions/admissions/${id}`, { status });
    toast.success('Status updated');
    fetch();
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Submissions Inbox</h1>
      <div className="flex gap-2">
        <button onClick={() => setTab('contact')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'contact' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
          Contact Messages ({contacts.filter((c) => !c.is_read).length} unread)
        </button>
        <button onClick={() => setTab('admissions')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'admissions' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
          Admission Applications ({admissions.filter((a) => a.status === 'pending').length} pending)
        </button>
      </div>

      {tab === 'contact' && (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.id} className={`card ${!c.is_read ? 'border-primary/30 bg-primary/5' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{c.name} — {c.subject || 'No subject'}</p>
                  <p className="text-sm text-gray-500">{c.email} | {c.phone}</p>
                  <p className="text-sm mt-2">{c.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                </div>
                {!c.is_read && <button onClick={() => markRead(c.id)} className="btn-secondary text-xs">Mark Read</button>}
              </div>
            </div>
          ))}
          {!contacts.length && <p className="text-gray-500 text-center py-8">No contact messages yet</p>}
        </div>
      )}

      {tab === 'admissions' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="py-3 text-left">Student</th><th className="py-3 text-left">Father</th><th className="py-3 text-left">Class</th><th className="py-3 text-left">Phone</th><th className="py-3 text-left">Status</th><th className="py-3">Action</th></tr></thead>
            <tbody>
              {admissions.map((a) => (
                <tr key={a.id} className="border-b dark:border-gray-800">
                  <td className="py-2">{a.student_name}</td>
                  <td className="py-2">{a.father_name}</td>
                  <td className="py-2">{a.applying_class}</td>
                  <td className="py-2">{a.phone}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${a.status === 'approved' ? 'bg-green-100 text-green-700' : a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.status}</span></td>
                  <td className="py-2">
                    {a.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => updateAdmission(a.id, 'approved')} className="text-xs text-green-600 hover:underline">Approve</button>
                        <button onClick={() => updateAdmission(a.id, 'rejected')} className="text-xs text-red-600 hover:underline">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!admissions.length && <p className="text-gray-500 text-center py-8">No admission applications yet</p>}
        </div>
      )}
    </div>
  );
}
