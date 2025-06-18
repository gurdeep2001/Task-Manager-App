import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

interface User {
  _id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
}

interface EditUserFormData {
  name: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormData>({
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  })

  const updateUser = useMutation({
    mutationFn: async (data: EditUserFormData) => {
      const updateData: any = {
        name: data.name,
        email: data.email,
      }

      if (data.currentPassword && data.newPassword) {
        updateData.currentPassword = data.currentPassword
        updateData.newPassword = data.newPassword
      }

      const response = await axios.put(`/api/users/${user._id}`, updateData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      reset()
      onClose()
      setError('')
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update user')
    },
  })

  const onSubmit = (data: EditUserFormData) => {
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    updateUser.mutate(data)
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
                      Edit User
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            {...register('name', { required: 'Name is required' })}
                            className="input mt-1"
                            placeholder="Enter user's full name"
                          />
                          {errors.name && (
                            <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            {...register('email', {
                              required: 'Email is required',
                              pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address',
                              },
                            })}
                            className="input mt-1"
                            placeholder="Enter user's email"
                          />
                          {errors.email && (
                            <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                          )}
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Change Password (Optional)</h4>
                          
                          <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                              Current Password
                            </label>
                            <input
                              type="password"
                              id="currentPassword"
                              {...register('currentPassword')}
                              className="input mt-1"
                              placeholder="Enter current password"
                            />
                          </div>

                          <div className="mt-3">
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                              New Password
                            </label>
                            <input
                              type="password"
                              id="newPassword"
                              {...register('newPassword', {
                                minLength: {
                                  value: 6,
                                  message: 'Password must be at least 6 characters',
                                },
                              })}
                              className="input mt-1"
                              placeholder="Enter new password"
                            />
                            {errors.newPassword && (
                              <p className="mt-2 text-sm text-red-600">{errors.newPassword.message}</p>
                            )}
                          </div>

                          <div className="mt-3">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              id="confirmPassword"
                              {...register('confirmPassword', {
                                validate: (value) => {
                                  const newPassword = watch('newPassword')
                                  if (newPassword && value !== newPassword) {
                                    return 'Passwords do not match'
                                  }
                                  return true
                                },
                              })}
                              className="input mt-1"
                              placeholder="Confirm new password"
                            />
                            {errors.confirmPassword && (
                              <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                          </div>
                        </div>

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
                            {isSubmitting ? 'Updating...' : 'Update User'}
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