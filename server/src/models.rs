use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub collection: String,
    pub data: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDocumentRequest {
    pub data: Value,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDocumentRequest {
    pub data: Value,
}

#[derive(Debug, Serialize)]
pub struct QueryResult {
    pub documents: Vec<Document>,
    pub count: i64,
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct QueryRequest {
    pub query: String,
}