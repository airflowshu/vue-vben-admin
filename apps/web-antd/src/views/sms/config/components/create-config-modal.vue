<script lang="ts" setup>
import type { SmsConfig } from '#/api/system/sms';

import { computed, nextTick, ref, watch } from 'vue';

import { useVbenDrawer, useVbenForm, z } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { createSmsConfig, updateSmsConfig } from '#/api/system/sms';

import { getSmsSupplierPreset } from '../constants';

interface Props {
  defaultSupplierType?: string;
  initialConfig?: null | SmsConfig;
  open?: boolean;
}

defineOptions({ name: 'CreateSmsConfigModal' });

const props = withDefaults(defineProps<Props>(), {
  defaultSupplierType: '',
  initialConfig: null,
  open: false,
});

const emit = defineEmits<{
  success: [];
  'update:open': [open: boolean];
}>();

const loading = ref(false);

const currentSupplier = computed(() =>
  getSmsSupplierPreset(props.defaultSupplierType),
);

const isEditMode = computed(() => Boolean(props.initialConfig?.id));

const drawerTitle = computed(() =>
  currentSupplier.value
    ? `${isEditMode.value ? '编辑' : '新增'}${currentSupplier.value.label}配置`
    : `${isEditMode.value ? '编辑' : '新增'}短信供应商配置`,
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
      fieldName: 'supplierLabel',
      label: '厂商类型',
      componentProps: {
        disabled: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'configName',
      label: '配置名称',
      rules: z.string().min(1, '请输入配置名称').max(50, '名称最多 50 个字符'),
      componentProps: {
        placeholder: '例如：阿里云主账号',
      },
    },
    {
      component: 'Input',
      fieldName: 'accessKeyId',
      label: 'AccessKeyId',
      rules: z.string().max(100, '最多 100 个字符').optional(),
      componentProps: {
        placeholder: '请输入 AccessKeyId',
      },
    },
    {
      component: 'InputPassword',
      fieldName: 'accessKeySecret',
      label: 'AccessKeySecret',
      rules: z.string().max(200, '最多 200 个字符').optional(),
      componentProps: {
        placeholder: '请输入 AccessKeySecret',
      },
    },
    {
      component: 'Input',
      fieldName: 'signature',
      label: '短信签名',
      rules: z.string().max(20, '签名最多 20 个字符').optional(),
      componentProps: {
        placeholder: '例如：【云途商城】',
      },
    },
    {
      component: 'Input',
      fieldName: 'templateId',
      label: '模板 ID',
      rules: z.string().max(50, '最多 50 个字符').optional(),
      componentProps: {
        placeholder: '请输入模板 ID',
      },
    },
    {
      component: 'Input',
      fieldName: 'sdkAppId',
      label: 'SDK AppId',
      rules: z.string().max(50, '最多 50 个字符').optional(),
      componentProps: {
        placeholder: '部分厂商需要，例如腾讯云',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'weight',
      label: '权重',
      rules: 'required',
      componentProps: {
        min: 1,
        max: 100,
        placeholder: '权重越高越优先',
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'isDefault',
      label: '默认配置',
      defaultValue: 0,
      componentProps: {
        options: [
          { label: '是', value: 1 },
          { label: '否', value: 0 },
        ],
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'status',
      label: '状态',
      defaultValue: 0,
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ],
      },
    },
    {
      component: 'Textarea',
      fieldName: 'extParams',
      label: '扩展参数',
      componentProps: {
        rows: 3,
        placeholder: 'JSON 格式，例如：{"region":"cn-hangzhou"}',
      },
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: '备注',
      componentProps: {
        rows: 2,
        maxlength: 200,
        showCount: true,
        placeholder: '可选，补充说明',
      },
    },
  ],
  wrapperClass: 'grid-cols-1',
});

