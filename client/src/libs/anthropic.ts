import CONFIG from "@/config";

export interface AnthropicResponse {
  text: string;
}

export interface StreamEvent {
  type: "status" | "result" | "error" | "token" | "text";
  data?: string;
  text?: string;
}

export async function generateAppCodeStream(
  prompt: string,
  onStatus: (status: string) => void,
  onToken?: (token: string) => void
): Promise<string> {
  const response = await fetch(
    `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.GENERATE_STREAM}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${errorText} (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body available");
  }

  const decoder = new TextDecoder();
  let result = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("data: ")) {
          const data = trimmedLine.substring(6);
          
          if (data === '[DONE]') {
            break;
          }

          try {
            const eventData = JSON.parse(data);
            const event: StreamEvent = eventData;

            if (event.type === "status") {
              onStatus(event.data || "");
            } else if (event.type === "result") {
              result = event.data || "";
            } else if (event.type === "error") {
              throw new Error(event.data || "Unknown error");
            } else if (event.type === "token" && event.text && onToken) {
              onToken(event.text);
              result += event.text;
            } else if (event.type === "text" && event.text) {
              result = event.text;
            }
          } catch {
            // Handle non-JSON data as status messages
            if (data && !data.includes('{')) {
              onStatus(data);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return result;
}
