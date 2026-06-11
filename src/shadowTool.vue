<template>
  <v-container class="pa-2 overflow-hidden">
    <v-row
      no-gutters
      class="d-flex flex-nowrap align-center justify-space-between"
    >
      <v-col class="d-flex align-center justify-start">
        <VcsLabel html-for="time-slider">
          {{ $t('shadow.time') }}
        </VcsLabel>
      </v-col>
      <v-col class="d-flex align-center justify-end vcs-input-wrap">
        <VcsTextField
          :id="TimeUnits.Hours"
          class="number-input"
          type="number"
          :model-value="hours"
          tooltip="shadow.hoursFormat"
          tooltip-position="bottom"
          hide-spin-buttons
          :disabled="state.animate"
          :rules="[validateHour]"
          @blur="setTime"
          @keyup.enter="setTime"
        />
        :
        <VcsTextField
          :id="TimeUnits.Minutes"
          class="number-input"
          type="number"
          :model-value="minutes"
          tooltip="shadow.minutesFormat"
          tooltip-position="bottom"
          hide-spin-buttons
          :disabled="state.animate"
          :rules="[validateMinute]"
          @blur="setTime"
          @keyup.enter="setTime"
        />
        <VcsButton
          v-if="state.animate"
          icon="mdi-pause-circle"
          tooltip="shadow.pause"
          class="pl-1"
          @click="stopAnimation"
        />
        <VcsButton
          v-else
          icon="$vcsPlayCircle"
          tooltip="shadow.animateDay"
          class="pl-1"
          @click="animateDay"
        />
      </v-col>
    </v-row>
    <VcsSlider
      id="time-slider"
      v-model="totalMinutes"
      :min="0"
      :max="24 * 60 - 1"
      :step="0"
      :disabled="state.animate"
    />
    <v-divider />
    <v-row class="d-flex flex-nowrap align-center justify-space-between">
      <v-col class="d-flex align-center">
        <VcsLabel html-for="date">
          {{ $t('shadow.date') }}
        </VcsLabel>
      </v-col>
      <v-col class="d-flex align-center">
        <VcsDatePicker v-model="date" :disabled="state.animate" />
        <VcsButton
          v-if="state.animate"
          icon="mdi-pause-circle"
          tooltip="shadow.pause"
          class="pl-1"
          @click="stopAnimation"
        />
        <VcsButton
          v-else
          icon="$vcsPlayCircle"
          tooltip="shadow.animateYear"
          small
          class="pl-1"
          @click="animateYear"
        />
      </v-col>
    </v-row>
    <v-divider />
    <v-row class="d-flex flex-nowrap align-center justify-space-between pt-1">
      <v-col class="d-flex justify-start">
        <VcsLabel
          html-for="duration-picker"
          help-text="shadow.durationTooltip"
          tooltip-position="bottom"
          class="gc-2"
        >
          {{ $t('shadow.duration') }}
        </VcsLabel>
      </v-col>
      <v-col class="d-flex align-center justify-end">
        <VcsLabel class="pr-0" html-for="duration-slider">
          {{ state.duration }} {{ $t('shadow.seconds') }}
        </VcsLabel>
      </v-col>
    </v-row>
    <VcsSlider
      id="duration-slider"
      v-model="state.duration"
      type="number"
      show-ticks="always"
      :step="1"
      :min="1"
      :max="20"
    />
  </v-container>
</template>

