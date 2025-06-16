import { Express } from 'express';
import { riotService } from '../services/riotService';
import { dataDragonService } from '../services/datadragonService';
import { matchRoutes } from './matches';

export function setupRoutes(app: Express): void {
  // API prefix
  const apiPrefix = '/api';
  
  // Register match routes
  app.use(`${apiPrefix}/matches`, matchRoutes);
  
  // Debug endpoint to check environment variables
  app.get(`${apiPrefix}/debug`, (req, res) => {
    res.json({
      hasApiKey: !!process.env.RIOT_API_KEY,
      apiKeyLength: process.env.RIOT_API_KEY ? process.env.RIOT_API_KEY.length : 0,
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV
    });
  });

  // TEST ENDPOINT: Direct API call to verify connection
  app.get(`${apiPrefix}/test-riot-api`, async (req, res) => {
    const axios = require('axios').default;
    
    console.log('🧪 Testing direct Riot API call...');
    console.log('🔑 API Key length:', process.env.RIOT_API_KEY ? process.env.RIOT_API_KEY.length : 0);
    
    try {
      const response = await axios.get(
        'https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/nilejr/NA1',
        {
          headers: { 'X-Riot-Token': process.env.RIOT_API_KEY },
          timeout: 10000
        }
      );
      
      console.log('✅ Direct API call successful!');
      res.json({
        success: true,
        message: 'Direct API call successful',
        data: response.data
      });
    } catch (error: any) {
      console.error('❌ Direct API call failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      res.status(500).json({
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  });

  // Data Dragon endpoints (no API key required)
  app.get(`${apiPrefix}/champions`, async (req, res) => {
    try {
      const champions = await dataDragonService.getChampions();
      res.json({
        success: true,
        data: champions
      });
    } catch (error: any) {
      console.error('Error fetching champions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch champions data'
      });
    }
  });

  app.get(`${apiPrefix}/champions/:championName`, async (req, res) => {
    try {
      const { championName } = req.params;
      const championDetails = await dataDragonService.getChampionDetails(championName);
      res.json({
        success: true,
        data: championDetails
      });
    } catch (error: any) {
      console.error(`Error fetching champion ${req.params.championName}:`, error);
      
      if (error.response?.status === 404) {
        return res.status(404).json({
          error: 'Champion not found',
          message: `Champion "${req.params.championName}" does not exist`
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch champion details'
      });
    }
  });

  app.get(`${apiPrefix}/items`, async (req, res) => {
    try {
      const items = await dataDragonService.getItems();
      res.json({
        success: true,
        data: items
      });
    } catch (error: any) {
      console.error('Error fetching items:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch items data'
      });
    }
  });
  
  // Summoner route
  app.get(`${apiPrefix}/summoner/:region/:name`, async (req, res) => {
    try {
      const { region, name } = req.params;
      console.log(`🔍 Fetching summoner: ${name} in region: ${region}`);
      
      if (!name || !region) {
        return res.status(400).json({
          error: 'Missing required parameters: region and name'
        });
      }

      const summoner = await riotService.getSummonerByName(name, region);
      
      res.json({
        success: true,
        data: summoner
      });
    } catch (error: any) {
      console.error('Error in summoner route:', error);
      
      if (error.response?.status === 404) {
        return res.status(404).json({
          error: 'Summoner not found',
          message: `No summoner found with name "${req.params.name}" in region "${req.params.region}"`
        });
      }
      
      if (error.response?.status === 403) {
        return res.status(403).json({
          error: 'API key invalid or expired',
          message: 'Please check your Riot API key configuration'
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch summoner data'
      });
    }
  });

  // NEW ROUTE: Account by Riot ID (gameName + tagLine) - RECOMMENDED
  app.get(`${apiPrefix}/account/:region/:gameName/:tagLine`, async (req, res) => {
    try {
      const { region, gameName, tagLine } = req.params;
      console.log(`🔍 Fetching account: ${gameName}#${tagLine} in region: ${region}`);
      
      if (!gameName || !tagLine || !region) {
        return res.status(400).json({
          error: 'Missing required parameters: region, gameName, and tagLine'
        });
      }

      const account = await riotService.getAccountByRiotId(gameName, tagLine, region);
      
      res.json({
        success: true,
        data: account
      });
    } catch (error: any) {
      console.error('Error in account route:', error);
      
      if (error.response?.status === 404) {
        return res.status(404).json({
          error: 'Account not found',
          message: `No account found with Riot ID "${req.params.gameName}#${req.params.tagLine}" in region "${req.params.region}"`
        });
      }
      
      if (error.response?.status === 403) {
        return res.status(403).json({
          error: 'API key invalid or expired',
          message: 'Please check your Riot API key configuration'
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch account data'
      });
    }
  });

  // NEW ROUTE: Summoner by PUUID - RECOMMENDED
  app.get(`${apiPrefix}/summoner/puuid/:region/:puuid`, async (req, res) => {
    try {
      const { region, puuid } = req.params;
      console.log(`🔍 Fetching summoner by PUUID: ${puuid} in region: ${region}`);
      
      if (!puuid || !region) {
        return res.status(400).json({
          error: 'Missing required parameters: region and puuid'
        });
      }

      const summoner = await riotService.getSummonerByPuuid(puuid, region);
      
      res.json({
        success: true,
        data: summoner
      });
    } catch (error: any) {
      console.error('Error in summoner by PUUID route:', error);
      
      if (error.response?.status === 404) {
        return res.status(404).json({
          error: 'Summoner not found',
          message: `No summoner found with PUUID "${req.params.puuid}" in region "${req.params.region}"`
        });
      }
      
      if (error.response?.status === 403) {
        return res.status(403).json({
          error: 'API key invalid or expired',
          message: 'Please check your Riot API key configuration'
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch summoner data'
      });
    }
  });

  // NEW ROUTE: Complete profile lookup (Account + Summoner) - MODERN APPROACH
  app.get(`${apiPrefix}/profile/:region/:gameName/:tagLine`, async (req, res) => {
    try {
      const { region, gameName, tagLine } = req.params;
      console.log(`🔍 Fetching complete profile: ${gameName}#${tagLine} in region: ${region}`);
      
      if (!gameName || !tagLine || !region) {
        return res.status(400).json({
          error: 'Missing required parameters: region, gameName, and tagLine'
        });
      }

      // Step 1: Get account information (includes PUUID)
      const account = await riotService.getAccountByRiotId(gameName, tagLine, region);
      
      // Step 2: Get summoner information using PUUID
      const summoner = await riotService.getSummonerByPuuid(account.puuid, region);
      
      res.json({
        success: true,
        data: {
          account,
          summoner
        }
      });
    } catch (error: any) {
      console.error('Error in complete profile route:', error);
      
      if (error.response?.status === 404) {
        return res.status(404).json({
          error: 'Profile not found',
          message: `No profile found with Riot ID "${req.params.gameName}#${req.params.tagLine}" in region "${req.params.region}"`
        });
      }
      
      if (error.response?.status === 403) {
        return res.status(403).json({
          error: 'API key invalid or expired',
          message: 'Please check your Riot API key configuration'
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch profile data'
      });
    }
  });

  // Live game route
  app.get(`${apiPrefix}/live/:region/:summonerId`, async (req, res) => {
    try {
      const { region, summonerId } = req.params;
      
      if (!summonerId || !region) {
        return res.status(400).json({
          error: 'Missing required parameters: region and summonerId'
        });
      }

      const liveGame = await riotService.getCurrentGame(summonerId, region);
      
      if (!liveGame) {
        return res.json({
          success: true,
          data: null,
          message: 'No active game found'
        });
      }
      
      res.json({
        success: true,
        data: liveGame
      });
    } catch (error: any) {
      console.error('Error in live game route:', error);
      
      if (error.response?.status === 403) {
        return res.status(403).json({
          error: 'API key invalid or expired',
          message: 'Please check your Riot API key configuration'
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch live game data'
      });
    }
  });
  
  // Catch-all for undefined API routes
  app.use(`${apiPrefix}/*`, (req, res) => {
    res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path 
    });
  });
} 