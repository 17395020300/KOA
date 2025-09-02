const { Op } = require('sequelize');
const User = require('../models/User');
const Message = require('../models/Message');

class MessageService {
  // 创建消息
  static async createMessage(messageData) {
    try {
      const message = await Message.create({
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        type: messageData.type || 'text',
        status: messageData.status || 'sent',
      });
      
      // 返回纯数据对象，不包含Sequelize实例方法
      return message.toJSON();
    } catch (error) {
      console.error('创建消息失败:', error);
      throw new Error('创建消息失败');
    }
  }

  // 获取消息ById
  static async getMessageById(messageId) {
    try {
      const message = await Message.findByPk(messageId);
      
      if (!message) {
        return null;
      }
      
      // 返回纯数据对象
      return message.toJSON();
    } catch (error) {
      console.error('获取消息失败:', error);
      throw new Error('获取消息失败');
    }
  }

  // 更新消息状态
  static async updateMessageStatus(messageId, status) {
    try {
      const [updated] = await Message.update({
        status,
      }, {
        where: { id: messageId },
        returning: true,
      });
      
      if (updated) {
        const updatedMessage = await Message.findByPk(messageId);
        return updatedMessage.toJSON();
      }
      
      return null;
    } catch (error) {
      console.error('更新消息状态失败:', error);
      throw new Error('更新消息状态失败');
    }
  }

  // 撤回消息
  static async recallMessage(messageId) {
    try {
      const [updated] = await Message.update({
        isRecalled: true,
        content: '[消息已撤回]',
      }, {
        where: { id: messageId },
        returning: true,
      });
      
      if (updated) {
        const updatedMessage = await Message.findByPk(messageId);
        return updatedMessage.toJSON();
      }
      
      return null;
    } catch (error) {
      console.error('撤回消息失败:', error);
      throw new Error('撤回消息失败');
    }
  }

  // 获取聊天记录
  static async getChatHistory(userId, friendId, limit = 50, offset = 0) {
    try {
      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            {
              senderId: userId,
              receiverId: friendId,
            },
            {
              senderId: friendId,
              receiverId: userId,
            },
          ],
          isRecalled: false,
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'nickname', 'avatar'],
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'nickname', 'avatar'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset,
      });
      
      // 返回纯数据对象数组
      return messages.map(message => message.toJSON());
    } catch (error) {
      console.error('获取聊天记录失败:', error);
      throw new Error('获取聊天记录失败');
    }
  }

  // 标记消息为已读
  static async markMessagesAsRead(senderId, receiverId) {
    try {
      await Message.update(
        { status: 'read' },
        {
          where: {
            senderId,
            receiverId,
            status: { [Op.ne]: 'read' },
          },
        }
      );
      
      return { success: true, message: '消息已标记为已读' };
    } catch (error) {
      console.error('标记消息为已读失败:', error);
      throw new Error('标记消息为已读失败');
    }
  }

  // 获取未读消息数量
  static async getUnreadMessageCount(userId) {
    try {
      const count = await Message.count({
        where: {
          receiverId: userId,
          status: 'sent',
          isRecalled: false,
        },
      });
      
      return count;
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
      throw new Error('获取未读消息数量失败');
    }
  }

  // 获取最近的会话列表
  static async getConversationList(userId, limit = 20) {
    try {
      // 子查询获取每个会话的最新消息
      const subQuery = Message.findAll({
        attributes: [
          [
            Message.sequelize.fn(
              'GREATEST',
              Message.sequelize.col('senderId'),
              Message.sequelize.col('receiverId')
            ),
            'maxId',
          ],
          [
            Message.sequelize.fn(
              'LEAST',
              Message.sequelize.col('senderId'),
              Message.sequelize.col('receiverId')
            ),
            'minId',
          ],
          [Message.sequelize.fn('MAX', Message.sequelize.col('createdAt')), 'latestCreatedAt'],
        ],
        where: {
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId },
          ],
          isRecalled: false,
        },
        group: ['maxId', 'minId'],
        order: [[Message.sequelize.fn('MAX', Message.sequelize.col('createdAt')), 'DESC']],
        limit: limit,
      });

      const results = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId },
          ],
          isRecalled: false,
          createdAt: {
            [Op.in]: subQuery.map(item => item.dataValues.latestCreatedAt),
          },
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'nickname', 'avatar'],
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'nickname', 'avatar'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // 处理会话列表数据
      const conversationList = results.map(message => {
        const targetUser = message.senderId === userId ? message.receiver : message.sender;
        const isSentByMe = message.senderId === userId;
        
        return {
          conversationId: `${message.senderId}-${message.receiverId}`,
          targetUser: targetUser.toJSON(),
          lastMessage: message.toJSON(),
          isSentByMe,
          updatedAt: message.createdAt,
        };
      });

      return conversationList;
    } catch (error) {
      console.error('获取会话列表失败:', error);
      throw new Error('获取会话列表失败');
    }
  }
}

module.exports = MessageService;