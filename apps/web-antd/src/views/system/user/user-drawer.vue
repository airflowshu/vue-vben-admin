<script lang="ts" setup>
import type { UserRecord } from '#/api/system/user';

import { ref, shallowRef } from 'vue';

import { useVbenDrawer, useVbenForm, z } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import {
  createUser,
  getDeptList,
  updateUser,
} from '#/api/system/user';

const emit = defineEmits(['success']);

const isUpdate = ref(false);
const recordId = ref('');
const currentRecord = shallowRef<null | UserRecord>(null);

// 部门列表
const deptTreeData = ref<any[]>([]);

// 转换列表为树形结构
function listToTree(list: any[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  // 第一遍：建立所有节点的映射
  for (const item of list) {
    map.set(item.id, { ...item, children: [] });
  }

  // 第二遍：建立父子关系
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

// 获取部门树数据
const loadDeptTree = async () => {
  try {
    const depts = await getDeptList({ pageNumber: 1, pageSize: 1000 });
    deptTreeData.value = listToTree(depts);
  } catch (error) {
    console.error('Failed to load dept tree', error);
  }
};

const [Form, formApi] = useVbenForm({
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'username',
      label: '用户名',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'realName',
      label: '真实姓名',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'password',
      label: '密码',
      componentProps: {
        type: 'password',
        placeholder: '编辑时留空则不修改密码',
      },
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: '邮箱',
      rules: z.string().email('请输入正确的邮箱地址'),
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: '手机号',
      rules: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
    },
    {
      component: 'Select',
      fieldName: 'gender',
      label: '性别',
      componentProps: {
        style: { width: '100%' },
        options: [
          { label: '男', value: 'male' },
          { label: '女', value: 'female' },
        ],
        placeholder: '请选择性别',
      },
    },
    {
      component: 'TreeSelect',
      fieldName: 'deptId',
      label: '所属部门',
      componentProps: {
        style: { width: '100%' },
        fieldNames: {
          children: 'children',
          label: 'deptName',
          value: 'id',
        },
        treeData: deptTreeData,
        placeholder: '请选择部门',
        allowClear: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'avatar',
      label: '头像',
    },
    {
      component: 'RadioGroup',
      fieldName: 'status',
      label: '状态',
      defaultValue: 1,
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
    },
  ],
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: async () => {
    try {
      await formApi.validate();
      const data = await formApi.getValues();

      // 如果是更新且密码为空，则删除密码字段
      if (isUpdate.value && !data.password) {
        delete data.password;
      }

      if (isUpdate.value) {
        await updateUser(recordId.value, data);
        message.success('修改成功');
      } else {
        await createUser(data);
        message.success('新增成功');
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
          password: '', // 清空密码
        });
      } else {
        recordId.value = '';
        formApi.setFieldValue('password', '111111'); // 新增用户默认密码
      }
    }
  },
});
</script>

<template>
  <Drawer :title="isUpdate ? '编辑用户' : '新增用户'">
    <Form />
  </Drawer>
</template>
