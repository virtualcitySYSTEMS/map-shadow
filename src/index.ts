import { CesiumMap } from '@vcmap/core';
import { ToolboxType } from '@vcmap/ui';
import type { PluginConfigEditor, VcsPlugin, VcsUiApp } from '@vcmap/ui';
import type { Clock, JulianDate, ShadowMap } from '@vcmap-cesium/engine';
import { reactive } from 'vue';
import { TimeUnits, windowId } from './constants.js';
import { name, version, mapVersion } from '../package.json';
import setupToolActions from './actionHelper.js';

type ShadowConfig = Record<never, never>;
export type ShadowState = {
  originalTime: JulianDate | null;
  timeOnClose: JulianDate | null;
  animate: boolean;
  duration: number;
  timeUnit: TimeUnits;
  endDate: JulianDate | null;
  removeListener: (() => void) | null;
  shadowMap: ShadowMap | null;
  destroyShadowMapChangedListener: (() => void) | null;
  clock: Clock | null;
};
export type ShadowPlugin = VcsPlugin<ShadowConfig, ShadowState> & {
  readonly state: ShadowState;
};

const defaultState = reactive<ShadowState>({
  originalTime: null,
  timeOnClose: null,
  animate: false,
  duration: 10,
  timeUnit: TimeUnits.Days,
  endDate: null,
  removeListener: null,
  shadowMap: null,
  destroyShadowMapChangedListener: null,
  clock: null,
});

export default function shadowPlugin(): ShadowPlugin {
  let app: VcsUiApp;
  let destroyAction: (() => void) | undefined;
  let mapChangedListener: (() => void) | undefined;

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
    initialize(vcsUiApp: VcsUiApp): Promise<void> {
      app = vcsUiApp;
      const { action, destroy } = setupToolActions(vcsUiApp, defaultState);
      action.disabled = !(vcsUiApp.maps.activeMap instanceof CesiumMap);
      destroyAction = destroy;
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
      if (defaultState.removeListener) {
        defaultState.removeListener();
        defaultState.removeListener = null;
      }

      if (app?.toolboxManager.has(name)) {
        app.toolboxManager.remove(name);
      }
      if (app?.windowManager.has(windowId)) {
        app.windowManager.remove(windowId);
      }
      destroyAction?.();
      mapChangedListener?.();
    },
  };
}
