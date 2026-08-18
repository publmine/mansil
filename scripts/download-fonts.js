const fs = require('fs');
const path = require('path');
const https = require('https');

const fontsDir = path.join(__dirname, '..', 'assets', 'fonts');

// Ensure assets/fonts directory exists
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fonts = {
  'Pretendard-Regular.otf': 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.otf',
  'Pretendard-Medium.otf': 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Medium.otf',
  'Pretendard-SemiBold.otf': 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-SemiBold.otf',
  'Pretendard-Bold.otf': 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf'
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: HTTP Status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  console.log('Starting offline font assets download...');
  for (const [filename, url] of Object.entries(fonts)) {
    const dest = path.join(fontsDir, filename);
    console.log(`Downloading ${filename} from ${url}...`);
    try {
      await downloadFile(url, dest);
      console.log(`Successfully saved ${filename}`);
    } catch (err) {
      console.error(`Error downloading ${filename}:`, err);
      process.exit(1);
    }
  }
  console.log('All offline font assets successfully downloaded!');
}

main();
