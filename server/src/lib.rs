use axum::http::Method;
use axum::{routing::get, Router};
use reqwest::Client;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

pub mod ai;
pub mod database;
pub mod handlers;
pub mod models;
pub mod routes;
pub mod seed;
pub mod utils;

#[derive(Clone)]
pub struct AppState {
    pub client: Client,
    pub database: Arc<database::Database>,
}

pub async fn index() -> axum::response::Html<&'static str> {
    axum::response::Html(utils::get_chat_interface_template())
}

pub async fn db_viewer() -> axum::response::Html<&'static str> {
    axum::response::Html(utils::get_db_viewer_template())
}

pub fn create_router(database: Arc<database::Database>) -> Router {
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
        .route("/models", get(ai::list_models))
        .route("/generate/metadata", axum::routing::post(ai::generate_metadata))
        .route("/generate/stream", axum::routing::post(ai::generate_code_stream))
        .merge(routes::create_api_router())
        .layer(cors)
        .with_state(AppState {
            client: Client::new(),
            database,
        })
}