export const ASSISTANT_NAME = 'Nayab School Assistant';

export const WELCOME_MESSAGE = `Assalam-o-Alaikum! Welcome to Nayab English Grammar High School, Mirwah Gorchani website assistant.

Official pages: Instagram @nayab.h.s.mirwah | Facebook: Nayab English Grammar High School Mirwah Gorchani

I can help you with:
• Student Portal (results, attendance, fees)
• Admissions & contact
• Staff login (Admin & Teacher)
• Website navigation

Ask me anything in English or Urdu!`;

export const QUICK_QUESTIONS = [
  'How to check result?',
  'Student portal kese use karein?',
  'Admin login kaise karein?',
  'Admission form kahan hai?',
  'Teacher attendance mark karna',
];

const knowledge = [
  {
    keys: ['result', 'marks', 'grade', 'result card', 'نتیجہ', 'رزلٹ'],
    answer: `**Student Result Check (No Login Required):**
1. Go to **Student Portal** from the menu (/portal)
2. Select your **Class** from dropdown
3. Enter your **Roll Number**
4. Click **Search**
5. View your results, attendance, and fees
6. Click **PDF** to download your result card

Admin/Teacher can add marks from their dashboard.`,
  },
  {
    keys: ['portal', 'student portal', 'parent', 'والدین', 'طالب علم'],
    answer: `**Student / Parent Portal:**
- No login or password needed
- Only need: **Class** + **Roll Number**
- Shows: Student info, Attendance, Results, Fee status, Announcements
- Link: Menu → **Student Portal**`,
  },
  {
    keys: ['admission', 'apply', 'داخلہ', 'فارم'],
    answer: `**Admissions:**
1. Go to **Admissions** page from menu
2. Fill the admission application form
3. Download **Prospectus PDF** for fee structure & requirements
4. School will contact you after review

Admin can see applications in: Admin Panel → Submissions`,
  },
  {
    keys: ['login', 'admin', 'staff', 'password', 'لاگ ان'],
    answer: `**Staff Login:**
1. Click **Staff Login** (top menu)
2. Enter your **email** or **mobile number** and password
3. **Admin** — students, fees, results, teachers
4. **Teacher** — attendance, marks, your class

Admin email: admin@nayabgrammar.edu.pk (password from school office). Teachers use the phone number registered with the school.`,
  },
  {
    keys: ['attendance', 'absent', 'حاضری', 'غیر حاضر'],
    answer: `**Attendance (Teachers):**
1. Login as Teacher
2. Go to **Mark Attendance**
3. Select Class and Date
4. Check ONLY **absent** students
5. All others are automatically marked **Present**
6. Click Save

Students/parents can view attendance in Student Portal.`,
  },
  {
    keys: ['fee', 'fees', 'payment', 'فیس'],
    answer: `**Fee Information:**
- Students can check fee status in **Student Portal**
- Admin manages fees in: Admin Panel → Fees
- Fee statuses: Paid, Unpaid, Pending
- Contact school office for payment details`,
  },
  {
    keys: ['contact', 'phone', 'address', 'رابطہ'],
    answer: `**Contact School:**
- **Contact** page has address, phone, email, and map
- **Instagram:** @nayab.h.s.mirwah
- **WhatsApp Channel** linked on Instagram
- Submit contact form on Contact page`,
  },
  {
    keys: ['gallery', 'photo', 'تصاویر'],
    answer: `**Gallery:**
Visit **Gallery** page from menu to see school events, sports, annual functions, and class activities. Photos are from official school Instagram.`,
  },
  {
    keys: ['teacher', 'mark', 'marks', 'نمبر'],
    answer: `**Teacher - Add Marks:**
1. Login as Teacher
2. Go to **Add Marks**
3. Select Class → Student → Subject → Exam
4. Enter marks and Save
5. Grade is calculated automatically`,
  },
  {
    keys: ['student add', 'add student', 'crud', 'manage student'],
    answer: `**Admin - Manage Students:**
1. Login as Admin
2. Go to **Students**
3. **Add:** Click "Add Student" button
4. **Edit:** Click pencil icon on any row
5. **Delete:** Click trash icon
6. **Export:** Download Excel file
7. **Search:** Use search bar or Search page`,
  },
  {
    keys: ['dark', 'theme', 'mode'],
    answer: `**Dark/Light Mode:**
Click the **moon/sun icon** in the header to switch between dark and light theme.`,
  },
  {
    keys: ['announcement', 'news', 'اطلاع'],
    answer: `**Announcements:**
- Visible on **Homepage** automatically
- Admin adds/edits in: Admin Panel → Announcements
- Students see them in Student Portal too`,
  },
];

export function findAnswer(input) {
  const q = input.toLowerCase().trim();
  if (!q) return null;

  for (const item of knowledge) {
    if (item.keys.some((k) => q.includes(k.toLowerCase()))) {
      return item.answer;
    }
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('salam') || q.includes('السلام')) {
    return 'Wa Alaikum Assalam! How can I help you use the Nayab School website today?';
  }

  if (q.includes('thank')) {
    return 'You are welcome! Is there anything else you need help with?';
  }

  return `I'm not sure about that specific question. Try asking about:
• **Result check** (Student Portal)
• **Admissions** form
• **Staff login** (Admin/Teacher)
• **Attendance** marking
• **Contact** information

Or use the quick question buttons above!`;
}
