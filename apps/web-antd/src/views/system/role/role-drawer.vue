<script lang="ts" setup>
import type { RoleRecord } from '#/api/system/role';

import { ref } from 'vue';

import { useVbenDrawer, useVbenForm } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { createRole, updateRole } from '#/api/system/role';

const emit = defineEmits(['success']);

const isUpdate = ref(false);
const recordId = ref('');

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
      fieldName: 'roleName',
      label: '角色名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'roleCode',
      label: '角色编码',
      rules: [
        { required: true, message: '请输入角色编码' },
        {
          pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
          message: '角色编码必须以字母开头，只能包含字母、数字和下划线',
        },
      ],
    },
    {
      component: 'RadioGroup',
      fieldName: 'status',
      label: '状态',
      rules: 'required',
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ],
      },
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: '备注',
      componentProps: {
        rows: 3,
        maxlength: 200,
        showCount: true,
      },
    },
  ],
  wrapperClass: 'grid-cols-1',
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: async () => {
    try {
      await formApi.validate();
      const data = await formApi.getValues();

      if (isUpdate.value) {
        await updateRole(recordId.value, data);
        message.success('更新成功');
      } else {
        await createRole(data);
        message.success('创建成功');
      }

      emit('success');
      drawerApi.close();
    } catch (error) {
      console.error(error);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<any>();
      isUpdate.value = data?.isUpdate || false;

      if (isUpdate.value && data?.record) {
        recordId.value = data.record.id;
        formApi.setValues({
          roleName: data.record.roleName,
          roleValue: data.record.roleValue,
          status: data.record.status,
          remark: data.record.remark,
        });
      } else {
        recordId.value = '';
        formApi.resetForm();
      }
    }
  },
});
</script>

<template>
  <Drawer :title="isUpdate ? '编辑角色' : '新增角色'">
    <Form />
  </Drawer>
</template>
