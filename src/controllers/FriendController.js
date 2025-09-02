const Router = require('koa-router');
const FriendService = require('../services/FriendService');
const UserService = require('../services/UserService');
const router = new Router();

// 发送好友请求
router.post('/request', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const { phone } = ctx.request.body;
    
    if (!phone) {
      ctx.status = 400;
      ctx.body = { success: false, message: '手机号不能为空' };
      return;
    }

    const result = await FriendService.sendFriendRequest(userId, phone);
    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    console.error('发送好友请求失败:', error);
    ctx.status = 400;
    ctx.body = { success: false, message: error.message || '发送好友请求失败' };
  }
});

// 接受好友请求
router.post('/accept/:friendId', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const friendId = ctx.params.friendId;
    
    if (!friendId) {
      ctx.status = 400;
      ctx.body = { success: false, message: '好友ID不能为空' };
      return;
    }

    const result = await FriendService.acceptFriendRequest(userId, friendId);
    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    console.error('接受好友请求失败:', error);
    ctx.status = 400;
    ctx.body = { success: false, message: error.message || '接受好友请求失败' };
  }
});

// 拒绝好友请求
router.post('/reject/:friendId', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const friendId = ctx.params.friendId;
    
    if (!friendId) {
      ctx.status = 400;
      ctx.body = { success: false, message: '好友ID不能为空' };
      return;
    }

    const result = await FriendService.rejectFriendRequest(userId, friendId);
    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    console.error('拒绝好友请求失败:', error);
    ctx.status = 400;
    ctx.body = { success: false, message: error.message || '拒绝好友请求失败' };
  }
});

// 删除好友
router.delete('/:friendId', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const friendId = ctx.params.friendId;
    
    if (!friendId) {
      ctx.status = 400;
      ctx.body = { success: false, message: '好友ID不能为空' };
      return;
    }

    const result = await FriendService.deleteFriend(userId, friendId);
    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    console.error('删除好友失败:', error);
    ctx.status = 400;
    ctx.body = { success: false, message: error.message || '删除好友失败' };
  }
});

// 更新好友备注
router.put('/:friendId/remark', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const friendId = ctx.params.friendId;
    const { remark } = ctx.request.body;
    
    if (!friendId) {
      ctx.status = 400;
      ctx.body = { success: false, message: '好友ID不能为空' };
      return;
    }

    const result = await FriendService.updateFriendRemark(userId, friendId, remark);
    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    console.error('更新好友备注失败:', error);
    ctx.status = 400;
    ctx.body = { success: false, message: error.message || '更新好友备注失败' };
  }
});

// 获取好友请求列表
router.get('/requests', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const requests = await FriendService.getFriendRequests(userId);
    ctx.status = 200;
    ctx.body = { success: true, requests };
  } catch (error) {
    console.error('获取好友请求列表失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '获取好友请求列表失败' };
  }
});

// 获取好友列表
router.get('/list', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const friends = await UserService.getUserFriends(userId);
    ctx.status = 200;
    ctx.body = { success: true, friends };
  } catch (error) {
    console.error('获取好友列表失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '获取好友列表失败' };
  }
});

// 搜索潜在好友
router.get('/search', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const { keyword } = ctx.query;
    
    if (!keyword) {
      ctx.status = 400;
      ctx.body = { success: false, message: '搜索关键词不能为空' };
      return;
    }

    const users = await FriendService.searchPotentialFriends(userId, keyword);
    ctx.status = 200;
    ctx.body = { success: true, users };
  } catch (error) {
    console.error('搜索潜在好友失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '搜索用户失败' };
  }
});

// 检查好友关系状态
router.get('/status/:targetId', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const targetId = ctx.params.targetId;
    
    if (!targetId) {
      ctx.status = 400;
      ctx.body = { success: false, message: '目标用户ID不能为空' };
      return;
    }

    const status = await FriendService.checkFriendStatus(userId, targetId);
    ctx.status = 200;
    ctx.body = { success: true, status };
  } catch (error) {
    console.error('检查好友关系状态失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '检查好友关系失败' };
  }
});

module.exports = router;