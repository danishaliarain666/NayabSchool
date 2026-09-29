import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AnnouncementsPublic() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/announcements').then((r) => setItems(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <section className="hero-navy py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Announcements & Circulars</h1>
          <p className="text-blue-100/90 mt-2">Official notices from Nayab Grammar School, Mirwah</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        {loading ? <LoadingSpinner /> : items.map((a) => (
          <article key={a.id} className="card border-l-4 border-l-gold">
            <span className="text-xs font-bold uppercase text-gold">{a.type || 'Notice'}</span>
            <h2 className="text-lg font-bold mt-1">{a.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 whitespace-pre-line">{a.content}</p>
            <p className="text-xs text-gray-400 mt-3">{a.publish_date}</p>
          </article>
        ))}
        {!loading && !items.length && <p className="text-center text-gray-500">No announcements yet.</p>}
        <Link to="/" className="inline-block text-navy dark:text-gold font-medium hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}
