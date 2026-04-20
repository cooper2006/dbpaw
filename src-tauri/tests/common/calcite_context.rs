mod shared;

use dbpaw_lib::db::drivers::calcite::CalciteDriver;
use dbpaw_lib::db::drivers::DatabaseDriver;
use dbpaw_lib::models::ConnectionForm;
use std::sync::OnceLock;
use std::time::Duration;
use testcontainers::clients::Cli;
use testcontainers::core::WaitFor;
use testcontainers::{Container, GenericImage, RunnableImage};
use tokio::time::sleep;

#[allow(unused_imports)]
pub use shared::{connect_with_retry, should_reuse_local_db, unique_name};

static SHARED_MYSQL_CONTAINER: OnceLock<(&'static Container<'static, GenericImage>, ConnectionForm)> =
    OnceLock::new();

static SHARED_PGSQL_CONTAINER: OnceLock<(&'static Container<'static, GenericImage>, ConnectionForm)> =
    OnceLock::new();

fn mysql_image() -> RunnableImage<GenericImage> {
    let image = GenericImage::new("mysql", "8.0")
        .with_env_var("MYSQL_ROOT_PASSWORD", "123456")
        .with_env_var("MYSQL_ROOT_HOST", "%")
        .with_env_var("MYSQL_DATABASE", "freefs")
        .with_wait_for(WaitFor::seconds(5))
        .with_exposed_port(3306);
    RunnableImage::from(image)
}

fn postgres_image() -> RunnableImage<GenericImage> {
    let image = GenericImage::new("postgres", "15")
        .with_env_var("POSTGRES_PASSWORD", "123456")
        .with_env_var("POSTGRES_USER", "postgres")
        .with_env_var("POSTGRES_DB", "freefs")
        .with_wait_for(WaitFor::seconds(5))
        .with_exposed_port(5432);
    RunnableImage::from(image)
}

fn mysql_form_from_env(host: &str, port: u16) -> ConnectionForm {
    ConnectionForm {
        driver: "mysql".to_string(),
        host: Some(shared::env_or("MYSQL_HOST", host)),
        port: Some(shared::env_i64("MYSQL_PORT", i64::from(port))),
        username: Some(shared::env_or("MYSQL_USER", "root")),
        password: Some(shared::env_or("MYSQL_PASSWORD", "123456")),
        database: Some(shared::env_or("MYSQL_DB", "freefs")),
        ..Default::default()
    }
}

fn postgres_form_from_env(host: &str, port: u16) -> ConnectionForm {
    ConnectionForm {
        driver: "postgres".to_string(),
        host: Some(shared::env_or("PGSQL_HOST", host)),
        port: Some(shared::env_i64("PGSQL_PORT", i64::from(port))),
        username: Some(shared::env_or("PGSQL_USER", "postgres")),
        password: Some(shared::env_or("PGSQL_PASSWORD", "123456")),
        database: Some(shared::env_or("PGSQL_DB", "freefs")),
        ..Default::default()
    }
}

pub fn shared_mysql_form() -> ConnectionForm {
    if should_reuse_local_db() {
        return mysql_form_from_env("localhost", 3306);
    }
    shared::ensure_docker_available();

    let (_container, form) = SHARED_MYSQL_CONTAINER.get_or_init(|| {
        let cli: &'static Cli = Box::leak(Box::new(Cli::default()));
        let runnable = mysql_image()
            .with_container_name(shared::unique_container_name("mysql-calcite"));
        let container: &'static Container<'static, GenericImage> =
            Box::leak(Box::new(cli.run(runnable)));
        let port = container.get_host_port_ipv4(3306);
        shared::wait_for_port("127.0.0.1", port, Duration::from_secs(45));
        (container, mysql_form_from_env("127.0.0.1", port))
    });
    form.clone()
}

pub fn shared_postgres_form() -> ConnectionForm {
    if should_reuse_local_db() {
        return postgres_form_from_env("localhost", 5432);
    }
    shared::ensure_docker_available();

    let (_container, form) = SHARED_PGSQL_CONTAINER.get_or_init(|| {
        let cli: &'static Cli = Box::leak(Box::new(Cli::default()));
        let runnable = postgres_image()
            .with_container_name(shared::unique_container_name("pgsql-calcite"));
        let container: &'static Container<'static, GenericImage> =
            Box::leak(Box::new(cli.run(runnable)));
        let port = container.get_host_port_ipv4(5432);
        shared::wait_for_port("127.0.0.1", port, Duration::from_secs(45));
        (container, postgres_form_from_env("127.0.0.1", port))
    });
    form.clone()
}

