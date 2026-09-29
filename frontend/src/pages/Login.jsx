import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Login() {
  const { login, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/teacher/students', { replace: true });
  }, [user, navigate]);

  if (authLoading) return <LoadingSpinner fullScreen />;
  if (user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success('Login successful!');
      navigate(u.role === 'admin' ? '/admin' : '/teacher/students');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.response?.status === 503 || msg === 'Internal server error') {
        toast.error('Database is off. Double-click RUN-WEBSITE.bat and wait for MySQL + Backend.');
      } else {
        toast.error(msg || 'Login failed — check email/password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Staff Login</h1>
          <p className="text-gray-500 text-sm mt-1 leading-snug">Nayab English Grammar High School, Mirwah Gorchani</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email or mobile number</label>
            <input type="text" required className="input-field" placeholder="admin@nayabgrammar.edu.pk or 03XXXXXXXXX"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} required className="input-field pr-10" placeholder="Enter password"
                value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-sm">
          <p className="font-medium text-primary mb-2">Need help signing in?</p>
          <p><strong>Admin:</strong> admin@nayabgrammar.edu.pk — password Admin@123</p>
          <p className="mt-1"><strong>Teachers:</strong> mobile (e.g. 03100000004) or teacher@nayabgrammar.edu.pk — password Teacher@123</p>
        </div>

        <Link to="/" className="mt-6 btn-secondary w-full inline-flex items-center justify-center gap-2">
          <Home className="w-4 h-4" /> Back to Homepage
        </Link>
      </div>
    </div>
  );
}
