import { useState, useEffect } from 'react'
import './App.css'
import { 
  createCombinedTheme, 
  applyTheme,
  createMantineTheme
} from './themes'
import { motion, AnimatePresence } from 'motion/react'
import { Modal, Button, Text, Tabs, Group, Title, Flex, MantineProvider } from '@mantine/core'
import GameDetailsModal from './GameDetailsModal'
import SettingsTab from './SettingsTab'
import { PlayerSearch } from './PlayerSearch'
import { 
  IconDeviceGamepad2, 
  IconSettings, 
  IconLoader,
  IconEye, 
  IconHistory, 
  IconCheck, 
  IconX, 
  IconAlertTriangle,
  IconRefresh
} from '@tabler/icons-react'



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
  const [currentBaseTheme, setCurrentBaseTheme] = useState<string>(() => 
    localStorage.getItem('lol-companion-base-theme') || 'dark'
  );
  const [currentAccentPalette, setCurrentAccentPalette] = useState<string>(() => 
    localStorage.getItem('lol-companion-accent-palette') || 'league'
  );

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

  const regionToCountryCode: { [key: string]: string } = {
    'NA1': 'us',
    'EUW': 'eu', 
    'EUNE': 'eu',
    'KR': 'kr',
    'BR1': 'br',
    'LAN': 'mx',
    'LAS': 'ar',
    'OCE': 'au',
    'TR': 'tr',
    'RU': 'ru',
    'JP': 'jp'
  };

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
  ].map(option => ({
    ...option,
    image: `https://flagicons.lipis.dev/flags/4x3/${regionToCountryCode[option.value]}.svg`
  }));

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

  // Create current combined theme
  const currentCombinedTheme = createCombinedTheme(currentBaseTheme, currentAccentPalette);
  const mantineTheme = createMantineTheme(currentCombinedTheme);

  // Load and apply theme on mount
  useEffect(() => {
    applyTheme(currentCombinedTheme);
  }, [currentCombinedTheme]);

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

  // Handle base theme change
  const handleBaseThemeChange = (baseThemeKey: string) => {
    setCurrentBaseTheme(baseThemeKey);
    localStorage.setItem('lol-companion-base-theme', baseThemeKey);
  };

  // Handle accent palette change
  const handleAccentPaletteChange = (accentKey: string) => {
    setCurrentAccentPalette(accentKey);
    localStorage.setItem('lol-companion-accent-palette', accentKey);
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
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
  };

  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme={currentCombinedTheme.isDark ? 'dark' : 'light'}>
      {/* Full-width Header */}
      <div className="full-width-header">
        <div className="header-container">
          <Flex justify="space-between" align="center" mb="lg">
            <Group align="center">
              <IconDeviceGamepad2 size={40} style={{ color: 'var(--primary-gold)' }} />
              <Title order={1} size="h1" style={{ color: 'var(--primary-gold)', margin: 0 }}>
                League of Legends Companion
              </Title>
            </Group>
            
            <Group>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <PlayerSearch
                  gameName={gameName}
                  tagLine={tagLine}
                  onGameNameChange={handleGameNameChange}
                  onTagLineChange={handleTagLineChange}
                  onSearch={testProfileAPI}
                  loading={loading === 'profile'}
                  tagLineOptions={tagLineOptions}
                />
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
            </Group>
          </Flex>
        </div>
        
        {/* Full-width Tabs */}
        <div className="tabs-container">
          <Tabs 
            value={activeTab} 
            onChange={(value) => setActiveTab(value as 'matches' | 'livegame' | 'settings')}
            variant="outline"
            className="mantine-header-tabs"
          >
            <Tabs.List>
              <Tabs.Tab value="matches" leftSection={<IconHistory size={18} />}>
                Match History
              </Tabs.Tab>
              <Tabs.Tab value="livegame" leftSection={<IconEye size={18} />}>
                Live Game
              </Tabs.Tab>
              <Tabs.Tab value="settings" leftSection={<IconSettings size={18} />}>
                Settings
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </div>
      </div>

      <div className="app">

      <div className="container">
        {/* Match History Page */}
        {activeTab === 'matches' && (
          <div className="section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0 }}><IconHistory size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Match History</h2>
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
                              {playerData.win ? <><IconCheck size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Victory</> : <><IconX size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Defeat</>}
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
            <h2><IconEye size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Live Game Check</h2>
            <p>Check if the player is currently in a live game.</p>
            <div className="form-note">
              <small><IconAlertTriangle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /><strong>Note:</strong> Live Game API requires production API key. Development keys have limited access to spectator endpoints.</small>
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
                <h3><IconDeviceGamepad2 size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Currently In Game!</h3>
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
          <SettingsTab
            currentBaseTheme={currentBaseTheme}
            currentAccentPalette={currentAccentPalette}
            onBaseThemeChange={handleBaseThemeChange}
            onAccentPaletteChange={handleAccentPaletteChange}
          />
        )}

        {/* Error Display - shows on all pages */}
        {error && (
          <div className="result error">
            <h3><IconX size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Error:</h3>
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
    </MantineProvider>
  )
}

export default App
