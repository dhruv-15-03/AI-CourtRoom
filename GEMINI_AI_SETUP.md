# 🤖 Gemini AI Integration Setup Guide

## Overview
Your AI Assistant is now configured to use **Google Gemini API** with the following features:
- ✅ Responds in **50 words or less**
- ✅ Uses **bullet points** (•) for easy reading
- ✅ Explains legal concepts **like you're 10 years old**
- ✅ Simple, friendly language - no complex legal jargon
- ✅ Configurable Gemini model (default: `gemini-1.5-flash`)

---

## 🔑 Get Your Gemini API Key

### Step 1: Get API Key from Google AI Studio
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Click **"Create API key in new project"** or select existing project
5. Copy your API key (it starts with `AIza...`)

**⚠️ IMPORTANT**: Keep this key secret! Never share it or commit it to GitHub.

---

## ⚙️ Backend Configuration

### Step 1: Create `.env` file
In the backend directory (`e:\AI-Courtroom\backend\demo`), create a `.env` file:

```bash
# Copy from .env.example
cp .env.example .env
```

### Step 2: Add your Gemini API key
Edit `.env` and add:

```properties
# Gemini AI Configuration
GEMINI_API_KEY=AIzaSyD...your_actual_key_here
GEMINI_API_MODEL=gemini-1.5-flash
```

**Available Models**:
- `gemini-1.5-flash` (Recommended - Fast & cost-effective)
- `gemini-1.5-pro` (More powerful, higher quality)
- `gemini-1.0-pro` (Legacy model)

### Step 3: Verify Backend Configuration
The following files have been configured:

✅ **`AIController.java`** - New controller at `/api/ai/chat`
- Handles AI chat requests
- Formats responses for 10-year-old understanding
- Limits responses to 50 words with bullet points

✅ **`application.properties`** - Added Gemini config:
```properties
gemini.api.key=${GEMINI_API_KEY:}
gemini.api.model=${GEMINI_API_MODEL:gemini-1.5-flash}
```

---

## 🎨 Frontend Configuration

### Step 1: Update Services
✅ **`api.js`** - Already updated with new endpoint:
```javascript
export const aiService = {
  chatWithAI: (message) => api.post('/api/ai/chat', { message }),
  checkHealth: () => api.get('/api/ai/health'),
};
```

### Step 2: AI Assistant Component
✅ **`AIAssistant.jsx`** - Enhanced with:
- Real API integration (no more dummy responses!)
- Loading spinner while AI thinks
- Error handling with user-friendly messages
- Improved message formatting with bullet point support

---

## 🚀 Testing the Integration

### 1. Start Backend
```powershell
cd e:\AI-Courtroom\backend\demo
mvn spring-boot:run
```

Backend will start on: `http://localhost:8081`

### 2. Test Health Endpoint (Optional)
Open browser or use curl:
```bash
curl http://localhost:8081/api/ai/health
```

Expected response:
```json
{
  "status": "ok",
  "geminiConfigured": true,
  "model": "gemini-1.5-flash"
}
```

If `geminiConfigured: false`, check your `.env` file.

### 3. Start Frontend
```powershell
cd e:\AI-Courtroom\frontend
npm start
```

Frontend will start on: `http://localhost:3000`

### 4. Test AI Chat
1. Navigate to **AI Assistant** page
2. Click **"Start AI Consultation"** button
3. Ask a legal question like:
   - "What is a lawyer?"
   - "What does a judge do?"
   - "What is a contract?"

Expected AI response format:
```
• A lawyer is someone who helps people with legal problems
• They know the law and can give advice
• Lawyers speak for people in court
• They help make sure everyone is treated fairly
```

---

## 🎯 How the AI is Configured

### System Prompt (Built-in)
```
You are a friendly legal assistant for kids. Your job is to explain legal concepts in the simplest way possible.

Rules:
1. Keep your ENTIRE response under 50 words maximum
2. Use bullet points (•) to break down information
3. Explain like you're talking to a 10-year-old
4. Use simple words - no complex legal jargon
5. Be friendly and encouraging
6. If the topic is complex, give just the most important points
```

### Generation Settings
```java
"temperature": 0.7,         // Creativity level (0.7 = balanced)
"maxOutputTokens": 150,     // Max words (~50 words)
"topP": 0.8,                // Sampling diversity
"topK": 40                  // Top choices consideration
```

