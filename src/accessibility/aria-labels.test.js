// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { buildEventAriaLabel, buildEventAriaDescription, buildClusterAriaLabel } from './aria-labels.js';
import { YEAR, MILLION_YEARS, BILLION_YEARS } from '../core/time.js';

describe('buildEventAriaLabel', () => {
  it('uses title when available', () => {
    const event = { title: 'Moon Landing', label: 'Apollo 11', start: 0n };
    expect(buildEventAriaLabel(event)).toContain('Moon Landing');
  });

  it('falls back to label when no title', () => {
    const event = { label: 'Moon Landing', start: 0n };
    expect(buildEventAriaLabel(event)).toContain('Moon Landing');
  });

  it('includes formatted date in the label', () => {
    const event = { title: 'Moon Landing', start: 0n }; // Unix epoch = 1970
    const label = buildEventAriaLabel(event);
    expect(label).toContain('1970');
  });

  it('formats as "[title] on [date]"', () => {
    const event = { title: 'Moon Landing', start: 0n };
    const label = buildEventAriaLabel(event);
    expect(label).toMatch(/Moon Landing on .+/);
  });

  it('handles geological Ga timescale', () => {
    // Big Bang ~13.8 billion years ago
    const start = -(13800n * MILLION_YEARS);
    const event = { title: 'Big Bang', start };
    const label = buildEventAriaLabel(event);
    expect(label).toContain('Big Bang');
    expect(label).toContain('Ga');
  });

  it('handles geological Ma timescale', () => {
    // Dinosaur extinction ~66 Ma ago
    const start = -(66n * MILLION_YEARS);
    const event = { title: 'Dino Extinction', start };
    const label = buildEventAriaLabel(event);
    expect(label).toContain('Ma');
  });

  it('includes date range when event has end time', () => {
    const event = {
      title: 'Cold War',
      start: -(23n * YEAR), // 1947
      end: 19n * YEAR,      // 1989
    };
    const label = buildEventAriaLabel(event);
    expect(label).toContain('Cold War');
    // Should contain both years or a range indicator
    expect(label).toMatch(/\d{4}/);
  });

  it('returns non-empty string for minimal event', () => {
    const event = { title: 'Event', start: 0n };
    expect(buildEventAriaLabel(event)).toBeTruthy();
  });
});

describe('buildEventAriaDescription', () => {
  it('returns description when present', () => {
    const event = { description: 'First moon landing by humans', start: 0n };
    expect(buildEventAriaDescription(event)).toBe('First moon landing by humans');
  });

  it('returns notes when no description', () => {
    const event = { notes: 'Some notes', start: 0n };
    expect(buildEventAriaDescription(event)).toBe('Some notes');
  });

  it('returns empty string when neither description nor notes', () => {
    const event = { title: 'Event', start: 0n };
    expect(buildEventAriaDescription(event)).toBe('');
  });

  it('prefers description over notes', () => {
    const event = { description: 'Main description', notes: 'Some notes', start: 0n };
    expect(buildEventAriaDescription(event)).toBe('Main description');
  });
});

describe('buildClusterAriaLabel', () => {
  it('returns "[N] events in [range]" format', () => {
    const label = buildClusterAriaLabel(5, '1950 – 1970');
    expect(label).toBe('5 events in 1950 – 1970');
  });

  it('uses singular "event" for count of 1', () => {
    const label = buildClusterAriaLabel(1, '1969');
    expect(label).toBe('1 event in 1969');
  });

  it('handles geological ranges', () => {
    const label = buildClusterAriaLabel(3, '65 – 70 Ma');
    expect(label).toBe('3 events in 65 – 70 Ma');
  });

  it('returns non-empty string for valid inputs', () => {
    expect(buildClusterAriaLabel(10, '2000 – 2020')).toBeTruthy();
  });
});
