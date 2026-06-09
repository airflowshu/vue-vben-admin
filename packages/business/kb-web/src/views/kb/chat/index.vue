<script setup lang="ts">
import type { KnowledgeBase } from '../../../api/knowledgebase';

import { nextTick, onMounted, onUnmounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Dropdown,
  Empty,
  Input,
  Menu,
  MenuItem,
  message,
  Spin,
  Tooltip,
} from 'ant-design-vue';

import { getKnowledgeBaseList } from '../../../api/knowledgebase';
import { createSSEConnection } from '../../../utils/sse';

interface ChatMessage {
  content: string;
  id: string;
  isStreaming?: boolean;
  role: 'ai' | 'user';
  timestamp: number;
}

const messages = ref<ChatMessage[]>([]);
const inputValue = ref('');
const isLoading = ref(false);
const isStreaming = ref(false);
const loadingKbs = ref(false);
const kbDropdownOpen = ref(false);
const knowledgeBaseList = ref<KnowledgeBase[]>([]);
const selectedKb = ref<KnowledgeBase | null>(null);
const chatContainerRef = ref<HTMLElement | null>(null);
const inputRef = ref<any>(null);
let abortController: AbortController | null = null;

const generateId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
  }
};

async function fetchKnowledgeBases() {
  loadingKbs.value = true;
  try {
    const list = await getKnowledgeBaseList({
      pageNumber: 1,
      pageSize: 1000,
      logic: 'AND',
      orders: [{ column: 'lastModifyTime', asc: false }],
      items: [],
    });
    knowledgeBaseList.value = list || [];
    if (!selectedKb.value && knowledgeBaseList.value.length > 0) {
      selectedKb.value = knowledgeBaseList.value[0] || null;
    }
  } catch (error) {
    console.error('加载知识库列表失败:', error);
    message.error('加载知识库列表失败');
  } finally {
    loadingKbs.value = false;
  }
}

const selectKnowledgeBase = (kb: KnowledgeBase) => {
  if (isStreaming.value) {
    message.warning('请先停止当前回答再切换知识库');
    return;
  }
  selectedKb.value = kb;
  kbDropdownOpen.value = false;
};

const abortCurrentConnection = () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
};

const markStreamingMessageDone = (messageId?: string) => {
  messages.value.forEach((msg) => {
    if (!messageId || msg.id === messageId) {
      msg.isStreaming = false;
    }
  });
};

const resetStreamingState = (messageId?: string) => {
  isLoading.value = false;
  isStreaming.value = false;
  abortController = null;
  markStreamingMessageDone(messageId);
};

const stopStreaming = () => {
  abortCurrentConnection();
  resetStreamingState();
};

const handleSSEResponse = (chunk: string, messageId: string) => {
  const msg = messages.value.find((item) => item.id === messageId);
  if (msg) {
    msg.content += chunk;
    scrollToBottom();
  }
};

const clearInputValue = async () => {
  inputValue.value = '';
  await nextTick();
  inputValue.value = '';
};

const sendMessage = async () => {
  if (isStreaming.value) {
    stopStreaming();
    return;
  }

  const trimmedValue = inputValue.value.trim();
  if (!trimmedValue || isLoading.value) return;

  if (!selectedKb.value?.id) {
    message.warning('请选择知识库后再提问');
    return;
  }

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

  abortCurrentConnection();
  messages.value.push(userMessage, loadingMessage);
  isLoading.value = true;
  isStreaming.value = true;
  await clearInputValue();
  await scrollToBottom();

  const aiMessageId = loadingMessage.id;
  abortController = createSSEConnection({
    url: '/api/ai/rag/chat/stream',
    body: {
      kbId: selectedKb.value.id,
      query: trimmedValue,
      stream: true,
    },
    onMessage: (data) => {
      try {
        if (data.startsWith('{')) {
          const chunkData = JSON.parse(data);
          if (chunkData.error) {
            message.error(chunkData.error.message || '请求失败');
            stopStreaming();
            return;
          }

          const content =
            chunkData?.choices?.[0]?.delta?.content ??
            chunkData?.choices?.[0]?.message?.content;
          if (content) {
            handleSSEResponse(content, aiMessageId);
          }

          const finishReason = chunkData?.choices?.[0]?.finish_reason;
          if (finishReason) {
            resetStreamingState(aiMessageId);
          }
          return;
        }
        if (data) {
          handleSSEResponse(data, aiMessageId);
        }
      } catch (error) {
        console.error('解析SSE数据失败:', error);
      }
    },
    onError: (error) => {
      let errorMessage = '知识库问答连接失败';
      if (error?.message) {
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = error.message;
        }
      }
      message.error(errorMessage);
      resetStreamingState(aiMessageId);
    },
    onComplete: () => {
      resetStreamingState(aiMessageId);
    },
  });
};

