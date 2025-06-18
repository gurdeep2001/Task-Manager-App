import { useState } from 'react'
import { useDrag } from 'react-dnd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import axios from 'axios'
import EditTaskModal from './EditTaskModal'
import { useAuthStore } from '../stores/authStore'
import { format, isAfter, isBefore, startOfDay } from 'date-fns'

interface Task {
  _id: string
  name: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  dueDate: string
  order: number
  parentTask: string | null
  subTasks: Task[]
}

interface TaskCardProps {
  task: Task
  userRole?: string
  projectId?: string
}

// Status color indicators
const getStatusColor = (status: Task['status'], dueDate?: string) => {
  if (status === 'completed') return 'bg-green-100 text-green-800'
  if (status === 'in_progress') return 'bg-blue-100 text-blue-800'
  
  // Check if task is overdue
  if (dueDate && isBefore(new Date(dueDate), startOfDay(new Date()))) {
    return 'bg-red-100 text-red-800'
  }
  
  return 'bg-gray-100 text-gray-800'
}

const getStatusText = (status: Task['status']) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default function TaskCard({ task, userRole, projectId }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const queryClient = useQueryClient()

  // Role-based permissions for tasks
  const canEditTask = userRole === 'Owner' || userRole === 'Editor'
  const canDeleteTask = userRole === 'Owner' || userRole === 'Editor'

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task._id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  const deleteTask = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/tasks/${task._id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const updateStatus = useMutation({
    mutationFn: async (newStatus: Task['status']) => {
      if (!projectId) throw new Error('projectId is required to update task status');
      await axios.patch(`/api/projects/${projectId}/tasks/${task._id}`, { status: newStatus })
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }
    },
  })

  return (
    <>
      <div
        ref={drag}
        className={`card cursor-move ${
          isDragging ? 'opacity-50' : ''
        } ${task.parentTask ? 'ml-6' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-x-2">
              <h3 className="text-sm font-medium text-gray-900">{task.name}</h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status, task.dueDate)}`}>
                {getStatusText(task.status)}
              </span>
              {task.subTasks.length > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  {isExpanded ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            {isExpanded && (
              <p className="mt-1 text-sm text-gray-500">{task.description}</p>
            )}
            {task.dueDate && (
              <p className={`mt-1 text-xs ${
                isBefore(new Date(task.dueDate), startOfDay(new Date()))
                  ? (task.status === 'Done' ? 'text-green-600 font-medium' : 'text-red-600 font-medium')
                  : 'text-gray-500'
              }`}>
                Due {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                {isBefore(new Date(task.dueDate), startOfDay(new Date())) && (task.status === 'Done' ? ' (Completed Late)' : ' (Overdue)')}
              </p>
            )}
          </div>
          <div className="ml-4 flex items-center gap-x-2">
            {canEditTask && (
              <select
                value={task.status}
                onChange={e => updateStatus.mutate(e.target.value as Task['status'])}
                className="rounded border-gray-300 text-xs px-2 py-1 mr-2"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Completed</option>
              </select>
            )}
            {canEditTask && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-gray-400 hover:text-gray-500"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {canDeleteTask && (
              <button
                onClick={() => deleteTask.mutate()}
                className="text-gray-400 hover:text-red-500"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {isExpanded && task.subTasks.length > 0 && (
          <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
            {task.subTasks.map((subTask) => (
              <TaskCard key={subTask._id} task={subTask} />
            ))}
          </div>
        )}
      </div>

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
      />
    </>
  )
} 