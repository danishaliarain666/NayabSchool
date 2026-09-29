require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { calculateGrade, calculatePercentage } = require('../src/utils/gradeCalculator');

const firstNames = [
  'Muhammad Ali', 'Ahmed', 'Hassan', 'Hussain', 'Bilal', 'Usman', 'Imran', 'Kashif', 'Naveed', 'Rashid',
  'Tariq', 'Asad', 'Fahad', 'Saeed', 'Waseem', 'Ayesha', 'Fatima', 'Sana', 'Zainab', 'Shazia',
  'Rubina', 'Asma', 'Kiran', 'Nadia', 'Samina', 'Rukhsana', 'Abdul Rehman', 'Arslan', 'Danish', 'Farhan',
  'Hamza', 'Junaid', 'Kamran', 'Latif', 'Mansoor', 'Noman', 'Omar', 'Parvez', 'Qasim', 'Rizwan',
  'Salman', 'Tahir', 'Umar', 'Waqar', 'Yasir', 'Zahid', 'Amna', 'Bushra', 'Hina', 'Maria', 'Sadia',
];

const lastNames = [
  'Shaikh', 'Memon', 'Rajput', 'Soomro', 'Khoso', 'Chandio', 'Mirani', 'Baloch', 'Ansari', 'Qureshi',
  'Malik', 'Jatoi', 'Brohi', 'Kolachi', 'Palijo', 'Junejo', 'Talpur', 'Leghari', 'Mari', 'Sahito',
];

