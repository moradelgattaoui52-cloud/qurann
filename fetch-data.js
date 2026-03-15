/**
 * fetch-data.js
 * Downloads the full Qur'an (Arabic + English translation) from alquran.cloud
 * and saves it to data/quran.json
 *
 * Usage:  node scripts/fetch-data.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUT_FILE = path.join(DATA_DIR, 'quran.json');

// alquran.cloud free public API
const ARABIC_URL = 'https://api.alquran.cloud/v1/quran/quran-uthmani';
const TRANS_URL  = 'https://api.alquran.cloud/v1/quran/en.sahih';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  console.log('⬇️  Fetching Arabic text …');
  const arabic = await get(ARABIC_URL);
  console.log('⬇️  Fetching English (Sahih International) translation …');
  const english = await get(TRANS_URL);

  if (arabic.status !== 'OK' || english.status !== 'OK') {
    console.error('API error:', arabic.status, english.status);
    process.exit(1);
  }

  // Merge Arabic + translation into one structure
  const merged = {
    edition: 'quran-uthmani + en.sahih',
    surahs: arabic.data.surahs.map((surah, si) => {
      const transSurah = english.data.surahs[si];
      return {
        number: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        englishNameTranslation: surah.englishNameTranslation,
        numberOfAyahs: surah.numberOfAyahs,
        revelationType: surah.revelationType,
        ayahs: surah.ayahs.map((ayah, ai) => ({
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          text: ayah.text,
          translation: transSurah.ayahs[ai].text,
          juz: ayah.juz,
          page: ayah.page
        }))
      };
    })
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2));
  console.log(`✅  Saved ${merged.surahs.length} surahs → ${OUT_FILE}`);
}

main().catch(err => {
  console.error('❌  Failed:', err.message);
  process.exit(1);
});
