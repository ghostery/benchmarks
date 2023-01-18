# Ghostery Benchmarks

## How to start?

Install dependencies

```
npm ci
```

To run main script which opens 360 websites one by one please follow commands below. Websites are picked based on https://github.com/whotracksme/whotracks.me

Start benchmarks

```
npm start
```

Usage:

```
--US            site list for US region
--EU            site list for European region
--with-ghostery load Ghostery extension
```

Example output:
```
LOG: Addon temp path:
LOG: Downloading addon
LOG: Unpacking addon
LOG: Addon path:
INFO: Open websites from for region: EU.
LOG={"index":1,"url":"https://kingoloto.com/subscribe.html","loadTime":955,"loadedAt":"2023-05-19T02:20:32.748Z"}
LOG={"index":2,"url":"https://bananalotto.fr/subscribe.html","loadTime":860,"loadedAt":"2023-05-19T02:20:35.739Z"}
LOG={"index":359,"url":"https://krunker.io/","loadTime":2635,"loadedAt":"2023-05-19T02:48:12.686Z"}
LOG={"index":360,"url":"https://www.virgilio.it/","loadTime":1433,"loadedAt":"2023-05-19T02:48:17.331Z"}

```

## Convert the current to power based on the measurements taken from the benchmark

To measure AC current, Gravity Analog AC Current Sensor was used. All the code to gather current value is available on https://wiki.dfrobot.com/Gravity_Analog_AC_Current_Sensor__SKU_SEN0211_


Start calculate

```
npm run -- currentToPower
```


Example input:
```
10:11:50.121	0.091
10:11:50.121	0.112
10:11:50.121	0.104
10:11:50.125	0.104
10:11:50.135	0.098
10:11:50.152	0.097
10:11:50.152	0.095
```


Example output:
```
[
  {
    dataSet: 1,
    fileName: 'idle/Idle_Set1_ 2023-05-17 22-00-33.txt',
    AVG: 9.829,
    AVG_CTP: 9.826,
    INTEGRAL: 9.829,
    INTEGRAL_CTP: 9.826,
    durationInMin: 59.98
  },
  {
    dataSet: 2,
    fileName: 'idle/Idle_Set2_ 2023-05-17 22-00-33.txt',
    AVG: 9.004,
    AVG_CTP: 9.004,
    INTEGRAL: 9.004,
    INTEGRAL_CTP: 9.004,
    durationInMin: 60.00
  },
  {
    dataSet: 28,
    fileName: 'withoutGhostery/Without_Set8_2023-05-18 20-17-08.txt',
    AVG: 22.353,
    AVG_CTP: 15.852,
    INTEGRAL: 22.353,
    INTEGRAL_CTP: 15.852,
    durationInMin: 42.55
  }
]
```




## Based on the collected data from the benchmark, calculate the average time to load URLs

Start read time

```
npm run -- readTime
```

Usage:

```
--US            site list for US region
--EU            site list for European region
```

Example output:
```
With Ghostery
Average urls load time:
{
  'https://kingoloto.com/subscribe.html': 1242.125,
  'https://bananalotto.fr/subscribe.html': 1619,
  'https://www.vogue.com/': 2542.125,
  'https://krunker.io/': 2627.625,
  'https://www.virgilio.it/': 1555.75,
  'https://velvet.hu/': null
}
Duration of urls load time for specific set of measurements:
[
  'Set withGhostery/2023-05-19T02_20_04.734Z.txt: Load time duration: 27.74 min.',
  'Set withGhostery/2023-05-19T09_03_26.047Z.txt: Load time duration: 26.93 min.'
]
Urls which are broken or not loaded:
[
  { url: 'https://gooutdoors.co.uk/', loadTime: null },
  { url: 'https://dyson.fr/', loadTime: null },
  { url: 'https://velvet.hu/', loadTime: null }
]

Without Ghostery
Average urls load time:
{
  'https://kingoloto.com/subscribe.html': 3554.889,
  'https://bananalotto.fr/subscribe.html': 2802.333,
  'https://satkurier.pl/': 5574.571,
  'https://www.wexphotovideo.com/': 3290.778,
  'https://velvet.hu/': null
}
Duration of urls load time for specific set of measurements:
[
  'Set withoutGhostery/2023-05-18T18_17_18.025Z.txt: Load time duration: 40.98 min.',
  'Set withoutGhostery/2023-05-19T01_10_12.807Z.txt: Load time duration: 41.84 min.'
]
Urls which are broken or not loaded:
[
  { url: 'https://agar.io/', loadTime: -1684434429752 },
  { url: 'https://velvet.hu/', loadTime: null }
]
```

## Resolve redirect

Many website will redirect when their TLD is entered to the browser. We use simple curl script to resolve most of the redirects:

```sh
cat domains.txt | ./resolve-links.sh
```
