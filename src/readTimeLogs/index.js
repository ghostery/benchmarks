import fs from 'fs';
import avg from './avg.js';
import { createFileList } from '../helpers.js';

let region = 'GLOBAL';

const timestamp = new Date().toISOString();

const isRegionEU = Boolean(process.argv.find((arg) => arg === '--EU'));
const isRegionUS = Boolean(process.argv.find((arg) => arg === '--US'));
const isChromeSelected = Boolean(
  process.argv.find((arg) => arg === '--chrome'),
);

if (isRegionEU && isRegionUS) {
  throw new Error('Cannot use more than one region at the same time.');
} else if (isRegionUS) {
  region = 'US';
} else if (isRegionEU) {
  region = 'EU';
}

let selectedBrowser = 'Firefox';
if (isChromeSelected) {
  selectedBrowser = 'Chrome';
}

const urls = fs
  .readFileSync(`input/${region}/urls.txt`, { encoding: 'utf8' })
  .split(/\r?\n/)
  .map((l) => `${l}`);

const browserWithGhostery = `withGhostery/${selectedBrowser}`;
const browserWithoutGhostery = `withGhostery/${selectedBrowser}`;

const fileListWith = createFileList(`output/time/${browserWithGhostery}`);
const fileListWithout = createFileList(`output/time/${browserWithoutGhostery}`);

// console.log('With Ghostery');
printResults(urls, fileListWith, `withGhostery`);
// console.log('Without Ghostery');
printResults(urls, fileListWithout, `withoutGhostery`);

function printResults(urls, fileList, ghostery) {
  const stats = [];
  const loadTimes = [];
  const brokenUrls = [];

  const avgsStream = fs.createWriteStream(
    `output/timeCalculated/${ghostery}/${selectedBrowser}/AverageUrlsLoadTime_${timestamp}.json`,
  );
  const durationStream = fs.createWriteStream(
    `output/timeCalculated/${ghostery}/${selectedBrowser}/UrlsLoadDuration_${timestamp}.json`,
  );
  const brokenStream = fs.createWriteStream(
    `output/timeCalculated/${ghostery}/${selectedBrowser}/BrokenUrls${timestamp}.json`,
  );

  for (const fileName of fileList) {
    const file = fs.readFileSync(fileName, { encoding: 'utf8' });
    const lines = file.split('\n');
    const timing = { startAt: 0, endAt: 0, duration: 0 };

    lines.forEach((line) => {
      if (!line.startsWith('LOG=')) {
        return;
      }

      const measurement = line.slice(4);
      const { index, url, loadTime, loadedAt } = JSON.parse(measurement);
      const timestamp = Date.parse(loadedAt) - loadTime;

      if (loadTime <= 0) {
        brokenUrls.push({ url, loadTime });
      }

      if (index === 1) {
        timing.startAt = timestamp;
      }
      if (index === lines.length) {
        timing.endAt = timestamp;
        timing.duration = (timing.endAt - timing.startAt) / 1000 / 60;
      }

      stats.push({ url, loadTime });
    });
    loadTimes.push(
      `Set ${fileName
        .split('/')
        .pop()}: Load time duration: ${timing.duration.toFixed(2)} min.`,
    );
  }
  const avgs = avg(urls, stats);

  for (const [url, loadTime] of Object.entries(avgs)) {
    if (!loadTime) {
      brokenUrls.push(url);
    }
  }

  // console.log('Average urls load time:');
  // console.log(avgs);

  // console.log('Duration of urls load time for specific set of measurements:');
  // console.log(loadTimes);

  // console.log('Urls which are broken or not loaded:');
  // console.log(brokenUrls);

  console.log = avgsStream.write(JSON.stringify(avgs));
  console.log = durationStream.write(JSON.stringify(loadTimes));
  console.log = brokenStream.write(JSON.stringify(brokenUrls));

  avgsStream.close();
  durationStream.close();
  brokenStream.close();
}
