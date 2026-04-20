<script lang="ts" setup>
import type { UserRecord } from '#/api/system/user';

import { ref, shallowRef } from 'vue';

import { AccessControl } from '@vben/access';
import { useVbenDrawer, useVbenForm, z } from '@vben/common-ui';

import { Button, message, Modal } from 'ant-design-vue';

import {
  adminResetPasswordApi,
  createUser,
  getDeptList,
  updateUser,
} from '#/api/system/user';

const emit = defineEmits(['success']);

const isUpdate = ref(false);
const recordId = ref('');
const currentRecord = shallowRef<null | UserRecord>(null);
const deptTreeData = ref<any[]>([]);

function listToTree(list: any[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const item of list) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const node of list) {
    const parentId =
      node.parentId === '0' || node.parentId === 0 ? null : node.parentId;
    if (parentId && map.has(parentId)) {
      map.get(parentId).children.push(map.get(node.id));
    } else {
      roots.push(map.get(node.id));
    }
  }

  return roots;
}

const loadDeptTree = async () => {
  try {
    const depts = await getDeptList({ pageNumber: 1, pageSize: 1000 });
    deptTreeData.value = listToTree(depts);
  } catch (error) {
    console.error('Failed to load dept tree', error);
  }
};

async function handleResetPassword() {
  if (!recordId.value) return;

  Modal.confirm({
    title: 'Confirm send reset link',
    content: `Send a one-time password reset link to "${currentRecord.value?.realName}"?`,
    onOk: async () => {
      try {
        await adminResetPasswordApi({
          userId: recordId.value,
        });
        message.success('Reset link sent');
      } catch (error) {
        console.error(error);
      }
    },
  });
}

const [Form, formApi] = useVbenForm({
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'username',
      label: 'Username',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'realName',
      label: 'Real Name',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: 'Email',
      rules: z.string().email('Please enter a valid email address'),
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: 'Phone',
      rules: z
        .string()
        .regex(/^1[3-9]\d{9}$/, 'Please enter a valid phone number'),
    },
    {
      component: 'Select',
      fieldName: 'gender',
      label: 'Gender',
      componentProps: {
        style: { width: '100%' },
        options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
        ],
        placeholder: 'Please select gender',
      },
    },
    {
      component: 'TreeSelect',
      fieldName: 'deptId',
      label: 'Department',
      componentProps: {
        style: { width: '100%' },
        fieldNames: {
          children: 'children',
          label: 'deptName',
          value: 'id',
        },
        treeData: deptTreeData,
        placeholder: 'Please select department',
        allowClear: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'avatar',
      label: 'Avatar',
    },
    {
      component: 'RadioGroup',
      fieldName: 'status',
      label: 'Status',
      defaultValue: 1,
      componentProps: {
        options: [
          { label: 'Enabled', value: 1 },
          { label: 'Disabled', value: 0 },
        ],
      },
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: 'Remark',
    },
  ],
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: async () => {
    try {
      await formApi.validate();
      const data = await formApi.getValues();

      if (isUpdate.value) {
        await updateUser(recordId.value, data);
        message.success('Updated successfully');
      } else {
        await createUser(data);
        message.success('Created successfully');
      }

      emit('success');
      drawerApi.close();
    } catch (error) {
      console.error(error);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      loadDeptTree();

      const data = drawerApi.getData<any>();
      isUpdate.value = !!data?.isUpdate;
      currentRecord.value = data?.record || null;

      if (isUpdate.value && data?.record) {
        recordId.value = data.record.id;
        formApi.setValues({
          ...data.record,
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
  <Drawer :title="isUpdate ? 'Edit User' : 'Create User'">
    <Form />

    <AccessControl
      v-if="isUpdate"
      :codes="['sys:user:reset-password']"
      type="code"
    >
      <div class="mt-4 border-t border-gray-200 pt-4">
        <Button type="primary" danger @click="handleResetPassword">
          <span class="i-ant-design:key-outlined mr-1"></span>
          Send reset link
        </Button>
      </div>
    </AccessControl>
  </Drawer>
</template>
