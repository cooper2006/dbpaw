use dbpaw::db::drivers::{calcite::CalciteDriver, ConnectionForm};
use dbpaw::db::local::LocalDb;
use dbpaw::models::QueryResult;
use std::path::Path;

#[tokio::main]
async fn main() {
    // Initialize local database
    let db_path = Path::new("/Users/cooper/Library/Application Support/com.father.dbpaw/dbpaw.sqlite");
    let local_db = LocalDb::new(db_path).await.unwrap();
    let local_db_arc = std::sync::Arc::new(local_db);

    // Create Calcite driver with local db
    let calcite_driver = CalciteDriver::connect(&ConnectionForm {
        driver: "calcite".to_string(),
        name: Some("Calcite Federated Engine".to_string()),
        ..Default::default()
    }).await.unwrap();

    let driver = calcite_driver.with_local_db(Some(local_db_arc));

    // Test SQL queries
    let sqls = vec![
        r#"SELECT id, username, email, created_at FROM mysql.freefs.sys_user 
 UNION ALL 
 SELECT id, username, email, created_at FROM pgsql.freefs.public.sys_user"#,
        r#"SELECT id, file_name, file_size, created_at FROM mysql.freefs.fs_file 
 UNION ALL 
 SELECT id, file_name, file_size, created_at FROM pgsql.freefs.public.fs_file"#,
        r#"SELECT r.id, r.role_name, m.menu_name FROM mysql.freefs.sys_role r 
 JOIN mysql.freefs.sys_menu m ON r.id = m.role_id 
 UNION 
 SELECT r.id, r.role_name, m.menu_name FROM pgsql.freefs.public.sys_role r 
 JOIN pgsql.freefs.public.sys_menu m ON r.id = m.role_id"#,
        r#"SELECT id, dept_name FROM mysql.freefs.sys_dept 
 MINUS 
 SELECT id, dept_name FROM pgsql.freefs.public.sys_dept"#,
        r#"SELECT dict_type, dict_label, dict_value FROM mysql.freefs.sys_dict_data 
 UNION 
 SELECT dict_type, dict_label, dict_value FROM pgsql.freefs.public.sys_dict_data"#,
        r#"SELECT plan_id, plan_name, price FROM mysql.freefs.subscription_plan 
 UNION ALL 
 SELECT plan_id, plan_name, price FROM pgsql.freefs.public.subscription_plan"#,
        r#"SELECT config_key, config_value FROM mysql.freefs.sys_oss_config 
 INTERSECT 
 SELECT config_key, config_value FROM pgsql.freefs.public.sys_oss_config"#,
        r#"SELECT user_id, used_quota, total_quota FROM mysql.freefs.user_quota_usage 
 UNION ALL 
 SELECT user_id, used_quota, total_quota FROM pgsql.freefs.public.user_quota_usage"#,
        r#"SELECT u.id, u.username, r.role_name, d.dept_name 
 FROM mysql.freefs.sys_user u 
 JOIN mysql.freefs.sys_role r ON u.role_id = r.id 
 JOIN mysql.freefs.sys_dept d ON u.dept_id = d.id 
 UNION ALL 
 SELECT u.id, u.username, r.role_name, d.dept_name 
 FROM pgsql.freefs.public.sys_user u 
 JOIN pgsql.freefs.public.sys_role r ON u.role_id = r.id 
 JOIN pgsql.freefs.public.sys_dept d ON u.dept_id = d.id"#,
    ];

    for (i, sql) in sqls.iter().enumerate() {
        println!("\n=== Testing query {}/{} ===", i + 1, sqls.len());
        println!("SQL: {}", sql);
        println!("\nExecuting...");

        match driver.execute_query(sql.to_string()).await {
            Ok(result) => {
                println!("\n✓ Query executed successfully!");
                println!("Row count: {}", result.row_count);
                println!("Columns: {:?}", result.columns);
                println!("Execution time: {}ms", result.time_taken_ms);
                if !result.data.is_empty() {
                    println!("First few rows: {:?}", result.data.iter().take(3).collect::<Vec<_>>());
                } else {
                    println!("No rows returned");
                }
            }
            Err(e) => {
                println!("\n✗ Query failed: {}", e);
            }
        }
    }

    driver.close().await;
    println!("\n=== All tests completed ===");
}