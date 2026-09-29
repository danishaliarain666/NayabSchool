import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/public/Home';
import About from './pages/public/About';
import Admissions from './pages/public/Admissions';
import Gallery from './pages/public/Gallery';
import Contact from './pages/public/Contact';
import Portal from './pages/public/Portal';
import Help from './pages/public/Help';
import Academics from './pages/public/Academics';
import AnnouncementsPublic from './pages/public/AnnouncementsPublic';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import Teachers from './pages/admin/Teachers';
import Classes from './pages/admin/Classes';
import Attendance from './pages/admin/Attendance';
import Results from './pages/admin/Results';
import Fees from './pages/admin/Fees';
import Announcements from './pages/admin/Announcements';
import WebsiteCMS from './pages/admin/WebsiteCMS';
import Submissions from './pages/admin/Submissions';
import TeacherAttendance from './pages/teacher/Attendance';
import TeacherMarks from './pages/teacher/Marks';
import TeacherStudents from './pages/teacher/Students';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/academics" element={<Academics />} />
        <Route path="/announcements" element={<AnnouncementsPublic />} />
        <Route path="/admissions" element={<Admissions />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/help" element={<Help />} />
      </Route>

      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="classes" element={<Classes />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="results" element={<Results />} />
        <Route path="fees" element={<Fees />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="website" element={<WebsiteCMS />} />
        <Route path="submissions" element={<Submissions />} />
      </Route>

      <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>}>
        <Route index element={<TeacherStudents />} />
        <Route path="dashboard" element={<TeacherStudents />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="marks" element={<TeacherMarks />} />
        <Route path="students" element={<TeacherStudents />} />
      </Route>
    </Routes>
  );
}
