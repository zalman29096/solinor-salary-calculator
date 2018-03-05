/**
 * Created by aleksey on 27/02/18.
 */

/*
 Acronyms:

 SOS - Start Of Shift
 EOS - End Of Shift
 RHS - Regular Hours Start
 RHE - Regular Hours End
 */

import chai from "chai"
import {
  getDayWage,
  getOvertimeWage,
  getNonOvertimeWageAndOvertimeMinutes,
  parseShift
} from "../src/wageCalculator"
import {before, describe, it} from "mocha"                                                                              // Not needed but makes InteliJ happy :)

chai.should()

describe('Wage calculator', () => {
  before(() => {
    console.log(
      `
      *******************************
      |   Acronyms:                 |
      |                             |
      |   SOS - Start Of Shift      |
      |   EOS - End Of Shift        |
      |   RHS - Regular Hours Start |
      |   RHE - Regular Hours End   |
      *******************************
      `
    )
  })
  describe("#parseShift", () => {

    it("does not produce extra block with 0 minutes when given shift overlaps both evening and regular hours intrvals", () => {
      parseShift("00:00", "00:00")
        .should.eql([{minutes: 360, at: 'evening'}, {minutes: 780, at: 'regular'}, {minutes: 300, at: 'evening'}])
    })
    it("calculates correct evening/regular hours when SOS is equal  RHS and EOS is equal  RHE", () => {
      parseShift("06:00", "19:00")
        .should.eql([{minutes: 780, at: 'regular'}])
    })
    it("calculates correct evening/regular hours when SOS is after  RHS and EOS is before RHE", () => {
      parseShift("07:00", "12:00")
        .should.eql([{minutes: 300, at: 'regular'}])
    })
    it("calculates correct evening/regular hours when SOS is equal  RHS and EOS is before RHE", () => {
      parseShift("06:00", "17:00")
        .should.eql([{minutes: 660, at: 'regular'}])
    })
    it("calculates correct evening/regular hours when SOS is after  RHS and EOS is equal  RHE", () => {
      parseShift("10:00", "19:00")
        .should.eql([{minutes: 540, at: 'regular'}])
    })
    it("calculates correct evening/regular hours when SOS is before RHS and EOS is before RHS (started at early morning, ended at early morning)", () => {
      parseShift("02:00", "05:00")
        .should.eql([{minutes: 180, at: 'evening'}])
    })
    it("calculates correct evening/regular hours when SOS is before RHS and EOS is before RHE but after RHS (started at morning, finished at midday)", () => {
      parseShift("05:00", "15:00")
        .should.eql([{minutes: 60, at: 'evening'}, {minutes: 540, at: 'regular'}])
    })
    it("calculates correct evening/regular hours when SOS is before RHS and EOS is after  RHE (started at morning, finished at late evening)", () => {
      parseShift("05:00", "23:00")
        .should.eql([{minutes: 60, at: 'evening'}, {minutes: 780, at: 'regular'}, {minutes: 240,at: 'evening'}])
    })
    it("calculates correct evening/regular hours when SOS is before RHS and EOS is after  RHE (started at morning, finished at morning next day)", () => {
      parseShift("07:00", "03:00")
        .should.eql([{minutes: 720, at: 'regular'}, {minutes: 480, at: 'evening'}])
    })
    it("calculates correct evening/regular hours when SOS is after  RHS and EOS is after  RHE (started at midday, ended late evening)", () => {
      parseShift("15:00", "21:00")
        .should.eql([{minutes: 240, at: 'regular'}, {minutes: 120, at: 'evening'}])
    })
    it("calculates correct evening/regular hours when SOS is after  RHS and EOS is after  RHE (started at midday, ended early morning next day)", () => {
      parseShift("15:00", "03:00")
        .should.eql([{minutes: 240, at: 'regular'}, {minutes: 480, at: 'evening'}])
    })
    it("calculates correct evening/regular hours when SOS is after  RHE and EOS is after  RHE (started late evening, ended late evening before midnight)", () => {
      parseShift("20:00", "23:00")
        .should.eql([{minutes: 180, at: 'evening'}])
    })
    it("calculates correct evening/regular hours when SOS is after  RHE and EOS is before RHS (started at late evening, ended at early morning next day : midnight cross)", () => {
      parseShift("21:00", "05:00")
        .should.eql([{minutes: 480, at: 'evening'}])
    })

    it("calculates correct evening/regular hours when SOS is after  RHE and EOS is after  RHS (started at late evening, ended at middle of next day : midnight cross)", () => {
      parseShift("21:00", "12:00")
        .should.eql([{minutes: 540, at: 'evening'}, {minutes: 360, at: 'regular'}])
    })
    it("calculates correct evening/regular hours when SOS is after  RHE and EOS is after  RHE (started at late evening, ended at late evening next day : midnight cross)", () => {
      parseShift("21:00", "20:00")
        .should.eql([{minutes: 540, at: 'evening'}, {minutes: 780, at: 'regular'}, {minutes: 60,at: 'evening'}])
    })

  })

  describe("#getDayWage", () => {

    it("calculates correct wage for no-evening, no-overtime single record shift", () => {
      getDayWage([
        {start : "07:00", end : "12:00"}
      ]).should.equal(21.25)
    })
    it("calculates correct wage for no-evening, no-overtime multi record shift", () => {
      getDayWage([
        {start : "07:00", end : "12:00"},
        {start : "13:00", end : "15:00"},
      ]).should.equal(21.25 + 8.5)
    })
    it("calculates correct wage for evening-only, no-overtime single record shift", () => {
      getDayWage([
        {start : "02:00", end : "05:00"}
      ]).should.equal(16.5)

      getDayWage([
        {start : "20:00", end : "02:00"}
      ]).should.equal(33)

    })
    it("calculates correct wage for evening and daily, no-overtime single record shift", () => {
      getDayWage([
        {start : "02:00", end : "10:00"}
      ]).should.equal(22 + 17)
    })

    it("calculates correct wage for evening and daily, no-overtime multi record shift", () => {
      getDayWage([
        {start : "04:00", end : "06:00"},
        {start : "07:00", end : "10:00"}
      ]).should.equal(11 + 12.75)
    })

    it("calculates correct wage for evening and daily, overtime <= 3h single record shift", () => {
      getDayWage([
        {start : "02:00", end : "12:00"}
      ]).should.equal(22 + 17 + 10.625)

      getDayWage([
        {start : "02:00", end : "13:00"}
      ]).should.equal(22 + 17 + 15.9375)
    })
    it("calculates correct wage for evening and daily, 3h < overtime <= 4h  single record shift", () => {
      getDayWage([
        {start : "02:00", end : "13:30"}
      ]).should.equal(22 + 17 + 15.9375 + 3.1875)

      getDayWage([
        {start : "02:00", end : "14:00"}
      ]).should.equal(22 + 17 + 15.9375 + 6.375)
    })

    it("calculates correct wage for evening and daily, overtime > 4h  single record shift", () => {
      getDayWage([
        {start : "02:00", end : "16:00"}
      ]).should.equal(22 + 17 + 15.9375 + 6.375 + 17)
    })
    it("calculates correct wage for evening and daily, overtime > 4h when work started and finnished at evening time single record shift", () => {
      getDayWage([
        {start : "02:00", end : "20:00"}
      ]).should.equal(22 + 17 + 15.9375 + 6.375 + 51)
    })
    it("calculates correct wage for evening and daily, overtime > 4h when work started and finnished at evening time multi record shift", () => {
      getDayWage([
        {start : "02:00", end : "07:00"},
        {start : "12:00", end : "18:00"},
        {start : "19:30", end : "22:30"},
      ]).should.equal(22 + 17 + 15.9375 + 6.375 + 17)
    })
    it("calculates correct wage for evening and daily, no-overtime multi record shift when total shift passes midnight", () => {
      getDayWage([
        {start : "17:00", end : "20:00"},
        {start : "22:00", end : "03:00"}
      ]).should.equal(8.5 + 33)
    })
    it("calculates correct wage despite of shifts order", () => {
      getDayWage([
        {start : "05:00", end : "07:00"},
        {start : "02:00", end : "05:00"},
        {start : "07:00", end : "09:00"},
      ]).should.equal(12.75 + 22)
    })
  })

  describe("#getOvertimeWage", () => {
    it("calculates correct wage when overtime <= 3h", () => {
      getOvertimeWage(60).should.equal(5.3125)
      getOvertimeWage(90).should.equal(7.96875)
      getOvertimeWage(180).should.equal(15.9375)
    })
    it("calculates correct wage when 3h < overtime <= 4h", () => {
      getOvertimeWage(190).should.equal(15.9375 + 1.0625)
      getOvertimeWage(240).should.equal(15.9375 + 6.375)
    })
    it("calculates correct wage when overtime > 4h", () => {
      getOvertimeWage(360).should.equal(15.9375 + 6.375 + 17)
      getOvertimeWage(660).should.equal(15.9375 + 6.375 + 59.5)
      getOvertimeWage(960).should.equal(15.9375 + 6.375 + 102)
    })
  })

  describe("#getNonOvertimeWageAndOvertimeMinutes", () => {
    it("calculates correct non-overtime wage and overtime minutes when whole shift is withing regular hours", () => {
      getNonOvertimeWageAndOvertimeMinutes([{at : 'regular', minutes : 180}]).should.eql({nonOvertimeWage : 12.75, overtimeMinutes : 0})
      getNonOvertimeWageAndOvertimeMinutes([{at : 'regular', minutes : 550}]).should.eql({nonOvertimeWage : 34, overtimeMinutes : 70})
    })
    it("calculates correct non-overtime wage and overtime minutes when whole shift is withing evening hours", () => {
      getNonOvertimeWageAndOvertimeMinutes([{at : 'evening', minutes : 180}]).should.eql({nonOvertimeWage : 16.5, overtimeMinutes : 0})
      getNonOvertimeWageAndOvertimeMinutes([{at : 'evening', minutes : 550}]).should.eql({nonOvertimeWage : 44, overtimeMinutes : 70})
    })
    it("calculates correct non-overtime wage and overtime minutes when whole shift covers 24 hours", () => {
      getNonOvertimeWageAndOvertimeMinutes([
        {at : 'evening', minutes : 360},
        {at : 'regular', minutes : 780},
        {at : 'evening', minutes : 660},
        {at : 'regular', minutes : 780},
        {at : 'evening', minutes : 360}
      ]).should.eql({nonOvertimeWage : 33 + 8.5, overtimeMinutes :2460})
    })
    it("calculates correct non-overtime wage and overtime minutes when shift starts at regular hours and ends at evening hours", () => {
      getNonOvertimeWageAndOvertimeMinutes([
        {at : 'regular', minutes : 180},
        {at : 'evening', minutes : 180}
      ]).should.eql({nonOvertimeWage : 12.75 + 16.5, overtimeMinutes :0})

      getNonOvertimeWageAndOvertimeMinutes([
        {at : 'regular', minutes : 120},
        {at : 'evening', minutes : 440}
      ]).should.eql({nonOvertimeWage : 8.5 + 33, overtimeMinutes :80})
    })
    it("calculates correct non-overtime wage and overtime minutes when shift starts at evening hours and ends at regular hours", () => {
      getNonOvertimeWageAndOvertimeMinutes([
        {at : 'evening', minutes : 180},
        {at : 'regular', minutes : 180}
      ]).should.eql({nonOvertimeWage : 16.5 + 12.75, overtimeMinutes :0})

      getNonOvertimeWageAndOvertimeMinutes([
        {at : 'evening', minutes : 120},
        {at : 'regular', minutes : 440}
      ]).should.eql({nonOvertimeWage : 11 + 25.5, overtimeMinutes :80})
    })
    it("calculates correct non-overtime wage and overtime minutes when shift starts at evening hours and ends at evening hours crossing regular hours", () => {
      getNonOvertimeWageAndOvertimeMinutes([
        {at : 'evening', minutes : 30},
        {at : 'regular', minutes : 780},
        {at : 'evening', minutes : 30}
      ]).should.eql({nonOvertimeWage : 2.75 + 31.875, overtimeMinutes :360})
    })
  })
})