<script lang="ts">
  import { VCol, VContainer, VDivider, VRow } from 'vuetify/components';
  import { defineComponent, inject, computed, ref, onMounted } from 'vue';
  import { type CesiumMap } from '@vcmap/core';
  import {
    VcsButton,
    VcsDatePicker,
    VcsLabel,
    VcsSlider,
    VcsTextField,
    type VcsUiApp,
  } from '@vcmap/ui';
  import { JulianDate } from '@vcmap-cesium/engine';
  import { type ShadowPlugin } from './index.js';
  import { TimeUnits } from './constants.js';
  import {
    getNextTime,
    shouldAdvance,
    getTotalMinutesFromJulian,
    getHoursFromJulian,
    getMinutesFromJulian,
  } from './api.js';
  import { name } from '../package.json';

  function validateHour(num: number | string): boolean {
    const parsed = typeof num === 'string' ? parseInt(num, 10) : num;
    return Number.isInteger(parsed) && parsed <= 23 && parsed >= 0;
  }

  function validateMinute(num: number | string): boolean {
    const parsed = typeof num === 'string' ? parseInt(num, 10) : num;
    return Number.isInteger(parsed) && parsed <= 59 && parsed >= 0;
  }

  export default defineComponent({
    name: 'ShadowTool',
    components: {
      VCol,
      VContainer,
      VDivider,
      VRow,
      VcsButton,
      VcsDatePicker,
      VcsLabel,
      VcsSlider,
      VcsTextField,
    },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const map = app.maps.activeMap as CesiumMap;
      const plugin = app.plugins.getByKey(name) as ShadowPlugin;
      const { state } = plugin;
      const { clock } = map.getCesiumWidget()!;

      const localJulianDate = ref(clock.currentTime);
      const setLocalJulianDate = (nv: JulianDate): void => {
        localJulianDate.value = nv;
        clock.currentTime = nv;
      };

      let startAnimationTime: Date | undefined;
      let startLocalJulianDate: JulianDate | undefined;

      const date = computed<Date>({
        get: () => {
          return JulianDate.toDate(localJulianDate.value);
        },
        set: (nv) => {
          nv.setHours(getHoursFromJulian(localJulianDate.value));
          nv.setMinutes(getMinutesFromJulian(localJulianDate.value));
          setLocalJulianDate(JulianDate.fromDate(nv));
        },
      });

      const hours = computed({
        get: () => {
          const result = String(getHoursFromJulian(localJulianDate.value));
          if (result.length < 2) {
            return `0${result}`;
          }
          return result;
        },
        set: (nv) => {
          const js = JulianDate.toDate(localJulianDate.value);
          js.setHours(+nv);
          setLocalJulianDate(JulianDate.fromDate(js));
        },
      });
      const minutes = computed({
        get: () => {
          let result = String(getMinutesFromJulian(localJulianDate.value));
          if (result.length < 2) {
            result = `0${result}`;
          }
          return result;
        },
        set: (nv) => {
          const js = JulianDate.toDate(localJulianDate.value);
          js.setMinutes(+nv);
          setLocalJulianDate(JulianDate.fromDate(js));
        },
      });
      const totalMinutes = computed({
        get: () => getTotalMinutesFromJulian(localJulianDate.value),
        set: (nv) => {
          const js = JulianDate.toDate(localJulianDate.value);
          js.setHours(Math.floor(nv / 60), Math.round(nv % 60));
          setLocalJulianDate(JulianDate.fromDate(js));
        },
      });

      const stopAnimation = (): void => {
        state.animate = false;
        state.endDate = undefined;
        startAnimationTime = undefined;
        startLocalJulianDate = undefined;
      };

      onMounted(() => {
        if (plugin.removeOnTickListener) {
          plugin.removeOnTickListener();
        }
        const clockDate = JulianDate.toDate(clock.currentTime);
        clockDate.setFullYear(new Date().getFullYear());
        clock.currentTime = JulianDate.fromDate(clockDate);

        plugin.removeOnTickListener = clock.onTick.addEventListener(
          (newTime) => {
            if (state.animate) {
              if (!startAnimationTime) {
                startAnimationTime = new Date();
              }
              if (!startLocalJulianDate) {
                startLocalJulianDate = JulianDate.clone(localJulianDate.value);
              }
              if (
                shouldAdvance(
                  localJulianDate.value,
                  JulianDate.fromIso8601(state.endDate!),
                )
              ) {
                const currentDate = getNextTime(
                  startAnimationTime,
                  startLocalJulianDate,
                  state.duration,
                  state.timeUnit,
                );
                setLocalJulianDate(currentDate);
              } else {
                stopAnimation();
              }
            } else if (
              JulianDate.secondsDifference(
                newTime.currentTime,
                localJulianDate.value,
              ) >= 1
            ) {
              setLocalJulianDate(newTime.currentTime);
            }
          },
        );
      });

      const prepAnimation = (): void => {
        startAnimationTime = new Date();
        startLocalJulianDate = JulianDate.clone(localJulianDate.value);
        state.animate = true;
      };

      const animateDay = (): void => {
        prepAnimation();
        state.timeUnit = TimeUnits.Hours;
        const calculateEndDate = JulianDate.addDays(
          localJulianDate.value,
          1,
          new JulianDate(),
        );
        state.endDate = state.endDate ?? calculateEndDate.toString();
      };
      const animateYear = (): void => {
        prepAnimation();
        state.timeUnit = TimeUnits.Days;
        const calculateEndDate = JulianDate.addDays(
          localJulianDate.value,
          365,
          new JulianDate(),
        );
        state.endDate = state.endDate ?? calculateEndDate.toString();
      };
      const setTime = (event: FocusEvent): void => {
        const { value, id } = event.target as HTMLInputElement;
        if ((id as TimeUnits) === TimeUnits.Hours) {
          if (validateHour(+value)) {
            hours.value = value;
          }
        } else if ((id as TimeUnits) === TimeUnits.Minutes) {
          if (validateMinute(+value)) {
            minutes.value = value;
          }
        }
      };

      return {
        TimeUnits,
        state,
        animateDay,
        animateYear,
        stopAnimation,
        date,
        hours,
        minutes,
        totalMinutes,
        setTime,
        validateMinute,
        validateHour,
      };
    },
  });
</script>

<style lang="scss" scoped>
  .number-input {
    max-width: calc(var(--v-vcs-font-size) * 2.4);
  }
  .vcs-input-wrap {
    flex: 1 2 auto;
  }
  :deep(.vcs-text-field input) {
    text-align: center;
  }
</style>
