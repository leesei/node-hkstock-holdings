 "use strict";

var util = require('util');

var async = require('async');
var clone = require('scrapebp/node_modules/clone');
var debug = require('scrapebp/node_modules/debug')('stockholding:main');
var _ = require('lodash');
var ScrapeBp = require('scrapebp');

require('./date-ext');
var HkStockHoldingScraper = require('./scraper');

// pad num to string representation of length len
function padZeros(num, len) {
  var s = parseInt(num)+'';
  while (s.length < len) s = '0' + s;
  return s;
}

function expandPeriodToDays(timePeriod) {
  var period = [];
  var date = timePeriod.startDate;
  var endDate = timePeriod.endDate;
  var daysDiff = Math.ceil((timePeriod.endDate - timePeriod.startDate) / (1000 * 3600 * 24));
  if (daysDiff > 30) {
    // week mode, return list of Fridays within the period
    while (date <= endDate) {
      // get the first Friday
      if (date.getDay() === 5){
        break;
      }
      date = date.getNextDay();
    }

    // loop through weeks
    while (date <= endDate) {
      period.push(date);
      date = date.getNextDay(7);
    }
  } else {
    // day mode, return every day within the period (except Sundays)
    while (date <= endDate) {
      if (date.getDay() !== 0){
        // HKEX will return previous days's data on Sundays
        period.push(date);
      }
      date = date.getNextDay();
    }
  }
  return period;
}

function sum(total, current) {
  return total + current;
}

function stats(series) {
  var r = {mean: 0, variance: 0, deviation: 0}, t = series.length;
  for(var m, s = 0, l = t; l--; s += series[l]);
  for(m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(series[l] - m, 2));
  return r.deviation = Math.sqrt(r.variance = s / t), r;
}

