use crate::commands::ai::{
  ai_chat_continue_direct, ai_chat_start_direct, ai_clear_provider_api_key_direct,
  ai_create_provider_direct, ai_delete_conversation_direct, ai_delete_provider_direct,
  ai_get_conversation_direct, ai_list_conversations_direct, ai_list_providers_direct,
  ai_set_default_provider_direct, ai_update_provider_direct,
};
use crate::commands::connection::{
  create_connection_direct, create_database_by_id_direct, delete_connection_direct,
  get_connections_direct, get_mysql_charsets_by_id_direct, get_mysql_collations_by_id_direct,
  list_databases_by_id_direct, update_connection_direct, CreateDatabasePayload,
};
use crate::commands::metadata::{
  get_schema_overview_direct, get_table_ddl_direct, get_table_metadata_direct,
  get_table_structure_direct,
};
use crate::commands::query::{
  cancel_query_direct, execute_by_conn_direct, execute_query_by_id_direct,
  list_sql_execution_logs_direct,
};
use crate::commands::redis::{
  redis_delete_key_direct, redis_execute_raw_direct, redis_get_key_direct,
  redis_get_key_page_direct, redis_list_databases_direct, redis_rename_key_direct,
  redis_scan_keys_direct, redis_set_key_direct, redis_set_ttl_direct, redis_update_key_direct,
};
use crate::datasources::redis::RedisSetKeyPayload;
use crate::commands::storage::{
  delete_saved_query_direct, get_saved_queries_direct, save_query_direct,
  update_saved_query_direct,
};
use crate::commands::transfer::{
  export_database_sql_direct, export_query_result_direct, export_table_data_direct,
  import_sql_file_direct, ExportFormat, ExportScope,
};
use crate::models::{
  AiProviderForm, ConnectionForm,
  TestConnectionResult,
};
use crate::state::AppState;
use axum::{
    extract::{Path, Query, State as AxumState},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::Deserialize;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TableDataParams {
    id: i64,
    database: Option<String>,
    schema: String,
    table: String,
    page: i64,
    limit: i64,
    filter: Option<String>,
    sort_column: Option<String>,
    sort_direction: Option<String>,
    order_by: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExecuteQueryParams {
    id: i64,
    query: String,
    database: Option<String>,
    source: Option<String>,
    query_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CancelQueryParams {
    uuid: String,
    query_id: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ListTablesParams {
    id: i64,
    database: Option<String>,
    schema: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GetTableDdlParams {
    id: i64,
    database: Option<String>,
    schema: String,
    table: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GetTableMetadataParams {
    id: i64,
    database: Option<String>,
    schema: String,
    table: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GetTableStructureParams {
    id: i64,
    schema: String,
    table: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GetSchemaOverviewParams {
    id: i64,
    database: Option<String>,
    schema: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportTableParams {
    id: i64,
    database: Option<String>,
    schema: String,
    table: String,
    driver: String,
    format: ExportFormat,
    scope: ExportScope,
    filter: Option<String>,
    order_by: Option<String>,
    sort_column: Option<String>,
    sort_direction: Option<String>,
    page: Option<i64>,
    limit: Option<i64>,
    file_path: Option<String>,
    chunk_size: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportDatabaseParams {
    id: i64,
    database: String,
    driver: String,
    format: ExportFormat,
    file_path: Option<String>,
    chunk_size: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportQueryParams {
    id: i64,
    database: Option<String>,
    sql: String,
    driver: String,
    format: ExportFormat,
    file_path: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImportSqlParams {
    id: i64,
    database: Option<String>,
    file_path: String,
    driver: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ListDatabasesParams {
    id: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateDatabaseParams {
    id: i64,
    #[serde(flatten)]
    payload: CreateDatabasePayload,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MysqlCharsetsParams {
    id: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MysqlCollationsParams {
    id: i64,
    charset: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SqlLogsParams {
    limit: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AiListConversationsParams {
    connection_id: Option<i64>,
    database: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExecuteFederatedQueryParams {
    query: String,
    source: Option<String>,
}

async fn api_json<T: serde::Serialize>(result: Result<T, String>) -> impl IntoResponse {
    match result {
        Ok(data) => (StatusCode::OK, Json(data)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e })))
            .into_response(),
    }
}

async fn api_unit(result: Result<(), String>) -> impl IntoResponse {
    match result {
        Ok(()) => (StatusCode::OK, Json(serde_json::json!({}))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e })))
            .into_response(),
    }
}

async fn get_connections_handler(AxumState(state): AxumState<Arc<AppState>>) -> impl IntoResponse {
    api_json(get_connections_direct(&state).await).await
}

async fn create_connection_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(form): Json<ConnectionForm>,
) -> impl IntoResponse {
    api_json(create_connection_direct(&state, form).await).await
}

async fn update_connection_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Path(id): Path<i64>,
    Json(form): Json<ConnectionForm>,
) -> impl IntoResponse {
    api_json(update_connection_direct(&state, id, form).await).await
}

async fn delete_connection_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    api_unit(delete_connection_direct(&state, id).await).await
}

async fn test_connection_handler(
    Json(form): Json<ConnectionForm>,
) -> impl IntoResponse {
    let form = crate::connection_input::normalize_connection_form(form);
    match form {
        Ok(form) => {
            let start = std::time::Instant::now();
            match crate::db::drivers::connect(&form).await {
                Ok(driver) => match driver.test_connection().await {
                    Ok(()) => {
                        let elapsed = start.elapsed().as_millis() as i64;
                        api_json(Ok(TestConnectionResult {
                            success: true,
                            message: "Connection successful".to_string(),
                            latency_ms: Some(elapsed),
                        }))
                        .await
                    }
                    Err(e) => api_json(Err(e)).await,
                },
                Err(e) => api_json(Err(e)).await,
            }
        }
        Err(e) => api_json(Err(e)).await,
    }
}

async fn list_databases_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Query(params): Query<ListDatabasesParams>,
) -> impl IntoResponse {
    api_json(list_databases_by_id_direct(&state, params.id).await).await
}

async fn create_database_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(params): Json<CreateDatabaseParams>,
) -> impl IntoResponse {
    api_unit(create_database_by_id_direct(&state, params.id, params.payload).await).await
}

async fn get_mysql_charsets_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Query(params): Query<MysqlCharsetsParams>,
) -> impl IntoResponse {
    api_json(get_mysql_charsets_by_id_direct(&state, params.id).await).await
}

async fn get_mysql_collations_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Query(params): Query<MysqlCollationsParams>,
) -> impl IntoResponse {
    api_json(get_mysql_collations_by_id_direct(&state, params.id, params.charset).await).await
}

async fn execute_query_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(params): Json<ExecuteQueryParams>,
) -> impl IntoResponse {
    api_json(
        execute_query_by_id_direct(&state, params.id, params.query, params.database, params.source, params.query_id).await,
    )
    .await
}

async fn execute_by_conn_handler(
    Json(params): Json<crate::models::ExecuteByConnRequest>,
) -> impl IntoResponse {
    api_json(execute_by_conn_direct(params.form, params.sql).await).await
}

async fn execute_federated_query_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(params): Json<ExecuteFederatedQueryParams>,
) -> impl IntoResponse {
    api_json(
        crate::commands::query::execute_federated_query_direct(&state, params.query, params.source).await,
    ).await
}

async fn cancel_query_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(params): Json<CancelQueryParams>,
) -> impl IntoResponse {
    api_json(cancel_query_direct(&state, params.uuid, params.query_id).await).await
}

async fn get_table_data_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Query(params): Query<TableDataParams>,
) -> impl IntoResponse {
    let result = crate::commands::query::get_table_data_by_conn_direct_wrapper(
        &state,
        params.id,
        params.database,
        params.schema,
        params.table,
        params.page,
        params.limit,
        params.filter,
        params.sort_column,
        params.sort_direction,
        params.order_by,
    )
    .await;
    api_json(result).await
}

async fn list_sql_logs_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Query(params): Query<SqlLogsParams>,
) -> impl IntoResponse {
    api_json(list_sql_execution_logs_direct(&state, params.limit).await).await
}

async fn list_tables_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Query(params): Query<ListTablesParams>,
) -> impl IntoResponse {
    use crate::commands::metadata::list_tables_direct;
    api_json(list_tables_direct(&state, params.id, params.database, params.schema).await).await
}

