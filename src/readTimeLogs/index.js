import fs from 'fs';
import avg from './avg.js';
import { createFileList } from '../helpers.js';

let region = 'GLOBAL';

const isRegionEU = Boolean(process.argv.find((arg) => arg === '--EU'));
const isRegionUS = Boolean(process.argv.find((arg) => arg === '--US'));

if (isRegionEU && isRegionUS) {
  throw new Error('Cannot use more than one region at the same time.');
} else if (isRegionUS) {
  region = 'US';
} else if (isRegionEU) {
  region = 'EU';
}

const urls = fs
  .readFileSync(`input/${region}/urls.txt`, { encoding: 'utf8' })
  .split(/\r?\n/)
  .map((l) => `${l}`);

const fileListWith = createFileList(`output/time/withGhostery`);
const fileListWIthout = createFileList(`output/time/withoutGhostery`);

console.log('With Ghostery');
printResults(urls, fileListWith);
console.log('Without Ghostery');
printResults(urls, fileListWIthout);

function printResults(urls, fileList) {
  const stats = [];
  const loadTimes = [];
  const brokenUrls = [];

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
      brokenUrls.push({ url, loadTime });
    }
  }

  console.log('Average urls load time:');
  console.log(avgs);

  console.log('Duration of urls load time for specific set of measurements:');
  console.log(loadTimes);

  console.log('Urls which are broken or not loaded:');
  console.log(brokenUrls);
}
