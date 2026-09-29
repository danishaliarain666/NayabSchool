const pool = require('../config/db');
const { getFeeStructureText } = require('../utils/feeCalculator');

async function getSettings() {
  const [rows] = await pool.query('SELECT setting_key, setting_value FROM school_settings');
  return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
}

async function getWebsiteSection(pageKey, sectionKey) {
  const [rows] = await pool.query(
    'SELECT content FROM website_content WHERE page_key = ? AND section_key = ? AND is_active = 1',
    [pageKey, sectionKey]
  );
  return rows[0]?.content || '';
}

function isInScope(question, settings) {
  const q = question.toLowerCase();
  const scope = [
    'school', 'nayab', 'admission', 'fee', 'result', 'portal', 'student', 'teacher', 'class',
    'login', 'admin', 'attendance', 'mark', 'exam', 'website', 'help', 'contact', 'timing',
    'gallery', 'about', 'announcement', 'skool', 'اسکول', 'نتیجہ', 'فیس', 'داخلہ', 'طالب', 'استاد',
    'پورٹل', 'مدرس', 'تعلیم', 'کلاس', 'نتیجہ', 'کارڈ', 'رزلٹ',
  ];
  return scope.some((k) => q.includes(k));
}

exports.chat = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ success: false, message: 'Question is required.' });
    }

    const q = question.toLowerCase();
    const settings = await getSettings();

    if (!isInScope(q, settings)) {
      return res.json({
        success: true,
        data: {
          answer: `Sorry, I can only help with Nayab English Grammar High School website and school-related questions.\n\nPlease contact the school directly:\n📞 ${settings.phone || 'Via Instagram/WhatsApp'}\n📧 ${settings.email || 'nayab.h.s.mirwah@gmail.com'}\n📍 ${settings.address || 'Mirwah Gorchani, Mirpurkhas'}\n📱 Instagram: @nayab.h.s.mirwah`,
          source: 'fallback',
        },
      });
    }

    let answer = '';
    let source = 'database';

    if (/fee|فیس| fees/.test(q)) {
      answer = `**Fee Structure (Monthly):**\n${settings.fee_structure || getFeeStructureText()}\n\nContact school office for admission fee details.`;
    } else if (/admission|dakhla|داخلہ|apply/.test(q)) {
      const admissions = await getWebsiteSection('admissions', 'process');
      const fees = settings.fee_structure || getFeeStructureText();
      answer = `**Admissions:**\n${admissions || 'Visit Admissions page on website or contact school office.'}\n\n**Fees:**\n${fees}`;
    } else if (/timing|time|schedule|گھنٹ|وقت/.test(q)) {
      answer = settings.school_timing || settings.office_hours || `School timings: ${await getWebsiteSection('contact', 'timing') || 'Monday–Saturday: 8:00 AM – 2:00 PM (Contact school to confirm)'}`;
    } else if (/result|marks|card|نتیجہ|رزلٹ/.test(q)) {
      answer = `**Check Result (No Login):**\n1. Go to **Student Portal** (/portal)\n2. Select Class + Roll Number\n3. Click Search\n4. Download **PDF Result Card**\n\nAnnual Examination 2025-26 results are available for enrolled students.`;
    } else if (/portal|roll|class/.test(q)) {
      answer = `**Student Portal:**\n- Menu → Student Portal\n- Enter **Class** and **Roll Number** only\n- View attendance, results, fees, announcements\n- No password needed`;
    } else if (/login|admin|teacher|staff/.test(q)) {
      answer = `**Staff Login:**\n- Click **Staff Login** (top menu)\n- Admin: admin@nayabgrammar.edu.pk\n- Teacher: teacher@nayabgrammar.edu.pk\n\n(Passwords provided by school admin)`;
    } else if (/contact|phone|email|address|رابطہ/.test(q)) {
      answer = `**Contact Nayab School:**\n📍 ${settings.address}\n📞 ${settings.phone}\n📧 ${settings.email}\n📱 Instagram: ${settings.instagram_url || '@nayab.h.s.mirwah'}\n📘 Facebook: ${settings.facebook_page_name || 'Nayab English Grammar High School Mirwah Gorchani'}`;
    } else if (/about|history|vision|mission|تعارف/.test(q)) {
      answer = `**About ${settings.school_name}:**\n${settings.tagline || ''}\n\n${settings.school_description?.slice(0, 400) || settings.history?.slice(0, 400) || 'Visit About page for full details.'}`;
    } else if (/gallery|photo|picture|تصویر/.test(q)) {
      answer = `View school photos and events on **Gallery** page. Official photos from Instagram @nayab.h.s.mirwah`;
    } else if (/promot|next class|ترقی/.test(q)) {
      answer = `Admin can promote students to next class from **Admin → Students → Promote Class** after annual results. Students who passed exams are enrolled in the next class automatically.`;
    } else if (/leaving|certificate|slc|ترک/.test(q)) {
      answer = `Admin can generate **Leaving Certificate PDF** from Admin → Students → select student → Leaving Certificate.`;
    } else {
      answer = `Welcome to **${settings.school_name}**!\n${settings.tagline || ''}\n\nI can help with: admissions, fees, results, portal, login, contact, timings.\n\nAsk me anything about the school website!`;
    }

    res.json({ success: true, data: { answer, source } });
  } catch (err) {
    next(err);
  }
};
