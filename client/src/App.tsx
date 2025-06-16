import { useState } from 'react'
import './App.css'

interface DebugResponse {
  hasApiKey: boolean;
  apiKeyLength: number;
  port: string;
  nodeEnv?: string;
}

interface ProfileData {
  account: {
    puuid: string;
    gameName: string;
    tagLine: string;
  };
  summoner: {
    id: string;
    summonerLevel: number;
    profileIconId: number;
  };
}

interface LiveGameData {
  gameId: number;
  gameMode: string;
  gameType: string;
  gameLength: number;
  participants: Array<{
    championId: number;
    summonerName: string;
    teamId: number;
  }>;
}

interface MatchHistoryItem {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    gameType: string;
    participants: Array<{
      championId: number;
      championName: string;
      summonerName: string;
      kills: number;
      deaths: number;
      assists: number;
      win: boolean;
      teamId: number;
      puuid: string;
    }>;
  };
}

function App() {
  const [debugResult, setDebugResult] = useState<DebugResponse | null>(null);
  const [profileResult, setProfileResult] = useState<ProfileData | null>(null);
  const [liveGameResult, setLiveGameResult] = useState<LiveGameData | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
  const [matchHistoryLoading, setMatchHistoryLoading] = useState(false);
  const [matchHistoryStart, setMatchHistoryStart] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameName, setGameName] = useState('nilejr');
  const [tagLine, setTagLine] = useState('NA1');
  const [region, setRegion] = useState('na1');

  // Common tagLine options that match regions
  const tagLineOptions = [
    { value: 'NA1', label: 'NA1 - North America' },
    { value: 'EUW', label: 'EUW - Europe West' },
    { value: 'EUNE', label: 'EUNE - Europe Nordic & East' },
    { value: 'KR', label: 'KR - Korea' },
    { value: 'BR1', label: 'BR1 - Brazil' },
    { value: 'LAN', label: 'LAN - Latin America North' },
    { value: 'LAS', label: 'LAS - Latin America South' },
    { value: 'OCE', label: 'OCE - Oceania' },
    { value: 'TR', label: 'TR - Turkey' },
    { value: 'RU', label: 'RU - Russia' },
    { value: 'JP', label: 'JP - Japan' }
  ];

  // Auto-update region when tagLine changes
  const handleTagLineChange = (newTagLine: string) => {
    setTagLine(newTagLine);
    // Auto-map tagLine to corresponding region
    const regionMap: { [key: string]: string } = {
      'NA1': 'na1',
      'EUW': 'euw1', 
      'EUNE': 'eun1',
      'KR': 'kr',
      'BR1': 'br1',
      'LAN': 'la1',
      'LAS': 'la2',
      'OCE': 'oc1',
      'TR': 'tr1',
      'RU': 'ru',
      'JP': 'jp1'
    };
    if (regionMap[newTagLine]) {
      setRegion(regionMap[newTagLine]);
    }
  };

  const API_BASE = 'http://localhost:4000/api';

  const testDebugAPI = async () => {
    setLoading('debug');
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/debug`);
      if (!response.ok) throw new Error('Failed to fetch debug info');
      const data = await response.json();
      setDebugResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(null);
    }
  };

  const testProfileAPI = async () => {
    setLoading('profile');
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/profile/${region}/${gameName}/${tagLine}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }
      const data = await response.json();
      setProfileResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(null);
    }
  };

  const checkLiveGame = async () => {
    if (!profileResult?.summoner?.id) {
      setError('Please search for a player first to check their live game');
      return;
    }

    setLoading('livegame');
    setError(null);
    setLiveGameResult(null);
    
    try {
      const response = await fetch(`${API_BASE}/live/${region}/${profileResult.summoner.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch live game');
      }
      const data = await response.json();
      
      if (data.data) {
        setLiveGameResult(data.data);
      } else {
        setLiveGameResult(null);
        setError('Player is not currently in a game');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLiveGameResult(null);
    } finally {
      setLoading(null);
    }
  };

  const loadMatchHistory = async (loadMore: boolean = false) => {
    if (!profileResult?.account?.puuid) {
      setError('Please search for a player first to load their match history');
      return;
    }

    setMatchHistoryLoading(true);
    setError(null);
    
    const start = loadMore ? matchHistoryStart : 0;
    const count = 5;
    
    try {
      // Get match IDs
      const historyResponse = await fetch(
        `${API_BASE}/matches/history/${region}/${profileResult.account.puuid}?start=${start}&count=${count}`
      );
      
      if (!historyResponse.ok) {
        const errorData = await historyResponse.json();
        throw new Error(errorData.message || 'Failed to fetch match history');
      }
      
      const historyData = await historyResponse.json();
      const matchIds = historyData.data;
      
      if (!matchIds || matchIds.length === 0) {
        if (!loadMore) {
          setMatchHistory([]);
        }
        return;
      }
      
      // Get match details for each match
      const matchDetails = await Promise.all(
        matchIds.map(async (matchId: string) => {
          const detailsResponse = await fetch(`${API_BASE}/matches/details/${region}/${matchId}`);
          if (!detailsResponse.ok) {
            throw new Error(`Failed to fetch details for match ${matchId}`);
          }
          const detailsData = await detailsResponse.json();
          return detailsData.data;
        })
      );
      
      if (loadMore) {
        setMatchHistory(prev => [...prev, ...matchDetails]);
        setMatchHistoryStart(start + count);
      } else {
        setMatchHistory(matchDetails);
        setMatchHistoryStart(count);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMatchHistoryLoading(false);
    }
  };

  const formatGameDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatGameMode = (mode: string) => {
    const modeMap: { [key: string]: string } = {
      'CLASSIC': 'Ranked Solo/Duo',
      'ARAM': 'ARAM',
      'CHERRY': 'Arena',
      'NEXUSBLITZ': 'Nexus Blitz',
      'ONEFORALL': 'One for All',
      'PRACTICETOOL': 'Practice Tool'
    };
    return modeMap[mode] || mode;
  };

  return (
    <div className="app">
      <div className="header">
        <h1>🎮 League of Legends Companion</h1>
        <p>Modern Riot API Integration with Account-v1</p>
      </div>

      <div className="container">
        {/* API Debug Section */}
        <div className="section">
          <h2>🔧 API Debug Test</h2>
          <p>Test if the backend server is running and configured correctly.</p>
          
          <button 
            onClick={testDebugAPI} 
            disabled={loading === 'debug'}
            className="btn btn-primary"
          >
            {loading === 'debug' ? '🔄 Testing...' : '🧪 Test Debug API'}
          </button>

          {debugResult && (
            <div className="result success">
              <h3>✅ Server Status:</h3>
              <ul>
                <li><strong>API Key:</strong> {debugResult.hasApiKey ? '✅ Configured' : '❌ Missing'}</li>
                <li><strong>Key Length:</strong> {debugResult.apiKeyLength} characters</li>
                <li><strong>Port:</strong> {debugResult.port}</li>
                {debugResult.nodeEnv && <li><strong>Environment:</strong> {debugResult.nodeEnv}</li>}
              </ul>
            </div>
          )}
        </div>

        {/* Profile Lookup Section */}
        <div className="section">
          <h2>👤 Player Profile Lookup</h2>
          <p>Search for a player using their Riot ID (gameName#tagLine).</p>
          
          <div className="form-group">
            <div className="input-row">
              <input
                type="text"
                placeholder="Game Name"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="input"
              />
              <span className="hashtag">#</span>
              <select
                value={tagLine}
                onChange={(e) => handleTagLineChange(e.target.value)}
                className="select"
              >
                {tagLineOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-note">
              <small>Region will be automatically set based on your tagLine selection: <strong>{region}</strong></small>
            </div>
            
            <button 
              onClick={testProfileAPI} 
              disabled={loading === 'profile' || !gameName || !tagLine}
              className="btn btn-success"
            >
              {loading === 'profile' ? '🔄 Searching...' : '🔍 Search Player'}
            </button>
          </div>

          {profileResult && (
            <div className="result success">
              <h3>✅ Player Found:</h3>
              <div className="profile-card">
                <div className="profile-header">
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/15.12.1/img/profileicon/${profileResult.summoner.profileIconId}.png`}
                    alt="Profile Icon"
                    className="profile-icon"
                  />
                  <div className="profile-info">
                    <h4>{profileResult.account.gameName}#{profileResult.account.tagLine}</h4>
                    <p><strong>Level:</strong> {profileResult.summoner.summonerLevel}</p>
                    <p><strong>PUUID:</strong> <code>{profileResult.account.puuid.substring(0, 20)}...</code></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Game Section */}
        <div className="section">
          <h2>🎮 Live Game Check</h2>
          <p>Check if the player is currently in a live game.</p>
          <div className="form-note">
            <small>⚠️ <strong>Note:</strong> Live Game API requires production API key. Development keys have limited access to spectator endpoints.</small>
          </div>
          
          <button 
            onClick={checkLiveGame} 
            disabled={loading === 'livegame' || !profileResult?.summoner?.id}
            className="btn btn-primary"
          >
            {loading === 'livegame' ? '🔄 Checking...' : '🔍 Check Live Game (Demo)'}
          </button>

          {liveGameResult && (
            <div className="result success">
              <h3>🎮 Currently In Game!</h3>
              <div className="live-game-info">
                <div className="game-details">
                  <p><strong>Game Mode:</strong> {liveGameResult.gameMode}</p>
                  <p><strong>Game Type:</strong> {liveGameResult.gameType}</p>
                  <p><strong>Game Length:</strong> {Math.floor(liveGameResult.gameLength / 60)}:{(liveGameResult.gameLength % 60).toString().padStart(2, '0')}</p>
                  <p><strong>Participants:</strong> {liveGameResult.participants.length} players</p>
                </div>
                
                <div className="participants">
                  <h4>Players in this game:</h4>
                  <div className="participant-list">
                    {liveGameResult.participants.map((participant, index) => (
                      <div key={index} className={`participant team-${participant.teamId}`}>
                        <span className="champion-id">Champion {participant.championId}</span>
                        <span className="summoner-name">{participant.summonerName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Match History Section */}
        <div className="section">
          <h2>📜 Match History</h2>
          <p>View the player's recent games and performance.</p>
          
          <button 
            onClick={() => loadMatchHistory(false)} 
            disabled={matchHistoryLoading || !profileResult?.account?.puuid}
            className="btn btn-primary"
          >
            {matchHistoryLoading ? '🔄 Loading...' : '📊 Load Recent Games'}
          </button>

          {matchHistory.length > 0 && (
            <div className="result success">
              <h3>🎮 Recent Games ({matchHistory.length})</h3>
              <div className="match-list">
                {matchHistory.map((match) => {
                  // Find the current player's data in the match
                  const playerData = match.info.participants.find(
                    (p) => p.puuid === profileResult?.account?.puuid
                  );
                  
                  if (!playerData) return null;

                  return (
                    <div key={match.metadata.matchId} className={`match-item ${playerData.win ? 'victory' : 'defeat'}`}>
                      <div className="match-header">
                        <div className="match-result">
                          <span className={`result-text ${playerData.win ? 'victory' : 'defeat'}`}>
                            {playerData.win ? '✅ Victory' : '❌ Defeat'}
                          </span>
                          <span className="match-mode">{formatGameMode(match.info.gameMode)}</span>
                        </div>
                        <div className="match-duration">
                          {formatGameDuration(match.info.gameDuration)}
                        </div>
                      </div>
                      
                      <div className="match-details">
                        <div className="champion-info">
                          <span className="champion-name">{playerData.championName}</span>
                        </div>
                        
                        <div className="kda">
                          <span className="kda-text">
                            {playerData.kills} / {playerData.deaths} / {playerData.assists}
                          </span>
                          <span className="kda-ratio">
                            KDA: {playerData.deaths === 0 ? 'Perfect' : ((playerData.kills + playerData.assists) / playerData.deaths).toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="match-time">
                          {new Date(match.info.gameCreation).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button 
                onClick={() => loadMatchHistory(true)} 
                disabled={matchHistoryLoading}
                className="btn btn-secondary"
              >
                {matchHistoryLoading ? '🔄 Loading...' : '📈 Load More Games'}
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="result error">
            <h3>❌ Error:</h3>
            <p>{error}</p>
            <small>Make sure both the frontend and backend servers are running.</small>
          </div>
        )}

        {/* Quick Info */}
        <div className="section info">
          <h2>ℹ️ Quick Info</h2>
          <ul>
            <li><strong>Frontend:</strong> http://localhost:5173</li>
            <li><strong>Backend API:</strong> http://localhost:4000</li>
            <li><strong>Uses Modern:</strong> Riot Account-v1 API</li>
            <li><strong>Features:</strong> PUUID → Summoner lookup</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
