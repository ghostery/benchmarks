import fs from 'fs';
import path from 'path';
import { createFileList } from '../helpers.js';

const output = [];
const VOLTAGE = 230;

const numberToFixedNumber = (number, digits) => Number(number.toFixed(digits));

const paths = [
  ...createFileList('output/current/idle'),
  ...createFileList('output/current/idleWithBrowser'),
  ...createFileList('output/current/withGhostery'),
  ...createFileList('output/current/withoutGhostery'),
];

paths.forEach((filePath, k) => {
  const measurments = fs
    .readFileSync(filePath, { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((l) => l.split('\t'))
    .map((m) => [m[0], Number(m[1]) * VOLTAGE]);

  const powerAverage = powerByAverage(measurments);
  const powerIntegral = powerByIntegral(measurments);
  const duration = durationInMinutes(measurments);

  /*
    AVG unit is a watts
    INTEGRAL unit is a watts
    AVG_CTP (current to power) unit is a watt-hour
    INTEGRAL_CTP (current to power) unit is a watt-hour
    duration is in minutes
  */

  output.push({
    collectionOfCurrentSample: k + 1,
    fileName: path.basename(filePath),
    AVG: numberToFixedNumber(powerAverage, 3),
    AVG_C2P: numberToFixedNumber(powerAverage * (duration / 60), 3),
    INTEGRAL: numberToFixedNumber(powerIntegral, 3),
    INTEGRAL_C2P: numberToFixedNumber(powerIntegral * (duration / 60), 3),
    duration: numberToFixedNumber(duration, 3),
  });
});

console.log(output);

function powerByAverage(measurments) {
  const average = measurments.reduce(
    (sum, measurment) => sum + Number(measurment[1]),
    0,
  );

  return average / measurments.length;
}

function powerByIntegral(measurments) {
  const frequency = 1 / measurments.length;
  let integral = 0;

  for (let j = 1; j < measurments.length; j++) {
    const avg = (measurments[j][1] + measurments[j - 1][1]) / 2;
    integral += avg * frequency;
  }

  return integral;
}

function durationInMinutes(measurments) {
  const ONE_DAY = 86400000;
  const ONE_MINUTE = 60000;
  const startTimestamp = Date.parse(
    `2020-01-01T${measurments[0][0].split('.')[0]}Z`,
  );
  let endTimestamp = Date.parse(
    `2020-01-01T${measurments[measurments.length - 1][0].split('.')[0]}Z`,
  );

  if (endTimestamp < startTimestamp) {
    endTimestamp = endTimestamp + ONE_DAY;
  }

  const howLongItTakes = (endTimestamp - startTimestamp) / ONE_MINUTE;

  return howLongItTakes;
}
