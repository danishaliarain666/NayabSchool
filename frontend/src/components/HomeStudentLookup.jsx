import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function HomeStudentLookup() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  useEffect(() => {
    api.get('/public/portal/classes')
      .then((r) => setClasses(r.data.data || []))
      .catch(() => toast.error('Could not load classes — start RUN-WEBSITE.bat'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classId || !rollNumber) return toast.error('Select class and enter roll number');
    const roll = parseInt(String(rollNumber).trim(), 10);
    if (!Number.isFinite(roll) || roll < 1) return toast.error('Enter a valid roll number');
    try {
      await api.get('/public/portal/lookup', { params: { classId, rollNumber: roll } });
      navigate(`/portal?classId=${classId}&roll=${roll}`);
    } catch (err) {
      if (err.response?.status === 503 || !err.response) {
        toast.error('Server or database is off. Please run RUN-WEBSITE.bat first.');
      } else {
        toast.error(err.response?.data?.message || 'Student not found for this class and roll.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto -mt-16 relative z-20 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-navy dark:text-white text-center">Student / Parent View</h2>
        <p className="text-gray-500 text-sm text-center mt-2 max-w-xl mx-auto">
          One place for profile, results, attendance, fees, and weekly teacher remarks — no login needed.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Class</label>
            <select className="input-field" value={classId} onChange={(e) => setClassId(e.target.value)} required>
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Roll number</label>
            <input
              type="number"
              min={1}
              placeholder="Roll number from school record"
              className="input-field"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-navy inline-flex items-center justify-center gap-2 h-[46px] px-6">
            <Search className="w-4 h-4" /> View
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">Public service — parents and students only need class + roll.</p>
      </div>
    </div>
  );
}
