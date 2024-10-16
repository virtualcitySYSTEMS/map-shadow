import { reactive } from 'vue';
import { ToolboxType } from '@vcmap/ui';
import { CesiumMap } from '@vcmap/core';
import { version, name, mapVersion } from '../package.json';
import { TIME_UNITS, windowId } from './constants.js';
import setupToolActions from './actionHelper.js';

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
   * @property {function():void} removeListener remove onTick listener
   * @property {import("@vcmap-cesium/engine").ShadowMap} shadowMap cached ShadowMap
   * @property {function():void} destroyShadowMapChangedListener destroys the shadowMapChangedListener
   */

  /**
   * @type {DefaultState}
   */
  const defaultState = reactive({
    originalTime: null,
    timeOnClose: null,
    animate: false,
    speed: 10,
    timeUnit: TIME_UNITS.days,
    endDate: null,
    removeListener: null,
    shadowMap: null,
    destroyShadowMapChangedListener: null,
    clock: null,
  });

  return {
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    get mapVersion() {
      return mapVersion;
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
            if (this._app.windowManager.has(windowId)) {
              this._app.windowManager.remove(windowId);
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
    toJSON() {
      return {};
    },
    getDefaultOptions() {
      return {};
    },
    getConfigEditors() {
      return [];
    },
    i18n: {
      en: {
        shadow: {
          shadow: 'Simulate shadows',
          date: 'Date',
          time: 'Time',
          animateDay: 'Animate shadow over a day',
          animateYear: 'Animate shadow over a year',
          pause: 'Pause',
          speed: 'Animation time',
          speedUnit: 'Second(s)',
          speedTooltip:
            'Determines the animation speed in seconds for an annual or daily loop',
          length: 'Length',
          for: 'for',
          hours: 'hours',
          hoursFormat: 'Hour of day (00 to 23)',
          minutesFormat: 'Minutes of day (00 to 59)',
          days: 'days',
          units: 'units',
          toolState: {
            open: 'Open Shadow Tool window',
            activate: 'Enable Shadow Tool',
            deactivate: 'Disable Shadow Tool',
          },
        },
      },
      de: {
        shadow: {
          shadow: 'Schatten simulieren',
          date: 'Datum',
          time: 'Uhrzeit',
          animateDay: 'Schatten über einen Tag animieren',
          animateYear: 'Schatten über ein Jahr animieren',
          pause: 'Pause',
          speed: 'Animationsdauer',
          speedUnit: 'Sekunde(n)',
          speedTooltip:
            'Bestimmt die Animationsgeschwindigkeit in Sekunden für einen Jahres- bzw. Tagesdurchlauf',
          length: 'Länge',
          for: 'für',
          hours: 'Stunden',
          hoursFormat: 'Stunden (00 bis 23)',
          minutesFormat: 'Minuten (00 bis 59)',
          days: 'Tagen',
          units: 'Maßeinheiten',
          toolState: {
            open: 'Schatten Tool Fenster öffnen',
            activate: 'Schatten Tool aktivieren',
            deactivate: 'Schatten Tool deaktivieren',
          },
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
        if (this._app.windowManager.has(windowId)) {
          this._app.windowManager.remove(windowId);
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
