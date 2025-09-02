const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

class Friend extends Model {
  // 转换为JSON对象
  toJSON() {
    const values = { ...this.get() };
    return values;
  }
}

Friend.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  friendId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  remark: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
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
  modelName: 'Friend',
  tableName: 'friends',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'friendId'],
      name: 'unique_user_friend',
    },
  ],
});

// 建立关联关系
User.belongsToMany(User, {
  through: Friend,
  as: 'friends',
  foreignKey: 'userId',
  otherKey: 'friendId',
});

module.exports = Friend;