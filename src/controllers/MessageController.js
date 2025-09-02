const Router = require('koa-router');
const MessageService = require('../services/MessageService');
const router = new Router();

// 获取聊天记录
router.get('/history/:friendId', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const friendId = ctx.params.friendId;
    const { limit = 50, offset = 0 } = ctx.query;
    
    if (!friendId) {
      ctx.status = 400;
      ctx.body = { success: false, message: '好友ID不能为空' };
      return;
    }

    const messages = await MessageService.getChatHistory(
      userId, 
      friendId, 
      parseInt(limit), 
      parseInt(offset)
    );
    ctx.status = 200;
    ctx.body = { success: true, messages };
  } catch (error) {
    console.error('获取聊天记录失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '获取聊天记录失败' };
  }
});

// 标记消息为已读
router.post('/read/:friendId', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const friendId = ctx.params.friendId;
    
    if (!friendId) {
      ctx.status = 400;
      ctx.body = { success: false, message: '好友ID不能为空' };
      return;
    }

    const result = await MessageService.markMessagesAsRead(friendId, userId);
    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    console.error('标记消息为已读失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '标记消息为已读失败' };
  }
});

// 获取未读消息数量
router.get('/unread-count', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const count = await MessageService.getUnreadMessageCount(userId);
    ctx.status = 200;
    ctx.body = { success: true, count };
  } catch (error) {
    console.error('获取未读消息数量失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '获取未读消息数量失败' };
  }
});

// 获取会话列表
router.get('/conversations', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const { limit = 20 } = ctx.query;
    
    const conversations = await MessageService.getConversationList(userId, parseInt(limit));
    ctx.status = 200;
    ctx.body = { success: true, conversations };
  } catch (error) {
    console.error('获取会话列表失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '获取会话列表失败' };
  }
});

// 获取单条消息详情
router.get('/:messageId', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const messageId = ctx.params.messageId;
    
    if (!messageId) {
      ctx.status = 400;
      ctx.body = { success: false, message: '消息ID不能为空' };
      return;
    }

    const message = await MessageService.getMessageById(messageId);
    
    if (!message) {
      ctx.status = 404;
      ctx.body = { success: false, message: '消息不存在' };
      return;
    }

    // 检查消息是否属于当前用户
    if (message.senderId !== userId && message.receiverId !== userId) {
      ctx.status = 403;
      ctx.body = { success: false, message: '无权访问该消息' };
      return;
    }

    ctx.status = 200;
    ctx.body = { success: true, message };
  } catch (error) {
    console.error('获取消息详情失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '获取消息详情失败' };
  }
});

// 撤回消息（通过API，不仅限于WebSocket）
router.post('/recall/:messageId', async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const messageId = ctx.params.messageId;
    
    if (!messageId) {
      ctx.status = 400;
      ctx.body = { success: false, message: '消息ID不能为空' };
      return;
    }

    // 先获取消息，检查权限
    const message = await MessageService.getMessageById(messageId);
    
    if (!message) {
      ctx.status = 404;
      ctx.body = { success: false, message: '消息不存在' };
      return;
    }

    // 检查是否是发送者
    if (message.senderId !== userId) {
      ctx.status = 403;
      ctx.body = { success: false, message: '无权撤回该消息' };
      return;
    }

    // 检查是否在撤回时间限制内
    const now = new Date();
    const messageTime = new Date(message.createdAt);
    const diffMinutes = (now - messageTime) / (1000 * 60);
    
    if (diffMinutes > 2) {
      ctx.status = 400;
      ctx.body = { success: false, message: '超过2分钟，无法撤回' };
      return;
    }

    // 执行撤回
    await MessageService.recallMessage(messageId);
    
    ctx.status = 200;
    ctx.body = { success: true, message: '消息已撤回' };
  } catch (error) {
    console.error('撤回消息失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message || '撤回消息失败' };
  }
});

module.exports = router;