const fatherNames = [
  'Abdul Rehman', 'Muhammad Yousuf', 'Ghulam Hussain', 'Allah Dino', 'Mumtaz Ali', 'Shabbir Ahmed',
  'Nazir Hussain', 'Rafiq Ahmed', 'Sardar Ali', 'Imtiaz Hussain', 'Akbar Ali', 'Zafar Iqbal',
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function randomPhone() {
  return `03${Math.floor(100000000 + Math.random() * 899999999)}`;
}

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Creating database and tables...');
  const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
  await connection.query(schema);
  await connection.query('USE nayab_sms');

  console.log('Clearing existing data...');
  const tables = [
    'notifications', 'admission_applications', 'contact_messages', 'news', 'gallery',
    'website_content', 'announcements', 'fees', 'results', 'attendance', 'exams', 'subjects',
    'students', 'classes', 'users', 'teachers', 'school_settings',
  ];
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of tables) {
    await connection.query(`TRUNCATE TABLE ${t}`);
  }
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  const adminHash = await bcrypt.hash('Admin@123', 12);
  const teacherHash = await bcrypt.hash('Teacher@123', 12);

  console.log('Inserting school settings...');
  const brandingPath = path.join(__dirname, '../data/school-public-info.json');
  let publicInfo = {};
  if (fs.existsSync(brandingPath)) {
    publicInfo = JSON.parse(fs.readFileSync(brandingPath, 'utf8'));
  }

  const settings = [
    ['school_name', publicInfo.school_name || 'Nayab English Grammar High School, Mirwah Gorchani'],
    ['short_name', publicInfo.short_name || 'Nayab H.S Mirwah'],
    ['tagline', publicInfo.tagline || 'A Platform For Lifelong Learners'],
    ['school_description', publicInfo.school_description || 'Quality English-medium education in Mirwah Gorchani, Sindh.'],
    ['address', publicInfo.address || 'Mirwah Gorchani, District Mirpurkhas, Sindh, Pakistan'],
    ['phone', publicInfo.phone || '[Contact via Instagram/Facebook]'],
    ['email', publicInfo.email || 'nayab.h.s.mirwah@gmail.com'],
    ['instagram_url', publicInfo.instagram_url || 'https://www.instagram.com/nayab.h.s.mirwah/'],
    ['facebook_url', publicInfo.facebook_url || 'https://www.facebook.com/nayab.h.s.mirwah'],
    ['whatsapp_url', publicInfo.whatsapp_channel || ''],
    ['logo_url', publicInfo.logo_url || ''],
    ['school_photo_url', publicInfo.school_photo_url || ''],
    ['data_source', publicInfo.source || 'Public Instagram @nayab.h.s.mirwah'],
    ['established_year', '2005'],
    ['map_embed', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27800!2d69.015!3d25.525!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMirwah%20Gorchani!5e0!3m2!1sen!2spk!4v1'],
    ['hero_title', publicInfo.hero_title || 'Welcome to Nayab English Grammar High School'],
    ['hero_subtitle', publicInfo.hero_subtitle || 'A Platform For Lifelong Learners'],
    ['principal_message', publicInfo.principal_message || 'Welcome to Nayab English Grammar High School. We believe every child is a lifelong learner.'],
    ['vision', publicInfo.vision || 'To be a leading institution providing world-class English-medium education in rural Sindh.'],
    ['mission', publicInfo.mission || 'To develop confident, knowledgeable, and morally upright lifelong learners.'],
    ['history', publicInfo.history || 'Nayab English Grammar High School serves Mirwah Gorchani, District Mirpurkhas.'],
  ];
  await connection.query('INSERT INTO school_settings (setting_key, setting_value) VALUES ?', [settings]);

  console.log('Inserting teachers...');
  const teacherData = [
    ['T-001', 'Muhammad Aslam Shaikh', 'Ghulam Hussain', 'Male', '03331234567', 'aslam@school.pk', 'M.Ed', 'English', '2010-03-15'],
    ['T-002', 'Fatima Bibi Memon', 'Allah Dino', 'Female', '03339876543', 'fatima@school.pk', 'M.A', 'Mathematics', '2012-08-01'],
    ['T-003', 'Abdul Rehman Rajput', 'Mumtaz Ali', 'Male', '03335556677', 'rehman@school.pk', 'B.Ed', 'Science', '2015-01-10'],
    ['T-004', 'Sana Kolachi', 'Shabbir Ahmed', 'Female', '03334445566', 'sana@school.pk', 'M.A', 'Urdu', '2018-06-20'],
    ['T-005', 'Imran Soomro', 'Nazir Hussain', 'Male', '03337778899', 'imran@school.pk', 'B.Ed', 'Islamiat', '2016-09-05'],
    ['T-006', 'Ayesha Brohi', 'Rafiq Ahmed', 'Female', '03332223344', 'ayesha@school.pk', 'M.Ed', 'Social Studies', '2019-04-12'],
    ['T-007', 'Kashif Khoso', 'Sardar Ali', 'Male', '03336667788', 'kashif@school.pk', 'B.Sc B.Ed', 'Computer', '2020-02-28'],
    ['T-008', 'Rubina Palijo', 'Imtiaz Hussain', 'Female', '03331112233', 'rubina@school.pk', 'M.A', 'English', '2017-11-18'],
  ];

  const [teacherResult] = await connection.query(
    'INSERT INTO teachers (employee_id, full_name, father_name, gender, phone, email, qualification, subject, joining_date, address) VALUES ?',
    [teacherData.map((t) => [...t, 'Mirwah Gorchani, Mirpurkhas'])]
  );

  console.log('Inserting users...');
  await connection.query(
    'INSERT INTO users (username, email, password_hash, role, teacher_id) VALUES (?, ?, ?, ?, ?)',
    ['admin', 'admin@nayabgrammar.edu.pk', adminHash, 'admin', null]
  );
  await connection.query(
    'INSERT INTO users (username, email, password_hash, role, teacher_id) VALUES (?, ?, ?, ?, ?)',
    ['aslam', 'teacher@nayabgrammar.edu.pk', teacherHash, 'teacher', 1]
  );

  console.log('Inserting classes...');
  const classNames = [
    'Play Group', 'Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  ];
  const classInserts = [];
  classNames.forEach((name, i) => {
    classInserts.push([name, 'A', '2025-2026', (i % 8) + 1, 40]);
    if (['Class 1', 'Class 5', 'Class 8', 'Class 10'].includes(name)) {
      classInserts.push([name, 'B', '2025-2026', ((i + 2) % 8) + 1, 40]);
    }
  });
  await connection.query(
    'INSERT INTO classes (name, section, academic_year, class_teacher_id, capacity) VALUES ?',
    [classInserts]
  );

  const [classRows] = await connection.query('SELECT id, name, section FROM classes ORDER BY id');
  const feeStatuses = ['paid', 'unpaid', 'pending'];

  console.log('Inserting 50 students...');
  const studentInserts = [];
  const usedRolls = {};

  for (let i = 1; i <= 50; i++) {
    const cls = classRows[(i - 1) % classRows.length];
    if (!usedRolls[cls.id]) usedRolls[cls.id] = 0;
    usedRolls[cls.id]++;
    const roll = usedRolls[cls.id];
    const fname = randomItem(firstNames);
    const lname = randomItem(lastNames);
    const gender = fname.match(/Ayesha|Fatima|Sana|Zainab|Shazia|Rubina|Asma|Kiran|Nadia|Samina|Rukhsana|Amna|Bushra|Hina|Maria|Sadia/) ? 'Female' : (Math.random() > 0.5 ? 'Male' : 'Female');

    studentInserts.push([
      `NEGHS-2025-${String(i).padStart(4, '0')}`,
      roll,
      `${fname} ${lname}`,
      randomItem(fatherNames) + ' ' + randomItem(lastNames),
      gender,
      randomDate(new Date(2008, 0, 1), new Date(2019, 11, 31)),
      cls.id,
      cls.section,
      `House No. ${Math.floor(Math.random() * 200) + 1}, Mirwah Gorchani, Mirpurkhas`,
      randomPhone(),
      randomDate(new Date(2020, 0, 1), new Date(2025, 5, 1)),
      randomItem(feeStatuses),
    ]);
  }

  await connection.query(
    `INSERT INTO students (student_id, roll_number, full_name, father_name, gender, date_of_birth,
     class_id, section, address, phone, admission_date, fee_status) VALUES ?`,
    [studentInserts]
  );

  const [studentRows] = await connection.query('SELECT id, class_id FROM students');

  console.log('Inserting subjects and exams...');
  const subjectNames = ['English', 'Mathematics', 'Science', 'Urdu', 'Islamiat', 'Social Studies'];
  for (const cls of classRows.slice(0, 10)) {
    for (const sub of subjectNames) {
      await connection.query('INSERT INTO subjects (name, class_id) VALUES (?, ?)', [sub, cls.id]);
    }
    await connection.query(
      'INSERT INTO exams (name, academic_year, class_id, is_published) VALUES (?, ?, ?, 1)',
      ['Mid Term Examination', '2025-2026', cls.id]
    );
    await connection.query(
      'INSERT INTO exams (name, academic_year, class_id, is_published) VALUES (?, ?, ?, 1)',
      ['Final Examination', '2025-2026', cls.id]
    );
  }

  console.log('Inserting results...');
  for (const student of studentRows.slice(0, 30)) {
    const [subjects] = await connection.query('SELECT id FROM subjects WHERE class_id = ? LIMIT 6', [student.class_id]);
    const [exams] = await connection.query('SELECT id FROM exams WHERE class_id = ? LIMIT 1', [student.class_id]);
    if (!subjects.length || !exams.length) continue;

    for (const sub of subjects) {
      const marks = Math.floor(40 + Math.random() * 60);
      const pct = calculatePercentage(marks, 100);
      await connection.query(
        'INSERT INTO results (student_id, subject_id, exam_id, marks_obtained, max_marks, percentage, grade, entered_by) VALUES (?, ?, ?, ?, 100, ?, ?, 1)',
        [student.id, sub.id, exams[0].id, marks, pct, calculateGrade(pct)]
      );
    }
  }

  console.log('Inserting attendance records...');
  const dates = [];
  for (let d = 1; d <= 15; d++) {
    dates.push(`2025-06-${String(d).padStart(2, '0')}`);
  }
  for (const date of dates) {
    const absentCount = Math.floor(Math.random() * 5) + 1;
    const shuffled = [...studentRows].sort(() => Math.random() - 0.5);
    for (let j = 0; j < absentCount && j < shuffled.length; j++) {
      const s = shuffled[j];
      await connection.query(
        'INSERT IGNORE INTO attendance (student_id, class_id, date, status, marked_by) VALUES (?, ?, ?, ?, 1)',
        [s.id, s.class_id, date, 'absent']
      );
    }
  }

  console.log('Inserting fees...');
  for (const student of studentRows) {
    const status = randomItem(feeStatuses);
    const amount = 2500 + Math.floor(Math.random() * 1500);
    const paid = status === 'paid' ? amount : status === 'pending' ? Math.floor(amount * 0.5) : 0;
    await connection.query(
      'INSERT INTO fees (student_id, fee_type, amount, paid_amount, status, due_date, paid_date, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        student.id, 'Monthly Fee', amount, paid, status,
        '2025-06-01', status === 'paid' ? '2025-06-05' : null, '2025-2026',
      ]
    );
  }

  console.log('Inserting announcements, news, gallery, website content...');
  await connection.query(
    `INSERT INTO announcements (title, content, type, publish_date, created_by) VALUES
     ('Summer Vacation Notice', 'School will remain closed from 1st June to 15th August 2025 for summer vacation.', 'holiday', '2025-05-20', 1),
     ('Admission Open 2025-26', 'Admissions are open for all classes. Visit school office between 8 AM to 2 PM.', 'general', '2025-04-01', 1),
     ('Annual Result Day', 'Annual result ceremony will be held on 25th March 2025 at school auditorium.', 'event', '2025-03-10', 1),
     ('Sports Week', 'Inter-house sports week starting from 10th February 2025. All students must participate.', 'event', '2025-02-01', 1),
     ('Fee Reminder', 'Please clear pending fees before 15th of this month to avoid inconvenience.', 'urgent', '2025-06-01', 1)`
  );

  await connection.query(
    `INSERT INTO news (title, summary, content, publish_date, created_by) VALUES
     ('Science Fair 2025', 'Students showcased innovative projects at the annual science fair.', 'Our students participated enthusiastically in the science fair with projects on renewable energy, water conservation, and robotics.', '2025-03-15', 1),
     ('Debating Competition', 'Class 9 student won district level English debating competition.', 'We are proud to announce that our student secured first position in the district English debating competition.', '2025-02-20', 1),
     ('New Computer Lab', 'State-of-the-art computer lab inaugurated for senior classes.', 'A new computer lab with 25 systems has been inaugurated to enhance IT education.', '2025-01-10', 1)`
  );

  const galleryItems = publicInfo.gallery_images?.length
    ? publicInfo.gallery_images.map((g) => [g.title, g.description, g.image_url, g.category, g.is_featured || 0])
    : [
    ['Annual Function 2024', 'Students performing at annual day', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600', 'annual_function', 1],
    ['Sports Day', 'Cricket match during sports week', 'https://images.unsplash.com/photo-1461896836934- voices?w=600', 'sports', 1],
    ['Class Activity', 'Science experiment in lab', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600', 'class_activities', 1],
    ['Independence Day', 'Flag hoisting ceremony', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600', 'events', 1],
    ['Art Exhibition', 'Student artwork display', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600', 'class_activities', 0],
    ['Football Match', 'Inter-school football tournament', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600', 'sports', 1],
    ['Prize Distribution', 'Annual prize distribution ceremony', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600', 'annual_function', 1],
    ['Morning Assembly', 'Daily morning assembly', 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600', 'events', 1],
  ];
  if (!publicInfo.gallery_images?.length && galleryItems[1]) {
    galleryItems[1][2] = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600';
  }

  await connection.query(
    'INSERT INTO gallery (title, description, image_url, category, is_featured, uploaded_by) VALUES ?',
    [galleryItems.map((g) => [...g, 1])]
  );

  const webContent = [
    ['home', 'intro', 'About Our School', '[PLACEHOLDER] Nayab English Grammar High School provides quality English-medium education in Mirwah Gorchani. We focus on academic excellence, character building, and extracurricular activities.'],
    ['home', 'facilities', 'Our Facilities', 'Modern classrooms, science lab, computer lab, library, playground, and safe transport facility.'],
    ['about', 'facilities', 'School Facilities', '• Spacious Classrooms\n• Science Laboratory\n• Computer Lab\n• Library\n• Playground\n• Clean Drinking Water\n• CCTV Security'],
    ['admissions', 'requirements', 'Admission Requirements', '• Birth Certificate\n• Previous School Result (if applicable)\n• 2 Passport Size Photos\n• B-Form / CNIC Copy\n• Parent/Guardian CNIC Copy'],
    ['admissions', 'fees', 'Fee Structure', 'Play Group to Class 5: Rs. 2,500/month\nClass 6 to 8: Rs. 3,000/month\nClass 9 to 10: Rs. 3,500/month\nAdmission Fee: Rs. 5,000 (one time)'],
  ];
  await connection.query(
    'INSERT INTO website_content (page_key, section_key, title, content) VALUES ?',
    [webContent]
  );

  await connection.query(
    "INSERT INTO notifications (user_id, title, message, type) VALUES (1, 'Welcome Admin', 'School Management System is ready to use.', 'success')"
  );

  await connection.end();
  console.log('\n✅ Seed completed successfully!');
  console.log('\nLogin credentials:');
  console.log('  Admin:   admin@nayabgrammar.edu.pk / Admin@123');
  console.log('  Teacher: teacher@nayabgrammar.edu.pk / Teacher@123');
  console.log('\n50 students seeded across all classes.');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
