import { TimeUnits } from './constants.js';
import type { ShadowPlugin } from './index.js';

export type ShadowState = {
  /**
   * Baseline ISO 8601 time captured when the shadow simulation is first activated.
   * Used to restore the original map time when the tool is fully torn down.
   */
  originalTime?: string;
  /**
   * Last clock  ISO 8601 time when the tool was closed/deactivated.
   * Used to resume from the previous position on the next activation.
   */
  timeOnClose?: string;
  /**
   * Indicates whether the automatic shadow animation is currently running.
   */
  animate: boolean;
  /**
   * Total duration of one animation cycle in the currently selected time unit.
   */
  duration: number;
  /**
   * Time unit used for animation and duration interpretation (e.g. day or year).
   */
  timeUnit: TimeUnits;
  /**
   * Target  ISO 8601 time for the current animation run.
   * Once reached, animation stops and the state is reset.
   */
  endDate?: string;
};

export type ShadowUrlState = {
  /** originalTime */
  ot?: string;
  /** timeOnClose */
  toc?: string;
  /** animate */
  a?: boolean;
  /** duration */
  d?: number;
  /** timeUnit */
  tu?: TimeUnits;
  /** endDate */
  ed?: string;
};

export function getDefaultState(): ShadowState {
  return {
    animate: false,
    duration: 10,
    timeUnit: TimeUnits.Days,
  };
}

function isShadowUrlState(
  state: ShadowState | ShadowUrlState,
): state is ShadowUrlState {
  if (
    'ot' in state ||
    'toc' in state ||
    'a' in state ||
    'd' in state ||
    'tu' in state ||
    'ed' in state
  ) {
    return true;
  } else {
    return false;
  }
}

export function parsePluginState(
  state?: ShadowState | ShadowUrlState,
): ShadowState {
  const parsed = getDefaultState();
  if (!state) {
    return parsed;
  }
  if (!isShadowUrlState(state)) {
    return { ...parsed, ...state };
  }

  if (state.ot) {
    parsed.originalTime = state.ot;
  }
  if (state.toc) {
    parsed.timeOnClose = state.toc;
  }
  if (state.a) {
    parsed.animate = state.a;
  }
  if (state.d) {
    parsed.duration = state.d;
  }
  if (state.tu) {
    parsed.timeUnit = state.tu;
  }
  if (state.ed) {
    parsed.endDate = state.ed;
  }

  return parsed;
}

export function getPluginState(
  plugin: ShadowPlugin,
  forUrl?: boolean,
): ShadowState | ShadowUrlState {
  const { state, clock, active } = plugin;
  if (!active) {
    return {};
  }
  if (forUrl) {
    const urlState: ShadowUrlState = {
      a: state.animate,
      d: state.duration,
      tu: state.timeUnit,
    };
    if (state.originalTime !== undefined) {
      urlState.ot = state.originalTime;
    }
    if (state.endDate !== undefined) {
      urlState.ed = state.endDate;
    }
    urlState.toc = clock?.currentTime.toString();
    return urlState;
  } else {
    const configState: ShadowState = {
      animate: state.animate,
      duration: state.duration,
      timeUnit: state.timeUnit,
    };
    if (state.originalTime !== undefined) {
      configState.originalTime = state.originalTime;
    }
    if (state.endDate !== undefined) {
      configState.endDate = state.endDate;
    }
    state.timeOnClose = clock?.currentTime.toString();
    return configState;
  }
}
