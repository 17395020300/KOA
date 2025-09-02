const Router = require('koa-router');
const UserService = require('../services/UserService');
const router = new Router();

// 获取当前用户信息
router.get('/profile', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const user = await UserService.getUserById(userId);
    
    if (!user) {
      ctx.status = 404;
      ctx.body = { success: false, message: '用户不存在' };
      return;
    }

    ctx.status = 200;
    ctx.body = { success: true, user };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '获取用户信息失败' };
  }
});

// 更新用户信息
router.put('/profile', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const userData = ctx.request.body;
    
    const updatedUser = await UserService.updateUser(userId, userData);
    
    if (!updatedUser) {
      ctx.status = 404;
      ctx.body = { success: false, message: '用户不存在' };
      return;
    }

    ctx.status = 200;
    ctx.body = { success: true, user: updatedUser, message: '更新成功' };
  } catch (error) {
    console.error('更新用户信息失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '更新用户信息失败' };
  }
});

// 更新用户头像
router.post('/avatar', async (ctx) => {
  try {
    // 注意：实际项目中需要处理文件上传
    // 这里简化处理，假设前端直接传递头像URL
    const userId = ctx.state.user.id;
    const { avatarUrl } = ctx.request.body;
    
    if (!avatarUrl) {
      ctx.status = 400;
      ctx.body = { success: false, message: '头像URL不能为空' };
      return;
    }

    const updatedUser = await UserService.updateAvatar(userId, avatarUrl);
    
    if (!updatedUser) {
      ctx.status = 404;
      ctx.body = { success: false, message: '用户不存在' };
      return;
    }

    ctx.status = 200;
    ctx.body = { success: true, user: updatedUser, message: '头像更新成功' };
  } catch (error) {
    console.error('更新用户头像失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '更新用户头像失败' };
  }
});

// 更新用户昵称
router.post('/nickname', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const { nickname } = ctx.request.body;
    
    if (!nickname || nickname.trim() === '') {
      ctx.status = 400;
      ctx.body = { success: false, message: '昵称不能为空' };
      return;
    }

    const updatedUser = await UserService.updateNickname(userId, nickname);
    
    if (!updatedUser) {
      ctx.status = 404;
      ctx.body = { success: false, message: '用户不存在' };
      return;
    }

    ctx.status = 200;
    ctx.body = { success: true, user: updatedUser, message: '昵称更新成功' };
  } catch (error) {
    console.error('更新用户昵称失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '更新用户昵称失败' };
  }
});

// 搜索用户
router.get('/search', async (ctx) => {
  try {
    const { keyword } = ctx.query;
    
    if (!keyword) {
      ctx.status = 400;
      ctx.body = { success: false, message: '搜索关键词不能为空' };
      return;
    }

    const users = await UserService.searchUsers(keyword);
    ctx.status = 200;
    ctx.body = { success: true, users };
  } catch (error) {
    console.error('搜索用户失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '搜索用户失败' };
  }
});

// 获取用户详情（包含好友关系）
router.get('/:userId', async (ctx) => {
  try {
    const currentUserId = ctx.state.user.id;
    const targetUserId = ctx.params.userId;
    
    const userInfo = await UserService.getUserInfoWithRelation(currentUserId, targetUserId);
    
    if (!userInfo) {
      ctx.status = 404;
      ctx.body = { success: false, message: '用户不存在' };
      return;
    }

    ctx.status = 200;
    ctx.body = { success: true, user: userInfo };
  } catch (error) {
    console.error('获取用户详情失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '获取用户详情失败' };
  }
});

module.exports = router;