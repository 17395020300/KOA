const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const redis = require('./redis');
const MessageService = require('../services/messageService');

// 存储WebSocket连接的Map
const clients = new Map();

// 创建WebSocket服务器
function createWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  // 处理新连接
  wss.on('connection', (ws, req) => {
    try {
      // 从请求头获取token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        ws.close(401, 'Unauthorized');
        return;
      }

      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // 存储连接信息
      clients.set(userId, ws);
      ws.userId = userId;

      console.log(`User ${userId} connected`);

      // 处理消息
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await handleMessage(userId, data, ws);
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      // 处理断开连接
      ws.on('close', () => {
        clients.delete(userId);
        console.log(`User ${userId} disconnected`);
      });

      // 处理错误
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });

      // 发送离线消息
      sendOfflineMessages(userId);

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(401, 'Unauthorized');
    }
  });

  // 向特定用户发送消息
  function sendMessageToUser(userId, message) {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // 处理接收到的消息
  async function handleMessage(userId, data, ws) {
    switch (data.type) {
      case 'text_message':
        await handleTextMessage(userId, data);
        break;
      case 'message_read':
        await handleMessageRead(userId, data);
        break;
      case 'message_recall':
        await handleMessageRecall(userId, data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  // 处理文本消息
  async function handleTextMessage(senderId, data) {
    const { receiverId, content } = data;
    
    // 保存消息到数据库
    const message = await MessageService.createMessage({
      senderId,
      receiverId,
      content,
      type: 'text',
      status: 'sent'
    });

    // 尝试发送消息
    const isOnline = sendMessageToUser(receiverId, {
      type: 'new_message',
      message: {
        id: message.id,
        senderId,
        receiverId,
        content,
        type: 'text',
        status: 'delivered',
        createdAt: message.createdAt
      }
    });

    // 更新消息状态
    if (isOnline) {
      await MessageService.updateMessageStatus(message.id, 'delivered');
    } else {
      // 保存离线消息到Redis
      await redis.lpush(`offline_messages:${receiverId}`, JSON.stringify({
        type: 'new_message',
        message: {
          id: message.id,
          senderId,
          receiverId,
          content,
          type: 'text',
          status: 'sent',
          createdAt: message.createdAt
        }
      }));
    }

    // 发送确认给发送方
    sendMessageToUser(senderId, {
      type: 'message_sent',
      messageId: message.id,
      status: isOnline ? 'delivered' : 'sent'
    });
  }

  // 处理消息已读
  async function handleMessageRead(userId, data) {
    const { messageId } = data;
    await MessageService.updateMessageStatus(messageId, 'read');
    
    // 通知发送方消息已读
    const message = await MessageService.getMessageById(messageId);
    if (message && message.senderId !== userId) {
      sendMessageToUser(message.senderId, {
        type: 'message_read',
        messageId
      });
    }
  }

  // 处理消息撤回
  async function handleMessageRecall(userId, data) {
    const { messageId } = data;
    const message = await MessageService.getMessageById(messageId);
    
    // 检查是否可以撤回（2分钟内，且是发送者）
    if (message && message.senderId === userId) {
      const now = new Date();
      const messageTime = new Date(message.createdAt);
      const diffMinutes = (now - messageTime) / (1000 * 60);
      
      if (diffMinutes <= 2) {
        await MessageService.recallMessage(messageId);
        
        // 通知接收方消息已撤回
        sendMessageToUser(message.receiverId, {
          type: 'message_recalled',
          messageId
        });
        
        // 通知发送方撤回成功
        sendMessageToUser(userId, {
          type: 'recall_success',
          messageId
        });
      } else {
        sendMessageToUser(userId, {
          type: 'recall_failed',
          messageId,
          reason: '超过2分钟，无法撤回'
        });
      }
    }
  }

  // 发送离线消息
  async function sendOfflineMessages(userId) {
    try {
      const offlineMessages = await redis.lrange(`offline_messages:${userId}`, 0, -1);
      if (offlineMessages.length > 0) {
        const client = clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          offlineMessages.forEach(msgStr => {
            client.send(msgStr);
          });
          // 清空离线消息
          await redis.del(`offline_messages:${userId}`);
        }
      }
    } catch (error) {
      console.error('Error sending offline messages:', error);
    }
  }

  // 广播消息（可选功能）
  function broadcast(message) {
    clients.forEach((client, userId) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  return {
    wss,
    sendMessageToUser,
    broadcast
  };
}

module.exports = {
  createWebSocketServer
};