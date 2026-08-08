const Animal = require('../models/Animal');
const { generateAnimalID } = require('../utils/generateID');

// @desc    Register a new stray animal (Volunteer only)
// @route   POST /api/animals
// @access  Private (volunteer)
const registerAnimal = async (req, res) => {
    try {
        const {
            name, species, breed, age, gender, status,
            isEmergency, lastSeenLocation, medicalProfile
        } = req.body;

        // Generate unique animal ID
        let animalId = generateAnimalID();
        let existingAnimal = await Animal.findOne({ animalId });
        while (existingAnimal) {
            animalId = generateAnimalID();
            existingAnimal = await Animal.findOne({ animalId });
        }

        // Generate QR Code URL using free API
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${animalId}&margin=10`;

        const animal = await Animal.create({
            animalId,
            name,
            species,
            breed,
            age,
            gender,
            status: status || 'Stray',
            isEmergency: isEmergency || false,
            lastSeenLocation: lastSeenLocation || {},
            medicalProfile: medicalProfile || {},
            registeredBy: req.user ? req.user._id : null,
            qrCodeUrl
        });

        res.status(201).json({
            success: true,
            message: 'Animal registered successfully',
            data: animal
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get all animals (with optional filters)
// @route   GET /api/animals
// @access  Public
const getAnimals = async (req, res) => {
    try {
        const { species, status, isEmergency, search } = req.query;
        let query = {};

        if (species) query.species = species;
        if (status) query.status = status;
        if (isEmergency !== undefined) query.isEmergency = isEmergency === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { animalId: { $regex: search, $options: 'i' } },
                { species: { $regex: search, $options: 'i' } },
                { breed: { $regex: search, $options: 'i' } }
            ];
        }

        const animals = await Animal.find(query).sort({ isEmergency: -1, createdAt: -1 });
        res.status(200).json({
            success: true,
            count: animals.length,
            data: animals
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get single animal by animalId (for QR scan or direct lookup)
// @route   GET /api/animals/:animalId
// @access  Public
const getAnimalByQR = async (req, res) => {
    try {
        const animal = await Animal.findOne({ animalId: req.params.animalId });

        if (!animal) {
            return res.status(404).json({
                success: false,
                error: 'Animal not found with this ID'
            });
        }

        res.status(200).json({ success: true, data: animal });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update animal general details or emergency status (Volunteer only)
// @route   PUT /api/animals/:id
// @access  Private (volunteer)
const updateAnimal = async (req, res) => {
    try {
        const animal = await Animal.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!animal) {
            return res.status(404).json({ success: false, message: 'Animal not found' });
        }

        res.status(200).json({ success: true, data: animal });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update animal medical profile (Volunteer only)
// @route   PUT /api/animals/:id/medical
// @access  Private (volunteer)
const updateMedicalProfile = async (req, res) => {
    try {
        const animal = await Animal.findById(req.params.id);
        if (!animal) {
            return res.status(404).json({ success: false, message: 'Animal not found' });
        }

        const { rabiesVaccination, dewormingDate, isNeutered, neuterDate, medicalLog } = req.body;

        // Push new entries into arrays if provided
        if (rabiesVaccination) {
            animal.medicalProfile.rabiesVaccinations.push({
                date: rabiesVaccination.date || new Date(),
                notes: rabiesVaccination.notes || ''
            });
        }

        if (dewormingDate) {
            animal.medicalProfile.dewormingDates.push({
                date: dewormingDate.date || new Date(),
                notes: dewormingDate.notes || ''
            });
        }

        if (isNeutered !== undefined) {
            animal.medicalProfile.isNeutered = isNeutered;
            if (neuterDate) animal.medicalProfile.neuterDate = neuterDate;
        }

        if (medicalLog) {
            animal.medicalProfile.medicalLogs.push({
                date: new Date(),
                note: medicalLog,
                loggedBy: req.user ? req.user.name : 'Volunteer'
            });
        }

        await animal.save();
        res.status(200).json({ success: true, data: animal });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete animal (Volunteer only)
// @route   DELETE /api/animals/:id
// @access  Private (volunteer)
const deleteAnimal = async (req, res) => {
    try {
        const animal = await Animal.findByIdAndDelete(req.params.id);

        if (!animal) {
            return res.status(404).json({ success: false, message: 'Animal not found' });
        }

        res.status(200).json({ success: true, message: 'Animal deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    registerAnimal,
    getAnimals,
    getAnimalByQR,
    updateAnimal,
    updateMedicalProfile,
    deleteAnimal
};