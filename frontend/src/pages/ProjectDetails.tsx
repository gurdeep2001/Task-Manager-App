import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import CreateTaskModal from '../components/CreateTaskModal'
import EditProjectModal from '../components/EditProjectModal'
import TaskList from '../components/TaskList'
import ShareProjectModal from '../components/ShareProjectModal'
import { useAuthStore } from '../stores/authStore'

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

interface Task {
  _id: string
  name: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
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
  comments: Array<{
    _id: string
    user: {
      _id: string
      name: string
    }
    content: string
    createdAt: string
  }>
}

interface User {
  _id: string
  name: string
  email: string
}

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem(`task-filters-${projectId}`)
    return savedFilters ? JSON.parse(savedFilters) : {
      status: '',
      priority: '',
      startDate: '',
      endDate: '',
      search: '',
      assigneeId: '',
      tags: '',
    }
  })
  const [filterInputs, setFilterInputs] = useState(filters)
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])

  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await axios.get(`/api/projects/${projectId}`)
      return response.data
    },
  })

  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const response = await axios.get(`/api/projects/${projectId}/tasks`)
      return response.data
    },
  })

  // Fetch users for assignee filter
  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get('/api/users')
      return response.data
    },
  })

  const deleteProject = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/projects/${projectId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate('/')
    },
  })

  const updateTaskStatus = useMutation({
    mutationFn: async ({
      taskId,
      status,
      order,
    }: {
      taskId: string
      status: Task['status']
      order: number
    }) => {
      await axios.patch(`/api/tasks/${taskId}`, { status, order })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })

  const { user } = useAuthStore()

  // Role-based permissions
  const canEditProject = project && (project.userRole === 'Owner' || project.userRole === 'Editor')
  const canDeleteProject = project && project.userRole === 'Owner'
  const canShareProject = project && project.userRole === 'Owner'
  const canCreateTasks = project && (project.userRole === 'Owner' || project.userRole === 'Editor')
  const canEditTasks = project && (project.userRole === 'Owner' || project.userRole === 'Editor')
  const canDeleteTasks = project && (project.userRole === 'Owner' || project.userRole === 'Editor')

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`task-filters-${projectId}`, JSON.stringify(filters))
    }
  }, [filters, projectId])

  useEffect(() => {
    const toDateString = (date: string | Date | undefined) => date ? new Date(date).toISOString().slice(0, 10) : null;
    setFilteredTasks(
      (tasks ?? []).filter((task) => {
        // Status filter
        if (filters.status && task.status !== filters.status) return false;
        
        // Priority filter
        if (filters.priority && task.priority !== filters.priority) return false;
        
        // Date range filter
        const taskDateStr = toDateString(task.dueDate);
        const startDateStr = filters.startDate;
        const endDateStr = filters.endDate;
        if (startDateStr && taskDateStr && taskDateStr < startDateStr) return false;
        if (endDateStr && taskDateStr && taskDateStr > endDateStr) return false;
        
        // Assignee filter
        if (filters.assigneeId && (!task.assignee || task.assignee._id !== filters.assigneeId)) return false;
        
        // Tags filter
        if (filters.tags) {
          const filterTags = filters.tags.toLowerCase().split(',').map(tag => tag.trim());
          const taskTags = task.tags.map(tag => tag.toLowerCase());
          const hasMatchingTag = filterTags.some(filterTag => 
            taskTags.some(taskTag => taskTag.includes(filterTag))
          );
          if (!hasMatchingTag) return false;
        }
        
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesName = task.name.toLowerCase().includes(searchLower);
          const matchesDescription = task.description.toLowerCase().includes(searchLower);
          if (!matchesName && !matchesDescription) return false;
        }
        
        return true;
      })
    );
  }, [filters, tasks]);

  // Debug log for filtering
  console.log('DEBUG filteredTasks:', filteredTasks, 'filters:', filters, 'tasks:', tasks);

  const handleTaskDrop = (taskId: string, newStatus: Task['status'], newOrder: number) => {
    updateTaskStatus.mutate({
      taskId,
      status: newStatus,
      order: newOrder,
    })
  }

  const normalizeStatus = (status: string) => {
    return status.toLowerCase().replace(' ', '_')
  }

  if (isLoadingProject || isLoadingTasks) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Project not found</h1>
        <p className="mt-2 text-gray-500">The project you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-gray-500">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-x-3">
          {canEditProject && (
            <button
              onClick={() => setIsEditProjectModalOpen(true)}
              className="btn btn-secondary"
            >
              <PencilIcon className="h-5 w-5" />
              Edit Project
            </button>
          )}
          {canDeleteProject && (
            <button
              onClick={() => deleteProject.mutate()}
              className="btn btn-danger"
            >
              <TrashIcon className="h-5 w-5" />
              Delete Project
            </button>
          )}
          {canCreateTasks && (
            <button
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5" />
              New Task
            </button>
          )}
          {canShareProject && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="btn btn-info"
            >
              Share Project
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Owner: {project.owner.name}</span>
        <span className="badge badge-secondary">Your Role: {project ? project.userRole : '-'}</span>
      </div>

      {/* Enhanced Filter Section */}
      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Tasks</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterInputs.status}
                onChange={e => setFilterInputs({ ...filterInputs, status: e.target.value })}
                className="input"
              >
                <option value="">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filterInputs.priority}
                onChange={e => setFilterInputs({ ...filterInputs, priority: e.target.value })}
                className="input"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select
                value={filterInputs.assigneeId}
                onChange={e => setFilterInputs({ ...filterInputs, assigneeId: e.target.value })}
                className="input"
              >
                <option value="">All Assignees</option>
                {users?.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filterInputs.startDate}
                onChange={e => setFilterInputs({ ...filterInputs, startDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filterInputs.endDate}
                onChange={e => setFilterInputs({ ...filterInputs, endDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                placeholder="Filter by tags..."
                value={filterInputs.tags}
                onChange={e => setFilterInputs({ ...filterInputs, tags: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search tasks..."
                value={filterInputs.search}
                onChange={e => setFilterInputs({ ...filterInputs, search: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterInputs({ status: '', priority: '', startDate: '', endDate: '', search: '', assigneeId: '', tags: '' })
                  setFilters({ status: '', priority: '', startDate: '', endDate: '', search: '', assigneeId: '', tags: '' })
                }}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setFilters(filterInputs)}
                className="btn btn-primary"
              >
                Apply Filter
              </button>
            </div>
            <span className="text-sm text-gray-500">
              {filteredTasks.length} of {tasks?.length || 0} tasks
            </span>
          </div>
        </div>
      </div>

      {/* Task Lists */}
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <TaskList
            title="To Do"
            tasks={filteredTasks.filter((task) => normalizeStatus(task.status) === 'to_do')}
            status="to_do"
            onDrop={handleTaskDrop}
            userRole={project ? project.userRole : undefined}
            projectId={projectId}
          />
          <TaskList
            title="In Progress"
            tasks={filteredTasks.filter((task) => normalizeStatus(task.status) === 'in_progress')}
            status="in_progress"
            onDrop={handleTaskDrop}
            userRole={project ? project.userRole : undefined}
            projectId={projectId}
          />
          <TaskList
            title="Completed"
            tasks={filteredTasks.filter((task) => normalizeStatus(task.status) === 'done')}
            status="done"
            onDrop={handleTaskDrop}
            userRole={project ? project.userRole : undefined}
            projectId={projectId}
          />
        </div>
      </DndProvider>

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectId={projectId!}
      />

      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        project={project}
      />

      <ShareProjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={projectId!}
      />
    </div>
  )
} 