pub async fn setup_mysql_tables(mysql_form: &ConnectionForm) -> Result<(), String> {
    let driver: Box<dyn DatabaseDriver> = dbpaw_lib::db::drivers::connect(mysql_form).await?;

    let create_tables_sqls = vec![
        "CREATE TABLE IF NOT EXISTS sys_user (id INT PRIMARY KEY, username VARCHAR(100), email VARCHAR(100), created_at TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS fs_file (id INT PRIMARY KEY, file_name VARCHAR(255), file_size BIGINT, created_at TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS sys_role (id INT PRIMARY KEY, role_name VARCHAR(100))",
        "CREATE TABLE IF NOT EXISTS sys_menu (id INT PRIMARY KEY, role_id INT, menu_name VARCHAR(100))",
        "CREATE TABLE IF NOT EXISTS sys_dept (id INT PRIMARY KEY, dept_name VARCHAR(100))",
        "CREATE TABLE IF NOT EXISTS sys_dict_data (id INT PRIMARY KEY, dict_type VARCHAR(100), dict_label VARCHAR(100), dict_value VARCHAR(100))",
        "CREATE TABLE IF NOT EXISTS subscription_plan (id INT PRIMARY KEY, plan_name VARCHAR(100), price DECIMAL(10,2))",
        "CREATE TABLE IF NOT EXISTS sys_oss_config (id INT PRIMARY KEY, config_key VARCHAR(100), config_value VARCHAR(100))",
        "CREATE TABLE IF NOT EXISTS user_quota_usage (id INT PRIMARY KEY, user_id INT, used_quota BIGINT, total_quota BIGINT)",
    ];

    for sql in create_tables_sqls {
        driver.execute_query(sql.to_string()).await?;
    }

    let insert_data_sqls = vec![
        "INSERT INTO sys_user (id, username, email, created_at) VALUES (1, 'alice', 'alice@example.com', NOW())",
        "INSERT INTO sys_user (id, username, email, created_at) VALUES (2, 'bob', 'bob@example.com', NOW())",
        "INSERT INTO fs_file (id, file_name, file_size, created_at) VALUES (1, 'doc1.pdf', 1024, NOW())",
        "INSERT INTO fs_file (id, file_name, file_size, created_at) VALUES (2, 'doc2.pdf', 2048, NOW())",
        "INSERT INTO sys_role (id, role_name) VALUES (1, 'admin')",
        "INSERT INTO sys_role (id, role_name) VALUES (2, 'user')",
        "INSERT INTO sys_menu (id, role_id, menu_name) VALUES (1, 1, 'dashboard')",
        "INSERT INTO sys_menu (id, role_id, menu_name) VALUES (2, 1, 'settings')",
        "INSERT INTO sys_menu (id, role_id, menu_name) VALUES (3, 2, 'profile')",
        "INSERT INTO sys_dept (id, dept_name) VALUES (1, 'IT')",
        "INSERT INTO sys_dept (id, dept_name) VALUES (2, 'HR')",
        "INSERT INTO sys_dict_data (id, dict_type, dict_label, dict_value) VALUES (1, 'status', 'Active', '1')",
        "INSERT INTO sys_dict_data (id, dict_type, dict_label, dict_value) VALUES (2, 'status', 'Inactive', '0')",
        "INSERT INTO subscription_plan (id, plan_name, price) VALUES (1, 'Basic', 9.99)",
        "INSERT INTO subscription_plan (id, plan_name, price) VALUES (2, 'Premium', 19.99)",
        "INSERT INTO sys_oss_config (id, config_key, config_value) VALUES (1, 'endpoint', 's3.amazonaws.com')",
        "INSERT INTO sys_oss_config (id, config_key, config_value) VALUES (2, 'bucket', 'my-bucket')",
        "INSERT INTO user_quota_usage (id, user_id, used_quota, total_quota) VALUES (1, 1, 1024000, 5242880)",
    ];

    for sql in insert_data_sqls {
        let _ = driver.execute_query(sql.to_string()).await;
    }

    driver.close().await;
    Ok(())
}

