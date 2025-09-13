use axum::extract::State;
use axum::Json;
use axum::response::sse::{Event, Sse};
use futures::stream::Stream;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use std::env;
use std::time::Duration;

use crate::AppState;

#[derive(Deserialize)]
pub struct GenerateRequest {
    pub prompt: String,
    pub model: Option<String>,
}

#[derive(Deserialize)]
pub struct ModifyCodeRequest {
    pub existing_code: String,
    pub modification_prompt: String,
    pub model: Option<String>,
}


#[derive(Serialize, Deserialize)]
pub struct AppMetadata {
    pub id: String,
    pub name: String,
    pub description: String,
    pub version: String,
    pub price: f64,
    pub icon: String,
}

#[derive(Serialize, Deserialize)]
pub struct AnthropicModel {
    pub id: String,
    pub display_name: String,
    pub created_at: String,
    #[serde(rename = "type")]
    pub model_type: String,
}

#[derive(Serialize, Deserialize)]
pub struct ModelsResponse {
    pub data: Vec<AnthropicModel>,
    pub has_more: bool,
    pub first_id: Option<String>,
    pub last_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub power: u8, // 1-5 rating for model capability
    pub cost: u8, // 1-5 rating for resource consumption (1=cheap, 5=expensive)
    pub speed: u8, // 1-5 rating for response speed (1=slow, 5=fast)
    pub special_label: Option<String>, // "flagship", "most powerful", etc.
}

#[derive(Serialize, Deserialize)]
pub struct ModelInfoResponse {
    pub data: Vec<ModelInfo>,
    pub has_more: bool,
    pub first_id: Option<String>,
    pub last_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct AnthropicResponse {
    pub content: Option<Vec<AnthropicContent>>,
}

#[derive(Serialize, Deserialize)]
pub struct AnthropicContent {
    pub text: String,
    #[serde(rename = "type")]
    pub content_type: String,
}

#[derive(Serialize, Deserialize)]
pub struct StreamingEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub message: Option<StreamingMessage>,
    pub delta: Option<StreamingDelta>,
}

#[derive(Serialize, Deserialize)]
pub struct StreamingMessage {
    pub id: Option<String>,
    #[serde(rename = "type")]
    pub message_type: Option<String>,
    pub role: Option<String>,
    pub content: Option<Vec<StreamingContent>>,
}

