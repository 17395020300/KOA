const Redis = require('ioredis');

// 创建一个默认的模拟Redis客户端，确保导出的对象始终可用
const mockRedis = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 0,
  exists: async () => 0,
  publish: async () => 0,
  subscribe: async () => 0,
  // 添加其他必要的方法
  hget: async () => null,
  hset: async () => 1,
  hdel: async () => 0,
  lpush: async () => 0,
  rpush: async () => 0,
  lpop: async () => null,
  rpop: async () => null,
  keys: async () => [],
  expire: async () => 1,
};

// 创建Redis连接实例
let redisClient = mockRedis;

// 尝试连接Redis，但不阻塞应用启动
async function createRedisConnection() {
  try {
    const client = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD || undefined,
      db: 0,
      // 添加重连配置
      retryStrategy: (times) => {
        // 尝试10次后停止重连
        if (times > 10) {
          console.warn('Redis: 已达到最大重连次数，停止重连');
          return null;
        }
        // 递增的重连时间间隔
        return Math.min(times * 1000, 5000);
      }
    });

    // 监听连接事件
    client.on('connect', () => {
      console.log('Redis connected successfully');
      // 连接成功后替换为真实客户端
      redisClient = client;
    });

    // 监听错误事件
    client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  } catch (error) {
    console.error('Failed to initialize Redis connection:', error);
    console.warn('Using mock Redis client for development');
  }
}

// 启动时尝试连接Redis，但不等待
createRedisConnection();

// 创建一个代理对象，确保访问的方法总是指向最新的redisClient
const redisProxy = new Proxy({}, {
  get: (_, prop) => {
    if (typeof redisClient[prop] === 'function') {
      return (...args) => redisClient[prop](...args);
    }
    return redisClient[prop];
  },
  set: (_, prop, value) => {
    redisClient[prop] = value;
    return true;
  }
});

module.exports = redisProxy;