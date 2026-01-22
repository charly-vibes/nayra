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

const SUPPORTED_FORMATS = [
  'ISO 8601 (2024-03-15T10:30:00Z)',
  'ISO date (2024-03-15)',
  'Year only (1969, -44)',
  'BCE/BC notation (44 BCE, 44 BC)',
  'CE/AD notation (1066 CE, 1066 AD)',
  'Month-Year (March 1969, 1969-03)',
  'Geological Ma (65 Ma, 65 MYA)',
  'Geological Ga (4.5 Ga, 4.5 BYA)',
  'Relative (13.8 billion years ago)',
];

function yearToSeconds(year) {
  // Historical year numbering: no year zero
  // Year 1 CE follows year 1 BCE directly
  // Negative years represent BCE (e.g., -1 = 1 BCE)
  if (year > 0) {
    const date = new Date(Date.UTC(year, 6, 1));
    if (year < 100) {
      date.setUTCFullYear(year);
    }
    return BigInt(Math.floor(date.getTime() / 1000));
  } else {
    // For BCE years: year -1 = 1 BCE, year -44 = 44 BCE
    // JavaScript Date uses astronomical year numbering where 0 = 1 BCE
    // So historical year -1 (1 BCE) maps to JS year 0
    // Historical year -44 (44 BCE) maps to JS year -43
    const jsYear = year + 1; // Convert historical to astronomical
    const date = new Date(Date.UTC(jsYear, 6, 1));
    date.setUTCFullYear(jsYear);
    return BigInt(Math.floor(date.getTime() / 1000));
  }
}

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

  // Ga/BYA: billion years ago
  const gaMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*(ga|bya)$/);
  if (gaMatch) {
    const value = parseFloat(gaMatch[1]);
    const seconds = BigInt(Math.round(value * Number(BILLION_YEARS)));
    return {
      success: true,
      time: -seconds,
      span: BILLION_YEARS,
    };
  }

  // Ma/MYA: million years ago
  const maMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*(ma|mya)$/);
  if (maMatch) {
    const value = parseFloat(maMatch[1]);
    const seconds = BigInt(Math.round(value * Number(MILLION_YEARS)));
    return {
      success: true,
      time: -seconds,
      span: MILLION_YEARS,
    };
  }

  // Natural language: "X billion years ago"
  const billionYearsAgoMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*billion\s+years?\s+ago$/);
  if (billionYearsAgoMatch) {
    const value = parseFloat(billionYearsAgoMatch[1]);
    const seconds = BigInt(Math.round(value * Number(BILLION_YEARS)));
    return {
      success: true,
      time: -seconds,
      span: BILLION_YEARS,
    };
  }

  // Natural language: "X million years ago"
  const millionYearsAgoMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*million\s+years?\s+ago$/);
  if (millionYearsAgoMatch) {
    const value = parseFloat(millionYearsAgoMatch[1]);
    const seconds = BigInt(Math.round(value * Number(MILLION_YEARS)));
    return {
      success: true,
      time: -seconds,
      span: MILLION_YEARS,
    };
  }

  // ISO 8601 datetime: 2024-03-15T10:30:00Z or 2024-03-15T10:30:00
  const isoDatetimeMatch = query.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|[+-]\d{2}:\d{2})?$/i);
  if (isoDatetimeMatch) {
    const dateStr = query.trim();
    // Treat no timezone as UTC
    const normalizedStr = dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)
      ? dateStr
      : dateStr + 'Z';
    const date = new Date(normalizedStr);
    if (!isNaN(date.getTime())) {
      return {
        success: true,
        time: BigInt(Math.floor(date.getTime() / 1000)),
        span: DAY,
      };
    }
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

  // BCE/BC notation: "44 BCE", "44 BC"
  const bceMatch = trimmed.match(/^(\d+)\s*(bce|bc)$/);
  if (bceMatch) {
    const year = parseInt(bceMatch[1], 10);
    if (year === 0) {
      return {
        success: false,
        error: 'Year zero does not exist in historical convention. Use "1 BCE" or "1 CE" instead.',
      };
    }
    return {
      success: true,
      time: yearToSeconds(-year),
      span: YEAR,
    };
  }

  // CE/AD notation: "1066 CE", "1066 AD"
  const ceMatch = trimmed.match(/^(\d+)\s*(ce|ad)$/);
  if (ceMatch) {
    const year = parseInt(ceMatch[1], 10);
    if (year === 0) {
      return {
        success: false,
        error: 'Year zero does not exist in historical convention. Use "1 BCE" or "1 CE" instead.',
      };
    }
    return {
      success: true,
      time: yearToSeconds(year),
      span: YEAR,
    };
  }

  // Year only (including negative years)
  const yearMatch = trimmed.match(/^(-?\d+)$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);

    // Reject year zero
    if (year === 0) {
      return {
        success: false,
        error: 'Year zero does not exist in historical convention. Use "1 BCE" or "1 CE" instead.',
      };
    }

    return {
      success: true,
      time: yearToSeconds(year),
      span: YEAR,
    };
  }

  return {
    success: false,
    error: `Could not parse: "${query}". Supported formats: ${SUPPORTED_FORMATS.join(', ')}`,
  };
}
