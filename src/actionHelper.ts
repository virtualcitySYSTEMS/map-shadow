import { WindowSlot } from '@vcmap/ui';
import { CesiumMap } from '@vcmap/core';
import type { VcsAction, VcsUiApp, WindowComponentOptions } from '@vcmap/ui';
import { reactive, watch } from 'vue';
import { name as pluginName } from '../package.json';
import type { ShadowPlugin } from './index.js';
import Shadow from './shadowTool.vue';
import { windowId } from './constants.js';
import { activateShadow, deactivateShadow } from './api.js';

export default function setupToolActions(
  app: VcsUiApp,
  plugin: ShadowPlugin,
): {
  action: VcsAction;
  destroy: () => void;
  activate: () => void;
  deactivate: () => void;
} {
  const { state } = plugin;
  const windowComponent: WindowComponentOptions = {
    id: windowId,
    component: Shadow,
    slot: WindowSlot.DYNAMIC_LEFT,
    state: {
      headerTitle: 'shadow.title',
      headerIcon: '$vcsShadow',
      infoUrlCallback: app.getHelpUrlCallback(
        '/tools/shadowTool.html',
        'vc-map',
      ),
    },
  };

  let activateShadowWindow: () => void = () => {};
  let deactivateShadowWindow: () => void = () => {};
  let destroyShadowMapChangedListener: (() => void) | undefined;

  const action: VcsAction = reactive({
    name: 'shadowAction',
    title: 'shadow.title',
    icon: '$vcsShadow',
    active: false,
    background: false,
    disabled: false,
    callback() {
      if (action.active) {
        if (action.background) {
          action.background = false;
          app.windowManager.add(windowComponent, pluginName);
        } else {
          deactivateShadowWindow();
        }
      } else {
        activateShadowWindow();
      }
    },
  });

  deactivateShadowWindow = (): void => {
    if (plugin.removeOnTickListener) {
      plugin.removeOnTickListener();
      plugin.removeOnTickListener = undefined;
    }
    if (destroyShadowMapChangedListener) {
      destroyShadowMapChangedListener();
      destroyShadowMapChangedListener = undefined;
    }
    if (app.windowManager.has(windowId)) {
      app.windowManager.remove(windowId);
    }
    if (
      app.maps.activeMap instanceof CesiumMap &&
      plugin.shadowMap &&
      state.originalTime
    ) {
      const { timeOnClose } = deactivateShadow(
        app,
        plugin.shadowMap,
        state.originalTime,
      );
      if (timeOnClose) {
        state.timeOnClose = timeOnClose;
      }
    }
    plugin.shadowMap = undefined;
    plugin.clock = undefined;
    action.active = false;
    action.background = false;
  };

  activateShadowWindow = (): void => {
    if (!(app.maps.activeMap instanceof CesiumMap)) {
      return;
    }
    if (!plugin.shadowMap) {
      const { originalTime, shadowMap, destroy, clock } = activateShadow(
        app,
        state.timeOnClose!,
        deactivateShadowWindow,
      );
      destroyShadowMapChangedListener = destroy;
      plugin.shadowMap = shadowMap;
      plugin.clock = clock;
      if (!state.originalTime && originalTime) {
        state.originalTime = originalTime;
      }
    }
    action.active = true;
    if (!app.windowManager.has(windowId)) {
      app.windowManager.add(windowComponent, pluginName);
    }
  };

  const listeners = [
    app.windowManager.added.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        action.active = true;
        action.background = false;
      }
    }),
    app.windowManager.removed.addEventListener(({ id }) => {
      if (id === windowComponent.id && action.active) {
        action.background = true;
      }
    }),
    watch(
      () => plugin.shadowMap,
      (newShadowMap) => {
        if (newShadowMap && !action.active) {
          action.active = true;
          action.background = true;
        } else if (!newShadowMap && action.active) {
          action.active = false;
          action.background = false;
        }
      },
    ),
  ];

  const destroy = (): void => {
    if (plugin.removeOnTickListener) {
      plugin.removeOnTickListener();
    }
    if (destroyShadowMapChangedListener) {
      destroyShadowMapChangedListener();
      destroyShadowMapChangedListener = undefined;
    }
    if (app.maps.activeMap instanceof CesiumMap) {
      deactivateShadowWindow();
    }
    if (plugin.shadowMap) {
      plugin.shadowMap.enabled = false;
    }
    if (plugin.clock) {
      plugin.clock.currentTime = state.originalTime!;
    }
    listeners.forEach((cb) => {
      cb();
    });
  };

  return {
    action,
    destroy,
    activate: activateShadowWindow,
    deactivate: deactivateShadowWindow,
  };
}
