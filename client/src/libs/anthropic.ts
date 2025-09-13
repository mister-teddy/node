import CONFIG from "@/config";
import type { AppMetadata } from "@/types/app-project";
import type { ModelInfo, ModelInfoResponse } from "./models";

export interface AnthropicResponse {
  text: string;
}

export interface StreamEvent {
  type: "status" | "result" | "error" | "token" | "text" | "usage";
  data?: string;
  text?: string;
  input_tokens?: number;
  output_tokens?: number;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface GenerateAppWithMetadataResponse {
  sourceCode: string;
  metadata: AppMetadata;
}

export async function generateAppCodeStream(
  prompt: string,
  onStatus: (status: string) => void,
  onToken?: (token: string) => void,
  model?: string,
  onUsage?: (usage: TokenUsage) => void,
): Promise<string> {
  const response = await fetch(
    `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.GENERATE_STREAM}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, model }),
    },
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
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("data: ")) {
          const data = trimmedLine.substring(6);

          if (data === "[DONE]") {
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
            } else if (
              event.type === "usage" &&
              onUsage &&
              event.input_tokens &&
              event.output_tokens
            ) {
              const usage: TokenUsage = {
                input_tokens: event.input_tokens,
                output_tokens: event.output_tokens,
                total_tokens: event.input_tokens + event.output_tokens,
              };
              onUsage(usage);
            }
          } catch {
            // Handle non-JSON data as status messages
            if (data && !data.includes("{")) {
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

export async function generateAppWithMetadata(
  prompt: string,
  model?: string,
  onUsage?: (usage: TokenUsage) => void,
): Promise<GenerateAppWithMetadataResponse> {
  const response = await fetch(
    `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.GENERATE_STREAM}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `${prompt}

IMPORTANT: After generating the code, provide the app metadata in this exact JSON format:
---METADATA---
{
  "name": "App Name Here",
  "description": "Brief description of what the app does",
  "icon": "📱",
  "price": 0,
  "version": "1.0.0"
}
---END-METADATA---`,
        model,
      }),
    },
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
  let fullResponse = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("data: ")) {
          const data = trimmedLine.substring(6);

          if (data === "[DONE]") {
            break;
          }

          try {
            const eventData = JSON.parse(data);
            const event: StreamEvent = eventData;

            if (event.type === "result") {
              fullResponse = event.data || "";
            } else if (event.type === "error") {
              throw new Error(event.data || "Unknown error");
            } else if (event.type === "token" && event.text) {
              fullResponse += event.text;
            } else if (event.type === "text" && event.text) {
              fullResponse = event.text;
            } else if (
              event.type === "usage" &&
              onUsage &&
              event.input_tokens &&
              event.output_tokens
            ) {
              const usage: TokenUsage = {
                input_tokens: event.input_tokens,
                output_tokens: event.output_tokens,
                total_tokens: event.input_tokens + event.output_tokens,
              };
              onUsage(usage);
            }
          } catch {
            // Handle non-JSON data, continue processing
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Parse the response to extract code and metadata
  const metadataMatch = fullResponse.match(
    /---METADATA---([\s\S]*?)---END-METADATA---/,
  );
  let metadata: AppMetadata = {
    name: "Generated App",
    description: "AI-generated application",
    icon: "🪄",
    price: 0,
    version: "1.0.0",
  };

  if (metadataMatch) {
    try {
      const metadataJson = metadataMatch[1].trim();
      const parsedMetadata = JSON.parse(metadataJson);
      metadata = { ...metadata, ...parsedMetadata };
    } catch (error) {
      console.warn("Failed to parse metadata, using defaults:", error);
    }
  }

  // Remove metadata section from source code
  const sourceCode = fullResponse
    .replace(/---METADATA---[\s\S]*?---END-METADATA---/g, "")
    .trim();

  return {
    sourceCode,
    metadata,
  };
}

// Fallback models in case the server is not available
const FALLBACK_MODELS: ModelInfo[] = [
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    description: "Fast and cost-effective for simple tasks",
    icon: "⚡",
    power: 2,
    cost: 1,
    speed: 5,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    description: "Enhanced speed and intelligence",
    icon: "🚀",
    power: 3,
    cost: 2,
    speed: 5,
    special_label: "latest",
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    description: "Balanced performance and capability",
    icon: "🎼",
    power: 4,
    cost: 3,
    speed: 4,
    special_label: "flagship",
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    description: "Most advanced model with superior intelligence",
    icon: "🧠",
    power: 5,
    cost: 4,
    speed: 3,
    special_label: "most powerful",
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    description: "Powerful model for complex tasks",
    icon: "💎",
    power: 5,
    cost: 5,
    speed: 2,
  },
];

export async function fetchAvailableModels(): Promise<ModelInfo[]> {
  try {
    const response = await fetch(`${CONFIG.API.BASE_URL}/api/models`);

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const modelsResponse: ModelInfoResponse = await response.json();

    return modelsResponse.data;
  } catch (error) {
    console.error("Failed to fetch models from API, using fallback:", error);

    // Return fallback models when server is not available
    return FALLBACK_MODELS;
  }
}

export async function modifyAppCodeStream(
  currentCode: string,
  modificationPrompt: string,
  onStatus: (status: string) => void,
  onToken?: (token: string) => void,
  model?: string,
  onUsage?: (usage: TokenUsage) => void,
): Promise<string> {
  const fullPrompt = `Here is the current code:

\`\`\`javascript
${currentCode}
\`\`\`

Please modify this code according to the following request: ${modificationPrompt}

Return only the complete modified code, maintaining the same structure and format. Make sure the code is fully functional and follows the same patterns as the original.`;

  return generateAppCodeStream(fullPrompt, onStatus, onToken, model, onUsage);
}


export async function createProject(projectData: {
  prompt: string;
  model?: string;
}): Promise<any> {
  const response = await fetch(`${CONFIG.API.BASE_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create project: ${errorText} (${response.status})`);
  }

  return response.json();
}

export async function updateProjectVersion(projectId: string, sourceCode: string, prompt: string, model?: string): Promise<any> {
  const response = await fetch(`${CONFIG.API.BASE_URL}/api/projects/${projectId}/versions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      source_code: sourceCode,
      prompt: prompt,
      model: model 
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create project version: ${errorText} (${response.status})`);
  }

  return response.json();
}

export function getModelRecommendations(models: ModelInfo[]) {
  const mostCostEffective = models.reduce((min, model) => 
    !min || model.cost < min.cost ? model : min, models[0] || null
  );
  
  const mostPowerful = models.reduce((max, model) => 
    !max || model.power > max.power ? model : max, models[0] || null
  );

  return {
    mostCostEffective,
    mostPowerful,
  };
}
