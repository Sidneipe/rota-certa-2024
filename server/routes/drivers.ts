import express from 'express';
import { DriverModel } from '../models/Driver';

const router = express.Router();

// GET /api/drivers - List all drivers
router.get('/', async (req, res) => {
  try {
    const { ativo, cidade, bairro, limit, offset, search } = req.query;
    
    let drivers;
    if (search) {
      drivers = await DriverModel.search(search as string);
    } else {
      drivers = await DriverModel.findAll({
        ativo: ativo !== undefined ? ativo === 'true' : undefined,
        cidade: cidade as string,
        bairro: bairro as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });
    }
    
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// GET /api/drivers/:id - Get driver by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const drivers = await DriverModel.findWithCoverageAreas(id);
    const driver = drivers[0];
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// GET /api/drivers/:id/coverage-areas - Get driver's coverage areas
router.get('/:id/coverage-areas', async (req, res) => {
  try {
    const { id } = req.params;
    const coverageAreas = await DriverModel.getCoverageAreas(id);
    res.json(coverageAreas);
  } catch (error) {
    console.error('Error fetching coverage areas:', error);
    res.status(500).json({ error: 'Failed to fetch coverage areas' });
  }
});

// POST /api/drivers - Create new driver
router.post('/', async (req, res) => {
  try {
    const driverData = req.body;
    
    // Validate required fields
    if (!driverData.nome || !driverData.cidade || !driverData.bairro) {
      return res.status(400).json({ 
        error: 'Required fields: nome, cidade, bairro' 
      });
    }
    
    const driver = await DriverModel.create(driverData);
    res.status(201).json(driver);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// PUT /api/drivers/:id - Update driver
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const driver = await DriverModel.update(id, updateData);
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// PATCH /api/drivers/:id/toggle-active - Toggle driver active status
router.patch('/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await DriverModel.toggleActive(id);
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (error) {
    console.error('Error toggling driver status:', error);
    res.status(500).json({ error: 'Failed to toggle driver status' });
  }
});

// DELETE /api/drivers/:id - Delete driver
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DriverModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

// POST /api/drivers/:id/coverage-areas - Add coverage areas to driver
router.post('/:id/coverage-areas', async (req, res) => {
  try {
    const { id } = req.params;
    const { areas } = req.body;
    
    if (!Array.isArray(areas) || areas.length === 0) {
      return res.status(400).json({ error: 'Areas array is required' });
    }
    
    await DriverModel.addCoverageAreas(id, areas);
    const coverageAreas = await DriverModel.getCoverageAreas(id);
    
    res.status(201).json(coverageAreas);
  } catch (error) {
    console.error('Error adding coverage areas:', error);
    res.status(500).json({ error: 'Failed to add coverage areas' });
  }
});

// PUT /api/drivers/:id/coverage-areas - Update driver's coverage areas
router.put('/:id/coverage-areas', async (req, res) => {
  try {
    const { id } = req.params;
    const { areas } = req.body;
    
    if (!Array.isArray(areas)) {
      return res.status(400).json({ error: 'Areas array is required' });
    }
    
    await DriverModel.updateCoverageAreas(id, areas);
    const coverageAreas = await DriverModel.getCoverageAreas(id);
    
    res.json(coverageAreas);
  } catch (error) {
    console.error('Error updating coverage areas:', error);
    res.status(500).json({ error: 'Failed to update coverage areas' });
  }
});

// DELETE /api/drivers/coverage-areas/:areaId - Remove specific coverage area
router.delete('/coverage-areas/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    const deleted = await DriverModel.removeCoverageArea(parseInt(areaId));
    
    if (!deleted) {
      return res.status(404).json({ error: 'Coverage area not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error removing coverage area:', error);
    res.status(500).json({ error: 'Failed to remove coverage area' });
  }
});

// GET /api/drivers/available/:cidade/:bairro - Find drivers available for specific area
router.get('/available/:cidade/:bairro', async (req, res) => {
  try {
    const { cidade, bairro } = req.params;
    const drivers = await DriverModel.findAvailableForArea(cidade, bairro);
    res.json(drivers);
  } catch (error) {
    console.error('Error finding available drivers:', error);
    res.status(500).json({ error: 'Failed to find available drivers' });
  }
});

// GET /api/drivers/stats - Get driver statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await DriverModel.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching driver statistics:', error);
    res.status(500).json({ error: 'Failed to fetch driver statistics' });
  }
});

export default router;
