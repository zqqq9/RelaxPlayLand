# RelaxPlayLand

A game website featuring a responsive design and category-based game filtering.

## Features

- Browse games by categories
- Sort games by newest or alphabetically
- Responsive design for mobile and desktop
- Game cards with hover effects
- Dynamic pagination

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## API Endpoints

- `/api/games` - Get all games

## Project Structure

- `index.html` - Main homepage
- `categories.html` - Categories page with filtering
- `js/categories.js` - JavaScript for the categories page functionality
- `api/server.js` - Express server for serving the website and API
- `api/games.json` - Game data in JSON format

## 🌟 Features

- **Responsive Design**: Optimized for both desktop and mobile devices
- **SEO Optimized**: Complete with meta tags, structured data, and canonical URLs
- **Apple-Inspired Design**: Clean, modern interface using Apple's color palette
- **Fast Loading**: Optimized for performance and user experience
- **Accessible**: Built with accessibility best practices
- **Game Submission**: Users can submit their own games to be featured on the platform
- **Admin Dashboard**: Administrators can review and approve submitted games

## 🎮 Current Games

### Dalgona Candy Honeycomb Cookie
- **Category**: Puzzle
- **Difficulty**: Medium
- **Description**: Test your patience and precision by carving intricate patterns into honeycomb candy without breaking it. Inspired by the viral Squid Game challenge.
- **URL**: `/games/dalgona-candy.html`

## 🛠️ Technology Stack

- **HTML5**: Semantic markup with proper SEO structure
- **Tailwind CSS**: Utility-first CSS framework for styling
- **JavaScript**: Vanilla JS for interactivity
- **Node.js**: Backend server for game submission and processing
- **Express**: Web framework for handling API requests
- **Responsive Design**: Mobile-first approach

## 📁 Project Structure

```
relaxplayland/
├── index.html                 # Homepage
├── games/                     # Game pages
│   └── dalgona-candy.html     # Dalgona Candy game page
├── admin/                     # Admin dashboard
│   └── game-management.html   # Game management page
├── src/
│   └── input.css              # Tailwind CSS input file
├── dist/
│   └── output.css             # Compiled CSS (generated)
├── templates/                 # HTML templates
│   ├── game-template.html     # Template for game pages
│   └── index-template.html    # Template for homepage
├── data/                      # Data storage (JSON files)
│   └── games.json             # Game data (generated)
├── uploads/                   # User uploaded files
│   └── games/                 # Game images
├── server.js                  # Express server for game submission
├── submit-game.html           # Game submission form
├── package.json               # Project dependencies
├── tailwind.config.js         # Tailwind configuration
└── README.md                  # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd relaxplayland
```

2. Install dependencies:
```bash
npm install
```

3. Build the CSS:
```bash
npm run build
```

4. Start the development server:
```bash
npm run start
```

5. Open your browser and navigate to `http://localhost:3000`

### Development

For development with auto-reload:
```bash
npm run dev:server
```

For CSS development with auto-reload:
```bash
npm run dev
```

## 🎨 Game Submission Feature

RelaxPlayLand allows users to submit their own games to be featured on the platform. The submission process includes:

1. **Submit Game Form**: Users fill out a form with game details and iframe embed code
2. **Review Process**: Administrators review submitted games through the admin dashboard
3. **Approval/Rejection**: Games can be approved or rejected by administrators
4. **Automatic Page Generation**: Approved games automatically get their own page created

### How to Submit a Game

1. Navigate to `/submit-game.html`
2. Fill out the form with:
   - Game name
   - Category
   - Description
   - How to play instructions
   - Game features
   - Game iframe embed code
   - Developer information
3. Submit the form
4. Wait for administrator approval

### Admin Dashboard

Administrators can manage game submissions through the admin dashboard:

1. Navigate to `/admin/game-management.html`
2. Login with admin credentials
3. Review pending game submissions
4. Approve or reject submissions
5. View all approved and rejected games

## 🎨 Design System

### Colors (Apple-Inspired)
- **Primary Blue**: `#007AFF`
- **Green**: `#34C759`
- **Orange**: `#FF9500`
- **Red**: `#FF3B30`
- **Purple**: `#AF52DE`
- **Pink**: `#FF2D92`
- **Gray**: `#8E8E93`
- **Light Gray**: `#F2F2F7`
- **Dark Gray**: `#1C1C1E`

### Typography
- **Font Family**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **H1**: 4xl-6xl (responsive)
- **H2**: 3xl-4xl (responsive)
- **Body**: Base size with proper line height

