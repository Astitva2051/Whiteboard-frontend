# Collaborative Whiteboard Frontend

This is the frontend for a collaborative whiteboard application, built with React.js and Material UI. It enables multiple users to draw together in real-time, chat, and use various drawing tools on a shared whiteboard.

## Features

- **Real-time drawing** with mouse or touch input
- **Multiple users** drawing simultaneously
- **User authentication** (via JWT)
- **Create/join whiteboard rooms** (each with a unique ID)
- **Save and load** whiteboard drawings
- **Drawing tools**: pen, eraser, shapes, text
- **Chat functionality** for real-time communication
- **Responsive design** for mobile, tablet, and desktop

## Project Structure

- **src/**: React components, contexts, hooks, and utilities
- **public/**: Static assets and HTML template
- **.env**: Environment variables for API and Socket.IO endpoints

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone this repository and navigate to the frontend directory:

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

4. Update the `.env` file with your backend API and Socket.IO URLs:

   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

5. Start the React development server:

   ```
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Environment Variables

- `REACT_APP_API_URL`: URL of the backend API
- `REACT_APP_SOCKET_URL`: URL of the Socket.IO server

## Technologies Used

- **React.js** - Frontend library
- **Material UI** - UI component library
- **Socket.IO Client** - Real-time communication
- **React Context API** - State management
- **React Router** - Client-side routing

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Runs tests

## Deployment

To deploy the frontend:

1. Build the production version:

   ```
   npm run build
   ```

2. Deploy the contents of the `build/` folder to your preferred static hosting (e.g., Vercel, Netlify, Firebase Hosting).

3. Update the environment variables to point to your deployed backend API and Socket.IO server.

## License

MIT

## Author

Your Name
