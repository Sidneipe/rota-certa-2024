import { Router } from 'express';
import { ImportedFileModel } from '../models/ImportedFile';
import { DeliveryModel } from '../models/Delivery';

const router = Router();

// List all imported files
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const files = await ImportedFileModel.findAll(limit);
    res.json(files);
  } catch (error) {
    console.error('Error fetching imported files:', error);
    res.status(500).json({ error: 'Failed to fetch imported files' });
  }
});

// Get imported file by ID
router.get('/:id', async (req, res) => {
  try {
    const file = await ImportedFileModel.findById(parseInt(req.params.id));
    if (!file) {
      return res.status(404).json({ error: 'Imported file not found' });
    }
    res.json(file);
  } catch (error) {
    console.error('Error fetching imported file:', error);
    res.status(500).json({ error: 'Failed to fetch imported file' });
  }
});

// Get imported files by driver (removido - não existe no modelo)
// router.get('/driver/:driverId', async (req, res) => {
//   try {
//     const files = await ImportedFileModel.findByDriverId(req.params.driverId);
//     res.json(files);
//   } catch (error) {
//     console.error('Error fetching imported files by driver:', error);
//     res.status(500).json({ error: 'Failed to fetch imported files' });
//   }
// });

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await ImportedFileModel.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching imported files stats:', error);
    res.status(500).json({ error: 'Failed to fetch imported files stats' });
  }
});

// Create new imported file record
router.post('/', async (req, res) => {
  try {
    const { nome_arquivo, tipo_arquivo, tamanho_bytes, quantidade_registros } = req.body;
    
    if (!nome_arquivo || !tipo_arquivo || !tamanho_bytes || !quantidade_registros) {
      return res.status(400).json({ 
        error: 'Missing required fields: nome_arquivo, tipo_arquivo, tamanho_bytes, quantidade_registros' 
      });
    }

    // Convert tipo_arquivo from 'spreadsheet' to appropriate file type
    const fileType = tipo_arquivo === 'spreadsheet' ? 'xlsx' : tipo_arquivo;

    const file = await ImportedFileModel.create({
      nome_arquivo,
      tipo_arquivo: fileType,
      tamanho_arquivo: tamanho_bytes, // Convertendo para o nome correto do campo
      quantidade_registros,
      status_importacao: 'completed'
    });

    res.status(201).json(file);
  } catch (error) {
    console.error('Error creating imported file record:', error);
    res.status(500).json({ error: 'Failed to create imported file record' });
  }
});

// Update imported file status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, error } = req.body;
    
    if (!status || !['processing', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be: processing, completed, or failed' 
      });
    }

    const updated = await ImportedFileModel.updateStatus(parseInt(req.params.id), status, error);
    if (!updated) {
      return res.status(404).json({ error: 'Imported file not found' });
    }

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating imported file status:', error);
    res.status(500).json({ error: 'Failed to update imported file status' });
  }
});

// Delete imported file record
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await ImportedFileModel.delete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Imported file not found' });
    }

    res.json({ success: true, message: 'Imported file deleted successfully' });
  } catch (error) {
    console.error('Error deleting imported file:', error);
    res.status(500).json({ error: 'Failed to delete imported file' });
  }
});

export default router;
