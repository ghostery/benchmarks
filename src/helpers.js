import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import decompress from 'decompress';

export const sleep = (ms) => new Promise((r) => setTimeout(() => r(), ms));

export const switchToWindowWithUrl = async (driver, url) => {
  const handles = await driver.getAllWindowHandles();
  for (const handle of handles) {
    await driver.switchTo().window(handle);
    if ((await driver.getCurrentUrl()) === url) {
      return;
    }
  }
};

export const downloadAddon = async (url) => {
  if (url.endsWith('zip')) {
    console.log('LOG: ZIP file');
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const tempPath = fs.mkdtempSync(
      path.join(os.tmpdir(), 'ghostery-benchmarks'),
    );

    console.log('LOG: Addon temp path:', tempPath);

    const addonZipPath = path.join(tempPath, `${hash}.zip`);

    if (!fs.existsSync(addonZipPath)) {
      console.log('LOG: Downloading addon');
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      fs.writeFileSync(addonZipPath, buffer);
    }

    const addonPath = path.join(tempPath, hash);

    if (!fs.existsSync(addonPath)) {
      console.log('LOG: Unpacking addon');
      await decompress(addonZipPath, addonPath);
    }

    console.log('LOG: Addon path:', addonPath);
    return addonPath;
  }
  if (url.endsWith('crx')) {
    console.log('LOG: CRX file');
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const tempPath = fs.mkdtempSync(
      path.join(os.tmpdir(), 'ghostery-benchmarks'),
    );

    console.log('LOG: Addon temp path:', tempPath);

    const addonZipPath = path.join(tempPath, `${hash}.crx`);

    if (!fs.existsSync(addonZipPath)) {
      console.log('LOG: Downloading addon');
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      fs.writeFileSync(addonZipPath, buffer);
    }

    const addonPath = path.join(tempPath, `${hash}.crx`);

    console.log('LOG: Addon path:', addonPath);
    return addonPath;
  }
};

export const createFileList = (folderPath) => {
  const paths = [];

  for (const file of fs.readdirSync(folderPath)) {
    if (file.endsWith('.txt')) {
      paths.push(`${folderPath}/${file}`);
    }
  }
  return paths;
};
