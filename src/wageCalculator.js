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
const m2h = (minutes) => {
  return Number(minutes) / 60
}

/**
 * Converts hours:minutes to minutes
 *
 * @param   {(number|string)} hours
 * @param   {(number|string)} minutes
 * @returns {number}          minutes
 */
const HM2m = (hours, minutes = 0) => {
  return (Number(hours) * 60) + Number(minutes)
}

/**
 * Returns wage for this amount of minutes worked for given rate
 *
 * @param   {(number|string)} minutes
 * @param   {number}          rate
 * @returns {number}          wage
 */
const wage = (minutes, rate) => {
  return Math.max(m2h(minutes) * rate, 0)
}

const TWO_DAY_INTERVALS = [
  [0,        HM2m(6) ],  // From 00:00 to 06:00
  [HM2m(6),  HM2m(19)],  // From 06:00 to 19:00
  [HM2m(19), HM2m(30)],  // From 19:00 to 06:00 next day
  [HM2m(30), HM2m(43)],  // From 06:00 next day to 19:00 next day
  [HM2m(43), HM2m(48)]   // From 19:00 next day to 24:00 next day
]

const REGULAR_WAGE = 4.25
const EVENING_WAGE = REGULAR_WAGE + 1.25
const THREE_HOURS_OVERTIME_RATE = REGULAR_WAGE * 1.25
const FOURTH_HOUR_OVERTIME_RATE = REGULAR_WAGE * 1.5
const AFTER_FOUR_HOURS_OVERTIME_RATE = REGULAR_WAGE * 2

const ONE_HOUR = 60
const OVERTIME_STARTS_AFTER = 8 * ONE_HOUR
const TWENTY_FOUR_HOURS_MINUTES = 24 * 60
const THREE_HOURS = 3 * ONE_HOUR
const FOUR_HOURS = 4 * ONE_HOUR


/**
 * Converts shift represented in form of start(HH:mm), end(HH:mm) to interval [start(minutes), end(minutes)]
 *
 * @param   {string} shiftStart   Start of shift in format of HH:mm
 * @param   {string} shiftEnd     END  of shift in format of HH:mm
 * @returns {Array<number>}       Shift represented as minutes interval
 */
let shiftToInterval = (shiftStart, shiftEnd) => {
  return [
    HM2m(...shiftStart.split(':')),
    HM2m(...shiftEnd.split(':'))
  ]
}

/**
 * Returns length of intersection of two intervals
 *
 * @param   {Array<number>}           interval1
 * @param   {Array<number>}           interval2
 * @returns {number}                  Length of intersection of two intervals
 */
let getIntersectionLength = (interval1, interval2) => {
  return Math.max(
    Math.min(interval1[1], interval2[1]) - Math.max(interval1[0], interval2[0]),
    0  // Intervals don't intersect
  )
}

/**
 * Represents work shift as timeline-wise oriented set of objects.
 * Each object describes duration and part of day during which the work has been done
 *
 * @param   {string}  shiftStart    Start of shift in format HH:mm
 * @param   {string}  shiftEnd      End of shift in format HH:mm
 * @returns {Array<object>}         Sequential representation of work shift.
 *                                  Each chunk describes duration and part of day during which the work has been done
 */
let parseShift = (shiftStart, shiftEnd) => {

  [shiftStart, shiftEnd] = shiftToInterval(shiftStart, shiftEnd)
  if (shiftEnd <= shiftStart) shiftEnd += TWENTY_FOUR_HOURS_MINUTES

  return TWO_DAY_INTERVALS.map((DAY_INTERVAL, DAY_INTERVAL_INDEX) => {
    return {
      minutes: getIntersectionLength([shiftStart, shiftEnd], DAY_INTERVAL),
      at: (DAY_INTERVAL_INDEX % 2 === 0) ? 'evening' : 'regular' // Evening intervals have even indexes
    }
  }).filter((v) => {
    return v.minutes > 0   // Filter out day parts without work
  })

}


/**
 * Sequentially iterates work shifts in timeline-wise direction
 * in order to calculate non-overtime wage and exclude overtime
 *
 * @param   {Array<object>}         totalDayInterval  Each object of array contains information about
 *                                                    how many minutes of work were done during which part of day
 *
 * @returns {Array<number, number>}                   Wage for non-overtime hours | Minutes of overtime
 */
let getNonOvertimeWageAndOvertimeMinutes = (totalDayInterval) => {
  let result = totalDayInterval.reduce((accumulator, shiftPart) => {

    let {minutes: minutesToAssume, at: dayPart} = shiftPart
    let {nonOvertimeWage, overtimeMinutes, workedMinutesIterator} = accumulator

    if (workedMinutesIterator + minutesToAssume > OVERTIME_STARTS_AFTER) {   // Part or whole shift is already overtime
      minutesToAssume = Math.max(OVERTIME_STARTS_AFTER - workedMinutesIterator, 0) // Amount of non-overtime minutes
      overtimeMinutes += shiftPart.minutes - minutesToAssume                       // Amount of overtime minutes
    }

    nonOvertimeWage += wage(minutesToAssume, (dayPart === 'evening' ? EVENING_WAGE : REGULAR_WAGE))
    return {nonOvertimeWage, overtimeMinutes, workedMinutesIterator: workedMinutesIterator + shiftPart.minutes}

  }, {nonOvertimeWage: 0, overtimeMinutes: 0, workedMinutesIterator: 0})
  delete result.workedMinutesIterator
  return result
}

/**
 * @param   {number} overtime   Minutes of overtime
 * @returns {number}            Total wage for overtime
 */
let getOvertimeWage = (overtime) => {
  return  wage(Math.min(overtime, THREE_HOURS), THREE_HOURS_OVERTIME_RATE)            +
          wage(Math.min(overtime - THREE_HOURS, ONE_HOUR), FOURTH_HOUR_OVERTIME_RATE) +
          wage(overtime - FOUR_HOURS, AFTER_FOUR_HOURS_OVERTIME_RATE)
}

/**
 * @param   {Array<object>} dayShifts  Work shifts for this day. Each shift has form {start : 'HH:mm', end : 'HH:mm'}
 * @returns {Array<object>}            FLAT array of objects.
 *                                     Each object of array contains information about how many minutes of work
 *                                     were done during which part(evening|regular) of day
 */
let preprocessDayShifts = (dayShifts) => {
  return [].concat.apply([], dayShifts.map((shift) => {
    return parseShift(shift.start, shift.end)
  }))
}

let sortShifts = (shifts) => {
  return shifts.sort((a, b) => {
    return Number(a.start.replace(/:/g,"")) - Number(a.start.replace(/:/g,""))
  })
}

/**
 * @param   {Array<object>} dayShifts  Work shifts for this day. Each shift has form {start : 'HH:mm', end : 'HH:mm'}
 * @returns {number}                   Total wage for this day
 */
let getDayWage = (dayShifts) => {
  dayShifts = sortShifts(dayShifts)
  let {nonOvertimeWage, overtimeMinutes} = getNonOvertimeWageAndOvertimeMinutes(
    preprocessDayShifts(dayShifts)
  )
  return nonOvertimeWage + getOvertimeWage(overtimeMinutes)

}
export {
  getDayWage,
  getOvertimeWage,
  getNonOvertimeWageAndOvertimeMinutes,
  parseShift
}