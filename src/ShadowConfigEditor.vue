<template>
  <AbstractConfigEditor @submit="apply">
    <VcsFormSection heading="shadow.editor.general">
      <v-container class="py-0 px-1">
        <v-row no-gutters>
          <v-col>
            <VcsCheckbox
              id="activeOnStartup"
              v-model="localConfig.activeOnStartup"
              label="shadow.editor.activeOnStartup"
              :true-value="true"
              :false-value="false"
            />
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>
  </AbstractConfigEditor>
</template>

<script lang="ts">
  import { VContainer, VRow, VCol } from 'vuetify/components';
  import { AbstractConfigEditor, VcsFormSection, VcsCheckbox } from '@vcmap/ui';
  import { defineComponent, ref, type PropType } from 'vue';
  import { getDefaultOptions } from './index.js';
  import type { ShadowConfig } from './index.js';

  export default defineComponent({
    name: 'ShadowConfigEditor',
    components: {
      VContainer,
      VRow,
      VCol,
      AbstractConfigEditor,
      VcsFormSection,
      VcsCheckbox,
    },
    props: {
      getConfig: {
        type: Function as PropType<() => ShadowConfig>,
        required: true,
      },
      setConfig: {
        type: Function as PropType<(config: object | undefined) => void>,
        required: true,
      },
    },
    setup(props) {
      const defaultOptions = getDefaultOptions();
      const config = props.getConfig();
      const localConfig = ref<ShadowConfig>(
        Object.assign(defaultOptions, config),
      );

      return {
        localConfig,
        apply(): void {
          props.setConfig(localConfig.value);
        },
      };
    },
  });
</script>

<style scoped></style>
