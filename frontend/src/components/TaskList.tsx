import { useDrop } from 'react-dnd'
import TaskCard from './TaskCard'

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

interface TaskListProps {
  title: string
  tasks: Task[]
  status: Task['status']
  onDrop: (taskId: string, status: Task['status'], order: number) => void
  userRole?: string
  projectId?: string
}

export default function TaskList({ title, tasks, status, onDrop, userRole, projectId }: TaskListProps) {
  console.log('TaskList tasks:', tasks, 'title:', title, 'status:', status);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'task',
    drop: (item: { id: string }) => {
      onDrop(item.id, status, tasks.length)
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))

  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order)

  return (
    <div
      ref={drop}
      className={`rounded-lg bg-gray-50 p-4 ${
        isOver ? 'ring-2 ring-primary-500' : ''
      }`}
    >
      <h2 className="mb-4 text-lg font-medium text-gray-900">{title}</h2>
      <div className="space-y-4">
        {sortedTasks.map((task) => (
          <TaskCard key={task._id} task={task} userRole={userRole} projectId={projectId} />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
            No tasks
          </div>
        )}
      </div>
    </div>
  )
} 