<script lang="ts" setup>
import type { SmsConfig } from '../../../../api/sms';

import { computed, nextTick, ref, watch } from 'vue';

import { useVbenDrawer, useVbenForm, z } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { testSmsConfig } from '../../../../api/sms';

interface Props {
  config?: null | SmsConfig;
  open?: boolean;
}

defineOptions({ name: 'TestSmsConfigModal' });

const props = withDefaults(defineProps<Props>(), {
  config: null,
  open: false,
});

const emit = defineEmits<{
  success: [];
  'update:open': [open: boolean];
}>();

const loading = ref(false);

const drawerTitle = computed(() =>
  props.config?.configName ? `测试 ${props.config.configName}` : '测试短信配置',
);

const [Form, formApi] = useVbenForm({
  showDefaultActions: false,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelClass: 'w-1/4',
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      fieldName: 'phone',
      label: '测试手机号',
      rules: z
        .string()
        .min(1, '请输入测试手机号')
        .max(30, '手机号最多 30 个字符'),
      componentProps: {
        placeholder: '请输入接收测试短信的手机号',
      },
    },
    {
      component: 'Input',
      fieldName: 'templateId',
      label: '模板 ID',
      rules: z.string().max(100, '模板 ID 最多 100 个字符').optional(),
      componentProps: {
        placeholder: '为空时使用当前配置的模板 ID',
      },
    },
    {
      component: 'Textarea',
      fieldName: 'templateParams',
      label: '模板参数',
      rules: z.string().min(1, '请输入模板参数 JSON'),
      componentProps: {
        rows: 4,
        placeholder: '{"1":"1234","2":"5"}',
      },
    },
  ],
  wrapperClass: 'grid-cols-1',
});

async function applyFormValuesFromConfig() {
  await formApi.setValues({
    phone: '',
    templateId: props.config?.templateId ?? '',
    templateParams: '{"1":"1234","2":"5"}',
  });
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm: async () => {
    if (!props.config?.id) {
      message.warning('请从已配置的厂商卡片发起测试');
      return;
    }

    try {
      loading.value = true;
      await formApi.validate();
      const data = await formApi.getValues();
      const rawTemplateParams =
        typeof data.templateParams === 'string'
          ? data.templateParams.trim()
          : '';
      let templateParams: Record<string, string> = {};
      try {
        const parsed = rawTemplateParams ? JSON.parse(rawTemplateParams) : {};
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
          message.error('模板参数必须是 JSON 对象');
          return;
        }
        templateParams = Object.fromEntries(
          Object.entries(parsed).map(([key, value]) => [key, String(value)]),
        );
      } catch {
        message.error('模板参数必须是合法的 JSON 格式');
        return;
      }

      const result = await testSmsConfig(props.config.id, {
        phone: data.phone,
        templateId: data.templateId,
        templateParams,
      });

      if (result.success) {
        message.success(result.message || '测试短信发送成功');
        emit('success');
        await drawerApi.close();
        return;
      }

      message.warning(result.message || '测试短信发送失败');
      emit('success');
    } catch (error) {
      console.error(error);
      message.error('测试失败，请稍后重试');
    } finally {
      loading.value = false;
    }
  },
  onOpenChange: async (open) => {
    emit('update:open', open);

    if (!open) {
      return;
    }

    await formApi.resetForm();
    await nextTick();
    await applyFormValuesFromConfig();
  },
});

watch(
  () => props.open,
  (open) => {
    if (open) {
      drawerApi.open();
      return;
    }
    drawerApi.close();
  },
  { immediate: true },
);

watch(
  () => props.config,
  async () => {
    if (!props.open) return;
    await nextTick();
    await applyFormValuesFromConfig();
  },
);
</script>

<template>
  <Drawer :title="drawerTitle" :loading="loading">
    <div class="test-tip">
      <div class="tip-title">真实发送测试</div>
      <div class="tip-description">
        该操作会调用短信厂商接口发送真实短信，请确认测试手机号和模板参数正确。
      </div>
    </div>
    <Form />
  </Drawer>
</template>

<style scoped lang="scss">
.test-tip {
  padding: 14px 16px;
  margin-bottom: 16px;
  background: rgb(82 196 26 / 8%);
  border: 1px solid rgb(82 196 26 / 18%);
  border-radius: 14px;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.tip-description {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-secondary);
}
</style>
