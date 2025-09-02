const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 加载环境变量
dotenv.config();

// 检查是否有环境变量文件
if (!fs.existsSync(path.resolve(__dirname, '../../.env'))) {
    console.error('错误：.env 文件不存在，请先创建 .env 文件并配置数据库信息');
    process.exit(1);
}

// 导入数据库配置和模型
const { initializeDatabase } = require('./database');
const User = require('../models/User');
const Friend = require('../models/Friend');
const Message = require('../models/Message');

// 定义迁移函数
async function migrate() {
    try {
        console.log('开始数据库迁移...');
        
        // 初始化数据库连接
        const sequelize = await initializeDatabase();
        
        // 同步所有模型到数据库
        console.log('正在创建表结构...');
        await sequelize.sync({
            force: true // 注意：这会删除已有的表并重新创建，生产环境请谨慎使用
        });
        
        console.log('表结构创建成功！');
        
        // 创建测试用户
        console.log('正在创建测试用户...');
        const user1 = await User.create({
            phone: '13800138001',
            nickname: '测试用户1',
            password: '123456', // 这里为了演示，实际应该使用加密密码
            avatar: 'default.png',
            gender: 0,
            bio: '这是测试用户1的简介',
            status: 1
        });
        
        const user2 = await User.create({
            phone: '13800138002',
            nickname: '测试用户2',
            password: '123456',
            avatar: 'default.png',
            gender: 1,
            bio: '这是测试用户2的简介',
            status: 1
        });
        
        const user3 = await User.create({
            phone: '13800138003',
            nickname: '测试用户3',
            password: '123456',
            avatar: 'default.png',
            gender: 0,
            bio: '这是测试用户3的简介',
            status: 1
        });
        
        console.log('测试用户创建成功！');
        
        // 创建好友关系
        console.log('正在创建好友关系...');
        await Friend.create({
            userId: user1.id,
            friendId: user2.id,
            status: 1 // 1表示已添加为好友
        });
        
        await Friend.create({
            userId: user1.id,
            friendId: user3.id,
            status: 1
        });
        
        await Friend.create({
            userId: user2.id,
            friendId: user1.id,
            status: 1
        });
        
        await Friend.create({
            userId: user2.id,
            friendId: user3.id,
            status: 1
        });
        
        await Friend.create({
            userId: user3.id,
            friendId: user1.id,
            status: 1
        });
        
        await Friend.create({
            userId: user3.id,
            friendId: user2.id,
            status: 1
        });
        
        console.log('好友关系创建成功！');
        
        // 创建测试消息
        console.log('正在创建测试消息...');
        await Message.create({
            senderId: user1.id,
            receiverId: user2.id,
            content: '你好，测试用户2！',
            type: 'text',
            status: 1 // 1表示已发送
        });
        
        await Message.create({
            senderId: user2.id,
            receiverId: user1.id,
            content: '你好，测试用户1！很高兴认识你！',
            type: 'text',
            status: 1
        });
        
        await Message.create({
            senderId: user3.id,
            receiverId: user1.id,
            content: '大家好！',
            type: 'text',
            status: 1
        });
        
        console.log('测试消息创建成功！');
        
        console.log('数据库迁移完成！');
        console.log('\n测试用户信息：');
        console.log('用户1：手机号 13800138001，密码 123456');
        console.log('用户2：手机号 13800138002，密码 123456');
        console.log('用户3：手机号 13800138003，密码 123456');
        
        // 关闭数据库连接
        await sequelize.close();
        
    } catch (error) {
        console.error('数据库迁移失败：', error);
        process.exit(1);
    }
}

// 执行迁移函数
migrate();