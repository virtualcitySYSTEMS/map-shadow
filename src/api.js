import { JulianDate } from '@vcmap-cesium/engine';
import { TIME_UNITS } from './constants.js';

/**
 * initializes shadow and clockRange
 * @param {import("@vcmap/ui").VcsUiApp} app
 * @param {import("@vcmap-cesium/engine").JulianDate} timeOnClose
 * @returns {Object{originalTime: import("@vcmap-cesium/engine").JulianDate}}
 */
export const activateShadow = (app, timeOnClose) => {
  const cesiumWidget = app.maps.activeMap.getCesiumWidget();
  const { clock } = cesiumWidget;
  const originalTime = Object.assign(clock.currentTime);
  app.maps.activeMap.getScene().shadowMap.enabled = true;
  if (timeOnClose) {
    clock.currentTime = timeOnClose;
  }
  return { originalTime };
};

export const deactivateShadow = (app, originalTime) => {
  const cesiumWidget = app.maps.activeMap.getCesiumWidget();
  cesiumWidget.scene.shadowMap.enabled = false;
  const timeOnClose = cesiumWidget.clock.currentTime;
  cesiumWidget.clock.currentTime = originalTime;
  return { timeOnClose };
};

export const validateHourInput = (nv) => {
  const number = Number(nv);
  return Number.isInteger(number) && number <= 23 && number >= 0;
};

export const validateMinuteInput = (nv) => {
  const number = Number(nv);
  return Number.isInteger(number) && number <= 59 && number >= 0;
};

export const getNextTime = (startTime, playSpeed, timeUnit) => {
  const newDate = new JulianDate();
  if (timeUnit === TIME_UNITS.hours) {
    JulianDate.addMinutes(startTime, playSpeed, newDate);
    return newDate;
  } else if (timeUnit === TIME_UNITS.days) {
    JulianDate.addDays(startTime, playSpeed, newDate);
    return newDate;
  }
  throw new Error('invalid time unit provided');
};

export const shouldAdvance = (startTime, end) =>
  JulianDate.compare(startTime, end) < 0;

export const getDateStringFromJulian = (julianDate) =>
  JulianDate.toDate(julianDate).toISOString().substring(0, 10);

export const getHoursFromJulian = (julianDate) =>
  JulianDate.toDate(julianDate).getHours();

export const getMinutesFromJulian = (julianDate) =>
  JulianDate.toDate(julianDate).getMinutes();

export const getTotalMinutesFromJulian = (julianDate) => {
  return (
    JulianDate.toDate(julianDate).getHours() * 60 +
    JulianDate.toDate(julianDate).getMinutes()
  );
};
