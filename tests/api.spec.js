import { JulianDate } from '@vcmap-cesium/engine';
import { describe, it, expect } from 'vitest';
import { getNextTime } from '../src/api.js';
import { TIME_UNITS } from '../src/constants.js';

describe('getNextTime', () => {
  it('adds days to start time', () => {
    const speed = 2;
    const start = JulianDate.fromDate(new Date('2020-01-01'), new JulianDate());
    const result = getNextTime(start, speed, TIME_UNITS.days);
    expect(result.dayNumber).toEqual(start.dayNumber + speed);
    expect(result.secondsOfDay).toEqual(start.secondsOfDay);
  });

  it('adds minutes to start time', () => {
    const speed = 4;
    const start = JulianDate.fromDate(new Date('2020-01-01'), new JulianDate());
    const result = getNextTime(start, speed, TIME_UNITS.hours);
    expect(result.dayNumber).toEqual(start.dayNumber);
    expect(result.secondsOfDay).toEqual(start.secondsOfDay + speed * 60);
  });
});