const clearChat = () => {
  stopStreaming();
  messages.value = [];
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    void sendMessage();
  }
};

onUnmounted(() => {
  stopStreaming();
});

onMounted(async () => {
  await fetchKnowledgeBases();
  await nextTick();
  inputRef.value?.focus();
});
</script>

<template>
  <div class="kb-chat-page">
    <div class="chat-header">
      <div class="header-title">
        <IconifyIcon icon="lucide:book-open-check" class="header-icon" />
        <span>知识库问答</span>
        <Dropdown
          v-model:open="kbDropdownOpen"
          :disabled="loadingKbs || knowledgeBaseList.length === 0"
          trigger="click"
        >
          <Button size="small" class="kb-selector">
            <template #icon>
              <IconifyIcon icon="lucide:library" />
            </template>
            {{ selectedKb?.name || '选择知识库' }}
            <IconifyIcon icon="lucide:chevron-down" />
          </Button>
          <template #overlay>
            <Menu class="kb-dropdown-menu">
              <MenuItem
                v-for="kb in knowledgeBaseList"
                :key="kb.id"
                :class="{ selected: selectedKb?.id === kb.id }"
                @click="selectKnowledgeBase(kb)"
              >
                <div class="kb-item">
                  <span>{{ kb.name }}</span>
                  <IconifyIcon
                    v-if="selectedKb?.id === kb.id"
                    icon="lucide:check"
                  />
                </div>
              </MenuItem>
            </Menu>
          </template>
        </Dropdown>
      </div>
      <Tooltip title="清空对话">
        <Button danger size="small" @click="clearChat">
          <template #icon>
            <IconifyIcon icon="lucide:trash-2" />
          </template>
          清空
        </Button>
      </Tooltip>
    </div>

    <div ref="chatContainerRef" class="chat-messages">
      <div v-if="loadingKbs" class="loading-state">
        <Spin />
      </div>

      <Empty
        v-else-if="knowledgeBaseList.length === 0"
        description="暂无可用知识库"
        class="empty-state"
      />

      <div v-else-if="messages.length === 0" class="welcome-message">
        <IconifyIcon icon="lucide:messages-square" class="welcome-icon" />
        <div class="welcome-title">基于知识库提问</div>
        <div class="welcome-subtitle">
          当前知识库：{{ selectedKb?.name || '未选择' }}
        </div>
      </div>

      <template v-else>
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          :class="msg.role"
        >
          <div class="message-avatar">
            <IconifyIcon
              :icon="msg.role === 'user' ? 'lucide:user' : 'lucide:book-open'"
            />
          </div>

          <div class="message-content">
            <div class="message-bubble">
              <Spin v-if="msg.isStreaming && !msg.content" size="small" />
              <span class="message-text">{{ msg.content }}</span>
              <span v-if="msg.isStreaming" class="typing-cursor">|</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="chat-input-wrapper">
      <div class="chat-input-container">
        <div class="input-field-wrapper">
          <Input.TextArea
            ref="inputRef"
            v-model:value="inputValue"
            :placeholder="
              selectedKb
                ? isLoading
                  ? '知识库正在检索并生成回答...'
                  : '输入知识库问题'
                : '请先选择知识库'
            "
            :disabled="isLoading || !selectedKb"
            :rows="1"
            auto-size
            class="chat-input-field"
            @keydown="handleKeydown"
          />
        </div>

        <Tooltip :title="isStreaming ? '停止生成' : '发送'">
          <Button
            class="send-button"
            :class="{
              disabled: (!inputValue.trim() || !selectedKb) && !isStreaming,
            }"
            :disabled="(!inputValue.trim() || !selectedKb) && !isStreaming"
            html-type="button"
            @click="sendMessage"
          >
            <Spin v-if="isLoading || isStreaming" size="small" />
            <IconifyIcon v-else icon="lucide:send-horizontal" />
          </Button>
        </Tooltip>
      </div>

      <div class="input-disclaimer">
        回答基于知识库检索片段生成，请核实重要内容
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
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

.kb-chat-page {
  --chat-bg: hsl(var(--card));
  --chat-header-bg: hsl(var(--card));
  --chat-border: hsl(var(--border));
  --chat-foreground: hsl(var(--foreground));
  --chat-muted-foreground: hsl(var(--muted-foreground));
  --chat-input-bg: hsl(var(--input-background));
  --chat-input-border: hsl(var(--input));
  --chat-input-placeholder: hsl(var(--input-placeholder));
  --chat-hover-bg: hsl(var(--accent));
  --chat-user-bg: hsl(var(--primary));
  --chat-user-foreground: hsl(var(--primary-foreground));
  --chat-ai-bg: hsl(var(--muted));
  --chat-send-bg: hsl(var(--primary));
  --chat-send-foreground: hsl(var(--primary-foreground));
  --chat-scrollbar: hsl(var(--accent-dark));

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--chat-bg);
  border-radius: 8px;
}

