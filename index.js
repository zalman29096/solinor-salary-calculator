/**
 * Created by aleksey on 01/03/18.
 */

import program from "commander"
import {getDayWage} from "./src/wageCalculator"
import {fetchFileContent, processFileContent, saveResultToCsv} from "./src/fileUtils"
import {groupResultBy, jsonToCsv} from "./src/groupResult"

const separator = () => {
  return program.separator || ';'
}
const groupBy = () => {
  return program.groupBy || "month"
}
console.time("Total execution time")
program
  .option('-i, --input-file   [path]', 'Path to CSV file with work shifts')
  .option('-o, --output-file  [path]', '!OPTIONAL! File name to save results to. If not provided, output would be piped to STDOUT')
  .option('-s, --separator    [character]', '!OPTIONAL! CSV separator symbol. Defaults to ;')
  .option('-g, --group-by     [group-criteria]', '!OPTIONAL! Group results by [day|month]. Defaults to month')
  .parse(process.argv)

let {err, fileContent} = fetchFileContent(program['inputFile'])
if (err || !fileContent) {
  console.log(err || new Error("File is empty"))
  process.exit()
}

let {good: preprocessedFileContent, errors: invalidRows} = processFileContent(fileContent, separator())
let wages = []

for (let personId in preprocessedFileContent) {
  for (let day in preprocessedFileContent[personId].days) {
    wages.push({
        name: preprocessedFileContent[personId].name,
        id: personId,
        day: day,
        wage: getDayWage(preprocessedFileContent[personId].days[day]),
      })
  }
}

try {

  let groupedResult = groupResultBy(
    groupBy(),
    wages
  )

  if (!!program.outputFile)
    saveResultToCsv(program.outputFile, groupedResult, separator())
  else
    console.log(jsonToCsv(groupedResult, separator()))
} catch (e) {
  console.log(e)
}
console.log("Done")
console.timeEnd("Total execution time")