<script setup lang="ts">
import type { FileObject } from '#/api/core/file';

import { ref, watch } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';

import {
  CameraOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileImageOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue';
import { Button, message, Modal, Tooltip } from 'ant-design-vue';
import Upload from 'ant-design-vue/es/upload';

const props = defineProps<{
  value?: string;
}>();

const emit = defineEmits<{
  'update:fileId': [fileId: string];
  'update:value': [value: string];
}>();

const accessStore = useAccessStore();
const userStore = useUserStore();
const imageUrl = ref(props.value || '');
const modalVisible = ref(false);
const uploadLoading = ref(false);
const previewVisible = ref(false);
const previewImage = ref('');

// 支持的图片格式
const acceptTypes = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

// 待上传的文件
const pendingFile = ref<File | null>(null);

watch(
  () => props.value,
  (newVal) => {
    imageUrl.value = newVal || '';
  },
);

// 打开更换头像弹窗
const openModal = () => {
  modalVisible.value = true;
};

// 关闭弹窗
const closeModal = () => {
  modalVisible.value = false;
  pendingFile.value = null;
};

// 预览图片
const handlePreview = () => {
  previewImage.value = imageUrl.value;
  previewVisible.value = true;
};

// 删除头像
const handleDelete = () => {
  Modal.confirm({
    content: '确定要删除头像吗？',
    okText: '删除',
    okType: 'danger',
    onOk: () => {
      imageUrl.value = '';
      emit('update:value', '');
      message.success('头像已删除');
    },
  });
};

// 文件选择前处理（校验 + 赋值）
const handleBeforeUpload = (file: File) => {
  // 验证文件类型
  if (!acceptTypes.has(file.type)) {
    message.error('仅支持 JPG/PNG/GIF/WEBP 格式的图片');
    return false;
  }

  // 验证文件大小 (2MB)
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小必须小于 2MB!');
    return false;
  }

  pendingFile.value = file;

  // 生成预览图
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.addEventListener('load', (e) => {
    if (e.target?.result) {
      previewImage.value = e.target.result as string;
    }
  });

  return false; // 阻止自动上传
};

// 提交上传
const handleUpload = async () => {
  if (!pendingFile.value) {
    if (modalVisible.value) {
      // 只有在弹窗点击确定（上传）按钮时才提示，如果只是关闭弹窗则不需要
      message.warning('请先选择图片');
    }
    return;
  }

  uploadLoading.value = true;

  // 使用 XMLHttpRequest 直接上传，避开 request 封装
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append('file', pendingFile.value!, pendingFile.value!.name);
    formData.append('bizType', 'sys_user_avatar');
    if (userStore.userInfo?.id) {
      formData.append('bizId', userStore.userInfo.id);
    }

    xhr.open('POST', '/api/admin/file/upload', true);

    // 设置认证头
    const token = accessStore.accessToken;
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.addEventListener('load', () => {
      uploadLoading.value = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.code === 0 && response.data) {
            const fileObj: FileObject = response.data;
            // 从 FileObject.location 获取文件访问地址
            const fileUrl = fileObj.location?.endpoint
              ? `${fileObj.location.endpoint}/${fileObj.location.bucket}/${fileObj.location.objectKey}`
              : '';

            if (fileUrl) {
              imageUrl.value = fileUrl;
              emit('update:value', fileUrl);
              // 将文件 ID 传递给父组件，用于更新用户信息的 profileFileId
              if (fileObj.id) {
                emit('update:fileId', fileObj.id);
              }
              message.success('头像上传成功');
              closeModal();
            } else {
              message.error('获取文件地址失败');
            }
          } else {
            message.error(response.message || '上传失败');
          }
        } catch {
          message.error('解析响应失败');
        }
      } else {
        message.error('上传失败');
      }
      resolve();
    });

    // eslint-disable-next-line unicorn/prefer-add-event-listener
    xhr.onerror = () => {
      uploadLoading.value = false;
      message.error('网络错误，上传失败');
      reject(new Error('上传失败'));
    };

    xhr.send(formData);
  });
};
</script>

