<template>
  <div :class="`magic-code-editor`">
    <Teleport to="body" :disabled="!fullScreen">
      <div
        :class="`magic-code-editor-wrapper${fullScreen ? ' full-screen' : ''}`"
        :style="!fullScreen && height ? `height: ${height}` : '100%'"
      >
        <TMagicButton
          class="magic-code-editor-full-screen-icon"
          circle
          size="small"
          :icon="FullScreen"
          @click="fullScreenHandler"
        ></TMagicButton>
        <div ref="codeEditor" class="magic-code-editor-content"></div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { FullScreen } from '@element-plus/icons-vue';
import { throttle } from 'lodash-es';
import * as monaco from 'monaco-editor';
import serialize from 'serialize-javascript';

import { TMagicButton } from '@tmagic/design';

defineOptions({
  name: 'MEditorCodeEditor',
});

const props = withDefaults(
  defineProps<{
    initValues?: string | Record<string | number, any> | null;
    modifiedValues?: string | Record<string | number, any> | null;
    type?: 'diff';
    language?: string;
    options?: {
      [key: string]: any;
    };
    height?: string;
    autoSave?: boolean;
  }>(),
  {
    autoSave: true,
    language: 'javascript',
    options: () => ({
      tabSize: 2,
    }),
  },
);

const emit = defineEmits(['initd', 'save']);

const toString = (v: string | any, language: string): string => {
  let value = '';
  if (typeof v !== 'string') {
    if (props.language.toLocaleLowerCase() === 'json') {
      value = JSON.stringify(v, null, 2);
    } else {
      value = serialize(v, {
        space: 2,
        unsafe: true,
      }).replace(/"(\w+)":\s/g, '$1: ');
    }
  } else {
    value = v;
  }
  if (language === 'javascript' && value.startsWith('{') && value.endsWith('}')) {
    value = `(${value})`;
  }
  return value;
};

let vsEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let vsDiffEditor: monaco.editor.IStandaloneDiffEditor | null = null;

const values = ref('');
const loading = ref(false);
const codeEditor = ref<HTMLDivElement>();

const resizeObserver = new globalThis.ResizeObserver(
  throttle((): void => {
    vsEditor?.layout();
    vsDiffEditor?.layout();
  }, 300),
);

const setEditorValue = (v: string | any, m: string | any) => {
  values.value = toString(v, props.language);

  if (props.type === 'diff') {
    const originalModel = monaco.editor.createModel(values.value, 'text/javascript');
    const modifiedModel = monaco.editor.createModel(toString(m, props.language), 'text/javascript');

    return vsDiffEditor?.setModel({
      original: originalModel,
      modified: modifiedModel,
    });
  }

  return vsEditor?.setValue(values.value);
};

const getEditorValue = () =>
  (props.type === 'diff' ? vsDiffEditor?.getModifiedEditor().getValue() : vsEditor?.getValue()) || '';

const init = async () => {
  if (!codeEditor.value) return;

  const options = {
    value: values.value,
    language: props.language,
    theme: 'vs-dark',
    ...props.options,
  };

  if (props.type === 'diff') {
    vsDiffEditor = monaco.editor.createDiffEditor(codeEditor.value, options);
  } else {
    vsEditor = monaco.editor.create(codeEditor.value, options);
  }

  setEditorValue(props.initValues, props.modifiedValues);

  loading.value = false;

  emit('initd', vsEditor);

  codeEditor.value.addEventListener('keydown', (e) => {
    if (e.keyCode === 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      const newValue = getEditorValue();
      values.value = newValue;
      emit('save', newValue);
    }
  });

  if (props.type !== 'diff' && props.autoSave) {
    vsEditor?.onDidBlurEditorWidget(() => {
      const newValue = getEditorValue();
      if (values.value !== newValue) {
        values.value = newValue;
        emit('save', newValue);
      }
    });
  }

  resizeObserver.observe(codeEditor.value);
};

watch(
  () => props.initValues,
  (v, preV) => {
    if (v !== preV) {
      setEditorValue(props.initValues, props.modifiedValues);
    }
  },
  {
    deep: true,
    immediate: true,
  },
);

onMounted(async () => {
  loading.value = true;

  init();
});

onUnmounted(() => {
  resizeObserver.disconnect();
});

const fullScreen = ref(false);
const fullScreenHandler = () => {
  fullScreen.value = !fullScreen.value;
  setTimeout(() => {
    vsEditor?.focus();
    vsEditor?.layout();
    vsDiffEditor?.focus();
    vsDiffEditor?.layout();
  });
};

defineExpose({
  values,

  getEditor() {
    return vsEditor || vsDiffEditor;
  },

  getVsEditor() {
    return vsEditor;
  },

  getVsDiffEditor() {
    return vsDiffEditor;
  },

  setEditorValue,

  focus() {
    vsEditor?.focus();
    vsDiffEditor?.focus();
  },
});
</script>
