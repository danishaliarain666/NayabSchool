import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import api from '../services/api';

export default function AnnouncementTicker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/public/announcements').then((r) => setItems(r.data.data || [])).catch(() => {});
  }, []);

  if (!items.length) return null;

  const text = items.map((a) => `${a.title}: ${a.content?.replace(/\s+/g, ' ').slice(0, 120)}`).join('   •   ');

  return (
    <div className="bg-gold text-navy-dark overflow-hidden border-b border-gold-dark/30">
      <div className="max-w-7xl mx-auto flex items-center gap-2 px-3 py-2">
        <Megaphone className="w-4 h-4 shrink-0" aria-hidden />
        <div className="overflow-hidden flex-1">
          <p className="animate-marquee whitespace-nowrap text-sm font-medium">{text}   •   {text}</p>
        </div>
      </div>
    </div>
  );
}
