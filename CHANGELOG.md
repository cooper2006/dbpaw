## [unreleased]

### 🚀 Features

- *(DataGrid)* Add right-click copy function to table view
- *(theme)* Apply a warm theme style to the dark mode editor
- *(SqlEditor)* Supports executing selected SQL fragments and optimizing save logic
## [0.1.1] - 2026-02-23

### 🚀 Features

- 添加应用菜单和设置事件监听

### 🐛 Bug Fixes

- *(ssh)* 验证SSH和目标端口范围并添加单元测试

### 📚 Documentation

- 更新 README 以反映项目重命名为 DbPaw

### ⚙️ Miscellaneous Tasks

- Update version to 0.1.1
## [0.1.0] - 2026-02-23

### 🚀 Features

- 初始化 Tauri + React 桌面数据库管理应用
- *(ui)* 更新应用图标并实现从后端获取连接列表
- *(ui)* 引入 shadcn/ui 组件库并重构服务层
- *(侧边栏)* 支持通过连接ID获取数据库列表和表列表
- 增强数据库表数据浏览功能并改进类型处理
- *(TableView)* 添加列宽调整和右键菜单功能
- Delect-side-icon
- *(Sidebar)* 为数据库侧边栏添加数据库右键菜单
- 实现多标签查询编辑器和数据库切换功能
- *(ui)* 为 ResizableHandle 组件添加可选的视觉手柄
- *(metadata)* 新增查看表结构DDL功能
- 实现SQL编辑器受控状态和DDL缓存刷新
- 新增主题系统与持久化设置支持
- *(sql编辑器)* 替换 Monaco 为 CodeMirror 并添加 SQL 自动补全和格式化功能
- *(SqlEditor)* 添加全局列和表自动补全支持
- *(DataGrid)* Add sorting functionality to table view
- *(App)* Add TableMetadataView and DDL handling
- *(TableView)* Enhance cell editing and data refresh functionality
- *(DatabaseSidebar)* Enhance table handling and metadata fetching
- *(App, TableView, API)* Implement filtering and ordering functionality
- *(ui)* 为标签页添加右键菜单并改进占位符
- *(数据库连接)* 为 PostgreSQL 和 MySQL 驱动程序添加 SSL 支持
- 将界面文本从中文切换为英文
- *(mock)* Add mock data support for independent frontend development
- 新增保存和加载查询功能
- 添加全局快捷键和编辑器保存快捷键
- 为保存的查询添加数据库字段支持并改进错误处理
- *(mocks)* 添加已保存查询的模拟数据和服务
- 支持在保存查询时编辑描述
- 集成自定义标题栏并改进数据库迁移逻辑
- 更新应用图标并优化侧边栏UI样式
- *(ssh)* 支持通过 SSH 隧道连接数据库

### 🐛 Bug Fixes

- 修复主题加载闪烁并改进错误处理
- *(DataGrid)* 修复列宽调整时起始宽度计算不准确的问题
- *(db/sql编辑器)* 修复数据库驱动列索引错误并增强调试日志
- 移除调试日志并改进数据库模式获取的错误处理
- Resolve unused variables in mocks.ts for CI build
- Resolve ubuntu dependency conflict

### 🚜 Refactor

- *(services)* 将 mock 数据中的 driver 字段统一重命名为 dbType
- 移除数据库侧边栏组件并优化标签激活逻辑

### 🎨 Styling

- *(ui)* 优化侧边栏和标签页的交互样式
- *(ui)* 为标签页触发器添加右侧边框并调整最后一个项
- *(DataGrid)* 移除表格最小宽度限制并添加刷新图标
- *(ui)* 调整侧边栏及标签页的内边距和高度以优化视觉一致性

### ⚙️ Miscellaneous Tasks

- 重命名项目为DbPaw并添加连接名称字段
- 添加 GitHub Actions 发布工作流
