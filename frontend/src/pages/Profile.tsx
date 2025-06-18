import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import axios from 'axios'

interface ProfileFormData {
  name: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function Profile() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user, updateProfile } = useAuthStore()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  })

  const updateUserProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await axios.put('/api/auth/profile', {
        name: data.name,
        email: data.email,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      return response.data
    },
    onSuccess: (data) => {
      updateProfile({ name: data.name, email: data.email })
      setSuccess('Profile updated successfully')
      setError('')
      reset({
        name: data.name,
        email: data.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update profile')
      setSuccess('')
    },
  })

  const onSubmit = (data: ProfileFormData) => {
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    updateUserProfile.mutate(data)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update your account information and password
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  {...register('name', {
                    required: 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
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
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <div className="mt-1">
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
                  className="input"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900">
                Change Password
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Leave blank if you don't want to change your password
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Current Password
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      id="currentPassword"
                      {...register('currentPassword', {
                        validate: (value) =>
                          !value ||
                          value.length >= 6 ||
                          'Password must be at least 6 characters',
                      })}
                      className="input"
                    />
                    {errors.currentPassword && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.currentPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      id="newPassword"
                      {...register('newPassword', {
                        validate: (value) =>
                          !value ||
                          value.length >= 6 ||
                          'Password must be at least 6 characters',
                      })}
                      className="input"
                    />
                    {errors.newPassword && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.newPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm New Password
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      id="confirmPassword"
                      {...register('confirmPassword', {
                        validate: (value) =>
                          !value ||
                          value === watch('newPassword') ||
                          'Passwords do not match',
                      })}
                      className="input"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 