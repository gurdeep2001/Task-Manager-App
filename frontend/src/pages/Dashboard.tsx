import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import CreateProjectModal from '../components/CreateProjectModal'

// Ensure axios has the correct base URL
axios.defaults.baseURL = 'http://localhost:3000'

interface Project {
  _id: string
  name: string
  description: string
  taskCount: number
  completedTaskCount: number
}

interface Task {
  _id: string
  name: string
  status: 'todo' | 'in_progress' | 'completed'
  dueDate: string
  project: {
    _id: string
    name: string
  }
}

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get('/api/projects')
      return response.data
    },
  })

  const { data: recentTasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['recentTasks'],
    queryFn: async () => {
      const response = await axios.get('/api/tasks/recent')
      return response.data
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Projects Overview */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Projects</h2>
            <Link
              to="/projects"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>

          {isLoadingProjects ? (
            <div className="mt-4 text-center text-gray-500">Loading...</div>
          ) : projects?.length === 0 ? (
            <div className="mt-4 text-center text-gray-500">
              No projects yet. Create your first project!
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-gray-200">
              {projects?.map((project) => (
                <li key={project._id} className="py-4">
                  <Link
                    to={`/projects/${project._id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {project.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {project.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          {project.completedTaskCount} / {project.taskCount} tasks
                        </p>
                        <div className="mt-1 h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-primary-600"
                            style={{
                              width: `${
                                (project.completedTaskCount / project.taskCount) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Tasks</h2>
            <Link
              to="/tasks"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>

          {isLoadingTasks ? (
            <div className="mt-4 text-center text-gray-500">Loading...</div>
          ) : recentTasks?.length === 0 ? (
            <div className="mt-4 text-center text-gray-500">
              No tasks yet. Create a project to add tasks!
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-gray-200">
              {recentTasks?.map((task) => (
                <li key={task._id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.name}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {task.project.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`badge ${
                          task.status === 'completed'
                            ? 'badge-success'
                            : task.status === 'in_progress'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.dueDate && (
                        <span className="text-sm text-gray-500">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
} 