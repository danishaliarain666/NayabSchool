import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Download, Megaphone } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Portal() {
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedExam, setSelectedExam] = useState('');

  useEffect(() => {
    api.get('/public/portal/classes').then((r) => setClasses(r.data.data));
  }, []);

  const runLookup = useCallback(async (cid, roll) => {
    if (!cid || !roll) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/public/portal/lookup', { params: { classId: cid, rollNumber: roll } });
      setData(res.data.data);
    } catch (err) {
      setData(null);
      if (err.response?.status === 503 || !err.response) {
        toast.error('Database is not running. Start RUN-WEBSITE.bat and try again.');
      } else {
        toast.error(err.response?.data?.message || 'Student not found');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cid = searchParams.get('classId');
    const roll = searchParams.get('roll');
    if (cid && roll) {
      setClassId(cid);
      setRollNumber(roll);
      runLookup(cid, roll);
    }
  }, [searchParams, runLookup]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!classId || !rollNumber) return toast.error('Please select class and enter roll number');
    await runLookup(classId, rollNumber);
  };

  const examOptions = [...new Map((data?.results || []).map((r) => [r.exam_id, r.exam_name])).entries()];

  const downloadResult = () => {
    if (!data?.results?.length) return toast.error('No results available');
    const examId = selectedExam || data.results[0].exam_id;
    window.open(`/api/public/portal/result-pdf?studentId=${data.student.id}&examId=${examId}`, '_blank');
  };

  const results = data?.results || [];
  const totalObt = results.reduce((s, r) => s + (parseFloat(r.marks_obtained) || 0), 0);
  const totalMax = results.reduce((s, r) => s + (parseFloat(r.max_marks) || 0), 0);

  return (
    <div className="animate-fade-in">
      <section className="hero-navy py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Student / Parent View</h1>
          <p className="text-blue-100 mt-2">Class + roll number — everything in one place</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSearch} className="card flex flex-col sm:flex-row gap-4">
          <select className="input-field flex-1" value={classId} onChange={(e) => setClassId(e.target.value)} required>
            <option value="">Select Class</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input type="number" placeholder="Roll Number" className="input-field w-full sm:w-40" value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)} required min="1" />
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center justify-center gap-2">
            <Search className="w-4 h-4" /> {loading ? 'Loading...' : 'View'}
          </button>
        </form>

        {loading && <LoadingSpinner />}
        {searched && !loading && data && (
          <div className="mt-8 animate-fade-in">
            <div className="card space-y-6">
              <div className="border-b dark:border-gray-800 pb-4">
                <h2 className="text-xl font-bold text-navy dark:text-white">{data.student.full_name}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {data.student.class_name} · Roll {data.student.roll_number} · G.R {data.student.student_id}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <p><span className="text-gray-500">Father name:</span> <strong>{data.student.father_name}</strong></p>
                <p>
                  <span className="text-gray-500">Fee status:</span>{' '}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${data.student.fee_status === 'paid' ? 'bg-green-100 text-green-700' : data.student.fee_status === 'unpaid' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {data.student.fee_status}
                  </span>
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-navy dark:text-gold mb-3">Attendance (recent school days)</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xl font-bold text-green-600">{data.attendance.present}</p>
                    <p className="text-xs text-gray-500">Present</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-xl font-bold text-red-600">{data.attendance.absent}</p>
                    <p className="text-xs text-gray-500">Absent</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xl font-bold text-primary">{data.attendance.percentage}%</p>
                    <p className="text-xs text-gray-500">Percentage</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                  <h3 className="font-semibold text-navy dark:text-gold">Examination results</h3>
                  {results.length > 0 && (
                    <div className="flex items-center gap-2">
                      {examOptions.length > 1 && (
                        <select className="input-field text-xs py-1 w-36" value={selectedExam || examOptions[0]?.[0]} onChange={(e) => setSelectedExam(e.target.value)}>
                          {examOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                        </select>
                      )}
                      <button type="button" onClick={downloadResult} className="btn-secondary text-xs inline-flex items-center gap-1 py-1.5">
                        <Download className="w-3 h-3" /> Mark sheet PDF
                      </button>
                    </div>
                  )}
                </div>
                {results.length ? (
                  <>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b dark:border-gray-700">
                          <th className="text-left py-2">Subject</th>
                          <th className="text-left">Exam</th>
                          <th className="text-right">Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, i) => (
                          <tr key={i} className="border-b dark:border-gray-800">
                            <td className="py-2">{r.subject_name}</td>
                            <td className="text-gray-500">{r.exam_name}</td>
                            <td className="text-right">{r.marks_obtained}/{r.max_marks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {totalMax > 0 && (
                      <p className="text-sm font-medium mt-3 pt-3 border-t dark:border-gray-800">
                        Total marks: {totalObt}/{totalMax} ({((totalObt / totalMax) * 100).toFixed(1)}%)
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">No results uploaded yet.</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-navy dark:text-gold mb-3">Weekly remarks (subject-wise)</h3>
                {data.weeklyRemarks?.length ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left py-2">Subject</th>
                        <th className="text-right">Teacher remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.weeklyRemarks.map((r, i) => (
                        <tr key={i} className="border-b dark:border-gray-800">
                          <td className="py-2">{r.subject_name}</td>
                          <td className="py-2 text-right">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gold/15 text-amber-900 dark:text-gold">
                              {r.remark}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-sm">No weekly remarks yet.</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-navy dark:text-gold mb-3">Fee records</h3>
                {data.fees.records?.length ? (
                  data.fees.records.map((f, i) => (
                    <div key={i} className="flex justify-between py-2 border-b dark:border-gray-800 text-sm last:border-0">
                      <span>{f.fee_type} — Due {String(f.due_date).split('T')[0]}</span>
                      <span className={`font-medium ${f.status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                        Rs. {f.amount} ({f.status})
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No fee records on file.</p>
                )}
              </div>
            </div>

            {data.announcements?.length > 0 && (
              <div className="card mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <h2 className="font-bold">School notices</h2>
                </div>
                {data.announcements.map((a, i) => (
                  <div key={i} className="py-2 border-b dark:border-gray-800 last:border-0">
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.content?.slice(0, 120)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
