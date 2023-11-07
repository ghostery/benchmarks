import { Builder, Browser, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';
import { downloadAddon, sleep, switchToWindowWithUrl } from './src/helpers.js';

const timestamp = new Date().toISOString();
const isRegionEU = Boolean(process.argv.find((arg) => arg === '--EU'));
const isRegionUS = Boolean(process.argv.find((arg) => arg === '--US'));
const isChromeSelected = Boolean(
  process.argv.find((arg) => arg === '--chrome'),
);
const isGhosteryEnabled = Boolean(
  process.argv.find((arg) => arg === '--with-ghostery'),
);

let region = 'GLOBAL';
let n = 1;

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

let addonUUID = 'd56a5b99-51b6-4e83-ab23-796216679614';

if (isChromeSelected) {
  addonUUID = 'agbomdmjjfglgplpnkahbcmblehajkag';
}

let options = new firefox.Options();
let selectedBrowser = 'Firefox';

if (isChromeSelected) {
  selectedBrowser = 'Chrome';
  console.log(`LOG: Selected browser: ${selectedBrowser}.`);
  options = new chrome.Options();
} else {
  console.log(`LOG: Selected browser: ${selectedBrowser}.`);
  options.setPreference(
    'extensions.webextensions.uuids',
    `{"firefox@ghostery.com": "${addonUUID}"}`,
  );
  // options.addArguments("--headless");
}

let outputPath = 'output/time';
let driver = '';
let addon = '';

if (isChromeSelected) {
  if (isGhosteryEnabled) {
    options.addArguments('--profile-directory=Default');
    options.addArguments(
      `--user-data-dir=profiles/withGhostery/${selectedBrowser}`,
    );
    outputPath += `/withGhostery/${selectedBrowser}`;

    console.log(`LOG: Installing addon for ${selectedBrowser}.`);
    addon = await downloadAddon(
      'https://github.com/ghostery/ghostery-extension/releases/download/v8.11.0/ghostery-chrome-v8.11.0.crx',
    );

    driver = await new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(options)
      .setChromeOptions(options.addExtensions(addon))
      .build();
  } else {
    options.addArguments('--profile-directory=Default');
    options.addArguments(
      `--user-data-dir=profiles/withoutGhostery/${selectedBrowser}`,
    );
    outputPath += `/withoutGhostery/${selectedBrowser}`;

    driver = await new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(options)
      .build();
  }
} else {
  if (isGhosteryEnabled) {
    options.addArguments(
      '-profile',
      `profiles/withGhostery/${selectedBrowser}`,
    );
    outputPath += `/withGhostery/${selectedBrowser}`;

    driver = await new Builder()
      .forBrowser(Browser.FIREFOX)
      .setFirefoxOptions(options)
      .build();

    console.log(`LOG: Installing addon for ${selectedBrowser}.`);
    addon = await downloadAddon(
      'https://github.com/ghostery/ghostery-extension/releases/download/v8.11.0/ghostery-firefox-v8.11.0.zip',
    );

    await driver.installAddon(addon, true);
  } else {
    options.addArguments(
      '-profile',
      `profiles/withoutGhostery/${selectedBrowser}`,
    );
    outputPath += `/withoutGhostery/${selectedBrowser}`;

    driver = await new Builder()
      .forBrowser(Browser.FIREFOX)
      .setFirefoxOptions(options)
      .build();
  }
}

const outputStream = fs.createWriteStream(`${outputPath}/${timestamp}.txt`);

driver.manage().setTimeouts({ pageLoad: 20000 });

console.log = function (msg) {
  outputStream.write(`${msg}\n`);
};

const logPageLoadTime = async (n, url, now) => {
  const navigationStart = await driver.executeScript(
    'return window.performance.timing.navigationStart',
  );
  const domComplete = await driver.executeScript(
    'return window.performance.timing.domComplete',
  );
  const totalTime = domComplete - navigationStart;
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

      await driver.wait(
        async () => (await driver.getAllWindowHandles()).length === 2,
      );
      console.log('INFO: Ghostery onboarding opened.');

      if (isChromeSelected) {
        extension = 'chrome-extension';
      }

      await switchToWindowWithUrl(
        driver,
        `${extension}://${addonUUID}/app/templates/onboarding.html`,
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
      await driver.get(
        `${extension}://${addonUUID}/app/templates/autoconsent.html`,
      );
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
    try {
      await driver.get(url);
      logPageLoadTime(n, url, now);
      await sleep(1000 * 2);

      setTimeout(async () => {
        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl === url) {
          console.log(`INFO: URL ${url} is still visible after 25 seconds.`);
        }
      }, 25000);
    } catch (error) {
      console.error(`LOG=${JSON.stringify({ index: n, url })}`);
      // console.error(error);
    }

    n++;
  }
} finally {
  await driver.quit();
  outputStream.close();
}
