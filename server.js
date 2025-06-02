const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Connect to MongoDB (Users DB)
mongoose.connect('mongodb://127.0.0.1:27017/Users', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Base schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String
});

// Task Schema
const taskSchema = new mongoose.Schema({
  taskTitle: String,
  description: String,
  budget: Number,
  location: String,
  date: String,
  time: String,
  username: String,
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----- USER ROUTES -----

// Signup route
app.post('/api/signup', async (req, res) => {
  const { username, email, password, confirmPassword, role } = req.body;

  if (!username || !email || !password || !confirmPassword || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  if (!['Customer', 'Worker', 'Admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role selected' });
  }

  try {
    const roles = ['Customer', 'Worker', 'Admin'];

    for (let r of roles) {
      const Model = mongoose.model(r.charAt(0).toUpperCase() + r.slice(1), userSchema, r);
      const exists = await Model.findOne({ email });
      if (exists) {
        return res.status(409).json({ message: 'Email already registered' });
      }
    }

    const UserModel = mongoose.model(role.charAt(0).toUpperCase() + role.slice(1), userSchema, role);
    const newUser = new UserModel({ username, email, password, role });
    await newUser.save();

    return res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Missing login credentials.' });
  }

  try {
    const UserModel = mongoose.model(role.charAt(0).toUpperCase() + role.slice(1), userSchema, role);
    const user = await UserModel.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    return res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// Profile fetch route
app.post('/api/profile', async (req, res) => {
  const { username, role } = req.body;

  if (!username || !role) {
    return res.status(400).json({ message: 'Missing username or role' });
  }

  try {
    const modelName = role.charAt(0).toUpperCase() + role.slice(1);
    const UserModel = mongoose.models[modelName] || mongoose.model(modelName, userSchema, role);

    const user = await UserModel.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ----- TASK ROUTES -----

// Post new task
app.post('/api/task', async (req, res) => {
  const { taskTitle, description, budget, location, date, time, username } = req.body;

  if (!taskTitle || !description || !location) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const newTask = new Task({ taskTitle, description, budget, location, date, time, username });
    await newTask.save();
    return res.status(201).json({ message: 'Task saved.' });
  } catch (err) {
    console.error('Error saving task:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    return res.status(200).json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ----- START SERVER -----
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/index.html`);
});
