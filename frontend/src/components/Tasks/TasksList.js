import React, { useEffect, useState } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid,
} from '@mui/material';
import { Add, Edit, Delete, CheckCircle } from '@mui/icons-material';
import { tasksAPI } from '../../services/api';
import { toast } from 'react-toastify';

const TasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', dueDate: '', priority: 'Medium', status: 'Pending', category: 'Other'
  });

  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const statuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
  const categories = ['Call', 'Email', 'Meeting', 'Follow-up', 'Other'];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data.data);
    } catch (error) {
      toast.error('Failed to load tasks');
    }
  };

  const handleOpenDialog = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData(task);
    } else {
      setEditingTask(null);
      setFormData({ title: '', description: '', dueDate: '', priority: 'Medium', status: 'Pending', category: 'Other' });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingTask) {
        await tasksAPI.update(editingTask.id, formData);
        toast.success('Task updated');
      } else {
        await tasksAPI.create(formData);
        toast.success('Task created');
      }
      setOpenDialog(false);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to save task');
    }
  };

  const handleComplete = async (task) => {
    try {
      await tasksAPI.update(task.id, { ...task, status: 'Completed' });
      toast.success('Task completed');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this task?')) {
      try {
        await tasksAPI.delete(id);
        toast.success('Task deleted');
        fetchTasks();
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const getPriorityColor = (priority) => {
    const colors = { 'Low': 'default', 'Medium': 'info', 'High': 'warning', 'Urgent': 'error' };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = { 'Pending': 'default', 'In Progress': 'primary', 'Completed': 'success', 'Cancelled': 'error' };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Tasks</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>Add Task</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.title}</TableCell>
                <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell><Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" /></TableCell>
                <TableCell><Chip label={task.status} color={getStatusColor(task.status)} size="small" /></TableCell>
                <TableCell>{task.category}</TableCell>
                <TableCell>{task.assignedToFirstName} {task.assignedToLastName}</TableCell>
                <TableCell align="right">
                  {task.status !== 'Completed' && (
                    <IconButton onClick={() => handleComplete(task)}><CheckCircle color="success" /></IconButton>
                  )}
                  <IconButton onClick={() => handleOpenDialog(task)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(task.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingTask ? 'Edit Task' : 'Add Task'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Due Date" type="datetime-local" InputLabelProps={{ shrink: true }} value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Priority" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                {priorities.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editingTask ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TasksList;
