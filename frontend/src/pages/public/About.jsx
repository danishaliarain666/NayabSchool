import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, History, Building2 } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function About() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/about').then((r) => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;
  const { settings, content } = data || {};
  const facilities = content?.find((c) => c.section_key === 'facilities');

  const sections = [
    { icon: History, title: 'Our History', text: settings?.history },
    { icon: Eye, title: 'Vision', text: settings?.vision },
    { icon: Target, title: 'Mission', text: settings?.mission },
    { icon: Building2, title: 'Facilities', text: facilities?.content },
  ];

  return (
    <div className="animate-fade-in">
      <section className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">About Us</h1>
          <p className="text-blue-100 mt-2 max-w-2xl">{settings?.school_name}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {sections.map(({ icon: Icon, title, text }, i) => (
          <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon className="w-6 h-6 text-primary" /></div>
              <h2 className="text-xl font-bold">{title}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">{text}</p>
          </motion.div>
        ))}

        <div className="card bg-primary/5 border-primary/20">
          <h2 className="text-xl font-bold mb-2">Principal's Message</h2>
          <p className="text-sm text-primary font-medium mb-3">{settings?.principal_name}</p>
          <p className="text-gray-600 dark:text-gray-400 italic leading-relaxed">"{settings?.principal_message}"</p>
        </div>
      </div>
    </div>
  );
}
