const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

class User extends Model {
  // 加密密码的静态方法
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // 验证密码的实例方法
  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  // 转换为JSON对象时排除敏感信息
  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    delete values.verificationCode;
    delete values.verificationCodeExpires;
    return values;
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [11, 11], // 假设是11位手机号
    },
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: '新用户',
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: '/default-avatar.png',
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true, // 因为我们使用验证码登录，所以密码可选
  },
  verificationCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  verificationCodeExpires: {
    type: DataTypes.DATE,
    allowNull: true,
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
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
});

module.exports = User;