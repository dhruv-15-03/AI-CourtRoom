import { useState } from 'react';
import { Box, TextField, Typography, List, ListItem } from '@mui/material';

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
      console.log('Gemini API raw response:', data);
  
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log(responseText)
      return responseText ;
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
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Legal Chatbot</Typography>
      <List sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <ListItem key={i} sx={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
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
      <TextField
        fullWidth
        placeholder={loading ? "Waiting for response..." : "Type your legal question..."}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleSend}
        disabled={loading}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
