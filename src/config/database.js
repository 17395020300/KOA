const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

// 先创建一个不指定数据库的连接来创建数据库（如果不存在）
async function createDatabaseIfNotExists() {
  let connection = null;
  try {
    // 连接到MySQL服务器但不指定数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD || undefined,
      multipleStatements: true
    });
    
    // 创建数据库（如果不存在）
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`数据库 ${process.env.DB_NAME} 已准备就绪`);
  } catch (error) {
    console.error('创建数据库失败:', error);
    console.error('\n请检查您的MySQL配置并确保：');
    console.error('1. MySQL服务器正在运行');
    console.error('2. .env文件中的数据库配置（DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD）正确');
    console.error('3. 您的MySQL用户有权限创建数据库');
    console.error('\n如果您不确定如何配置MySQL，可以参考MySQL官方文档或联系数据库管理员。');
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 创建数据库连接实例
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    logging: false, // 设置为true可以查看SQL日志
  }
);

// 导出函数以便可以单独运行
async function initializeDatabase() {
  try {
    await createDatabaseIfNotExists();
    await sequelize.authenticate();
    console.log('数据库连接成功');
    return sequelize;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  initializeDatabase
};

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  initializeDatabase().then(() => {
    console.log('数据库初始化完成');
    process.exit(0);
  }).catch((error) => {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  });
}