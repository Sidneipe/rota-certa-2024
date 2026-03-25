import express from 'express';
import { DeliveryModel } from '../models/Delivery';

const router = express.Router();

// GET /api/deliveries - List all deliveries
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      motorista_id, 
      cidade, 
      bairro, 
      rota_grupo, 
      limit, 
      offset 
    } = req.query;
    
    const deliveries = await DeliveryModel.findAll({
      status: status as string,
      motorista_id: motorista_id as string,
      cidade: cidade as string,
      bairro: bairro as string,
      rota_grupo: rota_grupo ? parseInt(rota_grupo as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    
    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// GET /api/deliveries/:id - Get delivery by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await DeliveryModel.findById(id);
    
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.json(delivery);
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({ error: 'Failed to fetch delivery' });
  }
});

// GET /api/deliveries/tracking/:codigo_rastreio - Find delivery by tracking code
router.get('/tracking/:codigo_rastreio', async (req, res) => {
  try {
    const { codigo_rastreio } = req.params;
    const delivery = await DeliveryModel.findByTrackingCode(codigo_rastreio);
    
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.json(delivery);
  } catch (error) {
    console.error('Error fetching delivery by tracking code:', error);
    res.status(500).json({ error: 'Failed to fetch delivery' });
  }
});

// GET /api/deliveries/route/:rota_grupo - Get deliveries by route group
router.get('/route/:rota_grupo', async (req, res) => {
  try {
    const { rota_grupo } = req.params;
    const deliveries = await DeliveryModel.findByRouteGroup(parseInt(rota_grupo));
    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching route deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch route deliveries' });
  }
});

// POST /api/deliveries - Create new delivery
router.post('/', async (req, res) => {
  try {
    const deliveryData = req.body;
    
    // Validate required fields
    if (!deliveryData.endereco || !deliveryData.bairro || !deliveryData.cidade) {
      return res.status(400).json({ 
        error: 'Required fields: endereco, bairro, cidade' 
      });
    }
    
    const delivery = await DeliveryModel.create(deliveryData);
    res.status(201).json(delivery);
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

// POST /api/deliveries/bulk - Create multiple deliveries
router.post('/bulk', async (req, res) => {
  try {
    const { deliveries } = req.body;
    
    if (!Array.isArray(deliveries) || deliveries.length === 0) {
      return res.status(400).json({ error: 'Deliveries array is required' });
    }
    
    const affectedRows = await DeliveryModel.bulkInsert(deliveries);
    res.status(201).json({ 
      message: 'Deliveries created successfully',
      count: affectedRows 
    });
  } catch (error) {
    console.error('Error creating bulk deliveries:', error);
    res.status(500).json({ error: 'Failed to create deliveries' });
  }
});

// PUT /api/deliveries/:id - Update delivery
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const delivery = await DeliveryModel.update(id, updateData);
    
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.json(delivery);
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ error: 'Failed to update delivery' });
  }
});

// PATCH /api/deliveries/:id/status - Update delivery status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'in_transit', 'delivered', 'failed'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be: pending, in_transit, delivered, or failed' 
      });
    }
    
    const delivery = await DeliveryModel.updateStatus(id, status);
    
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.json(delivery);
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
});

// PATCH /api/deliveries/:id/assign - Assign delivery to driver
router.patch('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { motorista_id, rota_grupo, ordem_entrega } = req.body;
    
    if (!motorista_id) {
      return res.status(400).json({ error: 'motorista_id is required' });
    }
    
    const delivery = await DeliveryModel.assignToDriver(
      id, 
      motorista_id, 
      rota_grupo, 
      ordem_entrega
    );
    
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.json(delivery);
  } catch (error) {
    console.error('Error assigning delivery to driver:', error);
    res.status(500).json({ error: 'Failed to assign delivery to driver' });
  }
});

// DELETE /api/deliveries/:id - Delete delivery
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DeliveryModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({ error: 'Failed to delete delivery' });
  }
});

// GET /api/deliveries/stats - Get delivery statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await DeliveryModel.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching delivery statistics:', error);
    res.status(500).json({ error: 'Failed to fetch delivery statistics' });
  }
});

export default router;
