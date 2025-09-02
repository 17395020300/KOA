const dotenv = require('dotenv');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const static = require('koa-static');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');

// 加载环境变量
require('dotenv').config();

// 检查是否有环境变量文件
if (!fs.existsSync('./.env')) {
    console.error('错误：.env 文件不存在，请先创建 .env 文件并配置数据库信息');
    console.error('提示：首次运行请执行 npm run migrate 来初始化数据库');
    process.exit(1);
}

// 创建Koa应用实例
const app = new Koa();
const PORT = process.env.PORT || 3000;

// 注意：数据库配置会在startServer函数内部导入和初始化

// 导入WebSocket配置
const { createWebSocketServer } = require('./src/config/websocket');

// 导入路由
const router = require('./src/routes');

// 配置中间件
app.use(bodyParser());
app.use(static(path.join(__dirname, 'public')));

// 使用路由
app.use(router.routes()).use(router.allowedMethods());

// 错误处理中间件
app.on('error', (err, ctx) => {
    console.error('服务器错误:', err);
    ctx && (ctx.status = 500);
    ctx && (ctx.body = { success: false, message: '服务器内部错误' });
});

// 创建HTTP服务器
const server = http.createServer(app.callback());

// 如果配置了HTTPS，创建HTTPS服务器
let httpsServer = null;
if (process.env.HTTPS_KEY && process.env.HTTPS_CERT) {
    try {
        const httpsOptions = {
            key: fs.readFileSync(process.env.HTTPS_KEY),
            cert: fs.readFileSync(process.env.HTTPS_CERT)
        };
        httpsServer = https.createServer(httpsOptions, app.callback());
    } catch (error) {
        console.error('HTTPS配置错误:', error);
    }
}

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库连接
    const { initializeDatabase } = require('./src/config/database');
    const sequelize = await initializeDatabase();
    
    // 同步数据库模型
    await sequelize.sync({ alter: true });
    console.log('数据库模型已同步');
    
    // 启动HTTP服务器
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // 如果有HTTPS服务器，启动它
    if (httpsServer) {
        const HTTPS_PORT = process.env.HTTPS_PORT || 443;
        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
        });
    }
    
    // 创建WebSocket服务器
    createWebSocketServer(server);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;