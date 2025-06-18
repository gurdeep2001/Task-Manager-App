import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import axios from 'axios'

interface Task {
  _id: string
  name: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  dueDate: string
  project: {
    _id: string
    name: string
  }
  createdAt: string
}

export default function Tasks() {
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['allTasks'],
    queryFn: async () => {
      const response = await axios.get('/api/tasks')
      return response.data
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success'
      case 'in_progress':
        return 'badge-warning'
      default:
        return 'badge-danger'
    }
  }

  const getStatusText = (status: string) => {
    return status.replace('_', ' ')
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">All Tasks</h1>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : tasks?.length === 0 ? (
        <div className="text-center text-gray-500">
          <p className="text-lg">No tasks yet.</p>
          <p className="mt-2">
            Create a project and add some tasks to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks?.map((task) => (
            <div key={task._id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {task.name}
                  </h3>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <Link
                      to={`/projects/${task.project._id}`}
                      className="text-primary-600 hover:text-primary-500"
                    >
                      {task.project.name}
                    </Link>
                    {task.dueDate && (
                      <span>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`badge ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 