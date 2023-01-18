export default function avg(urls, loadTimes) {
  const avgs = {};

  for (const url of urls) {
    avgs[url] = [];
  }

  for (const loadTime of loadTimes) {
    if (loadTime.loadTime > 0) {
      avgs[loadTime.url].push(loadTime.loadTime);
    }
  }

  for (const url of urls) {
    if (avgs[url].length === 0) {
      avgs[url] = null;
      continue;
    }

    let avg = 0;
    const actualLoadTime = avgs[url].filter((x) => !!x);
    for (const loadTime of actualLoadTime) {
      avg += loadTime;
    }
    avgs[url] = Number((avg / actualLoadTime.length).toFixed(3));
  }
  return avgs;
}
