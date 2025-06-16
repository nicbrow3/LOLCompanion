import { Router, Request, Response } from 'express';
import { riotService } from '../services/riotService';

const router = Router();

// GET /api/live/:region/:summonerId
router.get('/:region/:summonerId', async (req: Request, res: Response) => {
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

export { router as liveGameRoutes }; 