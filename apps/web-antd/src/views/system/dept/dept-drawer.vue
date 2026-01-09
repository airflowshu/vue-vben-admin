<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createDept, getDeptList, updateDept } from '#/api/system/dept';

const emit = defineEmits(['success']);

const isUpdate = ref(false);
const recordId = ref('');

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '部门名称',
      help: '唯一标识，通常为英文',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'title',
      label: '标题',
      rules: 'required',
    },
    {
      component: 'TreeSelect',
      componentProps: {
        fieldNames: {
          children: 'children',
          label: 'title',
          value: 'id',
        },
        treeData: [],
      },
      fieldName: 'parentId',
      label: '上级部门',
    },
    {
      component: 'InputNumber',
      defaultValue: 0,
      fieldName: 'orderNo',
      label: '排序',
    },
    {
      component: 'Input',
      fieldName: 'icon',
      label: '图标',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ],
      },
      defaultValue: 1,
      fieldName: 'status',
      label: '状态',
    },
  ],
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: async () => {
    try {
      const values = await formApi.validate();
      drawerApi.setState({ confirmLoading: true });

      if (isUpdate.value) {
        await updateDept(recordId.value, values);
        message.success('修改成功');
      } else {
        await createDept(values);
        message.success('新增成功');
      }

      emit('success');
      drawerApi.close();
    } catch (error) {
      console.error(error);
    } finally {
      drawerApi.setState({ confirmLoading: false });
    }
  },
  onOpenChange: async (isOpen) => {
    if (isOpen) {
      const data = drawerApi.getData();
      isUpdate.value = !!data?.isUpdate;

      // Load tree data
      try {
        const depts = await getDeptList({ pageNumber: 1, pageSize: 1000 });
        formApi.updateSchema({
          componentProps: {
            treeData: depts,
          },
          fieldName: 'parentId',
        });
      } catch (error) {
        console.error('Failed to load dept tree', error);
      }

      if (isUpdate.value) {
        recordId.value = data.record.id;
        await formApi.setValues(data.record);
      } else {
        recordId.value = '';
        await formApi.resetForm();
      }
    }
  },
  title: '部门管理',
});
</script>

<template>
  <Drawer>
    <Form />
  </Drawer>
</template>
