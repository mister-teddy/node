// Type definitions for anthropic_wasm WASM module
// Generated for use with Vercel Functions

export interface GenerateRequest {
  prompt: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system?: string;
}

export interface TodoGenerateRequest {
  prompt: string;
}

export interface AnthropicContent {
  text: string;
}

export interface ErrorResponse {
  error: string;
}

// WASM module exports
export interface WasmExports {
  /**
   * Generate code using Anthropic API with configurable parameters
   * @param request_json JSON string containing GenerateRequest
   * @param api_key Anthropic API key
   * @returns Promise resolving to AnthropicContent or ErrorResponse
   */
  generate_code(request_json: string, api_key: string): Promise<AnthropicContent | ErrorResponse>;

  /**
   * Generate todo app using Anthropic API with React specialist prompt
   * @param request_json JSON string containing TodoGenerateRequest  
   * @param api_key Anthropic API key
   * @returns Promise resolving to AnthropicContent or ErrorResponse
   */
  generate_todo_app(request_json: string, api_key: string): Promise<AnthropicContent | ErrorResponse>;

  // Standard WASM exports
  memory: WebAssembly.Memory;
}

// Module declaration for WASM file import with ?module suffix
declare module '*.wasm?module' {
  const wasmModule: WebAssembly.Module;
  export default wasmModule;
}

// Global type augmentation for better TypeScript support
declare global {
  namespace WebAssembly {
    interface Exports extends WasmExports {}
  }
}