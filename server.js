const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;
const notesFilePath = path.join(__dirname, 'db', 'notes.json');

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Retrieve notes from the file asynchronously
async function fetchNotesFromFile() {
  try {
    const data = await fs.readFile(notesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Save notes to the file asynchronously
async function saveNotesToFile(notes) {
  try {
    await fs.writeFile(notesFilePath, JSON.stringify(notes));
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// GET endpoint to fetch all notes
app.get('/api/notes', async (req, res) => {
  const notes = await fetchNotesFromFile();
  res.json(notes);
});

// POST endpoint to create a new note
app.post('/api/notes', async (req, res) => {
  const newNote = {
    id: uuidv4(),
    title: req.body.title,
    text: req.body.text,
  };

  const notes = await fetchNotesFromFile();
  notes.push(newNote);

  try {
    await saveNotesToFile(notes);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE endpoint to delete a specific note
app.delete('/api/notes/:id', async (req, res) => {
  const noteId = req.params.id;
  const notes = await fetchNotesFromFile();
  const noteIndex = notes.findIndex((note) => note.id === noteId);

  if (noteIndex === -1) {
    res.status(404).json({ error: 'Note not found' });
  } else {
    notes.splice(noteIndex, 1);

    try {
      await saveNotesToFile(notes);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET endpoint to serve the 'notes.html' file
app.get('/notes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'notes.html'));
});

// GET endpoint to serve the 'index.html' file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
