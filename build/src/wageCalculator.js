'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * Created by aleksey on 27/02/18.
 *
 * Calculator of wage for day according to evening/regular hours rules + overtime compensation
 */

/**
 * Converts minutes to hours
 *
 * @param   {(number|string)} minutes
 * @returns {number}          hours
 */
var m2h = function m2h(minutes) {
  return Number(minutes) / 60;
};

/**
 * Converts hours:minutes to milliseconds
 *
 * @param   {(number|string)} hours
 * @param   {(number|string)} minutes
 * @returns {number}          milliseconds
 */
var HM2m = function HM2m(hours) {
  var minutes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  return Number(hours) * 60 + Number(minutes);
};

/**
 * Returns wage for this amount of minutes worked for given rate
 *
 * @param   {(number|string)} minutes
 * @param   {number}          rate
 * @returns {number}          wage
 */
var wage = function wage(minutes, rate) {
  return Math.max(m2h(minutes) * rate, 0);
};

var TWO_DAY_INTERVALS = [[0, HM2m(6)], // From 00:00 to 06:00
[HM2m(6), HM2m(19)], // From 06:00 to 19:00
[HM2m(19), HM2m(30)], // From 19:00 to 06:00 next day
[HM2m(30), HM2m(43)], // From 06:00 next day to 19:00 next day
[HM2m(43), HM2m(48)] // From 19:00 next day to 24:00 next day
];

var REGULAR_WAGE = 4.25;
var EVENING_WAGE = REGULAR_WAGE + 1.25;
var THREE_HOURS_OVERTIME_RATE = REGULAR_WAGE * 1.25;
var FOURTH_HOUR_OVERTIME_RATE = REGULAR_WAGE * 1.5;
var AFTER_FOUR_HOURS_OVERTIME_RATE = REGULAR_WAGE * 2;

var ONE_HOUR = 60;
var OVERTIME_STARTS_AFTER = 8 * ONE_HOUR;
var TWENTY_FOUR_HOURS_MINUTES = 24 * 60;
var THREE_HOURS = 3 * ONE_HOUR;
var FOUR_HOURS = 4 * ONE_HOUR;

/**
 * Converts shift represented in form of [start(HH:mm), end(HH:mm)] to interval [start(minutes), end(minutes)]
 *
 * @param   {string} shiftStart   Start of shift in format of HH:mm
 * @param   {string} shiftEnd     END  of shift in format of HH:mm
 * @returns {Array<number>}       Shift represented as Moment interval
 */
var shiftToInterval = function shiftToInterval(shiftStart, shiftEnd) {
  return [HM2m.apply(undefined, _toConsumableArray(shiftStart.split(':'))), HM2m.apply(undefined, _toConsumableArray(shiftEnd.split(':')))];
};

/**
 * Returns length of intersection of two intervals
 *
 * @param   {Array<number>}           interval1
 * @param   {Array<number>}           interval2
 * @returns {number}                  Length of intersection of two intervals
 */
var getIntersectionLength = function getIntersectionLength(interval1, interval2) {
  return Math.max(Math.min(interval1[1], interval2[1]) - Math.max(interval1[0], interval2[0]), 0 // Intervals don't intersect
  );
};

/**
 * Represents work shift as timeline-wise oriented set of objects. Each object describes duration and part of day during which the work has been done
 *
 * @param   {string}  shiftStart    Start of shift in format HH:mm
 * @param   {string}  shiftEnd      End of shift in format HH:mm
 * @returns {Array<object>}         Sequential representation of work shift. Each chunk describes duration and part of day during which the work has been done
 */
var parseShift = function parseShift(shiftStart, shiftEnd) {
  var _shiftToInterval = shiftToInterval(shiftStart, shiftEnd);

  var _shiftToInterval2 = _slicedToArray(_shiftToInterval, 2);

  shiftStart = _shiftToInterval2[0];
  shiftEnd = _shiftToInterval2[1];

  if (shiftEnd <= shiftStart) shiftEnd += TWENTY_FOUR_HOURS_MINUTES; // If end of shift is less than start assume that person stopped working on the next day

  return TWO_DAY_INTERVALS.map(function (DAY_INTERVAL, DAY_INTERVAL_INDEX) {
    return {
      minutes: getIntersectionLength([shiftStart, shiftEnd], DAY_INTERVAL),
      at: DAY_INTERVAL_INDEX % 2 === 0 ? 'evening' : 'regular' // Evening intervals have even indexes
    };
  }).filter(function (v) {
    return v.minutes > 0; // Filter out day parts without work
  });
};

