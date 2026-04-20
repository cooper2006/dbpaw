#[path = "common/calcite_context.rs"]
mod calcite_context;

use calcite_context::create_calcite_driver;
use dbpaw_lib::db::drivers::DatabaseDriver;

#[tokio::test]
async fn test_calcite_union_all_sys_user() {
    let driver = create_calcite_driver().await.expect("Failed to create calcite driver");

    let sql = r#"SELECT id, username, email, created_at FROM mysql.freefs.sys_user
 UNION ALL
 SELECT id, username, email, created_at FROM pgsql.freefs.public.sys_user"#;

    let result = driver.execute_query(sql.to_string()).await;

    match &result {
        Ok(r) => {
            println!("Query succeeded!");
            println!("Row count: {}", r.row_count);
            println!("Columns: {:?}", r.columns);
            println!("First few rows: {:?}", r.data.iter().take(5).collect::<Vec<_>>());
            assert!(r.row_count >= 4, "Expected at least 4 rows (2 from MySQL + 2 from PostgreSQL)");
        }
        Err(e) => {
            println!("Query failed: {}", e);
            panic!("Query should succeed: {}", e);
        }
    }

    driver.close().await;
}

#[tokio::test]
async fn test_calcite_union_all_fs_file() {
    let driver = create_calcite_driver().await.expect("Failed to create calcite driver");

    let sql = r#"SELECT id, file_name, file_size, created_at FROM mysql.freefs.fs_file
 UNION ALL
 SELECT id, file_name, file_size, created_at FROM pgsql.freefs.public.fs_file"#;

    let result = driver.execute_query(sql.to_string()).await;

    match &result {
        Ok(r) => {
            println!("Query succeeded!");
            println!("Row count: {}", r.row_count);
            println!("Columns: {:?}", r.columns);
            println!("First few rows: {:?}", r.data.iter().take(5).collect::<Vec<_>>());
            assert!(r.row_count >= 4, "Expected at least 4 rows (2 from MySQL + 2 from PostgreSQL)");
        }
        Err(e) => {
            println!("Query failed: {}", e);
            panic!("Query should succeed: {}", e);
        }
    }

    driver.close().await;
}

#[tokio::test]
async fn test_calcite_union_with_join() {
    let driver = create_calcite_driver().await.expect("Failed to create calcite driver");

    let sql = r#"SELECT r.id, r.role_name, m.menu_name FROM mysql.freefs.sys_role r
 JOIN mysql.freefs.sys_menu m ON r.id = m.role_id
 UNION
 SELECT r.id, r.role_name, m.menu_name FROM pgsql.freefs.public.sys_role r
 JOIN pgsql.freefs.public.sys_menu m ON r.id = m.role_id"#;

    let result = driver.execute_query(sql.to_string()).await;

    match &result {
        Ok(r) => {
            println!("Query succeeded!");
            println!("Row count: {}", r.row_count);
            println!("Columns: {:?}", r.columns);
            println!("First few rows: {:?}", r.data.iter().take(5).collect::<Vec<_>>());
            assert!(r.row_count >= 3, "Expected at least 3 rows from JOIN queries");
        }
        Err(e) => {
            println!("Query failed: {}", e);
            panic!("Query should succeed: {}", e);
        }
    }

    driver.close().await;
}

#[tokio::test]
async fn test_calcite_minus_query() {
    let driver = create_calcite_driver().await.expect("Failed to create calcite driver");

    let sql = r#"SELECT id, dept_name FROM mysql.freefs.sys_dept
 MINUS
 SELECT id, dept_name FROM pgsql.freefs.public.sys_dept"#;

    let result = driver.execute_query(sql.to_string()).await;

    match &result {
        Ok(r) => {
            println!("Query succeeded!");
            println!("Row count: {}", r.row_count);
            println!("Columns: {:?}", r.columns);
            println!("Rows: {:?}", r.data);
            assert!(r.row_count >= 2, "Expected at least 2 rows (IT and HR from MySQL)");
        }
        Err(e) => {
            println!("Query failed: {}", e);
            panic!("Query should succeed: {}", e);
        }
    }

    driver.close().await;
}

