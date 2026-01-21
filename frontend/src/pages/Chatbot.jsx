import { useState, useCallback, useRef, useEffect } from 'react';
import { Box, TextField, Typography, List, ListItem, Card, CircularProgress } from '@mui/material';
import { aiService } from '../services/api';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchGeminiResponse = useCallback(async (userInput) => {
    try {
      // Call backend Gemini service for Chatbot
      const response = await aiService.chatWithGemini(userInput);
      return response.data.response || 'I\'m here to help with your legal questions!';
    } catch (err) {
      console.error('AI service error:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to get AI response';
      return `⚠️ ${errorMessage}`;
    }
  }, []);

  const handleSend = useCallback(async (e) => {
    if (e.key === 'Enter' && text.trim() && !loading) {
      const userInput = text.trim();
      const userMsg = { text: userInput, sender: 'user', id: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setText('');
      setLoading(true);

      const botReply = await fetchGeminiResponse(userInput);
      const botMsg = { text: botReply, sender: 'bot', id: Date.now() + 1 };

      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }
  }, [text, loading, fetchGeminiResponse]);

  const handleTextChange = useCallback((e) => {
    setText(e.target.value);
  }, []);

  return (
    <Box
      sx={{
        p: 2,
        height: '100vh',
        boxSizing: 'border-box',
        bgcolor: '#393E46',
      }}
    >
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            p: 2, 
            borderBottom: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
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
          {messages.map((msg) => (
            <ListItem
              key={msg.id}
              sx={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}
            >
              <Box
                sx={{
                  bgcolor: msg.sender === 'user' ? '#673ab7' : '#e0e0e0',
                  color: msg.sender === 'user' ? 'white' : 'black',
                  p: 1.5,
                  borderRadius: 2,
                  maxWidth: '75%',
                  wordBreak: 'break-word',
                }}
              >
                {msg.text}
              </Box>
            </ListItem>
          ))}
          {loading && (
            <ListItem sx={{ justifyContent: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Thinking...
                </Typography>
              </Box>
            </ListItem>
          )}
          <div ref={messagesEndRef} />
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
            onChange={handleTextChange}
            onKeyDown={handleSend}
            disabled={loading}
            autoComplete="off"
          />
        </Box>
      </Card>
    </Box>
  );
}
