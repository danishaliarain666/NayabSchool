import { useEffect, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Search() {
  const [q, setQ] = useState('');
  const [classId, setClassId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [classes, setClasses] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.get('/admin/classes').then((r) => setClasses(r.data.data));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/search/students', { params: { q, classId, rollNumber } });
      setResults(res.data.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Search Students</h1>
      <form onSubmit={handleSearch} className="card grid sm:grid-cols-4 gap-4 items-end">
        <div className="sm:col-span-2">
          <label className="block text-sm mb-1">Name / ID / Father Name</label>
          <input className="input-field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." />
        </div>
        <div>
          <label className="block text-sm mb-1">Class</label>
          <select className="input-field" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">All</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Roll Number</label>
          <input type="number" className="input-field" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary sm:col-span-4 inline-flex items-center justify-center gap-2">
          <SearchIcon className="w-4 h-4" /> Search
        </button>
      </form>

      {loading ? <LoadingSpinner /> : searched && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="py-3 text-left">ID</th><th className="py-3 text-left">Roll</th><th className="py-3 text-left">Name</th><th className="py-3 text-left">Class</th><th className="py-3 text-left">Fee</th></tr></thead>
            <tbody>
              {results.map((s) => (
                <tr key={s.id} className="border-b dark:border-gray-800">
                  <td className="py-2 font-mono text-xs">{s.student_id}</td>
                  <td className="py-2">{s.roll_number}</td>
                  <td className="py-2 font-medium">{s.full_name}</td>
                  <td className="py-2">{s.class_name}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${s.fee_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{s.fee_status}</span></td>
                </tr>
              ))}
              {!results.length && <tr><td colSpan={5} className="py-8 text-center text-gray-500">No students found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
