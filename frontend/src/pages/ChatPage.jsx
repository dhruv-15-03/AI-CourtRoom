import { useState, useEffect } from 'react';
import { Container, Grid, Typography, List, ListItem, ListItemText, Avatar, Paper, TextField, Button } from '@mui/material';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useNavigate } from 'react-router-dom';

const chats = [
  { id: 1, name: 'Adv. Priya Sharma', lastMessage: 'I can help with your case.', avatar: '', },
  { id: 2, name: 'Adv. Rajeev Mehta', lastMessage: 'Let me review your case.', avatar: '', },
  { id: 3, name: 'Adv. Anjali Rao', lastMessage: 'We can settle this divorce case quickly.', avatar: '', },
];

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const socket = new SockJS('https://your-backend-url.com/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log(str);
      },
      onConnect: () => {
        console.log('Connected to WebSocket');
        client.subscribe('/topic/messages', (message) => {
          const incomingMessage = JSON.parse(message.body);
          setMessages((prevMessages) => [...prevMessages, incomingMessage]);
        });
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [stompClient]);

  const handleChatSelection = (chatId) => {
    setSelectedChat(chatId);
    setMessages([]); 
    const mockMessages = [
      { sender: 'You', content: 'Hi, I need help!', timestamp: '2025-04-14T10:00:00' },
      { sender: 'Adv. Priya Sharma', content: 'Sure, I can assist with that............fwegwgnj', timestamp: '2025-04-14T10:01:00' },
    ];
    setMessages(mockMessages);
  };

  const sendMessage = () => {
    if (newMessage.trim() && stompClient) {
      const messagePayload = {
        sender: 'You', 
        content: newMessage,
        chatId: selectedChat,
        timestamp: new Date().toISOString(),
      };

      stompClient.send('/app/chat', {}, JSON.stringify(messagePayload));
      setNewMessage('');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={2}>
        <Grid item xs={3} sx={{ borderRight: '1px solid #ddd', height: '80vh', overflowY: 'scroll' }}>
          <Typography variant="h6" gutterBottom>
            Chats
          </Typography>
          <List>
            {chats.map((chat) => (
              <ListItem sx={{cursor: 'pointer'}} button key={chat.id} onClick={() => handleChatSelection(chat.id)}>
                <Avatar sx={{ marginRight: 2 }} src={chat.avatar || ''} />
                <ListItemText
                  primary={chat.name}
                  secondary={chat.lastMessage}
                />
              </ListItem>
            ))}
          </List>
        </Grid>

        <Grid item xs={9}>
          {selectedChat ? (
            <Paper sx={{ padding: 2,width: 'full', height: '80vh', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h5" gutterBottom>
                Chat with {chats.find((chat) => chat.id === selectedChat)?.name}
              </Typography>
              <div style={{ flexGrow: 1, overflowY: 'scroll', marginBottom: '10px' }}>
                {messages.map((msg, index) => (
                  <div key={index} style={{ marginBottom: '10px' }}>
                    <strong>{msg.sender}</strong>: {msg.content}
                  </div>
                ))}
              </div>
              <TextField
                label="Type your message"
                variant="outlined"
                fullWidth
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                sx={{ marginBottom: '10px' }}
              />
              <Button variant="contained" onClick={sendMessage} sx={{ width: '100%' }}>
                Send
              </Button>
            </Paper>
          ) : (
            <Typography variant="body1">Select a chat to begin.</Typography>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
