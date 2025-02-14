import { WindowComponentOptions, WindowSlot } from '@vcmap/ui';
import { CesiumMap } from '@vcmap/core';
import type { VcsAction, VcsUiApp } from '@vcmap/ui';
import { reactive } from 'vue';
import Shadow from './shadowTool.vue';
import { ShadowState } from './index.js';
import { windowId } from './constants.js';
import { activateShadow, deactivateShadow } from './api.js';
import { name as pluginName } from '../package.json';

export default function setupToolActions(
  app: VcsUiApp,
  state: ShadowState,
): { action: VcsAction; destroy: () => void } {
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

  let deactivateShadowWindow = (): void => {};

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
          app.windowManager.add(windowComponent, pluginName);
        } else {
          deactivateShadowWindow();
        }
        action.background = false;
      } else if (app.maps.activeMap instanceof CesiumMap) {
        const { originalTime, shadowMap, destroy, clock } = activateShadow(
          app,
          state.timeOnClose!,
          deactivateShadowWindow,
        );
        state.destroyShadowMapChangedListener = destroy;
        state.shadowMap = shadowMap;
        state.clock = clock;
        if (!state.originalTime && originalTime) {
          state.originalTime = originalTime;
        }
        action.active = true;
        app.windowManager.add(windowComponent, pluginName);
      }
    },
  });

  deactivateShadowWindow = (): void => {
    if (state.removeListener) {
      state.removeListener();
      state.removeListener = null;
    }
    if (state.destroyShadowMapChangedListener) {
      state.destroyShadowMapChangedListener();
      state.destroyShadowMapChangedListener = null;
    }
    app.windowManager.remove(windowId);
    if (app.maps.activeMap instanceof CesiumMap) {
      const { timeOnClose } = deactivateShadow(
        app,
        state.shadowMap!,
        state.originalTime!,
      );
      if (timeOnClose) {
        state.timeOnClose = timeOnClose;
      }
    }
    state.shadowMap = null;
    action.active = false;
  };

  const listeners = [
    app.windowManager.added.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        action.active = true;
        action.background = false;
      }
    }),
    app.windowManager.removed.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        action.background = true;
      }
    }),
  ];

  const destroy = (): void => {
    if (state.removeListener) {
      state.removeListener();
    }
    if (state.destroyShadowMapChangedListener) {
      state.destroyShadowMapChangedListener();
    }
    if (app.maps.activeMap instanceof CesiumMap) {
      deactivateShadowWindow();
    }
    if (state.shadowMap) {
      state.shadowMap.enabled = false;
    }
    if (state.clock) {
      state.clock.currentTime = state.originalTime!;
    }
    listeners.forEach((cb) => cb());
  };

  return { action, destroy };
}
