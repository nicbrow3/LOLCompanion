# League of Legends Companion

A web application that provides real-time information about League of Legends games and player profiles using the Riot Games API.

## Features

- **Summoner Profile Lookup**: Search for any summoner by name and region
- **Live Game Information**: Get real-time data about ongoing matches
- **Match History**: View detailed match history and statistics
- **Real-time Updates**: WebSocket integration for live game updates

## Tech Stack

### Frontend (Client)
- React 18 with TypeScript
- Vite for fast development
- React Router for navigation
- TanStack Query for data fetching and caching

### Backend (Server)
- Node.js with Express
- TypeScript
- Socket.IO for real-time communication
- Axios for HTTP requests
- Node-cache for API response caching

## Project Structure

```
lol-companion/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── ...
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Riot API service
│   │   ├── types/          # TypeScript types
│   │   └── index.ts        # Server entry point
│   └── package.json
├── .env.example           # Environment variables template
└── README.md
```

## Setup Instructions

### 1. Get a Riot API Key
1. Go to [Riot Developer Portal](https://developer.riotgames.com/)
2. Sign in with your Riot account
3. Create a new app and get your API key

### 2. Environment Setup
1. Copy `.env.example` to `.env`
2. Add your Riot API key:
   ```
   RIOT_API_KEY=your_api_key_here
   PORT=4000
   CLIENT_URL=http://localhost:5173
   ```

### 3. Install Dependencies

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd client
npm install
```

### 4. Run the Application

#### Start the backend server
```bash
cd server
npm run dev
```
The server will run on http://localhost:4000

#### Start the frontend (in a new terminal)
```bash
cd client
npm run dev
```
The client will run on http://localhost:5173

## API Endpoints

### Summoner
- `GET /api/summoner/:region/:name` - Get summoner profile by name

### Live Game
- `GET /api/live/:region/:summonerId` - Get current game information

### Matches
- `GET /api/matches/history/:region/:puuid` - Get match history
- `GET /api/matches/details/:region/:matchId` - Get match details
- `GET /api/matches/timeline/:region/:matchId` - Get match timeline

## Supported Regions

- `na1` - North America
- `euw1` - Europe West
- `eun1` - Europe Nordic & East
- `kr` - Korea
- `br1` - Brazil
- `la1` - Latin America North
- `la2` - Latin America South
- `oc1` - Oceania
- `tr1` - Turkey
- `ru` - Russia
- `jp1` - Japan

## WebSocket Events

### Client to Server
- `subscribe-live-game` - Subscribe to live game updates for a summoner
- `unsubscribe-live-game` - Unsubscribe from live game updates

### Server to Client
- `live-game-update` - Real-time game state updates
- `error` - Error notifications

## Development

### Backend Development
```bash
cd server
npm run dev  # Starts with hot reload
```

### Frontend Development
```bash
cd client
npm run dev  # Starts with hot reload
```

### Building for Production
```bash
# Backend
cd server
npm run build

# Frontend
cd client
npm run build
```

## Rate Limits

The Riot API has the following rate limits for development keys:
- 20 requests per 1 second
- 100 requests per 2 minutes

The application includes caching to help stay within these limits.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes. Riot Games API usage must comply with their Terms of Service. 