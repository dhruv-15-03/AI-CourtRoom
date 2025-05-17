import { useState } from 'react';
import { Box, TextField, Typography, List, ListItem, Card } from '@mui/material';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const GEMINI_API_KEY = 'AIzaSyDNRd0fnMoh_IM_5xb_5q4NVd6eH_RP2sU';

  const fetchGeminiResponse = async (userInput) => {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [{ parts: [{ text: userInput }] }],
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return responseText;
    } catch (err) {
      console.error('Gemini API fetch error:', err);
      return 'Error contacting Gemini API.';
    }
  };

  const handleSend = async (e) => {
    if (e.key === 'Enter' && text && !loading) {
      const userMsg = { text, sender: 'user' };
      setMessages((prev) => [...prev, userMsg]);
      setText('');
      setLoading(true);

      const botReply = await fetchGeminiResponse(text);
      const botMsg = { text: botReply, sender: 'bot' };

      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        // ml: '240px', 
        p: 2,
        height: '100vh',
        boxSizing: 'border-box',
        bgcolor: '#393E46',
      }}
    >
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #ddd',alignItems:"center",alignContent:"center",justifyItems:"center",justifyContent:"center" }}>
          Legal Chatbot
        </Typography>

        <List
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 2,
            py: 1,
          }}
        >
          {messages.map((msg, i) => (
            <ListItem
              key={i}
              sx={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}
            >
              <Box
                sx={{
                  bgcolor: msg.sender === 'user' ? '#673ab7' : '#e0e0e0',
                  color: msg.sender === 'user' ? 'white' : 'black',
                  p: 1.5,
                  borderRadius: 2,
                  maxWidth: '75%',
                }}
              >
                {msg.text}
              </Box>
            </ListItem>
          ))}
        </List>

        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            width: '100%',
            bgcolor: 'background.paper',
            p: 2,
            borderTop: '1px solid #ccc',
          }}
        >
          <TextField
            fullWidth
            placeholder={loading ? 'Waiting for response...' : 'Type your legal question...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleSend}
            disabled={loading}
          />
        </Box>
      </Card>
    </Box>
  );
}
