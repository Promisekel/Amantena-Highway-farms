import React, { useState, useEffect } from 'react';
import { projectsAPI as projectsApi } from '../utils/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  RectangleStackIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    dueDate: ''
  });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
    assignedTo: ''
  });

  const taskStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  const statusColors = {
    TODO: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    REVIEW: 'bg-yellow-100 text-yellow-800',
    DONE: 'bg-green-100 text-green-800'
  };

  const priorityColors = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectTasks(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.getProjects();
      setProjects(response.data || []);
      if (response.data && response.data.length > 0 && !selectedProject) {
        setSelectedProject(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTasks = async (projectId) => {
    try {
      const response = await projectsApi.getProjectTasks(projectId);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await projectsApi.updateProject(editingProject.id, projectForm);
      } else {
        const response = await projectsApi.createProject(projectForm);
        if (!selectedProject) {
          setSelectedProject(response.data);
        }
      }
      setShowProjectModal(false);
      setEditingProject(null);
      setProjectForm({ name: '', description: '', status: 'PLANNING', dueDate: '' });
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    
    try {
      if (editingTask) {
        await projectsApi.updateTask(editingTask.id, taskForm);
      } else {
        await projectsApi.createTask(selectedProject.id, taskForm);
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: '',
        assignedTo: ''
      });
      fetchProjectTasks(selectedProject.id);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all its tasks.')) {
      return;
    }
    
    try {
      await projectsApi.deleteProject(projectId);
      setProjects(prev => prev.filter(project => project.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(projects.find(project => project.id !== projectId) || null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      await projectsApi.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await projectsApi.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'HIGH':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'MEDIUM':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => {
            setEditingProject(null);
            setProjectForm({ name: '', description: '', status: 'PLANNING', dueDate: '' });
            setShowProjectModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Projects Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Projects</h3>
            </div>
            <div className="p-6">
              {projects.length > 0 ? (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${
                        selectedProject?.id === project.id
                          ? 'bg-green-100 border border-green-300'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.status}</p>
                        {project.dueDate && (
                          <p className="text-xs text-gray-500">
                            Due: {new Date(project.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                            setProjectForm({
                              name: project.name,
                              description: project.description || '',
                              status: project.status,
                              dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : ''
                            });
                            setShowProjectModal(true);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No projects yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="lg:col-span-3">
          {selectedProject ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedProject.name}</h3>
                  <p className="text-sm text-gray-500">{selectedProject.description}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setTaskForm({
                      title: '',
                      description: '',
                      status: 'TODO',
                      priority: 'MEDIUM',
                      dueDate: '',
                      assignedTo: ''
                    });
                    setShowTaskModal(true);
                  }}
                  className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Task
                </button>
              </div>
              
              {/* Kanban Columns */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {taskStatuses.map((status) => (
                    <div key={status} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">
                          {status.replace('_', ' ')}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {getTasksByStatus(status).length}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {getTasksByStatus(status).map((task) => (
                          <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="text-sm font-medium text-gray-900">{task.title}</h5>
                              <div className="flex items-center space-x-1">
                                {getPriorityIcon(task.priority)}
                                <div className="relative">
                                  <button className="text-gray-400 hover:text-gray-600">
                                    <EllipsisVerticalIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {task.description && (
                              <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
                                  {task.priority}
                                </span>
                                {task.dueDate && (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    setEditingTask(task);
                                    setTaskForm({
                                      title: task.title,
                                      description: task.description || '',
                                      status: task.status,
                                      priority: task.priority,
                                      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                                      assignedTo: task.assignedTo || ''
                                    });
                                    setShowTaskModal(true);
                                  }}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <PencilIcon className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Status Change Buttons */}
                            <div className="mt-2 flex space-x-1">
                              {taskStatuses.filter(s => s !== status).map((newStatus) => (
                                <button
                                  key={newStatus}
                                  onClick={() => handleTaskStatusChange(task.id, newStatus)}
                                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                >
                                  → {newStatus.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="text-center py-12">
                <RectangleStackIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No project selected</h3>
                <p className="mt-1 text-sm text-gray-500">Select a project to view its tasks.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h3>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="projectDescription"
                    rows={3}
                    value={projectForm.description}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="projectStatus" className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      id="projectStatus"
                      value={projectForm.status}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="PLANNING">Planning</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ON_HOLD">On Hold</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="projectDueDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="projectDueDate"
                      value={projectForm.dueDate}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h3>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    id="taskTitle"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="taskDescription"
                    rows={3}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      id="taskStatus"
                      value={taskForm.status}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {taskStatuses.map(status => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="taskPriority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      id="taskPriority"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="taskDueDate"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
