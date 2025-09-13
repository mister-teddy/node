use axum::http::{Method, StatusCode};
use axum::{response::Redirect, routing::get, Router};
use reqwest::Client;
use std::{env, sync::Arc};
use tower_http::cors::{Any, CorsLayer};

pub mod ai;
pub mod database;
pub mod handlers;
pub mod models;
pub mod seed;
pub mod utils;

#[derive(Clone)]
pub struct AppState {
    pub client: Client,
    pub database: Arc<database::Database>,
}

pub async fn redirect_to_frontend() -> Result<Redirect, StatusCode> {
    let frontend_url = env::var("FRONTEND_URL")
        .unwrap_or_else(|_| "https://node-alpha-lovat.vercel.app/".to_string());
    Ok(Redirect::permanent(&frontend_url))
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
        .route("/", get(redirect_to_frontend))
        .route("/generate", axum::routing::post(ai::generate_code_stream))
        .nest("/api", create_api_router())
        .layer(cors)
        .with_state(AppState {
            client: Client::new(),
            database,
        })
}

fn create_api_router() -> Router<AppState> {
    Router::new()
        // AI endpoints
        .route("/models", get(ai::list_models))
        // Database endpoints
        .route("/db", get(handlers::list_collections))
        .route("/db/:collection", axum::routing::post(handlers::create_document))
        .route("/db/:collection", get(handlers::list_documents))
        .route("/db/:collection/:id", get(handlers::get_document))
        .route("/db/:collection/:id", axum::routing::put(handlers::update_document))
        .route("/db/:collection/:id", axum::routing::delete(handlers::delete_document))
        .route("/db/reset", axum::routing::post(handlers::reset_database))
        .route("/query", axum::routing::post(handlers::execute_query))
        .route("/reset", axum::routing::post(handlers::reset_database))
        // Project endpoints
        .route("/projects", axum::routing::post(handlers::create_project))
        .route("/projects", get(handlers::list_projects))
        .route("/projects/:project_id", get(handlers::get_project))
        .route("/projects/:project_id", axum::routing::put(handlers::update_project))
        .route("/projects/:project_id", axum::routing::delete(handlers::delete_project))
        .route("/projects/:project_id/versions", axum::routing::post(handlers::create_version))
        .route("/projects/:project_id/versions", get(handlers::list_versions))
        .route("/projects/:project_id/release", axum::routing::post(handlers::release_version))
        .route("/projects/:project_id/convert", axum::routing::post(handlers::convert_to_app))
        // App endpoints
        .route("/apps", axum::routing::post(handlers::create_app))
        .route("/apps/:app_id/source", axum::routing::put(handlers::update_app_source_code))
}
