const Router = require('koa-router');
const jwt = require('koa-jwt');
const authController = require('../controllers/AuthController');
const userController = require('../controllers/UserController');
const friendController = require('../controllers/FriendController');
const messageController = require('../controllers/MessageController');

const router = new Router();

// 不需要认证的路由
router.use('/api/auth', authController.routes(), authController.allowedMethods());

// JWT认证中间件
const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  passthrough: false,
}).unless({
  path: [
    '/api/auth/send-verification-code',
    '/api/auth/verify-code',
    '/api/auth/refresh-token',
    // 静态资源
    /^\/public\//,
  ],
});

// 应用JWT认证中间件
router.use(jwtMiddleware);

// 处理JWT错误
router.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    if (error.name === 'UnauthorizedError') {
      ctx.status = 401;
      ctx.body = { success: false, message: '未授权，请重新登录' };
    } else {
      throw error;
    }
  }
});

// 需要认证的路由
router.use('/api/user', userController.routes(), userController.allowedMethods());
router.use('/api/friend', friendController.routes(), friendController.allowedMethods());
router.use('/api/message', messageController.routes(), messageController.allowedMethods());

// 404 路由
router.use(async (ctx) => {
  ctx.status = 404;
  ctx.body = { success: false, message: 'API不存在' };
});

module.exports = router;