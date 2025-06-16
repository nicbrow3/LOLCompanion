import { Router, Request, Response } from 'express';
import { riotService } from '../services/riotService';

const router = Router();

// GET /api/summoner/:region/:name
router.get('/:region/:name', async (req: Request, res: Response) => {
  try {
    const { region, name } = req.params;
    
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

export { router as summonerRoutes }; 