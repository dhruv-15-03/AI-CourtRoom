import { useState } from 'react';
import { Box, TextField, Typography, List, ListItem } from '@mui/material';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const handleSend = (e) => {
    if (e.key === 'Enter' && text) {
      setMessages([...messages, { text, sender: 'user' }, { text: 'Dummy bot response', sender: 'bot' }]);
      setText('');
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Legal Chatbot</Typography>
      <List>
        {messages.map((msg, i) => (
          <ListItem key={i} sx={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            <Box
              sx={{
                bgcolor: msg.sender === 'user' ? '#673ab7' : '#e0e0e0',
                color: msg.sender === 'user' ? 'white' : 'black',
                p: 1.5,
                borderRadius: 2,
              }}
            >
              {msg.text}
            </Box>
          </ListItem>
        ))}
      </List>
      <TextField
        fullWidth
        placeholder="Type your legal question..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleSend}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
