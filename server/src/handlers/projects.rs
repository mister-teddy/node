use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    Json as JsonBody,
};
use serde::Deserialize;
use std::env;
use uuid::Uuid;

use crate::ai::{AnthropicMessage, AnthropicMessageContent, AnthropicResponse, AppMetadata};
use crate::models::ListQuery;
use crate::AppState;

#[derive(Deserialize)]
pub struct CreateProjectRequest {
    pub prompt: String,
    pub model: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateVersionRequest {
    pub prompt: String,
    pub source_code: String,
    pub model: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub status: Option<String>,
}

#[derive(Deserialize)]
pub struct ConvertToAppRequest {
    pub version: i32,
    pub price: Option<f64>,
}

#[derive(Deserialize)]
pub struct ReleaseVersionRequest {
    pub version_number: i32,
    pub price: Option<f64>,
}

pub async fn create_project(
    State(app_state): State<AppState>,
    JsonBody(req): JsonBody<CreateProjectRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Generate metadata from the prompt first
    let metadata = generate_metadata_from_prompt(&app_state, &req.prompt, &req.model).await?;

    let project_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // Create the project document with generated metadata
    let project_data = serde_json::json!({
        "id": project_id,
        "name": metadata.name,
        "description": metadata.description,
        "icon": metadata.icon,
        "status": "draft",
        "current_version": 0,
        "initial_prompt": req.prompt,
        "initial_model": req.model,
        "created_at": now,
        "updated_at": now
    });

    // Create project document only
    match app_state
        .database
        .create_document("projects", project_data)
        .await
    {
        Ok(project_doc) => Ok(Json(serde_json::json!({
            "data": project_doc,
            "links": {
                "self": format!("/api/projects/{}", project_id)
            }
        }))),
        Err(e) => {
            tracing::error!("Failed to create project: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn generate_metadata_from_prompt(
    app_state: &AppState,
    prompt: &str,
    model: &Option<String>,
) -> Result<AppMetadata, StatusCode> {
    let api_key = env::var("ANTHROPIC_API_KEY").map_err(|_| {
        tracing::error!("ANTHROPIC_API_KEY environment variable is required");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let metadata_prompt = format!(
        r#"Generate metadata for a P2P app based on this prompt: "{}"

Return a JSON object with these exact fields:
- id: kebab-case identifier (e.g., "todo-list")
- name: App display name
- description: Brief description (under 100 chars)
- version: Semantic version (e.g., "1.0.0")
- price: Price in USD (0.00 for free apps)
- icon: Single emoji that represents the app

Respond with only valid JSON, no other text."#,
        prompt
    );

    let messages = vec![AnthropicMessage {
        role: "user".to_string(),
        content: vec![AnthropicMessageContent {
            content_type: "text".to_string(),
            text: metadata_prompt,
        }],
    }];

    let model = model.as_deref().unwrap_or("claude-3-haiku-20240307");

    let body = serde_json::json!({
        "model": model,
        "max_tokens": 1024,
        "temperature": 0.3,
        "messages": messages,
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
        .map_err(|e| {
            tracing::error!("Request to Anthropic API failed: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        tracing::error!("Anthropic API error: {} - {}", status, error_text);
        return Err(StatusCode::BAD_GATEWAY);
    }

    let anthropic_response: AnthropicResponse = response.json().await.map_err(|e| {
        tracing::error!("Failed to parse Anthropic response: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let content = anthropic_response
        .content
        .as_ref()
        .and_then(|c| c.first())
        .ok_or_else(|| {
            tracing::error!("No content in response");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let metadata: AppMetadata = serde_json::from_str(&content.text).map_err(|e| {
        tracing::error!("Failed to parse metadata JSON: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(metadata)
}

pub async fn list_projects(
    State(app_state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    match app_state
        .database
        .list_documents("projects", query.limit, query.offset)
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
                "self": "/api/projects",
                "collections": "/api/db"
            }
        }))),
        Err(e) => {
            tracing::error!("Failed to list projects: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_project(
    State(app_state): State<AppState>,
    Path(project_id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Find project by data.id field
    let projects_result = app_state
        .database
        .list_documents("projects", Some(1000), Some(0))
        .await;
    let projects = match projects_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list projects: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let project_doc = projects
        .documents
        .into_iter()
        .find(|doc| doc.data.get("id").and_then(|v| v.as_str()) == Some(&project_id));

    let project_doc = match project_doc {
        Some(doc) => doc,
        None => return Err(StatusCode::NOT_FOUND),
    };

    // Get the current version to check if source_code needs generation
    let current_version = project_doc
        .data
        .get("current_version")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;

    // Find the current version document
    let versions_result = app_state
        .database
        .list_documents("project_versions", Some(1000), Some(0))
        .await;
    let versions = match versions_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list project versions: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Get all versions for this project first
    let all_versions: Vec<_> = versions
        .documents
        .into_iter()
        .filter(|doc| doc.data.get("project_id").and_then(|v| v.as_str()) == Some(&project_id))
        .collect();

    // Handle case where there are no versions (current_version = 0)
    if current_version == 0 {
        tracing::info!(
            "Project {} has no versions yet - ready for initial code generation",
            project_id
        );
    }

    // Prepare enriched project data without version-specific fields
    let mut enriched_project_data = project_doc.data.clone();
    if let Some(data_obj) = enriched_project_data.as_object_mut() {
        // Remove version-specific fields from project level
        data_obj.remove("source_code");
        data_obj.remove("prompt");
        data_obj.remove("model");

        // Add versions array
        data_obj.insert(
            "versions".to_string(),
            serde_json::to_value(&all_versions).unwrap_or_default(),
        );
    }

    let enriched_project_doc = crate::models::Document {
        id: project_doc.id.clone(),
        collection: project_doc.collection.clone(),
        data: enriched_project_data,
        created_at: project_doc.created_at,
        updated_at: project_doc.updated_at,
    };

    Ok(Json(serde_json::json!({
        "data": enriched_project_doc,
        "links": {
            "self": format!("/api/projects/{}", project_id),
            "versions": format!("/api/projects/{}/versions", project_id)
        }
    })))
}

pub async fn update_project(
    State(app_state): State<AppState>,
    Path(project_id): Path<String>,
    JsonBody(req): JsonBody<UpdateProjectRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Find the project by its data.id field
    let projects_result = app_state
        .database
        .list_documents("projects", Some(1000), Some(0))
        .await;
    let projects = match projects_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list projects: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let project_document = projects
        .documents
        .into_iter()
        .find(|doc| doc.data.get("id").and_then(|v| v.as_str()) == Some(&project_id));

    let mut project_document = match project_document {
        Some(doc) => doc,
        None => return Err(StatusCode::NOT_FOUND),
    };

    // Update fields if provided
    if let Some(data_obj) = project_document.data.as_object_mut() {
        if let Some(name) = req.name {
            data_obj.insert("name".to_string(), serde_json::Value::String(name));
        }
        if let Some(description) = req.description {
            data_obj.insert(
                "description".to_string(),
                serde_json::Value::String(description),
            );
        }
        if let Some(icon) = req.icon {
            data_obj.insert("icon".to_string(), serde_json::Value::String(icon));
        }
        if let Some(status) = req.status {
            data_obj.insert("status".to_string(), serde_json::Value::String(status));
        }
        data_obj.insert(
            "updated_at".to_string(),
            serde_json::Value::String(chrono::Utc::now().to_rfc3339()),
        );
    }

    match app_state
        .database
        .update_document("projects", &project_document.id, project_document.data)
        .await
    {
        Ok(Some(updated_document)) => Ok(Json(serde_json::json!({
            "data": updated_document,
            "links": {
                "self": format!("/api/projects/{}", project_id)
            }
        }))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to update project: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn delete_project(
    State(app_state): State<AppState>,
    Path(project_id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    // Find and delete the project
    let projects_result = app_state
        .database
        .list_documents("projects", Some(1000), Some(0))
        .await;
    let projects = match projects_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list projects: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let project_document = projects
        .documents
        .into_iter()
        .find(|doc| doc.data.get("id").and_then(|v| v.as_str()) == Some(&project_id));

    let project_document = match project_document {
        Some(doc) => doc,
        None => return Err(StatusCode::NOT_FOUND),
    };

    match app_state
        .database
        .delete_document("projects", &project_document.id)
        .await
    {
        Ok(true) => {
            // Also delete all versions for this project
            // Note: In a production system, you might want to do this in a transaction
            let versions_result = app_state
                .database
                .list_documents("project_versions", Some(1000), Some(0))
                .await;
            if let Ok(versions) = versions_result {
                for version_doc in versions.documents {
                    if let Some(version_project_id) =
                        version_doc.data.get("project_id").and_then(|v| v.as_str())
                    {
                        if version_project_id == project_id {
                            let _ = app_state
                                .database
                                .delete_document("project_versions", &version_doc.id)
                                .await;
                        }
                    }
                }
            }
            Ok(StatusCode::NO_CONTENT)
        }
        Ok(false) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to delete project: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn create_version(
    State(app_state): State<AppState>,
    Path(project_id): Path<String>,
    JsonBody(req): JsonBody<CreateVersionRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Get current project to determine next version number
    let projects_result = app_state
        .database
        .list_documents("projects", Some(1000), Some(0))
        .await;
    let projects = match projects_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list projects: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let project_document = projects
        .documents
        .into_iter()
        .find(|doc| doc.data.get("id").and_then(|v| v.as_str()) == Some(&project_id));

    let mut project_document = match project_document {
        Some(doc) => doc,
        None => return Err(StatusCode::NOT_FOUND),
    };

    let current_version = project_document
        .data
        .get("current_version")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;

    let next_version = current_version + 1;
    let version_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // Create new version
    let version_data = serde_json::json!({
        "id": version_id,
        "project_id": project_id,
        "version_number": next_version,
        "prompt": req.prompt,
        "source_code": req.source_code,
        "model": req.model,
        "created_at": now
    });

    match app_state
        .database
        .create_document("project_versions", version_data)
        .await
    {
        Ok(version_doc) => {
            // Update project's current_version
            if let Some(data_obj) = project_document.data.as_object_mut() {
                data_obj.insert(
                    "current_version".to_string(),
                    serde_json::Value::Number(next_version.into()),
                );
                data_obj.insert("updated_at".to_string(), serde_json::Value::String(now));
            }

            let _ = app_state
                .database
                .update_document("projects", &project_document.id, project_document.data)
                .await;

            Ok(Json(serde_json::json!({
                "data": version_doc,
                "links": {
                    "self": format!("/api/projects/{}/versions/{}", project_id, next_version),
                    "project": format!("/api/projects/{}", project_id)
                }
            })))
        }
        Err(e) => {
            tracing::error!("Failed to create project version: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn list_versions(
    State(app_state): State<AppState>,
    Path(project_id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let versions_result = app_state
        .database
        .list_documents("project_versions", Some(1000), Some(0))
        .await;
    let versions = match versions_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list project versions: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let project_versions: Vec<_> = versions
        .documents
        .into_iter()
        .filter(|doc| doc.data.get("project_id").and_then(|v| v.as_str()) == Some(&project_id))
        .collect();

    Ok(Json(serde_json::json!({
        "data": project_versions,
        "meta": {
            "count": project_versions.len(),
            "project_id": project_id
        },
        "links": {
            "self": format!("/api/projects/{}/versions", project_id),
            "project": format!("/api/projects/{}", project_id)
        }
    })))
}

pub async fn release_version(
    State(app_state): State<AppState>,
    Path(project_id): Path<String>,
    JsonBody(req): JsonBody<ReleaseVersionRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Get project
    let projects_result = app_state
        .database
        .list_documents("projects", Some(1000), Some(0))
        .await;
    let projects = match projects_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list projects: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let project_doc = projects
        .documents
        .into_iter()
        .find(|doc| doc.data.get("id").and_then(|v| v.as_str()) == Some(&project_id));

    let project_doc = match project_doc {
        Some(doc) => doc,
        None => return Err(StatusCode::NOT_FOUND),
    };

    // Get the specific version
    let versions_result = app_state
        .database
        .list_documents("project_versions", Some(1000), Some(0))
        .await;
    let versions = match versions_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list project versions: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let version_doc = versions.documents.into_iter().find(|doc| {
        doc.data.get("project_id").and_then(|v| v.as_str()) == Some(&project_id)
            && doc.data.get("version_number").and_then(|v| v.as_i64())
                == Some(req.version_number as i64)
    });

    let version_doc = match version_doc {
        Some(doc) => doc,
        None => return Err(StatusCode::NOT_FOUND),
    };

    // Create app from project version
    let app_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let app_data = serde_json::json!({
        "id": app_id,
        "name": project_doc.data.get("name").unwrap_or(&serde_json::Value::String("Untitled App".to_string())),
        "description": project_doc.data.get("description").unwrap_or(&serde_json::Value::String("".to_string())),
        "version": req.version_number,
        "price": req.price.unwrap_or(0.0),
        "icon": project_doc.data.get("icon").unwrap_or(&serde_json::Value::String("📱".to_string())),
        "installed": 1,
        "source_code": version_doc.data.get("source_code").unwrap_or(&serde_json::Value::String("".to_string())),
        "prompt": version_doc.data.get("prompt").unwrap_or(&serde_json::Value::String("".to_string())),
        "model": version_doc.data.get("model"),
        "status": "published",
        "project_id": project_id,
        "project_version": req.version_number,
        "created_at": now
    });

    match app_state.database.create_document("apps", app_data).await {
        Ok(app_doc) => Ok(Json(serde_json::json!({
            "data": app_doc,
            "links": {
                "self": format!("/api/apps/{}", app_id),
                "project": format!("/api/projects/{}", project_id)
            }
        }))),
        Err(e) => {
            tracing::error!("Failed to release version as app: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn convert_to_app(
    State(app_state): State<AppState>,
    Path(project_id): Path<String>,
    JsonBody(req): JsonBody<ConvertToAppRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Get project
    let projects_result = app_state
        .database
        .list_documents("projects", Some(1000), Some(0))
        .await;
    let projects = match projects_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list projects: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let project_doc = projects
        .documents
        .into_iter()
        .find(|doc| doc.data.get("id").and_then(|v| v.as_str()) == Some(&project_id));

    let project_doc = match project_doc {
        Some(doc) => doc,
        None => return Err(StatusCode::NOT_FOUND),
    };

    // Get the specific version
    let versions_result = app_state
        .database
        .list_documents("project_versions", Some(1000), Some(0))
        .await;
    let versions = match versions_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list project versions: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let version_doc = versions.documents.into_iter().find(|doc| {
        doc.data.get("project_id").and_then(|v| v.as_str()) == Some(&project_id)
            && doc.data.get("version_number").and_then(|v| v.as_i64()) == Some(req.version as i64)
    });

    let version_doc = match version_doc {
        Some(doc) => doc,
        None => return Err(StatusCode::NOT_FOUND),
    };

    // Create app from project version
    let app_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let app_data = serde_json::json!({
        "id": app_id,
        "name": project_doc.data.get("name").unwrap_or(&serde_json::Value::String("Untitled App".to_string())),
        "description": project_doc.data.get("description").unwrap_or(&serde_json::Value::String("".to_string())),
        "version": req.version,
        "price": req.price.unwrap_or(0.0),
        "icon": project_doc.data.get("icon").unwrap_or(&serde_json::Value::String("📱".to_string())),
        "installed": 1,
        "source_code": version_doc.data.get("source_code").unwrap_or(&serde_json::Value::String("".to_string())),
        "prompt": version_doc.data.get("prompt").unwrap_or(&serde_json::Value::String("".to_string())),
        "model": version_doc.data.get("model"),
        "status": "published",
        "project_id": project_id,
        "project_version": req.version,
        "created_at": now
    });

    match app_state.database.create_document("apps", app_data).await {
        Ok(app_doc) => Ok(Json(serde_json::json!({
            "data": app_doc,
            "links": {
                "self": format!("/api/apps/{}", app_id),
                "project": format!("/api/projects/{}", project_id)
            }
        }))),
        Err(e) => {
            tracing::error!("Failed to convert project to app: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
