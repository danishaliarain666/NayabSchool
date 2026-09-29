import { Link } from 'react-router-dom';
import { BookOpen, FileText, Award } from 'lucide-react';

export default function Academics() {
  return (
    <div className="animate-fade-in">
      <section className="hero-navy py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Academics & Curriculum</h1>
          <p className="text-blue-100/90 mt-2">English-medium education from Nursery to Class 10</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-6">
        {[
          { icon: BookOpen, title: 'Classes', desc: 'Nursery, KG-1, KG-2, and Class 1 through 10 with structured syllabus.' },
          { icon: FileText, title: 'Examinations', desc: 'Mid Term, Final Term, and annual results with official marksheets.' },
          { icon: Award, title: 'Progress Reports', desc: 'A4 report cards with grades, attendance, and principal certification.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card text-center">
            <Icon className="w-10 h-10 text-gold mx-auto mb-3" />
            <h2 className="font-bold text-lg">{title}</h2>
            <p className="text-sm text-gray-500 mt-2">{desc}</p>
          </div>
        ))}
      </div>
      <p className="text-center pb-12">
        <Link to="/portal" className="btn-navy inline-block">Check Results Online</Link>
      </p>
    </div>
  );
}
