// backend/controllers/reviewController.js

const { PrismaClient } = require('@prisma/client');
const aiService = require('../services/aiService');
const { constructAIPrompt, constructLetterPrompt, constructInteractionPrompt } = require('../utils/aiPrompt');

const prisma = new PrismaClient();

exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await prisma.medicationReview.findMany({
            where: { userId: req.session.userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(reviews);
    } catch (error) {
        console.error("Get All Reviews Error:", error);
        res.status(500).json({ message: "Failed to fetch reviews." });
    }
};

exports.createReview = async (req, res) => {
    try {
        const newReview = await prisma.medicationReview.create({
            data: {
                title: "New Medication Review",
                userId: req.session.userId,
            },
        });
        res.status(201).json(newReview);
    } catch (error) {
        console.error("Create Review Error:", error);
        res.status(500).json({ message: "Failed to create review." });
    }
};

exports.getReviewById = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const review = await prisma.medicationReview.findFirst({
            where: { id: reviewId, userId: req.session.userId },
        });
        if (!review) return res.status(404).json({ message: 'Review not found.' });
        res.json(review);
    } catch (error) {
        console.error("Get Review By ID Error:", error);
        res.status(500).json({ message: "Failed to fetch review." });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const { title, medication, labData, vitalData, history, problems } = req.body;
        const review = await prisma.medicationReview.findFirst({
            where: { id: reviewId, userId: req.session.userId },
        });
        if (!review) return res.status(404).json({ message: 'Review not found or you do not have permission to edit it.' });
        
        const updatedReview = await prisma.medicationReview.update({
            where: { id: reviewId },
            data: { title, medication, labData, vitalData, history, problems },
        });
        res.json(updatedReview);
    } catch (error) {
        console.error("Update Review Error:", error);
        res.status(500).json({ message: "Failed to update review." });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const review = await prisma.medicationReview.findFirst({
            // --- FIX: REMOVED THE TRAILING COLON ---
            where: { id: reviewId, userId: req.session.userId }
        });
        if (!review) return res.status(403).json({ message: "Forbidden: You do not own this resource." });
        
        await prisma.medicationReview.delete({ where: { id: reviewId } });
        res.status(204).send();
    } catch (error) {
        console.error("Delete Review Error:", error);
        res.status(500).json({ message: "Failed to delete review." });
    }
};

exports.performAIReview = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user || !user.openaiKey) return res.status(400).json({ message: 'OpenAI API key is not set.' });
        
        const review = await prisma.medicationReview.findFirst({
            where: { id: reviewId, userId: req.session.userId },
        });
        if (!review) return res.status(404).json({ message: 'Review not found.' });

        const prompt = constructAIPrompt(review);
        const aiResponseJson = await aiService.getJsonResponse(prompt, user.openaiKey);
        
        const medicationScore = aiResponseJson.medication_score ? aiResponseJson.medication_score.score : null;

        await prisma.medicationReview.update({
            where: { id: reviewId },
            data: { aiResponse: aiResponseJson, medicationScore: medicationScore },
        });
        res.json({ success: true, reviewId: reviewId });
    } catch (error) {
        console.error('AI Review Error:', error);
        res.status(500).json({ message: error.message || 'An error occurred during the AI review.' });
    }
};

exports.dismissItem = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const { itemId, itemType } = req.body;
        if (!itemId || !itemType) return res.status(400).json({ message: 'Item ID and type are required.' });
        const review = await prisma.medicationReview.findFirst({ where: { id: reviewId, userId: req.session.userId } });
        if (!review) return res.status(404).json({ message: 'Review not found.' });
        let dismissed = review.dismissedItems && typeof review.dismissedItems === 'object' && !Array.isArray(review.dismissedItems) ? review.dismissedItems : { mrp: [], interventions: [] };
        const listKey = itemType === 'mrp' ? 'mrp' : 'interventions';
        if (!Array.isArray(dismissed[listKey])) dismissed[listKey] = [];
        const list = dismissed[listKey];
        const itemIndex = list.indexOf(itemId);
        if (itemIndex > -1) {
            list.splice(itemIndex, 1);
        } else {
            list.push(itemId);
        }
        dismissed[listKey] = list;
        const updatedReview = await prisma.medicationReview.update({
            where: { id: reviewId },
            data: { dismissedItems: dismissed },
        });
        res.json(updatedReview.dismissedItems);
    } catch (error) {
        console.error('Dismiss Item Error:', error);
        res.status(500).json({ message: 'An error occurred while updating the item.' });
    }
};

exports.generateAndSaveLetter = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const { addressee, language } = req.body;
        if (!addressee || !language) return res.status(400).json({ message: 'Addressee and language are required.' });
        
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user || !user.openaiKey) return res.status(400).json({ message: 'OpenAI API key is not set.' });

        const review = await prisma.medicationReview.findFirst({
            where: { id: reviewId, userId: req.session.userId },
        });
        if (!review || !review.aiResponse) return res.status(404).json({ message: 'An AI analysis must be completed first.' });

        const prompt = constructLetterPrompt(review.aiResponse, addressee, language);
        const letterText = await aiService.getTextResponse(prompt, user.openaiKey);
        
        await prisma.medicationReview.update({
            where: { id: reviewId },
            data: { formalLetter: letterText },
        });
        res.json({ success: true, reviewId: reviewId });
    } catch (error) {
        console.error('Letter Generation Error:', error);
        res.status(500).json({ message: 'An error occurred while generating the letter.' });
    }
};

exports.saveLetterEdits = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const { letterContent } = req.body;
        await prisma.medicationReview.updateMany({
            where: { id: reviewId, userId: req.session.userId },
            data: { formalLetter: letterContent },
        });
        res.json({ message: 'Letter saved successfully.' });
    } catch (error) {
        console.error('Save Letter Error:', error);
        res.status(500).json({ message: 'Failed to save the letter.' });
    }
};

exports.generateInteractions = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user || !user.openaiKey) return res.status(400).json({ message: 'OpenAI API key is not set.' });
        
        const review = await prisma.medicationReview.findFirst({
            where: { id: reviewId, userId: req.session.userId },
        });
        if (!review || !review.medication) return res.status(404).json({ message: 'A medication list is required.' });

        const prompt = constructInteractionPrompt(review.medication);
        const interactionJson = await aiService.getJsonResponse(prompt, user.openaiKey);

        await prisma.medicationReview.update({
            where: { id: reviewId },
            data: { interactions: interactionJson },
        });
        res.json(interactionJson);
    } catch (error) {
        console.error('Interaction Generation Error:', error);
        res.status(500).json({ message: 'An error occurred while generating interactions.' });
    }
};