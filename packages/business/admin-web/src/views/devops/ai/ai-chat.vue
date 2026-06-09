<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { createSSEConnection } from '@/utils/sse';
import { Button, Input, message, Spin, Tooltip } from 'ant-design-vue';

interface ChatMessage {
  content: string;
  id: string;
  isStreaming?: boolean;
  role: 'ai' | 'user';
  timestamp: number;
}

interface ChatCompletionMessage {
  content: string;
  role: 'assistant' | 'user';
}

const messages = ref<ChatMessage[]>([]);
const inputValue = ref('');
const isLoading = ref(false);
const isStreaming = ref(false);
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

const abortCurrentConnection = () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
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

const buildConversationMessages = (
  nextUserContent: string,
): ChatCompletionMessage[] => {
  const history = messages.value
    .filter((msg) => msg.content.trim() && !msg.isStreaming)
    .map((msg) => ({
      role: msg.role === 'ai' ? ('assistant' as const) : ('user' as const),
      content: msg.content,
    }));
  history.push({ role: 'user', content: nextUserContent });
  return history;
};

const sendMessage = async () => {
  if (isStreaming.value) {
    stopStreaming();
    return;
  }

  const trimmedValue = inputValue.value.trim();
  if (!trimmedValue || isLoading.value) return;

  const conversationMessages = buildConversationMessages(trimmedValue);
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
  inputValue.value = '';
  isLoading.value = true;
  isStreaming.value = true;
  await scrollToBottom();

  const aiMessageId = loadingMessage.id;
  abortController = createSSEConnection({
    url: '/api/ai/chat/stream',
    body: {
      messages: conversationMessages,
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
      let errorMessage = 'AI 对话连接失败';
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

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

const clearChat = () => {
  stopStreaming();
  messages.value = [];
};

onUnmounted(() => {
  stopStreaming();
});

onMounted(async () => {
  await nextTick();
  inputRef.value?.focus();
});
</script>

<template>
  <div class="ai-chat-container">
    <div class="chat-header">
      <div class="header-title">
        <IconifyIcon icon="lucide:sparkles" class="header-icon" />
        <span>AI 对话</span>
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
      <div v-if="messages.length === 0" class="welcome-message">
        <IconifyIcon icon="lucide:bot-message-square" class="welcome-icon" />
        <div class="welcome-title">有什么可以帮您的？</div>
        <div class="welcome-subtitle">直接向当前配置的 AI 模型发起对话</div>
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
              :icon="msg.role === 'user' ? 'lucide:user' : 'lucide:bot'"
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
            :placeholder="isLoading ? 'AI 正在思考中...' : '输入消息'"
            :disabled="isLoading"
            :rows="1"
            auto-size=""
            class="chat-input-field"
            @keydown="handleKeydown"
          />
        </div>

        <Tooltip :title="isStreaming ? '停止生成' : '发送'">
          <Button
            class="send-button"
            :class="{ disabled: !inputValue.trim() && !isStreaming }"
            :disabled="!inputValue.trim() && !isStreaming"
            html-type="button"
            @click="sendMessage"
          >
            <Spin v-if="isLoading || isStreaming" size="small" />
            <IconifyIcon
              v-else
              :icon="isStreaming ? 'lucide:square' : 'lucide:send-horizontal'"
            />
          </Button>
        </Tooltip>
      </div>

      <div class="input-disclaimer">AI 可能会产生错误信息，请核实重要内容</div>
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

.ai-chat-container {
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

:global(.dark) .ai-chat-container {
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
    font-size: 16px;
    font-weight: 600;
    color: var(--chat-foreground);
  }

  .header-icon {
    font-size: 20px;
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

.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
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
