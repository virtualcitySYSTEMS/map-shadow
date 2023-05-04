import { WindowSlot } from '@vcmap/ui';
import { reactive, computed } from 'vue';
import Shadow from './shadow.vue';
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
      return 'toolState.open';
    }
    return 'toolState.deactivate';
  }
  return 'toolState.activate';
}
/**
 *
 * @type {import("@vcmap/ui").WindowComponentOptions}
 */
export const windowComponent = {
  id: windowId,
  component: Shadow,
  slot: WindowSlot.DYNAMIC_LEFT,
  state: {
    headerTitle: 'shadow',
    headerIcon: '$vcsShadow',
  },
};
/**
 * @param {import("@vcmap/ui").VcsUiApp} app
 * @param {Object} state
 * @returns {function():void}
 */
export default function setupToolActions(app, state) {
  const action = reactive({
    name: computed(() => getToggleTitle(this)),
    title: 'toolState.open',
    icon: '$vcsShadow',
    active: false,
    background: false,
    disabled: false,
    callback() {
      if (this.active) {
        if (this.background) {
          app.windowManager.add(windowComponent, pluginName);
        } else {
          state.removeListener();
          state.removeListener = null;
          app.windowManager.remove(windowComponent.id);
          const { timeOnClose } = deactivateShadow(app, state.originalTime);
          state.timeOnClose = timeOnClose;
          this.active = false;
        }
        this.background = false;
      } else {
        const { originalTime } = activateShadow(app, state.timeOnClose);
        if (!state.originalTime) {
          state.originalTime = originalTime;
        }
        this.active = true;
        app.windowManager.add(windowComponent, pluginName);
      }
    },
  });

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
    listeners.forEach((cb) => cb());
  };

  return { action, destroy };
}
