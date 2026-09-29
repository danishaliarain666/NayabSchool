import { Bot, BookOpen, Users, GraduationCap, FileText, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QUICK_QUESTIONS } from '../../data/assistantKnowledge';

const guides = [
  { icon: Users, title: 'Student / Parent Portal', steps: ['Go to Student Portal', 'Select Class + Roll Number', 'View results, attendance & fees', 'Download PDF result card'], link: '/portal' },
  { icon: FileText, title: 'Admissions', steps: ['Open Admissions page', 'Fill application form', 'Download prospectus PDF', 'Wait for school contact'], link: '/admissions' },
  { icon: GraduationCap, title: 'Teacher Portal', steps: ['Staff Login with teacher account', 'Mark absent students only', 'Add marks for students', 'View class roster'], link: '/login' },
  { icon: BookOpen, title: 'Admin Panel', steps: ['Staff Login as admin', 'Manage students, teachers, classes', 'Generate reports & export Excel', 'Manage announcements & website'], link: '/login' },
];

export default function Help() {
  return (
    <div className="animate-fade-in">
      <section className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
          <Bot className="w-12 h-12" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Website Help Center</h1>
            <p className="text-blue-100 mt-1">Learn how to use Nayab School Management System</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="card bg-primary/5 border-primary/20 mb-8 flex items-start gap-4">
          <MessageCircle className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h2 className="font-bold text-lg">Nayab School Assistant</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Click the <strong>blue chat button</strong> at the bottom-right corner of any page to ask questions in English or Urdu. The assistant guides you step-by-step.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {guides.map(({ icon: Icon, title, steps, link }) => (
            <div key={title} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg"><Icon className="w-6 h-6 text-primary" /></div>
                <h3 className="font-bold text-lg">{title}</h3>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                {steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
              <Link to={link} className="text-primary text-sm font-medium hover:underline">Go to page →</Link>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="font-bold mb-4">Common Questions</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <div key={q} className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">{q}</div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">Use the chat assistant for detailed answers to these questions.</p>
        </div>
      </div>
    </div>
  );
}
