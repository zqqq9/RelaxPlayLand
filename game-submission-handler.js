const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const slugify = require('slugify');

const app = express();
const port = process.env.PORT || 3000;

// 配置静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads/games'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制5MB
  fileFilter: function (req, file, cb) {
    // 只接受图像文件
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('只允许上传图像文件!'), false);
    }
    cb(null, true);
  }
});

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 游戏提交处理路由
app.post('/submit-game', upload.single('gameImage'), (req, res) => {
  try {
    // 获取表单数据
    const gameData = req.body;
    
    // 验证必填字段
    const requiredFields = ['gameName', 'gameCategory', 'gameDescription', 'gameHowToPlay', 'gameIframe', 'developerName', 'developerEmail'];
    for (const field of requiredFields) {
      if (!gameData[field]) {
        return res.status(400).json({ success: false, message: `${field} 是必填项` });
      }
    }
    
    // 处理标签
    let gameTags = [];
    if (gameData.gameTags) {
      try {
        gameTags = JSON.parse(gameData.gameTags);
      } catch (e) {
        console.error('解析标签时出错:', e);
      }
    }
    
    // 净化HTML内容（防止XSS攻击）
    const sanitizeOptions = {
      allowedTags: ['iframe', 'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
      allowedAttributes: {
        'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
        'a': ['href', 'target']
      }
    };
    
    const sanitizedIframe = sanitizeHtml(gameData.gameIframe, sanitizeOptions);
    
    // 创建游戏页面的URL友好名称（slug）
    const gameSlug = slugify(gameData.gameName, { 
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    // 检查是否已存在同名游戏
    const gamesDir = path.join(__dirname, 'public/games');
    if (fs.existsSync(path.join(gamesDir, `${gameSlug}.html`))) {
      return res.status(400).json({ success: false, message: '已存在同名游戏，请使用不同的名称' });
    }
    
    // 准备游戏数据以保存到数据库或JSON文件
    const gameEntry = {
      id: Date.now().toString(),
      slug: gameSlug,
      name: gameData.gameName,
      category: gameData.gameCategory,
      difficulty: gameData.gameDifficulty || 'Medium',
      controls: gameData.gameControls || 'Mouse/Touch',
      players: gameData.gamePlayers || 'Single Player',
      ageRating: gameData.gameAgeRating || 'All Ages',
      description: gameData.gameDescription,
      howToPlay: gameData.gameHowToPlay,
      features: gameData.gameFeatures || '',
      iframe: sanitizedIframe,
      tags: gameTags,
      developer: {
        name: gameData.developerName,
        email: gameData.developerEmail,
        website: gameData.developerWebsite || ''
      },
      dateAdded: new Date().toISOString(),
      status: 'pending' // 待审核
    };
    
    // 保存游戏数据到JSON文件（在实际应用中，这可能是数据库操作）
    saveGameData(gameEntry);
    
    // 生成游戏页面HTML
    generateGamePage(gameEntry);
    
    // 返回成功响应
    res.json({
      success: true,
      message: '游戏提交成功，正在等待审核',
      gameSlug: gameSlug
    });
    
  } catch (error) {
    console.error('处理游戏提交时出错:', error);
    res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
  }
});

// 保存游戏数据到JSON文件
function saveGameData(gameData) {
  const dataDir = path.join(__dirname, 'data');
  const gamesDataFile = path.join(dataDir, 'games.json');
  
  // 确保数据目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 读取现有游戏数据
  let games = [];
  if (fs.existsSync(gamesDataFile)) {
    const data = fs.readFileSync(gamesDataFile, 'utf8');
    games = JSON.parse(data);
  }
  
  // 添加新游戏
  games.push(gameData);
  
  // 保存更新后的数据
  fs.writeFileSync(gamesDataFile, JSON.stringify(games, null, 2), 'utf8');
}

// 生成游戏页面HTML
function generateGamePage(gameData) {
  // 读取游戏页面模板
  const templatePath = path.join(__dirname, 'templates/game-template.html');
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // 替换模板中的占位符
  template = template.replace(/{{GAME_NAME}}/g, gameData.name);
  template = template.replace(/{{GAME_DESCRIPTION}}/g, gameData.description);
  template = template.replace(/{{GAME_CATEGORY}}/g, gameData.category);
  template = template.replace(/{{GAME_DIFFICULTY}}/g, gameData.difficulty);
  template = template.replace(/{{GAME_PLAYERS}}/g, gameData.players);
  template = template.replace(/{{GAME_CONTROLS}}/g, gameData.controls);
  template = template.replace(/{{GAME_AGE_RATING}}/g, gameData.ageRating);
  template = template.replace(/{{GAME_HOW_TO_PLAY}}/g, gameData.howToPlay);
  template = template.replace(/{{GAME_FEATURES}}/g, gameData.features);
  template = template.replace(/{{GAME_IFRAME}}/g, gameData.iframe);
  template = template.replace(/{{DEVELOPER_NAME}}/g, gameData.developer.name);
  
  // 处理标签
  let tagsHtml = '';
  if (gameData.tags && gameData.tags.length > 0) {
    tagsHtml = gameData.tags.map(tag => `<span class="game-tag">${tag}</span>`).join('');
  }
  template = template.replace(/{{GAME_TAGS}}/g, tagsHtml);
  
  // 确保games目录存在
  const gamesDir = path.join(__dirname, 'public/games');
  if (!fs.existsSync(gamesDir)) {
    fs.mkdirSync(gamesDir, { recursive: true });
  }
  
  // 写入生成的HTML文件
  const filePath = path.join(gamesDir, `${gameData.slug}.html`);
  fs.writeFileSync(filePath, template, 'utf8');
}

// 审核游戏路由（管理员功能）
app.post('/admin/approve-game/:id', (req, res) => {
  const gameId = req.params.id;
  
  try {
    // 读取游戏数据
    const gamesDataFile = path.join(__dirname, 'data/games.json');
    const data = fs.readFileSync(gamesDataFile, 'utf8');
    const games = JSON.parse(data);
    
    // 查找游戏
    const gameIndex = games.findIndex(game => game.id === gameId);
    if (gameIndex === -1) {
      return res.status(404).json({ success: false, message: '游戏未找到' });
    }
    
    // 更新游戏状态为已批准
    games[gameIndex].status = 'approved';
    
    // 保存更新后的数据
    fs.writeFileSync(gamesDataFile, JSON.stringify(games, null, 2), 'utf8');
    
    // 更新主页上的游戏列表
    updateGamesList();
    
    res.json({ success: true, message: '游戏已批准并发布' });
    
  } catch (error) {
    console.error('批准游戏时出错:', error);
    res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
  }
});

// 更新主页上的游戏列表
function updateGamesList() {
  try {
    // 读取游戏数据
    const gamesDataFile = path.join(__dirname, 'data/games.json');
    const data = fs.readFileSync(gamesDataFile, 'utf8');
    const allGames = JSON.parse(data);
    
    // 筛选已批准的游戏
    const approvedGames = allGames.filter(game => game.status === 'approved');
    
    // 读取主页模板
    const indexTemplatePath = path.join(__dirname, 'templates/index-template.html');
    let indexTemplate = fs.readFileSync(indexTemplatePath, 'utf8');
    
    // 生成游戏卡片HTML
    let gamesHtml = '';
    for (const game of approvedGames) {
      gamesHtml += `
        <div class="game-card">
          <a href="/games/${game.slug}.html" class="block">
            <div class="relative">
              <img src="${game.image || '/images/placeholder-game.jpg'}" alt="${game.name}" class="w-full h-48 object-cover rounded-t-xl">
              <div class="absolute top-4 right-4 bg-apple-${getCategoryColor(game.category)} text-white px-3 py-1 rounded-full text-sm font-semibold">
                ${game.category}
              </div>
            </div>
            <div class="p-5">
              <h3 class="text-lg font-bold mb-2 text-apple-dark-gray">${game.name}</h3>
              <p class="text-apple-gray mb-3 text-sm line-clamp-2">${game.description.substring(0, 100)}${game.description.length > 100 ? '...' : ''}</p>
              <button class="w-full bg-apple-blue text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors">Play Now</button>
            </div>
          </a>
        </div>
      `;
    }
    
    // 替换模板中的游戏列表占位符
    indexTemplate = indexTemplate.replace(/{{GAMES_LIST}}/g, gamesHtml);
    
    // 写入更新后的主页
    const indexPath = path.join(__dirname, 'public/index.html');
    fs.writeFileSync(indexPath, indexTemplate, 'utf8');
    
  } catch (error) {
    console.error('更新游戏列表时出错:', error);
  }
}

// 根据游戏类别获取颜色
function getCategoryColor(category) {
  const colors = {
    'Puzzle': 'blue',
    'Arcade': 'green',
    'Strategy': 'purple',
    'Adventure': 'orange',
    'Simulation': 'pink',
    'Casual': 'yellow',
    'Action': 'red'
  };
  
  return colors[category] || 'gray';
}

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 