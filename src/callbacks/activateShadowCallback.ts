import { getLogger } from '@vcsuite/logger';
import { VcsCallback } from '@vcmap/ui';
import type { VcsCallbackOptions, VcsUiApp } from '@vcmap/ui';
import type { ShadowPlugin } from '../index.js';
import { name as pluginName } from '../../package.json';
import {
  parsePluginState,
  type ShadowUrlState,
  type ShadowState,
} from '../stateHelper.js';

export type ActivateShadowCallbackOptions = VcsCallbackOptions &
  (ShadowState | ShadowUrlState);

class ActivateShadowCallback extends VcsCallback {
  static get className(): string {
    return 'ActivateShadowCallback';
  }

  private _shadowState: ShadowState;

  constructor(options: ActivateShadowCallbackOptions, app: VcsUiApp) {
    super(options, app);
    this._shadowState = parsePluginState(options);
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
    Object.assign(plugin.state, this._shadowState);
    plugin.activate(false);
  }

  toJSON(): ActivateShadowCallbackOptions {
    const config = super.toJSON();
    return { ...config, ...this._shadowState };
  }
}

export default ActivateShadowCallback;
