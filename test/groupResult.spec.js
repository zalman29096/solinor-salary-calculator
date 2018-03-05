/**
 * Created by aleksey on 05/03/18.
 */

import chai from "chai"
import {describe, it} from "mocha"
import {formatWage, groupResultByMonth, groupResultBy} from "./../src/groupResult"

chai.should()

describe("Group results", () => {
  describe("#formatWage", () => {
    it("should skip lines if wage property can't be formatted", () => {
      formatWage([
        {wage: 5},
        {wage: "foo"},
        5
      ]).should.eql([{wage: "$5.00"}])
    })
  })
  describe("#groupResultByMonth", () => {
    it("should group records from different days to single month", () => {
      groupResultByMonth([
        {wage: 5, day: "1.1.2017", id: 1, name: "foo"},
        {wage: 5, day: "2.1.2017", id: 1, name: "foo"},
      ]).should.eql([{wage: "$10.00", id: 1, name: "foo", month: "1.2017"}])
    })
    it("should ignore different notations of date", () => {
      groupResultByMonth([
        {wage: 5, day: "1.1.2017", id: 1, name: "foo"},
        {wage: 7, day: "01.1.2017", id: 1, name: "foo"},
      ]).should.eql([{wage: "$12.00", id: 1, name: "foo", month: "1.2017"}])
    })
    it("should separate different years with same month", () => {
      groupResultByMonth([
        {wage: 5, day: "1.1.2017", id: 1, name: "foo"},
        {wage: 7, day: "01.1.2018", id: 1, name: "foo"},
      ]).should.eql([
        {wage: "$5.00", id: 1, name: "foo", month: "1.2017"}, {wage: "$7.00", id: 1, name: "foo", month: "1.2018"}
      ])
    })
  })
  describe("#groupResultBy", () => {
    it("should throw error if group criteria is not in [day, month]", () => {
      (() => {groupResultBy("year", [])}).should.throw(Error)
    })
  })
})
