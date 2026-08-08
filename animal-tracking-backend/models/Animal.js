const mongoose = require('mongoose');

// Sub-schema for a single vaccination/treatment log entry
const logEntrySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    notes: { type: String, default: '' }
}, { _id: false });

// Sub-schema for detailed medical log entries
const medicalLogSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    note: { type: String, required: true },
    loggedBy: { type: String, default: 'Volunteer' }
}, { _id: true });

// Nested medicalProfile sub-schema
const medicalProfileSchema = new mongoose.Schema({
    rabiesVaccinations: [logEntrySchema],
    dewormingDates: [logEntrySchema],
    isNeutered: { type: Boolean, default: false },
    neuterDate: { type: Date, default: null },
    medicalLogs: [medicalLogSchema]
}, { _id: false });

const animalSchema = new mongoose.Schema({
    animalId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Please add a name or identifier']
    },
    species: {
        type: String,
        required: [true, 'Please specify species'],
        enum: ['Dog', 'Cat', 'Other']
    },
    breed: {
        type: String,
        default: 'Unknown'
    },
    age: {
        type: String,
        default: 'Unknown'
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Unknown'],
        default: 'Unknown'
    },
    status: {
        type: String,
        enum: ['Stray', 'Rescued', 'Adopted', 'Under Treatment'],
        default: 'Stray'
    },
    isEmergency: {
        type: Boolean,
        default: false
    },
    // Legacy simple vaccination history (kept for backward compatibility)
    vaccinationHistory: [
        {
            vaccineName: String,
            dateAdministered: Date,
            nextDueDate: Date
        }
    ],
    // Enriched nested medical profile
    medicalProfile: {
        type: medicalProfileSchema,
        default: () => ({
            rabiesVaccinations: [],
            dewormingDates: [],
            isNeutered: false,
            neuterDate: null,
            medicalLogs: []
        })
    },
    image: {
        type: String,
        default: 'default-animal.jpg'
    },
    lastSeenLocation: {
        latitude: Number,
        longitude: Number,
        addressText: String
    },
    registeredBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: false
    },
    qrCodeUrl: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Animal', animalSchema);