async fn get_table_structure_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Query(params): Query<GetTableStructureParams>,
) -> impl IntoResponse {
    api_json(get_table_structure_direct(&state, params.id, params.schema, params.table).await).await
}

async fn get_table_ddl_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Query(params): Query<GetTableDdlParams>,
) -> impl IntoResponse {
    api_json(get_table_ddl_direct(&state, params.id, params.database, params.schema, params.table).await).await
}

async fn get_table_metadata_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Query(params): Query<GetTableMetadataParams>,
) -> impl IntoResponse {
    api_json(get_table_metadata_direct(&state, params.id, params.database, params.schema, params.table).await).await
}

async fn get_schema_overview_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Query(params): Query<GetSchemaOverviewParams>,
) -> impl IntoResponse {
    api_json(get_schema_overview_direct(&state, params.id, params.database, params.schema).await).await
}

async fn get_saved_queries_handler(
    AxumState(state): AxumState<Arc<AppState>>,
) -> impl IntoResponse {
    api_json(get_saved_queries_direct(&state).await).await
}

async fn save_query_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let name = body.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let query = body.get("query").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let description = body.get("description").and_then(|v| v.as_str()).map(|s| s.to_string());
    let connection_id = body.get("connectionId").and_then(|v| v.as_i64());
    let database = body.get("database").and_then(|v| v.as_str()).map(|s| s.to_string());
    api_json(save_query_direct(&state, name, query, description, connection_id, database).await).await
}

