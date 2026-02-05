const express = require('express');
const router = express.Router();
const Template = require('../models/Template');

// GET all templates
router.get('/', async (req, res) => {
    try {
        const templates = await Template.find().sort({ createdAt: -1 });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET a specific template by ID
router.get('/:id', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create a new template
router.post('/', async (req, res) => {
    const { name, fields, description } = req.body;

    if (!name || !fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ message: 'Name and at least one field are required.' });
    }

    const template = new Template({
        name,
        fields,
        description
    });

    try {
        const newTemplate = await template.save();
        res.status(201).json(newTemplate);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE a template
router.delete('/:id', async (req, res) => {
    try {
        const template = await Template.findByIdAndDelete(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json({ message: 'Template deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
