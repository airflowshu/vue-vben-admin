<script lang="ts" setup>
import type { DeptRecord } from '@/api/system/dept';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { createDept, updateDept } from '@/api/system/dept';
import { useVbenForm } from '@flexboot4/web-kit/adapter/form';
import { message } from 'ant-design-vue';

const emit = defineEmits(['success']);

const isUpdate = ref(false);
const recordId = ref('');

type DeptTreeNode = Omit<DeptRecord, 'children' | 'parentId'> & {
  children?: DeptTreeNode[];
  parentId?: null | string;
};

function normalizeParentId(parentId: unknown) {
  if (parentId === '0' || parentId === 0 || parentId === null) {
    return null;
  }
  return parentId ? String(parentId) : null;
}

function walkDeptTree(
  deptTree: DeptTreeNode[],
  callback: (node: DeptTreeNode) => void,
) {
  for (const node of deptTree) {
    callback(node);
    if (node.children?.length) {
      walkDeptTree(node.children, callback);
    }
  }
}

function getExcludedDeptIds(deptTree: DeptTreeNode[], currentId: string) {
  const excludedIds = new Set([currentId]);
  const childIdMap = new Map<string, string[]>();

  walkDeptTree(deptTree, (node) => {
    const parentId = normalizeParentId(node.parentId);
    if (!parentId) {
      return;
    }
    const childIds = childIdMap.get(parentId) ?? [];
    childIds.push(node.id);
    childIdMap.set(parentId, childIds);
  });

  const queue = [currentId];
  for (let index = 0; index < queue.length; index += 1) {
    const parentId = queue[index];
    if (parentId === undefined) {
      continue;
    }

    for (const childId of childIdMap.get(parentId) ?? []) {
      if (!excludedIds.has(childId)) {
        excludedIds.add(childId);
        queue.push(childId);
      }
    }
  }

  return excludedIds;
}

function filterSelectableDeptTree(deptTree: DeptRecord[], currentId?: string) {
  if (!currentId) {
    return deptTree;
  }

  const excludedIds = getExcludedDeptIds(deptTree as DeptTreeNode[], currentId);
  const filterTree = (nodes: DeptTreeNode[]): DeptTreeNode[] => {
    return nodes
      .filter((node) => !excludedIds.has(node.id))
      .map((node) => {
        const nextNode: DeptTreeNode = { ...node };
        const children = node.children?.length ? filterTree(node.children) : [];
        if (children.length > 0) {
          nextNode.children = children;
        } else {
          delete nextNode.children;
        }
        return nextNode;
      });
  };

  return filterTree(deptTree as DeptTreeNode[]);
}

const [Form, formApi] = useVbenForm({
  showDefaultActions: false,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'deptName',
      label: '部门名称',
      rules: 'required',
    },
    {
      component: 'TreeSelect',
      componentProps: {
        fieldNames: {
          label: 'deptName',
          value: 'id',
          children: 'children',
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
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: '备注',
    },
  ],
});

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel: () => {
    drawerApi.close();
  },
  onConfirm: async () => {
    try {
      await formApi.validate();
      const values = await formApi.getValues();
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
      const data = drawerApi.getData<{
        deptTree: DeptRecord[];
        isUpdate: boolean;
        record?: DeptRecord;
      }>();
      isUpdate.value = !!data?.isUpdate;

      if (data?.deptTree) {
        const treeData =
          isUpdate.value && data.record
            ? filterSelectableDeptTree(data.deptTree, data.record.id)
            : data.deptTree;

        formApi.updateSchema([
          {
            componentProps: {
              treeData,
            },
            fieldName: 'parentId',
          },
        ]);
      }

      if (isUpdate.value && data?.record) {
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
