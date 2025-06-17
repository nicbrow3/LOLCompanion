import { useState } from 'react'
import { Modal, Button, Text, Switch, Group } from '@mantine/core'
import { 
  IconTool, 
  IconPalette, 
  IconInfoCircle,
  IconCheck,
  IconX,
  IconLoader,
  IconSun,
  IconMoon
} from '@tabler/icons-react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  accentColorPalettes
} from './themes'

interface DebugResponse {
  hasApiKey: boolean;
  apiKeyLength: number;
  port: string;
  nodeEnv?: string;
}

interface SettingsTabProps {
  currentBaseTheme: string;
  currentAccentPalette: string;
  onBaseThemeChange: (baseThemeKey: string) => void;
  onAccentPaletteChange: (accentKey: string) => void;
}

export default function SettingsTab({
  currentBaseTheme,
  currentAccentPalette,
  onBaseThemeChange,
  onAccentPaletteChange
}: SettingsTabProps) {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [debugResult, setDebugResult] = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>

      {/* Theme Selector Section */}
      <div className="section">
        <h2><IconPalette size={24} style={{ marginRight: '8px' }} />Theme Settings</h2>
        
        <div className="theme-selector" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Base Theme Selector */}
          <div>
            <Group gap="md" style={{ alignItems: 'center' }}>
              <IconSun size={18} style={{ color: 'var(--text-secondary)' }} />
              <Switch
                checked={currentBaseTheme === 'dark'}
                onChange={(event) => onBaseThemeChange(event.currentTarget.checked ? 'dark' : 'light')}
                size="md"
                color="blue"
                thumbIcon={
                  currentBaseTheme === 'dark' ? (
                    <IconMoon size={12} style={{ color: 'white' }} />
                  ) : (
                    <IconSun size={12} style={{ color: 'orange' }} />
                  )
                }
              />
              <IconMoon size={18} style={{ color: 'var(--text-secondary)' }} />
            </Group>
          </div>

          {/* Accent Color Palette Selector */}
          <div>
            <label htmlFor="accent-palette-select" className="theme-label">
              <strong>Accent Color Palette:</strong>
            </label>
            
            {/* Color palette grid for visual selection */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                gap: '10px', 
                marginTop: '8px'
            }}>
              {Object.entries(accentColorPalettes).map(([key, palette]) => (
                <div
                  key={key}
                  onClick={() => onAccentPaletteChange(key)}
                  style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: currentAccentPalette === key ? `2px solid ${palette.colors.primary}` : '1px solid var(--border-primary)',
                      backgroundColor: currentAccentPalette === key ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                  }}
                  title={`Select ${palette.name} palette`}
                >
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div 
                      style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          backgroundColor: palette.colors.primary,
                          border: '1px solid var(--border-primary)'
                      }}
                      title={`Primary: ${palette.colors.primary}`}
                    />
                    <div 
                      style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          backgroundColor: palette.colors.secondary,
                        border: '1px solid var(--border-primary)'
                      }}
                      title={`Secondary: ${palette.colors.secondary}`}
                    />
                    <div 
                      style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          backgroundColor: palette.colors.success,
                          border: '1px solid var(--border-primary)'
                      }}
                      title={`Success: ${palette.colors.success}`}
                    />
                    <div 
                      style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          backgroundColor: palette.colors.error,
                          border: '1px solid var(--border-primary)'
                      }}
                      title={`Error: ${palette.colors.error}`}
                    />
                    <div 
                      style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          backgroundColor: palette.colors.info,
                          border: '1px solid var(--border-primary)'
                      }}
                      title={`Info: ${palette.colors.info}`}
                    />
                  </div>
                  <span style={{ 
                      fontSize: '14px', 
                      fontWeight: currentAccentPalette === key ? '600' : '400',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap'
                  }}>
                    {palette.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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

        {error && (
          <div className="result error">
            <h3><IconX size={20} style={{ marginRight: '8px' }} />Error:</h3>
            <p>{error}</p>
            <small>Make sure both the frontend and backend servers are running.</small>
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
    </>
  )
} 