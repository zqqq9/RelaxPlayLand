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

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = (req, res) => {
    setCors(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        const allGames = readGames();

        const { status, category, search } = req.query || {};
        const page = parseInt((req.query && req.query.page) || '1', 10) || 1;
        const limit = parseInt((req.query && req.query.limit) || '10', 10) || 10;

        let filtered = Array.isArray(allGames) ? [...allGames] : [];

        // Public API 默认仅返回 approved
        filtered = filtered.filter(g => g && g.status === 'approved');

        if (status && status !== 'approved') {
            // 忽略非 approved 的过滤（保持与前端预期一致）
        }

        if (category) {
            filtered = filtered.filter(g => g && g.category === category);
        }

        if (search) {
            const s = String(search).toLowerCase();
            filtered = filtered.filter(g =>
                g && (
                    (g.name && g.name.toLowerCase().includes(s)) ||
                    (g.description && g.description.toLowerCase().includes(s))
                )
            );
        }

        // 时间倒序
        filtered.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginated = filtered.slice(startIndex, endIndex);

        return res.status(200).json({
            success: true,
            total: filtered.length,
            page,
            totalPages: Math.ceil(filtered.length / limit),
            games: paginated,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: String(error && error.message || error) });
    }
};


