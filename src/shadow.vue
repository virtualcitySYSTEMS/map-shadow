<template>
  <v-sheet>
    <v-container class="px-1 py-0 main">
      <v-row no-gutters justify="space-between" align="center">
        <VcsLabel html-for="time-slider">
          {{ $t('time') }}
        </VcsLabel>
        <v-row no-gutters align="center" justify="end">
          <VcsTooltip tooltip="hoursFormat">
            <template #activator="{ on, attrs }">
              <VcsTextField
                :id="TIME_UNITS.hours"
                v-bind="attrs"
                v-on="on"
                :value="hours"
                @blur="setTime"
                @keyup.enter="setTime"
                class="time-input"
                :rules="[validateHourInput]"
              />:
            </template>
          </VcsTooltip>
          <VcsTooltip tooltip="minutesFormat">
            <template #activator="{ on, attrs }">
              <VcsTextField
                :id="TIME_UNITS.minutes"
                v-bind="attrs"
                v-on="on"
                :value="minutes"
                @blur="setTime"
                @keyup.enter="setTime"
                class="time-input"
                :rules="[validateMinuteInput]"
              />
            </template>
          </VcsTooltip>
        </v-row>
        <VcsButton
          v-if="state.animate"
          icon="mdi-pause-circle"
          @click="stopAnimation"
          tooltip="pause"
        />
        <VcsButton
          v-else
          icon="$vcsPlayCircle"
          @click="animateDay"
          tooltip="animateDay"
        />
      </v-row>
      <v-slider
        v-model="totalMinutes"
        class="slider"
        id="time-slider"
        :min="0"
        :max="24 * 60 - 1"
        :disabled="state.animate"
      />
      <v-divider />
      <v-row no-gutters justify="space-between" align="center">
        <VcsLabel class="block" html-for="date">
          {{ $t('date') }}
        </VcsLabel>
        <VcsTooltip :tooltip="$t('dateFormat') + dateFormatExample">
          <template #activator="{ on, attrs }">
            <v-icon size="small" v-bind="attrs" v-on="on">
              mdi-help-circle
            </v-icon>
          </template>
        </VcsTooltip>
        <v-row no-gutters align="center" justify="end">
          <v-col sm="5">
            <VcsDatePicker v-model="date" :disabled="state.animate" />
          </v-col>
          <VcsButton
            v-if="state.animate"
            icon="mdi-pause-circle"
            @click="stopAnimation"
            tooltip="pause"
          />
          <VcsButton
            v-else
            icon="$vcsPlayCircle"
            @click="animateYear"
            tooltip="animateYear"
          />
        </v-row>
      </v-row>
      <v-divider />
      <v-row no-gutters justify="space-between" align="center">
        <VcsLabel html-for="speed-slider" class="mt-3">
          {{ $t('speed') }}
          <VcsTooltip tooltip="speedTooltip" max-width="300">
            <template #activator="{ on, attrs }">
              <v-icon
                size="small"
                v-bind="{ ...$attrs, ...attrs }"
                v-on="{ ...$listeners, ...on }"
              >
                mdi-help-circle
              </v-icon>
            </template>
          </VcsTooltip>
        </VcsLabel>
        <h5 class="text">
          {{ state.speed }}
        </h5>
      </v-row>
      <v-slider
        v-model="state.speed"
        class="slider"
        id="speed-slider"
        ticks="always"
        step="1"
        :min="1"
        :max="10"
        tick-size="2"
      />
    </v-container>
  </v-sheet>
</template>

<script>
  import {
    VSheet,
    VContainer,
    VRow,
    VSlider,
    VCol,
    VDivider,
    VIcon,
  } from 'vuetify/lib';
  import {
    VcsLabel,
    VcsButton,
    VcsDatePicker,
    VcsTextField,
    VcsTooltip,
  } from '@vcmap/ui';
  import { inject, computed, ref, onMounted } from 'vue';
  import { JulianDate } from '@vcmap-cesium/engine';
  import { TIME_UNITS } from './constants.js';
  import {
    getNextTime,
    shouldAdvance,
    getDateStringFromJulian,
    getTotalMinutesFromJulian,
    validateHourInput,
    validateMinuteInput,
    getHoursFromJulian,
    getMinutesFromJulian,
  } from './api.js';
  import { name } from '../package.json';

  export default {
    name: 'ShadowToggle',
    components: {
      VSheet,
      VContainer,
      VSlider,
      VRow,
      VcsLabel,
      VcsButton,
      VcsDatePicker,
      VCol,
      VDivider,
      VcsTextField,
      VcsTooltip,
      VIcon,
    },
    setup() {
      const app = inject('vcsApp');
      const cesiumWidget = app.maps.activeMap.getCesiumWidget();
      const { clock } = cesiumWidget;
      const { state } = app.plugins.getByKey(name);
      const dateFormatExample = new Intl.DateTimeFormat(app.locale).format(
        new Date(Date.UTC(2023, 0, 20)),
      );

      const localJulianDate = ref(clock.currentTime);
      const setLocalJulianDate = (nv) => {
        localJulianDate.value = nv;
        clock.currentTime = nv;
      };

      const date = computed({
        get: () => getDateStringFromJulian(localJulianDate.value),
        set: (nv) => {
          const newDate = new Date(
            ...nv.split('-'),
            getHoursFromJulian(localJulianDate.value),
            getMinutesFromJulian(localJulianDate.value),
          );
          setLocalJulianDate(JulianDate.fromDate(newDate));
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

      return {
        date,
        totalMinutes,
        state,
        hours,
        minutes,
        dateFormatExample,
        TIME_UNITS,
        animateDay,
        animateYear,
        stopAnimation,
        validateHourInput,
        validateMinuteInput,
        setTime,
      };
    },
  };
</script>

<style scoped>
  .main {
    margin: 0.5rem 0;
    min-height: 16.5rem;
  }
  .text {
    padding-right: 4px;
  }
  .slider {
    height: 3rem;
  }
  .time-input {
    width: 2rem;
    font-weight: bold;
  }
</style>
