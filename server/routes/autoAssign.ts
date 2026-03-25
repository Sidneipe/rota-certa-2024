import { Router } from 'express';
import { DeliveryModel } from '../models/Delivery';
import { DriverModel } from '../models/Driver';
import { groupDeliveries } from '../lib/routeOptimizer';

const router = Router();

// Auto-assign drivers to routes
router.post('/', async (req, res) => {
  try {
    const { groupingMode = 'neighborhood' } = req.body;
    
    // Get all active drivers
    const drivers = await DriverModel.findAll({ ativo: true });
    if (drivers.length === 0) {
      return res.status(400).json({ error: 'No active drivers found' });
    }

    // Get all unassigned deliveries
    const deliveries = await DeliveryModel.findAll({ motorista_id: null });
    if (deliveries.length === 0) {
      return res.json({ message: 'No deliveries to assign', assignments: [] });
    }

    // Group deliveries by the specified mode
    const routeGroups = groupDeliveries(deliveries, groupingMode);

    // Simple assignment algorithm: assign each route to the closest available driver
    const assignments = [];
    for (const group of routeGroups) {
      // Find driver with coverage area that matches this route
      let assignedDriver = null;
      
      for (const driver of drivers) {
        // Check if driver covers this area
        const coversArea = driver.cidade === group.deliveries[0]?.cidade ||
          driver.bairro === group.deliveries[0]?.bairro ||
          (driver.coverageAreas && driver.coverageAreas.some(area => 
            area.cidade === group.deliveries[0]?.cidade ||
            area.bairro === group.deliveries[0]?.bairro
          ));
        
        if (coversArea) {
          assignedDriver = driver;
          break;
        }
      }

      // If no specific driver found, assign to the first available driver
      if (!assignedDriver && drivers.length > 0) {
        assignedDriver = drivers[0];
      }

      if (assignedDriver) {
        // Update all deliveries in this group
        for (const delivery of group.deliveries) {
          await DeliveryModel.update(delivery.id, {
            motorista_id: assignedDriver.id,
            grupo_rota_id: group.id
          });
        }

        assignments.push({
          routeId: group.id,
          routeName: group.name,
          driverId: assignedDriver.id,
          driverName: assignedDriver.nome,
          deliveryCount: group.deliveries.length
        });
      }
    }

    res.json({
      message: 'Drivers assigned successfully',
      assignments,
      totalRoutes: routeGroups.length,
      totalDrivers: drivers.length
    });

  } catch (error) {
    console.error('Error in auto-assignment:', error);
    res.status(500).json({ error: 'Failed to assign drivers automatically' });
  }
});

// Get assignment statistics
router.get('/stats', async (req, res) => {
  try {
    const deliveries = await DeliveryModel.findAll();
    const drivers = await DriverModel.findAll({ ativo: true });

    const stats = {
      totalDeliveries: deliveries.length,
      assignedDeliveries: deliveries.filter(d => d.motorista_id).length,
      unassignedDeliveries: deliveries.filter(d => !d.motorista_id).length,
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(d => d.ativo).length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({ error: 'Failed to fetch assignment statistics' });
  }
});

export default router;
