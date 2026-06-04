# OldNewHub 项目全栈技术文档

## 1. 项目简介
OldNewHub 是一个专为大学校园设计的**全栈二手交易平台**。它允许学生注册账号、发布闲置物品（包括上传图片）、浏览他人发布的物品，并由管理员进行审核，确保平台内容的质量。

---

## 2. 技术栈
### 后端 (Backend)
- **框架**: Spring Boot 3.3.0
- **安全**: Spring Security (基于 HttpBasic 和自定义 Role 权限)
- **数据**: Spring Data JPA + MySQL
- **工具**: Lombok (简化代码), Jackson (处理 JSON 数据)
- **环境**: Java 17

### 前端 (Frontend)
- **框架**: React 19
- **构建**: Vite
- **样式**: 原生 CSS (Vanilla CSS)
- **通信**: Fetch API

---

## 3. 后端架构详解 (`backend/`)

后端采用了典型的 **Controller-Service-Repository-Entity** 四层架构。

### 3.1 核心配置 (`config/`)
- **SecurityConfig.java**:
  - **功能**: 负责系统的“安保工作”。
  - **关键逻辑**: 
    - 开放 `/api/auth/**` (登录注册) 和 `/api/items/public/**` (公开列表)。
    - 限制 `/api/admin/**` 仅限 `ADMIN` 角色访问。
    - 禁用 CSRF 以便测试，配置 `BCryptPasswordEncoder` 用于密码加密存储。
- **WebConfig.java**:
  - **功能**: 静态资源映射。
  - **逻辑**: 将 URL 中的 `/Assets/**` 路径映射到服务器本地的图片存储目录，方便前端直接通过 URL 访问上传的图片。

### 3.2 控制层 (`controller/`)
- **AuthController.java**: 处理用户的登录和注册请求。
- **ItemController.java**: 
  - `upload`: 采用 `multipart/form-data` 接收图片和 JSON 格式的物品信息。
  - `updatePrice`: 包含业务逻辑，如果改价超过 25%，物品状态会变回 `PENDING` (待审核)。
- **FileController.java**: 自定义的文件读取接口，增加了一层安全性（验证路径、文件类型），用于返回用户上传的图片流。

### 3.3 业务逻辑层 (`service/`)
- **ItemService.java**: 
  - 处理物品上传时的图片保存逻辑（生成唯一 UUID 文件名，防止重名覆盖）。
  - 包含复杂的改价审核判断逻辑。
  - 实现基于类别或关键词的搜索功能。

### 3.4 数据模型 (`entity/` & `repository/`)
- **Entity**: 对应数据库表。例如 `User` 有角色（USER/ADMIN），`Item` 有状态（PENDING/APPROVED/REMOVED）。
- **Repository**: 继承自 `JpaRepository`，无需写 SQL 即可实现基本的增删改查（CRUD）。

---

## 4. 前端架构详解 (`frontend/`)

### 4.1 核心逻辑 (`App.jsx`)
整个前端是一个**单页应用 (SPA)**，通过 `useState` 管理“视图 (view)”切换。

- **状态管理**: 
  - `view`: 控制当前显示哪个页面（如 `home`, `list`, `login`, `admin-audit` 等）。
  - `items` / `myItems`: 存储从后端获取的数据。
- **生命周期 (`useEffect`)**: 
  - 页面加载时自动从 `localStorage` 读取登录状态。
  - 监听 `view` 的变化，进入特定页面时自动触发数据请求（如进入“广场”时调用 `fetchItems`）。
- **组件说明**:
  - **Navbar**: 导航栏，根据登录状态和权限（是否为管理员）显示不同按钮。
  - **Dashboard**: 个人中心，显示统计数据和快捷操作。
  - **Admin Audit**: 管理员审核界面，采用类似“翻页书”的布局，方便管理员快速审批。

### 4.2 交互逻辑
- **文件上传**: 通过 `FormData` 对象包装图片二进制文件和 JSON 字符串，发送给后端。
- **改价逻辑**: 用户修改价格时，前端会通过 `prompt` 询问新价格，并根据涨跌幅自动提示用户是否需要输入改价理由。

---

## 5. 核心业务流程 (对学生的学习建议)

### 5.1 注册与登录
1. 前端发送用户名密码。
2. 后端验证成功后返回身份信息（Role）。
3. 前端将 Token 和权限存入 `localStorage`，后续所有请求都在 Header 中带上 `Authorization`。

### 5.2 物品发布与审核
1. 用户上传图片和信息，状态默认为 `PENDING`。
2. 管理员进入“管理中心”，调用 `/api/items/admin/all` 获取所有物品，筛选出待审核项。
3. 管理员点击“通过”或“拒绝”，后端更新数据库状态。
4. 状态变为 `APPROVED` 后，物品才会出现在“广场”公开列表中。

### 5.3 图片存储与显示
1. **上传**: 图片保存在 `backend/src/main/resources/Assets/` 下（注意：生产环境通常会指定绝对路径，本项目为了方便学习放在了资源文件夹下）。
2. **显示**: 后端通过 `WebConfig` 或 `FileController` 将图片路径暴露出来，前端像引用外部链接一样使用 `<img>` 标签。

---

## 6. 如何运行
1. **数据库**: 执行项目根目录下的 `seed.sql` 初始化数据库。
2. **后端**: 确保 `application.properties` 中的数据库配置正确，运行 `OldNewHubApplication.java`。
3. **前端**: 进入 `frontend/` 目录，执行 `npm install` 然后 `npm run dev`。

希望这份文档能帮助你快速理解项目的全貌！如有疑问，请查看代码中的详细注释。
