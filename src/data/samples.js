import { YEAR, MILLION_YEARS, BILLION_YEARS } from '../core/time.js';

const UNIX_EPOCH = 0n;
const YEAR_2000 = 946684800n;
const EARTH_FORMATION = -4_500_000_000n * YEAR;
const BIG_BANG = -13_800_000_000n * YEAR;

export function generateSampleEvents() {
  const events = [];
  
  events.push(...generateRecentEvents(50));
  events.push(...generateGeologicalEvents(25));
  events.push(...generateCosmologicalEvents(25));
  
  return events;
}

export function generateRecentEvents(count) {
  const events = [];
  const start1900 = -2208988800n;
  const start2100 = 4102444800n;
  const range = start2100 - start1900;
  
  for (let i = 0; i < count; i++) {
    const startOffset = BigInt(Math.floor(Math.random() * Number(range)));
    const eventStart = start1900 + startOffset;
    const hasDuration = Math.random() > 0.5;
    const duration = hasDuration ? BigInt(Math.floor(Math.random() * 86400 * 365)) : undefined;
    
    events.push({
      id: `recent-${i}`,
      start: eventStart,
      end: duration !== undefined ? eventStart + duration : undefined,
      label: `Recent Event ${i}`,
    });
  }
  
  return events;
}

export function generateGeologicalEvents(count) {
  const events = [];
  const startMa = -500n * MILLION_YEARS;
  const endMa = -1n * MILLION_YEARS;
  const range = endMa - startMa;
  
  for (let i = 0; i < count; i++) {
    const startOffset = BigInt(Math.floor(Math.random() * Number(range / 1000000n))) * 1000000n;
    const eventStart = startMa + startOffset;
    const hasDuration = Math.random() > 0.3;
    const duration = hasDuration ? BigInt(Math.floor(Math.random() * 10)) * MILLION_YEARS : undefined;
    
    events.push({
      id: `geological-${i}`,
      start: eventStart,
      end: duration !== undefined ? eventStart + duration : undefined,
      label: `Geological Event ${i}`,
    });
  }
  
  return events;
}

export function generateCosmologicalEvents(count) {
  const events = [];
  
  events.push({
    id: 'big-bang',
    start: BIG_BANG,
    end: undefined,
    label: 'Big Bang',
  });
  
  events.push({
    id: 'earth-formation',
    start: EARTH_FORMATION,
    end: undefined,
    label: 'Earth Formation',
  });
  
  for (let i = 0; i < count - 2; i++) {
    const range = EARTH_FORMATION - BIG_BANG;
    const startOffset = BigInt(Math.floor(Math.random() * Number(range / BILLION_YEARS))) * BILLION_YEARS;
    const eventStart = BIG_BANG + startOffset;
    
    events.push({
      id: `cosmological-${i}`,
      start: eventStart,
      end: undefined,
      label: `Cosmological Event ${i}`,
    });
  }
  
  return events;
}
