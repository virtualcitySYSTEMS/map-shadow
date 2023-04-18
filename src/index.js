import { ToolboxType } from '@vcmap/ui';
import { version, name } from '../package.json';
import { TIME_UNITS, windowId } from './constants.js';
import setupToolActions, { windowComponent } from './actionHelper.js';

/**
 * @typedef {Object} PluginState
 * @property {any} prop
 */

/**
 * @returns {import("@vcmap/ui/src/vcsUiApp").VcsPlugin<T, PluginState>}
 * @template {Object} T
 */
export default function shadowPlugin() {
  /**
   * @typedef {Object} DefaultState
   * @property {import("@vcmap-cesium/engine").JulianDate} originalTime current time of the clock before the shadow is enabled, and what it will be set back to upon deactivation
   * @property {import("@vcmap-cesium/engine").JulianDate} timeOnClose current time of clock when deactivating the shadow / will be restored upon reactivation
   * @property {boolean} animate indicates if the shadow is animating
   * @property {number} speed integer from 1 to 10 that controls speed of animation
   * @property {import("./constants").TIME_UNITS} timeUnit
   * @property {import("@vcmap-cesium/engine").JulianDate} endDate julian date to end the animation
   * @property {Function} removeListener remove onTick listener
   */
  /**
   * @type {DefaultState}
   */
  const defaultState = {
    originalTime: null,
    timeOnClose: null,
    animate: false,
    speed: 1,
    timeUnit: TIME_UNITS.days,
    endDate: null,
    removeListener: null,
    destroy: null,
  };

  return {
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    state: defaultState,

    initialize: async (vcsUiApp) => {
      const { action, destroy } = setupToolActions(vcsUiApp, defaultState);
      defaultState.destroy = () => {
        destroy();
        if (vcsUiApp.toolboxManager.has(name)) {
          vcsUiApp.toolboxManager.remove(name);
        }
        if (vcsUiApp.windowManager.has(windowComponent.id)) {
          vcsUiApp.windowManager.remove(windowComponent.id);
        }
      };

      vcsUiApp.toolboxManager.add(
        {
          id: windowId,
          type: ToolboxType.SINGLE,
          action,
        },
        name,
      );
    },

    i18n: {
      en: {
        shadow: 'Shadow',
        date: 'Date',
        time: 'Time',
        animateDay: 'Animate shadow over a day',
        animateYear: 'Animate shadow over a year',
        pause: 'Pause',
        speed: 'speed',
        speedTooltip:
          'Determines the speed of animation by adjusting the interval (in minutes or days for each type of animation, respectively) between each frame.',
        length: 'length',
        for: 'for',
        hours: 'hours',
        hoursFormat: 'hour of day (00 to 23)',
        minutesFormat: 'minutes of day (00 to 59)',
        dateFormat: 'Date in format: ',
        days: 'days',
        units: 'units',
        toolState: {
          open: 'Open shadow tool window',
          activate: 'Activate shadow tool',
          deactivate: 'Deactivate shadow tool',
        },
      },
      de: {
        shadow: 'Schatten',
        date: 'Datum',
        time: 'Uhrzeit',
        animateDay: 'Lebendiger Schatten über einen Tag',
        animateYear: 'Lebendiger Schatten über ein Jahr',
        pause: 'Pause',
        speed: 'Geschwindigkeit',
        speedTooltip:
          'Bestimmt die Geschwindigkeit der Animation, indem das Intervall (in Minuten bzw. Tagen für jede Art von Animation) zwischen den einzelnen Bildern eingestellt wird.',
        length: 'Länge',
        for: 'für',
        hours: 'Stunden',
        hoursFormat: 'Stunden (00 bis 23)',
        minutesFormat: 'Minuten (00 bis 59)',
        dateFormat: 'Datum im Format: ',
        days: 'Tagen',
        units: 'Maßeinheiten',
        toolState: {
          open: 'Shadow Tool Fenster öffnen',
          activate: 'Shadow Tool aktivieren',
          deactivate: 'Shadow Tool deaktivieren',
        },
      },
    },
    destroy() {
      if (defaultState.removeListener) {
        defaultState.removeListener();
      }
      defaultState.destroy();
    },
  };
}
