# VIBE TRIP - Collaborative AI Travel Architect

A real-time collaborative travel planning platform powered by AI that helps groups plan trips together with intelligent suggestions and dynamic itinerary management.

## 🌟 Features

- **Collaborative Trip Planning**: Create trip workspaces where group members can plan together in real-time
- **AI-Powered Itinerary Generation**: Automatic itinerary creation based on preferences, budget, and travel style
- **Smart Request System**: Suggest changes without breaking the plan - AI analyzes feasibility
- **Live Travel Assistant**: Real-time suggestions based on time, location, and budget
- **Budget Tracking**: Monitor spending and get AI recommendations to stay within budget
- **Guide Marketplace**: Find and connect with local tour guides
- **Solo Traveler Matching**: Find groups or travel buddies with similar interests
- **Interactive Map**: Visualize your route and discover nearby attractions

## 🚀 Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Firebase for authentication and real-time database
- Mapbox for interactive maps
- Zustand for state management

### Backend
- Node.js with Express
- Firebase Admin SDK
- Google Gemini AI for intelligent planning
- Firestore for real-time data

## 📦 Installation

1. **Clone the repository**
   ```bash
   cd vibe-tour
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install all project dependencies**
   ```bash
   npm run install-all
   ```

## ⚙️ Configuration

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Download your service account key and place it in `backend/serviceAccountKey.json`
5. Update `frontend/src/config/firebase.js` with your Firebase config

### Gemini AI Setup

✅ **Already Configured!** Your API key is set in `backend/.env`

### Mapbox Setup (Optional)

1. Get an API key from [Mapbox](https://www.mapbox.com/)
2. Update `frontend/src/components/trip/MapView.jsx` with your token

## 🏃‍♂️ Running the Application

### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:

**Frontend** (http://localhost:3000):
```bash
npm run dev:frontend
```

**Backend** (http://localhost:5000):
```bash
npm run dev:backend
```

## 📁 Project Structure

```
vibe-tour/
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   └── trip/        # Trip-specific components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   └── config/          # Configuration files
│   └── package.json
│
├── backend/                 # Node.js backend
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   └── server.js            # Entry point
│
└── package.json             # Root package.json
```

## 🎯 MVP Features

### ✅ Core Features Implemented

1. **Trip Workspace** - Shared digital room for trip planning
2. **AI Itinerary Generator** - Creates initial trip plan
3. **Pending Request Queue** - Safe place for suggestions
4. **AI Feasibility Analyzer** - Evaluates request viability
5. **Auto Itinerary Re-Planner** - Updates plan when requests accepted
6. **Live Travel Assistant** - Real-time suggestions
7. **Map View** - Visual route display
8. **Guide Marketplace** - Browse local guides (demo mode)
9. **Solo Traveler Finder** - Match with groups
10. **Budget Tracker** - Monitor expenses

## 🔧 Development Notes

### User Roles
- **Trip Creator (Admin)**: Creates trip, final authority on requests
- **Group Member**: Can suggest changes and vote
- **AI Agent**: Analyzes and optimizes plans
- **Guest Viewer**: Read-only access (optional)

### Data Flow
```
Create Trip → Invite Members → Generate Base Itinerary (AI) →
Members Suggest Changes → AI Analyzes Request → 
Plan Updates Automatically → Live Travel Suggestions
```

## 🎨 Customization

- Modify colors in `frontend/tailwind.config.js`
- Adjust AI prompts in `backend/services/aiService.js`
- Add new features in respective component/route folders

## 🐛 Troubleshooting

- **Firebase errors**: Ensure Firebase config is correct
- **AI not working**: Check Gemini API key in `.env`
- **Map not loading**: Verify Mapbox token
- **CORS issues**: Backend should allow frontend origin

## 📝 TODO / Future Enhancements

- [ ] Real booking integration
- [ ] Payment processing
- [ ] Actual GPS tracking
- [ ] Push notifications
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Social sharing features
- [ ] Trip export (PDF/Calendar)

## 👥 Team Roles

- **Frontend Dev**: UI/UX, Components, State Management
- **Backend Dev**: API, Database, Server Logic
- **AI/Logic Dev**: Prompt Engineering, Feasibility Scoring
- **Presenter**: Demo Flow, Storytelling

## 📄 License

This project is for educational/demonstration purposes.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent planning
- Firebase for real-time infrastructure
- Mapbox for mapping services

---

Built with ❤️ for collaborative travel planning
