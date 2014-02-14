// extension to Date object
(function () {

Date.prototype.getWeek = function() {
  // Copy date to keep `this` intact
  d = new Date(this);
  d.setHours(0,0,0);
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7 (start of week is Monday)
  d.setDate(d.getDate() + 4 - (d.getDay()||7));
  // Get first day of year
  var yearStart = new Date(d.getFullYear(),0,1);
  // Calculate full weeks to nearest Thursday
  return Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
};

Date.prototype.getMonday = function() {
    var day = this.getDay();
    // adjust when day is Sunday
    // as I would like week start day to be Monday
    // var mondayRel = ((day === 0)? 6 : day-1);
    console.log("Monday is %d days before", mondayRel);

    return this.getPrevDay(mondayRel);
};

Date.prototype.getPrevDay = function(n) {
  var date = new Date(this);
  if (typeof n === 'undefined'){
    n = 1;
  }
  date.setDate(this.getDate() - n);
  date.setHours(0,0,0);
  return date;
};

Date.prototype.getNextDay = function(n) {
  var date = new Date(this);
  if (typeof n === 'undefined'){
    n = 1;
  }
  date.setDate(this.getDate() + n);
  date.setHours(0,0,0);
  return date;
};

var dayNames = [ "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday" ];
Date.prototype.getDayString = function() {
  return dayNames[this.getDay()];
};

var monthNames = [ "January", "February", "March",
  "April", "May", "June", "July", "August",
  "September", "October", "November", "December" ];
Date.prototype.getMonthString = function() {
  return monthNames[this.getMonth()];
};

Date.prototype.getMonthSane = function() {
  return this.getMonth() + 1;
};

function padZeros(num, len) {
  var s = num+'';
  while (s.length < len) s = '0' + s;
  return s;
}
// convert Date to ISO date format
// basically Date.toISOString() without the time part
// https://en.wikipedia.org/wiki/ISO_8601
// http://xkcd.com/1179/
Date.prototype.toISODateString = function() {
  return '' + this.getFullYear() + '-' +
    padZeros(this.getMonthSane(), 2) + '-' +
    padZeros(this.getDate(), 2);
};

})();