#[tokio::test]
async fn test_calcite_union_dict_data() {
    let driver = create_calcite_driver().await.expect("Failed to create calcite driver");

    let sql = r#"SELECT dict_type, dict_label, dict_value FROM mysql.freefs.sys_dict_data
 UNION
 SELECT dict_type, dict_label, dict_value FROM pgsql.freefs.public.sys_dict_data"#;

    let result = driver.execute_query(sql.to_string()).await;

    match &result {
        Ok(r) => {
            println!("Query succeeded!");
            println!("Row count: {}", r.row_count);
            println!("Columns: {:?}", r.columns);
            println!("All rows: {:?}", r.data);
            assert!(r.row_count >= 4, "Expected at least 4 distinct dict entries");
        }
        Err(e) => {
            println!("Query failed: {}", e);
            panic!("Query should succeed: {}", e);
        }
    }

    driver.close().await;
}

#[tokio::test]
async fn test_calcite_union_all_subscription_plan() {
    let driver = create_calcite_driver().await.expect("Failed to create calcite driver");

    let sql = r#"SELECT plan_id, plan_name, price FROM mysql.freefs.subscription_plan
 UNION ALL
 SELECT plan_id, plan_name, price FROM pgsql.freefs.public.subscription_plan"#;

    let result = driver.execute_query(sql.to_string()).await;

    match &result {
        Ok(r) => {
            println!("Query succeeded!");
            println!("Row count: {}", r.row_count);
            println!("Columns: {:?}", r.columns);
            println!("All rows: {:?}", r.data);
            assert!(r.row_count >= 4, "Expected at least 4 rows (2 from MySQL + 2 from PostgreSQL)");
        }
        Err(e) => {
            println!("Query failed: {}", e);
            panic!("Query should succeed: {}", e);
        }
    }

    driver.close().await;
}

#[tokio::test]
async fn test_calcite_intersect_query() {
    let driver = create_calcite_driver().await.expect("Failed to create calcite driver");

    let sql = r#"SELECT config_key, config_value FROM mysql.freefs.sys_oss_config
 INTERSECT
 SELECT config_key, config_value FROM pgsql.freefs.public.sys_oss_config"#;

    let result = driver.execute_query(sql.to_string()).await;

    match &result {
        Ok(r) => {
            println!("Query succeeded!");
            println!("Row count: {}", r.row_count);
            println!("Columns: {:?}", r.columns);
            println!("All rows: {:?}", r.data);
            assert!(r.row_count >= 1, "Expected at least 1 row (endpoint config)");
        }
        Err(e) => {
            println!("Query failed: {}", e);
            panic!("Query should succeed: {}", e);
        }
    }

    driver.close().await;
}

#[tokio::test]
async fn test_calcite_union_all_user_quota_usage() {
    let driver = create_calcite_driver().await.expect("Failed to create calcite driver");

    let sql = r#"SELECT user_id, used_quota, total_quota FROM mysql.freefs.user_quota_usage
 UNION ALL
 SELECT user_id, used_quota, total_quota FROM pgsql.freefs.public.user_quota_usage"#;

    let result = driver.execute_query(sql.to_string()).await;

    match &result {
        Ok(r) => {
            println!("Query succeeded!");
            println!("Row count: {}", r.row_count);
            println!("Columns: {:?}", r.columns);
            println!("All rows: {:?}", r.data);
            assert!(r.row_count >= 2, "Expected at least 2 rows (1 from MySQL + 1 from PostgreSQL)");
        }
        Err(e) => {
            println!("Query failed: {}", e);
            panic!("Query should succeed: {}", e);
        }
    }

    driver.close().await;
}

#[tokio::test]
async fn test_calcite_complex_join_union() {
    let driver = create_calcite_driver().await.expect("Failed to create calcite driver");

    let sql = r#"SELECT u.id, u.username, r.role_name, d.dept_name
 FROM mysql.freefs.sys_user u
 JOIN mysql.freefs.sys_role r ON u.role_id = r.id
 JOIN mysql.freefs.sys_dept d ON u.dept_id = d.id
 UNION ALL
 SELECT u.id, u.username, r.role_name, d.dept_name
 FROM pgsql.freefs.public.sys_user u
 JOIN pgsql.freefs.public.sys_role r ON u.role_id = r.id
 JOIN pgsql.freefs.public.sys_dept d ON u.dept_id = d.id"#;

    let result = driver.execute_query(sql.to_string()).await;

    match &result {
        Ok(r) => {
            println!("Query succeeded!");
            println!("Row count: {}", r.row_count);
            println!("Columns: {:?}", r.columns);
            println!("All rows: {:?}", r.data);
            assert!(r.row_count >= 2, "Expected at least 2 rows from complex JOIN queries");
        }
        Err(e) => {
            println!("Query failed: {}", e);
            panic!("Query should succeed: {}", e);
        }
    }

    driver.close().await;
}