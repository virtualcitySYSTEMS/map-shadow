import { WindowSlot } from '@vcmap/ui';
import { reactive, computed } from 'vue';
import { CesiumMap } from '@vcmap/core';
import Shadow from './shadowTool.vue';
import { name as pluginName } from '../package.json';
import { windowId } from './constants.js';
import { activateShadow, deactivateShadow } from './api.js';

/**
 * @param {import("@vcmap/ui").VcsAction} action
 * @returns {string}
 */
function getToggleTitle(action) {
  if (action?.active) {
    if (action?.background) {
      return 'shadow.toolState.open';
    }
    return 'shadow.toolState.deactivate';
  }
  return 'shadow.toolState.activate';
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app
 * @param {Object} state
 * @returns {{action: import("@vcmap/ui").VcsAction, destroy: () => void}}
 */
export default function setupToolActions(app, state) {
  /**
   *
   * @type {import("@vcmap/ui").WindowComponentOptions}
   */
  const windowComponent = {
    id: windowId,
    component: Shadow,
    slot: WindowSlot.DYNAMIC_LEFT,
    state: {
      headerTitle: 'shadow.shadow',
      headerIcon: '$vcsShadow',
      infoUrlCallback: app.getHelpUrlCallback('/tools/shadowTool.html'),
    },
  };

  let deactivateShadowWindow = () => {};

  const action = reactive({
    name: computed(() => getToggleTitle(action)),
    title: 'shadow.toolState.open',
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
          state.timeOnClose,
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

  deactivateShadowWindow = () => {
    if (state.removeListener) {
      state.removeListener();
      state.removeListener = null;
    }
    if (state.destroyShadowMapChangedListener) {
      state.destroyShadowMapChangedListener();
      state.destroyShadowMapChangedListener = null;
    }
    app.windowManager.remove(windowComponent.id);
    if (app.maps.activeMap instanceof CesiumMap) {
      const { timeOnClose } = deactivateShadow(
        app,
        state.shadowMap,
        state.originalTime,
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
        action.title = getToggleTitle(action);
      }
    }),
    app.windowManager.removed.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        action.background = true;
        action.title = getToggleTitle(action);
      }
    }),
  ];

  const destroy = () => {
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
      state.clock.currentTime = state.originalTime;
    }
    listeners.forEach((cb) => cb());
  };

  return { action, destroy };
}
