"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveResultToCsv = exports.validateShiftObject = exports.processFileContent = exports.fetchFileContent = undefined;

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _groupResult = require("./groupResult");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var rowToObject = function rowToObject(row) {
  return {
    personName: (row[0] || "").trim(),
    personId: Number(row[1]),
    date: (row[2] || "").trim(),
    start: (row[3] || "").trim(),
    end: (row[4] || "").trim()
  };
}; /**
    * Created by aleksey on 01/03/18.
    */

var validateShiftObject = function validateShiftObject(shift) {
  return (shift.personId || shift.personId === 0) && !!shift.date && !!shift.start && !!shift.end && /^(3[01]|[12][0-9]|0?[1-9])\.(1[012]|0?[1-9])\.((?:19|20)\d{2})$/.test(shift.date) && // Valid DD.MM.YYYY date
  /^(?:\d|[01]\d|2[0-4]):[0-5]\d$/.test(shift.start) && // Valid HH:mm time
  /^(?:\d|[01]\d|2[0-4]):[0-5]\d$/.test(shift.end); // Valid HH:mm time
};

var splitFile = function splitFile(fileContent) {
  var separator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ';';

  return fileContent.split('\n').map(function (line) {
    return line.split(separator);
  });
};

var _checkIfGroupHasPerson = function _checkIfGroupHasPerson(shift, groupedShifts) {
  if (!groupedShifts.good.hasOwnProperty(shift.personId)) groupedShifts.good[shift.personId] = {
    days: {}, name: shift.personName
  };
  return groupedShifts;
};

var _checkIfPersonInGroupHasDate = function _checkIfPersonInGroupHasDate(shift, groupedShifts) {
  if (!groupedShifts.good[shift.personId].days.hasOwnProperty(shift.date)) groupedShifts.good[shift.personId].days[shift.date] = [];
  return groupedShifts;
};

var _addShiftToGroup = function _addShiftToGroup(shift, groupedShifts) {
  groupedShifts.good[shift.personId].days[shift.date].push({
    start: shift.start,
    end: shift.end
  });
  return groupedShifts;
};

/**
 * Groups file content into structure
 *
 * {
 *  good : {
 *    PERSON_ID : {
 *      name : PERSON_NAME,
 *      days : {
 *        DAY[DD.MM.YYYY] : [
 *          {start : string[HH:mm], end : string[HH:mm]}
 *        ]
 *      }
 *    }
 *  },
 *  error : [
 *    ALL LINES THAT ARE NOT OF FORMAT : Any char sequence [SEP] Any number [SEP] DD.MM.YYYY [SEP] HH:mm [SEP] HH:mm
 *  ]
 * }
 *
 * @param   {Array<Array>} splittedFileContent
 * @returns {object}
 */
var groupShiftsByPersonsAndDates = function groupShiftsByPersonsAndDates(splittedFileContent) {

  return splittedFileContent.reduce(function (groupedShifts, shift) {

    shift = rowToObject(shift);
    if (!validateShiftObject(shift)) {
      groupedShifts.errors.push(shift);
      return groupedShifts;
    }
    groupedShifts = _checkIfGroupHasPerson(shift, groupedShifts);
    groupedShifts = _checkIfPersonInGroupHasDate(shift, groupedShifts);
    return _addShiftToGroup(shift, groupedShifts);
  }, { good: {}, errors: [] });
};

/**
 *
 * @param   {string} filePath
 * @returns {object} error if file does not exist or it is not possible to read it | raw file content read as UTF8 string
 */
var fetchFileContent = function fetchFileContent(filePath) {
  try {
    return { err: null, fileContent: _fs2.default.readFileSync(_path2.default.resolve(filePath), "utf-8") };
  } catch (e) {
    return { err: e, fileContent: null };
  }
};

/**
 * Splits file content to array of lines
 * Tests first line of file for format : Any char sequence [SEP] Any number [SEP] DD.MM.YYYY [SEP] HH:mm [SEP] HH:mm
 * If it does not match, assumes that it is a CSV header and removes it
 *
 * @param   {string}        fileContent
 * @param   {string}        separator
 * @returns {Array<string>}             Array of lines
 */
var prepareFileContent = function prepareFileContent(fileContent, separator) {
  var headerLine = fileContent.substr(0, fileContent.indexOf('\n')).trim();
  var preparedContent = splitFile(fileContent.trim(), separator);
  var headLineIsDataLine = new RegExp("^.*" + separator + "\\d+" + separator + "\\s*(3[01]|[12][0-9]|0?[1-9])\\.(1[012]|0?[1-9])\\.((?:19|20)\\d{2})\\s*" + separator + "(?:\\d|[01]\\d|2[0-4]):[0-5]\\d" + separator + "(?:\\d|[01]\\d|2[0-4]):[0-5]\\d$");
  if (!headLineIsDataLine.test(headerLine)) preparedContent.shift();

  return preparedContent;
};

/**
 * @param {string} fileContent   Raw content of file
 * @param {string} separator     CSV separator
 */
var processFileContent = function processFileContent(fileContent) {
  var separator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ";";


  var preparedContent = prepareFileContent(fileContent.trim(), separator);
  return groupShiftsByPersonsAndDates(preparedContent);
};

var saveResultToCsv = function saveResultToCsv(fileName, result, separator) {
  _fs2.default.writeFileSync(_path2.default.resolve(fileName), (0, _groupResult.jsonToCsv)(result, separator));
};

exports.fetchFileContent = fetchFileContent;
exports.processFileContent = processFileContent;
exports.validateShiftObject = validateShiftObject;
exports.saveResultToCsv = saveResultToCsv;