const express = require('express');
const {
    registerAnimal,
    getAnimals,
    getAnimalByQR,
    updateAnimal,
    updateMedicalProfile,
    deleteAnimal
} = require('../controllers/animalController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAnimals);
router.get('/:animalId', getAnimalByQR);

// Volunteer-only routes
router.post('/', protect, authorize('volunteer'), registerAnimal);
router.put('/:id', protect, authorize('volunteer'), updateAnimal);
router.put('/:id/medical', protect, authorize('volunteer'), updateMedicalProfile);
router.delete('/:id', protect, authorize('volunteer'), deleteAnimal);

module.exports = router;