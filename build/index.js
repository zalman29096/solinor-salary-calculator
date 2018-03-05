"use strict";

var _commander = require("commander");

var _commander2 = _interopRequireDefault(_commander);

var _wageCalculator = require("./src/wageCalculator");

var _fileUtils = require("./src/fileUtils");

var _groupResult = require("./src/groupResult");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by aleksey on 01/03/18.
 */

var separator = function separator() {
  return _commander2.default.separator || ';';
};
var groupBy = function groupBy() {
  return _commander2.default.groupBy || "month";
};

_commander2.default.option('-i, --input-file   [path]', 'Path to CSV file with work shifts').option('-o, --output-file  [path]', '!OPTIONAL! File name to save results to. If not provided, output would be piped to STDOUT').option('-s, --separator    [character]', '!OPTIONAL! CSV separator symbol. Defaults to ;').option('-g, --group-by     [group-criteria]', '!OPTIONAL! Group results by [day|month]. Defaults to month').parse(process.argv);

var _fetchFileContent = (0, _fileUtils.fetchFileContent)(_commander2.default['inputFile']),
    err = _fetchFileContent.err,
    fileContent = _fetchFileContent.fileContent;

if (err || !fileContent) {
  console.log(err || new Error("File is empty"));
  process.exit();
}

var _processFileContent = (0, _fileUtils.processFileContent)(fileContent, separator()),
    preprocessedFileContent = _processFileContent.good,
    invalidRows = _processFileContent.errors;

var wages = [];

for (var personId in preprocessedFileContent) {
  for (var day in preprocessedFileContent[personId].days) {
    wages.push({
      name: preprocessedFileContent[personId].name,
      id: personId,
      day: day,
      wage: (0, _wageCalculator.getDayWage)(preprocessedFileContent[personId].days[day])
    });
  }
}

try {

  var groupedResult = (0, _groupResult.groupResultBy)(groupBy(), wages);

  if (!!_commander2.default.outputFile) (0, _fileUtils.saveResultToCsv)(_commander2.default.outputFile, groupedResult, separator());else console.log((0, _groupResult.jsonToCsv)(groupedResult, separator()));
} catch (e) {
  console.log(e);
}