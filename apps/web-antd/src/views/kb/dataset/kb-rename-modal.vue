<script lang="ts" setup>
import { ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { Input, Button, message } from 'ant-design-vue';

const emit = defineEmits(['confirm']);

const newName = ref('');
const currentFileId = ref('');

const [Modal, modalApi] = useVbenModal({
  title: '重命名',
  class: 'w-[400px]',
  draggable: false,
  closable: false,
  fullscreenButton: false,
  footer: false, // 隐藏默认底部，使用自定义底部
  onOpenChange: (open) => {
    if (open) {
      const data = modalApi.getData<{ id: string; name: string }>();
      if (data) {
        currentFileId.value = data.id;
        newName.value = data.name;
      }
    }
  }
});

function handleCancel() {
  modalApi.close();
}

function handleConfirm() {
  if (!newName.value.trim()) {
    message.warning('请输入名称');
    return;
  }
  emit('confirm', { id: currentFileId.value, name: newName.value });
  modalApi.close();
}
</script>

<template>
  <Modal>
    <template #title>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <IconifyIcon icon="mdi:rename-box-outline" class="text-blue-500 text-xl" />
          <span class="text-base font-semibold">重命名</span>
        </div>
        <IconifyIcon 
          icon="mdi:close" 
          class="text-gray-400 cursor-pointer hover:text-gray-600 text-xl" 
          @click="handleCancel"
        />
      </div>
    </template>

    <div class="p-6">
      <Input
        v-model:value="newName"
        class="custom-rename-input"
        @press-enter="handleConfirm"
      />
      
      <div class="flex justify-end gap-3 mt-8">
        <Button class="custom-btn-cancel" @click="handleCancel">关闭</Button>
        <Button type="primary" class="custom-btn-confirm" @click="handleConfirm">确认</Button>
      </div>
    </div>
  </Modal>
</template>

<style lang="scss" scoped>
.custom-rename-input {
  height: 44px;
  border-radius: 8px;
  border: 1px solid #3b82f6; // 蓝色边框
  padding: 0 12px;
  font-size: 14px;
  
  &:focus, &:hover {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
}

.custom-btn-cancel {
  height: 36px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  color: #374151;
  font-weight: 500;
  padding: 0 20px;
  
  &:hover {
    color: #3b82f6;
    border-color: #3b82f6;
  }
}

.custom-btn-confirm {
  height: 36px;
  border-radius: 6px;
  background: #3b82f6;
  font-weight: 500;
  padding: 0 20px;
  
  &:hover {
    background: #2563eb;
  }
}
</style>
