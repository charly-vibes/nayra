import { YEAR, MILLION_YEARS, BILLION_YEARS, DAY } from './time.js';

const MONTH = 30n * DAY;

const MONTH_NAMES = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const NAMED_EVENTS = {
  'big bang': { time: -13_800_000_000n * YEAR, span: BILLION_YEARS },
  'earth formation': { time: -4_500_000_000n * YEAR, span: BILLION_YEARS },
  'earth': { time: -4_500_000_000n * YEAR, span: BILLION_YEARS },
};

export function parseTimeQuery(query) {
  const trimmed = query.trim().toLowerCase();

  if (trimmed === 'now' || trimmed === 'today') {
    return {
      success: true,
      time: BigInt(Math.floor(Date.now() / 1000)),
      span: DAY,
    };
  }

  if (NAMED_EVENTS[trimmed] !== undefined) {
    return {
      success: true,
      time: NAMED_EVENTS[trimmed].time,
      span: NAMED_EVENTS[trimmed].span,
    };
  }

  const gaMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*ga$/);
  if (gaMatch) {
    const value = parseFloat(gaMatch[1]);
    const seconds = BigInt(Math.round(value * Number(BILLION_YEARS)));
    return {
      success: true,
      time: -seconds,
      span: BILLION_YEARS,
    };
  }

  const maMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*ma$/);
  if (maMatch) {
    const value = parseFloat(maMatch[1]);
    const seconds = BigInt(Math.round(value * Number(MILLION_YEARS)));
    return {
      success: true,
      time: -seconds,
      span: MILLION_YEARS,
    };
  }

  // Full date: YYYY-MM-DD
  const fullDateMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (fullDateMatch) {
    const year = parseInt(fullDateMatch[1], 10);
    const month = parseInt(fullDateMatch[2], 10) - 1;
    const day = parseInt(fullDateMatch[3], 10);
    const date = new Date(Date.UTC(year, month, day));
    return {
      success: true,
      time: BigInt(Math.floor(date.getTime() / 1000)),
      span: DAY,
    };
  }

  // Month-year: YYYY-MM or YYYY/MM
  const monthYearMatch = trimmed.match(/^(\d{4})[-\/](\d{1,2})$/);
  if (monthYearMatch) {
    const year = parseInt(monthYearMatch[1], 10);
    const month = parseInt(monthYearMatch[2], 10) - 1;
    const date = new Date(Date.UTC(year, month, 15));
    return {
      success: true,
      time: BigInt(Math.floor(date.getTime() / 1000)),
      span: MONTH,
    };
  }

  // Month name year: "Jan 2024" or "January 2024"
  const monthNameMatch = trimmed.match(/^([a-z]+)\s+(\d{4})$/);
  if (monthNameMatch) {
    const monthName = monthNameMatch[1];
    const year = parseInt(monthNameMatch[2], 10);
    if (MONTH_NAMES[monthName] !== undefined) {
      const date = new Date(Date.UTC(year, MONTH_NAMES[monthName], 15));
      return {
        success: true,
        time: BigInt(Math.floor(date.getTime() / 1000)),
        span: MONTH,
      };
    }
  }

  // Year only
  const yearMatch = trimmed.match(/^(-?\d+)$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    const date = new Date(Date.UTC(year, 6, 1)); // Middle of year
    if (year >= 0 && year < 100) {
      date.setUTCFullYear(year);
    }
    const seconds = BigInt(Math.floor(date.getTime() / 1000));
    return {
      success: true,
      time: seconds,
      span: YEAR,
    };
  }

  return {
    success: false,
    error: `Could not parse: "${query}"`,
  };
}
