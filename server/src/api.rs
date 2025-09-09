use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    Json as JsonBody,
};
use serde::Deserialize;

use crate::db::{CreateDocumentRequest, UpdateDocumentRequest};
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn create_document(
    State(app_state): State<AppState>,
    Path(collection): Path<String>,
    JsonBody(req): JsonBody<CreateDocumentRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    match app_state
        .database
        .create_document(&collection, req.data)
        .await
    {
        Ok(document) => Ok(Json(serde_json::json!({
            "data": document,
            "links": {
                "self": format!("/api/db/{}/{}", collection, document.id)
            }
        }))),
        Err(e) => {
            tracing::error!("Failed to create document: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_document(
    State(app_state): State<AppState>,
    Path((collection, id)): Path<(String, String)>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    match app_state.database.get_document(&collection, &id).await {
        Ok(Some(document)) => Ok(Json(serde_json::json!({
            "data": document,
            "links": {
                "self": format!("/api/db/{}/{}", collection, id),
                "collection": format!("/api/db/{}", collection)
            }
        }))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get document: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn update_document(
    State(app_state): State<AppState>,
    Path((collection, id)): Path<(String, String)>,
    JsonBody(req): JsonBody<UpdateDocumentRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    match app_state
        .database
        .update_document(&collection, &id, req.data)
        .await
    {
        Ok(Some(document)) => Ok(Json(serde_json::json!({
            "data": document,
            "links": {
                "self": format!("/api/db/{}/{}", collection, id),
                "collection": format!("/api/db/{}", collection)
            }
        }))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to update document: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn delete_document(
    State(app_state): State<AppState>,
    Path((collection, id)): Path<(String, String)>,
) -> Result<StatusCode, StatusCode> {
    match app_state.database.delete_document(&collection, &id).await {
        Ok(true) => Ok(StatusCode::NO_CONTENT),
        Ok(false) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to delete document: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn list_documents(
    State(app_state): State<AppState>,
    Path(collection): Path<String>,
    Query(query): Query<ListQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    match app_state
        .database
        .list_documents(&collection, query.limit, query.offset)
        .await
    {
        Ok(result) => Ok(Json(serde_json::json!({
            "data": result.documents,
            "meta": {
                "count": result.count,
                "limit": query.limit.unwrap_or(100),
                "offset": query.offset.unwrap_or(0)
            },
            "links": {
                "self": format!("/api/db/{}", collection),
                "collections": "/api/db"
            }
        }))),
        Err(e) => {
            tracing::error!("Failed to list documents: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn list_collections(
    State(app_state): State<AppState>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    match app_state.database.list_collections().await {
        Ok(collections) => Ok(Json(serde_json::json!({
            "data": collections,
            "links": {
                "self": "/api/db"
            }
        }))),
        Err(e) => {
            tracing::error!("Failed to list collections: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
