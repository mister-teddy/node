use crate::AppState;
use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    Json as JsonBody,
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct DashboardWidget {
    pub id: String,        // app ID
    pub x: i32,           // grid x position
    pub y: i32,           // grid y position
    pub w: i32,           // grid width
    pub h: i32,           // grid height
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_w: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_h: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_w: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_h: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub no_resize: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub no_move: Option<bool>,
}

#[derive(Deserialize)]
pub struct SaveDashboardLayoutRequest {
    pub widgets: Vec<DashboardWidget>,
}

const LAYOUT_ID: &str = "default_layout";

pub async fn get_dashboard_layout(
    State(app_state): State<AppState>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Try to find existing layout document
    let layouts_result = app_state
        .database
        .list_documents("dashboard_layouts", Some(100), Some(0))
        .await;

    let layouts = match layouts_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list dashboard layouts: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Find the default layout
    let layout_doc = layouts
        .documents
        .into_iter()
        .find(|doc| doc.data.get("id").and_then(|v| v.as_str()) == Some(LAYOUT_ID));

    match layout_doc {
        Some(doc) => {
            let widgets = doc.data.get("widgets")
                .cloned()
                .unwrap_or_else(|| serde_json::json!([]));
            Ok(Json(serde_json::json!({
                "data": {
                    "id": LAYOUT_ID,
                    "widgets": widgets,
                    "updated_at": doc.updated_at
                },
                "links": {
                    "self": "/api/dashboard/layout"
                }
            })))
        }
        None => {
            // Return empty layout if none exists
            Ok(Json(serde_json::json!({
                "data": {
                    "id": LAYOUT_ID,
                    "widgets": [],
                    "updated_at": null
                },
                "links": {
                    "self": "/api/dashboard/layout"
                }
            })))
        }
    }
}

pub async fn save_dashboard_layout(
    State(app_state): State<AppState>,
    JsonBody(req): JsonBody<SaveDashboardLayoutRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let now = chrono::Utc::now().to_rfc3339();

    // Check if layout already exists
    let layouts_result = app_state
        .database
        .list_documents("dashboard_layouts", Some(100), Some(0))
        .await;

    let layouts = match layouts_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list dashboard layouts: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let existing_layout = layouts
        .documents
        .into_iter()
        .find(|doc| doc.data.get("id").and_then(|v| v.as_str()) == Some(LAYOUT_ID));

    let layout_data = serde_json::json!({
        "id": LAYOUT_ID,
        "widgets": req.widgets,
        "updated_at": now
    });

    match existing_layout {
        Some(existing) => {
            // Update existing layout
            match app_state
                .database
                .update_document("dashboard_layouts", &existing.id, layout_data)
                .await
            {
                Ok(Some(updated_doc)) => {
                    let widgets = updated_doc.data.get("widgets")
                        .cloned()
                        .unwrap_or_else(|| serde_json::json!([]));
                    Ok(Json(serde_json::json!({
                        "data": {
                            "id": LAYOUT_ID,
                            "widgets": widgets,
                            "updated_at": updated_doc.updated_at
                        },
                        "links": {
                            "self": "/api/dashboard/layout"
                        }
                    })))
                }
                Ok(None) => Err(StatusCode::NOT_FOUND),
                Err(e) => {
                    tracing::error!("Failed to update dashboard layout: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
        None => {
            // Create new layout
            match app_state
                .database
                .create_document("dashboard_layouts", layout_data)
                .await
            {
                Ok(created_doc) => {
                    let widgets = created_doc.data.get("widgets")
                        .cloned()
                        .unwrap_or_else(|| serde_json::json!([]));
                    Ok(Json(serde_json::json!({
                        "data": {
                            "id": LAYOUT_ID,
                            "widgets": widgets,
                            "updated_at": created_doc.updated_at
                        },
                        "links": {
                            "self": "/api/dashboard/layout"
                        }
                    })))
                }
                Err(e) => {
                    tracing::error!("Failed to create dashboard layout: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
    }
}