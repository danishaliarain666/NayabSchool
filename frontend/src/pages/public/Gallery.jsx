import { useEffect, useState } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import SafeImage from '../../components/SafeImage';

const categories = [
  { key: '', label: 'All' },
  { key: 'events', label: 'Events' },
  { key: 'class_activities', label: 'Class Activities' },
  { key: 'annual_function', label: 'Annual Function' },
];

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/public/gallery', { params: category ? { category } : {} })
      .then((r) => setItems(r.data.data)).finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="animate-fade-in">
      <section className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Photo Gallery</h1>
          <p className="text-blue-100 mt-2">Memories from our school events and activities</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((c) => (
            <button key={c.key} onClick={() => setCategory(c.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${category === c.key ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>
              {c.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-xl aspect-square bg-gray-200">
                <SafeImage src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div>
                    <p className="text-white font-medium text-sm">{item.title}</p>
                    <p className="text-white/70 text-xs capitalize">{item.category?.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
