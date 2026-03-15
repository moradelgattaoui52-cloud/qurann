const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Load Qur'an data ───────────────────────────────────────────────────────
const dataPath = path.join(__dirname, 'data', 'quran.json');
let quranData = null;

function loadData() {
  if (!fs.existsSync(dataPath)) {
    console.error('❌  data/quran.json not found. Run: node scripts/fetch-data.js');
    return false;
  }
  try {
    quranData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`✅  Loaded ${quranData.surahs.length} surahs`);
    return true;
  } catch (e) {
    console.error('❌  Failed to parse quran.json:', e.message);
    return false;
  }
}

// ─── API Routes ──────────────────────────────────────────────────────────────

// List all surahs
app.get('/api/surahs', (req, res) => {
  if (!quranData) return res.status(503).json({ error: 'Data not loaded' });
  const list = quranData.surahs.map(s => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    numberOfAyahs: s.numberOfAyahs,
    revelationType: s.revelationType
  }));
  res.json(list);
});

// Get single surah with all ayahs
app.get('/api/surahs/:number', (req, res) => {
  if (!quranData) return res.status(503).json({ error: 'Data not loaded' });
  const num = parseInt(req.params.number);
  const surah = quranData.surahs.find(s => s.number === num);
  if (!surah) return res.status(404).json({ error: 'Surah not found' });
  res.json(surah);
});

// Get a specific ayah
app.get('/api/surahs/:number/ayahs/:ayah', (req, res) => {
  if (!quranData) return res.status(503).json({ error: 'Data not loaded' });
  const num = parseInt(req.params.number);
  const ayahNum = parseInt(req.params.ayah);
  const surah = quranData.surahs.find(s => s.number === num);
  if (!surah) return res.status(404).json({ error: 'Surah not found' });
  const ayah = surah.ayahs.find(a => a.numberInSurah === ayahNum);
  if (!ayah) return res.status(404).json({ error: 'Ayah not found' });
  res.json(ayah);
});

// Search across all ayahs (translation text)
app.get('/api/search', (req, res) => {
  if (!quranData) return res.status(503).json({ error: 'Data not loaded' });
  const q = (req.query.q || '').toLowerCase().trim();
  const edition = (req.query.edition || 'translation').toLowerCase();

  if (!q || q.length < 2) return res.json([]);

  const results = [];
  for (const surah of quranData.surahs) {
    for (const ayah of surah.ayahs) {
      const textToSearch = edition === 'arabic'
        ? (ayah.text || '')
        : (ayah.translation || ayah.text || '');
      if (textToSearch.toLowerCase().includes(q)) {
        results.push({
          surahNumber: surah.number,
          surahName: surah.englishName,
          surahArabic: surah.name,
          ayahNumber: ayah.numberInSurah,
          globalNumber: ayah.number,
          text: ayah.text,
          translation: ayah.translation
        });
        if (results.length >= 50) break;
      }
    }
    if (results.length >= 50) break;
  }
  res.json(results);
});

// ─── Serve index for all other routes ───────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ───────────────────────────────────────────────────────────────────
const ok = loadData();
app.listen(PORT, () => {
  console.log(`\n🕌  Qur'an App running at http://localhost:${PORT}`);
  if (!ok) {
    console.log('⚠️   Run "node scripts/fetch-data.js" first to download Qur\'an data\n');
  }
});
