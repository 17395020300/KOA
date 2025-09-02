const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

class Message extends Model {
  // 转换为JSON对象
  toJSON() {
    const values = { ...this.get() };
    return values;
  }

  // 检查消息是否可以撤回（2分钟内）
  canRecall() {
    const now = new Date();
    const messageTime = new Date(this.createdAt);
    const diffMinutes = (now - messageTime) / (1000 * 60);
    return diffMinutes <= 2;
  }
}

Message.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('text', 'image', 'voice', 'video'),
    allowNull: false,
    defaultValue: 'text',
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read'),
    allowNull: false,
    defaultValue: 'sent',
  },
  isRecalled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'Message',
  tableName: 'messages',
  timestamps: true,
  indexes: [
    {
      fields: ['senderId'],
      name: 'idx_sender_id',
    },
    {
      fields: ['receiverId'],
      name: 'idx_receiver_id',
    },
    {
      fields: ['createdAt'],
      name: 'idx_created_at',
    },
  ],
});

// 建立关联关系
User.hasMany(Message, {
  as: 'sentMessages',
  foreignKey: 'senderId',
});

User.hasMany(Message, {
  as: 'receivedMessages',
  foreignKey: 'receiverId',
});

Message.belongsTo(User, {
  as: 'sender',
  foreignKey: 'senderId',
});

Message.belongsTo(User, {
  as: 'receiver',
  foreignKey: 'receiverId',
});

module.exports = Message;