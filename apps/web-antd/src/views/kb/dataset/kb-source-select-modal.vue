<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

const emit = defineEmits(['confirm']);

const selectedSource = ref('local');

const sources = [
  {
    id: 'local',
    title: '本地文件',
    description: '上传 PDF、TXT、DOCX 等格式的文件',
    icon: 'mdi:file-document-outline',
  },
  {
    id: 'web',
    title: '网页链接',
    description: '读取静态网页内容作为数据集',
    icon: 'mdi:link-variant',
  },
  {
    id: 'custom',
    title: '自定义文本',
    description: '手动输入一段文本作为数据集',
    icon: 'mdi:text-box-plus-outline',
  },
];

const [Modal, modalApi] = useVbenModal({
  title: '选择来源',
  class: 'w-[600px]',
  onConfirm: () => {
    emit('confirm', selectedSource.value);
    modalApi.close();
  },
});

defineExpose(modalApi);
</script>

<template>
  <Modal>
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon
          icon="mdi:check-circle-outline"
          class="text-xl text-blue-500"
        />
        <span>选择来源</span>
      </div>
    </template>

    <div class="flex flex-col gap-4 p-6">
      <div
        v-for="source in sources"
        :key="source.id"
        class="source-card"
        :class="{ active: selectedSource === source.id }"
        @click="selectedSource = source.id"
      >
        <div class="source-radio">
          <div class="radio-inner"></div>
        </div>
        <div class="source-info">
          <div class="source-title">{{ source.title }}</div>
          <div class="source-desc">{{ source.description }}</div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style lang="scss" scoped>
.source-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;

  &:hover {
    border-color: #3b82f6;
    background: #f9fafb;
  }

  &.active {
    border-color: #3b82f6;
    background: #eff6ff;
    box-shadow: 0 0 0 1px #3b82f6;

    .source-radio {
      border-color: #3b82f6;
      .radio-inner {
        transform: scale(1);
      }
    }
  }
}

.source-radio {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;

  .radio-inner {
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    transform: scale(0);
    transition: transform 0.2s ease;
  }
}

.source-info {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .source-title {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
  }

  .source-desc {
    font-size: 13px;
    color: #6b7280;
  }
}
</style>
