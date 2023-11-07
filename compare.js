import fs from 'fs';
import avg from './src/readTimeLogs/avg.js';
import { createFileList } from './src/helpers.js';

// let region = 'GLOBAL';
let region = 'EU';

// const isRegionEU = Boolean(process.argv.find((arg) => arg === '--EU'));
// const isRegionUS = Boolean(process.argv.find((arg) => arg === '--US'));

// if (isRegionEU && isRegionUS) {
//   throw new Error('Cannot use more than one region at the same time.');
// } else if (isRegionUS) {
//   region = 'US';
// } else if (isRegionEU) {
//   region = 'EU';
// }

const urls = fs
  .readFileSync(`input/${region}/urls.txt`, { encoding: 'utf8' })
  .split(/\r?\n/)
  .map((l) => `${l}`);

const fileListWith = createFileList(`output/time/withGhostery/Firefox`);
const fileListWithout = createFileList(`output/time/withoutGhostery/Firefox`);

// console.log('With Ghostery');
printResults(urls, fileListWith, fileListWithout);
// printResults(urls, fileList);
// console.log('Without Ghostery');
// printResults(urls, fileListWithout);

// function printResults(urls, fileList) {
function printResults(urls, fileListWith, fileListWithout) {
  const statsWith = [];
  const statsWithout = [];
  const loadTimes = [];
  const withGhostery = [];
  const withoutGhostery = [];
  let avgsWithGhostery = '';
  let avgsWithoutGhostery = '';

  for (const fileName of fileListWith) {
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
        loadTimes.push({ url, loadTime: null });
      }

      if (index === 1) {
        timing.startAt = timestamp;
      }
      if (index === lines.length) {
        timing.endAt = timestamp;
        timing.duration = (timing.endAt - timing.startAt) / 1000 / 60;
      }

      statsWith.push({ url, loadTime });
    });
  }
  avgsWithGhostery = avg(urls, statsWith);

  for (const fileName of fileListWithout) {
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
        loadTimes.push({ url, loadTime: null });
      }

      if (index === 1) {
        timing.startAt = timestamp;
      }
      if (index === lines.length) {
        timing.endAt = timestamp;
        timing.duration = (timing.endAt - timing.startAt) / 1000 / 60;
      }

      statsWithout.push({ url, loadTime });
    });
  }
  avgsWithoutGhostery = avg(urls, statsWithout);

  // console.log('Average urls load time:');
  // console.log(avgsWithGhostery);
  // console.log(avgsWithoutGhostery);

  const timeToCompareWithAndWithout = compareTime(
    urls,
    avgsWithGhostery,
    avgsWithoutGhostery,
  );
}

function compareTime(urls, avgsWithGhostery, avgsWithoutGhostery) {
  const howMuchFaster = Object.keys(urls)
    .map((url) => `{"url":"${urls[url]}", "loadTime":""}`)
    .map((jsonString) => JSON.parse(jsonString));

  const transformedHowLongWithGhostery = Object.keys(avgsWithGhostery)
    .map((url) => `{"url":"${url}", "loadTime":"${avgsWithGhostery[url]}"}`)
    .map((jsonString) => JSON.parse(jsonString));

  const transformedHowLongWithoutGhostery = Object.keys(avgsWithoutGhostery)
    .map((url) => `{"url":"${url}", "loadTime":"${avgsWithoutGhostery[url]}"}`)
    .map((jsonString) => JSON.parse(jsonString));

  // console.log(howMuchFaster);

  transformedHowLongWithoutGhostery.forEach((item) => {
    // console.log(item.url); // to jest ok, pokazuje url
    const website = item.url;
    const loadTimeHere = item.loadTime;
    // przejsc po transformedHowLongWithoutGhostery.url i wyszukac danego urla w transformedHowLongWithGhostery
    if (
      website ==
      transformedHowLongWithGhostery.find((element) => element == website)
    ) {
      console.log(transformedHowLongWithGhostery.url);
    }

    console.log(website);
  });

  // if (
  //   transformedHowLongWithoutGhostery.loadTime[i] > 0 &&
  //   transformedHowLongWithGhostery.loadTime[i] > 0
  // ) {
  // console.log(transformedHowLongWithGhostery[1]);
  // console.log(transformedHowLongWithoutGhostery[1]);

  // howMuchFaster[a] =
  //   transformedHowLongWithoutGhostery[a] /
  //   transformedHowLongWithGhostery[a];
  // howMuchFaster[howLongWithGhostery[0]].push(howLongWithGhostery[1]);
  // }

  // teraz trzeba podzielić czas without przez with dla danego urla i wynik tego wrzucić do howMuchFaster
  // for (const a in transformedHowLongWithoutGhostery) {
  //   if (transformedHowLongWithoutGhostery[a] > 0) {
  //     console.log(transformedHowLongWithGhostery[a]);
  //     console.log(transformedHowLongWithoutGhostery[a]);

  //     howMuchFaster[a] =
  //       transformedHowLongWithoutGhostery[a] /
  //       transformedHowLongWithGhostery[a];
  //     // howMuchFaster[howLongWithGhostery[0]].push(howLongWithGhostery[1]);
  //   }
  // }

  // teraz trzeba wszystkie te wyniki zsumować i wyciągnąć średnią

  // console.log(howMuchFaster);
  // console.log(transformedHowLongWithGhostery[1]);
  // console.log(transformedHowLongWithoutGhostery[1]);

  // for (const url of urls) {
  //   if (avgs[url].length === 0) {
  //     avgs[url] = null;
  //     continue;
  //   }

  //   let avg = 0;
  //   const actualLoadTime = avgs[url].filter((x) => !!x);
  //   for (const loadTime of actualLoadTime) {
  //     avg += loadTime;
  //   }
  //   avgs[url] = Number((avg / actualLoadTime.length).toFixed(3));
  // }
  // return avgs;
  // // trzeba forEach aby każdy przez każdy dla danego urla

  // avgsWithGhostery.forEach((stat) => {
  //   stat = avgsWithGhostery.split('\n');
  // });
  // if (statsWithout / statsWith == 0) {
  //   howMuchFaster = 0;
  // }
  // if (!(statsWithout / statsWith > 0)) {
  //   howMuchFaster = statsWithout / statsWith;
  // }

  // faster.push({ urls, howMuchFaster });
}

// for (const fileName of fileListWithout) {
//   // console.log(`Load time for: \t\t\t\t v8.11.0`);
//   // console.log(`\tFirefox with Ghostery: \t\t ${withGhostery}`);
//   // console.log(`\tFirefox without Ghostery: \t ${0}`);
//   // console.log(`\tChrome with Ghostery: \t\t ${0}`);
//   // console.log(`\tChrome without Ghostery: \t ${0}`);
// }
