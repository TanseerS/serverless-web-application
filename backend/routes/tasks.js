const express = require('express');
const Task = require('../models/task');

const router = express.Router();

// GET /api/tasks - list all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.findAll({ order: [['createdAt', 'DESC']] });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks - create a task
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    const task = await Task.create({ title: title.trim() });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id - update a task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'task not found' });
    }
    const { title, completed } = req.body;
    if (title !== undefined) task.title = title;
    if (completed !== undefined) task.completed = completed;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id - delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'task not found' });
    }
    await task.destroy();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
