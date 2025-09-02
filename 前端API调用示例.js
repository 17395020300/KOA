// 前端调用API接口示例

// 基础配置
const BASE_URL = 'http://localhost:1998'; // 服务器地址和端口（实际运行的端口）

// 工具函数：处理API请求
async function apiRequest(endpoint, method = 'GET', data = null, requireAuth = true) {
  const url = `${BASE_URL}${endpoint}`;
  
  // 配置请求头
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // 如果需要认证，添加token
  if (requireAuth) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('未登录，请先登录');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // 构建请求参数
  const options = {
    method,
    headers,
  };
  
  // 如果有数据，添加到请求体
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    
    // 检查响应状态
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `请求失败：${response.status}`);
    }
    
    // 返回响应数据
    return await response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

// 示例1: 发送验证码（无需认证）
async function sendVerificationCode(phone) {
  try {
    const result = await apiRequest('/api/auth/send-verification-code', 'POST', { phone }, false);
    console.log('验证码发送成功:', result);
    return result;
  } catch (error) {
    console.error('发送验证码失败:', error);
    throw error;
  }
}

// 示例2: 验证验证码并登录（无需认证）
async function loginWithVerificationCode(phone, code) {
  try {
    const result = await apiRequest('/api/auth/verify-code', 'POST', { phone, code }, false);
    
    if (result.success) {
      // 保存token到本地存储
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('userInfo', JSON.stringify(result.user));
      console.log('登录成功:', result);
    }
    
    return result;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}

// 示例3: 获取用户信息（需要认证）
async function getUserInfo() {
  try {
    const result = await apiRequest('/api/user/info'); // 默认GET请求，需要认证
    console.log('获取用户信息成功:', result);
    return result;
  } catch (error) {
    // 如果是未授权错误，跳转到登录页
    if (error.message.includes('未授权')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      window.location.href = '/login.html';
    }
    console.error('获取用户信息失败:', error);
    throw error;
  }
}

// 示例4: 获取好友列表（需要认证）
async function getFriendList() {
  try {
    const result = await apiRequest('/api/friend/list');
    console.log('获取好友列表成功:', result);
    return result;
  } catch (error) {
    console.error('获取好友列表失败:', error);
    throw error;
  }
}

// 示例5: 发送消息（需要认证）
async function sendMessage(toUserId, content, type = 'text') {
  try {
    const result = await apiRequest('/api/message/send', 'POST', {
      toUserId,
      content,
      type
    });
    console.log('发送消息成功:', result);
    return result;
  } catch (error) {
    console.error('发送消息失败:', error);
    throw error;
  }
}

// 示例6: 刷新token
async function refreshToken() {
  try {
    // 刷新token接口特殊处理，它需要旧token但配置为无需认证
    const oldToken = localStorage.getItem('authToken');
    if (!oldToken) {
      throw new Error('没有找到旧token');
    }
    
    const response = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${oldToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('刷新token失败');
    }
    
    const result = await response.json();
    if (result.success) {
      localStorage.setItem('authToken', result.token);
      console.log('token刷新成功');
    }
    
    return result;
  } catch (error) {
    console.error('刷新token失败:', error);
    // 刷新失败，清除token并跳转到登录页
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = '/login.html';
    throw error;
  }
}

// 示例用法（实际项目中根据需要调用）
// 1. 发送验证码
// sendVerificationCode('13800138000');

// 2. 登录
// loginWithVerificationCode('13800138000', '123456').then(() => {
//   // 登录成功后可以调用需要认证的接口
//   getUserInfo();
//   getFriendList();
// });

// 3. 设置token自动刷新（可选）
// function setupTokenRefresh() {
//   // 每55分钟刷新一次token（假设token有效期为60分钟）
//   setInterval(() => {
//     if (localStorage.getItem('authToken')) {
//       refreshToken().catch(() => {});
//     }
//   }, 55 * 60 * 1000);
// }
// setupTokenRefresh();