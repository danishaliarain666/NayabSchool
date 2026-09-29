import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Calendar, Trophy, Users, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const links = [
  { to: '/teacher/students', icon: Users, label: 'Class Students' },
  { to: '/teacher/attendance', icon: Calendar, label: 'Mark Attendance' },
  { to: '/teacher/marks', icon: Trophy, label: 'Add Marks' },
];

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebar, setSidebar] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-950">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 transform transition-transform lg:translate-x-0 ${sidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b dark:border-gray-800">
          <h2 className="font-bold text-primary">Teacher Portal</h2>
          <p className="text-xs text-gray-500">{user?.teacherName || user?.email}</p>
        </div>
        <nav className="p-3 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebar(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <Icon className="w-5 h-5" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t dark:border-gray-800">
          <button type="button" onClick={() => { logout(); navigate('/login', { replace: true }); }} className="flex items-center gap-2 w-full px-3 py-2 text-red-600 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {sidebar && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebar(false)} />}

      <div className="flex-1 lg:ml-64">
        <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button className="lg:hidden p-2" onClick={() => setSidebar(true)}><Menu className="w-6 h-6" /></button>
          <h1 className="font-semibold">Teacher Portal</h1>
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>
        <main className="p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
