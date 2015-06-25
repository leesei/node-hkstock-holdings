 "use strict";

var debug = require('scrapebp/node_modules/debug')('stockholding:scraper');

var HkStockHoldingScraper = function (opts) {
  if (!(this instanceof HkStockHoldingScraper)) {
    return new HkStockHoldingScraper(opts);
  }

  this._opts = opts;
};

HkStockHoldingScraper.prototype.name = "HkStockHoldings-scraper";

  // $:   cheerio object for the parsed webpage
  // callbacl: callack function when done
HkStockHoldingScraper.prototype.scrape = function($, callback) {
  debug("[%s] processing ...", this.name);

  // all contents are stored in <table>'s in #tbl_Result_inner
  // NOTE: browsers will insert <tbody> to normalize the source
  var $resultInner_TableRows = $('#tbl_Result_inner').children('tr');
  // <!-- Shareholding date -->
  var $shareholdingDate = $resultInner_TableRows.eq(1).children();
  // <!-- code & name -->
  var $codeAndName = $resultInner_TableRows.eq(2).children();
  // <!-- *************  Search Result *************** -->
  var $searchResultsTable = $resultInner_TableRows.eq(10).children().children('table')
  // skip the first three rows
  var $searchResults = $searchResultsTable.children('tr').slice(3);

//*
  debug("$resultInner_TableRows:");
  // table for the search title
  debug($resultInner_TableRows.eq(0).children().html());
  debug("$shareholdingDate:");
  // table for date
  debug($shareholdingDate.html());
  debug("$codeAndName:");
  // table for stock info
  debug($codeAndName.html());
  debug("$searchResults:");
  // first and last two results
  debug($searchResults.eq(0).html());
  debug($searchResults.eq(0).text().trim());
  debug($searchResults.eq(1).html());
  debug($searchResults.eq(1).text().trim());
  debug($searchResults.eq($searchResults.length-2).html());
  debug($searchResults.eq($searchResults.length-2).text().trim());
  debug($searchResults.eq($searchResults.length-1).html());
  debug($searchResults.eq($searchResults.length-1).text().trim());
  debug("$searchResultsTable");
  debug($searchResultsTable.html().slice(0, 1000));

  // table for result list
  // debug($resultInner_TableRows.eq(10).html().slice(0, 10000));
//*/
  var result = {
    code: $codeAndName.find('td').eq(1).text().trim(),
    name: $codeAndName.find('td').eq(3).text().trim(),
    date: (function() {
        // date string is "dd/mm/yyyy"
        var match = $shareholdingDate.find('td').eq(1).text()
                      .trim().match(/(\d+)\/(\d+)\/(\d+)/);
        // NOTE: month-1 here
        return (new Date(match[3], match[2]-1, match[1])).toISODateString();
      })(),
    records: []
  };
  debug("stock info: %j", result);

  $searchResults.each(function (i, ele) {
    var $tds = $(ele).children();
    // log each row
    // console.log("Row %d:", i);
    // console.log($(ele).html());
    // console.log("%s %s %s %s",
    //   $tds.eq(0).text(),
    //   $tds.eq(1).text(),
    //   $tds.eq(3).text(),
    //   $tds.eq(4).text()
    // );

    result.records.push({
      id: $tds.eq(0).text().trim() || '',
      name: $tds.eq(1).text().trim() || '',
      shares: parseInt($tds.eq(3).text().replace(/,/g, ''), 10) || 0,
      percent: parseFloat($tds.eq(4).text()) || 0
    });
  });

  debug("callback: %s, %d records",
    result.date, result.records.length);
  callback(null, result);
};

module.exports = HkStockHoldingScraper;