/**
 * Sequentially iterates work shifts in timeline-wise direction in order to calculate non-overtime wage and exclude overtime
 *
 * @param   {Array<object>}         totalDayInterval  Each object of array contains information about how many minutes of work were done during which part of day
 * @returns {Array<number, number>}                   Wage for non-overtime hours | Minutes of overtime
 */
var getNonOvertimeWageAndOvertimeMinutes = function getNonOvertimeWageAndOvertimeMinutes(totalDayInterval) {
  var result = totalDayInterval.reduce(function (accumulator, shiftPart) {
    var minutesToAssume = shiftPart.minutes,
        dayPart = shiftPart.at;
    var nonOvertimeWage = accumulator.nonOvertimeWage,
        overtimeMinutes = accumulator.overtimeMinutes,
        workedMinutesIterator = accumulator.workedMinutesIterator;


    if (workedMinutesIterator + minutesToAssume > OVERTIME_STARTS_AFTER) {
      // Part or whole shift is already overtime
      minutesToAssume = Math.max(OVERTIME_STARTS_AFTER - workedMinutesIterator, 0); // Getting amount of non-overtime minutes in this shift
      overtimeMinutes += shiftPart.minutes - minutesToAssume; // Getting amount of overtime minutes in this shift
    }

    nonOvertimeWage += wage(minutesToAssume, dayPart === 'evening' ? EVENING_WAGE : REGULAR_WAGE);
    return { nonOvertimeWage: nonOvertimeWage, overtimeMinutes: overtimeMinutes, workedMinutesIterator: workedMinutesIterator + shiftPart.minutes };
  }, { nonOvertimeWage: 0, overtimeMinutes: 0, workedMinutesIterator: 0 });
  delete result.workedMinutesIterator;
  return result;
};

/**
 * @param   {number} overtime   Minutes of overtime
 * @returns {number}            Total wage for overtime
 */
var getOvertimeWage = function getOvertimeWage(overtime) {
  return wage(Math.min(overtime, THREE_HOURS), THREE_HOURS_OVERTIME_RATE) + wage(Math.min(overtime - THREE_HOURS, ONE_HOUR), FOURTH_HOUR_OVERTIME_RATE) + wage(overtime - FOUR_HOURS, AFTER_FOUR_HOURS_OVERTIME_RATE);
};

/**
 * @param   {Array<object>} dayShifts  Work shifts for this day. Each shift has form {start : 'HH:mm', end : 'HH:mm'}
 * @returns {Array<object>}            Flat array of objects. Each object of array contains information about how many minutes of work were done during which part(evening|regular) of day
 */
var preprocessDayShifts = function preprocessDayShifts(dayShifts) {
  return [].concat.apply([], dayShifts.map(function (shift) {
    return parseShift(shift.start, shift.end);
  }));
};

var sortShifts = function sortShifts(shifts) {
  return shifts.sort(function (a, b) {
    return Number(a.start.replace(/:/g, "")) - Number(a.start.replace(/:/g, ""));
  });
};

/**
 * @param   {Array<object>} dayShifts  Work shifts for this day. Each shift has form {start : 'HH:mm', end : 'HH:mm'}
 * @returns {number}                   Total wage for this day
 */
var getDayWage = function getDayWage(dayShifts) {
  dayShifts = sortShifts(dayShifts);

  var _getNonOvertimeWageAn = getNonOvertimeWageAndOvertimeMinutes(preprocessDayShifts(dayShifts)),
      nonOvertimeWage = _getNonOvertimeWageAn.nonOvertimeWage,
      overtimeMinutes = _getNonOvertimeWageAn.overtimeMinutes;

  return nonOvertimeWage + getOvertimeWage(overtimeMinutes);
};
exports.getDayWage = getDayWage;
exports.getOvertimeWage = getOvertimeWage;
exports.getNonOvertimeWageAndOvertimeMinutes = getNonOvertimeWageAndOvertimeMinutes;
exports.parseShift = parseShift;