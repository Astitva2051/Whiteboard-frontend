# Collaborative Whiteboard Application

A full-stack collaborative whiteboard application built using the MERN stack (MongoDB, Express.js, React.js, Node.js) and Socket.IO for real-time collaboration. The application allows multiple users to draw together in real-time on a shared whiteboard.

## Features

- **Real-time drawing** with mouse or touch input
- **Multiple users** drawing at the same time
- **User authentication** with JWT
- **Create/join whiteboard rooms** (each room with a unique ID)
- **Save and load** whiteboard drawings from MongoDB
- **Various drawing tools** (pen, eraser, shapes, text)
- **Chat functionality** for real-time communication
- **Responsive design** for mobile, tablet, and desktop

## Project Structure

The project is organized into two main directories:

### Backend

- **Server**: Node.js with Express.js
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Authentication**: JWT-based
- **APIs**: RESTful API for user auth, room management, and data persistence

### Frontend

- **Interface**: React.js with Material UI
- **State Management**: React Context API
- **Routing**: React Router
- **Real-time Client**: Socket.IO client
- **Responsive Design**: Mobile and desktop friendly

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your MongoDB URI and JWT secret:

   ```
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```

5. Start the server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your backend API URL:

   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

5. Start the React development server:

   ```
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout user

### Rooms

- `GET /api/rooms` - Get all rooms for the current user
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:id` - Get a single room
- `DELETE /api/rooms/:id` - Delete a room
- `POST /api/rooms/join` - Join a room by roomId
- `DELETE /api/rooms/:id/leave` - Leave a room

### Whiteboard

- `GET /api/whiteboards/:roomId` - Get whiteboard data
- `PUT /api/whiteboards/:roomId` - Save whiteboard data
- `DELETE /api/whiteboards/:roomId/clear` - Clear whiteboard

## Socket.IO Events

### Connection

- `connection` - User connected
- `disconnect` - User disconnected

### Room

- `join-room` - Join a whiteboard room
- `leave-room` - Leave a whiteboard room
- `user-connected` - User joined a room
- `user-disconnected` - User left a room
- `room-users` - List of users in a room

### Drawing

- `draw-start` - Start drawing
- `draw-move` - Drawing in progress
- `draw-end` - End drawing
- `add-text` - Add text to the whiteboard
- `add-shape` - Add shape to the whiteboard
- `clear-board` - Clear the whiteboard

### Chat

- `send-message` - Send a chat message
- `receive-message` - Receive a chat message

## Technologies Used

- **MongoDB** - Database
- **Express.js** - Backend framework
- **React.js** - Frontend library
- **Node.js** - Runtime environment
- **Socket.IO** - Real-time communication
- **Material UI** - UI component library
- **JWT** - Authentication
- **React Router** - Client-side routing

## Deployment

The application is designed to be easily deployable to platforms like Heroku, Vercel, or AWS.

### Backend Deployment

- Deploy the backend to platforms like Heroku, AWS, or DigitalOcean
- Set up environment variables for production

### Frontend Deployment

- Build the production version of the React app:
  ```
  npm run build
  ```
- Deploy the build folder to platforms like Vercel, Netlify, or Firebase Hosting
- Update the API URL in the environment variables to point to your deployed backend

## License

MIT

## Author

Your Name
