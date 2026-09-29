import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Printer } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { downloadWithAuth } from '../../utils/download';

const today = () => new Date().toISOString().split('T')[0];

function groupHolidayRows(rows) {
  const sorted = [...rows].sort(
    (a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime()
  );
  const groups = [];
  for (const row of sorted) {
    const d = String(row.holiday_date).split('T')[0];
    const last = groups[groups.length - 1];
    if (last && last.title === row.title) {
      const next = new Date(`${last.end}T12:00:00`);
      next.setDate(next.getDate() + 1);
      if (next.toISOString().split('T')[0] === d) {
        last.end = d;
        last.ids.push(row.id);
        continue;
      }
    }
    groups.push({ title: row.title, start: d, end: d, ids: [row.id] });
  }
  return groups.reverse();
}

export default function Attendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'students';

  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [viewDate, setViewDate] = useState(today());
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [students, setStudents] = useState([]);
  const [studentReport, setStudentReport] = useState([]);
  const [classSummary, setClassSummary] = useState([]);
  const [staffRows, setStaffRows] = useState([]);
  const [staffSummary, setStaffSummary] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [absentStaffIds, setAbsentStaffIds] = useState([]);
  const staffMode = tab === 'staff' ? searchParams.get('staffMode') || 'mark' : 'mark';
  const [staffHoliday, setStaffHoliday] = useState(false);
  const [staffSunday, setStaffSunday] = useState(false);
  const [studentHoliday, setStudentHoliday] = useState(false);
  const [studentSunday, setStudentSunday] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [holForm, setHolForm] = useState({
    title: 'Holiday',
    from: today(),
    to: today(),
    postAnnouncement: true,
  });
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/classes').then((r) => setClasses(r.data.data));
  }, []);

  const setTab = (t) => {
    if (t === 'staff') setSearchParams({ tab: t, staffMode: searchParams.get('staffMode') || 'mark' });
    else setSearchParams({ tab: t });
  };

  const setStaffMode = (m) => setSearchParams({ tab: 'staff', staffMode: m });

  useEffect(() => {
    if (tab !== 'students' || !classId) return;
    setLoadingStudents(true);
    api.get(`/admin/attendance/${classId}`, { params: { date: viewDate } })
      .then((r) => {
        if (r.data.data.isHoliday) {
          setStudentHoliday(true);
          setStudentSunday(!!r.data.data.isSunday);
          setStudents([]);
        } else {
          setStudentHoliday(false);
          setStudentSunday(false);
          setStudents(r.data.data.students);
        }
      })
      .finally(() => setLoadingStudents(false));
  }, [tab, classId, viewDate]);

  const loadStudentRange = () => {
    setLoadingStudents(true);
    Promise.all([
      api.get('/admin/attendance', { params: { classId, from, to } }),
      classId
        ? api.get('/admin/attendance/summary/students', { params: { classId, from, to } })
        : Promise.resolve({ data: { data: [] } }),
    ])
      .then(([rep, sum]) => {
        setStudentReport(rep.data.data);
        setClassSummary(sum.data.data || []);
      })
      .finally(() => setLoadingStudents(false));
  };

  useEffect(() => {
    if (tab === 'students') loadStudentRange();
  }, [tab, from, to, classId]);

  const loadStaff = async () => {
    if (tab !== 'staff') return;
    setLoadingStaff(true);
    try {
      const day = await api.get('/admin/staff-attendance', { params: { date: viewDate } });
      const list = day.data.data?.staff || [];
      setStaffHoliday(!!day.data.data.isHoliday);
      setStaffSunday(!!day.data.data.isSunday);
      setStaffList(list);
      setAbsentStaffIds(list.filter((s) => s.status === 'absent').map((s) => s.id));
    } catch (err) {
      setStaffList([]);
      setAbsentStaffIds([]);
      toast.error(err.response?.data?.message || 'Could not load staff list');
    }
    try {
      const [range, summary] = await Promise.all([
        api.get('/admin/staff-attendance/range', { params: { from, to } }),
        api.get('/admin/staff-attendance/summary', { params: { from, to } }),
      ]);
      setStaffRows(range.data.data || []);
      setStaffSummary(summary.data.data || []);
    } catch {
      setStaffRows([]);
      setStaffSummary([]);
    }
    setLoadingStaff(false);
  };

  const downloadStaffReport = () => {
    const q = new URLSearchParams({ from, to });
    downloadWithAuth(`/admin/staff-attendance/export/pdf?${q}`, `staff-attendance-${from}.pdf`);
  };

  useEffect(() => {
    if (tab === 'staff') loadStaff();
  }, [tab, viewDate, from, to]);

  const loadHolidays = () => {
    api.get('/admin/holidays').then((r) => setHolidays(r.data.data || [])).catch(() => {});
  };

  useEffect(() => {
    if (tab === 'holidays') loadHolidays();
  }, [tab]);

  const holidayGroups = useMemo(() => groupHolidayRows(holidays), [holidays]);

  const downloadClassReport = () => {
    if (!classId) return toast.error('Select class first');
    const q = new URLSearchParams({ classId, from, to });
    downloadWithAuth(`/admin/attendance/export/pdf?${q}`, `attendance-class-${classId}.pdf`);
  };

  const studentRows = useMemo(() => {
    const sumById = new Map(classSummary.map((s) => [s.id, s]));
    return students.map((s) => ({ ...s, summary: sumById.get(s.id) }));
  }, [students, classSummary]);

  const toggleStaffAbsent = (id) => {
    setAbsentStaffIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveStaff = async () => {
    setSaving(true);
    try {
      const res = await api.post('/admin/staff-attendance', {
        date: viewDate,
        absentStaffIds,
      });
      const d = res.data.data;
      toast.success(d ? `Saved: ${d.present} present, ${d.absent} absent` : 'Staff attendance saved');
      loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const staffStatusBadge = (status) => {
    const st = status || 'present';
    const cls =
      st === 'present'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        : st === 'absent'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          : st === 'leave'
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
        {st.replace('_', ' ')}
      </span>
    );
  };

  const addHoliday = async (e) => {
    e.preventDefault();
    if (holForm.to < holForm.from) return toast.error('To date must be on or after from date');
    try {
      await api.post('/admin/holidays', holForm);
      toast.success('Holiday saved');
      setHolForm({ title: 'Holiday', from: today(), to: today(), postAnnouncement: true });
      loadHolidays();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const deleteHolidayGroup = async (ids) => {
    if (!confirm('Remove this holiday from the calendar?')) return;
    try {
      if (ids.length === 1) {
        await api.delete(`/admin/holidays/${ids[0]}`);
      } else {
        await api.post('/admin/holidays/remove-bulk', { ids });
      }
      toast.success('Removed');
      loadHolidays();
    } catch {
      toast.error('Could not remove');
    }
  };

  const tabs = [
    { id: 'students', label: 'Students' },
    { id: 'staff', label: 'Staff' },
    { id: 'holidays', label: 'Holidays' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Students: view & reports · Staff: mark daily attendance here · holidays excluded from counts</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.id ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{tab === 'staff' ? 'View / mark date' : 'View date'}</label>
          <input type="date" className="input-field" value={viewDate} onChange={(e) => setViewDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" className="input-field" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" className="input-field" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button type="button" onClick={() => { setFrom(today()); setTo(today()); setViewDate(today()); }} className="btn-secondary text-sm">Today</button>
      </div>

      {tab === 'students' && (
        <>
          <div className="card flex flex-wrap gap-3 items-end">
            <select className="input-field flex-1 min-w-[12rem]" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
            </select>
            <button type="button" disabled={!classId} onClick={downloadClassReport} className="btn-secondary text-sm inline-flex items-center gap-2">
              <Printer className="w-4 h-4" /> Download class report (PDF)
            </button>
          </div>
          {studentHoliday && (
            <p className="text-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm">
              {studentSunday ? 'Sunday — weekly off. No student attendance for this date.' : 'School holiday — no student attendance for this date.'}
            </p>
          )}
          {loadingStudents && classId ? <LoadingSpinner /> : null}
          {classId && !studentHoliday && students.length > 0 && (
            <div className="card overflow-x-auto">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                <h2 className="font-bold">Class register</h2>
                <p className="text-xs text-gray-500">Status on {viewDate} · summary {from} to {to}</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/80">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-3 px-3">Roll</th>
                    <th className="py-3 px-3">Student name</th>
                    <th className="py-3 px-3">Attendance ({viewDate})</th>
                    <th className="py-3 px-3 text-right">Present</th>
                    <th className="py-3 px-3 text-right">Absent</th>
                    <th className="py-3 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((s) => {
                    const dayStatus = s.status === 'absent' ? 'absent' : 'present';
                    return (
                      <tr key={s.id} className="border-t dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                        <td className="py-2 px-3">{s.roll_number}</td>
                        <td className="py-2 px-3 font-medium">{s.full_name}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${dayStatus === 'absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                            {dayStatus}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-green-600">{s.summary?.present ?? '—'}</td>
                        <td className="py-2 px-3 text-right text-red-600">{s.summary?.absent ?? '—'}</td>
                        <td className="py-2 px-3 text-right font-medium">{s.summary != null ? `${s.summary.percentage}%` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {classId && !loadingStudents && !studentHoliday && !students.length && (
            <p className="text-sm text-gray-500">No active students in this class.</p>
          )}

          <div className="card overflow-x-auto">
            <h2 className="font-bold mb-3">Daily absent log (school days only)</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="py-2 text-left">Date</th><th className="py-2 text-left">Class</th><th className="py-2 text-right">Absent</th><th className="py-2 text-right">Present</th></tr></thead>
              <tbody>
                {studentReport.map((r, i) => (
                  <tr key={i} className="border-b dark:border-gray-800">
                    <td className="py-2">{String(r.date).split('T')[0]}</td>
                    <td className="py-2">{r.class_name}</td>
                    <td className="py-2 text-right text-red-600">{r.absent_count}</td>
                    <td className="py-2 text-right text-green-600">{(r.total_students || 0) - r.absent_count}</td>
                  </tr>
                ))}
                {!studentReport.length && <tr><td colSpan={4} className="py-6 text-center text-gray-500">No records in this range</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'staff' && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStaffMode('mark')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${staffMode === 'mark' ? 'bg-navy text-white dark:bg-primary' : 'bg-gray-200 dark:bg-gray-800'}`}
            >
              Mark attendance
            </button>
            <button
              type="button"
              onClick={() => setStaffMode('view')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${staffMode === 'view' ? 'bg-navy text-white dark:bg-primary' : 'bg-gray-200 dark:bg-gray-800'}`}
            >
              View &amp; report
            </button>
          </div>

          {staffMode === 'mark' && (
            <>
              <div className="card flex flex-wrap gap-3 items-end justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Absent-only:</strong> tick only absent staff · date above = mark date
                </p>
                <button type="button" disabled={saving || staffHoliday || !staffList.length} onClick={saveStaff} className="btn-primary text-sm shrink-0">
                  {saving ? 'Saving…' : `Save — ${viewDate}`}
                </button>
              </div>
              {staffHoliday && (
                <p className="text-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm">
                  {staffSunday
                    ? 'Sunday — weekly off. List is for reference only.'
                    : 'School holiday — cannot save on this date.'}
                </p>
              )}
              {loadingStaff ? <LoadingSpinner /> : (
                <div className="card overflow-x-auto">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <h2 className="font-bold">Mark — {viewDate}</h2>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{staffList.length} staff · {absentStaffIds.length} absent</span>
                      {!staffHoliday && staffList.length > 0 && (
                        <button type="button" className="text-primary font-medium" onClick={() => setAbsentStaffIds([])}>
                          Mark all present
                        </button>
                      )}
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/80">
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                        <th className="py-3 px-3 w-14">Absent</th>
                        <th className="py-3 px-3">Emp ID</th>
                        <th className="py-3 px-3">Name</th>
                        <th className="py-3 px-3">Designation</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map((r) => {
                        const isAbsent = absentStaffIds.includes(r.id);
                        return (
                          <tr
                            key={r.id}
                            className={`border-t dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 ${isAbsent ? 'bg-red-50/60 dark:bg-red-900/10' : ''}`}
                          >
                            <td className="py-2 px-3">
                              <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={isAbsent}
                                disabled={staffHoliday}
                                onChange={() => toggleStaffAbsent(r.id)}
                                aria-label={`Mark ${r.full_name} absent`}
                              />
                            </td>
                            <td className="py-2 px-3 font-mono text-xs">{r.employee_id || '—'}</td>
                            <td className="py-2 px-3 font-medium">{r.full_name}</td>
                            <td className="py-2 px-3 text-gray-500">{r.designation || '—'}</td>
                            <td className="py-2 px-3">{staffStatusBadge(isAbsent ? 'absent' : 'present')}</td>
                          </tr>
                        );
                      })}
                      {!staffList.length && (
                        <tr><td colSpan={5} className="py-8 text-center text-gray-500">No active staff — add under Admin → Staff</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {staffMode === 'view' && (
            <>
              <div className="card flex flex-wrap gap-3 items-end justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Summary for <strong>{from}</strong> to <strong>{to}</strong> (school days, Sundays excluded)
                </p>
                <button type="button" onClick={downloadStaffReport} className="btn-secondary text-sm inline-flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Download staff report (PDF)
                </button>
              </div>
              {loadingStaff ? <LoadingSpinner /> : (
                <div className="card overflow-x-auto">
                  <h2 className="font-bold mb-3">Staff attendance summary</h2>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/80">
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                        <th className="py-3 px-3">Emp ID</th>
                        <th className="py-3 px-3">Name</th>
                        <th className="py-3 px-3">Designation</th>
                        <th className="py-3 px-3 text-right">Present</th>
                        <th className="py-3 px-3 text-right">Absent</th>
                        <th className="py-3 px-3 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffSummary.map((s) => (
                        <tr key={s.id} className="border-t dark:border-gray-800">
                          <td className="py-2 px-3 font-mono text-xs">{s.employee_id || '—'}</td>
                          <td className="py-2 px-3 font-medium">{s.full_name}</td>
                          <td className="py-2 px-3 text-gray-500">{s.designation || '—'}</td>
                          <td className="py-2 px-3 text-right text-green-600">{s.present}</td>
                          <td className="py-2 px-3 text-right text-red-600">{s.absent}</td>
                          <td className="py-2 px-3 text-right font-medium">{s.percentage}%</td>
                        </tr>
                      ))}
                      {!staffSummary.length && (
                        <tr><td colSpan={6} className="py-8 text-center text-gray-500">No staff records — mark attendance or widen date range</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <div className="card overflow-x-auto">
            <h2 className="font-bold mb-3">Day-wise absent log ({from} — {to})</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Designation</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {staffRows.map((r, i) => (
                  <tr key={i} className="border-t dark:border-gray-800">
                    <td className="py-2 px-3">{String(r.date).split('T')[0]}</td>
                    <td className="py-2 px-3">{r.full_name}</td>
                    <td className="py-2 px-3 text-gray-500">{r.designation || '—'}</td>
                    <td className="py-2 px-3">{staffStatusBadge(r.status)}</td>
                  </tr>
                ))}
                {!staffRows.length && <tr><td colSpan={4} className="py-6 text-center text-gray-500">No staff records in this range — save a day above or run demo seed</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'holidays' && (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-3">
            <strong>Sunday</strong> is always a weekly off (no attendance). Add extra closures below — they also appear in{' '}
            <strong>Announcements</strong> until the last holiday date (e.g. 1 Oct off → notice hides from 2 Oct).
          </p>
          <form onSubmit={addHoliday} className="card grid sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-sm mb-1">Reason / title</label>
              <input required className="input-field" placeholder="e.g. Eid, Independence Day" value={holForm.title} onChange={(e) => setHolForm({ ...holForm, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">From date</label>
              <input type="date" required className="input-field" value={holForm.from} onChange={(e) => setHolForm({ ...holForm, from: e.target.value, to: holForm.to < e.target.value ? e.target.value : holForm.to })} />
            </div>
            <div>
              <label className="block text-sm mb-1">To date</label>
              <input type="date" required className="input-field" value={holForm.to} min={holForm.from} onChange={(e) => setHolForm({ ...holForm, to: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary">Save holiday</button>
          </form>
          <label className="flex items-center gap-2 text-sm px-1 -mt-2">
            <input type="checkbox" checked={holForm.postAnnouncement} onChange={(e) => setHolForm({ ...holForm, postAnnouncement: e.target.checked })} />
            Show as school announcement until the last holiday date
          </label>
          <div className="card overflow-x-auto">
            <h2 className="font-bold mb-3">Scheduled closures</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-3 px-3">Dates</th>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {holidayGroups.map((g) => (
                  <tr key={`${g.start}-${g.end}-${g.title}`} className="border-t dark:border-gray-800">
                    <td className="py-2 px-3 font-mono text-xs">
                      {g.start === g.end ? g.start : `${g.start} → ${g.end}`}
                    </td>
                    <td className="py-2 px-3">{g.title}</td>
                    <td className="py-2 px-3">
                      <button type="button" className="text-red-600 text-xs" onClick={() => deleteHolidayGroup(g.ids)}>Remove</button>
                    </td>
                  </tr>
                ))}
                {!holidayGroups.length && (
                  <tr><td colSpan={3} className="py-8 text-center text-gray-500">No extra holidays — only Sundays are off by default</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
