import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import CreateProjectModal from '../components/CreateProjectModal'

interface Project {
  _id: string
  name: string
  description: string
  owner: {
    _id: string
    name: string
    email: string
  }
  userRole: string
  createdAt: string
  updatedAt: string
}

export default function Projects() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get('/api/projects')
      return response.data
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5" />
          New Project
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : projects?.length === 0 ? (
        <div className="text-center text-gray-500">
          <p className="text-lg">No projects yet.</p>
          <p className="mt-2">Create your first project to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <div key={project._id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    <Link
                      to={`/projects/${project._id}`}
                      className="hover:text-primary-600"
                    >
                      {project.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {project.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>Owner: {project.owner.name}</span>
                    <span className="badge badge-secondary">{project.userRole}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
} 