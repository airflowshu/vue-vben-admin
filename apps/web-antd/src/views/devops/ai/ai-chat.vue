<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

import { Button, Input, Spin, Tooltip } from 'ant-design-vue';

import { useUserStore } from '@vben/stores';

import { createSSEConnection } from '#/utils/sse';

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

const userStore = useUserStore();

const messages = ref<ChatMessage[]>([]);
const inputValue = ref('');
const isLoading = ref(false);
const chatContainerRef = ref<HTMLElement | null>(null);
const inputRef = ref<any>(null);
let abortController: AbortController | null = null;

// 生成唯一ID
const generateId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
  }
};

// 关闭SSE连接
const closeEventSource = () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
};

// 处理SSE响应
const handleSSEResponse = (chunk: string, messageId: string) => {
  const msgIndex = messages.value.findIndex(
    (m: ChatMessage) => m.id === messageId,
  );
  if (msgIndex !== -1) {
    const msg = messages.value[msgIndex];
    if (msg) {
      msg.content += chunk;
      scrollToBottom();
    }
  }
};

// 发送消息到后端SSE接口
const sendMessage = async () => {
  const trimmedValue = inputValue.value.trim();

  if (!trimmedValue || isLoading.value) return;

  const userMessage: ChatMessage = {
    id: generateId(),
    role: 'user',
    content: trimmedValue,
    timestamp: Date.now(),
  };

  const loadingMessage: ChatMessage = {
    id: generateId(),
    role: 'ai',
    content: '',
    timestamp: Date.now(),
    isStreaming: true,
  };

  messages.value.push(userMessage, loadingMessage);
  inputValue.value = '';
  isLoading.value = true;
  await scrollToBottom();

  closeEventSource();

  // 获取认证信息
  // const accessToken = localStorage.getItem('accessToken') || '';
  // const aiApiKey = userStore.userInfo?.aiApiKey || '';

  // 创建SSE连接（使用 fetch 实现，支持自定义请求头）
  const url = `/api/ai/sse/time`;
  const aiMessageId = loadingMessage.id;

  abortController = createSSEConnection({
    url,
    // headers: {
    //   // Authorization: `Bearer ${accessToken}`,
    //   'X-AI-API-KEY': aiApiKey,
    // },
    onOpen: () => {
      console.warn('SSE连接已建立');
    },
    onMessage: (data, _event) => {
      try {
        if (data) {
          handleSSEResponse(data, aiMessageId);
        }
      } catch (error) {
        console.error('解析SSE数据失败:', error);
      }
    },
    onError: (error) => {
      console.error('SSE错误:', error);
      isLoading.value = false;

      // 更新消息状态
      const msgIndex = messages.value.findIndex(
        (m: ChatMessage) => m.id === aiMessageId,
      );
      if (msgIndex !== -1) {
        const msg = messages.value[msgIndex];
        if (msg) {
          msg.isStreaming = false;
        }
      }
    },
    onComplete: () => {
      isLoading.value = false;
      const msgIndex = messages.value.findIndex(
        (m: ChatMessage) => m.id === aiMessageId,
      );
      if (msgIndex !== -1) {
        const msg = messages.value[msgIndex];
        if (msg) {
          msg.isStreaming = false;
        }
      }
    },
  });

  // 超时处理（如果后端没有发送完成事件）
  setTimeout(() => {
    if (abortController && isLoading.value) {
      isLoading.value = false;
      const msgIndex = messages.value.findIndex(
        (m: ChatMessage) => m.id === aiMessageId,
      );
      if (msgIndex !== -1) {
        const msg = messages.value[msgIndex];
        if (msg) {
          msg.isStreaming = false;
        }
      }
      closeEventSource();
    }
  }, 30_000); // 30秒超时
};

// 键盘事件处理
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

// 清空对话
const clearChat = () => {
  messages.value = [];
};

// 上传文件
const handleUpload = () => {
  // TODO: 实现文件上传功能
  console.log('上传文件');
};

// 生成图片
const handleGenerateImage = () => {
  // TODO: 实现生成图片功能
  console.log('生成图片');
};

// 组件卸载时关闭连接
onUnmounted(() => {
  closeEventSource();
});

// 初始聚焦输入框
onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus();
  });
});
</script>

