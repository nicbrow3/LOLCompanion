import { useState, useEffect } from 'react'
import './App.css'
import { themes, defaultTheme, baseThemes } from './themes'
import { motion, AnimatePresence } from 'motion/react'
import { Modal, Button, Text } from '@mantine/core'
import GameDetailsModal from './GameDetailsModal'
import { 
  IconDeviceGamepad2, 
  IconSearch, 
  IconSettings, 
  IconLoader,
  IconEye, 
  IconHistory, 
  IconCheck, 
  IconX, 
  IconAlertTriangle,
  IconPalette,
  IconTool,
  IconInfoCircle,
  IconRefresh,
  IconSparkles
} from '@tabler/icons-react'

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
      totalDamageDealtToChampions?: number;
      goldEarned?: number;
      totalMinionsKilled?: number;
      wardsPlaced?: number;
      item0?: number;
      item1?: number;
      item2?: number;
      item3?: number;
      item4?: number;
      item5?: number;
      item6?: number;
    }>;
  };
}

function App() {
  const [activeTab, setActiveTab] = useState<'matches' | 'livegame' | 'settings'>('matches');
  const [currentTheme, setCurrentTheme] = useState<string>(defaultTheme);
  const [debugResult, setDebugResult] = useState<DebugResponse | null>(null);
  const [profileResult, setProfileResult] = useState<ProfileData | null>(null);
  const [liveGameResult, setLiveGameResult] = useState<LiveGameData | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
  const [matchHistoryLoading, setMatchHistoryLoading] = useState(false);
  const [matchHistoryStart, setMatchHistoryStart] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameName, setGameName] = useState(() => localStorage.getItem('lol-companion-gameName') || 'nilejr');
  const [tagLine, setTagLine] = useState(() => localStorage.getItem('lol-companion-tagLine') || 'NA1');
  const [region, setRegion] = useState(() => localStorage.getItem('lol-companion-region') || 'na1');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchHistoryItem | null>(null);

  // Test modal state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

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
    localStorage.setItem('lol-companion-tagLine', newTagLine);
    
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
      const newRegion = regionMap[newTagLine];
      setRegion(newRegion);
      localStorage.setItem('lol-companion-region', newRegion);
    }
  };

  // Wrapper functions to save to localStorage
  const handleGameNameChange = (newGameName: string) => {
    setGameName(newGameName);
    localStorage.setItem('lol-companion-gameName', newGameName);
  };

  const API_BASE = 'http://localhost:4000/api';

  // Apply theme to CSS custom properties
  const applyTheme = (themeKey: string) => {
    const theme = themes[themeKey];
    if (!theme) return;
    
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([property, value]) => {
      root.style.setProperty(`--${property}`, value);
    });
  };

  // Load saved theme or apply default theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('lol-companion-theme') || defaultTheme;
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Auto-search on page load if user info is filled
  useEffect(() => {
    const autoSearch = async () => {
      // Only auto-search if we have both gameName and tagLine, and no profile is loaded yet
      if (gameName && tagLine && !profileResult && !loading) {
        console.log('🔄 Auto-searching for user on page load:', { gameName, tagLine, region });
        await testProfileAPI();
      }
    };

    // Add a small delay to ensure other useEffects have run
    const timer = setTimeout(() => {
      autoSearch();
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this runs once on mount

  // Auto-load match history when profile is successfully loaded
  useEffect(() => {
    if (profileResult?.account?.puuid && activeTab === 'matches') {
      const timer = setTimeout(() => {
        loadMatchHistory(false);
      }, 500); // Give enough time for profile state to settle
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileResult?.account?.puuid, activeTab]);

  // Handle theme change
  const handleThemeChange = (themeKey: string) => {
    setCurrentTheme(themeKey);
    applyTheme(themeKey);
    localStorage.setItem('lol-companion-theme', themeKey);
  };

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
    
    // Minimum loading time to show animation
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const [response] = await Promise.all([
        fetch(`${API_BASE}/profile/${region}/${gameName}/${tagLine}`),
        minLoadingTime
      ]);
      
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
    
    // Minimum loading time to show animation
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 600));
    
    const start = loadMore ? matchHistoryStart : 0;
    const count = 5;
    
    try {
      const [matchDetails] = await Promise.all([
        (async () => {
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
            return [];
          }
          
          // Get match details for each match
          const details = await Promise.all(
            matchIds.map(async (matchId: string) => {
              const detailsResponse = await fetch(`${API_BASE}/matches/details/${region}/${matchId}`);
              if (!detailsResponse.ok) {
                throw new Error(`Failed to fetch details for match ${matchId}`);
              }
              const detailsData = await detailsResponse.json();
              return detailsData.data;
            })
          );
          
          return details;
        })(),
        minLoadingTime
      ]);
      
      if (matchDetails.length === 0) {
        if (!loadMore) {
          setMatchHistory([]);
        }
        return;
      }
      
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

  // Modal handlers
  const handleMatchClick = (match: MatchHistoryItem) => {
    console.log('🎯 Match clicked:', {
      matchId: match.metadata.matchId,
      currentModalState: isModalOpen,
      selectedMatch: selectedMatch?.metadata?.matchId
    });
    setSelectedMatch(match);
    setIsModalOpen(true);
    console.log('📖 Modal state after click:', {
      willBeOpen: true,
      matchSet: !!match
    });
  };

  const handleCloseModal = () => {
    console.log('❌ Closing modal...');
    setIsModalOpen(false);
    setSelectedMatch(null);
  };

  return (
    <>
      <div className="app">
        <div className="header">
          <div className="header-main">
            <div className="header-content">
              <h1><IconDeviceGamepad2 size={40} style={{ display: 'inline', marginRight: '12px' }} />League of Legends Companion</h1>
            </div>
          
          {/* Compact Player Search */}
          <div className="player-search-compact">
            <div className="compact-form">
              <div className="compact-input-row">
                <input
                  type="text"
                  placeholder="Game Name"
                  value={gameName}
                  onChange={(e) => handleGameNameChange(e.target.value)}
                  className="input-compact"
                />
                <span className="hashtag-compact">#</span>
                <select
                  value={tagLine}
                  onChange={(e) => handleTagLineChange(e.target.value)}
                  className="select-compact"
                >
                  {tagLineOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={testProfileAPI} 
                  disabled={loading === 'profile' || !gameName || !tagLine}
                  className="btn btn-compact"
                >
                  <AnimatePresence mode="wait">
                    {loading === 'profile' ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <IconLoader size={16} className="spinning" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="search"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <IconSearch size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
              
              {profileResult && (
                <div className="profile-compact">
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/15.12.1/img/profileicon/${profileResult.summoner.profileIconId}.png`}
                    alt="Profile Icon"
                    className="profile-icon-compact"
                  />
                  <div className="profile-text-compact">
                    <strong>{profileResult.account.gameName}#{profileResult.account.tagLine}</strong>
                    <span>Level {profileResult.summoner.summonerLevel}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="tab-nav">
          <button 
            className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            <IconHistory size={18} style={{ marginRight: '8px' }} />Match History
          </button>
          <button 
            className={`tab-btn ${activeTab === 'livegame' ? 'active' : ''}`}
            onClick={() => setActiveTab('livegame')}
          >
            <IconEye size={18} style={{ marginRight: '8px' }} />Live Game
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <IconSettings size={18} style={{ marginRight: '8px' }} />Settings
          </button>
        </div>
      </div>

      <div className="container">
        {/* Match History Page */}
        {activeTab === 'matches' && (
          <div className="section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0 }}><IconHistory size={24} style={{ marginRight: '8px' }} />Match History</h2>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Recent games load automatically when you search for a player</p>
              </div>
              
              <motion.button 
                onClick={() => loadMatchHistory(false)} 
                disabled={matchHistoryLoading || !profileResult?.account?.puuid}
                className="btn btn-secondary"
                style={{ 
                  minWidth: '44px',
                  height: '44px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Refresh match history"
              >
                <AnimatePresence mode="wait">
                  {matchHistoryLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IconLoader size={20} className="spinning" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="refresh"
                      initial={{ opacity: 0, rotate: 90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IconRefresh size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            {matchHistory.length > 0 && (
              <div className="result success">
                <h3><IconDeviceGamepad2 size={20} style={{ marginRight: '8px' }} />Recent Games ({matchHistory.length})</h3>
                <div className="match-list">
                  {matchHistory.map((match) => {
                    // Find the current player's data in the match
                    const playerData = match.info.participants.find(
                      (p) => p.puuid === profileResult?.account?.puuid
                    );
                    
                    if (!playerData) return null;

                    return (
                      <div 
                        key={match.metadata.matchId} 
                        className={`match-item ${playerData.win ? 'victory' : 'defeat'}`}
                        onClick={() => handleMatchClick(match)}
                        title="Click to view detailed game information"
                      >
                        <div className="match-header">
                          <div className="match-result">
                            <span className={`result-text ${playerData.win ? 'victory' : 'defeat'}`}>
                              {playerData.win ? <><IconCheck size={16} style={{ marginRight: '6px' }} />Victory</> : <><IconX size={16} style={{ marginRight: '6px' }} />Defeat</>}
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
                
                <motion.button 
                  onClick={() => loadMatchHistory(true)} 
                  disabled={matchHistoryLoading}
                  className="btn btn-secondary"
                  layout
                  animate={{
                    width: matchHistoryLoading ? '120px' : '170px'
                  }}
                  transition={{ 
                    layout: { duration: 0.3, ease: "easeInOut" },
                    width: { duration: 0.3, ease: "easeInOut" }
                  }}
                  style={{ overflow: 'hidden' }}
                >
                  <AnimatePresence mode="wait">
                    {matchHistoryLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                      >
                        <IconLoader size={18} className="spinning" style={{ marginRight: '6px' }} />Loading...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="refresh"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                      >
                        <IconRefresh size={18} style={{ marginRight: '6px' }} />Load More Games
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            )}
          </div>
        )}

        {/* Live Game Page */}
        {activeTab === 'livegame' && (
          <div className="section">
            <h2><IconEye size={24} style={{ marginRight: '8px' }} />Live Game Check</h2>
            <p>Check if the player is currently in a live game.</p>
            <div className="form-note">
              <small><IconAlertTriangle size={16} style={{ marginRight: '6px' }} /><strong>Note:</strong> Live Game API requires production API key. Development keys have limited access to spectator endpoints.</small>
            </div>
            
            <button 
              onClick={checkLiveGame} 
              disabled={loading === 'livegame' || !profileResult?.summoner?.id}
              className="btn btn-primary"
            >
              <AnimatePresence mode="wait">
                {loading === 'livegame' ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ display: 'flex', alignItems: 'center', minWidth: '200px', justifyContent: 'center' }}
                  >
                    <IconLoader size={18} className="spinning" style={{ marginRight: '6px' }} />Checking...
                  </motion.div>
                ) : (
                  <motion.div
                    key="eye"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ display: 'flex', alignItems: 'center', minWidth: '200px', justifyContent: 'center' }}
                  >
                    <IconEye size={18} style={{ marginRight: '6px' }} />Check Live Game (Demo)
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {liveGameResult && (
              <div className="result success">
                <h3><IconDeviceGamepad2 size={20} style={{ marginRight: '8px' }} />Currently In Game!</h3>
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
        )}

        {activeTab === 'settings' && (
          <>
            {/* Modal Test Section */}
            <div className="section">
              <h2><IconTool size={24} style={{ marginRight: '8px' }} />Modal Test</h2>
              <p>Test if Mantine modals are working correctly.</p>
              
              <Button 
                onClick={() => {
                  console.log('🧪 Opening test modal...');
                  setIsTestModalOpen(true);
                }}
                color="blue"
                size="md"
              >
                Open Test Modal
              </Button>
            </div>

            {/* Theme Selector Section */}
            <div className="section">
              <h2><IconPalette size={24} style={{ marginRight: '8px' }} />Theme Settings</h2>
              <p>Choose your preferred color theme for the application.</p>
              
              <div className="theme-selector">
                <label htmlFor="theme-select" className="theme-label">
                  <strong>Select Theme:</strong>
                </label>
                <select
                  id="theme-select"
                  value={currentTheme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="select theme-select"
                >
                  {Object.entries(themes).map(([key, theme]) => (
                    <option key={key} value={key}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="theme-preview">
                <h4>Current Theme: {themes[currentTheme]?.name}</h4>
                <div className="color-palette">
                  {Object.entries(baseThemes[currentTheme]?.baseColors || {}).map(([name, color]) => (
                    <div key={name} className="color-swatch">
                      <div 
                        className="color-circle"
                        style={{ backgroundColor: color }}
                        title={`${name}: ${color}`}
                      />
                      <span className="color-name">{name}</span>
                    </div>
                  ))}
                </div>
                <div className="theme-info">
                  <small><IconSparkles size={16} style={{ marginRight: '6px' }} />All other colors are automatically generated from these 6 base colors!</small>
                </div>
              </div>
            </div>

            {/* API Debug Section */}
            <div className="section">
              <h2><IconTool size={24} style={{ marginRight: '8px' }} />API Debug Test</h2>
              <p>Test if the backend server is running and configured correctly.</p>
              
              <button 
                onClick={testDebugAPI} 
                disabled={loading === 'debug'}
                className="btn btn-primary"
              >
                <AnimatePresence mode="wait">
                  {loading === 'debug' ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ display: 'flex', alignItems: 'center', minWidth: '140px', justifyContent: 'center' }}
                    >
                      <IconLoader size={18} className="spinning" style={{ marginRight: '6px' }} />Testing...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tool"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ display: 'flex', alignItems: 'center', minWidth: '140px', justifyContent: 'center' }}
                    >
                      <IconTool size={18} style={{ marginRight: '6px' }} />Test Debug API
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {debugResult && (
                <div className="result success">
                  <h3><IconCheck size={20} style={{ marginRight: '8px' }} />Server Status:</h3>
                  <ul>
                    <li><strong>API Key:</strong> {debugResult.hasApiKey ? <><IconCheck size={16} style={{ marginRight: '6px' }} />Configured</> : <><IconX size={16} style={{ marginRight: '6px' }} />Missing</>}</li>
                    <li><strong>Key Length:</strong> {debugResult.apiKeyLength} characters</li>
                    <li><strong>Port:</strong> {debugResult.port}</li>
                    {debugResult.nodeEnv && <li><strong>Environment:</strong> {debugResult.nodeEnv}</li>}
                  </ul>
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="section info">
              <h2><IconInfoCircle size={24} style={{ marginRight: '8px' }} />Quick Info</h2>
              <ul>
                <li><strong>Frontend:</strong> http://localhost:5173</li>
                <li><strong>Backend API:</strong> http://localhost:4000</li>
                <li><strong>Uses Modern:</strong> Riot Account-v1 API</li>
                <li><strong>Features:</strong> PUUID → Summoner lookup</li>
              </ul>
            </div>
          </>
        )}

        {/* Error Display - shows on all pages */}
        {error && (
          <div className="result error">
            <h3><IconX size={20} style={{ marginRight: '8px' }} />Error:</h3>
            <p>{error}</p>
            <small>Make sure both the frontend and backend servers are running.</small>
          </div>
        )}
      </div>
    </div>

      {/* Test Modal - Simple modal to debug visibility */}
      <Modal
        opened={isTestModalOpen}
        onClose={() => {
          console.log('🧪 Test modal closing...');
          setIsTestModalOpen(false);
        }}
        title="🧪 Simple Test Modal"
        centered
        size="sm"
      >
        <div style={{ padding: '20px' }}>
          <Text size="lg" fw={600} mb="md">
            ✅ Test Modal is Working!
          </Text>
          <Text mb="lg">
            If you can see this, then Mantine modals are working correctly.
            The issue might be specific to the GameDetailsModal component.
          </Text>
          <Button 
            onClick={() => setIsTestModalOpen(false)} 
            fullWidth
            color="green"
          >
            Close Test Modal
          </Button>
        </div>
      </Modal>

      {/* Game Details Modal - Outside main app container */}
      <GameDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        match={selectedMatch}
        currentPlayerPuuid={profileResult?.account?.puuid || ''}
      />
    </>
  )
}

export default App