#[derive(Serialize, Deserialize)]
pub struct StreamingContent {
    #[serde(rename = "type")]
    pub content_type: String,
    pub text: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct StreamingDelta {
    #[serde(rename = "type")]
    pub delta_type: Option<String>,
    pub text: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct UsageInfo {
    pub input_tokens: i32,
    pub output_tokens: i32,
}

#[derive(Serialize, Deserialize)]
pub struct StreamingUsage {
    pub usage: Option<UsageInfo>,
}

#[derive(Serialize)]
pub struct AnthropicMessage {
    pub role: String,
    pub content: Vec<AnthropicMessageContent>,
}

#[derive(Serialize)]
pub struct AnthropicMessageContent {
    #[serde(rename = "type")]
    pub content_type: String,
    pub text: String,
}

// Prefill tokens to help guide the AI response format
const PREFILL_TOKENS: &str = "function";

// Model metadata with power ratings and special labels
fn get_model_metadata(model_id: &str) -> ModelInfo {
    match model_id {
        "claude-3-haiku-20240307" => ModelInfo {
            id: model_id.to_string(),
            name: "Claude 3 Haiku".to_string(),
            description: "Fast and cost-effective for simple tasks".to_string(),
            icon: "⚡".to_string(),
            power: 2,
            cost: 1,
            speed: 5,
            special_label: None,
        },
        "claude-3-5-haiku-20241022" => ModelInfo {
            id: model_id.to_string(),
            name: "Claude 3.5 Haiku".to_string(),
            description: "Enhanced speed and intelligence".to_string(),
            icon: "🚀".to_string(),
            power: 3,
            cost: 2,
            speed: 5,
            special_label: Some("latest".to_string()),
        },
        "claude-3-5-sonnet-20241022" => ModelInfo {
            id: model_id.to_string(),
            name: "Claude 3.5 Sonnet".to_string(),
            description: "Balanced performance and capability".to_string(),
            icon: "🎼".to_string(),
            power: 4,
            cost: 3,
            speed: 4,
            special_label: Some("flagship".to_string()),
        },
        "claude-sonnet-4-20250514" => ModelInfo {
            id: model_id.to_string(),
            name: "Claude Sonnet 4".to_string(),
            description: "Most advanced model with superior intelligence".to_string(),
            icon: "🧠".to_string(),
            power: 5,
            cost: 4,
            speed: 3,
            special_label: Some("most powerful".to_string()),
        },
        "claude-3-opus-20240229" => ModelInfo {
            id: model_id.to_string(),
            name: "Claude 3 Opus".to_string(),
            description: "Powerful model for complex tasks".to_string(),
            icon: "💎".to_string(),
            power: 5,
            cost: 5,
            speed: 2,
            special_label: None,
        },
        _ => ModelInfo {
            id: model_id.to_string(),
            name: format!("Model {}", model_id),
            description: "Advanced AI model".to_string(),
            icon: "🤖".to_string(),
            power: 3,
            cost: 3,
            speed: 3,
            special_label: None,
        },
    }
}

pub async fn list_models(
    State(app_state): State<AppState>,
) -> Result<Json<ModelInfoResponse>, (axum::http::StatusCode, String)> {
    let api_key = env::var("ANTHROPIC_API_KEY").map_err(|_| {
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            "ANTHROPIC_API_KEY environment variable is required".to_string(),
        )
    })?;

    let response = app_state
        .client
        .get("https://api.anthropic.com/v1/models")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch models: {}", e);
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to fetch models: {}", e),
            )
        })?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        tracing::error!("Anthropic API error: {} - {}", status, error_text);
        return Err((
            axum::http::StatusCode::BAD_GATEWAY,
            format!("Anthropic API error: {}", status),
        ));
    }

    let models_response: ModelsResponse = response.json().await.map_err(|e| {
        tracing::error!("Failed to parse models response: {}", e);
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to parse models response".to_string(),
        )
    })?;

    // Map API response to our ModelInfo format with metadata
    let mut model_infos: Vec<ModelInfo> = models_response
        .data
        .into_iter()
        .map(|model| get_model_metadata(&model.id))
        .collect();

    // Sort by power (descending) then name
    model_infos.sort_by(|a, b| {
        let power_cmp = b.power.cmp(&a.power); // Descending order (most powerful first)
        if power_cmp == std::cmp::Ordering::Equal {
            a.name.cmp(&b.name)
        } else {
            power_cmp
        }
    });

    let response = ModelInfoResponse {
        data: model_infos,
        has_more: models_response.has_more,
        first_id: models_response.first_id,
        last_id: models_response.last_id,
    };

    Ok(Json(response))
}

// Helper function to get model recommendations
pub fn get_model_recommendations(models: &[ModelInfo]) -> serde_json::Value {
    let most_cost_effective = models.iter().min_by_key(|m| m.cost);
    let most_powerful = models.iter().max_by_key(|m| m.power);

    serde_json::json!({
        "mostCostEffective": most_cost_effective,
        "mostPowerful": most_powerful
    })
}


// Helper function to generate code synchronously (non-streaming)
pub async fn generate_code_sync(
    app_state: &AppState,
    prompt: &str,
    model: Option<&str>,
) -> Result<String, String> {
    let api_key = env::var("ANTHROPIC_API_KEY").map_err(|_| {
        "ANTHROPIC_API_KEY environment variable is required".to_string()
    })?;

    let system_message = crate::utils::get_app_renderer_prompt();

    let messages = vec![
        AnthropicMessage {
            role: "user".to_string(),
            content: vec![AnthropicMessageContent {
                content_type: "text".to_string(),
                text: prompt.to_string(),
            }],
        },
        AnthropicMessage {
            role: "assistant".to_string(),
            content: vec![AnthropicMessageContent {
                content_type: "text".to_string(),
                text: PREFILL_TOKENS.to_string(),
            }],
        },
    ];

    let model = model.unwrap_or("claude-3-haiku-20240307");

    let body = serde_json::json!({
        "model": model,
        "max_tokens": 4096,
        "temperature": 1.0,
        "system": system_message,
        "messages": messages,
        "stream": false,
    });

    let response = app_state
        .client
        .post("https://api.anthropic.com/v1/messages")
        .header("Content-Type", "application/json")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request to Anthropic API failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Anthropic API error: {} - {}", status, error_text));
    }

    let anthropic_response: AnthropicResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Anthropic response: {}", e))?;

    let content = anthropic_response
        .content
        .as_ref()
        .and_then(|c| c.first())
        .ok_or_else(|| "No content in response".to_string())?;

    // Prepend the prefill tokens to fix the missing character issue
    let full_content = format!("{}{}", PREFILL_TOKENS, content.text);

    Ok(full_content)
}

