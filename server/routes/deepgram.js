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
    const deepgram = createClient(apiKey);

    // Call Deepgram SDK to transcribe the audio buffer
    const payload = {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype || 'audio/webm'
    };

    console.log(`[DEEPGRAM DEBUG] Sending audio to Deepgram. Buffer size: ${req.file.buffer.length} bytes, Mimetype: ${payload.mimetype}`);

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      payload,
      {
        model: 'nova-2',
        smart_format: true,
      }
    );

    if (error) {
      console.error('Deepgram API Error:', error);
      return res.status(500).json({ error: 'Speech-to-text failed: ' + (error.message || JSON.stringify(error)) });
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
