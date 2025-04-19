// pages/AIAssistant.jsx
import { useState } from 'react';
import {
  Card,
  Typography,
  Button,
  TextField,
  Modal,
  Box,
  List,
  ListItem,
} from '@mui/material';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxHeight: '80vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto',
  borderRadius: 2,
};

export default function AIAssistant() {
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);

  const handleStart = () => {
    if (attemptsLeft > 0) {
      setAttemptsLeft(attemptsLeft - 1);
      setOpen(true);
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      setConversation((prev) => [
        ...prev,
        { sender: 'user', text: input },
        { sender: 'ai', text: 'Dummy AI response for: ' + input },
      ]);
      setInput('');
    }
  };

  return (
    <Card sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        <b>Ask AI About Your Case</b>
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        <b>Remaining Free Attempts:</b> {attemptsLeft}
      </Typography>
      <Button
        variant="contained"
        onClick={handleStart}
        disabled={attemptsLeft === 0}
        sx={{ mb: 2 }}
      >
        Start Case
      </Button>
      {attemptsLeft === 0 && (
        <Typography color="error" variant="body2">
          You have used all free attempts. Please subscribe for more access.
        </Typography>
      )}

      <Modal open={open} onClose={() => {}}>
        <Box sx={modalStyle}>
          <Typography variant="h6" gutterBottom textAlign="center">
            <b>Live Case Conversation</b>
          </Typography>
          <List>
            {conversation.map((msg, idx) => (
              <ListItem
                key={idx}
                sx={{
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
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

          <Box display="flex" mt={2} gap={2}>
            <TextField
              fullWidth
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button variant="contained" onClick={handleSend}>
              Send
            </Button>
          </Box>

          <Button
            onClick={() => setOpen(false)}
            variant="outlined"
            color="error"
            sx={{ mt: 3 }}
          >
            End Case
          </Button>
        </Box>
      </Modal>
    </Card>
  );
}
