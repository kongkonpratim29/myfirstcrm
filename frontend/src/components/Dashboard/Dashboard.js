import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Collapse,
  Button,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  TrendingUp as DealsIcon,
  Assignment as TasksIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { dashboardAPI } from '../../services/api';
import { toast } from 'react-toastify';

ChartJS.register(ArcElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const Dashboard = () => {
  const theme = useTheme();
  const chartTextColor = theme.palette.text.primary;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedDate);
    const days = [];
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<Box key={`empty-${i}`} sx={{ p: 1, textAlign: 'center' }}></Box>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === today.getDate();
      days.push(
        <Box
          key={day}
          sx={{
            p: 1,
            textAlign: 'center',
            borderRadius: 1,
            backgroundColor: isToday ? 'primary.main' : 'transparent',
            color: isToday ? 'primary.contrastText' : 'text.primary',
            fontWeight: isToday ? 'bold' : 'normal',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: isToday ? 'primary.dark' : 'action.hover',
            },
          }}
        >
          {day}
        </Box>
      );
    }
    
    return (
      <Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
          {dayHeaders.map((day) => (
            <Box key={day} sx={{ p: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {day}
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
          {days}
        </Box>
      </Box>
    );
  };

  const changeMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  if (loading) {
    return <Typography>Loading dashboard...</Typography>;
  }

  if (!stats) {
    return <Typography>No data available</Typography>;
  }

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
          <Box sx={{ color, fontSize: 48 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Prepare chart data
  const dealsPipelineData = {
    labels: stats.dealsPipeline?.map((d) => d.stage) || [],
    datasets: [
      {
        label: 'Total Value',
        data: stats.dealsPipeline?.map((d) => d.totalValue || 0) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
      },
    ],
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        
        {/* Date and Time Widget */}
        <Box sx={{ position: 'relative' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              minWidth: 280,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccessTimeIcon sx={{ mr: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {formatTime(currentTime)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarTodayIcon sx={{ mr: 1, fontSize: 16 }} />
              <Typography variant="body2">
                {formatDate(currentTime)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="caption">
                Click to view calendar
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setCalendarOpen(!calendarOpen)}
                sx={{ color: 'white' }}
              >
                {calendarOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Paper>

          {/* Calendar Dropdown */}
          <Collapse in={calendarOpen}>
            <Paper 
              elevation={6} 
              sx={{ 
                mt: 1, 
                p: 2,
                position: 'absolute',
                right: 0,
                zIndex: 1000,
                minWidth: 320,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <IconButton size="small" onClick={() => changeMonth(-1)}>
                  <ExpandLessIcon sx={{ transform: 'rotate(90deg)' }} />
                </IconButton>
                <Typography variant="h6">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Typography>
                <IconButton size="small" onClick={() => changeMonth(1)}>
                  <ExpandLessIcon sx={{ transform: 'rotate(-90deg)' }} />
                </IconButton>
              </Box>
              {renderCalendar()}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  size="small" 
                  onClick={() => setSelectedDate(new Date())}
                  variant="outlined"
                >
                  Today
                </Button>
              </Box>
            </Paper>
          </Collapse>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Contacts"
            value={stats.counts?.contacts || 0}
            icon={<PeopleIcon fontSize="inherit" />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Companies"
            value={stats.counts?.companies || 0}
            icon={<BusinessIcon fontSize="inherit" />}
            color="#dc004e"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Deals"
            value={stats.counts?.deals || 0}
            icon={<DealsIcon fontSize="inherit" />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tasks"
            value={stats.counts?.tasks || 0}
            icon={<TasksIcon fontSize="inherit" />}
            color="#4caf50"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Deal Pipeline
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Pie data={dealsPipelineData} options={{ maintainAspectRatio: false, plugins: { legend: { labels: { color: chartTextColor } } } }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <List dense>
              {stats.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.slice(0, 5).map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemText
                      primary={activity.description}
                      secondary={`${activity.firstName} ${activity.lastName} - ${new Date(activity.createdAt).toLocaleString()}`}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No recent activities" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Tasks
            </Typography>
            <List>
              {stats.upcomingTasks && stats.upcomingTasks.length > 0 ? (
                stats.upcomingTasks.slice(0, 5).map((task) => (
                  <ListItem key={task.id}>
                    <ListItemText
                      primary={task.title}
                      secondary={`Due: ${new Date(task.dueDate).toLocaleDateString()} - Assigned to: ${task.firstName} ${task.lastName}`}
                    />
                    <Chip
                      label={task.priority}
                      color={
                        task.priority === 'Urgent' ? 'error' :
                        task.priority === 'High' ? 'warning' :
                        'default'
                      }
                      size="small"
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No upcoming tasks" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
