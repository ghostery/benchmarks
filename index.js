import { Builder, Browser, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';
import { downloadAddon, sleep, switchToWindowWithUrl } from './src/helpers.js';
import { error } from 'console';

const timestamp = new Date().toISOString();
const isRegionEU = Boolean(process.argv.find((arg) => arg === '--EU'));
const isRegionUS = Boolean(process.argv.find((arg) => arg === '--US'));
const isChromeSelected = Boolean(
  process.argv.find((arg) => arg === '--chrome'),
);
const isFirefoxSelected = Boolean(
  process.argv.find((arg) => arg === '--firefox'),
);
const isGhosteryEnabled = Boolean(
  process.argv.find((arg) => arg === '--with-ghostery'),
);

let region = 'GLOBAL';
let n = 1;
let chromeExtension =
  'https://github.com/ghostery/ghostery-extension/releases/download/v10.2.10/ghostery-chrome.zip';
let firefoxExtension =
  'https://github.com/ghostery/ghostery-extension/releases/download/v10.2.10/ghostery-firefox.zip';

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

function whichBrowserIsSelected(isChromeSelected) {
  return isChromeSelected
    ? 'agbomdmjjfglgplpnkahbcmblehajkag'
    : 'd56a5b99-51b6-4e83-ab23-796216679614';
}
let addonUUID = whichBrowserIsSelected(isChromeSelected);

let selectedBrowser = '';
let options = ``;
let outputPath = 'output/time';
let driver = new Builder();
let addon = '';
let browserForDriver;

if (isChromeSelected) {
  selectedBrowser = 'Chrome';
  options = new chrome.Options();
  options.addArguments('--profile-directory=Default');
  if (isGhosteryEnabled) {
    options.addArguments(
      `--user-data-dir=profiles/withGhostery/${selectedBrowser}`,
    );
    outputPath += `/withGhostery/${selectedBrowser}`;

    console.log(`LOG: Installing addon for ${selectedBrowser}.`);
    addon = await downloadAddon(chromeExtension);

    options.addArguments(`--load-extension=${addon}`);
  } else {
    options.addArguments(
      `--user-data-dir=profiles/withoutGhostery/${selectedBrowser}`,
    );
    outputPath += `/withoutGhostery/${selectedBrowser}`;
  }
  browserForDriver = Browser.CHROME;
  driver = await new Builder()
    .forBrowser(browserForDriver)
    .setChromeOptions(options)
    .build();
} else if (isFirefoxSelected) {
  selectedBrowser = 'Firefox';
  options = new firefox.Options();
  options.setPreference(
    'extensions.webextensions.uuids',
    `{"firefox@ghostery.com": "${addonUUID}"}`,
  );
  // options.addArguments("--headless");
  if (isGhosteryEnabled) {
    options.addArguments(
      '-profile',
      `profiles/withGhostery/${selectedBrowser}`,
    );
    outputPath += `/withGhostery/${selectedBrowser}`;

    console.log(`LOG: Installing addon for ${selectedBrowser}.`);
    addon = await downloadAddon(firefoxExtension);
  } else {
    options.addArguments(
      '-profile',
      `profiles/withoutGhostery/${selectedBrowser}`,
    );
    outputPath += `/withoutGhostery/${selectedBrowser}`;
  }
  browserForDriver = Browser.FIREFOX;
  driver = await new Builder()
    .forBrowser(browserForDriver)
    .setFirefoxOptions(options)
    .build();
} else {
  error('No browser selected.');
}
console.log(`LOG: Selected browser: ${selectedBrowser}.`);

if (isFirefoxSelected) {
  await driver.installAddon(addon, true);
}

const outputStream = fs.createWriteStream(`${outputPath}/${timestamp}.txt`);

driver.manage().setTimeouts({ pageLoad: 20000 });

console.log = function (msg) {
  outputStream.write(`${msg}\n`);
};

const logPageLoadTime = async (n, url, now) => {
  let totalTime = 0;
  try {
    const startTime = Date.now();
    await driver.get(url);

    const navigationStart = await driver.executeScript(
      'return window.performance.timing.navigationStart',
    );
    const domComplete = await driver.executeScript(
      'return window.performance.timing.domComplete',
    );

    totalTime = domComplete - navigationStart;

    const endTime = Date.now();
    const visibleTime = (endTime - startTime) / 1000; //

    if (visibleTime < 60) {
      console.error(
        `INFO=${JSON.stringify({ index: n, url, totalTime, visibleTime })}`,
      );
    }
  } catch (error) {
    console.error(`LOG=${JSON.stringify({ index: n, url })}`);
    // console.error(error);
  }

  console.log(
    `LOG=${JSON.stringify({
      index: n,
      url,
      loadTime: totalTime,
      loadedAt: now,
    })}`,
  );
};

try {
  if (isGhosteryEnabled) {
    if (!fs.existsSync(`profiles/withGhostery/${selectedBrowser}/onboarded`)) {
      let extension = 'moz-extension';
      let chromeAddonUrl = '';

      await driver.wait(
        async () => (await driver.getAllWindowHandles()).length === 2,
      );
      console.log('INFO: Ghostery onboarding opened.');

      if (isChromeSelected) {
        extension = 'chrome-extension';
        let handles = await driver.getAllWindowHandles();
        await driver.switchTo().window(handles[1]);
        chromeAddonUrl = (await driver.getCurrentUrl()).split('/pages')[0];
        // chromeAddonUrl = chromeAddonUrl.split('/pages')[0];
      }

      await switchToWindowWithUrl(
        driver,
        `${extension}://${addonUUID}/pages/onboarding/index.html`,
      );
      await (
        await driver.wait(until.elementLocated(By.css('ui-button')))
      ).click();
      await driver.wait(
        until.elementLocated(
          By.css('ui-onboarding-outro-success-view section'),
        ),
      );
      console.log('INFO: Ghostery onboarding completed.');

      if (isChromeSelected) {
        await driver.get(
          `${chromeAddonUrl}/pages/autoconsent/index.html?host=wired.com&default=`,
        );
      } else {
        await driver.get(
          `${extension}://${addonUUID}/pages/autoconsent/index.html`,
        );
      }

      await driver
        .wait(until.elementLocated(By.css('input[type=radio]:not(:checked)')))
        .click();
      await driver
        .wait(
          until.elementLocated(
            By.css('ui-autoconsent-views-home ui-button[type=primary]'),
          ),
        )
        .click();
      await driver
        .wait(
          until.elementLocated(
            By.css('ui-autoconsent-views-confirm ui-button[type=primary]'),
          ),
        )
        .click();
      console.log('INFO: Never-Consent enabled for all pages.');
    }

    fs.writeFileSync(`profiles/withGhostery/${selectedBrowser}/onboarded`, '');
  }

  console.info(`INFO: Open websites from for region: ${region}.`);

  if (isGhosteryEnabled) {
    // Wait for Ghostery extension to download fresh Ad-blocking filters
    await sleep(1000 * 20);
  }

  await driver.executeScript('window.open()', '');
  const handle = await driver.getAllWindowHandles();
  await driver.switchTo().window(handle[0]);
  await driver.close();
  await driver.switchTo().window(handle[1]);

  for (const url of urls) {
    const now = new Date().toISOString();
    await logPageLoadTime(n, url, now);
    n++;
  }
} finally {
  await driver.quit();
  outputStream.close();
}
