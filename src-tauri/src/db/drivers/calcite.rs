use super::{ConnectionForm, DatabaseDriver};
use crate::models::{QueryColumn, QueryResult, SchemaOverview, TableDataResponse, TableInfo, TableMetadata, TableStructure};
use async_trait::async_trait;
use regex::Regex;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct CalciteDriver {
    pub connections: Arc<Mutex<HashMap<String, Box<dyn DatabaseDriver>>>>,
    pub local_db: Option<Arc<crate::db::local::LocalDb>>,
}

impl CalciteDriver {
    pub async fn connect(_form: &ConnectionForm) -> Result<Self, String> {
        Ok(Self {
            connections: Arc::new(Mutex::new(HashMap::new())),
            local_db: None,
        })
    }

    pub fn with_local_db(mut self, local_db: Option<Arc<crate::db::local::LocalDb>>) -> Self {
        self.local_db = local_db;
        self
    }

    async fn get_connection_config(&self, alias: &str) -> Result<ConnectionForm, String> {
        if let Some(ref local_db_arc) = self.local_db {
            let connections = local_db_arc.list_connections().await.map_err(|e| e.to_string())?;
            for conn in connections {
                if conn.name.eq_ignore_ascii_case(alias) {
                    return Ok(ConnectionForm {
                        driver: conn.db_type,
                        name: Some(conn.name),
                        host: Some(conn.host),
                        port: Some(conn.port),
                        database: Some(conn.database),
                        schema: None,
                        username: Some(conn.username),
                        password: conn.password,
                        ssl: Some(conn.ssl),
                        ssl_mode: conn.ssl_mode,
                        ssl_ca_cert: conn.ssl_ca_cert,
                        file_path: conn.file_path,
                        ssh_enabled: Some(conn.ssh_enabled),
                        ssh_host: conn.ssh_host,
                        ssh_port: conn.ssh_port,
                        ssh_username: conn.ssh_username,
                        ssh_password: conn.ssh_password,
                        ssh_key_path: conn.ssh_key_path,
                    });
                }
            }
        }
        Err(format!("[FEDERATED_ERROR] Connection '{}' not found. Please ensure the connection exists and is active.", alias))
    }

    async fn resolve_datasource_tables(&self, sql: &str) -> Result<Vec<(String, String, String, String)>, String> {
        // 匹配格式：connection.database.schema.table 或 connection.database.table
        let re = Regex::new(r"\b([a-zA-Z_][a-zA-Z0-9_]*)\.([^\s.]+)(?:\.([^\s.]+))?(?:\.([^\s.]+))?\b").map_err(|e| e.to_string())?;

        let mut tables = Vec::new();

        for cap in re.captures_iter(sql) {
            let alias = cap.get(1).map(|m| m.as_str()).unwrap_or("");
            let part2 = cap.get(2).map(|m| m.as_str()).unwrap_or("");
            let part3 = cap.get(3).map(|m| m.as_str()).unwrap_or("");
            let part4 = cap.get(4).map(|m| m.as_str()).unwrap_or("");

            // 过滤掉可能的表别名（如 'r', 'm', 'u', 'd' 等单个字符的别名）
            if alias.len() <= 1 {
                continue;
            }

            if !part4.is_empty() {
                tables.push((alias.to_string(), part2.to_string(), part3.to_string(), part4.to_string()));
            } else if !part3.is_empty() {
                tables.push((alias.to_string(), part2.to_string(), "public".to_string(), part3.to_string()));
            } else {
                tables.push((alias.to_string(), "".to_string(), "public".to_string(), part2.to_string()));
            }
        }

        Ok(tables)
    }

    fn split_sql_by_datasource(&self, sql: &str) -> Vec<String> {
        let mut results = Vec::new();
        let sql_upper = sql.to_uppercase();
        
        let union_patterns = ["UNION ALL", "UNION", "EXCEPT", "MINUS", "INTERSECT"];
        
        let mut search_pos = 0;
        let mut found_union_pos: Option<usize> = None;
        let mut found_pattern_len = 0;
        
        for pattern in &union_patterns {
            let search_str = &sql_upper[search_pos..];
            if let Some(pos) = search_str.find(pattern) {
                let actual_pos = search_pos + pos;
                if found_union_pos.is_none() || actual_pos < found_union_pos.unwrap() {
                    found_union_pos = Some(actual_pos);
                    found_pattern_len = pattern.len();
                }
            }
        }
        
        if let Some(union_pos) = found_union_pos {
            let before = sql[..union_pos].trim();
            let after = sql[union_pos + found_pattern_len..].trim();
            
            if !before.is_empty() {
                results.push(before.to_string());
            }
            if !after.is_empty() {
                let after_splits = self.split_sql_by_datasource(after);
                results.extend(after_splits);
            }
        } else {
            results.push(sql.to_string());
        }
        
        results
    }