module.exports = function (opts, callback) {
  var today = new Date();
  today.setHours(0,0,0);

  // normalize opts
  var _opts = clone(util._extend({
    timePeriod: {
      startDate: today,
      endDate: today,
    },
    code: null,
    id: '',
    name: ''
  }, opts));
  // normalize _opts after extend
  _opts.timePeriod.startDate.setHours(0,0,0);
  _opts.timePeriod.endDate.setHours(0,0,0);
  _opts.code = padZeros(_opts.code, 5);

  var reqbody = {
    txt_today_d: padZeros(today.getDate(), 2),
    txt_today_m: padZeros(today.getMonthSane(), 2),
    txt_today_y: padZeros(today.getFullYear(), 4),
    current_page: '1',
    stock_market: 'HKEX',
    IsExist_Slt_Stock_Id: 'False',
    IsExist_Slt_Part_Id: 'False',
    rdo_SelectSortBy: 'Shareholding',
    // to be filled later
    sel_ShareholdingDate_d: null,
    sel_ShareholdingDate_m: null,
    sel_ShareholdingDate_y: null,
    txt_stock_code: _opts.code,
    txt_stock_name: '',
    txt_ParticipantID: _opts.id,
    txt_Participant_name: _opts.name
  };

  var scrapebp_opts = {};
  // url to scrape
  scrapebp_opts.url = 'http://www.hkexnews.hk/sdw/search/search_sdw_c.asp';
  // scrapebp_opts.url = 'http://httpbin.org/post';
  scrapebp_opts.method = 'POST';
  scrapebp_opts.body = reqbody;
  scrapebp_opts.needle_opts = {
    json: false
  };

  // expand timePeriod to days array
  var period = expandPeriodToDays(opts.timePeriod);
  if (opts.verbose) {
    console.log("startDate: %s  endDate: %s (%d days)",
      opts.timePeriod.startDate.toISODateString(),
      opts.timePeriod.endDate.toISODateString(),
      period.length);
    console.log(period);
  }

  async.map(
    period,
    function scrapeForDate(date, done) {
      reqbody.sel_ShareholdingDate_d = padZeros(date.getDate(), 2);
      reqbody.sel_ShareholdingDate_m = padZeros(date.getMonthSane(), 2);
      reqbody.sel_ShareholdingDate_y = padZeros(date.getFullYear(), 4);
      if (opts.dumpBody) {
        console.log(reqbody);
      }

      debug("getting %s @%s", _opts.code, date.toISODateString());
      var scrapebp = ScrapeBp(scrapebp_opts);

      scrapebp.on('request', function (req) {
        if (opts.verbose) {
          console.log("- request ready");
        }
      });

      scrapebp.on('headers', function (headers) {
        if (opts.verbose) {
          console.log("- headers ready");
          debug(headers);
        }
      });

      scrapebp.on('redirect', function (url, remaining) {
        if (opts.verbose) {
          console.log("- redirects to: %s (%d remaining)", url, remaining);
        }
      });

      scrapebp.on('$ready', function (url, $) {
        if (opts.verbose) {
          console.log("- $ ready");
          // console.log($.html());
        }

        // invoke our scraper
        var scarper = HkStockHoldingScraper(_opts);
        scarper.scrape($, done);
      });
    },
    function transformResults(err, results) {
      // async.map() collated the results over the period
      if (err) {
        // if any of the processing produced an error
        return callback(err);
      }

      // HKEX will return previous day's data on public holidays
      // remove them by making 'date' unique
      results = _.uniq(results, true, 'date');
      debug("results");
      debug(JSON.stringify(results, null, 2));

      // output for caller
      var output = {
        code: results[0].code,
        name: results[0].name,
        // user input for computing `period`
        startDate: _opts.timePeriod.startDate.toISODateString(),
        endDate: _opts.timePeriod.endDate.toISODateString(),
        // actual dates where data is retrieved
        // this is a subset of the input period (minus public holidays)
        period: _.pluck(results, 'date'),
        series: null  // array with each element corresponding to data of one
                      // parti over the period, filling missing records and have
                      // average holding computed, ready for plotting
      };

      // insert date to records of each day and flatten them to a single array
      var flattened = [];
      _.map(results, function (result) {
        flattened.push(result.records.map(function (record) {
          // add date to each record
          return _.assign(record, { date: result.date });
        }));
      });

      // map each parti to its records and fill missing records
      var _seriesPair = _(flattened).flatten(true)
        .groupBy('name')
        .mapValues(function (records, name) {
          // detect and fill missing records
          if (records.length === output.period.length) {
            return records;
          }

          console.log('"%s" has missing record (%d v %d)',
            name, records.length, output.period.length);
          var stubRecord = { shares: 0, percent: 0 };
          var avail = _.groupBy(records, 'date');
          // console.log(avail);
          return _.map(output.period, function (date) {
            // note: groupBy()'s value is an array
            return (avail[date])? avail[date][0] : stubRecord;
          });
        });

        // for debugging
        // output.seriesPair = _seriesPair.mapValues(function (records) {
        //   // the series shall contain only the variants
        //   return _.map(records, function (record) {
        //     return _.pick(record, [ 'shares', 'percent', 'date' ]);
        //   });
        // }).value();

        // for each parti create a serialized record from the records
        // also add statistics
        output.series = _seriesPair.map(function (records, name) {
          var record = {
            name: name,
            id: records[0].id || '',
            shares: _.pluck(records, 'shares'),
            percent: _.pluck(records, 'percent'),
          };

          // calculate statistics for this participant
          var s = stats(record.shares);
          record.sharesAvg = s.mean.toFixed(0);
          record.sharesSD = s.deviation.toFixed(0);
          record.percentAvg = (_.reduce(record.percent, sum) / record.percent.length).toFixed(2);

          var _holdingDelta = _(record.shares).map(function (holding, index) {
            if (index === 0){
              return 0;
            }
            return (holding - record.shares[index-1]);
          });
          record.volSell = 0;
          record.volBuy = 0;
          record.volume = 0;
          _holdingDelta.forEach(function (delta) {
            if (delta === 0)
              return true;

            if (delta < 0) {
              record.volSell += -delta;
              record.volume += -delta;
            }
            else if (delta > 0) {
              record.volBuy += delta;
              record.volume += delta;
            }
          });
          record.volumeDelta = _holdingDelta.value();
          return record;
        })
        .sortBy(function (record) { return -record.sharesAvg; }).value();

      callback(null, output);
    }
  );
};

