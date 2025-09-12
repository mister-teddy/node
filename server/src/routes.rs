use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers;
use crate::AppState;

pub fn create_api_router() -> Router<AppState> {
    Router::new()
        .route("/api/db", get(handlers::list_collections))
        .route("/api/db/:collection", post(handlers::create_document))
        .route("/api/db/:collection", get(handlers::list_documents))
        .route("/api/db/:collection/:id", get(handlers::get_document))
        .route("/api/db/:collection/:id", put(handlers::update_document))
        .route("/api/db/:collection/:id", delete(handlers::delete_document))
        .route("/api/query", post(handlers::execute_query))
        .route("/api/reset", post(handlers::reset_database))
        .route("/api/apps", post(handlers::create_app))
        .route("/api/apps/:app_id/source", put(handlers::update_app_source_code))
}