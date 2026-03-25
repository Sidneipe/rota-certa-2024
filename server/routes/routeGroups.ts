import { Router } from 'express';
import { RouteGroupModel } from '../models/RouteGroup';
import { DeliveryModel } from '../models/Delivery';

const router = Router();

// List all route groups
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const routeGroups = await RouteGroupModel.findAll(limit);
    
    // Get delivery counts for each route group
    const routeGroupsWithCounts = await Promise.all(
      routeGroups.map(async (group) => {
        const deliveries = await DeliveryModel.findByRouteGroup(group.id);
        return {
          ...group,
          deliveryCount: deliveries.length,
          completedCount: deliveries.filter((d: any) => d.status === 'delivered').length
        };
      })
    );
    
    res.json(routeGroupsWithCounts);
  } catch (error) {
    console.error('Error fetching route groups:', error);
    res.status(500).json({ error: 'Failed to fetch route groups' });
  }
});

// Get route group by ID
router.get('/:id', async (req, res) => {
  try {
    const routeGroup = await RouteGroupModel.findById(parseInt(req.params.id));
    if (!routeGroup) {
      return res.status(404).json({ error: 'Route group not found' });
    }
    
    // Get deliveries for this route group
    const deliveries = await DeliveryModel.findByRouteGroup(routeGroup.id);
    
    res.json({
      ...routeGroup,
      deliveries,
      deliveryCount: deliveries.length,
      completedCount: deliveries.filter((d: any) => d.status === 'delivered').length
    });
  } catch (error) {
    console.error('Error fetching route group:', error);
    res.status(500).json({ error: 'Failed to fetch route group' });
  }
});

// Get route groups by driver
router.get('/driver/:driverId', async (req, res) => {
  try {
    const routeGroups = await RouteGroupModel.findByDriverId(req.params.driverId);
    
    // Get delivery counts for each route group
    const routeGroupsWithCounts = await Promise.all(
      routeGroups.map(async (group) => {
        const deliveries = await DeliveryModel.findByRouteGroup(group.id);
        return {
          ...group,
          deliveryCount: deliveries.length,
          completedCount: deliveries.filter((d: any) => d.status === 'delivered').length
        };
      })
    );
    
    res.json(routeGroupsWithCounts);
  } catch (error) {
    console.error('Error fetching route groups by driver:', error);
    res.status(500).json({ error: 'Failed to fetch route groups' });
  }
});

// Create new route group
router.post('/', async (req, res) => {
  try {
    const { nome, cor, motorista_id } = req.body;
    
    if (!nome || !cor) {
      return res.status(400).json({ 
        error: 'Missing required fields: nome, cor' 
      });
    }

    const routeGroup = await RouteGroupModel.create({
      nome,
      cor,
      motorista_id
    });

    res.status(201).json(routeGroup);
  } catch (error) {
    console.error('Error creating route group:', error);
    res.status(500).json({ error: 'Failed to create route group' });
  }
});

// Update route group
router.patch('/:id', async (req, res) => {
  try {
    const { nome, cor, motorista_id } = req.body;
    
    const updated = await RouteGroupModel.update(parseInt(req.params.id), {
      nome,
      cor,
      motorista_id
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Route group not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating route group:', error);
    res.status(500).json({ error: 'Failed to update route group' });
  }
});

// Delete route group
router.delete('/:id', async (req, res) => {
  try {
    // First, unassign all deliveries from this route group
    const deliveries = await DeliveryModel.findByRouteGroup(parseInt(req.params.id));
    for (const delivery of deliveries) {
      await DeliveryModel.update(delivery.id, { rota_grupo: undefined });
    }
    
    // Then delete the route group
    const deleted = await RouteGroupModel.delete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Route group not found' });
    }

    res.json({ success: true, message: 'Route group deleted successfully' });
  } catch (error) {
    console.error('Error deleting route group:', error);
    res.status(500).json({ error: 'Failed to delete route group' });
  }
});

// Get route group statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await RouteGroupModel.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching route group stats:', error);
    res.status(500).json({ error: 'Failed to fetch route group stats' });
  }
});

export default router;
