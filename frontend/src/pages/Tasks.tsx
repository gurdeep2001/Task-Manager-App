import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import axios from 'axios'

interface Task {
  _id: string
  name: string
  description: string
  status: 'To Do' | 'In Progress' | 'Done'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  dueDate: string
  assignee?: {
    _id: string
    name: string
    email: string
  }
  project: {
    _id: string
    name: string
  }
  tags: string[]
  estimatedHours?: number
  actualHours?: number
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
      case 'Done':
        return 'badge-success'
      case 'In Progress':
        return 'badge-warning'
      case 'To Do':
      default:
        return 'badge-secondary'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'badge-error'
      case 'High':
        return 'badge-warning'
      case 'Medium':
        return 'badge-info'
      case 'Low':
      default:
        return 'badge-success'
    }
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {task.name}
                    </h3>
                    <span className={`badge ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <span className={`badge ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-500 mb-3">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
                    <Link
                      to={`/projects/${task.project._id}`}
                      className="text-primary-600 hover:text-primary-500 font-medium"
                    >
                      {task.project.name}
                    </Link>
                    
                    {task.assignee && (
                      <span className="flex items-center gap-1">
                        <span className="text-gray-400">Assigned to:</span>
                        <span className="font-medium">{task.assignee.name}</span>
                      </span>
                    )}
                    
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <span className="text-gray-400">Due:</span>
                        <span className="font-medium">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </span>
                    )}
                  </div>
                  
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {task.tags.map((tag, index) => (
                        <span key={index} className="badge badge-outline badge-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {(task.estimatedHours || task.actualHours) && (
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {task.estimatedHours && (
                        <span>Est: {task.estimatedHours}h</span>
                      )}
                      {task.actualHours && (
                        <span>Actual: {task.actualHours}h</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 