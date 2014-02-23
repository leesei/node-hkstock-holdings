# node-hkstock-holdings

Scrape [HKExnews](hkexnews.hk/sdw/search/search_sdw_c.asp) share holdings page and output JSON data

> Note: `Date` object prototype will be extended by this package

## Installation

```bash
npm install hkstock-holdings
```

## Usage

See [bin/hkstock-holdings](bin/hkstock-holdings).

## Data Returned

```javascript
var _result = {
    code,  // code of the stock
    name,  // name of the stock
    // user input for computing `period`
    startDate,
    endDate,
    // actual dates where data is retrieved
    // this is a subset of the input peroid (minus public holidays)
    period,
    series  // array with each element corresponding to data of one
            // parti over the period, filling missing records and have
            // some statistics computed, suitable for plotting
};
```

## Performance

> `user` field can be taken as the time spent by this (and under-lying) modules

### 20140211

```
time ./bin/hkstock-holdings 1 -t 1m -e 2014-01-31 -j

real    0m8.275s
user    0m2.512s
sys     0m0.288s
```

```
time ./bin/hkstock-holdings 700 -t 1m -e 2014-01-31 -j

real    0m8.108s
user    0m2.360s
sys     0m0.196s
```

### 20140223

```
time ./bin/hkstock-holdings 1 -t 1m -e 2014-01-31 -j

real    0m7.342s
user    0m2.188s
sys     0m0.164s
```

```
time ./bin/hkstock-holdings 700 -t 1m -e 2014-01-31 -j

real    0m5.460s
user    0m2.124s
sys    0m0.184s
```