function syncFormPreset() {
  const supplier = currentSupplier.value;

  formApi.updateSchema([
    {
      fieldName: 'supplierLabel',
      componentProps: {
        placeholder: supplier?.label ?? '请选择厂商',
      },
    },
    {
      fieldName: 'configName',
      componentProps: {
        placeholder: supplier
          ? `例如：${supplier.label}主账号`
          : '例如：短信主账号',
      },
    },
    {
      fieldName: 'sdkAppId',
      componentProps: {
        placeholder:
          supplier?.supplierType === 'tencent'
            ? '腾讯云场景通常需要填写 SDK AppId'
            : '部分厂商需要，例如腾讯云',
      },
    },
  ]);
}

async function applyFormValuesFromProps() {
  const supplier = currentSupplier.value;
  const current = props.initialConfig;

  await formApi.setValues({
    accessKeyId: current?.accessKeyId ?? '',
    accessKeySecret: current?.accessKeySecret ?? '',
    configName:
      current?.configName ?? (supplier ? `${supplier.label}主账号` : ''),
    extParams:
      current?.extParams && typeof current.extParams === 'object'
        ? JSON.stringify(current.extParams)
        : '',
    isDefault: current?.isDefault ?? 0,
    remark: current?.remark ?? '',
    sdkAppId: current?.sdkAppId ?? '',
    signature: current?.signature ?? '',
    status: current?.status ?? 0,
    supplierLabel: supplier?.label ?? '',
    templateId: current?.templateId ?? '',
    weight: current?.weight ?? 1,
  });
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm: async () => {
    const supplier = currentSupplier.value;
    if (!supplier) {
      message.warning('请从对应厂商卡片进入配置流程');
      return;
    }

    try {
      loading.value = true;
      await formApi.validate();
      const data = await formApi.getValues();

      const rawExtParams =
        typeof data.extParams === 'string' ? data.extParams.trim() : '';
      let extParams: null | Record<string, any> = null;
      if (rawExtParams) {
        try {
          extParams = JSON.parse(rawExtParams);
        } catch {
          message.error('扩展参数必须是合法的 JSON 格式');
          return;
        }
      }

      const payload: Partial<SmsConfig> = {
        accessKeyId: data.accessKeyId,
        accessKeySecret: data.accessKeySecret,
        configName: data.configName,
        extParams: extParams || null,
        isDefault: data.isDefault,
        remark: data.remark,
        sdkAppId: data.sdkAppId,
        signature: data.signature,
        status: data.status ?? 0,
        supplierType: supplier.supplierType,
        templateId: data.templateId,
        weight: data.weight,
      };

      if (isEditMode.value && props.initialConfig) {
        await updateSmsConfig(props.initialConfig.id, {
          ...props.initialConfig,
          ...payload,
        });
        message.success(`${supplier.label}配置更新成功`);
      } else {
        await createSmsConfig(payload);
        message.success(`${supplier.label}配置创建成功`);
      }

      emit('success');
      await drawerApi.close();
    } catch (error) {
      console.error(error);
      message.error(isEditMode.value ? '更新失败' : '创建失败');
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
    syncFormPreset();
    await nextTick();
    await applyFormValuesFromProps();
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
  () => props.initialConfig,
  async () => {
    if (!props.open) return;
    syncFormPreset();
    await nextTick();
    await applyFormValuesFromProps();
  },
);

watch(
  () => props.defaultSupplierType,
  async () => {
    if (!props.open) return;
    syncFormPreset();
    await nextTick();
    await applyFormValuesFromProps();
  },
);
</script>

<template>
  <Drawer :title="drawerTitle" :loading="loading">
    <div class="create-tip">
      <div class="tip-title">单厂商配置流程</div>
      <div class="tip-description">
        当前抽屉只针对一个短信厂商进行配置维护，厂商类型已固定。
      </div>
    </div>
    <Form />
  </Drawer>
</template>

<style scoped lang="scss">
.create-tip {
  padding: 14px 16px;
  margin-bottom: 16px;
  background: rgb(22 119 255 / 6%);
  border: 1px solid rgb(22 119 255 / 16%);
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