    fn replace_table_reference(sql: &str, alias: &str, database: &str, schema: &str, table: &str) -> String {
        let patterns = vec![
            format!("{}.{}.{}.{}", alias, database, schema, table),
            format!("{}.{}.{}", alias, database, table),
            format!("{}.{}", alias, table),
        ];
        
        for pattern in patterns {
            if sql.contains(&pattern) {
                if !database.is_empty() && !schema.is_empty() {
                    return sql.replace(&pattern, &format!("\"{}\".\"{}\".\"{}\"", database, schema, table));
                } else if !database.is_empty() {
                    return sql.replace(&pattern, &format!("\"{}\".\"{}\"", database, table));
                } else {
                    return sql.replace(&pattern, &format!("\"{}\"", table));
                }
            }
        }
        
        sql.to_string()
    }

    async fn execute_single_query(&self, sql: &str) -> Result<QueryResult, String> {
        let start_time = std::time::Instant::now();

        let tables = self.resolve_datasource_tables(sql).await?;

        if tables.is_empty() {
            return Err("[FEDERATED_ERROR] No federated tables found in SQL. Use format: connection.database.schema.table or connection.database.table".to_string());
        }

        let sql_parts = self.split_sql_by_datasource(sql);
        
        // Group tables by their SQL part index (based on federated operators)
        let mut tables_by_part = vec![Vec::new(); sql_parts.len()];
        let mut current_part = 0;
        let mut in_union = false;
        
        for (i, (alias, _, _, _)) in tables.iter().enumerate() {
            if i > 0 {
                // Check if this table is in a new SQL part (after a federated operator)
                let prev_table = &tables[i-1];
                if prev_table.0 != *alias {
                    current_part = std::cmp::min(current_part + 1, sql_parts.len() - 1);
                }
            }
            tables_by_part[current_part].push(tables[i].clone());
        }

        let mut all_data: Vec<serde_json::Value> = Vec::new();
        let mut all_columns: Vec<QueryColumn> = Vec::new();
        let mut first_result = true;
        let mut last_error: Option<String> = None;

        for (i, sql_part) in sql_parts.iter().enumerate() {
            let part_tables = &tables_by_part[i];
            if part_tables.is_empty() {
                continue;
            }
            
            // Use the first table's connection for this SQL part
            let (alias, database, schema, table) = &part_tables[0];
            
            let mut config = match self.get_connection_config(alias).await {
                Ok(cfg) => cfg,
                Err(e) => {
                    last_error = Some(e);
                    continue;
                }
            };
            
            let is_mysql = config.driver.eq_ignore_ascii_case("mysql") || config.driver.eq_ignore_ascii_case("mariadb");
            
            if !database.is_empty() {
                config.database = Some(database.clone());
            } else if is_mysql && !schema.is_empty() {
                config.database = Some(schema.clone());
            }
            
            let driver = match crate::db::drivers::connect(&config).await {
                Ok(d) => d,
                Err(e) => {
                    last_error = Some(e);
                    continue;
                }
            };

            let mut query = sql_part.to_string();
            // Replace all table references in this SQL part
            for (alias, database, schema, table) in part_tables {
                query = self.generate_query(&query, alias, database, schema, table, &config.driver);
            }

            let result = match driver.execute_query(query).await {
                Ok(r) => r,
                Err(e) => {
                    last_error = Some(e);
                    driver.close().await;
                    continue;
                }
            };

            driver.close().await;

            if first_result {
                all_columns = result.columns;
                first_result = false;
            }

            all_data.extend(result.data);
        }

        if all_data.is_empty() {
            if let Some(e) = last_error {
                return Err(e);
            }
            return Err("[FEDERATED_ERROR] No data retrieved from any data source".to_string());
        }

        let execution_time_ms = start_time.elapsed().as_millis() as i64;
        let row_count = all_data.len() as i64;

        Ok(QueryResult {
            data: all_data,
            row_count,
            columns: all_columns,
            time_taken_ms: execution_time_ms,
            success: true,
            error: None,
        })
    }

