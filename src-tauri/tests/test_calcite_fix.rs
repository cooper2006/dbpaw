use dbpaw_lib::db::drivers::{calcite::CalciteDriver, DatabaseDriver};
use dbpaw_lib::models::ConnectionForm;

#[tokio::test]
async fn test_calcite_query_with_alias() {
    let calcite_driver = CalciteDriver::connect(&ConnectionForm::default()).await.unwrap();
    
    // 测试 SQL 解析和生成
    let test_sql = "SELECT * FROM mySQL.freefs.file_share_access_record LIMIT 100;";
    
    println!("Testing SQL: {}", test_sql);
    
    // 直接测试 execute_query 方法
    match calcite_driver.execute_query(test_sql.to_string()).await {
        Ok(result) => {
            println!("Query executed successfully!");
            println!("Row count: {}", result.row_count);
            println!("Columns: {:?}", result.columns);
        }
        Err(e) => {
            println!("Query failed with error: {}", e);
            // 我们期望查询失败，因为我们没有实际的数据库连接
            // 但我们不期望出现 SQL 语法错误
            assert!(!e.contains("syntax error"), "Query should not fail with syntax error");
            assert!(!e.contains("near '.file_share_access_record'"), "Query should not fail with table reference error");
        }
    }
    
    println!("Test completed successfully!");
}