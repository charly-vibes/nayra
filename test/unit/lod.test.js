import { describe, it, expect } from 'vitest';
import {
  determineLOD,
  filterEventsByLOD,
  shouldShowLabels,
  shouldShowFullLabels,
  getMinEventWidth,
  shouldRenderAsPoint,
  getEventPriority,
  LOD_MICRO,
  LOD_MESO,
  LOD_MACRO,
  PRIORITY_LOW,
  PRIORITY_MEDIUM,
  PRIORITY_HIGH,
} from '../../src/rendering/lod.js';
import { DAY, YEAR } from '../../src/core/time.js';

describe('LOD System', () => {
  describe('determineLOD', () => {
    it('should return MICRO for small secondsPerPixel values', () => {
      const result = determineLOD(100); // ~2 minutes per pixel
      expect(result).toBe(LOD_MICRO);
    });

    it('should return MESO for medium secondsPerPixel values', () => {
      const result = determineLOD(Number(DAY) * 30); // ~30 days per pixel
      expect(result).toBe(LOD_MESO);
    });

    it('should return MACRO for large secondsPerPixel values', () => {
      const result = determineLOD(Number(YEAR) * 60); // ~60 years per pixel
      expect(result).toBe(LOD_MACRO);
    });

    it('should use hysteresis to prevent flickering from micro to meso', () => {
      // Start at micro, zoom out past threshold to switch to meso
      const secondsPerPixel = Number(DAY) / 1.5; // Above MICRO_TO_MESO_THRESHOLD (DAY / 2)
      const result1 = determineLOD(secondsPerPixel, LOD_MICRO);
      expect(result1).toBe(LOD_MESO); // Should switch to meso

      // Stay at meso when between the two thresholds
      // MICRO_TO_MESO = DAY/2 = 43200, MESO_TO_MICRO = DAY/3 = 28800
      const result2 = determineLOD(Number(DAY) / 2.5, LOD_MESO); // 34560 - between thresholds
      expect(result2).toBe(LOD_MESO); // Should stay at meso (hysteresis)
    });

    it('should use hysteresis to prevent flickering from meso to macro', () => {
      // Start at meso
      const result1 = determineLOD(Number(YEAR) * 60, LOD_MESO);
      expect(result1).toBe(LOD_MACRO); // Should switch to macro

      // Stay at macro even when slightly below threshold
      const result2 = determineLOD(Number(YEAR) * 40, LOD_MACRO);
      expect(result2).toBe(LOD_MACRO); // Should stay at macro (hysteresis)
    });

    it('should switch back to meso when zooming in from macro', () => {
      const result = determineLOD(Number(YEAR) * 20, LOD_MACRO);
      expect(result).toBe(LOD_MESO);
    });

    it('should switch back to micro when zooming in from meso', () => {
      const result = determineLOD(Number(DAY) / 4, LOD_MESO);
      expect(result).toBe(LOD_MICRO);
    });
  });

  describe('getEventPriority', () => {
    it('should return event priority if defined', () => {
      const event = { id: 'test', priority: PRIORITY_HIGH };
      expect(getEventPriority(event)).toBe(PRIORITY_HIGH);
    });

    it('should return PRIORITY_MEDIUM as default', () => {
      const event = { id: 'test' };
      expect(getEventPriority(event)).toBe(PRIORITY_MEDIUM);
    });

    it('should handle priority 0 (low)', () => {
      const event = { id: 'test', priority: PRIORITY_LOW };
      expect(getEventPriority(event)).toBe(PRIORITY_LOW);
    });
  });

  describe('filterEventsByLOD', () => {
    const events = [
      { id: '1', priority: PRIORITY_LOW },
      { id: '2', priority: PRIORITY_MEDIUM },
      { id: '3', priority: PRIORITY_HIGH },
      { id: '4' }, // Default to medium
    ];

    it('should show all events at MICRO level', () => {
      const filtered = filterEventsByLOD(events, LOD_MICRO);
      expect(filtered).toHaveLength(4);
    });

    it('should show medium and high priority events at MESO level', () => {
      const filtered = filterEventsByLOD(events, LOD_MESO);
      expect(filtered).toHaveLength(3);
      expect(filtered.map(e => e.id)).toEqual(['2', '3', '4']);
    });

    it('should show only high priority events at MACRO level', () => {
      const filtered = filterEventsByLOD(events, LOD_MACRO);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('3');
    });
  });

  describe('shouldShowLabels', () => {
    it('should show labels at MICRO level', () => {
      expect(shouldShowLabels(LOD_MICRO)).toBe(true);
    });

    it('should show labels at MESO level', () => {
      expect(shouldShowLabels(LOD_MESO)).toBe(true);
    });

    it('should not show labels at MACRO level', () => {
      expect(shouldShowLabels(LOD_MACRO)).toBe(false);
    });
  });

  describe('shouldShowFullLabels', () => {
    it('should show full labels at MICRO level', () => {
      expect(shouldShowFullLabels(LOD_MICRO)).toBe(true);
    });

    it('should not show full labels at MESO level', () => {
      expect(shouldShowFullLabels(LOD_MESO)).toBe(false);
    });

    it('should not show full labels at MACRO level', () => {
      expect(shouldShowFullLabels(LOD_MACRO)).toBe(false);
    });
  });

  describe('getMinEventWidth', () => {
    it('should return 4px at MICRO level', () => {
      expect(getMinEventWidth(LOD_MICRO)).toBe(4);
    });

    it('should return 6px at MESO level', () => {
      expect(getMinEventWidth(LOD_MESO)).toBe(6);
    });

    it('should return 8px at MACRO level', () => {
      expect(getMinEventWidth(LOD_MACRO)).toBe(8);
    });
  });

  describe('shouldRenderAsPoint', () => {
    it('should render as point when width is below minimum at MICRO', () => {
      expect(shouldRenderAsPoint(2, LOD_MICRO)).toBe(true);
      expect(shouldRenderAsPoint(4, LOD_MICRO)).toBe(false);
    });

    it('should render as point when width is below minimum at MESO', () => {
      expect(shouldRenderAsPoint(5, LOD_MESO)).toBe(true);
      expect(shouldRenderAsPoint(6, LOD_MESO)).toBe(false);
    });

    it('should render as point when width is below minimum at MACRO', () => {
      expect(shouldRenderAsPoint(7, LOD_MACRO)).toBe(true);
      expect(shouldRenderAsPoint(8, LOD_MACRO)).toBe(false);
    });
  });
});
