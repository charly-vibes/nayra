import { BILLION_YEARS, MILLION_YEARS, YEAR } from '../core/time.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function timeToYear(timeValue) {
  const secondsFromEpoch = Number(timeValue);
  if (!Number.isFinite(secondsFromEpoch) || Math.abs(secondsFromEpoch) > 8.64e15 / 1000) {
    return Number(timeValue / YEAR) + 1970;
  }
  const date = new Date(secondsFromEpoch * 1000);
  return date.getUTCFullYear();
}

function getTimeScale(timeValue) {
  const absTime = timeValue < 0n ? -timeValue : timeValue;
  if (absTime >= BILLION_YEARS) return 'Ga';
  if (absTime >= MILLION_YEARS) return 'Ma';
  return 'year';
}

function formatGa(timeValue) {
  const ga = Number(timeValue) / Number(BILLION_YEARS);
  return Math.abs(ga).toFixed(1);
}

function formatMa(timeValue) {
  const ma = Number(timeValue / MILLION_YEARS);
  return String(Math.abs(ma));
}

export function toDisplayYear(astronomicalYear, calendar) {
  if (calendar === 'holocene') {
    const heYear = astronomicalYear + 10000;
    if (heYear >= 1) return `${heYear} HE`;
    return `${1 - heYear} BHE`;
  }
  if (astronomicalYear < 1) return `${1 - astronomicalYear} BCE`;
  return String(astronomicalYear);
}

function formatYear(timeValue, precision, calendar) {
  const secondsFromEpoch = Number(timeValue);

  if (!Number.isFinite(secondsFromEpoch) || Math.abs(secondsFromEpoch) > 8.64e15 / 1000) {
    const yearsFromEpoch = Number(timeValue / YEAR);
    const year = 1970 + yearsFromEpoch;
    return toDisplayYear(year, calendar);
  }

  const date = new Date(secondsFromEpoch * 1000);
  const year = date.getUTCFullYear();

  if (calendar !== 'holocene') {
    if (precision === 'day') {
      const month = MONTHS[date.getUTCMonth()];
      const day = date.getUTCDate();
      return `${month} ${day}, ${year}`;
    }

    if (precision === 'month') {
      const month = MONTHS[date.getUTCMonth()];
      return `${month} ${year}`;
    }
  }

  return toDisplayYear(year, calendar);
}

function needsCirca(precision) {
  return (
    precision === 'decade' || precision === 'century' || precision === 'million_years' || precision === 'billion_years'
  );
}

export function formatTimeRange(event, calendar) {
  const { start, end, precision } = event;
  const scale = getTimeScale(start);
  const prefix = needsCirca(precision) ? 'c. ' : '';

  if (scale === 'Ga') {
    if (end !== undefined) {
      const startGa = formatGa(start);
      const endGa = formatGa(end);
      if (startGa !== endGa) {
        return `${startGa} – ${endGa} Ga`;
      }
    }
    return `${formatGa(start)} Ga`;
  }

  if (scale === 'Ma') {
    if (end !== undefined) {
      const startMa = formatMa(start);
      const endMa = formatMa(end);
      if (startMa !== endMa) {
        return `${startMa} – ${endMa} Ma`;
      }
    }
    return `${formatMa(start)} Ma`;
  }

  if (end !== undefined) {
    const startYear = timeToYear(start);
    const endYear = timeToYear(end);
    if (startYear !== endYear) {
      const startLabel = toDisplayYear(startYear, calendar);
      const endLabel = toDisplayYear(endYear, calendar);
      const suffix = calendar === 'holocene' ? ' HE' : '';
      const startClean = startLabel.replace(/ (?:HE|BHE|BCE)$/, '');
      const endClean = endLabel.replace(/ (?:HE|BHE|BCE)$/, '');
      return `${prefix}${startClean} – ${endClean}${suffix}`;
    }
  }

  return `${prefix}${formatYear(start, precision, calendar)}`;
}
