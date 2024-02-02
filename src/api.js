import { JulianDate } from '@vcmap-cesium/engine';
import { TIME_UNITS } from './constants.js';

/**
 * initializes shadow and clockRange
 * @param {import("@vcmap/ui").VcsUiApp} app
 * @param {import("@vcmap-cesium/engine").JulianDate} timeOnClose
 * @param {()=>void} closeCallback
 * @returns {{originalTime: import("@vcmap-cesium/engine").JulianDate, shadowMap: import("@vcmap-cesium/engine").ShadowMap, destroy: function():void}}
 */
export function activateShadow(app, timeOnClose, closeCallback) {
  app.maps.activeMap.setDefaultShadowMap();
  const cesiumWidget = app.maps.activeMap.getCesiumWidget();
  const { clock } = cesiumWidget;
  const originalTime = Object.assign(clock.currentTime);
  const { shadowMap } = app.maps.activeMap.getScene();
  shadowMap.enabled = true;
  if (timeOnClose) {
    clock.currentTime = timeOnClose;
  }
  const shadowMapChangedListener =
    app.maps.activeMap.shadowMapChanged.addEventListener(() => {
      closeCallback();
    });
  const destroy = () => {
    shadowMapChangedListener();
  };
  return { originalTime, shadowMap, destroy };
}

export function deactivateShadow(app, shadowMap, originalTime) {
  const cesiumWidget = app.maps.activeMap.getCesiumWidget();
  shadowMap.enabled = false;
  const timeOnClose = cesiumWidget.clock.currentTime;
  cesiumWidget.clock.currentTime = originalTime;
  return { timeOnClose };
}

export function validateHourInput(nv) {
  const number = Number(nv);
  return Number.isInteger(number) && number <= 23 && number >= 0;
}

export function validateMinuteInput(nv) {
  const number = Number(nv);
  return Number.isInteger(number) && number <= 59 && number >= 0;
}

export function getNextTime(startTime, playSpeed, timeUnit) {
  const newDate = new JulianDate();
  if (timeUnit === TIME_UNITS.hours) {
    JulianDate.addMinutes(startTime, playSpeed, newDate);
    return newDate;
  } else if (timeUnit === TIME_UNITS.days) {
    JulianDate.addDays(startTime, playSpeed, newDate);
    return newDate;
  }
  throw new Error('invalid time unit provided');
}

export function shouldAdvance(startTime, end) {
  return JulianDate.compare(startTime, end) < 0;
}

export function getDateStringFromJulian(julianDate) {
  return JulianDate.toDate(julianDate).toISOString().substring(0, 10);
}

export function getHoursFromJulian(julianDate) {
  return JulianDate.toDate(julianDate).getHours();
}

export function getMinutesFromJulian(julianDate) {
  return JulianDate.toDate(julianDate).getMinutes();
}

export function getTotalMinutesFromJulian(julianDate) {
  return (
    JulianDate.toDate(julianDate).getHours() * 60 +
    JulianDate.toDate(julianDate).getMinutes()
  );
}
