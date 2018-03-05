/**
 * Created by aleksey on 01/03/18.
 */

import chai from "chai"
import {describe, it} from "mocha"
import {fetchFileContent, processFileContent, validateShiftObject} from "../src/fileUtils"                                                                              // Not needed but makes InteliJ happy :)

chai.should()

describe("File utils", () => {
  describe("#fetchFileContent", () => {
    it("returns error if file does not exist", () => {
      fetchFileContent("./SUCH_FILE_DOES_NOT_EXIST.csv").err.should.be.an("error")
    })
    it("returns file content if file is readable", () => {
      fetchFileContent("./test/assets/readable.csv").fileContent.should.be.a("string")
    })
  })
  describe("#validateShiftObject", () => {
    it("returns false if object values do not match required format", () => {
      validateShiftObject({
        personName: "",
        personId: null,
        date: "1.2.2018",
        start: "20:00",
        end: "20:00"
      }).should.equal(false)

      validateShiftObject({
        personName: "",
        personId: 0,
        date: ".2.2018",
        start: "20:00",
        end: "20:00"
      }).should.equal(false)

      validateShiftObject({
        personName: "",
        personId: 1,
        date: "1.2.2018",
        start: "test:00",
        end: "20:00"
      }).should.equal(false)

      validateShiftObject({
        personName: "",
        personId: 2,
        date: "1.2.2018",
        start: "20:00",
        end: "207:00"
      }).should.equal(false)

      validateShiftObject({
        personName: "",
        personId: null,
        date: "1.2.2018",
        start: "20:004",
        end: "20:00"
      }).should.equal(false)

      validateShiftObject({
        personName: "",
        personId: 3,
        date: "1.2.2018",
        start: "20:00"
      }).should.equal(false)

      validateShiftObject({
        personName: "",
        personId: 4,
        date: "165.2.2018",
        start: "20:00",
        end: "20:00"
      }).should.equal(false)
    })
    it("returns true if object values match required format", () => {
      validateShiftObject({
        personName: "",
        personId: 4,
        date: "15.2.2018",
        start: "20:00",
        end: "21:00"
      }).should.equal(true)
    })
  })

  describe("#processFileContent", () => {
    it("should exclude rows from grouping if they do not match required format", () => {
      let groupedResult = processFileContent(
        `
        Name;ID;Date;Start;End
        Test;2;1.2.2017;22:00;01:00
        Tesy;3;123.2.2017;23:00;23:45
        Tesy;f;23.2.2017;23:00;23:45
        Tesy;5;33.2.2017;23:00;23:45
        Tesy;6;23.2.2017;23:00;23:45
        Tesy;7;23.2.2017;26:00;23:45
        `
      )
      groupedResult.errors[0].personId.should.equal(3)
      groupedResult.errors[1].personId.should.be.NaN
      groupedResult.errors[2].personId.should.equal(5)
      groupedResult.errors[3].personId.should.equal(7)
      Object.values(groupedResult.good).length.should.equal(2)
    })
    it("should not exclude rows from grouping if they do match required format", () => {
      let groupedResult = processFileContent(
        `
        Test;2;1.2.2017;22:00;01:00
        Tesy;3;123.2.2017;23:00;23:45
        Tesy;f;23.2.2017;23:00;23:45
        Tesy;5;33.2.2017;23:00;23:45
        Tesy;6;23.2.2017;23:00;23:45
        Tesy;7;23.2.2017;26:00;23:45
        `
      )
      Object.values(groupedResult.good).length.should.equal(2)
    })
  })
})
