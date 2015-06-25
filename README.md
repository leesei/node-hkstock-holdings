# node-hkstock-holdings

Scrape [HKExnews](http://www.hkexnews.hk/sdw/search/search_sdw_c.asp) share holdings page and output JSON data.

HKExnews will return data for the previous day if the day requested is a public holiday.

If the period is greater than `30` calender days, weekly data for each Friday within the period will be used.

> Note: `Date` object prototype will be extended by this package

## Installation

```bash
npm install hkstock-holdings
```

## Usage

See [bin/hkstock-holdings](bin/hkstock-holdings).

```sh
bin/hkstock-holdings 5 -j
```

## Data Returned

```javascript
var _result = {
    code,  // code of the stock
    name,  // name of the stock
    // period specified by user
    startDate,
    endDate,
    // actual dates where data is retrieved
    // this is a subset of the input period (minus public holidays)
    period,
    series  // array with each element corresponding to data of one
            // parti over the period, filling missing records and have
            // some statistics computed, suitable for plotting
};
```

## Debug

Following `needle`, `hkstock-holdings` uses [visionmedia/debug](https://github.com/visionmedia/debug) to enable debug message at runtime.
It defines two scopes: `stockholding:main` and `stockholding:scraper`.
Also check the comments in [lib/scraper.js](lib/scraper.js) for the expected content of DOM elements.

```sh
DEBUG=stockholding:main,stockholding:scraper bin/hkstock-holdings -vB 5 -j
# adding scrapebp to the mix
DEBUG=stockholding:main,stockholding:scraper,scrapebp bin/hkstock-holdings -vB 5 -j
```

## Performance

> `user` field can be taken as the time spent by this (and under-lying) modules

### 20140211

```sh
time ./bin/hkstock-holdings 1 -t 1m -e 2014-01-31 -j

real    0m8.275s
user    0m2.512s
sys     0m0.288s
```

```sh
time ./bin/hkstock-holdings 700 -t 1m -e 2014-01-31 -j

real    0m8.108s
user    0m2.360s
sys     0m0.196s
```

### 20140223

```sh
time ./bin/hkstock-holdings 1 -t 1m -e 2014-01-31 -j

real    0m7.342s
user    0m2.188s
sys     0m0.164s
```

```sh
time ./bin/hkstock-holdings 700 -t 1m -e 2014-01-31 -j

real    0m5.460s
user    0m2.124s
sys    0m0.184s
```
