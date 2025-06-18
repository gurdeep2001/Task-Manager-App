import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface User {
  _id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

interface ViewUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
}

export default function ViewUserModal({ isOpen, onClose, user }: ViewUserModalProps) {
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
                      User Details
                    </Dialog.Title>
                    <div className="mt-4">
                      <div className="space-y-4">
                        {/* User Avatar */}
                        <div className="flex justify-center sm:justify-start">
                          <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary-800">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* User Information */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <p className="mt-1 text-sm text-gray-900">{user.name}</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">User ID</label>
                            <p className="mt-1 text-sm text-gray-500 font-mono">{user._id}</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Created</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {new Date(user.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {new Date(user.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Account Status */}
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-2 w-2 rounded-full bg-green-400"></div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Active Account</p>
                              <p className="text-sm text-gray-500">User account is active and can access the system</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="button"
                          onClick={onClose}
                          className="btn btn-primary w-full sm:ml-3 sm:w-auto"
                        >
                          Close
                        </button>
                      </div>
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