import { CesiumMap, moduleIdSymbol } from '@vcmap/core';
import { ToolboxType } from '@vcmap/ui';
import type { PluginConfigEditor, VcsPlugin, VcsUiApp } from '@vcmap/ui';
import type { Clock, JulianDate, ShadowMap } from '@vcmap-cesium/engine';
import { reactive } from 'vue';
import { TimeUnits, windowId } from './constants.js';
import { name, version, mapVersion } from '../package.json';
import setupToolActions from './actionHelper.js';
import ActivateShadowCallback from './callbacks/activateShadowCallback.js';
import DeactivateShadowCallback from './callbacks/deactivateShadowCallback.js';

type ShadowConfig = Record<never, never>;

export type ShadowState = {
  /**
   * Baseline clock time captured when the shadow simulation is first activated.
   * Used to restore the original map time when the tool is fully torn down.
   */
  originalTime: JulianDate | null;
  /**
   * Last clock time when the tool was closed/deactivated.
   * Used to resume from the previous position on the next activation.
   */
  timeOnClose: JulianDate | null;
  /**
   * Indicates whether the automatic shadow animation is currently running.
   */
  animate: boolean;
  /**
   * Total duration of one animation cycle in the currently selected time unit.
   */
  duration: number;
  /**
   * Time unit used for animation and duration interpretation (e.g. day or year).
   */
  timeUnit: TimeUnits;
  /**
   * Target time for the current animation run.
   * Once reached, animation stops and the state is reset.
   */
  endDate: JulianDate | null;
};
export type ShadowPlugin = VcsPlugin<ShadowConfig, ShadowState> & {
  readonly state: ShadowState;
  activate: (showWindow?: boolean) => void;
  deactivate: () => void;
  clock: Clock | undefined;
  shadowMap: ShadowMap | undefined;
  removeOnTickListener: (() => void) | undefined;
};

const defaultState = reactive<ShadowState>({
  originalTime: null,
  timeOnClose: null,
  animate: false,
  duration: 10,
  timeUnit: TimeUnits.Days,
  endDate: null,
});

export default function shadowPlugin(): ShadowPlugin {
  let app: VcsUiApp;
  let setup: ReturnType<typeof setupToolActions> | undefined;
  let mapChangedListener: (() => void) | undefined;

  let clock: Clock | undefined;
  let shadowMap: ShadowMap | undefined;
  let removeOnTickListener: (() => void) | undefined;

  return {
    get name(): string {
      return name;
    },
    get version(): string {
      return version;
    },
    get mapVersion(): string {
      return mapVersion;
    },
    state: defaultState,
    clock,
    shadowMap,
    removeOnTickListener,
    initialize(vcsUiApp: VcsUiApp): Promise<void> {
      app = vcsUiApp;
      app.callbackClassRegistry.registerClass(
        this[moduleIdSymbol],
        ActivateShadowCallback.className,
        ActivateShadowCallback,
      );
      app.callbackClassRegistry.registerClass(
        this[moduleIdSymbol],
        DeactivateShadowCallback.className,
        DeactivateShadowCallback,
      );

      setup = setupToolActions(vcsUiApp, this);
      const { action } = setup;
      action.disabled = !(vcsUiApp.maps.activeMap instanceof CesiumMap);
      mapChangedListener = vcsUiApp.maps.mapActivated.addEventListener(
        (map) => {
          if (!(map instanceof CesiumMap)) {
            if (app.windowManager.has(windowId)) {
              app.windowManager.remove(windowId);
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
      return Promise.resolve();
    },
    activate(): void {
      setup?.activate();
    },
    deactivate(): void {
      setup?.deactivate();
    },
    getDefaultOptions(): ShadowConfig {
      return {};
    },
    toJSON(): ShadowConfig {
      return {};
    },
    i18n: {
      en: {
        shadow: {
          title: 'Simulate shadows',
          date: 'Date',
          time: 'Time',
          animateDay: 'Animate shadow over a day',
          animateYear: 'Animate shadow over a year',
          pause: 'Pause',
          duration: 'Animation duration',
          durationTooltip:
            'Determines the overall duration of the animation for a daily or annual loop.',
          hours: 'hours',
          minutes: 'minutes',
          min: 'min',
          seconds: 'seconds',
          sec: 'sec',
          and: 'and',
          hoursFormat: 'Hour of day (00 to 23)',
          minutesFormat: 'Minutes of day (00 to 59)',
          timePickerSelectHint: 'Select the',
        },
      },
      de: {
        shadow: {
          title: 'Schatten simulieren',
          date: 'Datum',
          time: 'Uhrzeit',
          animateDay: 'Schatten über einen Tag animieren',
          animateYear: 'Schatten über ein Jahr animieren',
          pause: 'Pause',
          duration: 'Animationsdauer',
          durationTooltip:
            'Definiert die Gesamtdauer der Animation für einen Tages- bzw. Jahresdurchlauf.',
          hours: 'Stunden',
          minutes: 'Minuten',
          min: 'Min',
          seconds: 'Sekunden',
          sec: 'Sek',
          and: 'und',
          hoursFormat: 'Stunden (00 bis 23)',
          minutesFormat: 'Minuten (00 bis 59)',
          timePickerSelectHint: 'Wählen Sie die',
        },
      },
    },
    getConfigEditors(): PluginConfigEditor<object>[] {
      return [];
    },
    destroy(): void {
      if (app) {
        app.callbackClassRegistry.unregisterClass(
          this[moduleIdSymbol],
          ActivateShadowCallback.className,
        );
        app.callbackClassRegistry.unregisterClass(
          this[moduleIdSymbol],
          DeactivateShadowCallback.className,
        );
      }
      if (removeOnTickListener) {
        removeOnTickListener();
        removeOnTickListener = undefined;
      }

      if (app?.toolboxManager.has(name)) {
        app.toolboxManager.remove(name);
      }
      if (app?.windowManager.has(windowId)) {
        app.windowManager.remove(windowId);
      }
      setup?.destroy();
      mapChangedListener?.();
    },
  };
}
