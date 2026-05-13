import { getLogger } from '@vcsuite/logger';
import { VcsCallback } from '@vcmap/ui';
import type { JulianDate } from '@vcmap-cesium/engine';
import type { VcsCallbackOptions, VcsUiApp } from '@vcmap/ui';
import type { ShadowPlugin, ShadowState } from '../index.js';
import { name as pluginName } from '../../package.json';
import type { TimeUnits } from '../constants.js';
import { parseUrlPluginState, type ShadowUrlState } from '../stateHelper.js';

export type ActivateShadowCallbackOptions = VcsCallbackOptions &
  (ShadowState | ShadowUrlState);

class ActivateShadowCallback extends VcsCallback {
  static get className(): string {
    return 'ActivateShadowCallback';
  }

  private _originalTime: JulianDate | undefined;
  private _timeOnClose: JulianDate | undefined;
  private _animate: boolean | undefined;
  private _duration: number | undefined;
  private _timeUnit: TimeUnits | undefined;
  private _endDate: JulianDate | undefined;

  constructor(options: ActivateShadowCallbackOptions, app: VcsUiApp) {
    super(options, app);
    const parsedState = parseUrlPluginState(options);

    this._originalTime = parsedState.originalTime ?? undefined;
    this._timeOnClose = parsedState.timeOnClose ?? undefined;
    this._animate = parsedState.animate ?? undefined;
    this._duration = parsedState.duration ?? undefined;
    this._timeUnit = parsedState.timeUnit ?? undefined;
    this._endDate = parsedState.endDate ?? undefined;
  }

  callback(): void {
    const plugin = (this._app as VcsUiApp).plugins.getByKey(pluginName) as
      | ShadowPlugin
      | undefined;
    if (!plugin) {
      getLogger('ActivateShadowCallback').warning(
        `Plugin ${pluginName} not found`,
      );
      return;
    }
    if (this._originalTime) {
      plugin.state.originalTime = this._originalTime;
    }
    if (this._timeOnClose) {
      plugin.state.timeOnClose = this._timeOnClose;
    }
    if (this._animate !== undefined) {
      plugin.state.animate = this._animate;
    }
    if (this._duration !== undefined) {
      plugin.state.duration = this._duration;
    }
    if (this._timeUnit) {
      plugin.state.timeUnit = this._timeUnit;
    }
    if (this._endDate) {
      plugin.state.endDate = this._endDate;
    }
    plugin.activate();
  }

  toJSON(): ActivateShadowCallbackOptions {
    const config = super.toJSON() as ActivateShadowCallbackOptions;
    if (this._originalTime) {
      config.originalTime = this._originalTime;
    }
    if (this._timeOnClose) {
      config.timeOnClose = this._timeOnClose;
    }
    if (this._animate !== undefined) {
      config.animate = this._animate;
    }
    if (this._duration !== undefined) {
      config.duration = this._duration;
    }
    if (this._timeUnit) {
      config.timeUnit = this._timeUnit;
    }
    if (this._endDate) {
      config.endDate = this._endDate;
    }
    return config;
  }
}

export default ActivateShadowCallback;
