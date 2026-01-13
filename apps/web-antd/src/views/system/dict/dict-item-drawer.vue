<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { DictItem } from '#/api/system/dict';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Button, message, Modal, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDictItem } from '#/api/system/dict';

import ItemModal from './dict-item-modal.vue'; // We will create a small modal for editing items

defineProps<{
  dictItems?: DictItem[]; // Initial items if passed
  dictTypeId?: string;
}>();

const emit = defineEmits(['refresh']);

// Use a local state for items to allow updates without refreshing the parent every time if desired
// But for now, we rely on the parent or re-fetching.
// Since the requirement implies "manage items", we might receive the full list or fetch it.
// Given the JSON structure, items are inside the type. We will display what is passed, or support local CRUD.

const gridOptions: VxeGridProps<DictItem> = {
  columns: [
    { field: 'itemText', title: '名称', minWidth: 120 },
    { field: 'itemValue', title: '数据值', width: 100 },
    { field: 'itemCode', title: '编码', width: 100 },
    { field: 'orderNo', title: '排序', width: 80 },
    {
      field: 'status',
      title: '状态',
      width: 80,
      slots: { default: 'status' },
    },
    { field: 'remark', title: '备注', minWidth: 150 },
    {
      field: 'action',
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  data: [], // Will be set via setData or props
  pagerConfig: {
    enabled: false, // Items usually don't need pagination inside the drawer
  },
  toolbarConfig: {
    custom: true,
    slots: { buttons: 'toolbar-buttons' },
  },
  height: 'auto',
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const [ItemDrawer, itemDrawerApi] = useVbenDrawer({
  connectedComponent: ItemModal,
});

const currentTypeId = ref<string>('');

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange(isOpen) {
    if (isOpen) {
      const { dictItems, typeId } = drawerApi.getData<any>() || {};
      if (dictItems) {
        gridApi.setGridOptions({ data: dictItems });
      }
      if (typeId) {
        currentTypeId.value = typeId;
      }
    }
  },
});

function handleAdd() {
  itemDrawerApi.setData({ isUpdate: false, typeId: currentTypeId.value });
  itemDrawerApi.open();
}

function handleEdit(row: DictItem) {
  itemDrawerApi.setData({
    isUpdate: true,
    record: row,
    typeId: currentTypeId.value,
  });
  itemDrawerApi.open();
}

function handleDelete(row: DictItem) {
  Modal.confirm({
    title: '确认删除',
    content: `是否确认删除字典项 "${row.itemText}"？`,
    onOk: async () => {
      try {
        await deleteDictItem(row.id);
        message.success('删除成功');
        emit('refresh'); // Tell parent to refresh
        // Also remove from local grid for better UX
        gridApi.grid?.remove(row);
      } catch (error) {
        console.error(error);
      }
    },
  });
}

function handleItemSuccess() {
  emit('refresh');
  // In a real app we might need to re-fetch the item list here.
  // But since the API design is not fully clear on item fetching (sub-resource vs embedded),
  // we rely on the parent refreshing the type list which contains the items.
}
</script>

<template>
  <Drawer title="字典项管理" class="w-[800px]">
    <div class="flex h-full flex-col">
      <Grid>
        <template #toolbar-buttons>
          <Button type="primary" @click="handleAdd">新增字典项</Button>
        </template>

        <template #status="{ row }">
          <Tag v-if="row.status === 1" color="success">启用</Tag>
          <Tag v-else color="error">禁用</Tag>
        </template>

        <template #action="{ row }">
          <Button type="link" size="small" @click="handleEdit(row)">
            编辑
          </Button>
          <Button type="link" danger size="small" @click="handleDelete(row)">
            删除
          </Button>
        </template>
      </Grid>
      <ItemDrawer @success="handleItemSuccess" />
    </div>
  </Drawer>
</template>
