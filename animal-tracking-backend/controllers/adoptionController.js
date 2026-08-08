const AdoptionRequest = require('../models/AdoptionRequest');
const Animal = require('../models/Animal');

// @desc    Submit a new adoption/foster request
// @route   POST /api/adoptions
// @access  Public
const submitRequest = async (req, res) => {
    try {
        const {
            animalId,        // MongoDB _id
            animalDisplayId, // Human-readable ID like ST-4589
            applicantName,
            applicantEmail,
            applicantPhone,
            message,
            requestType
        } = req.body;

        // Verify animal exists
        const animal = await Animal.findById(animalId);
        if (!animal) {
            return res.status(404).json({ success: false, error: 'Animal not found' });
        }

        // Check if already adopted
        if (animal.status === 'Adopted') {
            return res.status(400).json({ success: false, error: 'This animal has already been adopted' });
        }

        const request = await AdoptionRequest.create({
            animalId,
            animalDisplayId: animalDisplayId || animal.animalId,
            userId: req.user ? req.user._id : null,
            applicantName,
            applicantEmail,
            applicantPhone: applicantPhone || '',
            message: message || '',
            requestType: requestType || 'Adopt',
            status: 'Pending'
        });

        res.status(201).json({
            success: true,
            message: 'Adoption request submitted successfully',
            data: request
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get all adoption requests (Volunteer only)
// @route   GET /api/adoptions
// @access  Private (volunteer)
const getRequests = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const requests = await AdoptionRequest.find(query)
            .populate('animalId', 'name species animalId status qrCodeUrl')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Approve or reject an adoption request (Volunteer only)
// @route   PUT /api/adoptions/:id
// @access  Private (volunteer)
const updateRequestStatus = async (req, res) => {
    try {
        const { status, reviewNotes } = req.body;

        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status value' });
        }

        const request = await AdoptionRequest.findByIdAndUpdate(
            req.params.id,
            {
                status,
                reviewNotes: reviewNotes || '',
                reviewedBy: req.user._id
            },
            { new: true, runValidators: true }
        ).populate('animalId', 'name species animalId');

        if (!request) {
            return res.status(404).json({ success: false, error: 'Adoption request not found' });
        }

        // If approved, update animal status to Adopted
        if (status === 'Approved') {
            await Animal.findByIdAndUpdate(request.animalId, { status: 'Adopted' });
        }

        res.status(200).json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { submitRequest, getRequests, updateRequestStatus };
