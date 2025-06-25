/**
 * 初始化数据脚本
 * 将现有的Dalgona Candy游戏添加到游戏数据JSON文件中
 */

const fs = require('fs');
const path = require('path');

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 游戏数据
const dalgonaGame = {
  id: '1',
  slug: 'dalgona-candy',
  name: 'Dalgona Candy Honeycomb Cookie',
  category: 'Puzzle',
  description: 'Test your patience and precision by carving intricate patterns into honeycomb candy without breaking it. Inspired by the viral Squid Game challenge.',
  howToPlay: 'Use your mouse or touch to carefully trace the pattern on the honeycomb candy. Move slowly and precisely to avoid breaking the candy. Complete the pattern within the time limit to win.',
  iframe: '<iframe src="https://www.crazygames.com/embed/dalgona-candy" class="game-iframe" title="Dalgona Candy Game" allow="fullscreen" frameborder="0"></iframe>',
  tags: ['Puzzle', 'Skill', 'Precision', 'Squid Game', 'Challenge'],
  image: '/images/games/dalgona-candy.jpg',
  dateAdded: new Date().toISOString(),
  status: 'approved' // 已批准
};

// 写入游戏数据到JSON文件
const gamesDataFile = path.join(dataDir, 'games.json');
const games = [dalgonaGame];
fs.writeFileSync(gamesDataFile, JSON.stringify(games, null, 2), 'utf8');

console.log('初始化数据完成！');
console.log(`游戏数据已写入到: ${gamesDataFile}`);
console.log('包含的游戏:');
console.log(`- ${dalgonaGame.name} (${dalgonaGame.category})`);

// 创建游戏图片目录
const uploadsDir = path.join(__dirname, 'uploads/games');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 创建图片目录
const imagesDir = path.join(__dirname, 'images/games');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

console.log('目录结构已创建完成！');
console.log('运行 npm start 启动服务器，然后访问 http://localhost:3000'); 