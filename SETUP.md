# VIBE TRIP - Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- Firebase account
- ✅ Google Gemini API key (Already configured!)
- Mapbox account (optional for maps)

## Quick Start

1. **Install Dependencies**
   ```bash
   npm run install-all
   ```

2. **Configure Firebase**
   - Create project at https://console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Download service account key → `backend/serviceAccountKey.json`
   - Update `frontend/src/config/firebase.js` with your config

3. **Run the Application**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## First Time Setup Checklist

- [ ] Install Node.js
- [ ] Run `npm run install-all`
- [ ] Create Firebase project
- [ ] Enable Firestore & Authentication
- [ ] Download service account key
- [ ] Update `frontend/src/config/firebase.js`
- [x] Gemini API key configured ✅
- [ ] Update `backend/server.js` with Firebase credentials
- [ ] Run `npm run dev`
- [ ] Visit http://localhost:3000

## Testing the Features

1. **Sign Up/Login** - Create an account
2. **Create Trip** - Fill in trip details
3. **View Itinerary** - See AI-generated plan
4. **Suggest Change** - Add a request
5. **Analyze Request** - Let AI evaluate it
6. **Accept/Reject** - Update the plan
7. **Check Budget** - Monitor spending
8. **Explore Map** - View route (requires Mapbox token)

## Common Issues

**Problem**: Firebase errors
- **Solution**: Check Firebase config in `frontend/src/config/firebase.js`

**Problem**: AI not generating itinerary
- **Solution**: ✅ API key is already configured in `backend/.env`

**Problem**: Map not loading
- **Solution**: Add Mapbox token in `frontend/src/components/trip/MapView.jsx`

**Problem**: Backend won't start
- **Solution**: Ensure `serviceAccountKey.json` exists and is valid

## Environment Variables

✅ Already configured in `backend/.env`:
```
PORT=5000
GEMINI_API_KEY=AIzaSyA0MY5-S-IwUg2t_oWNZqrNiO5bglymtr0
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

## Demo Mode

The app includes demo data for:
- Local guides (no API needed)
- Solo traveler groups (static data)
- Map markers (predefined coordinates)

This allows you to demo features without full API setup!

## Need Help?

Check the full README.md for detailed documentation.
