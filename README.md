# Task Manager Application

A full-stack task management application built with React, Node.js, and MongoDB. This application allows users to create projects, manage tasks, collaborate with team members, and track progress efficiently.

## 🚀 Features

- **User Authentication**: Secure login and registration system
- **Project Management**: Create, edit, and delete projects
- **Task Management**: Add, update, and delete tasks with status tracking
- **Project Sharing**: Share projects with other users for collaboration
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Real-time Updates**: Dynamic task status updates
- **Drag & Drop**: Intuitive task organization with drag and drop functionality

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Zustand** for state management
- **React Query** for data fetching
- **React Hook Form** for form handling
- **React Beautiful DnD** for drag and drop
- **Headless UI** for accessible components

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** for cross-origin requests
- **Express Validator** for input validation

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/gurdeep2001/Task-Manager-App.git
cd Task-Manager-App
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create a .env file in the backend directory with the following variables:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret_key
# PORT=5000

# Start the backend server
npm start

# For development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

### 4. Database Setup

Make sure your MongoDB instance is running. If you're using MongoDB Atlas:

1. Create a new cluster
2. Get your connection string
3. Add it to your backend `.env` file

## 📁 Project Structure

```
Task-Manager-App/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── index.js
│   │   │   ├── project.js
│   │   │   ├── projectShare.js
│   │   │   ├── task.js
│   │   │   └── user.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   ├── tasks.js
│   │   │   └── users.js
│   │   └── server.js
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CreateProjectModal.tsx
│   │   │   ├── CreateTaskModal.tsx
│   │   │   ├── EditProjectModal.tsx
│   │   │   ├── EditTaskModal.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── ShareProjectModal.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── TaskList.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── ProjectDetails.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Tasks.tsx
│   │   ├── stores/
│   │   │   └── authStore.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/projects/:projectId/tasks` - Get project tasks
- `POST /api/projects/:projectId/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🎨 Features in Detail

### User Management
- Secure authentication with JWT tokens
- User registration and login
- Profile management

### Project Management
- Create and manage multiple projects
- Project sharing with other users
- Project details and overview

### Task Management
- Create tasks within projects
- Update task status (To Do, In Progress, Done)
- Drag and drop task reordering
- Task editing and deletion

### Collaboration
- Share projects with team members
- View shared projects
- Collaborative task management

## 🚀 Deployment

### Backend Deployment
1. Set up environment variables on your hosting platform
2. Deploy to platforms like Heroku, Railway, or DigitalOcean
3. Ensure MongoDB connection is properly configured

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to platforms like Vercel, Netlify, or GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Happy Task Managing! 🎉** 
