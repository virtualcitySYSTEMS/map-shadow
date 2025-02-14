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
  speed: number;
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
  speed: 10,
  timeUnit: TimeUnits.days,
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
          speed: 'Animation time',
          speedUnit: 'Second(s)',
          speedTooltip:
            'Determines the overall duration of the animation in seconds for an daily or annual loop',
          length: 'Length',
          for: 'for',
          hours: 'hours',
          hoursFormat: 'Hour of day (00 to 23)',
          minutesFormat: 'Minutes of day (00 to 59)',
          days: 'days',
          units: 'units',
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
          speed: 'Animationsdauer',
          speedUnit: 'Sekunde(n)',
          speedTooltip:
            'Bestimmt die Animationsdauer in Sekunden für einen Jahres- bzw. Tagesdurchlauf',
          length: 'Länge',
          for: 'für',
          hours: 'Stunden',
          hoursFormat: 'Stunden (00 bis 23)',
          minutesFormat: 'Minuten (00 bis 59)',
          days: 'Tagen',
          units: 'Maßeinheiten',
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
