import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  parentTaskId?: string
}

interface CreateTaskFormData {
  name: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  dueDate: string
  assigneeId: string
  parentTask?: string
  tags: string
  estimatedHours: string
}

interface User {
  _id: string
  name: string
  email: string
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  parentTaskId,
}: CreateTaskModalProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  // Fetch users for assignee selection
  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get('/api/users')
      return response.data
    },
    enabled: isOpen,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormData>({
    defaultValues: {
      priority: 'Medium',
      parentTask: parentTaskId,
      tags: '',
      estimatedHours: '',
    },
  })

  const createTask = useMutation({
    mutationFn: async (data: CreateTaskFormData) => {
      const taskData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
        assigneeId: data.assigneeId || undefined,
      }
      const response = await axios.post(`/api/projects/${projectId}/tasks`, taskData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create task')
    },
  })

  const onSubmit = (data: CreateTaskFormData) => {
    createTask.mutate(data)
  }

  const handleClose = () => {
    reset()
    setError('')
    onClose()
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Create New Task
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                              })}
                              className="input"
                              placeholder="Enter task name"
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
                              placeholder="Enter task description"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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

                          <div>
                            <label
                              htmlFor="assigneeId"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Assignee
                            </label>
                            <div className="mt-1">
                              <select
                                id="assigneeId"
                                {...register('assigneeId')}
                                className="input"
                              >
                                <option value="">Unassigned</option>
                                {users?.map((user) => (
                                  <option key={user._id} value={user._id}>
                                    {user.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="tags"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Tags
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              id="tags"
                              {...register('tags')}
                              className="input"
                              placeholder="Enter tags separated by commas"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Separate multiple tags with commas (e.g., bug, frontend, urgent)
                            </p>
                          </div>
                        </div>

                        {parentTaskId && (
                          <input
                            type="hidden"
                            {...register('parentTask')}
                            value={parentTaskId}
                          />
                        )}

                        {error && (
                          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                            {error}
                          </div>
                        )}

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary w-full sm:ml-3 sm:w-auto"
                          >
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                          </button>
                          <button
                            type="button"
                            onClick={handleClose}
                            className="btn btn-secondary mt-3 w-full sm:mt-0 sm:w-auto"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
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