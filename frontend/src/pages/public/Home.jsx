import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileText,
  DollarSign,
  Users,
  Shield,
  Megaphone,
  Calendar,
} from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import SafeImage from '../../components/SafeImage';
import HomeStudentLookup from '../../components/HomeStudentLookup';

const services = [
  {
    icon: FileText,
    title: 'Marks & Report Cards',
    desc: 'Print official A4 progress report cards with grading breakdowns.',
    to: '/portal',
    cta: 'View Results',
  },
  {
    icon: DollarSign,
    title: 'Fee Status & Challans',
    desc: 'Verify tuition status and payment records online.',
    to: '/portal',
    cta: 'Check Fee Status',
  },
  {
    icon: Users,
    title: 'Student & Parent Area',
    desc: 'Attendance percentages and term performance at a glance.',
    to: '/portal',
    cta: 'Open Student Area',
  },
  {
    icon: Shield,
    title: 'Staff Portal',
    desc: 'Authorized access for management and teachers.',
    to: '/login',
    cta: 'Sign In',
  },
];

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/home')
      .then((r) => setData(r.data.data))
      .catch(() => setData({ settings: {}, announcements: [], gallery: [], stats: {} }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;
  const { settings, announcements, gallery, stats } = data || { settings: {}, announcements: [], gallery: [], stats: {} };
  const matricRate = settings?.matric_pass_rate || '99.9';
  const campusGallery = (gallery || []).filter((g) => g.category !== 'sports');

  return (
    <div className="pb-0">
      {/* Hero — Netlify-style navy + gold */}
      <section className="hero-navy relative overflow-hidden pb-24 md:pb-28">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,#d4a017_0%,transparent_45%)]" />
        <div className="max-w-7xl mx-auto px-4 pt-10 md:pt-14 relative">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-gold border border-gold/30 mb-4">
                Nayab English Grammar High School
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                Welcome to{' '}
                <span className="text-gold">{settings?.school_name?.split(',')[0] || 'Nayab English Grammar High School'}</span>
                {settings?.school_name?.includes(',') && (
                  <span className="block text-xl md:text-2xl mt-1 text-blue-100 font-semibold">
                    {settings.school_name.split(',').slice(1).join(',').trim()}
                  </span>
                )}
              </h1>
              <p className="text-gold font-semibold mt-3 text-lg">Quality Education, Bright Future</p>
              <p className="text-blue-100/90 mt-4 max-w-xl leading-relaxed">
                {settings?.school_description?.slice(0, 220) ||
                  'Quality education, examination marksheets, attendance, fee records, and campus circulars — all in one place.'}
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/about" className="px-6 py-2.5 bg-white text-navy rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Learn More
                </Link>
                <Link to="/admissions" className="px-6 py-2.5 border-2 border-white/80 text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
                  Admissions
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-8 max-w-md">
                <div className="rounded-lg bg-white/10 border border-white/15 p-3 text-center">
                  <p className="text-xl font-bold text-gold">{stats?.students ?? '—'}</p>
                  <p className="text-[10px] uppercase tracking-wide text-blue-100">Students</p>
                </div>
                <div className="rounded-lg bg-white/10 border border-white/15 p-3 text-center">
                  <p className="text-xl font-bold text-gold">{stats?.teachers ?? '—'}</p>
                  <p className="text-[10px] uppercase tracking-wide text-blue-100">Teachers</p>
                </div>
                <div className="rounded-lg bg-white/10 border border-white/15 p-3 text-center">
                  <p className="text-xl font-bold text-gold">{stats?.classes ?? '—'}</p>
                  <p className="text-[10px] uppercase tracking-wide text-blue-100">Classes</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-6 text-white">
                <p className="text-gold text-xs font-bold uppercase tracking-wide">Principal&apos;s Message</p>
                <p className="font-semibold mt-1">{settings?.principal_name || 'Miss Rukhsana Ghulam Murtza Arain'}</p>
                <p className="text-sm text-blue-100/95 mt-3 leading-relaxed italic">
                  &ldquo;{settings?.principal_message?.slice(0, 280) || 'We are committed to quality education and moral discipline for every child in Mirwah.'}&rdquo;
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gold text-navy-dark p-4 text-center font-bold">
                  <p className="text-2xl">{matricRate}%</p>
                  <p className="text-xs mt-1">Matric Board Pass Rate</p>
                </div>
                <div className="rounded-xl bg-white/10 border border-white/20 p-4 text-center text-white">
                  <p className="text-2xl font-bold">{stats?.teachers ?? '—'}</p>
                  <p className="text-xs mt-1 text-blue-100">Teachers on Staff</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeStudentLookup />

      {/* Portals */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-navy dark:text-white">Portals & Core Services</h2>
          <p className="text-gray-500 mt-2">Results, fees, and staff tools — easy for families and teachers alike.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map(({ icon: Icon, title, desc, to, cta }) => (
            <Link key={title} to={to} className="card group hover:border-gold/40 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-navy/5 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:bg-gold/20">
                <Icon className="w-6 h-6 text-navy dark:text-gold" />
              </div>
              <h3 className="font-bold text-navy dark:text-white">{title}</h3>
              <p className="text-sm text-gray-500 mt-2 line-clamp-3">{desc}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold mt-4">
                {cta} <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Announcements */}
      <section className="bg-gray-50 dark:bg-gray-900/50 py-16 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-gold" /> Recent Announcements
              </h2>
            </div>
            <Link to="/announcements" className="text-navy dark:text-gold font-semibold text-sm hover:underline">
              View All Circulars
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {(announcements?.length ? announcements.slice(0, 4) : []).map((a) => (
              <article key={a.id} className="card hover:shadow-md transition-shadow">
                <span className="text-xs font-bold text-gold uppercase">{a.type}</span>
                <h3 className="font-bold mt-1">{a.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{a.content}</p>
                <Link to="/announcements" className="text-sm text-navy dark:text-gold font-medium mt-3 inline-block">
                  Read full notice →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Uniform & timings — Netlify section */}
      <section className="max-w-7xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="text-2xl font-bold text-navy dark:text-white">Uniform Policy & Campus Timings</h2>
          <p className="text-gray-500 mt-2 text-sm">Discipline, neatness, and punctual attendance.</p>
          <div className="mt-6 space-y-4 text-sm">
            <div>
              <p className="font-bold text-navy dark:text-gold">Boys Uniform</p>
              <p className="text-gray-600 dark:text-gray-400">White shirt, navy trousers, tie, black shoes.</p>
            </div>
            <div>
              <p className="font-bold text-navy dark:text-gold">Girls Uniform</p>
              <p className="text-gray-600 dark:text-gray-400">Navy frock or shalwar-kameez with white collar, navy scarf.</p>
            </div>
          </div>
        </div>
        <div className="card bg-navy text-white border-0">
          <h3 className="font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-gold" /> Daily Assembly & Timings</h3>
          <p className="text-sm text-blue-100 mt-4">{settings?.school_timing || 'Mon – Sat: 8:00 AM – 2:00 PM'}</p>
          <p className="text-xs text-gold mt-4">Gate arrival recommended before 8:15 AM</p>
        </div>
      </section>

      {/* Gallery strip */}
      {campusGallery.length > 0 && (
        <section className="py-12 bg-navy">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-xl font-bold text-white mb-6">Campus Life</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {campusGallery.slice(0, 4).map((g) => (
                <Link key={g.id} to="/gallery" className="aspect-square rounded-xl overflow-hidden ring-2 ring-gold/30 hover:ring-gold transition-all">
                  <SafeImage src={g.image_url} alt={g.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
