/** Clean student / father name split for Pakistani school records */
const FATHER_START = /^(Muhammad|Abdul|Abu|Mir|Ghulam|Allah|Nawaz|Shah|Syed|Rana|Hafiz|Amir|Adil|Aneel|Athar|Babar|Bilal|Dilshad|Fareed|Imran|Irfan|Javed|Khalid|Mehboob|Nadeem|Naseer|Naveed|Raees|Rizwan|Sajjad|Saleem|Shabbir|Shahzad|Shoukat|Tahir|Tufail|Yameen|Yaseen|Yaqoob|Zeeshan|Asghar|Ashraf|Arif|Arshad|Ali|Ahmed|Hussain|Hassan|Ramzan|Rehman|Rasheed|Parveez|Kumar|Lal|Khan|Memon|Rajesh|Parkash|Chand|Dev|Das|Singh|Rai|Bux|Abbas|Iqbal|Jan|Alam|Raza|Anwar|Akram|Akhtar|Asif|Azim|Burhan|Faiz|Farhan|Faisal|Gulzar|Hamza|Hashir|Ibrar|Intizar|Ishaque|Israr|Jamil|Kashif|Khizar|Lutafullah|Murtaza|Mustafa|Naeem|Nazeer|Qadeer|Qayoom|Qadir|Rafique|Rao|Sabir|Sarwar|Shahid|Shakeel|Shoiab|Siddique|Tariq|Tarique|Ubaid|Umar|Usman|Waqas|Waseem|Yousuf|Zahid|Zaman|Zulfiqar|Manohar|Dileep|Vikram|Naresh|Ratnani|Bhojo|Ladhu|Chetan|Wishan|Tara|Esro|Roshan|Mehdi|Wakeel|Faheem|Hashmi|Nabil|Rashid|Minhas|Aamir|Sultan|Hayat|Ibrahim|Abdullah|Konain|Niamat|Liaquat|Ubedullah|Safarish|Farooque|Deen|Talpur|Samoon|Samnan|Ainullah|Altaf|Shafique|Kamran|Sharif|Gohar|Bahadur|Aftab|Yousaf|Nasir|Shoaib|Raouf|Laghari|Bahwesh|Mubashir|Abyan|Aslam|Ihsan|Ammad|Anas|Ayan|Iratza|Kashan|Muneem|Rustam|Wasi|Hamadullah|Musawar|Ghazanfer|Sandeep|Tanoj|Zeyan|Shahbaz|Waris|Rehan|Dhani|Bhawani|Ishfaque|Khaleeq|Raichand|Nigar|Shabeer|Munawar|Ramesh|Salman|Ameer|Vasdev|Alias|Amar|Haman|Urooj|Adnan|Abid|Noor|Raiba|Dildar|Uddin|Raj|Kumari|Masroor|Shehzad|Umair|Masroor|Shehzad|Umair)$/i;

function cleanNameRaw(raw) {
  return String(raw || '')
    .replace(/\d{10,}/g, ' ')
    .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitNameFather(raw) {
  let words = cleanNameRaw(raw).split(' ').filter(Boolean);
  if (!words.length) return null;

  // Remove repeated consecutive words (PDF bleed artefact)
  const deduped = [];
  for (const w of words) {
    if (deduped.length && deduped[deduped.length - 1].toLowerCase() === w.toLowerCase()) continue;
    deduped.push(w);
  }
  words = deduped;
  if (words.length > 10) words = words.slice(0, 10);

  let splitIdx = Math.max(1, Math.min(3, words.length - 1));
  for (let i = Math.max(1, words.length - 4); i >= 1; i--) {
    if (FATHER_START.test(words[i])) {
      splitIdx = i;
      break;
    }
  }

  if (words.length <= 3) splitIdx = 1;
  else if (words.length === 4) splitIdx = 2;

  const fullName = words.slice(0, splitIdx).slice(0, 4).join(' ');
  const fatherName = words.slice(splitIdx).slice(0, 4).join(' ') || 'N/A';
  if (!fullName || fullName.length < 2) return null;
  return { fullName, fatherName };
}

function extractGrNumber(studentId) {
  const m = String(studentId || '').match(/(\d{3,4})/);
  return m ? m[1] : null;
}

function normalizeStudentId(grNo) {
  const n = String(grNo || '').replace(/\D/g, '');
  return n ? `GR-${n}` : null;
}

module.exports = { splitNameFather, cleanNameRaw, extractGrNumber, normalizeStudentId };
