import { Builder, Browser, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import fs from 'fs';
import { downloadAddon, sleep, switchToWindowWithUrl } from './helpers.js';

const timestamp = new Date().toISOString();
const isGhosteryEnabled = Boolean(
  process.argv.find((arg) => arg === '--with-ghostery'),
);
const isRegionEU = Boolean(process.argv.find((arg) => arg === '--EU'));
const isRegionUS = Boolean(process.argv.find((arg) => arg === '--US'));

let region = 'GLOBAL';
let outputPath = 'output/time';
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

const addonUUID = 'd56a5b99-51b6-4e83-ab23-796216679614';

const options = new firefox.Options();
options.setPreference(
  'extensions.webextensions.uuids',
  `{"firefox@ghostery.com": "${addonUUID}"}`,
);
// options.addArguments("--headless");

if (isGhosteryEnabled) {
  options.addArguments('-profile', 'profiles/withGhostery');
  outputPath += '/withGhostery';
} else {
  options.addArguments('-profile', 'profiles/withoutGhostery');
  outputPath += '/withoutGhostery';
}

const outputStream = fs.createWriteStream(`${outputPath}/${timestamp}.txt`);

const driver = await new Builder()
  .forBrowser(Browser.FIREFOX)
  .setFirefoxOptions(options)
  .build();

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
    const addon = await downloadAddon(
      'https://github.com/ghostery/ghostery-extension/releases/download/v8.9.15/ghostery-firefox-v8.9.15.zip',
    );

    await driver.installAddon(addon, true);

    if (!fs.existsSync('profiles/withGhostery/onboarded')) {
      await driver.wait(
        async () => (await driver.getAllWindowHandles()).length === 2,
      );
      console.log('INFO: Ghostery onboarding opened.');

      await switchToWindowWithUrl(
        driver,
        `moz-extension://${addonUUID}/app/templates/onboarding.html`,
      );
      await (
        await driver.wait(until.elementLocated(By.css('ui-button button')))
      ).click();
      await driver.wait(
        until.elementLocated(
          By.css('ui-onboarding-outro-success-view section'),
        ),
      );
      console.log('INFO: Ghostery onboarding completed.');

      await driver.get(
        `moz-extension://${addonUUID}/app/templates/autoconsent.html`,
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

      fs.writeFileSync('profiles/withGhostery/onboarded', '');
    }
  }

  console.log(`INFO: Open websites from for region: ${region}.`);

  if (isGhosteryEnabled) {
    // Wait for Ghostery extension to download fresh Ad-blocking filters
    await sleep(1000 * 20);
  }

  for (const url of urls) {
    const now = new Date().toISOString();
    try {
      await driver.get(url);
      logPageLoadTime(n, url, now);

      await sleep(1000 * 2);
    } catch (error) {
      console.error(`LOG=${JSON.stringify({ index: n, url })}`);
      console.error(error);
    }

    n++;
  }
} finally {
  await driver.quit();
  outputStream.close();
}
