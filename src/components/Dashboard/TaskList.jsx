import { useState, useEffect, useMemo } from 'react'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Plus, CheckCircle, Circle, Trash2, Calendar, Loader2, Sparkles, FileText } from 'lucide-react'
import { useToast } from '../Shared/Toast'
import './TaskList.css'

const TASK_CATEGORIES = [
  { id: 'baking', label: 'Baking', color: '#C8913A' },
  { id: 'shopping', label: 'Shopping', color: '#7D9B76' },
  { id: 'prepping', label: 'Prepping', color: '#D4847C' },
  { id: 'fondant', label: 'Fondant', color: '#8B5A6E' },
  { id: 'fillings', label: 'Fillings', color: '#6B8E9B' },
  { id: 'frosting', label: 'Frosting', color: '#9B8E6B' },
  { id: 'dough', label: 'Dough', color: '#A67C52' },
  { id: 'decorating', label: 'Decorating', color: '#8E6BC4' },
  { id: 'delivery', label: 'Delivery', color: '#5C3D2E' },
  { id: 'other', label: 'Other', color: '#8B7B72' }
]

const EMPTY_TASK = { category: 'baking', description: '', due_date: '' }

export default function TaskList() {
  const { getTasks, createTask, updateTask, completeTask, deleteTask, getOrders, generateTasksFromOrders } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  
  const [tasks, setTasks] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTask, setNewTask] = useState(EMPTY_TASK)
  const [filter, setFilter] = useState('all') // all, pending, completed
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Calculate week range
  const weekRange = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    
    return {
      from: startOfWeek.toISOString().split('T')[0],
      to: endOfWeek.toISOString().split('T')[0],
      label: `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [configured])

  const loadData = async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    
    try {
      const [tasksData, ordersData] = await Promise.all([
        getTasks({ from: weekRange.from, to: weekRange.to }),
        getOrders()
      ])
      setTasks(tasksData)
      setOrders(ordersData.filter(o => !o.is_archived))
    } catch (err) {
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateTasks = async () => {
    setGenerating(true)
    try {
      // Get upcoming orders for this week
      const upcomingOrders = orders.filter(o => {
        const eventDate = new Date(o.event_date || o.pickup_date)
        return eventDate >= new Date(weekRange.from) && eventDate <= new Date(weekRange.to)
      })
      
      const count = await generateTasksFromOrders(upcomingOrders, weekRange.from)
      toast.success(`Generated ${count} tasks from your orders`)
      await loadData()
    } catch (err) {
      toast.error('Failed to generate tasks')
    } finally {
      setGenerating(false)
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTask.description.trim()) {
      toast.error('Task description is required')
      return
    }
    
    try {
      const task = await createTask({
        ...newTask,
        due_date: newTask.due_date || new Date().toISOString().split('T')[0]
      })
      setTasks(prev => [...prev, task])
      setNewTask(EMPTY_TASK)
      setShowAddModal(false)
      toast.success('Task added')
    } catch {
      toast.error('Failed to add task')
    }
  }

  const handleComplete = async (taskId, isCompleted) => {
    try {
      await completeTask(taskId, !isCompleted)
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, is_completed: !isCompleted, completed_at: !isCompleted ? new Date().toISOString() : null } : t
      ))
    } catch {
      toast.error('Failed to update task')
    }
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await deleteTask(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const statusMatch = filter === 'all' || 
        (filter === 'pending' && !task.is_completed) || 
        (filter === 'completed' && task.is_completed)
      const categoryMatch = categoryFilter === 'all' || task.category === categoryFilter
      return statusMatch && categoryMatch
    }).sort((a, b) => {
      // Sort by completion status, then by due date
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1
      return new Date(a.due_date) - new Date(b.due_date)
    })
  }, [tasks, filter, categoryFilter])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.is_completed).length
    const pending = total - completed
    return { total, completed, pending }
  }, [tasks])

  if (loading) {
    return (
      <div className="task-list-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <div className="task-list-header-left">
          <h1>Task List</h1>
          <p>Weekly tasks for {weekRange.label}</p>
        </div>
        <div className="task-list-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleGenerateTasks} disabled={generating}>
            {generating ? <Loader2 size={14} className="spinner" /> : <Sparkles size={14} />}
            Auto-Generate from Orders
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      <div className="task-stats">
        <div className="task-stat">
          <span className="task-stat-number">{stats.pending}</span>
          <span className="task-stat-label">Pending</span>
        </div>
        <div className="task-stat completed">
          <span className="task-stat-number">{stats.completed}</span>
          <span className="task-stat-label">Completed</span>
        </div>
        <div className="task-stat total">
          <span className="task-stat-number">{stats.total}</span>
          <span className="task-stat-label">Total</span>
        </div>
      </div>

      <div className="task-filters">
        <div className="task-filter-group">
          <button className={`task-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`task-filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
          <button className={`task-filter-btn ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed</button>
        </div>
        <select className="form-select task-category-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {TASK_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-emoji">✅</div>
            <h3>No tasks for this week</h3>
            <p>Generate tasks from your orders or add tasks manually.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Add Your First Task
            </button>
          </div>
        ) : (
          <div className="task-items">
            {filteredTasks.map(task => {
              const category = TASK_CATEGORIES.find(c => c.id === task.category) || TASK_CATEGORIES[9]
              return (
                <div key={task.id} className={`task-item ${task.is_completed ? 'completed' : ''}`}>
                  <button 
                    className="task-complete-btn" 
                    onClick={() => handleComplete(task.id, task.is_completed)}
                    style={{ color: task.is_completed ? category.color : 'var(--text-light)' }}
                  >
                    {task.is_completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </button>
                  
                  <div className="task-content">
                    <div className="task-description">{task.description}</div>
                    <div className="task-meta">
                      <span className="task-category-badge" style={{ background: category.color + '20', color: category.color }}>
                        {category.label}
                      </span>
                      <span className="task-date">
                        <Calendar size={12} />
                        {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {task.order_id && (
                        <span className="task-linked">
                          <FileText size={12} />
                          Linked to order
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button className="task-delete-btn" onClick={() => handleDelete(task.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Task</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddTask} className="task-form">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}>
                  {TASK_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input 
                  className="form-input" 
                  value={newTask.description} 
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="e.g., Make fondant flowers for wedding cake"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input 
                  className="form-input" 
                  type="date"
                  value={newTask.due_date} 
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
