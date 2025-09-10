use axum::extract::State;
use axum::http::Method;
use axum::{
    response::sse::{Event, Sse},
    routing::{get, post},
    Json, Router,
};
use futures::stream::Stream;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use std::env;
use std::sync::Arc;
use std::time::Duration;
use tower_http::cors::{Any, CorsLayer};

pub mod api;
pub mod db;

#[derive(Clone)]
pub struct AppState {
    pub client: Client,
    pub database: Arc<db::Database>,
}

#[derive(Deserialize)]
pub struct GenerateRequest {
    pub prompt: String,
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

pub mod templates {
    pub fn chat_interface() -> &'static str {
        include_str!("../templates/chat.html")
    }

    pub fn db_viewer() -> &'static str {
        include_str!("../templates/db_viewer.html")
    }
}

pub mod prompts {
    pub fn app_renderer() -> &'static str {
        include_str!("../prompts/app-renderer.txt")
    }
}

// Prefill tokens to help guide the AI response format
const PREFILL_TOKENS: &str = "function";

pub async fn index() -> axum::response::Html<&'static str> {
    axum::response::Html(templates::chat_interface())
}

pub async fn db_viewer() -> axum::response::Html<&'static str> {
    axum::response::Html(templates::db_viewer())
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

        let system_message = prompts::app_renderer();

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

        let body = serde_json::json!({
            "model": "claude-3-haiku-20240307",
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
                                "message_stop" => {
                                    yield Ok(Event::default().data("Generation complete!"));
                                    return;
                                }
                                _ => {
                                    // Ignore other event types for now
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

pub fn create_router(database: Arc<db::Database>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers(Any);

    Router::new()
        .route("/", get(index))
        .route("/db", get(db_viewer))
        .route("/generate/stream", post(generate_code_stream))
        // Database API routes
        .route("/api/db", get(api::list_collections))
        .route("/api/db/query", post(api::execute_query))
        .route("/api/db/reset", post(api::reset_database))
        .route(
            "/api/db/:collection",
            get(api::list_documents).post(api::create_document),
        )
        .route(
            "/api/db/:collection/:id",
            get(api::get_document)
                .put(api::update_document)
                .delete(api::delete_document),
        )
        .layer(cors)
        .with_state(AppState {
            client: Client::new(),
            database,
        })
}
