const User = require('../models/User');
const Friend = require('../models/Friend');

class UserService {
  // 获取用户信息
  static async getUserById(userId) {
    try {
      const user = await User.findByPk(userId);
      return user;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw new Error('获取用户信息失败');
    }
  }

  // 通过手机号查找用户
  static async getUserByPhone(phone) {
    try {
      const user = await User.findOne({ where: { phone } });
      return user;
    } catch (error) {
      console.error('通过手机号查找用户失败:', error);
      throw new Error('查找用户失败');
    }
  }

  // 更新用户信息
  static async updateUser(userId, data) {
    try {
      // 过滤掉不允许更新的字段
      const allowedFields = ['nickname', 'avatar', 'password'];
      const updateData = {};
      
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      }

      // 如果更新密码，需要加密
      if (updateData.password) {
        updateData.password = await User.hashPassword(updateData.password);
      }

      const [updated] = await User.update(updateData, { where: { id: userId } });
      
      if (updated) {
        return await this.getUserById(userId);
      }
      
      return null;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw new Error('更新用户信息失败');
    }
  }

  // 更新用户头像
  static async updateAvatar(userId, avatarUrl) {
    try {
      const [updated] = await User.update({ avatar: avatarUrl }, { where: { id: userId } });
      
      if (updated) {
        return await this.getUserById(userId);
      }
      
      return null;
    } catch (error) {
      console.error('更新用户头像失败:', error);
      throw new Error('更新用户头像失败');
    }
  }

  // 更新用户昵称
  static async updateNickname(userId, nickname) {
    try {
      const [updated] = await User.update({ nickname }, { where: { id: userId } });
      
      if (updated) {
        return await this.getUserById(userId);
      }
      
      return null;
    } catch (error) {
      console.error('更新用户昵称失败:', error);
      throw new Error('更新用户昵称失败');
    }
  }

  // 搜索用户（通过手机号或昵称）
  static async searchUsers(keyword) {
    try {
      // 构建搜索条件
      const whereCondition = {
        [Op.or]: [
          { phone: { [Op.like]: `%${keyword}%` } },
          { nickname: { [Op.like]: `%${keyword}%` } },
        ],
      };

      const users = await User.findAll({
        where: whereCondition,
        limit: 20,
      });

      return users;
    } catch (error) {
      console.error('搜索用户失败:', error);
      throw new Error('搜索用户失败');
    }
  }

  // 检查用户是否是好友
  static async isFriend(userId, friendId) {
    try {
      const friend = await Friend.findOne({
        where: {
          [Op.or]: [
            { userId, friendId, status: 'accepted' },
            { userId: friendId, friendId: userId, status: 'accepted' },
          ],
        },
      });
      
      return !!friend;
    } catch (error) {
      console.error('检查好友关系失败:', error);
      throw new Error('检查好友关系失败');
    }
  }

  // 获取用户的好友列表
  static async getUserFriends(userId) {
    try {
      const friends = await Friend.findAll({
        where: {
          userId,
          status: 'accepted',
        },
        include: [
          {
            model: User,
            as: 'friend',
            attributes: ['id', 'phone', 'nickname', 'avatar'],
          },
        ],
      });

      // 处理好友列表数据，添加备注名
      const friendList = friends.map(friend => {
        return {
          id: friend.friend.id,
          phone: friend.friend.phone,
          nickname: friend.remark || friend.friend.nickname,
          avatar: friend.friend.avatar,
          remark: friend.remark,
          createdAt: friend.createdAt,
        };
      });

      return friendList;
    } catch (error) {
      console.error('获取好友列表失败:', error);
      throw new Error('获取好友列表失败');
    }
  }

  // 获取用户信息（包含好友关系）
  static async getUserInfoWithRelation(userId, targetUserId) {
    try {
      const user = await this.getUserById(targetUserId);
      if (!user) {
        return null;
      }

      // 检查是否是好友
      let relationStatus = 'stranger';
      let remark = null;

      const friendRelation = await Friend.findOne({
        where: {
          [Op.or]: [
            { userId, friendId: targetUserId },
            { userId: targetUserId, friendId: userId },
          ],
        },
      });

      if (friendRelation) {
        relationStatus = friendRelation.status;
        if (friendRelation.userId === userId) {
          remark = friendRelation.remark;
        }
      }

      return {
        ...user.toJSON(),
        relationStatus,
        remark,
      };
    } catch (error) {
      console.error('获取用户信息（包含好友关系）失败:', error);
      throw new Error('获取用户信息失败');
    }
  }
}

// 导入Op操作符
const { Op } = require('sequelize');

module.exports = UserService;