import fs from 'fs/promises';
import path from 'path';
import express from 'express';

const app = express();
const port = 3000;
const sourceFolder = 'output/time';

app.use(express.static('www/public'));

async function readAndParseFile(filePath, folderName) {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const logs = fileContent
    .split('\n')
    .filter((line) => line.startsWith('LOG='))
    .map((line) => {
      const log = JSON.parse(line.slice(4));
      log.folderName = folderName;
      return log;
    })
    .filter((log) => log.loadTime > 0);
  return logs;
}

app.get('/data', async (req, res) => {
  try {
    const folders = await fs.readdir(sourceFolder + '/');
    const dataPromises = folders.map(async (folder) => {
      const subfolders = await fs.readdir(path.join(sourceFolder, folder));
      return Promise.all(
        subfolders.map(async (subfolder) => {
          const subfolderPath = path.join(sourceFolder, folder, subfolder);
          const stats = await fs.stat(subfolderPath);
          if (stats.isDirectory()) {
            const files = await fs.readdir(subfolderPath);
            return Promise.all(
              files.map(async (file) => {
                if (file === '.gitkeep') {
                  return;
                }
                const filePath = path.join(subfolderPath, file);
                const fileStats = await fs.stat(filePath);
                if (fileStats.isFile()) {
                  const logs = await readAndParseFile(
                    filePath,
                    subfolderPath.replace(sourceFolder, ''),
                  );
                  return logs.length > 0 ? logs : null;
                }
              }),
            );
          }
        }),
      );
    });

    const data = (await Promise.all(dataPromises)).flat(2).filter(Boolean);
    const flattenedData = data.flat(2);

    const groupedByURLAndFolder = flattenedData.reduce((acc, log) => {
      const key = `${log.url}-${log.folderName}`;
      if (!acc[key]) {
        acc[key] = { url: log.url, folderName: log.folderName, loadTimes: [] };
      }
      acc[key].loadTimes.push(log.loadTime);
      return acc;
    }, {});

    const result = Object.values(groupedByURLAndFolder).map(
      ({ url, folderName, loadTimes }) => {
        return { url, folderName, loadTimes };
      },
    );

    res.json(result);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
