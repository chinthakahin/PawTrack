const mongoose = require('mongoose');

const adoptionRequestSchema = new mongoose.Schema({
    animalId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Animal',
        required: [true, 'Animal reference is required']
    },
    animalDisplayId: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: false
    },
    applicantName: {
        type: String,
        required: [true, 'Applicant name is required']
    },
    applicantEmail: {
        type: String,
        required: [true, 'Applicant email is required']
    },
    applicantPhone: {
        type: String,
        default: ''
    },
    message: {
        type: String,
        default: ''
    },
    requestType: {
        type: String,
        enum: ['Adopt', 'Foster'],
        default: 'Adopt'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    reviewedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null
    },
    reviewNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AdoptionRequest', adoptionRequestSchema);
