import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

interface ShareProjectModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

interface User {
  _id: string
  name: string
  email: string
}

const roles = ['Owner', 'Editor', 'Viewer'] as const

type Role = typeof roles[number]

export default function ShareProjectModal({ isOpen, onClose, projectId }: ShareProjectModalProps) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role>('Viewer')
  const [error, setError] = useState('')

  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get('/api/users')
      return response.data
    },
    enabled: isOpen,
  })

  // Fetch current project sharing info
  const { data: projectData, refetch } = useQuery({
    queryKey: ['projectShare', projectId],
    queryFn: async () => {
      const response = await axios.get(`/api/projects/${projectId}`)
      return response.data
    },
    enabled: isOpen,
  })

  const sharedWith = projectData?.sharedWith || []

  // Filter out users who are already shared and the current user
  const availableUsers = users?.filter(userItem => {
    // Exclude current user
    if (userItem._id === user?.id) return false
    
    // Exclude users already shared with this project
    const isAlreadyShared = sharedWith.some((sw: any) => sw.user._id === userItem._id)
    return !isAlreadyShared
  }) || []

  const shareProject = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      await axios.post(`/api/projects/${projectId}/share`, { userId, role })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectShare', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      refetch()
      setSelectedUserId('')
      setSelectedRole('Viewer')
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to share project')
    },
  })

  const removeShare = useMutation({
    mutationFn: async (userId: string) => {
      await axios.delete(`/api/projects/${projectId}/share/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectShare', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      refetch()
    },
  })

  useEffect(() => {
    if (!isOpen) {
      setSelectedUserId('')
      setSelectedRole('Viewer')
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

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
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Share Project
                    </Dialog.Title>
                    <div className="mt-4">
                      <form
                        onSubmit={e => {
                          e.preventDefault()
                          if (!selectedUserId) {
                            setError('Please select a user')
                            return
                          }
                          shareProject.mutate({ userId: selectedUserId, role: selectedRole })
                        }}
                        className="flex flex-col gap-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700">User</label>
                          <select
                            className="input mt-1"
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(e.target.value)}
                          >
                            <option value="">Select a user</option>
                            {availableUsers.map(user => (
                              <option key={user._id} value={user._id}>
                                {user.name} ({user.email})
                              </option>
                            ))}
                          </select>
                          {availableUsers.length === 0 && (
                            <p className="mt-1 text-sm text-gray-500">
                              All users are already shared with this project or you are the only user.
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Role</label>
                          <select
                            className="input mt-1"
                            value={selectedRole}
                            onChange={e => setSelectedRole(e.target.value as Role)}
                          >
                            {roles.map(role => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>
                        {error && <div className="text-red-600 text-sm">{error}</div>}
                        <button
                          type="submit"
                          className="btn btn-primary mt-2"
                          disabled={shareProject.isPending || availableUsers.length === 0}
                        >
                          {shareProject.isPending ? 'Sharing...' : 'Share'}
                        </button>
                      </form>
                    </div>
                    <div className="mt-6">
                      <h4 className="text-md font-semibold mb-2">Shared With</h4>
                      <ul className="divide-y divide-gray-200">
                        {sharedWith?.length === 0 && <li className="text-gray-500 text-sm">No users shared yet.</li>}
                        {sharedWith?.map((sw: any) => (
                          <li key={sw.user._id} className="flex items-center justify-between py-2">
                            <span>
                              {sw.user.name} ({sw.user.email}) - <span className="font-medium">{sw.role}</span>
                            </span>
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => removeShare.mutate(sw.user._id)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
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