    fn generate_query(&self, sql: &str, alias: &str, database: &str, schema: &str, table: &str, driver_type: &str) -> String {
        let patterns = vec![
            format!("{}.{}.{}.{}", alias, database, schema, table),
            format!("{}.{}.{}", alias, database, table),
            format!("{}.{}.{}", alias, schema, table),
            format!("{}.{}", alias, table),
        ];
        
        for pattern in patterns {
            if sql.contains(&pattern) {
                let is_mysql = driver_type.eq_ignore_ascii_case("mysql") || driver_type.eq_ignore_ascii_case("mariadb");
                let is_postgres = driver_type.eq_ignore_ascii_case("postgres") || driver_type.eq_ignore_ascii_case("postgresql");
                
                if is_mysql {
                    let mysql_database = if !database.is_empty() { database } else { schema };
                    if !mysql_database.is_empty() {
                        return sql.replace(&pattern, &format!("`{}`.`{}`", mysql_database, table));
                    } else {
                        return sql.replace(&pattern, &format!("`{}`", table));
                    }
                } else if is_postgres {
                    if !database.is_empty() && !schema.is_empty() {
                        return sql.replace(&pattern, &format!("\"{}\".\"{}\".\"{}\"", database, schema, table));
                    } else if !schema.is_empty() {
                        return sql.replace(&pattern, &format!("\"{}\".\"{}\"", schema, table));
                    } else {
                        return sql.replace(&pattern, &format!("\"{}\"", table));
                    }
                } else {
                    if !schema.is_empty() {
                        return sql.replace(&pattern, &format!("\"{}\".\"{}\"", schema, table));
                    } else {
                        return sql.replace(&pattern, &format!("\"{}\"", table));
                    }
                }
            }
        }
        
        sql.to_string()
    }
}

#[async_trait]
impl DatabaseDriver for CalciteDriver {
    async fn test_connection(&self) -> Result<(), String> {
        Ok(())
    }

    async fn list_databases(&self) -> Result<Vec<String>, String> {
        Ok(vec![])
    }

    async fn list_tables(&self, _schema: Option<String>) -> Result<Vec<TableInfo>, String> {
        Ok(vec![])
    }

    async fn get_table_structure(
        &self,
        _schema: String,
        _table: String,
    ) -> Result<TableStructure, String> {
        Ok(TableStructure {
            columns: vec![]
        })
    }

    async fn get_table_metadata(
        &self,
        _schema: String,
        _table: String,
    ) -> Result<TableMetadata, String> {
        Ok(TableMetadata {
            columns: vec![],
            indexes: vec![],
            foreign_keys: vec![],
            clickhouse_extra: None,
        })
    }

    async fn get_table_ddl(&self, _schema: String, _table: String) -> Result<String, String> {
        Ok("".to_string())
    }

    async fn get_table_data(
        &self,
        _schema: String,
        _table: String,
        page: i64,
        limit: i64,
        _sort_column: Option<String>,
        _sort_direction: Option<String>,
        _filter: Option<String>,
        _order_by: Option<String>,
    ) -> Result<TableDataResponse, String> {
        Ok(TableDataResponse {
            data: vec![],
            total: 0,
            page,
            limit,
            execution_time_ms: 0,
        })
    }

    async fn get_table_data_chunk(
        &self,
        schema: String,
        table: String,
        page: i64,
        limit: i64,
        sort_column: Option<String>,
        sort_direction: Option<String>,
        filter: Option<String>,
        order_by: Option<String>,
    ) -> Result<TableDataResponse, String> {
        self.get_table_data(
            schema,
            table,
            page,
            limit,
            sort_column,
            sort_direction,
            filter,
            order_by,
        )
        .await
    }

    async fn execute_query(&self, sql: String) -> Result<QueryResult, String> {
        self.execute_single_query(&sql).await
    }

    async fn get_schema_overview(&self, _schema: Option<String>) -> Result<SchemaOverview, String> {
        Ok(SchemaOverview {
            tables: vec![]
        })
    }

    async fn close(&self) {
        let mut connections = self.connections.lock().await;
        for (_, driver) in connections.drain() {
            driver.close().await;
        }
    }
}