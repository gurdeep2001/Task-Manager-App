import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
  dueDate: string
  parentTask?: string
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  parentTaskId,
}: CreateTaskModalProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormData>({
    defaultValues: {
      parentTask: parentTaskId,
    },
  })

  const createTask = useMutation({
    mutationFn: async (data: CreateTaskFormData) => {
      const response = await axios.post(`/api/projects/${projectId}/tasks`, data)
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
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      Create New Task
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
                                  message:
                                    'Task name must be at least 3 characters',
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
                              {...register('description', {
                                required: 'Description is required',
                              })}
                              className="input"
                            />
                            {errors.description && (
                              <p className="mt-2 text-sm text-red-600">
                                {errors.description.message}
                              </p>
                            )}
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

                        {parentTaskId && (
                          <input
                            type="hidden"
                            {...register('parentTask')}
                            value={parentTaskId}
                          />
                        )}
                      </div>

                      <div className="mt-6 flex justify-end gap-x-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn btn-primary"
                        >
                          {isSubmitting ? 'Creating...' : 'Create Task'}
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