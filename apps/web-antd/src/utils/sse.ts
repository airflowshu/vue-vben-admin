/**
 * SSE 工具函数
 * 支持在请求头中携带自定义认证信息（如 aiApiKey）
 */

/**
 * 解析 SSE 事件数据
 */
function parseSSEEvent(data: string): { event: string; data: string } | null {
  const lines = data.split('\n');
  let event = '';
  let eventData = '';

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      eventData = line.slice(5).trim();
    }
  }

  if (!eventData) return null;
  return { event, data: eventData };
}

/**
 * SSE 连接配置
 */
interface SSEConfig {
  url: string;
  headers?: Record<string, string>;
  onOpen?: () => void;
  onMessage: (data: string, event: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

/**
 * 创建 SSE 连接（使用 fetch 实现，支持自定义请求头）
 * @param config SSE 配置
 * @returns AbortController 用于取消连接
 */
export function createSSEConnection(config: SSEConfig): AbortController {
  const { url, headers = {}, onOpen, onMessage, onError, onComplete } = config;

  const abortController = new AbortController();

  const runSSE = async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          ...headers,
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      onOpen?.();

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // 按行分割处理
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const event = parseSSEEvent(line);
          if (event) {
            onMessage(event.data, event.event);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError?.(error);
      }
    }
  };

  runSSE();

  return abortController;
}

/**
 * 简化版 SSE 连接（使用 EventSource，不支持自定义请求头）
 * @param url SSE URL
 * @param onMessage 消息处理函数
 * @returns EventSource 实例
 * @deprecated 使用 createSSEConnection 以支持自定义请求头
 */
export function createSimpleSSE(
  url: string,
  onMessage: (data: string) => void,
): EventSource {
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    if (event.data) {
      onMessage(event.data);
    }
  };

  return eventSource;
}
