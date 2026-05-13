import { JulianDate } from '@vcmap-cesium/engine';
import type { ShadowState } from './index.js';
import { TimeUnits } from './constants.js';

export type ShadowUrlState = {
  originalTime?: string;
  timeOnClose?: string;
  animate?: boolean;
  duration?: number;
  timeUnit?: TimeUnits;
  endDate?: string;
};

export function parseUrlPluginState(
  state: ShadowState | ShadowUrlState | undefined,
): ShadowState {
  const parsed: ShadowState = {
    originalTime: null,
    timeOnClose: null,
    endDate: null,
    animate: state?.animate ?? false,
    duration: state?.duration ?? 10,
    timeUnit: state?.timeUnit ?? TimeUnits.Days,
  };

  if (state?.originalTime) {
    parsed.originalTime =
      state.originalTime instanceof JulianDate
        ? state.originalTime
        : JulianDate.fromIso8601(state.originalTime);
  }
  if (state?.timeOnClose) {
    parsed.timeOnClose =
      state.timeOnClose instanceof JulianDate
        ? state.timeOnClose
        : JulianDate.fromIso8601(state.timeOnClose);
  }
  if (state?.endDate) {
    parsed.endDate =
      state.endDate instanceof JulianDate
        ? state.endDate
        : JulianDate.fromIso8601(state.endDate);
  }

  return parsed;
}
