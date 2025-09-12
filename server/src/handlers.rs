use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    Json as JsonBody,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::models::{CreateDocumentRequest, ListQuery, QueryRequest, UpdateDocumentRequest};
use crate::AppState;

#[derive(Deserialize)]
pub struct CreateAppRequest {
    pub prompt: String,
    pub model: String,
    pub name: String,
    pub description: String,
    pub version: String,
    pub price: f64,
    pub icon: String,
    pub source_code: Option<String>,
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

pub async fn execute_query(
    State(app_state): State<AppState>,
    JsonBody(req): JsonBody<QueryRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    match app_state.database.execute_raw_query(&req.query).await {
        Ok(result) => Ok(Json(serde_json::json!({
            "data": result,
            "message": "Query executed successfully"
        }))),
        Err(e) => {
            tracing::error!("Failed to execute query: {}", e);
            Err(StatusCode::BAD_REQUEST)
        }
    }
}

pub async fn reset_database(
    State(app_state): State<AppState>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    match app_state.database.reset_database().await {
        Ok(()) => {
            tracing::info!("Database reset successfully");
            Ok(Json(serde_json::json!({
                "message": "Database reset successfully. All data has been cleared."
            })))
        }
        Err(e) => {
            tracing::error!("Failed to reset database: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn create_app(
    State(app_state): State<AppState>,
    JsonBody(req): JsonBody<CreateAppRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let app_id = Uuid::new_v4().to_string();
    
    let app_data = serde_json::json!({
        "id": app_id,
        "name": req.name,
        "description": req.description,
        "version": req.version,
        "price": req.price,
        "icon": req.icon,
        "installed": 1,
        "source_code": req.source_code,
        "prompt": req.prompt,
        "model": req.model,
        "created_at": chrono::Utc::now().to_rfc3339()
    });

    match app_state.database.create_document("apps", app_data).await {
        Ok(document) => Ok(Json(serde_json::json!({
            "data": document,
            "links": {
                "self": format!("/api/apps/{}", document.id)
            }
        }))),
        Err(e) => {
            tracing::error!("Failed to create app: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn update_app_source_code(
    State(app_state): State<AppState>,
    Path(app_id): Path<String>,
    JsonBody(req): JsonBody<serde_json::Value>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // First get the existing app
    let apps_result = app_state.database.list_documents("apps", Some(1000), Some(0)).await;
    let apps = match apps_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list apps: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Find the app by its data.id field
    let app_document = apps.documents
        .into_iter()
        .find(|doc| {
            doc.data.get("id").and_then(|v| v.as_str()) == Some(&app_id)
        });

    let mut app_document = match app_document {
        Some(doc) => doc,
        None => return Err(StatusCode::NOT_FOUND),
    };

    // Update the source_code field
    if let Some(source_code) = req.get("source_code") {
        if let Some(data_obj) = app_document.data.as_object_mut() {
            data_obj.insert("source_code".to_string(), source_code.clone());
        }
    }

    match app_state.database.update_document("apps", &app_document.id, app_document.data).await {
        Ok(Some(updated_document)) => Ok(Json(serde_json::json!({
            "data": updated_document,
            "links": {
                "self": format!("/api/apps/{}", app_id)
            }
        }))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to update app: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}