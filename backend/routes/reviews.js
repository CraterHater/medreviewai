// backend/routes/reviews.js

const express = require('express');
const isAuthenticated = require('../middleware/isAuthenticated');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Protect all review routes
router.use(isAuthenticated);

// Standard CRUD routes
router.get('/', reviewController.getAllReviews);
router.post('/', reviewController.createReview);
router.get('/:id', reviewController.getReviewById);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

// Action routes
router.post('/:id/perform-review', reviewController.performAIReview);
router.post('/:id/dismiss', reviewController.dismissItem);
router.post('/:id/generate-letter', reviewController.generateAndSaveLetter);
router.put('/:id/letter', reviewController.saveLetterEdits);
router.post('/:id/generate-interactions', reviewController.generateInteractions);


module.exports = router;