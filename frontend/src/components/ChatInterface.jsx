import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Chip,
  Badge,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Gavel as GavelIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { chatService } from '../services/api';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const ChatInterface = ({ userRole = 'user' }) => {
  const theme = useTheme();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // New chat dialog
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchUsers, setSearchUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [chatName, setChatName] = useState('');
  
  // WebSocket
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Helpers to compute safe display names
  const getUserName = (u) => {
    if (!u) return 'Unknown';
    const full = [u.fullName, [u.firstName, u.lastName].filter(Boolean).join(' '), u.email]
      .find(v => v && String(v).trim().length);
    return full || (u.id ? `User ${u.id}` : 'Unknown');
  };

  const getChatName = (chat, meId) => {
    if (!chat) return '';
    if (chat.displayName && chat.displayName.trim()) return chat.displayName;
    if (chat.chatName && chat.chatName.trim()) return chat.chatName;
    const participants = chat.participants || chat.users || [];
    const others = participants.filter(p => String(p.id) !== String(meId));
    const base = others.slice(0, 3).map(getUserName).join(', ');
    return base || 'You';
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws`);
    const client = Stomp.over(socket);
    
    client.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        setConnected(true);
        setStompClient(client);
        
        // Subscribe to the current user's queue (Spring user destination)
        client.subscribe(`/user/queue/messages`, (message) => {
          const messageData = JSON.parse(message.body);
          handleNewMessage(messageData);
        });
      },
      (error) => {
        console.error('WebSocket connection error:', error);
        setConnected(false);
      }
    );

    return () => {
      if (client && client.connected) {
        client.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatService.getChats();
      const loadedChats = response.data.chats || [];
      setChats(loadedChats);
      return loadedChats; 
    } catch (err) {
      setError('Failed to load chats');
      console.error('Error loading chats:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      setLoading(true);
      const response = await chatService.getChatMessages(chatId);
      setMessages(response.data.messages || []);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      await chatService.sendMessage(selectedChat.id, newMessage.trim());
      setNewMessage('');
      
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const optimisticMessage = {
        id: Date.now(),
        content: newMessage.trim(),
        sentAt: new Date().toISOString(),
        sender: {
          id: userProfile.id,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          image: userProfile.image,
          isCurrentUser: true,
        },
      };
      setMessages(prev => [...prev, optimisticMessage]);
      
      messageInputRef.current?.focus();
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    }
  };

  const handleNewMessage = (messageData) => {
    console.log('Received new message:', messageData);
    
    // Update messages if this is for the currently selected chat
    if (selectedChat && messageData.chatId === selectedChat.id) {
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === messageData.id);
        if (exists) return prev;
        return [...prev, messageData];
      });
    }
    
    // Update chat list with latest message info
    setChats(prev => prev.map(chat => 
      chat.id === messageData.chatId 
        ? { 
            ...chat, 
            lastMessageContent: messageData.content, 
            lastMessageAt: messageData.sentAt,
            lastMessageSender: messageData.sender
          }
        : chat
    ));
  };

  const searchUsersForNewChat = async (query) => {
    if (!query.trim()) {
      setSearchUsers([]);
      return;
    }

    try {
      const response = await chatService.searchUsers(query);
      setSearchUsers(response.data.users || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const handleCreateChat = async () => {
    console.log('handleCreateChat called, selectedUsers:', selectedUsers);
    
    if (selectedUsers.length === 0) {
      console.log('No users selected, returning early');
      return;
    }

    try {
      const participantIds = selectedUsers.map(user => user.id);
      console.log('Participant IDs:', participantIds);
      console.log('Chat name:', chatName);
      
      console.log('Calling chatService.createChat...');
      const response = await chatService.createChat(participantIds, chatName || null);
      console.log('Chat creation response:', response);
      
      setShowNewChatDialog(false);
      setSelectedUsers([]);
      setChatName('');
      setUserSearchQuery('');
      
      if (response.data && response.data.chatId) {
        // Wait a moment for the database transaction to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reload chats and select the new one
        console.log('Reloading chats...');
        const updatedChats = await loadChats();
        
        console.log('Looking for new chat with ID:', response.data.chatId);
        console.log('Available chats:', updatedChats.map(c => ({ id: c.id, name: c.displayName || c.chatName })));
        
        let foundChat = updatedChats.find(chat => chat.id === response.data.chatId);
        
        if (!foundChat && participantIds.length === 1) {
          // Try to find by other participant for direct chats
          const otherUserId = participantIds[0];
          foundChat = updatedChats.find(chat => 
            chat.otherUser && chat.otherUser.id === otherUserId
          );
          console.log('Searched by participant ID:', otherUserId, 'Found:', foundChat);
        }
        
        if (foundChat) {
          console.log('Found chat, selecting it:', foundChat);
          handleChatSelect(foundChat);
        } else {
          console.log('New chat not found in chats list, but creation was successful');
          // Force a reload in case of timing issues
          setTimeout(() => {
            console.log('Retrying chat load after delay...');
            loadChats();
          }, 1000);
        }
      } else {
        console.log('No chatId in response data');
      }
    } catch (err) {
      setError('Failed to create chat');
      console.error('Error creating chat:', err);
      console.error('Error details:', err.response?.data);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserIcon = (user) => {
    if (user.isJudge) return <GavelIcon />;
    if (user.isLawyer) return <PersonIcon />;
    return <AccountCircleIcon />;
  };

  const getUserTypeColor = (user) => {
    if (user.isJudge) return '#7c3aed';
    if (user.isLawyer) return '#059669';
    return '#1e3a8a';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', height: '100%', minHeight: '500px' }}>
        {/* Chat List */}
        <Paper
          sx={{
            width: '300px',
            borderRadius: 2,
            mr: 2,
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Chats</Typography>
              <IconButton
                onClick={() => setShowNewChatDialog(true)}
                size="small"
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': { bgcolor: theme.palette.primary.dark },
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={connected ? <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />}
                label={connected ? 'Online' : 'Offline'}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {loading && chats.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : chats.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No chats yet"
                  secondary="Start a new conversation"
                  sx={{ textAlign: 'center' }}
                />
              </ListItem>
            ) : (
              chats.map((chat) => (
                <ListItem
                  key={chat.id}
                  button
                  onClick={() => handleChatSelect(chat)}
                  selected={selectedChat?.id === chat.id}
                  sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&.Mui-selected': {
                      bgcolor: theme.palette.action.selected,
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={chat.unreadCount || 0}
                      color="error"
                      invisible={!chat.unreadCount}
                    >
                      <Avatar
                        src={chat.otherUser?.image}
                        sx={{
                          bgcolor: getUserTypeColor(chat.otherUser || {}),
                        }}
                      >
                        {chat.otherUser ? 
                          getUserIcon(chat.otherUser) : 
                          chat.displayName?.charAt(0)?.toUpperCase()
                        }
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" noWrap>
                          {getChatName(chat, JSON.parse(localStorage.getItem('userProfile') || '{}').id)}
                        </Typography>
                        {chat.otherUser?.isLawyer && (
                          <Chip label="Lawyer" size="small" color="success" />
                        )}
                        {chat.otherUser?.isJudge && (
                          <Chip label="Judge" size="small" color="secondary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {chat.lastMessageContent || 'No messages yet'}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </Paper>

        {/* Chat Messages */}
        <Paper
          sx={{
            flex: 1,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.default,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={selectedChat.otherUser?.image}
                    sx={{
                      bgcolor: getUserTypeColor(selectedChat.otherUser || {}),
                    }}
                  >
                    {selectedChat.otherUser ? 
                      getUserIcon(selectedChat.otherUser) : 
                      selectedChat.displayName?.charAt(0)?.toUpperCase()
                    }
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {getChatName(selectedChat, JSON.parse(localStorage.getItem('userProfile') || '{}').id)}
                    </Typography>
                    {selectedChat.otherUser && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {selectedChat.otherUser.isLawyer && (
                          <Chip label="Lawyer" size="small" color="success" />
                        )}
                        {selectedChat.otherUser.isJudge && (
                          <Chip label="Judge" size="small" color="secondary" />
                        )}
                        {selectedChat.otherUser.specialisation && (
                          <Chip label={selectedChat.otherUser.specialisation} size="small" variant="outlined" />
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                {loading && messages.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Typography color="text.secondary">
                      No messages yet. Start the conversation!
                    </Typography>
                  </Box>
                ) : (
                  messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.sender.isCurrentUser ? 'flex-end' : 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '70%',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: message.sender.isCurrentUser 
                            ? theme.palette.primary.main 
                            : theme.palette.grey[100],
                          color: message.sender.isCurrentUser 
                            ? 'white' 
                            : theme.palette.text.primary,
                        }}
                      >
                        {!message.sender.isCurrentUser && (
                          <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                            {message.sender.firstName} {message.sender.lastName}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          {message.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            opacity: 0.7,
                            fontSize: '0.75rem',
                          }}
                        >
                          {formatTime(message.sentAt)}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input */}
              <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <TextField
                  ref={messageInputRef}
                  fullWidth
                  multiline
                  maxRows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  variant="outlined"
                  size="small"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          color="primary"
                        >
                          <SendIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                p: 4,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Select a chat to start messaging
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* New Chat Dialog */}
      <Dialog
        open={showNewChatDialog}
        onClose={() => setShowNewChatDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start New Chat</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            options={searchUsers}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
            value={selectedUsers}
            onChange={(event, newValue) => setSelectedUsers(newValue)}
            inputValue={userSearchQuery}
            onInputChange={(event, newInputValue) => {
              setUserSearchQuery(newInputValue);
              searchUsersForNewChat(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search users"
                placeholder="Type to search users..."
                fullWidth
                margin="normal"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Avatar
                  src={option.image}
                  sx={{ 
                    mr: 2, 
                    bgcolor: getUserTypeColor(option),
                    width: 32, 
                    height: 32 
                  }}
                >
                  {getUserIcon(option)}
                </Avatar>
                <Box>
                  <Typography variant="body2">
                    {option.firstName} {option.lastName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                    {option.isLawyer && <Chip label="Lawyer" size="small" color="success" />}
                    {option.isJudge && <Chip label="Judge" size="small" color="secondary" />}
                  </Box>
                </Box>
              </Box>
            )}
          />
          
          {selectedUsers.length > 1 && (
            <TextField
              label="Chat Name (Optional)"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              fullWidth
              margin="normal"
              placeholder="Enter a name for this group chat"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewChatDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateChat} 
            variant="contained"
            disabled={selectedUsers.length === 0}
          >
            Start Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatInterface;
