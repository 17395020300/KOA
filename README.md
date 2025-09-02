# Node.js 聊天室系统（KOA2）

一个基于 Node.js + KOA2 + WebSocket 的聊天系统，支持手机号验证码登录、好友关系管理和实时消息通信。

## 功能特性

### 账号系统
- 手机号 + 验证码注册/登录
- 头像、昵称修改

### 好友关系
- 搜索手机号添加好友
- 好友列表管理
- 好友备注名设置
- 好友请求处理（接受/拒绝）

### 消息功能
- 文本消息、Emoji 支持
- 消息状态跟踪（已发送/已送达/已读）
- 消息撤回（2分钟内）
- 离线消息存储与推送

### 技术实现
- WebSocket 长连接实现实时通信
- MySQL 存储用户信息和好友关系
- Redis 存储离线消息
- JWT 身份认证
- 支持 HTTPS + WSS 加密通信

## 项目结构

```
├── app.js                 # 应用入口文件
├── package.json           # 项目依赖和配置
├── .env                   # 环境变量配置
├── .gitignore             # Git忽略文件配置
├── src/                   # 源代码目录
│   ├── config/            # 配置文件
│   │   ├── database.js    # 数据库配置
│   │   ├── redis.js       # Redis配置
│   │   └── websocket.js   # WebSocket配置
│   ├── models/            # 数据模型
│   │   ├── User.js        # 用户模型
│   │   ├── Friend.js      # 好友关系模型
│   │   └── Message.js     # 消息模型
│   ├── services/          # 业务逻辑层
│   │   ├── AuthService.js # 认证服务
│   │   ├── UserService.js # 用户服务
│   │   ├── FriendService.js # 好友服务
│   │   └── MessageService.js # 消息服务
│   ├── controllers/       # 控制器层
│   │   ├── AuthController.js # 认证控制器
│   │   ├── UserController.js # 用户控制器
│   │   ├── FriendController.js # 好友控制器
│   │   └── MessageController.js # 消息控制器
│   └── routes/            # 路由配置
│       └── index.js       # 主路由文件
└── public/                # 静态资源目录
```

## 环境要求

- Node.js >= 14.0.0
- MySQL >= 5.7
- Redis >= 5.0

## 安装配置

### 1. 克隆项目代码

```bash
git clone <项目仓库地址>
cd chat-system-koa
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

项目根目录下已经包含了 `.env` 文件，请根据您的实际环境修改配置：

```bash
# 服务器配置
PORT=3000
HOST=localhost

# 数据库配置 - 请根据您的MySQL实际配置修改
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD= # 如果MySQL没有设置密码，请留空
DB_NAME=chat_system

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD= # 如果Redis没有设置密码，请留空

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# HTTPS配置（可选）
# HTTPS_KEY=./ssl/key.pem
# HTTPS_CERT=./ssl/cert.pem
```

### 4. 配置MySQL数据库

请确保MySQL服务器已启动，并根据您的配置情况执行以下操作：

- **设置root密码**：如果您的MySQL没有设置root密码，可以使用以下命令设置：
  ```bash
  mysqladmin -u root password "your_new_password"
  ```

- **创建数据库用户**（推荐，替代使用root用户）：
  ```sql
  CREATE USER 'chat_user'@'localhost' IDENTIFIED BY 'your_password';
  CREATE DATABASE chat_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  GRANT ALL PRIVILEGES ON chat_system.* TO 'chat_user'@'localhost';
  FLUSH PRIVILEGES;
  ```
  然后在 `.env` 文件中使用新创建的用户名和密码。

### 5. 启动Redis服务

确保Redis服务器已启动并正常运行。您可以使用以下命令启动Redis：

```bash
redis-server
```

### 6. 测试数据库连接（可选但推荐）

如果您遇到数据库连接问题，可以使用我们提供的测试工具来诊断问题：

```bash
npm run test-db
```

这个工具会检查您的数据库配置是否正确，并提供具体的错误信息和解决建议。

### 7. 初始化数据库

运行数据库迁移脚本，创建表结构并添加测试数据：

```bash
npm run migrate
```

## 运行项目

### 开发模式

```bash
npm run dev
```

### 生产模式

```bash
npm start
```

## API 接口说明

### 认证相关
- POST `/api/auth/send-verification-code` - 发送验证码
- POST `/api/auth/verify-code` - 验证验证码并登录/注册
- POST `/api/auth/refresh-token` - 刷新Token

### 用户相关
- GET `/api/user/profile` - 获取当前用户信息
- PUT `/api/user/profile` - 更新用户信息
- POST `/api/user/avatar` - 更新用户头像
- POST `/api/user/nickname` - 更新用户昵称
- GET `/api/user/search` - 搜索用户
- GET `/api/user/:userId` - 获取用户详情

### 好友相关
- POST `/api/friend/request` - 发送好友请求
- POST `/api/friend/accept/:friendId` - 接受好友请求
- POST `/api/friend/reject/:friendId` - 拒绝好友请求
- DELETE `/api/friend/:friendId` - 删除好友
- PUT `/api/friend/:friendId/remark` - 更新好友备注
- GET `/api/friend/requests` - 获取好友请求列表
- GET `/api/friend/list` - 获取好友列表
- GET `/api/friend/search` - 搜索潜在好友

### 消息相关
- GET `/api/message/history/:friendId` - 获取聊天记录
- POST `/api/message/read/:friendId` - 标记消息为已读
- GET `/api/message/unread-count` - 获取未读消息数量
- GET `/api/message/conversations` - 获取会话列表
- POST `/api/message/recall/:messageId` - 撤回消息

## WebSocket 使用说明

客户端需要连接到 `/ws` 路径，并在请求头中携带 JWT Token 进行身份验证。

### 消息类型

#### 客户端发送
- `text_message` - 发送文本消息
- `message_read` - 标记消息已读
- `message_recall` - 撤回消息

#### 服务端推送
- `new_message` - 新消息通知
- `message_sent` - 消息发送确认
- `message_read` - 消息已读通知
- `message_recalled` - 消息撤回通知
- `recall_success` - 消息撤回成功
- `recall_failed` - 消息撤回失败

## 部署说明

### 单台云服务器部署

1. 安装 Node.js、MySQL、Redis
2. 配置环境变量
3. 启动应用（建议使用 PM2 进行进程管理）

```bash
npm install -g pm2
pm run build # 如果有构建步骤
pm start
```

### HTTPS 配置

1. 获取 SSL 证书
2. 配置 `.env` 文件中的 HTTPS_KEY 和 HTTPS_CERT
3. 修改 `app.js` 以支持 HTTPS

## 客户端开发

系统支持 iOS 和 Android 双端壳子，可以使用 Flutter 或 React Native 进行开发。客户端需要实现以下功能：

1. WebSocket 连接管理
2. 用户认证流程
3. 好友管理界面
4. 聊天界面与消息处理
5. 消息状态展示
6. 离线消息处理

## 注意事项

1. 短信验证码功能需要接入实际的短信服务商API
2. 生产环境中请确保 JWT_SECRET 等敏感信息的安全
3. 建议为生产环境配置 HTTPS 和 WSS
4. 大规模部署时考虑使用负载均衡和集群架构