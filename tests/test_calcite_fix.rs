use dbpaw::db::drivers::calcite::CalciteDriver;
use dbpaw::db::drivers::ConnectionForm;

#[tokio::test]
async fn test_calcite_query_with_alias() {
    let calcite_driver = CalciteDriver::connect(&ConnectionForm::default()).await.unwrap();
    
    // 测试生成查询的函数
    let test_cases = vec![
        ("SELECT * FROM mySQL.freefs.file_share_access_record LIMIT 100;", "mysql", "freefs", "public", "file_share_access_record", "mysql", "SELECT * FROM `freefs`.`file_share_access_record` LIMIT 100;"),
        ("SELECT * FROM freefs.file_share_access_record LIMIT 100;", "mysql", "", "freefs", "file_share_access_record", "mysql", "SELECT * FROM `freefs`.`file_share_access_record` LIMIT 100;"),
        ("SELECT * FROM mySQL.file_share_access_record LIMIT 100;", "mysql", "", "", "file_share_access_record", "mysql", "SELECT * FROM `file_share_access_record` LIMIT 100;"),
    ];
    
    for (sql, alias, database, schema, table, driver_type, expected) in test_cases {
        let result = calcite_driver.generate_query(sql, alias, database, schema, table, driver_type);
        println!("Input: {}", sql);
        println!("Expected: {}", expected);
        println!("Result: {}", result);
        println!("Match: {}", result == expected);
        println!();
    }
}