<template>
  <div class="avatar-upload-container">
    <!-- 头像展示区域 -->
    <div class="avatar-wrapper" @click="!imageUrl ? openModal() : undefined">
      <div class="avatar-image-wrapper">
        <img v-if="imageUrl" :src="imageUrl" alt="头像" class="avatar-image" />
        <div v-else class="avatar-placeholder">
          <PlusOutlined class="placeholder-icon" />
          <span class="placeholder-text">上传头像</span>
        </div>
      </div>

      <!-- 悬浮操作按钮 -->
      <div v-if="imageUrl" class="avatar-actions">
        <Tooltip title="预览">
          <EyeOutlined class="action-icon" @click.stop="handlePreview" />
        </Tooltip>
        <Tooltip title="支持 JPG/PNG/GIF/WEBP，大小不超过 2MB">
          <CameraOutlined class="action-icon" @click.stop="openModal" />
        </Tooltip>
        <Tooltip title="删除">
          <DeleteOutlined class="action-icon" @click.stop="handleDelete" />
        </Tooltip>
      </div>
    </div>

    <!-- 更换头像弹窗 -->
    <Modal
      v-model:open="modalVisible"
      title="更换头像"
      :confirm-loading="uploadLoading"
      :ok-text="pendingFile ? '上传' : undefined"
      :cancel-text="pendingFile ? '取消' : '关闭'"
      @ok="handleUpload"
      @cancel="closeModal"
    >
      <div class="upload-content">
        <!-- 裁剪预览区域 -->
        <div class="preview-area">
          <img
            v-if="imageUrl && !pendingFile"
            :src="imageUrl"
            alt="当前头像"
            class="current-avatar"
          />
          <div v-else-if="!pendingFile" class="no-image">
            <CameraOutlined style="font-size: 64px; color: #d9d9d9" />
            <p class="mt-2 text-gray-500">选择一张图片作为头像</p>
          </div>
          <div v-else class="pending-preview-content">
            <img
              v-if="previewImage"
              :src="previewImage"
              class="current-avatar"
              alt="待上传头像"
            />
            <FileImageOutlined v-else style="font-size: 32px; color: #1677ff" />
            <p v-if="!previewImage" class="mt-2">{{ pendingFile.name }}</p>
          </div>
        </div>

        <!-- 文件选择 -->
        <div v-if="!pendingFile" class="upload-area">
          <Upload
            name="file"
            :show-upload-list="false"
            :before-upload="handleBeforeUpload"
            accept="image/*"
          >
            <Button type="primary" ghost>选择图片</Button>
          </Upload>
          <p class="hint-text">支持 JPG/PNG/GIF/WEBP，大小不超过 2MB</p>
        </div>

        <!-- 待上传预览操作 -->
        <div v-else class="pending-actions">
          <Button
            type="link"
            danger
            @click="
              () => {
                pendingFile = null;
              }
            "
          >
            重新选择
          </Button>
        </div>
      </div>
    </Modal>

    <!-- 图片预览弹窗 -->
    <Modal
      v-model:open="previewVisible"
      title="头像预览"
      :footer="null"
      :width="400"
    >
      <img
        v-if="previewImage"
        style="width: 100%; display: block"
        :src="previewImage"
        alt="头像预览"
      />
    </Modal>
  </div>
</template>

<style scoped>
.avatar-upload-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  overflow: hidden;
  transition: border-color 0.3s;
}

.avatar-wrapper:hover {
  border-color: #1677ff;
}

.avatar-image-wrapper {
  width: 100%;
  height: 100%;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  color: #999;
  transition: background-color 0.3s;
}

.avatar-wrapper:hover .avatar-placeholder {
  background-color: #f5f5f5;
}

.placeholder-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.placeholder-text {
  font-size: 12px;
}

.avatar-actions {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 50%;
}

.avatar-wrapper:hover .avatar-actions {
  opacity: 1;
}

.action-icon {
  font-size: 18px;
  color: #fff;
  cursor: pointer;
  transition: transform 0.2s;
}

.action-icon:hover {
  transform: scale(1.1);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
}

.preview-area {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px dashed #d9d9d9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.current-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pending-preview-content {
  width: 100%;
  height: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-area,
.pending-actions {
  text-align: center;
}

.hint-text {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
</style>
