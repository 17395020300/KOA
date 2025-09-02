const Friend = require('../models/Friend');
const User = require('../models/User');
const { Op } = require('sequelize');

class FriendService {
  // 发送好友请求
  static async sendFriendRequest(userId, friendPhone) {
    try {
      // 查找目标用户
      const targetUser = await User.findOne({ where: { phone: friendPhone } });
      
      if (!targetUser) {
        throw new Error('该用户不存在');
      }

      if (userId === targetUser.id) {
        throw new Error('不能添加自己为好友');
      }

      // 检查是否已经是好友或已经发送过请求
      const existingRelation = await Friend.findOne({
        where: {
          [Op.or]: [
            { userId, friendId: targetUser.id },
            { userId: targetUser.id, friendId: userId },
          ],
        },
      });

      if (existingRelation) {
        if (existingRelation.status === 'accepted') {
          throw new Error('你们已经是好友了');
        } else if (existingRelation.status === 'pending') {
          if (existingRelation.userId === userId) {
            throw new Error('已发送好友请求，请等待对方回复');
          } else {
            throw new Error('对方已向你发送好友请求，请前往处理');
          }
        }
      }

      // 创建好友请求
      await Friend.create({
        userId,
        friendId: targetUser.id,
        status: 'pending',
      });

      return { success: true, message: '好友请求已发送' };
    } catch (error) {
      console.error('发送好友请求失败:', error);
      throw error;
    }
  }

  // 接受好友请求
  static async acceptFriendRequest(userId, friendId) {
    try {
      // 查找好友请求
      const friendRequest = await Friend.findOne({
        where: {
          userId: friendId,
          friendId: userId,
          status: 'pending',
        },
      });

      if (!friendRequest) {
        throw new Error('好友请求不存在');
      }

      // 更新好友请求状态
      await friendRequest.update({
        status: 'accepted',
      });

      // 创建反向好友关系
      await Friend.create({
        userId,
        friendId,
        status: 'accepted',
      });

      return { success: true, message: '已成功添加好友' };
    } catch (error) {
      console.error('接受好友请求失败:', error);
      throw error;
    }
  }

  // 拒绝好友请求
  static async rejectFriendRequest(userId, friendId) {
    try {
      // 查找好友请求
      const friendRequest = await Friend.findOne({
        where: {
          userId: friendId,
          friendId: userId,
          status: 'pending',
        },
      });

      if (!friendRequest) {
        throw new Error('好友请求不存在');
      }

      // 更新好友请求状态为已拒绝
      await friendRequest.update({
        status: 'rejected',
      });

      return { success: true, message: '已拒绝好友请求' };
    } catch (error) {
      console.error('拒绝好友请求失败:', error);
      throw error;
    }
  }

  // 删除好友
  static async deleteFriend(userId, friendId) {
    try {
      // 删除双向好友关系
      await Friend.destroy({
        where: {
          [Op.or]: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      });

      return { success: true, message: '已成功删除好友' };
    } catch (error) {
      console.error('删除好友失败:', error);
      throw error;
    }
  }

  // 更新好友备注
  static async updateFriendRemark(userId, friendId, remark) {
    try {
      // 查找好友关系
      const friendRelation = await Friend.findOne({
        where: {
          userId,
          friendId,
          status: 'accepted',
        },
      });

      if (!friendRelation) {
        throw new Error('好友关系不存在');
      }

      // 更新备注
      await friendRelation.update({
        remark,
      });

      return { success: true, message: '备注更新成功' };
    } catch (error) {
      console.error('更新好友备注失败:', error);
      throw error;
    }
  }

  // 获取好友请求列表
  static async getFriendRequests(userId) {
    try {
      const requests = await Friend.findAll({
        where: {
          friendId: userId,
          status: 'pending',
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'phone', 'nickname', 'avatar'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return requests.map(req => ({
        id: req.id,
        fromUser: req.user,
        createdAt: req.createdAt,
      }));
    } catch (error) {
      console.error('获取好友请求列表失败:', error);
      throw new Error('获取好友请求列表失败');
    }
  }

  // 搜索可以添加的用户
  static async searchPotentialFriends(userId, keyword) {
    try {
      // 首先搜索符合条件的用户
      const users = await User.findAll({
        where: {
          [Op.or]: [
            { phone: { [Op.like]: `%${keyword}%` } },
            { nickname: { [Op.like]: `%${keyword}%` } },
          ],
          id: { [Op.not]: userId },
        },
        limit: 20,
      });

      // 获取当前用户的所有好友关系
      const userRelations = await Friend.findAll({
        where: {
          [Op.or]: [
            { userId },
            { friendId: userId },
          ],
        },
      });

      // 构建关系映射
      const relationMap = new Map();
      userRelations.forEach(relation => {
        const targetId = relation.userId === userId ? relation.friendId : relation.userId;
        relationMap.set(targetId, relation.status);
      });

      // 处理搜索结果，添加关系状态
      return users.map(user => ({
        ...user.toJSON(),
        relationStatus: relationMap.get(user.id) || 'stranger',
      }));
    } catch (error) {
      console.error('搜索潜在好友失败:', error);
      throw new Error('搜索用户失败');
    }
  }

  // 检查好友关系状态
  static async checkFriendStatus(userId, targetId) {
    try {
      const relation = await Friend.findOne({
        where: {
          [Op.or]: [
            { userId, friendId: targetId },
            { userId: targetId, friendId: userId },
          ],
        },
      });

      if (!relation) {
        return 'stranger';
      }

      return relation.status;
    } catch (error) {
      console.error('检查好友关系状态失败:', error);
      throw new Error('检查好友关系失败');
    }
  }
}

module.exports = FriendService;