pub async fn generate_code_stream(
    State(app_state): State<AppState>,
    Json(payload): Json<GenerateRequest>,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, (axum::http::StatusCode, String)> {
    // Validate API key before starting the stream
    let api_key = env::var("ANTHROPIC_API_KEY").map_err(|_| {
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            "ANTHROPIC_API_KEY environment variable is required".to_string(),
        )
    })?;

    let api_key_clone = api_key.clone();
    let stream = async_stream::stream! {
        // Send initial status
        yield Ok(Event::default().data("Starting generation..."));
        tokio::time::sleep(Duration::from_millis(100)).await;

        yield Ok(Event::default().data("Preparing request to Anthropic API..."));
        tokio::time::sleep(Duration::from_millis(100)).await;

        let system_message = crate::utils::get_app_renderer_prompt();

        let messages = vec![
            AnthropicMessage {
                role: "user".to_string(),
                content: vec![AnthropicMessageContent {
                    content_type: "text".to_string(),
                    text: payload.prompt.clone(),
                }],
            },
            AnthropicMessage {
                role: "assistant".to_string(),
                content: vec![AnthropicMessageContent {
                    content_type: "text".to_string(),
                    text: PREFILL_TOKENS.to_string(),
                }],
            },
        ];

        let model = payload.model.as_deref().unwrap_or("claude-3-haiku-20240307");

        let body = serde_json::json!({
            "model": model,
            "max_tokens": 4096,
            "temperature": 1.0,
            "system": system_message,
            "messages": messages,
            "stream": true,
        });

        yield Ok(Event::default().data("Sending request to Anthropic API..."));

        let response = match app_state.client
            .post("https://api.anthropic.com/v1/messages")
            .header("Content-Type", "application/json")
            .header("x-api-key", api_key_clone)
            .header("anthropic-version", "2023-06-01")
            .json(&body)
            .send()
            .await
        {
            Ok(response) => response,
            Err(e) => {
                tracing::error!("Request to Anthropic API failed: {}", e);
                yield Ok(Event::default().data(format!("Error: Request failed - {}", e)));
                return;
            }
        };

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            tracing::error!("Anthropic API error: {} - {}", status, error_text);
            yield Ok(Event::default().data(format!("Error: API error - {}", status)));
            return;
        }

        yield Ok(Event::default().data("Streaming response from Anthropic API..."));

        use futures::StreamExt;
        let mut stream = response.bytes_stream();
        let mut buffer = String::new();
        let mut first_token = true;
        let mut usage_info: Option<UsageInfo> = None;

        while let Some(chunk_result) = stream.next().await {
            let bytes = match chunk_result {
                Ok(bytes) => bytes,
                Err(e) => {
                    tracing::error!("Error reading stream chunk: {}", e);
                    yield Ok(Event::default().data(format!("Error: Stream error - {}", e)));
                    return;
                }
            };

            let chunk_str = match std::str::from_utf8(&bytes) {
                Ok(s) => s,
                Err(e) => {
                    tracing::error!("Invalid UTF-8 in chunk: {}", e);
                    continue;
                }
            };

            buffer.push_str(chunk_str);

            // Process complete lines from the buffer
            while let Some(newline_pos) = buffer.find('\n') {
                let line = buffer[..newline_pos].trim().to_string();
                buffer = buffer[newline_pos + 1..].to_string();

                if line.is_empty() {
                    continue;
                }

                if line.starts_with("data: ") {
                    let data_part = &line[6..]; // Remove "data: " prefix

                    if data_part == "[DONE]" {
                        yield Ok(Event::default().data("Generation complete!"));
                        return;
                    }

                    // Try to parse the JSON
                    match serde_json::from_str::<StreamingEvent>(data_part) {
                        Ok(event) => {
                            match event.event_type.as_str() {
                                "message_start" => {
                                    yield Ok(Event::default().data("Starting message generation..."));
                                }
                                "content_block_delta" => {
                                    if let Some(delta) = event.delta {
                                        if let Some(mut text) = delta.text {
                                            // Prepend the prefill tokens to the first token to fix the missing character issue
                                            if first_token {
                                                text = format!("{}{}", PREFILL_TOKENS, text);
                                                first_token = false;
                                            }

                                            // Send the token as it arrives
                                            let token_event = serde_json::json!({
                                                "type": "token",
                                                "text": text
                                            });
                                            yield Ok(Event::default().event("token").data(serde_json::to_string(&token_event).unwrap_or_default()));
                                        }
                                    }
                                }
                                "message_delta" => {
                                    // Try to extract usage information from message_delta events
                                    if let Ok(usage_event) = serde_json::from_str::<StreamingUsage>(data_part) {
                                        if let Some(usage) = usage_event.usage {
                                            usage_info = Some(usage);
                                        }
                                    }
                                }
                                "message_stop" => {
                                    // Send usage information before completing
                                    if let Some(usage) = &usage_info {
                                        let usage_event = serde_json::json!({
                                            "type": "usage",
                                            "input_tokens": usage.input_tokens,
                                            "output_tokens": usage.output_tokens
                                        });
                                        yield Ok(Event::default().event("usage").data(serde_json::to_string(&usage_event).unwrap_or_default()));
                                    }
                                    yield Ok(Event::default().data("Generation complete!"));
                                    return;
                                }
                                _ => {
                                    // Try to parse any event for usage information
                                    if let Ok(usage_event) = serde_json::from_str::<StreamingUsage>(data_part) {
                                        if let Some(usage) = usage_event.usage {
                                            usage_info = Some(usage);
                                        }
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            tracing::debug!("Could not parse streaming event: {} (data: {})", e, data_part);
                            // Don't yield an error for parsing failures, just continue
                        }
                    }
                }
            }
        }

        yield Ok(Event::default().data("Stream ended"));
    };

    Ok(Sse::new(stream).keep_alive(
        axum::response::sse::KeepAlive::new()
            .interval(Duration::from_secs(1))
            .text("keep-alive-text"),
    ))
}

pub async fn modify_code_stream(
    State(app_state): State<AppState>,
    Json(payload): Json<ModifyCodeRequest>,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, (axum::http::StatusCode, String)> {
    // Validate API key before starting the stream
    let api_key = env::var("ANTHROPIC_API_KEY").map_err(|_| {
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            "ANTHROPIC_API_KEY environment variable is required".to_string(),
        )
    })?;

    let api_key_clone = api_key.clone();
    let stream = async_stream::stream! {
        // Send initial status
        yield Ok(Event::default().data("Starting code modification..."));
        tokio::time::sleep(Duration::from_millis(100)).await;

        yield Ok(Event::default().data("Preparing request to Anthropic API..."));
        tokio::time::sleep(Duration::from_millis(100)).await;

        let system_message = crate::utils::get_code_modifier_prompt();

        // Create a comprehensive prompt that includes both the existing code and modification request
        let combined_prompt = format!(
            "Here is the existing React component code that needs to be modified:\n\n```javascript\n{}\n```\n\nModification request: {}\n\nPlease output the complete modified component code.",
            payload.existing_code,
            payload.modification_prompt
        );

        let messages = vec![
            AnthropicMessage {
                role: "user".to_string(),
                content: vec![AnthropicMessageContent {
                    content_type: "text".to_string(),
                    text: combined_prompt,
                }],
            },
            AnthropicMessage {
                role: "assistant".to_string(),
                content: vec![AnthropicMessageContent {
                    content_type: "text".to_string(),
                    text: PREFILL_TOKENS.to_string(),
                }],
            },
        ];

        let model = payload.model.as_deref().unwrap_or("claude-3-haiku-20240307");

        let body = serde_json::json!({
            "model": model,
            "max_tokens": 4096,
            "temperature": 1.0,
            "system": system_message,
            "messages": messages,
            "stream": true,
        });

        yield Ok(Event::default().data("Sending request to Anthropic API..."));

        let response = match app_state.client
            .post("https://api.anthropic.com/v1/messages")
            .header("Content-Type", "application/json")
            .header("x-api-key", api_key_clone)
            .header("anthropic-version", "2023-06-01")
            .json(&body)
            .send()
            .await
        {
            Ok(response) => response,
            Err(e) => {
                tracing::error!("Request to Anthropic API failed: {}", e);
                yield Ok(Event::default().data(format!("Error: Request failed - {}", e)));
                return;
            }
        };

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            tracing::error!("Anthropic API error: {} - {}", status, error_text);
            yield Ok(Event::default().data(format!("Error: API error - {}", status)));
            return;
        }

        yield Ok(Event::default().data("Streaming response from Anthropic API..."));

        use futures::StreamExt;
        let mut stream = response.bytes_stream();
        let mut buffer = String::new();
        let mut first_token = true;
        let mut usage_info: Option<UsageInfo> = None;

        while let Some(chunk_result) = stream.next().await {
            let bytes = match chunk_result {
                Ok(bytes) => bytes,
                Err(e) => {
                    tracing::error!("Error reading stream chunk: {}", e);
                    yield Ok(Event::default().data(format!("Error: Stream error - {}", e)));
                    return;
                }
            };

            let chunk_str = match std::str::from_utf8(&bytes) {
                Ok(s) => s,
                Err(e) => {
                    tracing::error!("Invalid UTF-8 in chunk: {}", e);
                    continue;
                }
            };

            buffer.push_str(chunk_str);

            // Process complete lines from the buffer
            while let Some(newline_pos) = buffer.find('\n') {
                let line = buffer[..newline_pos].trim().to_string();
                buffer = buffer[newline_pos + 1..].to_string();

                if line.is_empty() {
                    continue;
                }

                if line.starts_with("data: ") {
                    let data_part = &line[6..]; // Remove "data: " prefix

                    if data_part == "[DONE]" {
                        yield Ok(Event::default().data("Code modification complete!"));
                        return;
                    }

                    // Try to parse the JSON
                    match serde_json::from_str::<StreamingEvent>(data_part) {
                        Ok(event) => {
                            match event.event_type.as_str() {
                                "message_start" => {
                                    yield Ok(Event::default().data("Starting code modification..."));
                                }
                                "content_block_delta" => {
                                    if let Some(delta) = event.delta {
                                        if let Some(mut text) = delta.text {
                                            // Prepend the prefill tokens to the first token to fix the missing character issue
                                            if first_token {
                                                text = format!("{}{}", PREFILL_TOKENS, text);
                                                first_token = false;
                                            }

                                            // Send the token as it arrives
                                            let token_event = serde_json::json!({
                                                "type": "token",
                                                "text": text
                                            });
                                            yield Ok(Event::default().event("token").data(serde_json::to_string(&token_event).unwrap_or_default()));
                                        }
                                    }
                                }
                                "message_delta" => {
                                    // Try to extract usage information from message_delta events
                                    if let Ok(usage_event) = serde_json::from_str::<StreamingUsage>(data_part) {
                                        if let Some(usage) = usage_event.usage {
                                            usage_info = Some(usage);
                                        }
                                    }
                                }
                                "message_stop" => {
                                    // Send usage information before completing
                                    if let Some(usage) = &usage_info {
                                        let usage_event = serde_json::json!({
                                            "type": "usage",
                                            "input_tokens": usage.input_tokens,
                                            "output_tokens": usage.output_tokens
                                        });
                                        yield Ok(Event::default().event("usage").data(serde_json::to_string(&usage_event).unwrap_or_default()));
                                    }
                                    yield Ok(Event::default().data("Code modification complete!"));
                                    return;
                                }
                                _ => {
                                    // Try to parse any event for usage information
                                    if let Ok(usage_event) = serde_json::from_str::<StreamingUsage>(data_part) {
                                        if let Some(usage) = usage_event.usage {
                                            usage_info = Some(usage);
                                        }
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            tracing::debug!("Could not parse streaming event: {} (data: {})", e, data_part);
                            // Don't yield an error for parsing failures, just continue
                        }
                    }
                }
            }
        }

        yield Ok(Event::default().data("Stream ended"));
    };

    Ok(Sse::new(stream).keep_alive(
        axum::response::sse::KeepAlive::new()
            .interval(Duration::from_secs(1))
            .text("keep-alive-text"),
    ))
}