:global(.dark) .kb-chat-page {
  --chat-ai-bg: hsl(var(--accent));
  --chat-scrollbar: hsl(var(--accent));
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 12px 20px;
  background: var(--chat-header-bg);
  border-bottom: 1px solid var(--chat-border);

  .header-title {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--chat-foreground);
  }

  .header-icon {
    flex-shrink: 0;
    font-size: 20px;
  }
}

.kb-selector {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 6px;
}

.kb-dropdown-menu {
  min-width: 220px;
  max-height: 320px;
  overflow-y: auto;

  .kb-item {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .selected {
    color: hsl(var(--primary));
    background: color-mix(in srgb, hsl(var(--primary)), transparent 90%);
  }
}

.chat-messages {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--chat-scrollbar);
    border-radius: 3px;
  }
}

.loading-state,
.empty-state,
.welcome-message {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.welcome-message {
  flex-direction: column;
  padding: 40px 20px;
  color: var(--chat-muted-foreground);
  text-align: center;

  .welcome-icon {
    margin-bottom: 20px;
    font-size: 56px;
    color: hsl(var(--primary));
  }

  .welcome-title {
    margin-bottom: 12px;
    font-size: 24px;
    font-weight: 600;
    color: var(--chat-foreground);
  }

  .welcome-subtitle {
    font-size: 15px;
  }
}

.message-item {
  display: flex;
  gap: 14px;
  width: 100%;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      justify-content: flex-end;
    }

    .message-avatar,
    .message-bubble {
      color: var(--chat-user-foreground);
      background: var(--chat-user-bg);
    }

    .message-bubble {
      border-radius: 16px 16px 4px;
    }
  }

  &.ai {
    .message-content {
      justify-content: flex-start;
    }

    .message-avatar {
      color: var(--chat-user-foreground);
      background: hsl(var(--success));
    }

    .message-bubble {
      color: var(--chat-foreground);
      background: var(--chat-ai-bg);
      border: 1px solid var(--chat-border);
      border-radius: 16px 16px 16px 4px;
    }
  }
}

.message-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  border-radius: 50%;
}

.message-content {
  display: flex;
  flex: 1;
}

.message-bubble {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  max-width: min(760px, 72%);
  min-height: 24px;
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.6;
  overflow-wrap: anywhere;

  .message-text {
    flex: 1;
    white-space: pre-wrap;
  }

  .typing-cursor {
    color: var(--chat-muted-foreground);
    animation: blink 1s infinite;
  }
}

.chat-input-wrapper {
  padding: 16px 24px 20px;
  background: var(--chat-bg);
  border-top: 1px solid var(--chat-border);
}

.chat-input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  padding: 8px 8px 8px 14px;
  background: var(--chat-input-bg);
  border: 1px solid var(--chat-input-border);
  border-radius: 24px;

  &:focus-within {
    border-color: hsl(var(--primary));
    box-shadow: 0 0 0 2px
      color-mix(in srgb, hsl(var(--primary)), transparent 90%);
  }
}

.input-field-wrapper {
  flex: 1;
  min-width: 0;
}

.chat-input-field {
  width: 100%;
  padding: 8px 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--chat-foreground);
  resize: none;
  background: transparent !important;
  border: none !important;

  :deep(.ant-input) {
    color: var(--chat-foreground);
    outline: none !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;

    &::placeholder {
      color: var(--chat-input-placeholder);
    }
  }
}

.send-button {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--chat-send-foreground);
  background: var(--chat-send-bg);
  border: none;
  border-radius: 50%;

  &:hover {
    color: var(--chat-send-foreground);
    background: var(--chat-send-bg);
    box-shadow: 0 4px 15px rgb(0 0 0 / 18%);
  }

  &.disabled,
  &[disabled] {
    cursor: not-allowed;
    opacity: 0.45;
  }
}

.input-disclaimer {
  margin-top: 12px;
  font-size: 12px;
  color: var(--chat-muted-foreground);
  text-align: center;
}

@media (max-width: 768px) {
  .chat-header {
    align-items: flex-start;

    .header-title {
      flex-wrap: wrap;
    }
  }

  .chat-messages {
    gap: 16px;
    padding: 16px;
  }

  .message-bubble {
    max-width: 90%;
    padding: 12px 14px;
  }

  .chat-input-wrapper {
    padding: 12px 16px 16px;
  }
}
</style>
