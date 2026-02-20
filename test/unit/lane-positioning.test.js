import { describe, it, expect } from 'vitest';
import {
  getLaneY,
  getTotalHeight,
  getLaneBounds,
  getLaneAtY,
  getAdaptiveLaneConfig,
  DEFAULT_CONFIG,
} from '../../src/layout/lane-positioning.js';

describe('lane-positioning', () => {
  describe('getLaneY', () => {
    it('positions lane 0 centered on axis', () => {
      const axisY = 300;
      const y = getLaneY(0, axisY);

      // Lane 0 should be centered on axis
      // With default height of 24, it should be at axisY - 12
      expect(y).toBe(axisY - DEFAULT_CONFIG.laneHeight / 2);
    });

    it('positions lane 1 above lane 0', () => {
      const axisY = 300;
      const y0 = getLaneY(0, axisY);
      const y1 = getLaneY(1, axisY);

      // Lane 1 should be above lane 0 (smaller Y value)
      expect(y1).toBeLessThan(y0);
    });

    it('maintains consistent spacing between lanes', () => {
      const axisY = 300;
      const y0 = getLaneY(0, axisY);
      const y1 = getLaneY(1, axisY);
      const y2 = getLaneY(2, axisY);

      const spacing01 = y0 - y1;
      const spacing12 = y1 - y2;

      expect(spacing01).toBe(spacing12);
      expect(spacing01).toBe(DEFAULT_CONFIG.laneHeight + DEFAULT_CONFIG.laneSpacing);
    });

    it('handles custom lane height', () => {
      const axisY = 300;
      const customConfig = { laneHeight: 30 };

      const y = getLaneY(0, axisY, customConfig);
      expect(y).toBe(axisY - 15); // 30 / 2
    });

    it('handles custom lane spacing', () => {
      const axisY = 300;
      const customConfig = { laneHeight: 20, laneSpacing: 10 };

      const y0 = getLaneY(0, axisY, customConfig);
      const y1 = getLaneY(1, axisY, customConfig);

      const spacing = y0 - y1;
      expect(spacing).toBe(30); // 20 + 10
    });

    it('calculates multiple lanes correctly', () => {
      const axisY = 300;

      for (let lane = 0; lane < 10; lane++) {
        const y = getLaneY(lane, axisY);
        const expectedOffset = lane * (DEFAULT_CONFIG.laneHeight + DEFAULT_CONFIG.laneSpacing);
        const expected = axisY - DEFAULT_CONFIG.laneHeight / 2 - expectedOffset;

        expect(y).toBe(expected);
      }
    });
  });

  describe('getTotalHeight', () => {
    it('returns 0 for 0 lanes', () => {
      const height = getTotalHeight(0);
      expect(height).toBe(0);
    });

    it('returns lane height for 1 lane', () => {
      const height = getTotalHeight(1);
      expect(height).toBe(DEFAULT_CONFIG.laneHeight);
    });

    it('includes spacing between lanes', () => {
      const height = getTotalHeight(2);

      // 2 lanes: height + spacing + height
      const expected = 2 * DEFAULT_CONFIG.laneHeight + 1 * DEFAULT_CONFIG.laneSpacing;
      expect(height).toBe(expected);
    });

    it('calculates height for many lanes', () => {
      const laneCount = 10;
      const height = getTotalHeight(laneCount);

      // 10 lanes, 9 spacings
      const expected = 10 * DEFAULT_CONFIG.laneHeight + 9 * DEFAULT_CONFIG.laneSpacing;
      expect(height).toBe(expected);
    });

    it('handles custom configuration', () => {
      const laneCount = 5;
      const config = { laneHeight: 30, laneSpacing: 10 };
      const height = getTotalHeight(laneCount, config);

      // 5 lanes, 4 spacings
      const expected = 5 * 30 + 4 * 10;
      expect(height).toBe(expected);
    });
  });

  describe('getLaneBounds', () => {
    it('returns correct bounds for lane 0', () => {
      const axisY = 300;
      const bounds = getLaneBounds(0, axisY);

      expect(bounds.top).toBe(axisY - DEFAULT_CONFIG.laneHeight / 2);
      expect(bounds.bottom).toBe(axisY + DEFAULT_CONFIG.laneHeight / 2);
      expect(bounds.height).toBe(DEFAULT_CONFIG.laneHeight);
    });

    it('returns correct bounds for lane 1', () => {
      const axisY = 300;
      const bounds0 = getLaneBounds(0, axisY);
      const bounds1 = getLaneBounds(1, axisY);

      // Lane 1 should be above lane 0
      expect(bounds1.bottom).toBeLessThan(bounds0.top);

      // Height should be consistent
      expect(bounds1.height).toBe(bounds0.height);
    });

    it('handles custom configuration', () => {
      const axisY = 300;
      const config = { laneHeight: 40 };
      const bounds = getLaneBounds(0, axisY, config);

      expect(bounds.height).toBe(40);
      expect(bounds.bottom - bounds.top).toBe(40);
    });

    it('lanes do not overlap', () => {
      const axisY = 300;
      const bounds0 = getLaneBounds(0, axisY);
      const bounds1 = getLaneBounds(1, axisY);
      const bounds2 = getLaneBounds(2, axisY);

      // Lane 1 bottom should be above lane 0 top (with spacing)
      expect(bounds1.bottom).toBeLessThanOrEqual(bounds0.top);
      expect(bounds2.bottom).toBeLessThanOrEqual(bounds1.top);
    });
  });

  describe('getLaneAtY', () => {
    it('identifies lane 0 for Y in lane 0 bounds', () => {
      const axisY = 300;
      const bounds = getLaneBounds(0, axisY);
      const midY = (bounds.top + bounds.bottom) / 2;

      const lane = getLaneAtY(midY, axisY, 10);
      expect(lane).toBe(0);
    });

    it('identifies lane 1 for Y in lane 1 bounds', () => {
      const axisY = 300;
      const bounds = getLaneBounds(1, axisY);
      const midY = (bounds.top + bounds.bottom) / 2;

      const lane = getLaneAtY(midY, axisY, 10);
      expect(lane).toBe(1);
    });

    it('returns null for Y outside all lanes', () => {
      const axisY = 300;
      const veryHighY = 0;  // Way above all lanes
      const lane = getLaneAtY(veryHighY, axisY, 10);

      expect(lane).toBeNull();
    });

    it('returns null for Y below axis', () => {
      const axisY = 300;
      const belowY = 400;  // Below axis (lanes are above)
      const lane = getLaneAtY(belowY, axisY, 10);

      expect(lane).toBeNull();
    });

    it('handles Y at exact lane boundaries', () => {
      const axisY = 300;
      const bounds0 = getLaneBounds(0, axisY);

      // Top of lane 0
      const laneTop = getLaneAtY(bounds0.top, axisY, 10);
      expect(laneTop).toBe(0);

      // Bottom of lane 0
      const laneBottom = getLaneAtY(bounds0.bottom, axisY, 10);
      expect(laneBottom).toBe(0);
    });

    it('identifies correct lane for multiple lanes', () => {
      const axisY = 300;

      for (let targetLane = 0; targetLane < 5; targetLane++) {
        const bounds = getLaneBounds(targetLane, axisY);
        const midY = (bounds.top + bounds.bottom) / 2;
        const foundLane = getLaneAtY(midY, axisY, 10);

        expect(foundLane).toBe(targetLane);
      }
    });

    it('respects maxLanes parameter', () => {
      const axisY = 300;
      const bounds5 = getLaneBounds(5, axisY);
      const midY = (bounds5.top + bounds5.bottom) / 2;

      // With maxLanes = 5, lane 5 doesn't exist (0-4 only)
      const lane = getLaneAtY(midY, axisY, 5);
      expect(lane).toBeNull();

      // With maxLanes = 10, lane 5 exists
      const lane2 = getLaneAtY(midY, axisY, 10);
      expect(lane2).toBe(5);
    });
  });

  describe('getAdaptiveLaneConfig', () => {
    it('returns default config for now', () => {
      const config = getAdaptiveLaneConfig(1000);
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('returns config object with expected properties', () => {
      const config = getAdaptiveLaneConfig(100);

      expect(config).toHaveProperty('laneHeight');
      expect(config).toHaveProperty('laneSpacing');
      expect(config).toHaveProperty('baselineOffset');
    });
  });

  describe('integration scenarios', () => {
    it('handles typical multi-lane layout', () => {
      const axisY = 400;
      const laneCount = 5;

      // Calculate total height needed
      const totalHeight = getTotalHeight(laneCount);
      expect(totalHeight).toBeGreaterThan(0);

      // Verify all lanes fit within expected bounds
      const topMostLane = getLaneY(laneCount - 1, axisY);
      const bottomMostLane = getLaneY(0, axisY);

      expect(topMostLane).toBeLessThan(bottomMostLane);
    });

    it('ensures consistent spacing in dense layout', () => {
      const axisY = 300;
      const laneCount = 20;

      const spacings = [];
      for (let i = 0; i < laneCount - 1; i++) {
        const y0 = getLaneY(i, axisY);
        const y1 = getLaneY(i + 1, axisY);
        spacings.push(y0 - y1);
      }

      // All spacings should be equal
      const firstSpacing = spacings[0];
      for (const spacing of spacings) {
        expect(spacing).toBe(firstSpacing);
      }
    });

    it('supports custom dense layout configuration', () => {
      const axisY = 300;
      const denseConfig = {
        laneHeight: 16,
        laneSpacing: 2,
      };

      const y0 = getLaneY(0, axisY, denseConfig);
      const y1 = getLaneY(1, axisY, denseConfig);

      const spacing = y0 - y1;
      expect(spacing).toBe(18); // 16 + 2
    });

    it('supports custom spacious layout configuration', () => {
      const axisY = 300;
      const spaciousConfig = {
        laneHeight: 32,
        laneSpacing: 8,
      };

      const y0 = getLaneY(0, axisY, spaciousConfig);
      const y1 = getLaneY(1, axisY, spaciousConfig);

      const spacing = y0 - y1;
      expect(spacing).toBe(40); // 32 + 8
    });
  });
});