---

## 🔧 Customization Options

### Change AI Model
In `.env`:
```properties
# Use more powerful model (costs more)
GEMINI_API_MODEL=gemini-1.5-pro

# Use faster, cheaper model (recommended)
GEMINI_API_MODEL=gemini-1.5-flash
```

### Adjust Response Length
Edit `AIController.java` line 70:
```java
"maxOutputTokens", 150,  // Change this number (150 ≈ 50 words)
```

### Change Tone/Style
Edit the system prompt in `AIController.java` (lines 50-61) to change:
- Target age (currently 10 years old)
- Response format (currently bullet points)
- Word limit (currently 50 words)
- Tone (currently friendly)

---

## 🐛 Troubleshooting

### Error: "Gemini API key not configured"
**Solution**: 
1. Check `.env` file exists in `backend/demo/`
2. Verify `GEMINI_API_KEY=AIza...` is set
3. Restart Spring Boot server

### Error: "Failed to get response from AI"
**Possible causes**:
1. **Invalid API Key**: Verify your key at [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Rate Limit**: Free tier has limits (60 requests/minute)
3. **Network Issue**: Check internet connection
4. **Model Not Available**: Try `gemini-1.5-flash` instead

**Check backend logs**:
```powershell
# Backend terminal will show detailed error
Error calling Gemini API: <error details>
```

### AI responses are too long
**Solution**: Edit `AIController.java`:
```java
"maxOutputTokens", 100,  // Reduce from 150 to 100
```

### AI responses not in bullet points
**Solution**: AI might ignore instructions occasionally. The system prompt is already configured for bullet points. If it persists:
1. Use `gemini-1.5-pro` (better instruction following)
2. Restart conversation (clear chat history)

---

## 💰 Pricing & Limits

### Gemini 1.5 Flash (Recommended)
- **Free Tier**: 15 requests per minute, 1 million requests per day
- **Paid**: $0.35 per 1M input tokens, $1.05 per 1M output tokens
- **Best for**: Most use cases, fast responses

### Gemini 1.5 Pro
- **Free Tier**: 2 requests per minute, 50 requests per day
- **Paid**: $3.50 per 1M input tokens, $10.50 per 1M output tokens
- **Best for**: Complex legal analysis, higher quality

**For your use case** (50-word responses):
- 1 message ≈ 200 tokens (input + output)
- Free tier = ~1000-7500 messages/day depending on model
- **Cost**: Essentially free for development/testing!

---

## 📝 API Endpoints

### POST `/api/ai/chat`
Send message to AI assistant

**Request**:
```json
{
  "message": "What is a lawyer?"
}
```

**Response**:
```json
{
  "response": "• A lawyer helps people with legal problems...",
  "sender": "ai",
  "model": "gemini-1.5-flash"
}
```

### GET `/api/ai/health`
Check AI service status

**Response**:
```json
{
  "status": "ok",
  "geminiConfigured": true,
  "model": "gemini-1.5-flash"
}
```

---

## ✅ Setup Checklist

Before using AI Assistant:

- [ ] Get Gemini API key from Google AI Studio
- [ ] Create `backend/demo/.env` file
- [ ] Add `GEMINI_API_KEY` to `.env`
- [ ] (Optional) Set `GEMINI_API_MODEL` in `.env`
- [ ] Start backend: `mvn spring-boot:run`
- [ ] Test health endpoint: `http://localhost:8081/api/ai/health`
- [ ] Start frontend: `npm start`
- [ ] Test AI chat in browser
- [ ] Verify responses are short and use bullet points

---

## 🎉 You're All Set!

Your AI Assistant is now powered by Google Gemini and configured to:
- ✅ Give simple, kid-friendly explanations
- ✅ Keep responses under 50 words
- ✅ Use bullet points for easy reading
- ✅ Help users understand legal concepts without jargon

**Next Steps**:
1. Add your Gemini API key to `.env`
2. Start both backend and frontend
3. Try asking legal questions!

**Example Questions to Try**:
- "What is a contract?"
- "What does bail mean?"
- "What is a witness?"
- "What does 'innocent until proven guilty' mean?"

The AI will explain everything in super simple terms! 🌟
