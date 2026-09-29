import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import api from '../services/api';
import SafeImage from './SafeImage';
import { ASSISTANT_NAME, WELCOME_MESSAGE, QUICK_QUESTIONS, findAnswer } from '../data/assistantKnowledge';

const LOGO = '/uploads/branding/school-logo.jpg';

export default function NayabAssistant() {
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(LOGO);
  const [messages, setMessages] = useState([{ role: 'assistant', text: WELCOME_MESSAGE }]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/public/home').then((r) => {
      const url = r.data.data?.settings?.logo_url;
      if (url) setLogoUrl(url);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    try {
      const res = await api.post('/public/assistant/chat', { question: text });
      const answer = res.data.data?.answer || findAnswer(text);
      setMessages((m) => [...m, { role: 'assistant', text: answer }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: findAnswer(text) }]);
    }
  };

  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className={i > 0 ? 'mt-1' : ''}>
          {parts.map((part, j) =>
            part.startsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 overflow-hidden border-2 border-white ${open ? 'hidden' : ''}`}
        aria-label="Open school assistant"
      >
        <SafeImage src={logoUrl} alt="" className="w-full h-full object-cover" />
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-3rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-gray-700 flex flex-col overflow-hidden animate-fade-in">
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SafeImage src={logoUrl} alt="Nayab School" className="w-10 h-10 rounded-full object-cover bg-white border border-white/30" />
              <div>
                <p className="font-semibold text-sm">{ASSISTANT_NAME}</p>
                <p className="text-xs text-blue-100">Nayab English Grammar HS</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                }`}>
                  {renderText(m.text)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {QUICK_QUESTIONS.slice(0, 3).map((q) => (
              <button key={q} onClick={() => send(q)} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 truncate max-w-full">
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-3 border-t dark:border-gray-700 flex gap-2">
            <input
              className="flex-1 px-3 py-2 text-sm rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ask how to use the website..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
