import { ToolboxType } from '@vcmap/ui';
import { CesiumMap } from '@vcmap/core';
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
  };

  return {
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    state: defaultState,
    /**
     * @param {import("@vcmap/ui").VcsUiApp} vcsUiApp
     * @returns {Promise<void>}
     */
    async initialize(vcsUiApp) {
      this._app = vcsUiApp;
      const { action, destroy } = setupToolActions(vcsUiApp, defaultState);
      action.disabled = !(vcsUiApp.maps.activeMap instanceof CesiumMap);
      this._destroyAction = destroy;
      this._mapChangedListener = vcsUiApp.maps.mapActivated.addEventListener(
        (map) => {
          if (!(map instanceof CesiumMap)) {
            if (this._app.windowManager.has(windowComponent.id)) {
              this._app.windowManager.remove(windowComponent.id);
            }
            action.disabled = true;
          } else {
            action.disabled = false;
          }
        },
      );

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
        speed: 'Speed',
        speedTooltip:
          'Determines the speed of animation by adjusting the interval (in minutes or days for each type of animation, respectively) between each frame.',
        length: 'length',
        for: 'for',
        hours: 'hours',
        hoursFormat: 'hour of day (00 to 23)',
        minutesFormat: 'minutes of day (00 to 59)',
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
        animateDay: 'Schatten über einen Tag animieren',
        animateYear: 'Schatten über ein Jahr animieren',
        pause: 'Pause',
        speed: 'Geschwindigkeit',
        speedTooltip:
          'Bestimmt die Geschwindigkeit der Animation, indem das Intervall (in Minuten bzw. Tagen für jede Art von Animation) zwischen den einzelnen Bildern eingestellt wird.',
        length: 'Länge',
        for: 'für',
        hours: 'Stunden',
        hoursFormat: 'Stunden (00 bis 23)',
        minutesFormat: 'Minuten (00 bis 59)',
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
        defaultState.removeListener = null;
      }

      if (this._app) {
        if (this._app.toolboxManager.has(name)) {
          this._app.toolboxManager.remove(name);
        }
        if (this._app.windowManager.has(windowComponent.id)) {
          this._app.windowManager.remove(windowComponent.id);
        }
      }

      if (this._destroyAction) {
        this._destroyAction();
      }

      if (this._mapChangedListener) {
        this._mapChangedListener();
      }
    },
  };
}
