const express = require('express');
const router = express.Router();
const { identifyAnimal } = require('../controllers/aiController');

router.post('/identify', identifyAnimal);

module.exports = router;