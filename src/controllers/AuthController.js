const Router = require('koa-router');
const AuthService = require('../services/AuthService');
const router = new Router();

// 发送验证码
router.post('/send-verification-code', async (ctx) => {
  try {
    const { phone } = ctx.request.body;
    
    if (!phone) {
      ctx.status = 400;
      ctx.body = { success: false, message: '手机号不能为空' };
      return;
    }

    const result = await AuthService.sendVerificationCode(phone);
    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    console.error('发送验证码失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '发送验证码失败' };
  }
});

// 验证验证码并登录/注册
router.post('/verify-code', async (ctx) => {
  try {
    const { phone, code } = ctx.request.body;
    
    if (!phone || !code) {
      ctx.status = 400;
      ctx.body = { success: false, message: '手机号和验证码不能为空' };
      return;
    }

    const result = await AuthService.verifyCode(phone, code);
    
    if (result.success) {
      ctx.status = 200;
      ctx.body = {
        success: true,
        user: result.user,
        token: result.token,
        message: '登录成功'
      };
    } else {
      ctx.status = 400;
      ctx.body = result;
    }
  } catch (error) {
    console.error('验证码验证失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '验证失败' };
  }
});

// 刷新token
router.post('/refresh-token', async (ctx) => {
  try {
    const token = ctx.headers.authorization?.split(' ')[1];
    
    if (!token) {
      ctx.status = 401;
      ctx.body = { success: false, message: '未提供token' };
      return;
    }

    const result = await AuthService.refreshToken(token);
    
    if (result.success) {
      ctx.status = 200;
      ctx.body = result;
    } else {
      ctx.status = 401;
      ctx.body = result;
    }
  } catch (error) {
    console.error('刷新token失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '刷新token失败' };
  }
});

module.exports = router;