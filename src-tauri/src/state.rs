use crate::db::local::LocalDb;
use crate::db::pool_manager::PoolManager;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct AppState {
    pub local_db: Mutex<Option<Arc<LocalDb>>>,
    pub pool_manager: Arc<PoolManager>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            local_db: Mutex::new(None),
            pool_manager: Arc::new(PoolManager::new()),
        }
    }
}

pub type SharedAppState = Arc<AppState>;

pub fn new_shared_app_state() -> SharedAppState {
    Arc::new(AppState::new())
}
