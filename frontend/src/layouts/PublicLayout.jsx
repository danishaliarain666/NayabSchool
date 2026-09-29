import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X, LogIn, Instagram, Facebook } from 'lucide-react';
import { useState } from 'react';
import { useSchoolSettings } from '../hooks/useSchoolSettings';
import SchoolLogo from '../components/SchoolLogo';
import NayabAssistant from '../components/NayabAssistant';
import AnnouncementTicker from '../components/AnnouncementTicker';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/academics', label: 'Academics' },
  { to: '/admissions', label: 'Admissions' },
  { to: '/announcements', label: 'Announcements' },
  { to: '/contact', label: 'Contact Us' },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const settings = useSchoolSettings();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <header className="bg-navy text-white sticky top-0 z-50 shadow-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <SchoolLogo logoUrl={settings.logo_url || '/uploads/branding/school-logo.jpg'} size="xl" />
            <div className="hidden sm:block min-w-0">
              <p className="font-extrabold text-sm tracking-wide truncate leading-tight">
                {settings?.school_name || 'Nayab English Grammar High School, Mirwah Gorchani'}
              </p>
              <p className="text-[10px] text-gold uppercase tracking-widest">Learn · Grow · Succeed</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/15 text-gold' : 'text-white/90 hover:bg-white/10'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="ml-3 px-4 py-2 bg-white text-navy rounded-lg text-sm font-bold hover:bg-gold hover:text-navy transition-colors inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Login
            </Link>
          </nav>

          <button type="button" onClick={() => setOpen(!open)} className="lg:hidden p-2 rounded-lg hover:bg-white/10" aria-label="Menu">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <nav className="lg:hidden px-4 pb-4 space-y-1 border-t border-white/10 animate-fade-in">
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm">{l.label}</NavLink>
            ))}
            <Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg bg-white text-navy font-bold text-sm text-center">Login</Link>
          </nav>
        )}
      </header>
      <AnnouncementTicker />

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-navy-dark text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-white font-extrabold tracking-wide">NAYAB GRAMMAR SCHOOL</h3>
            <p className="text-gold text-xs mt-1">Mirwah · Sindh</p>
            <p className="text-sm text-gray-400 mt-3">{settings.school_description?.slice(0, 120)}…</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {navLinks.map((l) => (
                <li key={l.to}><Link to={l.to} className="hover:text-gold">{l.label}</Link></li>
              ))}
              <li><Link to="/portal" className="hover:text-gold">Examination Marksheets</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">School Timings</h4>
            <p className="text-sm whitespace-pre-line">{settings.school_timing || 'Mon – Sat: 8:00 AM – 2:00 PM'}</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact Us</h4>
            <p className="text-sm">{settings.address}</p>
            <p className="text-sm mt-2">{settings.phone}</p>
            <p className="text-sm">{settings.email}</p>
            <Link to="/login" className="inline-block mt-3 text-gold font-semibold text-sm hover:underline">Staff Login Portal →</Link>
            <div className="flex gap-2 mt-4">
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-lg hover:bg-gold/20" aria-label="Instagram">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-lg hover:bg-gold/20" aria-label="Facebook">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 text-center py-4 text-sm text-gray-500">
          © {new Date().getFullYear()} Nayab Grammar School, Mirwah. All rights reserved.
          <span className="block text-gold text-xs mt-1">Learn · Grow · Succeed</span>
        </div>
      </footer>

      <NayabAssistant />
    </div>
  );
}