pub async fn setup_postgres_tables(pgsql_form: &ConnectionForm) -> Result<(), String> {
    let driver: Box<dyn DatabaseDriver> = dbpaw_lib::db::drivers::connect(pgsql_form).await?;

    let create_tables_sqls = vec![
        "CREATE TABLE IF NOT EXISTS sys_user (id SERIAL PRIMARY KEY, username VARCHAR(100), email VARCHAR(100), created_at TIMESTAMP DEFAULT NOW())",
        "CREATE TABLE IF NOT EXISTS fs_file (id SERIAL PRIMARY KEY, file_name VARCHAR(255), file_size BIGINT, created_at TIMESTAMP DEFAULT NOW())",
        "CREATE TABLE IF NOT EXISTS sys_role (id SERIAL PRIMARY KEY, role_name VARCHAR(100))",
        "CREATE TABLE IF NOT EXISTS sys_menu (id SERIAL PRIMARY KEY, role_id INT, menu_name VARCHAR(100))",
        "CREATE TABLE IF NOT EXISTS sys_dept (id SERIAL PRIMARY KEY, dept_name VARCHAR(100))",
        "CREATE TABLE IF NOT EXISTS sys_dict_data (id SERIAL PRIMARY KEY, dict_type VARCHAR(100), dict_label VARCHAR(100), dict_value VARCHAR(100))",
        "CREATE TABLE IF NOT EXISTS subscription_plan (id SERIAL PRIMARY KEY, plan_name VARCHAR(100), price NUMERIC(10,2))",
        "CREATE TABLE IF NOT EXISTS sys_oss_config (id SERIAL PRIMARY KEY, config_key VARCHAR(100), config_value VARCHAR(100))",
        "CREATE TABLE IF NOT EXISTS user_quota_usage (id SERIAL PRIMARY KEY, user_id INT, used_quota BIGINT, total_quota BIGINT)",
    ];

    for sql in create_tables_sqls {
        driver.execute_query(sql.to_string()).await?;
    }

    let insert_data_sqls = vec![
        "INSERT INTO sys_user (username, email) VALUES ('charlie', 'charlie@example.com')",
        "INSERT INTO sys_user (username, email) VALUES ('david', 'david@example.com')",
        "INSERT INTO fs_file (file_name, file_size) VALUES ('report.pdf', 3072)",
        "INSERT INTO fs_file (file_name, file_size) VALUES ('image.png', 4096)",
        "INSERT INTO sys_role (role_name) VALUES ('manager')",
        "INSERT INTO sys_role (role_name) VALUES ('guest')",
        "INSERT INTO sys_menu (role_id, menu_name) VALUES (3, 'reports')",
        "INSERT INTO sys_menu (role_id, menu_name) VALUES (3, 'analytics')",
        "INSERT INTO sys_menu (role_id, menu_name) VALUES (4, 'help')",
        "INSERT INTO sys_dept (dept_name) VALUES ('Sales')",
        "INSERT INTO sys_dept (dept_name) VALUES ('Marketing')",
        "INSERT INTO sys_dict_data (dict_type, dict_label, dict_value) VALUES ('type', 'VIP', '2')",
        "INSERT INTO sys_dict_data (dict_type, dict_label, dict_value) VALUES ('type', 'Normal', '1')",
        "INSERT INTO subscription_plan (plan_name, price) VALUES ('Enterprise', 99.99)",
        "INSERT INTO subscription_plan (plan_name, price) VALUES ('Trial', 0.00)",
        "INSERT INTO sys_oss_config (config_key, config_value) VALUES ('endpoint', 's3.amazonaws.com')",
        "INSERT INTO sys_oss_config (config_key, config_value) VALUES ('region', 'us-east-1')",
        "INSERT INTO user_quota_usage (user_id, used_quota, total_quota) VALUES (3, 2048000, 10485760)",
    ];

    for sql in insert_data_sqls {
        let _ = driver.execute_query(sql.to_string()).await;
    }

    driver.close().await;
    Ok(())
}

pub async fn create_calcite_driver() -> Result<CalciteDriver, String> {
    let mysql_form = shared_mysql_form();
    let pgsql_form = shared_postgres_form();

    setup_mysql_tables(&mysql_form).await?;
    setup_postgres_tables(&pgsql_form).await?;

    let calcite_form = ConnectionForm {
        driver: "calcite".to_string(),
        name: Some("calcite".to_string()),
        ..Default::default()
    };

    let driver = CalciteDriver::connect(&calcite_form).await?;
    Ok(driver)
}

#[allow(dead_code)]
pub async fn wait_until_ready(form: &ConnectionForm) {
    let mut last_error = String::new();
    for _ in 0..45 {
        match dbpaw_lib::commands::connection::test_connection_ephemeral(form.clone()).await {
            Ok(_) => return,
            Err(err) => {
                last_error = err;
                sleep(Duration::from_secs(1)).await;
            }
        }
    }
    panic!("Database at {}:{} did not become ready in time: {last_error}",
        form.host.as_deref().unwrap_or("?"),
        form.port.unwrap_or(3306));
}