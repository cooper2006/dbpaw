use dbpaw_lib::db::drivers::mysql::MysqlDriver;
use dbpaw_lib::db::drivers::DatabaseDriver;
use dbpaw_lib::models::ConnectionForm;
use std::env;

#[tokio::test]
#[ignore]
async fn test_mysql_integration_flow() {
    // Retrieve connection info from environment variables
    // Defaults are set for a local MySQL instance often used in development
    let host = env::var("MYSQL_HOST").unwrap_or_else(|_| "localhost".to_string());
    let port = env::var("MYSQL_PORT")
        .unwrap_or_else(|_| "3306".to_string())
        .parse()
        .unwrap();
    let username = env::var("MYSQL_USER").unwrap_or_else(|_| "root".to_string());
    let password = env::var("MYSQL_PASSWORD").unwrap_or_else(|_| "123456".to_string());
    // Use a specific test database if provided, otherwise default to None (which might fail list_tables if implementation depends on it)
    // Looking at mysql.rs, list_tables uses self.form.database as default schema.
    let database = env::var("MYSQL_DB").ok();

    println!("Testing MySQL connection to {}:{}", host, port);

    let form = ConnectionForm {
        driver: "mysql".to_string(),
        host: Some(host),
        port: Some(port),
        username: Some(username),
        password: Some(password),
        database: database.clone(),
        ..Default::default()
    };

    let driver = MysqlDriver { form };

    // 1. Test Connection
    // This just runs "SELECT 1"
    let result = driver.test_connection().await;
    assert!(result.is_ok(), "Connection failed: {:?}", result.err());
    println!("Connection successful!");

    // 2. List Databases
    let dbs = driver.list_databases().await;
    assert!(dbs.is_ok(), "Failed to list databases: {:?}", dbs.err());
    let dbs = dbs.unwrap();
    println!("Databases found: {:?}", dbs);
    assert!(!dbs.is_empty());

    // 3. Operations requiring a specific database
    if let Some(db_name) = database {
        println!("Running operations on database: {}", db_name);

        // List Tables
        let tables = driver.list_tables(Some(db_name.clone())).await;
        assert!(tables.is_ok(), "Failed to list tables: {:?}", tables.err());
        let tables = tables.unwrap();
        println!("Tables: {:?}", tables);

        // Setup a test table
        let table_name = "test_driver_integration";
        let create_sql = format!(
            "CREATE TABLE IF NOT EXISTS {} (id INT PRIMARY KEY, name VARCHAR(50))",
            table_name
        );
        let _ = driver
            .execute_query(create_sql)
            .await
            .expect("Failed to create table");

        // Insert
        let insert_sql = format!(
            "INSERT INTO {} (id, name) VALUES (1, 'Test Item')",
            table_name
        );
        // Clean up first just in case
        let _ = driver
            .execute_query(format!("DELETE FROM {} WHERE id = 1", table_name))
            .await;

        let insert_res = driver.execute_query(insert_sql).await;
        assert!(insert_res.is_ok(), "Insert failed: {:?}", insert_res.err());

        // Query
        let select_sql = format!("SELECT * FROM {} WHERE id = 1", table_name);
        let query_res = driver.execute_query(select_sql).await;
        assert!(query_res.is_ok(), "Select failed: {:?}", query_res.err());
        let query_data = query_res.unwrap();
        assert_eq!(query_data.row_count, 1);

        // Verify data content
        // data is Vec<serde_json::Value>
        if let Some(row) = query_data.data.first() {
            let name_val = row.get("name").and_then(|v| v.as_str());
            assert_eq!(name_val, Some("Test Item"));
        } else {
            panic!("No data returned");
        }

        // Clean up
        let drop_sql = format!("DROP TABLE {}", table_name);
        let _ = driver.execute_query(drop_sql).await;
        println!("Integration test finished successfully");
    } else {
        println!("Skipping table operations because MYSQL_DB env var is not set");
    }
}
