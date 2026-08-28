const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@deepgram/sdk');

// We use memory storage so the file is kept in RAM buffer, no need to write to disk
const upload = multer({ storage: multer.memoryStorage() });

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    const apiKey = process.env.DEEPGRAM_API_KEY ? process.env.DEEPGRAM_API_KEY.trim() : null;
    if (!apiKey) {
      return res.status(500).json({ error: 'Deepgram API Key is missing on the server.' });
    }

    // Initialize Deepgram Client inside the route so it always grabs the latest key from env
    console.log(`[DEEPGRAM DEBUG] Sending audio to Deepgram REST API. Buffer size: ${req.file.buffer.length} bytes, Mimetype: ${req.file.mimetype}`);

    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': req.file.mimetype || 'audio/webm'
      },
      body: req.file.buffer
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Deepgram API Error:', result);
      return res.status(500).json({ error: 'Speech-to-text failed: ' + (result.err_msg || JSON.stringify(result)) });
    }

    // Extract the transcribed text
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    console.log(`[DEEPGRAM DEBUG] Transcript received: "${transcript}"`);
    
    res.json({ success: true, transcript });

  } catch (error) {
    console.error('Transcription Error:', error);
    res.status(500).json({ error: 'Server error: ' + (error.message || error.toString()) });
  }
});

// Securely vend a temporary Deepgram API key for frontend WebSocket usage
router.get('/token', async (req, res) => {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY ? process.env.DEEPGRAM_API_KEY.trim() : null;
    if (!apiKey) {
      return res.status(500).json({ error: 'Deepgram API Key is missing on the server.' });
    }

    const deepgram = createClient(apiKey);
    
    // Get the first project ID
    const { result: projectsResult, error: projectsError } = await deepgram.manage.getProjects();
    if (projectsError || !projectsResult || !projectsResult.projects || projectsResult.projects.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch Deepgram project.' });
    }
    
    const projectId = projectsResult.projects[0].project_id;
    
    // Create a temporary key valid for 10 minutes (600 seconds)
    const { result: keyResult, error: keyError } = await deepgram.manage.createProjectKey(projectId, {
      comment: 'Temporary frontend emergency mic key',
      scopes: ['usage:write'],
      time_to_live_in_seconds: 600,
    });
    
    if (keyError || !keyResult || !keyResult.key) {
      return res.status(500).json({ error: 'Failed to generate temporary Deepgram key.' });
    }

    res.json({ success: true, token: keyResult.key });
  } catch (error) {
    console.error('Token Generation Error:', error);
    res.status(500).json({ error: 'Failed to securely generate STT token.' });
  }
});

module.exports = router;
