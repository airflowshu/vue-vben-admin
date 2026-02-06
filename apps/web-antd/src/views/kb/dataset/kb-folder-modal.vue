<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Input, message } from 'ant-design-vue';

const emit = defineEmits(['confirm']);

const folderName = ref('');

const [Modal, modalApi] = useVbenModal({
  title: '创建文件夹',
  class: 'w-[400px]',
  onConfirm: () => {
    if (!folderName.value.trim()) {
      message.warning('请输入文件夹名称');
      return;
    }
    emit('confirm', folderName.value);
    modalApi.close();
  },
  onOpenChange: (open) => {
    if (open) {
      folderName.value = '';
    }
  },
});

defineExpose(modalApi);
</script>

<template>
  <Modal>
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon icon="mdi:folder" class="text-xl text-orange-400" />
        <span class="text-base font-semibold">创建文件夹</span>
      </div>
    </template>

    <div class="p-6">
      <Input
        v-model:value="folderName"
        placeholder="输入文件夹名称"
        class="custom-folder-input"
        @press-enter="modalApi.onConfirm()"
      />
    </div>
  </Modal>
</template>

<style lang="scss" scoped>
.custom-folder-input {
  height: 40px;
  border-radius: 8px;
  border: 1px solid #d1d5db;

  &:focus,
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
}
</style>
