import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';

// Cache for 30 seconds by default
const cache = new NodeCache({ stdTTL: 30 });

class RiotService {
  private apiKey: string;
  private baseUrls: { [region: string]: string };
  private regionalUrls: { [region: string]: string };
  private axiosInstance: AxiosInstance;

  constructor() {
    this.apiKey = process.env.RIOT_API_KEY || '';
    
    console.log('🏗️  Initializing RiotService...');
    console.log('🔑 API Key loaded:', this.apiKey ? `Yes (${this.apiKey.length} chars)` : 'No');
    
    if (!this.apiKey) {
      console.warn('⚠️  RIOT_API_KEY not found in environment variables');
    }

    // Platform-specific URLs (for summoner, live game, etc.)
    this.baseUrls = {
      'na1': 'https://na1.api.riotgames.com',
      'euw1': 'https://euw1.api.riotgames.com',
      'eun1': 'https://eun1.api.riotgames.com',
      'kr': 'https://kr.api.riotgames.com',
      'br1': 'https://br1.api.riotgames.com',
      'la1': 'https://la1.api.riotgames.com',
      'la2': 'https://la2.api.riotgames.com',
      'oc1': 'https://oc1.api.riotgames.com',
      'tr1': 'https://tr1.api.riotgames.com',
      'ru': 'https://ru.api.riotgames.com',
      'jp1': 'https://jp1.api.riotgames.com',
    };

    // Regional URLs (for match history and account-v1)
    this.regionalUrls = {
      'americas': 'https://americas.api.riotgames.com',
      'europe': 'https://europe.api.riotgames.com',
      'asia': 'https://asia.api.riotgames.com',
    };

    this.axiosInstance = axios.create({
      headers: {
        'X-Riot-Token': this.apiKey,
      },
      timeout: 10000,
    });
    
    console.log('✅ RiotService initialized successfully');
  }

  private getRegionalUrl(region: string): string {
    // Map platform regions to regional endpoints
    const regionMapping: { [key: string]: string } = {
      'na1': 'americas',
      'br1': 'americas',
      'la1': 'americas',
      'la2': 'americas',
      'euw1': 'europe',
      'eun1': 'europe',
      'tr1': 'europe',
      'ru': 'europe',
      'kr': 'asia',
      'jp1': 'asia',
      'oc1': 'asia',
    };
    
    const regionalKey = regionMapping[region] || 'americas';
    return this.regionalUrls[regionalKey];
  }

  // NEW METHOD: Get account information by Riot ID (gameName + tagLine)
  // This is the recommended approach and replaces the deprecated summoner name lookup
  async getAccountByRiotId(gameName: string, tagLine: string, region: string = 'na1') {
    const cacheKey = `account-${gameName}-${tagLine}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log(`🔄 Returning cached account data for ${gameName}#${tagLine}`);
      return cached;
    }

    try {
      const regionalUrl = this.getRegionalUrl(region);
      const url = `${regionalUrl}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
      
      console.log(`🔍 Fetching account data from: ${url}`);
      console.log(`🔑 Using API key length: ${this.apiKey.length}`);
      
      const response = await this.axiosInstance.get(url);

      console.log(`✅ Account data retrieved successfully for ${gameName}#${tagLine}`);
      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching account by Riot ID:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      if ((error as any).response) {
        console.error('Response status:', (error as any).response.status);
        console.error('Response data:', (error as any).response.data);
      }
      throw error;
    }
  }

  // NEW METHOD: Get account information by PUUID
  async getAccountByPuuid(puuid: string, region: string = 'na1') {
    const cacheKey = `account-puuid-${puuid}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const regionalUrl = this.getRegionalUrl(region);
      
      const response = await this.axiosInstance.get(
        `${regionalUrl}/riot/account/v1/accounts/by-puuid/${puuid}`
      );

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching account by PUUID:', error);
      throw error;
    }
  }

  // NEW METHOD: Get summoner by PUUID (recommended over by-name)
  async getSummonerByPuuid(puuid: string, region: string = 'na1') {
    const cacheKey = `summoner-puuid-${region}-${puuid}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const baseUrl = this.baseUrls[region];
      if (!baseUrl) {
        throw new Error(`Unsupported region: ${region}`);
      }

      const response = await this.axiosInstance.get(
        `${baseUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`
      );

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching summoner by PUUID:', error);
      throw error;
    }
  }

  async getSummonerByName(summonerName: string, region: string = 'na1') {
    const cacheKey = `summoner-${region}-${summonerName.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const baseUrl = this.baseUrls[region];
      if (!baseUrl) {
        throw new Error(`Unsupported region: ${region}`);
      }

      const response = await this.axiosInstance.get(
        `${baseUrl}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`
      );

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching summoner:', error);
      throw error;
    }
  }

  async getCurrentGame(summonerId: string, region: string = 'na1') {
    const cacheKey = `live-game-${region}-${summonerId}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const baseUrl = this.baseUrls[region];
      if (!baseUrl) {
        throw new Error(`Unsupported region: ${region}`);
      }

      const response = await this.axiosInstance.get(
        `${baseUrl}/lol/spectator/v4/active-games/by-summoner/${summonerId}`
      );

      // Cache for shorter time since live games change frequently
      cache.set(cacheKey, response.data, 15); // 15 seconds
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // No active game - this is normal
        return null;
      }
      console.error('Error fetching current game:', error);
      throw error;
    }
  }

  async getMatchHistory(puuid: string, region: string = 'na1', start: number = 0, count: number = 20) {
    const cacheKey = `match-history-${region}-${puuid}-${start}-${count}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const regionalUrl = this.getRegionalUrl(region);
      
      const response = await this.axiosInstance.get(
        `${regionalUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
        {
          params: { start, count }
        }
      );

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching match history:', error);
      throw error;
    }
  }

  async getMatchDetails(matchId: string, region: string = 'na1') {
    const cacheKey = `match-details-${matchId}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const regionalUrl = this.getRegionalUrl(region);
      
      const response = await this.axiosInstance.get(
        `${regionalUrl}/lol/match/v5/matches/${matchId}`
      );

      // Cache match details for longer since they don't change
      cache.set(cacheKey, response.data, 300); // 5 minutes
      return response.data;
    } catch (error) {
      console.error('Error fetching match details:', error);
      throw error;
    }
  }

  async getMatchTimeline(matchId: string, region: string = 'na1') {
    const cacheKey = `match-timeline-${matchId}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const regionalUrl = this.getRegionalUrl(region);
      
      const response = await this.axiosInstance.get(
        `${regionalUrl}/lol/match/v5/matches/${matchId}/timeline`
      );

      cache.set(cacheKey, response.data, 300); // 5 minutes
      return response.data;
    } catch (error) {
      console.error('Error fetching match timeline:', error);
      throw error;
    }
  }

  async getPlatformStatus(region: string = 'na1') {
    const cacheKey = `platform-status-${region}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const baseUrl = this.baseUrls[region];
      if (!baseUrl) {
        throw new Error(`Unsupported region: ${region}`);
      }

      const response = await this.axiosInstance.get(
        `${baseUrl}/lol/status/v4/platform-data`
      );

      cache.set(cacheKey, response.data, 60); // 1 minute cache
      return response.data;
    } catch (error) {
      console.error('Error fetching platform status:', error);
      throw error;
    }
  }
}

export const riotService = new RiotService(); 