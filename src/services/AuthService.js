const User = require('../models/User');
const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

class AuthService {
  // 生成验证码
  static generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 发送验证码（实际项目中需要接入短信服务商API）
  static async sendVerificationCode(phone) {
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟有效期

    // 实际项目中这里需要调用短信服务商的API发送验证码
    console.log(`验证码 ${code} 已发送到手机号 ${phone}`);

    // 保存验证码到用户记录
    await User.update(
      { verificationCode: code, verificationCodeExpires: expiresAt },
      { where: { phone } }
    );

    return { success: true, message: '验证码已发送' };
  }

  // 验证验证码并登录/注册
  static async verifyCode(phone, code) {
    const user = await User.findOne({ where: { phone } });

    if (!user) {
      // 新用户，创建账号
      const newUser = await User.create({
        phone,
        verificationCode: code,
        verificationCodeExpires: new Date(),
      });

      // 生成JWT token
      const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      return { success: true, user: newUser, token };
    }

    // 检查验证码是否有效
    if (user.verificationCode !== code) {
      return { success: false, message: '验证码错误' };
    }

    if (user.verificationCodeExpires < new Date()) {
      return { success: false, message: '验证码已过期' };
    }

    // 生成JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // 清除已使用的验证码
    await User.update({
      verificationCode: null,
      verificationCodeExpires: null,
    }, { where: { phone } });

    return { success: true, user, token };
  }

  // 刷新JWT token
  static refreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });
      return { success: true, token: newToken };
    } catch (error) {
      return { success: false, message: '无效的token' };
    }
  }

  // 验证JWT token
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return { success: true, userId: decoded.id };
    } catch (error) {
      return { success: false, message: '无效的token' };
    }
  }

  // 检查用户是否在线
  static async isUserOnline(userId) {
    // 在实际应用中，这里应该检查用户的WebSocket连接状态
    // 由于我们使用Redis存储用户连接信息，可以从Redis中查询
    const isOnline = await redis.get(`user:${userId}:online`);
    return isOnline === 'true';
  }

  // 设置用户在线状态
  static async setUserOnline(userId, isOnline) {
    await redis.set(`user:${userId}:online`, isOnline ? 'true' : 'false');
    if (isOnline) {
      await redis.expire(`user:${userId}:online`, 3600); // 1小时过期
    }
  }
}

module.exports = AuthService;