import { VcsCallback } from '@vcmap/ui';
import type { VcsUiApp } from '@vcmap/ui';
import { getLogger } from '@vcsuite/logger';
import { name as pluginName } from '../../package.json';
import type { ShadowPlugin } from '../index.js';

class DeactivateShadowCallback extends VcsCallback {
  static get className(): string {
    return 'DeactivateShadowCallback';
  }

  callback(): void {
    const plugin = (this._app as VcsUiApp).plugins.getByKey(pluginName) as
      | ShadowPlugin
      | undefined;
    if (!plugin) {
      getLogger('DeactivateShadowCallback').warning(
        `Plugin ${pluginName} not found`,
      );
      return;
    }
    plugin.deactivate();
  }
}

export default DeactivateShadowCallback;
