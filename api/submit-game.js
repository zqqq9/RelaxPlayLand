const fs = require('fs');
const path = require('path');

function readGames() {
    try {
        const dataFilePath = path.join(process.cwd(), 'data', 'games.json');
        const content = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        return [];
    }
}

function writeGames(games) {
    const dataFilePath = path.join(process.cwd(), 'data', 'games.json');
    fs.writeFileSync(dataFilePath, JSON.stringify(games, null, 2));
}

function createSlug(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
    setCors(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        const isJson = (req.headers['content-type'] || '').includes('application/json');
        if (!isJson) {
            return res.status(400).json({ success: false, message: 'Content-Type must be application/json' });
        }

        const body = req.body || {};
        const required = ['gameName', 'gameCategory', 'gameDescription', 'gameHowToPlay', 'gameIframe', 'gameImage'];
        for (const key of required) {
            if (!body[key]) {
                return res.status(400).json({ success: false, message: `${key} is required` });
            }
        }

        const allGames = readGames();
        const slug = createSlug(body.gameName);

        if (allGames.some(g => g && (g.slug === slug || g.name === body.gameName))) {
            return res.status(409).json({ success: false, message: 'A game with this name already exists.' });
        }

        // 生成新 ID
        const numericIds = allGames.map(g => parseInt(g.id, 10)).filter(n => !isNaN(n));
        const newId = (numericIds.length ? Math.max(...numericIds) + 1 : 1).toString();

        const tags = Array.isArray(body.gameTags)
            ? body.gameTags
            : (typeof body.gameTags === 'string' ? (safeParseArray(body.gameTags) || []) : []);

        const newGame = {
            id: newId,
            slug,
            name: body.gameName,
            category: body.gameCategory,
            description: body.gameDescription,
            howToPlay: body.gameHowToPlay,
            iframe: body.gameIframe,
            tags,
            image: body.gameImage,
            status: 'pending',
            dateAdded: new Date().toISOString()
        };

        allGames.push(newGame);
        writeGames(allGames);

        return res.status(200).json({ success: true, message: 'Game submitted successfully and is pending approval', game: newGame });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: String(error && error.message || error) });
    }
};

function safeParseArray(value) {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        return [];
    }
}


