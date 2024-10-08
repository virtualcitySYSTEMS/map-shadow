<template>
  <v-container class="px-2 py-2 main">
    <v-row class="d-flex flex-nowrap align-center justify-space-between">
      <v-col class="d-flex align-center justify-start vcs-label-wrap">
        <VcsLabel html-for="time-slider">
          {{ $t('shadow.time') }}
        </VcsLabel>
      </v-col>
      <v-col class="d-flex align-center justify-end vcs-input-wrap">
        <VcsTextField
          class="numberInput"
          :id="TIME_UNITS.hours"
          :model-value="hours"
          @blur="setTime"
          @keyup.enter="setTime"
          :rules="[validateHourInput]"
          tooltip="shadow.hoursFormat"
          type="number"
          :hide-spin-buttons="true"
          tooltip-position="bottom"
          :disabled="state.animate"
        />
        :
        <VcsTextField
          class="number-input"
          :id="TIME_UNITS.minutes"
          :model-value="minutes"
          @blur="setTime"
          @keyup.enter="setTime"
          :rules="[validateMinuteInput]"
          tooltip="shadow.minutesFormat"
          type="number"
          :hide-spin-buttons="true"
          tooltip-position="bottom"
          :disabled="state.animate"
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
          small
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
      <v-col class="d-flex align-center vcs-label-wrap">
        <VcsLabel html-for="date">
          {{ $t('shadow.date') }}
        </VcsLabel>
      </v-col>
      <v-col class="d-flex v-col-5 align-center">
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
    <v-row class="d-flex" no-gutters>
      <v-col class="d-flex justify-start align-center">
        <VcsLabel html-for="speed-slider">
          {{ $t('shadow.speed') }}
        </VcsLabel>
        <v-icon
          size="x-small"
          class="px-3"
          icon="mdi-help-circle"
          ref="helpSpeedIcon"
        />
        <v-tooltip
          :text="$t('shadow.speedTooltip')"
          :activator="helpSpeedIcon"
          :max-width="300"
          location="bottom"
        />
      </v-col>
      <v-col class="d-flex justify-end align-center">
        <VcsLabel class="pr-0">
          {{ state.speed }}
        </VcsLabel>
      </v-col>
    </v-row>
    <VcsSlider
      v-model="state.speed"
      id="speed-slider"
      :step="1"
      :min="1"
      :max="10"
      show-ticks="always"
      type="number"
    />
  </v-container>
</template>

<script setup>
  import {
    VContainer,
    VDivider,
    VIcon,
    VTooltip,
    VRow,
    VCol,
  } from 'vuetify/components';
  import {
    VcsLabel,
    VcsButton,
    VcsDatePicker,
    VcsTextField,
    VcsSlider,
  } from '@vcmap/ui';
  import { inject, computed, ref, onMounted } from 'vue';
  import { JulianDate } from '@vcmap-cesium/engine';
  import { TIME_UNITS } from './constants.js';
  import {
    getNextTime,
    shouldAdvance,
    getTotalMinutesFromJulian,
    validateHourInput,
    validateMinuteInput,
    getHoursFromJulian,
    getMinutesFromJulian,
  } from './api.js';
  import { name } from '../package.json';

  const app = inject('vcsApp');
  const cesiumWidget = app.maps.activeMap.getCesiumWidget();
  const { clock } = cesiumWidget;
  const { state } = app.plugins.getByKey(name);

  const localJulianDate = ref(clock.currentTime);
  const setLocalJulianDate = (nv) => {
    localJulianDate.value = nv;
    clock.currentTime = nv;
  };

  const helpSpeedIcon = ref();

  const date = computed({
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
      js.setHours(nv);
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
      js.setMinutes(nv);
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

  const stopAnimation = () => {
    state.animate = false;
    state.endDate = null;
  };

  onMounted(() => {
    if (state.removeListener) {
      state.removeListener();
    }
    state.removeListener = clock.onTick.addEventListener((newTime) => {
      if (state.animate) {
        if (shouldAdvance(localJulianDate.value, state.endDate)) {
          const next = getNextTime(
            localJulianDate.value,
            state.speed,
            state.timeUnit,
          );
          setLocalJulianDate(next);
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

  const animateDay = () => {
    state.animate = true;
    state.timeUnit = TIME_UNITS.hours;
    const calculateEndDate = new JulianDate();
    JulianDate.addDays(localJulianDate.value, 1, calculateEndDate);
    state.endDate = state.endDate ?? calculateEndDate;
    setLocalJulianDate.value = getNextTime(
      localJulianDate.value,
      state.speed,
      state.timeUnit,
    );
  };
  const animateYear = () => {
    state.animate = true;
    state.timeUnit = TIME_UNITS.days;
    const calculateEndDate = new JulianDate();
    JulianDate.addDays(localJulianDate.value, 365, calculateEndDate);
    state.endDate = state.endDate ?? calculateEndDate;
    setLocalJulianDate.value = getNextTime(
      localJulianDate.value,
      state.speed,
      state.timeUnit,
    );
  };
  const setTime = (event) => {
    const { value, id } = event.target;
    if (id === TIME_UNITS.hours) {
      if (validateHourInput(value)) {
        hours.value = value;
      }
    } else if (id === TIME_UNITS.minutes) {
      if (validateMinuteInput(value)) {
        minutes.value = value;
      }
    }
  };
</script>
<style lang="scss" scoped>
  .number-input {
    max-width: calc(var(--v-vcs-font-size) * 2.5);
  }

  .vcs-input-wrap {
    flex: 1 2 auto;
  }

  .vcs-label-wrap {
    flex-basis: auto;
  }

  :deep(.vcs-text-field input) {
    text-align: center;
  }
</style>
