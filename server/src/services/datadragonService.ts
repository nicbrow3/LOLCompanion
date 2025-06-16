/**
 * Data Dragon Service
 * 
 * This service handles all interactions with Riot's Data Dragon API, which provides
 * static League of Legends data like champions, items, and game assets.
 * 
 * Data Dragon is a free API that doesn't require authentication, making it perfect
 * for getting champion information, item data, and images.
 * 
 * Key Features:
 * - Champion data (names, abilities, stats, lore)
 * - Item information and images
 * - Game version management
 * - Automatic caching (1 hour TTL)
 * - Image URL generation for champions and items
 * 
 * Usage Examples:
 * - Get all champions: dataDragonService.getChampions()
 * - Get champion details: dataDragonService.getChampionDetails('Ahri')
 * - Get items: dataDragonService.getItems()
 * - Get champion image: dataDragonService.getChampionImageUrl('Ahri')
 * 
 * API Endpoints this service provides:
 * - GET /api/champions - List all champions
 * - GET /api/champions/:name - Get specific champion details
 * - GET /api/items - Get all items
 * 
 * Data Dragon Documentation: https://developer.riotgames.com/docs/lol#data-dragon
 */

import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';

// Cache for 1 hour since static data doesn't change often
const cache = new NodeCache({ stdTTL: 3600 });

class DataDragonService {
  private axiosInstance: AxiosInstance;
  private currentVersion: string = '';

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
    });
  }

  /**
   * Gets the current League of Legends game version
   * This is used to construct URLs for champion/item data and images
   * @returns Promise<string> - Latest game version (e.g., "15.12.1")
   */
  async getCurrentVersion(): Promise<string> {
    if (this.currentVersion) {
      return this.currentVersion;
    }

    const cacheKey = 'lol-version';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      this.currentVersion = cached as string;
      return this.currentVersion;
    }

    try {
      const response = await this.axiosInstance.get(
        'https://ddragon.leagueoflegends.com/api/versions.json'
      );
      
      this.currentVersion = response.data[0]; // Latest version is first
      cache.set(cacheKey, this.currentVersion);
      return this.currentVersion;
    } catch (error) {
      console.error('Error fetching LoL version:', error);
      throw error;
    }
  }

  /**
   * Gets all champions with basic information
   * Returns a sorted list of champion names plus detailed champion data
   * @returns Promise<object> - Contains version, champion names array, and full champion details
   */
  async getChampions() {
    const cacheKey = 'champions-data';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const version = await this.getCurrentVersion();
      const response = await this.axiosInstance.get(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
      );

      const championsData = {
        version,
        champions: Object.keys(response.data.data).sort(), // Alphabetically sorted champion names
        championDetails: response.data.data // Full champion data object
      };

      cache.set(cacheKey, championsData);
      return championsData;
    } catch (error) {
      console.error('Error fetching champions:', error);
      throw error;
    }
  }

  async getChampionDetails(championName: string) {
    const cacheKey = `champion-${championName}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const version = await this.getCurrentVersion();
      const response = await this.axiosInstance.get(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${championName}.json`
      );

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching champion ${championName}:`, error);
      throw error;
    }
  }

  async getItems() {
    const cacheKey = 'items-data';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const version = await this.getCurrentVersion();
      const response = await this.axiosInstance.get(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`
      );

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  }

  /**
   * Generates the URL for a champion's square image (120x120px)
   * @param championName - Champion name (e.g., "Ahri", "AurelionSol")
   * @returns string - Direct URL to champion image
   */
  getChampionImageUrl(championName: string): string {
    return `https://ddragon.leagueoflegends.com/cdn/${this.currentVersion}/img/champion/${championName}.png`;
  }

  /**
   * Generates the URL for an item's image (64x64px)
   * @param itemId - Item ID as string (e.g., "1001", "3006")
   * @returns string - Direct URL to item image
   */
  getItemImageUrl(itemId: string): string {
    return `https://ddragon.leagueoflegends.com/cdn/${this.currentVersion}/img/item/${itemId}.png`;
  }
}

export const dataDragonService = new DataDragonService(); 