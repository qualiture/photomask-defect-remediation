import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Checkbox,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import { AddOutlined } from '@mui/icons-material';

interface RemediationTask {
  ID?: string;
  taskNumber?: number;
  taskName: string;
  description?: string;
  status: 'Pending' | 'In-Progress' | 'Completed';
  assignedTo?: string;
  completedDate?: string;
  notes?: string;
}

interface RemediationTasksProps {
  orderID: string;
  tasks?: RemediationTask[];
  isLoading?: boolean;
  onTasksUpdated?: () => void;
}

/**
 * Remediation Tasks Component
 * Manages sub-tasks for a remediation order
 */
export const RemediationTasks: React.FC<RemediationTasksProps> = ({
  orderID,
  tasks = [],
  isLoading = false,
  onTasksUpdated,
}) => {
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editTaskNotes, setEditTaskNotes] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'default';
      case 'In-Progress':
        return 'warning';
      case 'Completed':
        return 'success';
      default:
        return 'default';
    }
  };

  // Calculate progress
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const handleAddTask = async () => {
    if (!newTaskName.trim()) return;

    // TODO: Call API to create task
    console.log('Adding task:', { orderID, taskName: newTaskName, description: newTaskDescription });

    setNewTaskDialogOpen(false);
    setNewTaskName('');
    setNewTaskDescription('');
    onTasksUpdated?.();
  };

  const handleCompleteTask = async (taskId: string) => {
    // TODO: Call API to update task status
    console.log('Completing task:', taskId);
    onTasksUpdated?.();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Remediation Tasks"
        subheader={`${completedCount} of ${tasks.length} completed`}
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddOutlined />}
            onClick={() => setNewTaskDialogOpen(true)}
          >
            Add Task
          </Button>
        }
      />
      <CardContent>
        {tasks.length > 0 && (
          <>
            {/* Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Overall Progress
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {Math.round(progressPercentage)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#E0E0E0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: progressPercentage === 100 ? '#4CAF50' : '#2196F3',
                  },
                }}
              />
            </Box>

            {/* Tasks Table */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                    <TableCell sx={{ fontWeight: 600, width: 40 }}></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Task</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 100 }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 80 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task, idx) => (
                    <TableRow key={task.ID || idx} hover>
                      <TableCell>
                        <Checkbox
                          checked={task.status === 'Completed'}
                          onChange={() => handleCompleteTask(task.ID || '')}
                          disabled={task.status === 'Completed'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
                            color: task.status === 'Completed' ? '#BDBDBD' : 'inherit',
                          }}
                        >
                          {task.taskNumber ? `T${task.taskNumber}. ` : ''} {task.taskName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="textSecondary">
                          {task.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={task.status} color={getStatusColor(task.status)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{task.assignedTo || 'Unassigned'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => {
                            setSelectedTaskId(task.ID || null);
                            setEditTaskNotes(task.notes || '');
                          }}
                        >
                          Notes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {tasks.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary" sx={{ mb: 2 }}>
              No tasks created yet
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddOutlined />}
              onClick={() => setNewTaskDialogOpen(true)}
            >
              Create First Task
            </Button>
          </Box>
        )}
      </CardContent>

      {/* Add Task Dialog */}
      <Dialog open={newTaskDialogOpen} onClose={() => setNewTaskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Remediation Task</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Task Name"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="e.g., Replace defective component"
              autoFocus
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description (Optional)"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Detailed description of the task..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNewTaskDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddTask}
            variant="contained"
            disabled={!newTaskName.trim()}
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Notes Dialog */}
      <Dialog
        open={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Task Notes</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Notes"
            value={editTaskNotes}
            onChange={(e) => setEditTaskNotes(e.target.value)}
            placeholder="Add or edit task notes..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedTaskId(null)}>Close</Button>
          <Button
            onClick={() => {
              // TODO: Save notes
              setSelectedTaskId(null);
            }}
            variant="contained"
          >
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default RemediationTasks;
