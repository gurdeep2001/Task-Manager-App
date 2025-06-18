import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

interface Task {
  _id: string
  name: string
  description: string
  status: 'To Do' | 'In Progress' | 'Done'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  dueDate: string
  order: number
  parentTask: string | null
  subTasks: Task[]
  assignee?: {
    _id: string
    name: string
    email: string
  }
  tags: string[]
  estimatedHours?: number
  actualHours?: number
}

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task
  projectId?: string
}

interface EditTaskFormData {
  name: string
  description: string
  status: Task['status']
  priority: Task['priority']
  dueDate: string
  assigneeId: string
  tags: string
  estimatedHours: string
  actualHours: string
}

export default function EditTaskModal({
  isOpen,
  onClose,
  task,
  projectId,
}: EditTaskModalProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditTaskFormData>({
    defaultValues: {
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assigneeId: task.assignee?._id || '',
      tags: task.tags?.join(', ') || '',
      estimatedHours: task.estimatedHours?.toString() || '',
      actualHours: task.actualHours?.toString() || '',
    },
  })

  const updateTask = useMutation({
    mutationFn: async (data: EditTaskFormData) => {
      const taskData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
        actualHours: data.actualHours ? parseFloat(data.actualHours) : undefined,
        assigneeId: data.assigneeId || undefined,
      }
      
      if (projectId) {
        const response = await axios.patch(`/api/projects/${projectId}/tasks/${task._id}`, taskData)
        return response.data
      } else {
        const response = await axios.patch(`/api/tasks/${task._id}`, taskData)
        return response.data
      }
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }
      onClose()
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update task')
    },
  })

  const onSubmit = (data: EditTaskFormData) => {
    updateTask.mutate(data)
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      Edit Task
                    </Dialog.Title>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
                      {error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4">
                          <div className="text-sm text-red-700">{error}</div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Task Name
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              id="name"
                              {...register('name', {
                                required: 'Task name is required',
                                minLength: {
                                  value: 3,
                                  message: 'Task name must be at least 3 characters',
                                },
                              })}
                              className="input"
                            />
                            {errors.name && (
                              <p className="mt-2 text-sm text-red-600">
                                {errors.name.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Description
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="description"
                              rows={3}
                              {...register('description')}
                              className="input"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="status"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Status
                            </label>
                            <div className="mt-1">
                              <select
                                id="status"
                                {...register('status', {
                                  required: 'Status is required',
                                })}
                                className="input"
                              >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                              </select>
                              {errors.status && (
                                <p className="mt-2 text-sm text-red-600">
                                  {errors.status.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="priority"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Priority
                            </label>
                            <div className="mt-1">
                              <select
                                id="priority"
                                {...register('priority')}
                                className="input"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="dueDate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Due Date
                          </label>
                          <div className="mt-1">
                            <input
                              type="date"
                              id="dueDate"
                              {...register('dueDate')}
                              className="input"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="tags"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Tags (comma-separated)
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              id="tags"
                              {...register('tags')}
                              className="input"
                              placeholder="bug, frontend, urgent"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="estimatedHours"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Estimated Hours
                            </label>
                            <div className="mt-1">
                              <input
                                type="number"
                                id="estimatedHours"
                                step="0.5"
                                min="0"
                                {...register('estimatedHours')}
                                className="input"
                                placeholder="8"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="actualHours"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Actual Hours
                            </label>
                            <div className="mt-1">
                              <input
                                type="number"
                                id="actualHours"
                                step="0.5"
                                min="0"
                                {...register('actualHours')}
                                className="input"
                                placeholder="6"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Updating...' : 'Update Task'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 