async fn update_saved_query_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Path(id): Path<i64>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let name = body.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let query = body.get("query").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let description = body.get("description").and_then(|v| v.as_str()).map(|s| s.to_string());
    let connection_id = body.get("connectionId").and_then(|v| v.as_i64());
    let database = body.get("database").and_then(|v| v.as_str()).map(|s| s.to_string());
    api_json(update_saved_query_direct(&state, id, name, query, description, connection_id, database).await).await
}

async fn delete_saved_query_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    api_unit(delete_saved_query_direct(&state, id).await).await
}

async fn export_table_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(params): Json<ExportTableParams>,
) -> impl IntoResponse {
    api_json(
        export_table_data_direct(
            &state, params.id, params.database, params.schema, params.table,
            params.driver, params.format, params.scope, params.filter, params.order_by,
            params.sort_column, params.sort_direction, params.page, params.limit,
            params.file_path, params.chunk_size,
        )
        .await,
    )
    .await
}

async fn export_database_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(params): Json<ExportDatabaseParams>,
) -> impl IntoResponse {
    api_json(
        export_database_sql_direct(&state, params.id, params.database, params.driver, params.format, params.file_path, params.chunk_size).await,
    )
    .await
}

async fn export_query_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(params): Json<ExportQueryParams>,
) -> impl IntoResponse {
    api_json(
        export_query_result_direct(&state, params.id, params.database, params.sql, params.driver, params.format, params.file_path).await,
    )
    .await
}

async fn import_sql_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(params): Json<ImportSqlParams>,
) -> impl IntoResponse {
    api_json(
        import_sql_file_direct(&state, params.id, params.database, params.file_path, params.driver).await,
    )
    .await
}

async fn ai_list_providers_handler(
    AxumState(state): AxumState<Arc<AppState>>,
) -> impl IntoResponse {
    api_json(ai_list_providers_direct(&state).await).await
}

async fn ai_create_provider_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(config): Json<AiProviderForm>,
) -> impl IntoResponse {
    api_json(ai_create_provider_direct(&state, config).await).await
}

async fn ai_update_provider_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Path(id): Path<i64>,
    Json(config): Json<AiProviderForm>,
) -> impl IntoResponse {
    api_json(ai_update_provider_direct(&state, id, config).await).await
}

async fn ai_delete_provider_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    api_unit(ai_delete_provider_direct(&state, id).await).await
}

async fn ai_set_default_provider_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    api_unit(ai_set_default_provider_direct(&state, id).await).await
}

async fn ai_clear_api_key_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Path(provider_type): Path<String>,
) -> impl IntoResponse {
    api_unit(ai_clear_provider_api_key_direct(&state, provider_type).await).await
}

async fn ai_chat_start_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(request): Json<crate::ai::types::AiChatRequest>,
) -> impl IntoResponse {
    api_json(ai_chat_start_direct(&state, request).await).await
}

