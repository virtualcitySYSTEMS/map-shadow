<template>
  <v-container class="pa-2">
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
          class="number-input"
          :id="TimeUnits.hours"
          type="number"
          :model-value="hours"
          tooltip="shadow.hoursFormat"
          tooltip-position="bottom"
          hide-spin-buttons
          :disabled="state.animate"
          @blur="setTime"
          @keyup.enter="setTime"
          :rules="[validateHour]"
        />
        :
        <VcsTextField
          class="number-input"
          :id="TimeUnits.minutes"
          type="number"
          :model-value="minutes"
          tooltip="shadow.minutesFormat"
          tooltip-position="bottom"
          hide-spin-buttons
          :disabled="state.animate"
          @blur="setTime"
          @keyup.enter="setTime"
          :rules="[validateMinute]"
        />
        <VcsButton
          v-if="state.animate"
          icon="mdi-pause-circle"
          @click="stopAnimation"
          tooltip="shadow.pause"
          class="pl-1"
        />
        <VcsButton
          v-else
          icon="$vcsPlayCircle"
          @click="animateDay"
          tooltip="shadow.animateDay"
          class="pl-1"
        />
      </v-col>
    </v-row>
    <VcsSlider
      v-model="totalMinutes"
      id="time-slider"
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
      <v-col cols="5" class="d-flex align-center">
        <VcsDatePicker v-model="date" :disabled="state.animate" />
        <VcsButton
          v-if="state.animate"
          icon="mdi-pause-circle"
          @click="stopAnimation"
          tooltip="shadow.pause"
          class="pl-1"
        />
        <VcsButton
          v-else
          icon="$vcsPlayCircle"
          @click="animateYear"
          tooltip="shadow.animateYear"
          small
          class="pl-1"
        />
      </v-col>
    </v-row>
    <v-divider />
    <v-row no-gutters>
      <v-col class="d-flex justify-start">
        <VcsLabel
          html-for="speed-slider"
          help-text="shadow.speedTooltip"
          tooltip-position="bottom"
          class="gc-2"
        >
          {{ $t('shadow.speed') }}
        </VcsLabel>
      </v-col>
      <v-col class="d-flex justify-end align-center">
        <VcsLabel class="pr-0">
          {{ state.speed }} {{ $t('shadow.speedUnit') }}
        </VcsLabel>
      </v-col>
    </v-row>
    <VcsSlider
      id="speed-slider"
      type="number"
      show-ticks="always"
      :step="1"
      :min="1"
      :max="20"
      v-model="state.speed"
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

  function validateHour(nv: number): boolean {
    const number = Number(nv);
    return Number.isInteger(number) && number <= 23 && number >= 0;
  }

  function validateMinute(nv: number): boolean {
    const number = Number(nv);
    return Number.isInteger(number) && number <= 59 && number >= 0;
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
      const { state } = app.plugins.getByKey(name) as ShadowPlugin;
      const { clock } = map.getCesiumWidget()!;

      const localJulianDate = ref(clock.currentTime);
      const setLocalJulianDate = (nv: JulianDate): void => {
        localJulianDate.value = nv;
        clock.currentTime = nv;
      };

      let startAnimationTime: Date;
      let startLocalJulianDate: JulianDate;

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
        state.endDate = null;
      };

      onMounted(() => {
        if (state.removeListener) {
          state.removeListener();
        }
        state.removeListener = clock.onTick.addEventListener((newTime) => {
          if (state.animate) {
            if (shouldAdvance(localJulianDate.value, state.endDate!)) {
              const currentDate = getNextTime(
                startAnimationTime,
                startLocalJulianDate,
                state.speed,
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
        });
      });

      const prepAnimation = (): void => {
        startAnimationTime = new Date();
        startLocalJulianDate = JulianDate.clone(localJulianDate.value);
        state.animate = true;
      };

      const animateDay = (): void => {
        prepAnimation();
        state.timeUnit = TimeUnits.hours;
        const calculateEndDate = JulianDate.addDays(
          localJulianDate.value,
          1,
          new JulianDate(),
        );
        state.endDate = state.endDate ?? calculateEndDate;
      };
      const animateYear = (): void => {
        prepAnimation();
        state.timeUnit = TimeUnits.days;
        const calculateEndDate = JulianDate.addDays(
          localJulianDate.value,
          365,
          new JulianDate(),
        );
        state.endDate = state.endDate ?? calculateEndDate;
      };
      const setTime = (event: FocusEvent): void => {
        const { value, id } = event.target as HTMLInputElement;
        if (id === TimeUnits.hours) {
          if (validateHour(+value)) {
            hours.value = value;
          }
        } else if (id === TimeUnits.minutes) {
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
