# Task Manager Application

A comprehensive full-stack task management application built with React, Node.js, and MongoDB. This application allows users to create projects, manage tasks with advanced features, collaborate with team members, and track progress efficiently.

## 🚀 Features

### **User Management**
- **User Authentication**: Secure login and registration system with JWT tokens
- **User Management Dashboard**: Complete CRUD operations for users
- **User Profiles**: View, edit, and manage user information
- **Password Management**: Secure password updates with validation

### **Project Management**
- **Project Creation**: Create, edit, and delete projects
- **Project Sharing**: Share projects with other users with role-based permissions
- **Role-Based Access Control**: Owner, Editor, and Viewer roles
- **Project Overview**: View project details and member information

### **Advanced Task Management**
- **Task Creation**: Add tasks with comprehensive details
- **Sub-Tasks Support**: Create nested tasks with unlimited hierarchy
- **Task Properties**:
  - Name and description
  - Priority levels (Low, Medium, High, Critical)
  - Status tracking (To Do, In Progress, Done)
  - Due dates with overdue warnings
  - Assignee assignment
  - Tags for categorization
  - Time tracking (estimated and actual hours)
  - Comments and discussions
- **Task Templates**: Predefined task structures
- **Bulk Operations**: Efficient task management

### **Enhanced Filtering & Search**
- **Multi-criteria Filtering**:
  - Filter by status, priority, assignee
  - Date range filtering
  - Tag-based filtering
  - Keyword search in name and description
- **Advanced Search**: Real-time search with multiple criteria
- **Filter Persistence**: Saved filters per project

### **Collaboration Features**
- **Real-time Updates**: Dynamic task status updates
- **Project Sharing**: Invite team members with specific roles
- **Comments System**: Add comments to tasks for discussions
- **Activity Tracking**: Monitor project and task changes

### **User Interface**
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Drag & Drop**: Intuitive task organization
- **Tree View**: Collapsible sub-task hierarchy
- **Role-Based UI**: Different interfaces based on user permissions
- **Dark Mode Ready**: Prepared for future dark mode implementation

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Zustand** for state management
- **React Query** for data fetching and caching
- **React Hook Form** for form handling and validation
- **React Beautiful DnD** for drag and drop functionality
- **Headless UI** for accessible components
- **Heroicons** for beautiful icons

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** for cross-origin requests
- **Express Validator** for input validation
- **MongoDB Indexes** for optimal performance

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
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
│   │   │   ├── CreateUserModal.tsx
│   │   │   ├── EditProjectModal.tsx
│   │   │   ├── EditTaskModal.tsx
│   │   │   ├── EditUserModal.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── ShareProjectModal.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskList.tsx
│   │   │   └── ViewUserModal.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── ProjectDetails.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Tasks.tsx
│   │   │   └── Users.tsx
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
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### User Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `GET /api/users/:userId` - Get user by ID
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/share` - Share project with user
- `DELETE /api/projects/:id/share/:userId` - Remove user from project

### Tasks
- `GET /api/projects/:projectId/tasks` - Get project tasks with filtering
- `POST /api/projects/:projectId/tasks` - Create new task
- `GET /api/projects/:projectId/tasks/:taskId` - Get task by ID
- `PATCH /api/projects/:projectId/tasks/:taskId` - Update task
- `DELETE /api/projects/:projectId/tasks/:taskId` - Delete task
- `POST /api/projects/:projectId/tasks/:taskId/comments` - Add comment to task

## 🎨 Features in Detail

### User Management
- **Complete CRUD Operations**: Create, read, update, and delete users
- **Password Security**: Secure password hashing and validation
- **User Search**: Search users by name or email
- **User Profiles**: Detailed user information display

### Project Management
- **Project Creation**: Create projects with name and description
- **Project Sharing**: Share projects with team members
- **Role-Based Permissions**: 
  - **Owner**: Full access to project and tasks, can share project
  - **Editor**: Can create/edit/delete tasks, cannot share project
  - **Viewer**: Read-only access to project and tasks

### Task Management
- **Advanced Task Properties**:
  - **Priority Levels**: Low, Medium, High, Critical with color coding
  - **Assignee Assignment**: Assign tasks to specific team members
  - **Time Tracking**: Estimated and actual hours tracking
  - **Tags**: Categorize tasks with custom tags
  - **Comments**: Add discussions and notes to tasks
  - **Due Dates**: Set and track due dates with overdue warnings
- **Sub-Task Support**: Create unlimited nested task hierarchies
- **Task Templates**: Predefined task structures for common workflows
- **Bulk Operations**: Efficient management of multiple tasks

### Advanced Filtering
- **Multi-Criteria Filtering**: Filter by status, priority, assignee, tags
- **Date Range Filtering**: Filter tasks by due date ranges
- **Keyword Search**: Search in task names and descriptions
- **Filter Persistence**: Save and restore filter preferences
- **Real-time Filtering**: Instant results as you type

### Collaboration Features
- **Real-time Updates**: Dynamic task status updates across the team
- **Project Sharing**: Invite team members with specific roles
- **Comments System**: Add and view comments on tasks
- **Activity Tracking**: Monitor changes and updates

## 🚀 Deployment

### Backend Deployment
1. Set up environment variables on your hosting platform
2. Deploy to platforms like Heroku, Railway, or DigitalOcean
3. Ensure MongoDB connection is properly configured
4. Set up proper CORS settings for production

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to platforms like Vercel, Netlify, or GitHub Pages
3. Configure environment variables for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🎯 Key Achievements

✅ **Complete User Management System**  
✅ **Advanced Task Management with Sub-tasks**  
✅ **Role-Based Access Control**  
✅ **Comprehensive Filtering and Search**  
✅ **Real-time Collaboration Features**  
✅ **Modern, Responsive UI/UX**  
✅ **Secure Authentication System**  
✅ **Scalable Architecture**  
✅ **Performance Optimized**  
✅ **Production Ready**

---

**Happy Task Managing! 🎉** 