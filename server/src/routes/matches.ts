import { Router, Request, Response } from 'express';
import { riotService } from '../services/riotService';

const router = Router();

// GET /api/matches/history/:region/:puuid
router.get('/history/:region/:puuid', async (req: Request, res: Response) => {
  try {
    const { region, puuid } = req.params;
    const { start = '0', count = '20' } = req.query;
    
    if (!puuid || !region) {
      return res.status(400).json({
        error: 'Missing required parameters: region and puuid'
      });
    }

    const matchHistory = await riotService.getMatchHistory(
      puuid, 
      region, 
      parseInt(start as string), 
      parseInt(count as string)
    );
    
    res.json({
      success: true,
      data: matchHistory
    });
  } catch (error: any) {
    console.error('Error in match history route:', error);
    
    if (error.response?.status === 403) {
      return res.status(403).json({
        error: 'API key invalid or expired',
        message: 'Please check your Riot API key configuration'
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch match history'
    });
  }
});

// GET /api/matches/details/:region/:matchId
router.get('/details/:region/:matchId', async (req: Request, res: Response) => {
  try {
    const { region, matchId } = req.params;
    
    if (!matchId || !region) {
      return res.status(400).json({
        error: 'Missing required parameters: region and matchId'
      });
    }

    const matchDetails = await riotService.getMatchDetails(matchId, region);
    
    res.json({
      success: true,
      data: matchDetails
    });
  } catch (error: any) {
    console.error('Error in match details route:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Match not found',
        message: `No match found with ID "${req.params.matchId}"`
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
      message: 'Failed to fetch match details'
    });
  }
});

// GET /api/matches/timeline/:region/:matchId
router.get('/timeline/:region/:matchId', async (req: Request, res: Response) => {
  try {
    const { region, matchId } = req.params;
    
    if (!matchId || !region) {
      return res.status(400).json({
        error: 'Missing required parameters: region and matchId'
      });
    }

    const timeline = await riotService.getMatchTimeline(matchId, region);
    
    res.json({
      success: true,
      data: timeline
    });
  } catch (error: any) {
    console.error('Error in match timeline route:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Match timeline not found',
        message: `No timeline found for match ID "${req.params.matchId}"`
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
      message: 'Failed to fetch match timeline'
    });
  }
});

export { router as matchRoutes }; 