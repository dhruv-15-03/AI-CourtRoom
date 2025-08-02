# AI Courtroom

A modern, full-stack web application designed to revolutionize legal proceedings with digital case management, AI-powered assistance, and role-based workflows for users, lawyers, and judges.

## 🚀 Live Demo

Access the live application: [ai-court-room-iota.vercel.app](https://ai-court-room-iota.vercel.app/)

## 🏗️ Project Structure

- **frontend/**: React.js web client for users, lawyers, and judges
- **backend/**: Spring Boot REST API for authentication, case management, and business logic
- **AI Integration**: AI features (chatbot, assistant, etc.) are deployed separately in [AI-court-AI](https://github.com/dhruv-15-03/AI-court-AI)

## 🖥️ Tech Stack

### Frontend
- **React.js** (with functional components & hooks)
- **React Router** (role-based routing)
- **Material UI** (theming, UI components)
- **Tailwind CSS** (utility-first styling)
- **Vite** (fast development/build)

### Backend
- **Java 17**
- **Spring Boot** (REST API)
- **JWT Authentication**
- **Maven** (build tool)

### AI (External)
- See [AI-court-AI](https://github.com/dhruv-15-03/AI-court-AI) for details

## 👥 Roles & Features

- **User**: Register, login, find lawyers, chat, view cases, access AI assistant
- **Lawyer**: Dashboard, manage cases, chat, profile
- **Judge**: Dashboard, view pending cases, case details, judgments, profile
- **AI Assistant**: Legal Q&A, chatbot (integrated via external API)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- Java 17+
- Maven

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend/demo
mvnw spring-boot:run
```

### Environment Variables
- Configure API endpoints and secrets in `frontend/.env` and `backend/demo/src/main/resources/application.properties`

## 🛠️ Development
- Modular folder structure for scalability
- Role-based layouts and routing
- Responsive UI for all devices
- Easy integration with external AI APIs

## 🧑‍💻 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📬 Contact & Support

- [Issues](https://github.com/dhruv-15-03/AI-CourtRoom/issues)
- For AI-related queries, see [AI-court-AI](https://github.com/dhruv-15-03/AI-court-AI)

---

> **AI Courtroom**: Bringing intelligence, transparency, and efficiency to the legal world.
