function parseSSEEvent(data: string): null | { data: string; event: string } {
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

interface SSEConfig {
  body?: Record<string, any>;
  headers?: Record<string, string>;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onMessage: (data: string, event: string) => void;
  onOpen?: () => void;
  url: string;
}

export function createSSEConnection(config: SSEConfig): AbortController {
  const {
    url,
    body,
    headers = {},
    onOpen,
    onMessage,
    onError,
    onComplete,
  } = config;

  const abortController = new AbortController();

  const runSSE = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: abortController.signal,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorText = '';
        try {
          errorText = await response.text();
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
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
