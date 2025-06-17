import { Modal, Text, Stack, Group, Badge } from '@mantine/core'
import { IconTrophy, IconClock, IconHistory } from '@tabler/icons-react'

interface GameDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchHistoryItem | null;
  currentPlayerPuuid: string;
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
      riotIdGameName?: string;
      riotIdTagline?: string;
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
      visionScore?: number;
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

export default function GameDetailsModal({ isOpen, onClose, match, currentPlayerPuuid }: GameDetailsModalProps) {
  // Only render if modal is open and has match data
  if (!isOpen || !match) {
    return null;
  }



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

  const getKDA = (participant: MatchHistoryItem['info']['participants'][0]) => {
    if (participant.deaths === 0) {
      return participant.kills + participant.assists > 0 ? 'Perfect' : '0.00';
    }
    return ((participant.kills + participant.assists) / participant.deaths).toFixed(2);
  };

  const getKDAColor = (participant: MatchHistoryItem['info']['participants'][0]) => {
    const kda = participant.deaths === 0 
      ? (participant.kills + participant.assists > 0 ? 99 : 0)
      : (participant.kills + participant.assists) / participant.deaths;
    
    if (kda >= 3.0) return 'var(--primary-green)';  // Excellent
    if (kda >= 2.0) return 'var(--primary-teal)';   // Good
    if (kda >= 1.5) return 'var(--primary-gold)';   // Average+
    if (kda >= 1.0) return 'var(--text-primary)';   // Average
    return 'var(--primary-red)';                     // Poor
  };

  const getPlayerDisplayName = (participant: MatchHistoryItem['info']['participants'][0]) => {
    // Prefer riotIdGameName if available, fallback to summonerName
    return participant.riotIdGameName || participant.summonerName;
  };

  const formatTimeAgo = (gameCreation: number) => {
    const now = Date.now();
    const gameTime = gameCreation;
    const diffInMs = now - gameTime;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    
    if (diffInHours < 2) {
      return `${diffInMinutes} min ago`;
    } else {
      return `${diffInHours}h ago`;
    }
  };

  // Separate teams
  const team1 = match.info.participants.filter(p => p.teamId === 100);
  const team2 = match.info.participants.filter(p => p.teamId === 200);
  
  const team1Won = team1[0]?.win || false;
  const currentPlayer = match.info.participants.find(p => p.puuid === currentPlayerPuuid);



  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconTrophy size={24} style={{ color: 'var(--primary-gold)' }} />
          <Text fw={700} size="lg" style={{ color: 'var(--text-primary)' }}>Game Details</Text>
        </Group>
      }
      size="95%"
      centered
      closeOnClickOutside
      closeOnEscape
      transitionProps={{ duration: 200 }}
      overlayProps={{ opacity: 0.6, blur: 3 }}
      styles={{
        content: {
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          maxWidth: '1400px',
        },
        header: {
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)',
        },
        body: {
          backgroundColor: 'var(--bg-secondary)',
        },
        close: {
          color: 'var(--text-primary)',
          '&:hover': {
            backgroundColor: 'var(--bg-tertiary)',
          },
        },
      }}
    >
      <Stack gap="md">
        {/* Game Info Header */}
        <Group justify="space-between" style={{ 
          padding: 'var(--spacing-md)', 
          backgroundColor: 'var(--bg-tertiary)', 
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-primary)'
        }}>
          <Group gap="xs">
            <Badge 
              color={currentPlayer?.win ? 'green' : 'red'} 
              size="lg"
              style={{ 
                backgroundColor: currentPlayer?.win ? 'var(--primary-green)' : 'var(--primary-red)',
                color: 'white'
              }}
            >
              {currentPlayer?.win ? 'Victory' : 'Defeat'}
            </Badge>
            <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
              {formatGameMode(match.info.gameMode)}
            </Text>
          </Group>
          <Group gap="xs">
            <Group gap={4}>
              <IconClock size={16} style={{ color: 'var(--text-secondary)' }} />
              <Text size="sm" style={{ color: 'var(--text-primary)' }}>
                {formatGameDuration(match.info.gameDuration)}
              </Text>
            </Group>
            <Group gap={4}>
              <IconHistory size={16} style={{ color: 'var(--text-secondary)' }} />
              <Text size="sm" style={{ color: 'var(--text-primary)' }}>
                {formatTimeAgo(match.info.gameCreation)}
              </Text>
            </Group>
          </Group>
        </Group>

        {/* Teams Side by Side */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 'var(--spacing-lg)',
          minHeight: '400px'
        }}>
          {/* Team 1 */}
          <div style={{ 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-primary)',
            padding: 'var(--spacing-md)'
          }}>
            <Badge 
              color={team1Won ? 'green' : 'red'} 
              mb="xs"
              style={{ 
                backgroundColor: team1Won ? 'var(--primary-green)' : 'var(--primary-red)',
                color: 'white',
                marginBottom: 'var(--spacing-sm)'
              }}
            >
              {team1Won ? 'Victory' : 'Defeat'} - Team 1
            </Badge>
            
            {/* Column Headers */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '60px 1fr 80px 40px 40px 40px 40px', 
              gap: '8px', 
              padding: '4px 8px',
              borderBottom: '1px solid var(--border-primary)',
              marginBottom: 'var(--spacing-xs)'
            }}>
              <div></div> {/* Champion portrait space */}
              <Text size="xs" fw={600} style={{ color: 'var(--text-secondary)' }}>Player</Text>
              <Text size="xs" fw={600} style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>KDA</Text>
              <Text size="xs" fw={600} style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>DMG</Text>
              <Text size="xs" fw={600} style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Gold</Text>
              <Text size="xs" fw={600} style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>CS</Text>
              <Text size="xs" fw={600} style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Vision</Text>
            </div>

            <Stack gap="xs">
              {(() => {
                // Calculate max values for team 1 for progress bars
                const maxDamage = Math.max(...team1.map(p => p.totalDamageDealtToChampions || 0));
                const maxGold = Math.max(...team1.map(p => p.goldEarned || 0));
                const maxCS = Math.max(...team1.map(p => p.totalMinionsKilled || 0));
                const maxVision = Math.max(...team1.map(p => p.visionScore || 0));

                return team1.map((player, index) => (
                  <div
                    key={index} 
                    style={{ 
                      backgroundColor: player.puuid === currentPlayerPuuid 
                        ? 'var(--primary-teal)' 
                        : 'var(--bg-primary)',
                      borderRadius: 'var(--border-radius-sm)',
                      border: player.puuid === currentPlayerPuuid 
                        ? '2px solid var(--primary-gold)' 
                        : '1px solid var(--border-primary)',
                      padding: 'var(--spacing-sm)',
                      opacity: player.puuid === currentPlayerPuuid ? 1 : 0.9
                    }}
                  >
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '60px 1fr 80px 40px 40px 40px 40px', 
                      gap: '8px', 
                      alignItems: 'center'
                    }}>
                      {/* Champion Portrait */}
                      <div style={{ flexShrink: 0 }}>
                        <img 
                          src={`https://ddragon.leagueoflegends.com/cdn/15.12.1/img/champion/${player.championName}.png`}
                          alt={player.championName}
                          style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: 'var(--border-radius-sm)',
                            border: '1px solid var(--border-primary)'
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      
                      {/* Player Info */}
                      <div>
                        <Text fw={500} size="sm" style={{ color: 'var(--text-primary)' }}>
                          {getPlayerDisplayName(player)}
                        </Text>
                        <Text size="xs" style={{ color: 'var(--text-secondary)' }}>
                          {player.championName}
                        </Text>
                      </div>
                      
                      {/* KDA */}
                      <div style={{ textAlign: 'center' }}>
                        <Text size="sm" fw={600} style={{ color: 'var(--text-primary)' }}>
                          {player.kills}/{player.deaths}/{player.assists}
                        </Text>
                        <Text size="xs" style={{ color: getKDAColor(player) }}>
                          {getKDA(player)}
                        </Text>
                      </div>
                      
                      {/* Damage with Progress Bar */}
                      <div style={{ textAlign: 'center' }}>
                        <Text size="xs" style={{ color: 'var(--text-primary)' }}>
                          {Math.round((player.totalDamageDealtToChampions || 0) / 1000)}k
                        </Text>
                        <div style={{
                          width: '30px',
                          height: '3px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '2px',
                          margin: '2px auto',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${maxDamage > 0 ? ((player.totalDamageDealtToChampions || 0) / maxDamage) * 100 : 0}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary-red)',
                            borderRadius: '2px'
                          }}></div>
                        </div>
                      </div>
                      
                      {/* Gold with Progress Bar */}
                      <div style={{ textAlign: 'center' }}>
                        <Text size="xs" style={{ color: 'var(--text-primary)' }}>
                          {Math.round((player.goldEarned || 0) / 1000)}k
                        </Text>
                        <div style={{
                          width: '30px',
                          height: '3px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '2px',
                          margin: '2px auto',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${maxGold > 0 ? ((player.goldEarned || 0) / maxGold) * 100 : 0}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary-gold)',
                            borderRadius: '2px'
                          }}></div>
                        </div>
                      </div>
                      
                      {/* CS with Progress Bar */}
                      <div style={{ textAlign: 'center' }}>
                        <Text size="xs" style={{ color: 'var(--text-primary)' }}>
                          {player.totalMinionsKilled || 0}
                        </Text>
                        <div style={{
                          width: '30px',
                          height: '3px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '2px',
                          margin: '2px auto',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${maxCS > 0 ? ((player.totalMinionsKilled || 0) / maxCS) * 100 : 0}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary-teal)',
                            borderRadius: '2px'
                          }}></div>
                        </div>
                      </div>
                      
                      {/* Vision with Progress Bar */}
                      <div style={{ textAlign: 'center' }}>
                        <Text size="xs" style={{ color: 'var(--text-primary)' }}>
                          {player.visionScore || 0}
                        </Text>
                        <div style={{
                          width: '30px',
                          height: '3px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '2px',
                          margin: '2px auto',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${maxVision > 0 ? ((player.visionScore || 0) / maxVision) * 100 : 0}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary-blue)',
                            borderRadius: '2px'
                          }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </Stack>
          </div>

          {/* Team 2 */}
          <div style={{ 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-primary)',
            padding: 'var(--spacing-md)'
          }}>
            <Badge 
              color={!team1Won ? 'green' : 'red'} 
              mb="xs"
              style={{ 
                backgroundColor: !team1Won ? 'var(--primary-green)' : 'var(--primary-red)',
                color: 'white',
                marginBottom: 'var(--spacing-sm)'
              }}
            >
              {!team1Won ? 'Victory' : 'Defeat'} - Team 2
            </Badge>
            
            {/* Column Headers */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '60px 1fr 80px 40px 40px 40px 40px', 
              gap: '8px', 
              padding: '4px 8px',
              borderBottom: '1px solid var(--border-primary)',
              marginBottom: 'var(--spacing-xs)'
            }}>
              <div></div> {/* Champion portrait space */}
              <Text size="xs" fw={600} style={{ color: 'var(--text-secondary)' }}>Player</Text>
              <Text size="xs" fw={600} style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>KDA</Text>
              <Text size="xs" fw={600} style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>DMG</Text>
              <Text size="xs" fw={600} style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Gold</Text>
              <Text size="xs" fw={600} style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>CS</Text>
              <Text size="xs" fw={600} style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Vision</Text>
            </div>

            <Stack gap="xs">
              {(() => {
                // Calculate max values for team 2 for progress bars
                const maxDamage = Math.max(...team2.map(p => p.totalDamageDealtToChampions || 0));
                const maxGold = Math.max(...team2.map(p => p.goldEarned || 0));
                const maxCS = Math.max(...team2.map(p => p.totalMinionsKilled || 0));
                const maxVision = Math.max(...team2.map(p => p.visionScore || 0));

                return team2.map((player, index) => (
                  <div
                    key={index} 
                    style={{ 
                      backgroundColor: player.puuid === currentPlayerPuuid 
                        ? 'var(--primary-teal)' 
                        : 'var(--bg-primary)',
                      borderRadius: 'var(--border-radius-sm)',
                      border: player.puuid === currentPlayerPuuid 
                        ? '2px solid var(--primary-gold)' 
                        : '1px solid var(--border-primary)',
                      padding: 'var(--spacing-sm)',
                      opacity: player.puuid === currentPlayerPuuid ? 1 : 0.9
                    }}
                  >
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '60px 1fr 80px 40px 40px 40px 40px', 
                      gap: '8px', 
                      alignItems: 'center'
                    }}>
                      {/* Champion Portrait */}
                      <div style={{ flexShrink: 0 }}>
                        <img 
                          src={`https://ddragon.leagueoflegends.com/cdn/15.12.1/img/champion/${player.championName}.png`}
                          alt={player.championName}
                          style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: 'var(--border-radius-sm)',
                            border: '1px solid var(--border-primary)'
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      
                      {/* Player Info */}
                      <div>
                        <Text fw={500} size="sm" style={{ color: 'var(--text-primary)' }}>
                          {getPlayerDisplayName(player)}
                        </Text>
                        <Text size="xs" style={{ color: 'var(--text-secondary)' }}>
                          {player.championName}
                        </Text>
                      </div>
                      
                      {/* KDA */}
                      <div style={{ textAlign: 'center' }}>
                        <Text size="sm" fw={600} style={{ color: 'var(--text-primary)' }}>
                          {player.kills}/{player.deaths}/{player.assists}
                        </Text>
                        <Text size="xs" style={{ color: getKDAColor(player) }}>
                          {getKDA(player)}
                        </Text>
                      </div>
                      
                      {/* Damage with Progress Bar */}
                      <div style={{ textAlign: 'center' }}>
                        <Text size="xs" style={{ color: 'var(--text-primary)' }}>
                          {Math.round((player.totalDamageDealtToChampions || 0) / 1000)}k
                        </Text>
                        <div style={{
                          width: '30px',
                          height: '3px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '2px',
                          margin: '2px auto',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${maxDamage > 0 ? ((player.totalDamageDealtToChampions || 0) / maxDamage) * 100 : 0}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary-red)',
                            borderRadius: '2px'
                          }}></div>
                        </div>
                      </div>
                      
                      {/* Gold with Progress Bar */}
                      <div style={{ textAlign: 'center' }}>
                        <Text size="xs" style={{ color: 'var(--text-primary)' }}>
                          {Math.round((player.goldEarned || 0) / 1000)}k
                        </Text>
                        <div style={{
                          width: '30px',
                          height: '3px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '2px',
                          margin: '2px auto',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${maxGold > 0 ? ((player.goldEarned || 0) / maxGold) * 100 : 0}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary-gold)',
                            borderRadius: '2px'
                          }}></div>
                        </div>
                      </div>
                      
                      {/* CS with Progress Bar */}
                      <div style={{ textAlign: 'center' }}>
                        <Text size="xs" style={{ color: 'var(--text-primary)' }}>
                          {player.totalMinionsKilled || 0}
                        </Text>
                        <div style={{
                          width: '30px',
                          height: '3px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '2px',
                          margin: '2px auto',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${maxCS > 0 ? ((player.totalMinionsKilled || 0) / maxCS) * 100 : 0}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary-teal)',
                            borderRadius: '2px'
                          }}></div>
                        </div>
                      </div>
                      
                      {/* Vision with Progress Bar */}
                      <div style={{ textAlign: 'center' }}>
                        <Text size="xs" style={{ color: 'var(--text-primary)' }}>
                          {player.visionScore || 0}
                        </Text>
                        <div style={{
                          width: '30px',
                          height: '3px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '2px',
                          margin: '2px auto',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${maxVision > 0 ? ((player.visionScore || 0) / maxVision) * 100 : 0}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary-blue)',
                            borderRadius: '2px'
                          }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </Stack>
          </div>
        </div>

        {/* Footer */}
        <Group justify="space-between" style={{ 
          padding: 'var(--spacing-sm)', 
          backgroundColor: 'var(--bg-tertiary)', 
          borderRadius: 'var(--border-radius-sm)',
          border: '1px solid var(--border-primary)'
        }}>
          <Text size="xs" style={{ color: 'var(--text-secondary)' }}>
            Match ID: {match.metadata.matchId}
          </Text>
          <Text size="xs" style={{ color: 'var(--text-secondary)' }}>
            {formatTimeAgo(match.info.gameCreation)}
          </Text>
        </Group>
      </Stack>
    </Modal>
  );
} 