<template>
  <div class="ai-chat-container">
    <!-- 头部 -->
    <div class="chat-header">
      <div class="header-title">
        <span class="ai-icon">&#x2728;</span>
        <span>AI 助手</span>
      </div>
      <Button danger size="small" @click="clearChat"> 清空对话 </Button>
    </div>

    <!-- 聊天内容区域 -->
    <div ref="chatContainerRef" class="chat-messages">
      <!-- 欢迎消息（空状态） -->
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">&#x2728;</div>
        <div class="welcome-title">有什么可以帮您的？</div>
        <div class="welcome-subtitle">输入您的问题，我会尽力帮助您解答</div>
      </div>

      <!-- 消息列表 -->
      <template v-else>
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          :class="msg.role"
        >
          <!-- 用户头像 -->
          <div class="message-avatar">
            <template v-if="msg.role === 'user'">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
            </template>
            <template v-else>
              <div class="ai-avatar">
                <span>&#x2728;</span>
              </div>
            </template>
          </div>

          <!-- 消息内容 -->
          <div class="message-content">
            <div class="message-bubble">
              <Spin v-if="msg.isStreaming" size="small" />
              <span class="message-text">{{ msg.content }}</span>
              <span v-if="msg.isStreaming" class="typing-cursor">|</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-wrapper">
      <div class="chat-input-container">
        <!-- 左侧工具栏 -->
        <div class="input-tools">
          <Tooltip title="上传文件">
            <div class="tool-button add-button" @click="handleUpload">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
          </Tooltip>
        </div>

        <!-- 输入框 -->
        <div class="input-field-wrapper">
          <Input.TextArea
            ref="inputRef"
            v-model:value="inputValue"
            :placeholder="isLoading ? 'AI 正在思考中...' : '输入消息'"
            :disabled="isLoading"
            :rows="1"
            auto-size
            @keydown="handleKeydown"
            class="chat-input-field"
          />
        </div>

        <!-- 右侧工具栏 -->
        <div class="input-actions">
          <Tooltip title="生成图片">
            <div class="tool-button action-button" @click="handleGenerateImage">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path
                  d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 15h14v3H5z"
                />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path
                  d="M12 10c-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 4.5-2 4.5-4.5-2-4.5-4.5-4.5z"
                />
              </svg>
            </div>
          </Tooltip>
          <Tooltip title="发送">
            <div
              class="tool-button send-button"
              :class="{ disabled: !inputValue.trim() || isLoading }"
              @click="sendMessage"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </div>
          </Tooltip>
        </div>
      </div>

      <div class="input-disclaimer">AI 可能会产生错误信息，请核实重要内容</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

// 头部样式
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;

    .ai-icon {
      font-size: 20px;
    }
  }
}

// 聊天消息区域
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 3px;
  }
}

// 欢迎消息
.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 40px 20px;

  .welcome-icon {
    font-size: 56px;
    margin-bottom: 20px;
  }

  .welcome-title {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 12px;
  }

  .welcome-subtitle {
    font-size: 15px;
    color: #666;
  }
}

// 消息项
.message-item {
  display: flex;
  gap: 16px;
  max-width: 75%;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;

    .message-avatar {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #fff;
    }

    .message-bubble {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #fff;
      border-radius: 20px 20px 4px 20px;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    }
  }

  &.ai {
    align-self: flex-start;

    .message-avatar {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #fff;
    }

    .message-bubble {
      background: #f5f5f5;
      color: #1a1a1a;
      border-radius: 20px 20px 20px 4px;
    }
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  .ai-avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
}

.message-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.message-bubble {
  padding: 14px 20px;
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 24px;

  .message-text {
    white-space: pre-wrap;
    flex: 1;
  }

  .typing-cursor {
    animation: blink 1s infinite;
    color: #999;
    font-weight: 300;
  }
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0;
  }
}

// 输入区域包装器
.chat-input-wrapper {
  padding: 16px 24px 20px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  position: relative;
}

// 输入容器
.chat-input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e8e8e8;
  border-radius: 24px;
  padding: 8px 8px 8px 12px;
  transition: all 0.3s ease;

  &:focus-within {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }
}

// 左侧工具栏
.input-tools {
  display: flex;
  align-items: center;
}

// 工具按钮
.tool-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;

  &:hover {
    background: #f0f0f0;
    color: #333;
    transform: scale(1.05);
  }

  &.send-button {
    background: #1a1a1a;
    color: #fff;

    &:hover {
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    &.disabled {
      opacity: 0.4;
      cursor: not-allowed;

      &:hover {
        background: #1a1a1a;
        box-shadow: none;
        transform: none;
      }
    }
  }

  &.action-button {
    margin-right: 4px;
  }
}

// 输入框包装器
.input-field-wrapper {
  flex: 1;
  min-width: 0;
}

.chat-input-field {
  width: 100%;
  border: none !important;
  background: transparent !important;
  resize: none;
  padding: 8px 0;
  font-size: 15px;
  line-height: 1.5;
  color: #1a1a1a;

  &::placeholder {
    color: #999;
  }

  :deep(.ant-input) {
    background: transparent !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    color: #1a1a1a;

    &::placeholder {
      color: #999;
    }
  }
}

// 右侧操作区
.input-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

// 输入免责声明
.input-disclaimer {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 12px;
  letter-spacing: 0.3px;
}
</style>
