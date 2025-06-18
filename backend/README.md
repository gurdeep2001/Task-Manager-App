# Task Manager Backend API

A RESTful API for managing tasks, projects, and user collaboration with role-based access control.

## Features

- User authentication and authorization
- Project management with role-based access (Owner, Editor, Viewer)
- Task management with support for sub-tasks
- Advanced task filtering and search
- Task reordering within hierarchies

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose ODM
- JWT for authentication

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure MongoDB is installed and running on your system

3. Create a `.env` file with the necessary environment variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/task_manager
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   NODE_ENV=development
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update user profile
- `GET /api/users` - Get all users (for project sharing)

### Projects

- `POST /api/projects` - Create a new project
- `GET /api/projects` - Get all projects for current user
- `GET /api/projects/:projectId` - Get project by ID
- `PATCH /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project
- `POST /api/projects/:projectId/share` - Share project with user
- `DELETE /api/projects/:projectId/share/:userId` - Remove user from project

### Tasks

- `POST /api/projects/:projectId/tasks` - Create a new task
- `GET /api/projects/:projectId/tasks` - Get all tasks for a project
  - Query parameters:
    - `status`: Filter by status (To Do, In Progress, Done)
    - `startDate`: Filter by start date
    - `endDate`: Filter by end date
    - `search`: Search in name and description
    - `parentTaskId`: Filter by parent task (null for root tasks)
- `GET /api/projects/:projectId/tasks/:taskId` - Get task by ID
- `PATCH /api/projects/:projectId/tasks/:taskId` - Update task
- `DELETE /api/projects/:projectId/tasks/:taskId` - Delete task
- `POST /api/projects/:projectId/tasks/reorder` - Reorder tasks

## Role-Based Access

- **Owner**: Full access to project and tasks, can share project
- **Editor**: Can create/edit/delete tasks, cannot share project
- **Viewer**: Read-only access to project and tasks

## Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  timestamps: true
}
```

### Project
```javascript
{
  name: String,
  description: String,
  owner: ObjectId (ref: 'User'),
  sharedWith: [{
    user: ObjectId (ref: 'User'),
    role: String (enum: ['Owner', 'Editor', 'Viewer'])
  }],
  timestamps: true
}
```

### Task
```javascript
{
  name: String,
  description: String,
  status: String (enum: ['To Do', 'In Progress', 'Done']),
  dueDate: Date,
  project: ObjectId (ref: 'Project'),
  parentTask: ObjectId (ref: 'Task'),
  order: Number,
  timestamps: true
}
```

## MongoDB Indexes

The following indexes are created for optimal query performance:

### Project Indexes
- `{ owner: 1 }` - For finding projects by owner
- `{ 'sharedWith.user': 1 }` - For finding projects shared with a user

### Task Indexes
- `{ project: 1 }` - For finding tasks by project
- `{ parentTask: 1 }` - For finding sub-tasks
- `{ status: 1 }` - For filtering by status
- `{ dueDate: 1 }` - For filtering by due date
- `{ project: 1, order: 1 }` - For maintaining task order within projects 