/**
 * Created by aleksey on 01/03/18.
 */

import path from "path"
import fs from "fs"
import {jsonToCsv} from "./groupResult"

let rowToObject = (row) => {
  return {
    personName: (row[0] || "").trim(),
    personId: Number(row[1]),
    date: (row[2] || "").trim(),
    start: (row[3] || "").trim(),
    end: (row[4] || "").trim()
  }
}

let validateShiftObject = (shift) => {
  return (shift.personId || shift.personId === 0) &&
    !!shift.date &&
    !!shift.start &&
    !!shift.end &&
    /^(3[01]|[12][0-9]|0?[1-9])\.(1[012]|0?[1-9])\.((?:19|20)\d{2})$/.test(shift.date) &&                               // Valid date of format DD.MM.YYYY
    /^(?:\d|[01]\d|2[0-4]):[0-5]\d$/.test(shift.start) &&                                                               // Valid time of format HH:mm
    /^(?:\d|[01]\d|2[0-4]):[0-5]\d$/.test(shift.end)                                                                    // Valid time of format HH:mm

}

let splitFile = (fileContent, separator = ';') => {
  return fileContent.split('\n').map((line) => {
    return line.split(separator)
  })
}

let _checkIfGroupHasPerson = (shift, groupedShifts) => {
  if (!groupedShifts.good.hasOwnProperty(shift.personId))
    groupedShifts.good[shift.personId] = {
      days: {}, name: shift.personName
    }
  return groupedShifts
}

let _checkIfPersonInGroupHasDate = (shift, groupedShifts) => {
  if (!groupedShifts.good[shift.personId].days.hasOwnProperty(shift.date))
    groupedShifts.good[shift.personId].days[shift.date] = []
  return groupedShifts
}

let _addShiftToGroup = (shift, groupedShifts) => {
  groupedShifts.good[shift.personId].days[shift.date].push({
    start: shift.start,
    end: shift.end
  })
  return groupedShifts
}

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
 * @param   {array<array>} splittedFileContent
 * @returns {object}
 */
let groupShiftsByPersonsAndDates = (splittedFileContent) => {

  return splittedFileContent.reduce((groupedShifts, shift) => {

    shift = rowToObject(shift)
    if(!validateShiftObject(shift)){
      groupedShifts.errors.push(shift)
      return groupedShifts
    }
    groupedShifts = _checkIfGroupHasPerson(shift, groupedShifts)
    groupedShifts = _checkIfPersonInGroupHasDate(shift, groupedShifts)
    return _addShiftToGroup(shift, groupedShifts)

  }, {good: {}, errors: []})
}

/**
 *
 * @param   {string} filePath
 * @returns {object} error if file does not exist or it is not possible to read it | raw file content read as UTF8 string
 */
let fetchFileContent = (filePath) => {
  try{
    return {err : null, fileContent : fs.readFileSync(path.resolve(filePath), "utf-8")}
  }catch (e){
    return {err: e, fileContent: null}
  }
}

/**
 * Splits file content to array of lines
 * Tests first line of file for format : Any char sequence [SEP] Any number [SEP] DD.MM.YYYY [SEP] HH:mm [SEP] HH:mm
 * If it does not match, assumes that it is a CSV header and removes it
 *
 * @param   {string}        fileContent
 * @param   {string}        separator
 * @returns {Array<string>}             Array of lines
 */
let prepareFileContent = (fileContent, separator) => {
  let headerLine = fileContent.substr(0, fileContent.indexOf('\n')).trim()
  let preparedContent = splitFile(fileContent.trim(), separator)
  let headLineIsDataLine = new RegExp(
    `^.*${separator}\\d+${separator}\\s*(3[01]|[12][0-9]|0?[1-9])\\.(1[012]|0?[1-9])\\.((?:19|20)\\d{2})\\s*${separator}(?:\\d|[01]\\d|2[0-4]):[0-5]\\d${separator}(?:\\d|[01]\\d|2[0-4]):[0-5]\\d$`
  )
  if (!headLineIsDataLine.test(headerLine))
    preparedContent.shift()

  return preparedContent
}

/**
 * @param {string} fileContent   Raw content of file
 * @param {string} separator     CSV separator
 */
let processFileContent = (fileContent, separator = ";") => {

  let preparedContent = prepareFileContent(fileContent.trim(), separator)
  return groupShiftsByPersonsAndDates(preparedContent)
}


let saveResultToCsv = (fileName, result, separator) => {
  fs.writeFileSync(
    path.resolve(fileName),
    jsonToCsv(result, separator)
  )
}


export {fetchFileContent, processFileContent, validateShiftObject,saveResultToCsv}