<script lang="ts" setup>
import type { PropType } from 'vue';

import type { VbenFormProps } from '#/adapter/form';

import { computed, defineComponent, h, ref } from 'vue';

import { useVbenDrawer, useVbenForm, z } from '@vben/common-ui';

import { Button, message, Select, Space } from 'ant-design-vue';

import { createConfig } from '#/api/devops/sysconfig';

import {
  CONFIG_TYPE_OPTIONS,
  formatStructuredConfigValue,
  getConfigValueComponent,
  getConfigValueComponentProps,
  getConfigValueInvalidMessage,
  getConfigValueRules,
  isStructuredConfigValueType,
  normalizeConfigValueType,
  validateConfigValue,
} from './config-value';

interface Emits {
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

const loading = ref(false);
const currentConfigType = ref<string>('STRING');
const showStructuredValueTools = computed(() =>
  isStructuredConfigValueType(currentConfigType.value),
);

// 根据配置类型更新配置值字段的校验规则
function updateValueRules(type: string) {
  const normalizedType = normalizeConfigValueType(type);
  currentConfigType.value = normalizedType;
  formApi.updateSchema([
    {
      component: getConfigValueComponent(normalizedType),
      fieldName: 'configValue',
      rules: getConfigValueRules(normalizedType),
      componentProps: getConfigValueComponentProps(normalizedType),
    },
  ]);
}

const ConfigTypeSelect = defineComponent({
  name: 'ConfigTypeSelect',
  props: {
    disabled: Boolean,
    options: {
      type: Array as PropType<Array<{ label: string; value: string }>>,
      default: () => CONFIG_TYPE_OPTIONS,
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    value: {
      type: String,
      default: undefined,
    },
  },
  emits: ['change', 'update:value'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'flex w-full items-center gap-2' }, [
        h(Select as any, {
          class: 'min-w-0 flex-1',
          disabled: props.disabled,
          options: props.options,
          placeholder: props.placeholder,
          value: props.value,
          onChange: (value: string) => emit('change', value),
          'onUpdate:value': (value: string) => emit('update:value', value),
        }),
        showStructuredValueTools.value
          ? h(Space, { size: 6 }, () =>
              [
                ['format', '格式化'],
                ['compact', '压缩'],
                ['check', '校验'],
              ].map(([action, label]) =>
                h(
                  Button,
                  {
                    size: 'small',
                    onClick: () =>
                      handleStructuredValueAction(
                        action as 'check' | 'compact' | 'format',
                      ),
                  },
                  () => label,
                ),
              ),
            )
          : null,
      ]);
  },
});

const formOptions: VbenFormProps = {
  collapsed: false,
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'configKey',
      label: '配置键',
      rules: z.string().min(1, '请输入配置键').max(100, '配置键最多100个字符'),
      componentProps: {
        placeholder: '请输入配置键，如 system.name',
      },
    },
    {
      component: ConfigTypeSelect,
      fieldName: 'configType',
      label: '配置类型',
      modelPropName: 'value',
      rules: z.string().min(1, '请选择配置类型'),
      componentProps: {
        placeholder: '请选择配置类型',
        options: CONFIG_TYPE_OPTIONS,
        onChange: (value: string) => updateValueRules(value),
      },
    },
    {
      component: 'Input',
      fieldName: 'configValue',
      label: '配置值',
      rules: z.string().min(1, '请输入配置值'),
      componentProps: {
        placeholder: '请输入配置值',
      },
    },
    {
      component: 'Input',
      fieldName: 'description',
      label: '描述',
      componentProps: {
        placeholder: '请输入配置描述',
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'status',
      label: '状态',
      rules: z.union([z.literal(0), z.literal(1)]),
      componentProps: {
        options: [
          { value: 1, label: '启用' },
          { value: 0, label: '禁用' },
        ],
      },
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: '备注',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ],
  wrapperClass: 'grid-cols-1',
};

const [Form, formApi] = useVbenForm(formOptions);

async function handleStructuredValueAction(
  action: 'check' | 'compact' | 'format',
) {
  const values = await formApi.getValues();
  const value = String(values.configValue ?? '');
  const result = formatStructuredConfigValue(
    value,
    currentConfigType.value,
    action === 'compact',
  );

  if (!result.success) {
    message.error(result.message);
    return;
  }

  if (action === 'check') {
    message.success('格式正确');
    return;
  }

  await formApi.setFieldValue('configValue', result.value);
  message.success(action === 'compact' ? '已压缩' : '已格式化');
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm: async () => {
    try {
      loading.value = true;
      const data = await formApi.getValues();

      // 手动校验配置值格式
      const isValid = validateConfigValue(data.configValue, data.configType);
      if (!isValid) {
        message.error(getConfigValueInvalidMessage(data.configType));
        return;
      }

      await formApi.validate();
      await createConfig(data);
      message.success('创建成功');
      await drawerApi.close();
      emit('success');
    } catch (error) {
      console.error(error);
      message.error('创建失败');
    } finally {
      loading.value = false;
    }
  },
  onOpenChange: async (open) => {
    if (open) {
      await formApi.resetForm();
      currentConfigType.value = 'STRING';
      updateValueRules('STRING');
      // 重置后需要重新设置默认值
      await formApi.setFieldValue('status', 1);
    }
  },
});
</script>

<template>
  <Drawer title="新增配置" :loading="loading">
    <Form />
  </Drawer>
</template>