async fn ai_chat_continue_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Json(request): Json<crate::ai::types::AiChatRequest>,
) -> impl IntoResponse {
    api_json(ai_chat_continue_direct(&state, request).await).await
}

async fn ai_list_conversations_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Query(params): Query<AiListConversationsParams>,
) -> impl IntoResponse {
    api_json(ai_list_conversations_direct(&state, params.connection_id, params.database).await).await
}

async fn ai_get_conversation_handler(
    AxumState(state): AxumState<Arc<AppState>>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    api_json(ai_get_conversation_direct(&state, id).await).await
}

async fn ai_delete_conversation_handler(
  AxumState(state): AxumState<Arc<AppState>>,
  Path(id): Path<i64>,
) -> impl IntoResponse {
  api_unit(ai_delete_conversation_direct(&state, id).await).await
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RedisListDatabasesParams {
  id: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RedisScanKeysParams {
  id: i64,
  database: Option<String>,
  cursor: Option<u64>,
  pattern: Option<String>,
  limit: Option<u32>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RedisKeyParams {
  id: i64,
  database: Option<String>,
  key: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RedisSetKeyParams {
  id: i64,
  database: Option<String>,
  payload: RedisSetKeyPayload,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RedisRenameKeyParams {
  id: i64,
  database: Option<String>,
  old_key: String,
  new_key: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RedisKeyPageParams {
  id: i64,
  database: Option<String>,
  key: String,
  offset: u64,
  limit: u32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RedisSetTtlParams {
  id: i64,
  database: Option<String>,
  key: String,
  ttl_seconds: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RedisExecuteRawParams {
  id: i64,
  database: Option<String>,
  command: String,
}

async fn redis_list_databases_handler(
  AxumState(state): AxumState<Arc<AppState>>,
  Query(params): Query<RedisListDatabasesParams>,
) -> impl IntoResponse {
  api_json(redis_list_databases_direct(&state, params.id).await).await
}

async fn redis_scan_keys_handler(
  AxumState(state): AxumState<Arc<AppState>>,
  Query(params): Query<RedisScanKeysParams>,
) -> impl IntoResponse {
  api_json(
    redis_scan_keys_direct(
      &state,
      params.id,
      params.database,
      params.cursor,
      params.pattern,
      params.limit,
    )
    .await,
  )
  .await
}

async fn redis_get_key_handler(
  AxumState(state): AxumState<Arc<AppState>>,
  Query(params): Query<RedisKeyParams>,
) -> impl IntoResponse {
  api_json(redis_get_key_direct(&state, params.id, params.database, params.key).await).await
}

async fn redis_set_key_handler(
  AxumState(state): AxumState<Arc<AppState>>,
  Json(params): Json<RedisSetKeyParams>,
) -> impl IntoResponse {
  api_json(redis_set_key_direct(&state, params.id, params.database, params.payload).await).await
}

async fn redis_update_key_handler(
  AxumState(state): AxumState<Arc<AppState>>,
  Json(params): Json<RedisSetKeyParams>,
) -> impl IntoResponse {
  api_json(redis_update_key_direct(&state, params.id, params.database, params.payload).await).await
}

async fn redis_delete_key_handler(
  AxumState(state): AxumState<Arc<AppState>>,
  Query(params): Query<RedisKeyParams>,
) -> impl IntoResponse {
  api_json(redis_delete_key_direct(&state, params.id, params.database, params.key).await).await
}

async fn redis_rename_key_handler(
  AxumState(state): AxumState<Arc<AppState>>,
  Json(params): Json<RedisRenameKeyParams>,
) -> impl IntoResponse {
  api_json(
    redis_rename_key_direct(&state, params.id, params.database, params.old_key, params.new_key)
      .await,
  )
  .await
}

async fn redis_get_key_page_handler(
  AxumState(state): AxumState<Arc<AppState>>,
  Query(params): Query<RedisKeyPageParams>,
) -> impl IntoResponse {
  api_json(
    redis_get_key_page_direct(
      &state,
      params.id,
      params.database,
      params.key,
      params.offset,
      params.limit,
    )
    .await,
  )
  .await
}

async fn redis_set_ttl_handler(
  AxumState(state): AxumState<Arc<AppState>>,
  Json(params): Json<RedisSetTtlParams>,
) -> impl IntoResponse {
  api_json(
    redis_set_ttl_direct(&state, params.id, params.database, params.key, params.ttl_seconds)
      .await,
  )
  .await
}

async fn redis_execute_raw_handler(
  AxumState(state): AxumState<Arc<AppState>>,
  Json(params): Json<RedisExecuteRawParams>,
) -> impl IntoResponse {
  api_json(
    redis_execute_raw_direct(&state, params.id, params.database, params.command).await,
  )
  .await
}

fn build_router() -> Router<Arc<AppState>> {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/api/connections", get(get_connections_handler).post(create_connection_handler))
        .route("/api/connections/{id}", put(update_connection_handler).delete(delete_connection_handler))
        .route("/api/connections/test", post(test_connection_handler))
        .route("/api/connections/databases", get(list_databases_handler))
        .route("/api/connections/create-database", post(create_database_handler))
        .route("/api/connections/mysql-charsets", get(get_mysql_charsets_handler))
        .route("/api/connections/mysql-collations", get(get_mysql_collations_handler))
        .route("/api/query/execute", post(execute_query_handler))
        .route("/api/query/execute-by-conn", post(execute_by_conn_handler))
        .route("/api/query/execute-federated", post(execute_federated_query_handler))
        .route("/api/query/cancel", post(cancel_query_handler))
        .route("/api/query/table-data", get(get_table_data_handler))
        .route("/api/query/sql-logs", get(list_sql_logs_handler))
        .route("/api/metadata/tables", get(list_tables_handler))
        .route("/api/metadata/table-structure", get(get_table_structure_handler))
        .route("/api/metadata/table-ddl", get(get_table_ddl_handler))
        .route("/api/metadata/table-metadata", get(get_table_metadata_handler))
        .route("/api/metadata/schema-overview", get(get_schema_overview_handler))
        .route("/api/queries", get(get_saved_queries_handler).post(save_query_handler))
        .route("/api/queries/{id}", put(update_saved_query_handler).delete(delete_saved_query_handler))
        .route("/api/transfer/export-table", post(export_table_handler))
        .route("/api/transfer/export-database", post(export_database_handler))
        .route("/api/transfer/export-query", post(export_query_handler))
        .route("/api/transfer/import-sql", post(import_sql_handler))
        .route("/api/ai/providers", get(ai_list_providers_handler).post(ai_create_provider_handler))
        .route("/api/ai/providers/{id}", put(ai_update_provider_handler).delete(ai_delete_provider_handler))
        .route("/api/ai/providers/{id}/default", put(ai_set_default_provider_handler))
        .route("/api/ai/providers/clear-key/{provider_type}", post(ai_clear_api_key_handler))
        .route("/api/ai/chat/start", post(ai_chat_start_handler))
        .route("/api/ai/chat/continue", post(ai_chat_continue_handler))
        .route("/api/ai/conversations", get(ai_list_conversations_handler))
        .route("/api/ai/conversations/{id}", get(ai_get_conversation_handler).delete(ai_delete_conversation_handler))
    .route("/api/redis/databases", get(redis_list_databases_handler))
    .route("/api/redis/scan", get(redis_scan_keys_handler))
    .route("/api/redis/key", get(redis_get_key_handler))
    .route("/api/redis/key", post(redis_set_key_handler))
    .route("/api/redis/key", put(redis_update_key_handler))
    .route("/api/redis/key", delete(redis_delete_key_handler))
    .route("/api/redis/rename", post(redis_rename_key_handler))
    .route("/api/redis/key-page", get(redis_get_key_page_handler))
    .route("/api/redis/ttl", post(redis_set_ttl_handler))
    .route("/api/redis/execute", post(redis_execute_raw_handler))
    .layer(cors)
}

pub async fn start_server(state: Arc<AppState>, port: u16) {
    let app = build_router().with_state(state);
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], port));
    println!("HTTP API server listening on http://{}", addr);
    if let Err(e) = axum::serve(
        tokio::net::TcpListener::bind(addr).await.unwrap_or_else(|e| {
            panic!("Failed to bind HTTP API server on port {}: {}", port, e);
        }),
        app,
    )
    .await
    {
        eprintln!("HTTP API server error: {}", e);
    }
}
