#!/usr/bin/env node

const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// 加载环境变量
dotenv.config();

console.log('=== 数据库连接测试工具 ===');
console.log('此工具用于测试MySQL数据库连接配置是否正确');
console.log('\n当前使用的配置:');
console.log(`- 主机: ${process.env.DB_HOST || '未设置'}`);
console.log(`- 端口: ${process.env.DB_PORT || '未设置'}`);
console.log(`- 用户名: ${process.env.DB_USERNAME || '未设置'}`);
console.log(`- 密码: ${process.env.DB_PASSWORD ? '已设置 (为了安全不显示)' : '未设置'}`);
console.log(`- 数据库名: ${process.env.DB_NAME || '未设置'}`);

// 测试数据库连接的函数
async function testDatabaseConnection() {
    let connection = null;
    try {
        console.log('\n正在尝试连接到MySQL服务器...');
        
        // 连接到MySQL服务器但不指定数据库
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD || undefined,
        });
        
        console.log('✅ MySQL服务器连接成功！');
        
        // 尝试列出所有数据库，验证权限
        const [databases] = await connection.query('SHOW DATABASES;');
        console.log('\n服务器上的数据库列表:');
        databases.forEach(db => {
            console.log(`- ${db.Database}`);
        });
        
        // 检查目标数据库是否存在
        const dbExists = databases.some(db => db.Database === process.env.DB_NAME);
        if (dbExists) {
            console.log(`\n✅ 数据库 ${process.env.DB_NAME} 已存在`);
        } else {
            console.log(`\n⚠️  数据库 ${process.env.DB_NAME} 不存在`);
            console.log(`您可以使用以下SQL命令创建数据库:`);
            console.log(`CREATE DATABASE ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
            console.log(`然后运行 npm run migrate 来初始化表结构`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        
        // 根据错误类型提供具体的解决建议
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n可能的解决方案:');
            console.error('1. 检查用户名和密码是否正确');
            console.error('2. 确保该用户有足够的权限连接到MySQL服务器');
            console.error('3. 如果MySQL没有设置密码，请将.env文件中的DB_PASSWORD留空');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n可能的解决方案:');
            console.error('1. 检查MySQL服务器是否已启动');
            console.error('2. 检查主机名和端口号是否正确');
            console.error('3. 检查防火墙设置是否允许连接');
        } else {
            console.error('\n请检查您的MySQL配置和网络连接');
        }
        
        console.error('\n详细的错误信息:');
        console.error(error);
        return false;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n数据库连接已关闭');
        }
    }
}

// 运行测试
console.log('\n开始测试...');
testDatabaseConnection().then(success => {
    console.log('\n=== 测试完成 ===');
    if (success) {
        console.log('\n🎉 数据库配置正确！您可以运行 npm run migrate 来初始化数据库。');
    } else {
        console.log('\n❌ 数据库配置有问题，请根据上面的错误信息进行修复。');
    }
}).catch(error => {
    console.error('测试过程中发生错误:', error);
});