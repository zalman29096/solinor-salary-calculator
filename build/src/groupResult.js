"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Created by aleksey on 01/03/18.
 */

var formatWage = function formatWage(result) {
  return result.map(function (r) {
    if (!r || typeof r.wage !== "number") return null;
    r.wage = "$" + Number(r.wage).toFixed(2);
    return r;
  }).filter(function (v) {
    return !!v;
  });
};

var jsonToCsv = function jsonToCsv(jsonData, separator) {
  return jsonData.map(function (r) {
    return Object.values(r).join(separator);
  }).join("\n") + "\n";
};

var groupResultBy = function groupResultBy(groupCriteria, result) {
  switch (groupCriteria) {
    case "day":
      return formatWage(result);
    case "month":
      return groupResultByMonth(result);
    default:
      throw new Error("Unknown group option [" + groupCriteria + "]");
  }
};

var groupResultByMonth = function groupResultByMonth(result) {
  return formatWage(Object.values(result.reduce(function (groupedResult, wageLine) {
    var month = wageLine.day.substring(wageLine.day.indexOf(".") + 1); // Get MM.YYYY part of computed day
    month = [Number(month.split(".")[0]), month.split(".")[1]].join("."); // Convert notations 01.01.2017 to 1.1.2017
    var key = wageLine.id + "|" + month;

    if (!groupedResult[key]) groupedResult[key] = {
      id: wageLine.id,
      name: wageLine.name,
      month: month,
      wage: wageLine.wage

    };else groupedResult[key].wage += wageLine.wage;

    return groupedResult;
  }, {})));
};

exports.formatWage = formatWage;
exports.groupResultBy = groupResultBy;
exports.groupResultByMonth = groupResultByMonth;
exports.jsonToCsv = jsonToCsv;