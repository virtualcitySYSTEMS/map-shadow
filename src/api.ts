import type { CesiumMap } from '@vcmap/core';
import type { VcsUiApp } from '@vcmap/ui';
import type { Clock, ShadowMap } from '@vcmap-cesium/engine';
import { JulianDate } from '@vcmap-cesium/engine';
import { TimeUnits } from './constants.js';

/** initializes shadow and clockRange */
export function activateShadow(
  app: VcsUiApp,
  timeOnClose: JulianDate,
  closeCallback: () => void,
): {
  originalTime: JulianDate;
  shadowMap: ShadowMap;
  destroy: () => void;
  clock: Clock;
} {
  const map = app.maps.activeMap as CesiumMap;
  map.setDefaultShadowMap();
  const cesiumWidget = map.getCesiumWidget()!;
  const { clock } = cesiumWidget;
  const originalTime = Object.assign(clock.currentTime);
  const { shadowMap } = map.getScene()!;
  shadowMap.enabled = true;
  if (timeOnClose) {
    clock.currentTime = timeOnClose;
  }
  const shadowMapChangedListener = map.shadowMapChanged.addEventListener(() => {
    closeCallback();
  });
  const destroy = (): void => {
    shadowMapChangedListener();
  };
  return { originalTime, shadowMap, destroy, clock };
}

export function deactivateShadow(
  app: VcsUiApp,
  shadowMap: ShadowMap,
  originalTime: JulianDate,
): { timeOnClose: JulianDate } {
  const map = app.maps.activeMap as CesiumMap;
  const cesiumWidget = map.getCesiumWidget()!;
  if (shadowMap) {
    shadowMap.enabled = false;
  }
  const timeOnClose = cesiumWidget.clock.currentTime;
  if (originalTime) {
    cesiumWidget.clock.currentTime = originalTime;
  }
  return { timeOnClose };
}

export function getNextTime(
  startAnimationTime: Date,
  startLocalJulianDate: JulianDate,
  animationTime: number,
  timeUnit: TimeUnits,
): JulianDate {
  const interDate = new Date();
  const timeElapsed =
    (interDate.getTime() - startAnimationTime.getTime()) / 1000;
  if (timeUnit === TimeUnits.hours) {
    const step = ((60 * 24) / animationTime) * timeElapsed;
    return JulianDate.addMinutes(
      startLocalJulianDate,
      Math.ceil(step),
      new JulianDate(),
    );
  } else if (timeUnit === TimeUnits.days) {
    const step = (365 / animationTime) * timeElapsed;
    return JulianDate.addDays(
      startLocalJulianDate,
      Math.ceil(step),
      new JulianDate(),
    );
  }
  throw new Error('invalid time unit provided');
}

export function shouldAdvance(startTime: JulianDate, end: JulianDate): boolean {
  return JulianDate.compare(startTime, end) < 0;
}

export function getHoursFromJulian(julianDate: JulianDate): number {
  return JulianDate.toDate(julianDate).getHours();
}

export function getMinutesFromJulian(julianDate: JulianDate): number {
  return JulianDate.toDate(julianDate).getMinutes();
}

export function getTotalMinutesFromJulian(julianDate: JulianDate): number {
  return getHoursFromJulian(julianDate) * 60 + getMinutesFromJulian(julianDate);
}