## 🔍 SEO Features

- **Meta Tags**: Complete meta description, keywords, and author tags
- **Open Graph**: Social media sharing optimization
- **Twitter Cards**: Twitter-specific meta tags
- **Structured Data**: JSON-LD schema markup
- **Canonical URLs**: Proper canonical link tags
- **Semantic HTML**: Proper heading hierarchy (H1, H2, H3)
- **Alt Text**: Descriptive alt attributes for images
- **Page Titles**: Optimized titles for each page

## 📱 Responsive Design

The website is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🎯 Performance Optimizations

- **Lazy Loading**: Images and iframes load on demand
- **Minified CSS**: Production-ready compiled styles
- **Optimized Images**: Placeholder images for development
- **Fast Loading**: Minimal JavaScript for better performance

## 🔧 Customization

### Adding New Games

1. Use the game submission form at `/submit-game.html`
2. Wait for administrator approval
3. Once approved, the game will be automatically added to the homepage

### Manual Game Addition

1. Create a new HTML file in the `games/` directory
2. Follow the structure of `dalgona-candy.html`
3. Update the homepage to include the new game card
4. Add proper SEO meta tags and structured data

### Styling Changes

1. Modify `src/input.css` for custom styles
2. Update `tailwind.config.js` for theme changes
3. Run `npm run build` to compile changes

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions, please contact us through the website.

---

**RelaxPlayLand** - Your ultimate destination for relaxing online games.

## Project Structure

- `admin/` - Admin interface for game management
- `data/` - JSON data files for games
- `dist/` - Compiled CSS files
- `functions/` - API endpoints for Cloudflare Workers
- `images/` - Game and site images
- `src/` - Source CSS files for Tailwind
- `server.js` - Local development server

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Build the CSS:
   ```
   npm run build
   ```

3. Start the local development server:
   ```
   npm start
   ```

4. Access the admin interface:
   ```
   http://localhost:3000/admin/login.html
   ```
   Use the API key: `dev-api-key-123` for development

## Game Management Page Fix

The game management page was not displaying games due to missing API endpoints. The following changes were made to fix the issue:

1. Created the missing API endpoints:
   - `/api/admin/games` - Get all games with filtering and pagination
   - `/api/admin/games/:id` - Get a specific game by ID
   - `/api/admin/approve-game/:id` - Approve a game
   - `/api/admin/reject-game/:id` - Reject a game
   - `/api/admin/games/batch-approve` - Batch approve games
   - `/api/admin/games/batch-reject` - Batch reject games

2. Updated the frontend code to use local API URLs in development mode:
   ```javascript
   const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
   const API_URL = isLocalDev ? '/api/admin/games' : 'https://relaxplayland.online/api/admin/games';
   ```

3. Added test games data to the `data/games.json` file with different statuses (approved, pending, rejected)

4. Created a simple Express server (`server.js`) that serves the static files and implements the API endpoints for local development

## API Endpoints

### Admin API

- `GET /api/admin/games` - Get all games with filtering and pagination
  - Query parameters: `status`, `search`, `page`, `limit`
  - Requires Authorization header: `Bearer <api_key>`

- `GET /api/admin/games/:id` - Get a specific game by ID
  - Requires Authorization header: `Bearer <api_key>`

- `POST /api/admin/approve-game/:id` - Approve a game
  - Request body: `{ "feedback": "Optional feedback" }`
  - Requires Authorization header: `Bearer <api_key>`

- `POST /api/admin/reject-game/:id` - Reject a game
  - Request body: `{ "feedback": "Rejection reason" }`
  - Requires Authorization header: `Bearer <api_key>`

- `POST /api/admin/games/batch-approve` - Batch approve games
  - Request body: `{ "gameIds": ["1", "2"], "feedback": "Optional feedback" }`
  - Requires Authorization header: `Bearer <api_key>`

- `POST /api/admin/games/batch-reject` - Batch reject games
  - Request body: `{ "gameIds": ["3", "4"], "feedback": "Rejection reason" }`
  - Requires Authorization header: `Bearer <api_key>`

### Public API

- `GET /api/games` - Get all approved games with filtering and pagination
  - Query parameters: `category`, `search`, `page`, `limit`

## Development

For development with automatic CSS rebuilding and server restarting:

```
npm run build
npm run dev:server
```

## Deployment

For production deployment, build the CSS and start the server:

```
npm run build
npm start
```

## License

MIT 