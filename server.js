const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const slugify = require('slugify');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/')));

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads/games');
    
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
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

// API路由
app.post('/api/submit-game', upload.single('gameImage'), (req, res) => {
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
    const gamesDir = path.join(__dirname, 'games');
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
      image: req.file ? `/uploads/games/${req.file.filename}` : null,
      developer: {
        name: gameData.developerName,
        email: gameData.developerEmail,
        website: gameData.developerWebsite || ''
      },
      dateAdded: new Date().toISOString(),
      status: 'pending' // 待审核
    };
    
    // 保存游戏数据到JSON文件
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

// 获取游戏列表API
app.get('/api/games', (req, res) => {
  try {
    const games = getGames();
    
    // 根据查询参数过滤游戏
    let filteredGames = [...games];
    
    // 按状态过滤
    if (req.query.status) {
      filteredGames = filteredGames.filter(game => game.status === req.query.status);
    }
    
    // 按类别过滤
    if (req.query.category) {
      filteredGames = filteredGames.filter(game => game.category === req.query.category);
    }
    
    // 按名称搜索
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredGames = filteredGames.filter(game => 
        game.name.toLowerCase().includes(searchTerm) || 
        game.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // 分页
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedGames = filteredGames.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      total: filteredGames.length,
      page,
      totalPages: Math.ceil(filteredGames.length / limit),
      games: paginatedGames
    });
    
  } catch (error) {
    console.error('获取游戏列表时出错:', error);
    res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
  }
});

// 获取相关游戏API
app.get('/api/related-games', (req, res) => {
  try {
    const { category, excludeId, limit = 3 } = req.query;
    const games = getGames().filter(game => game.status === 'approved');
    
    let relatedGames = [];
    
    if (category) {
      // 首先尝试获取相同类别的游戏
      relatedGames = games.filter(game => 
        game.category === category && 
        game.id !== excludeId
      );
    }
    
    // 如果相同类别的游戏不足，添加其他游戏
    if (relatedGames.length < limit) {
      const otherGames = games.filter(game => 
        !relatedGames.includes(game) && 
        game.id !== excludeId
      );
      
      relatedGames = [
        ...relatedGames,
        ...otherGames.slice(0, limit - relatedGames.length)
      ];
    } else {
      // 如果相关游戏超过限制，随机选择指定数量
      relatedGames = shuffleArray(relatedGames).slice(0, limit);
    }
    
    res.json(relatedGames);
    
  } catch (error) {
    console.error('获取相关游戏时出错:', error);
    res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
  }
});

// 管理员审核游戏API
app.post('/api/admin/approve-game/:id', (req, res) => {
  try {
    const gameId = req.params.id;
    
    // 获取所有游戏
    const games = getGames();
    
    // 查找游戏
    const gameIndex = games.findIndex(game => game.id === gameId);
    if (gameIndex === -1) {
      return res.status(404).json({ success: false, message: '游戏未找到' });
    }
    
    // 更新游戏状态为已批准
    games[gameIndex].status = 'approved';
    
    // 保存更新后的数据
    saveGamesData(games);
    
    // 更新主页上的游戏列表
    updateGamesList();
    
    res.json({ success: true, message: '游戏已批准并发布' });
    
  } catch (error) {
    console.error('批准游戏时出错:', error);
    res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
  }
});

// 管理员拒绝游戏API
app.post('/api/admin/reject-game/:id', (req, res) => {
  try {
    const gameId = req.params.id;
    
    // 获取所有游戏
    const games = getGames();
    
    // 查找游戏
    const gameIndex = games.findIndex(game => game.id === gameId);
    if (gameIndex === -1) {
      return res.status(404).json({ success: false, message: '游戏未找到' });
    }
    
    // 更新游戏状态为已拒绝
    games[gameIndex].status = 'rejected';
    
    // 保存更新后的数据
    saveGamesData(games);
    
    res.json({ success: true, message: '游戏已被拒绝' });
    
  } catch (error) {
    console.error('拒绝游戏时出错:', error);
    res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
  }
});

// 保存游戏数据到JSON文件
function saveGameData(gameData) {
  const games = getGames();
  games.push(gameData);
  saveGamesData(games);
}

// 保存所有游戏数据
function saveGamesData(games) {
  const dataDir = path.join(__dirname, 'data');
  const gamesDataFile = path.join(dataDir, 'games.json');
  
  // 确保数据目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 保存数据
  fs.writeFileSync(gamesDataFile, JSON.stringify(games, null, 2), 'utf8');
}

// 获取所有游戏数据
function getGames() {
  const gamesDataFile = path.join(__dirname, 'data/games.json');
  
  if (!fs.existsSync(gamesDataFile)) {
    return [];
  }
  
  const data = fs.readFileSync(gamesDataFile, 'utf8');
  return JSON.parse(data);
}

// 生成游戏页面HTML
function generateGamePage(gameData) {
  // 读取游戏页面模板
  const templatePath = path.join(__dirname, 'templates/game-template.html');
  
  if (!fs.existsSync(templatePath)) {
    console.error('游戏模板文件不存在:', templatePath);
    return;
  }
  
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
  template = template.replace(/{{GAME_SLUG}}/g, gameData.slug);
  
  // 处理标签
  let tagsHtml = '';
  if (gameData.tags && gameData.tags.length > 0) {
    tagsHtml = gameData.tags.map(tag => `<span class="game-tag">${tag}</span>`).join('');
  }
  template = template.replace(/{{GAME_TAGS}}/g, tagsHtml);
  
  // 确保games目录存在
  const gamesDir = path.join(__dirname, 'games');
  if (!fs.existsSync(gamesDir)) {
    fs.mkdirSync(gamesDir, { recursive: true });
  }
  
  // 写入生成的HTML文件
  const filePath = path.join(gamesDir, `${gameData.slug}.html`);
  fs.writeFileSync(filePath, template, 'utf8');
  
  console.log(`游戏页面已生成: ${filePath}`);
}

// 更新主页上的游戏列表
function updateGamesList() {
  try {
    // 获取已批准的游戏
    const approvedGames = getGames().filter(game => game.status === 'approved');
    
    // 读取主页模板
    const indexTemplatePath = path.join(__dirname, 'templates/index-template.html');
    
    if (!fs.existsSync(indexTemplatePath)) {
      console.error('主页模板文件不存在:', indexTemplatePath);
      return;
    }
    
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
    const indexPath = path.join(__dirname, 'index.html');
    fs.writeFileSync(indexPath, indexTemplate, 'utf8');
    
    console.log('主页游戏列表已更新');
    
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

// 打乱数组顺序（用于随机选择相关游戏）
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 