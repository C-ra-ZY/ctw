import axios from 'axios';
import WebSocket from 'ws';

const SERVER_HTTP_URL = 'http://localhost:3000/score';
const SERVER_WS_URL = 'ws://localhost:8081';

// 模拟用户更新分数的函数
async function updateScore(userId, minScore, maxScore) {
  try {
    const score =
      Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
    const response = await axios.put(
      `${SERVER_HTTP_URL}/user/${userId}/${score}`,
    );
    console.log(
      `[${userId}] Updated score to ${score}, received rank: ${response.data.rank}`,
    );
  } catch (err) {
    console.error(`[${userId}] Failed to update score:`, err.message);
  }
}

// 创建 WebSocket 客户端
function createWebSocketClient(userId) {
  const ws = new WebSocket(SERVER_WS_URL);

  ws.on('open', () => {
    console.log(`[${userId}] WebSocket connected.`);
    ws.send(JSON.stringify({ type: 'subscribe', userId }));
  });

  ws.on('message', (message) => {
    console.log(`[${userId}] Received WebSocket message:`, message);
  });

  ws.on('close', () => {
    console.log(`[${userId}] WebSocket disconnected.`);
  });

  ws.on('error', (err) => {
    console.error(`[${userId}] WebSocket error:`, err);
  });

  return ws;
}

// 模拟用户行为
async function simulateUser(userId, minScore, maxScore) {
  createWebSocketClient(userId);

  // 每 1 秒发送一次更新分数请求
  setInterval(() => {
    updateScore(userId, minScore, maxScore);
  }, 1000);
}

// 启动两个用户模拟
simulateUser('user1', 50, 100);
simulateUser('user2', 30, 80);
