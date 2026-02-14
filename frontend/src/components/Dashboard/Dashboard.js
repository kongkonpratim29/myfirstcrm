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
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  TrendingUp as DealsIcon,
  Assignment as TasksIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { dashboardAPI } from '../../services/api';
import { toast } from 'react-toastify';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
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
    labels: stats.dealsPipeline.map((d) => d.stage),
    datasets: [
      {
        label: 'Total Value',
        data: stats.dealsPipeline.map((d) => d.totalValue || 0),
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

  const monthlyRevenueData = {
    labels: stats.revenue.monthly.slice(0, 6).reverse().map((m) => m.month),
    datasets: [
      {
        label: 'Revenue',
        data: stats.revenue.monthly.slice(0, 6).reverse().map((m) => m.revenue),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Contacts"
            value={stats.counts.contacts}
            icon={<PeopleIcon fontSize="inherit" />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Companies"
            value={stats.counts.companies}
            icon={<BusinessIcon fontSize="inherit" />}
            color="#dc004e"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Deals"
            value={stats.counts.deals}
            icon={<DealsIcon fontSize="inherit" />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tasks"
            value={stats.counts.tasks}
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
              <Pie data={dealsPipelineData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Revenue
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar data={monthlyRevenueData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Statistics
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Revenue (Paid): ${stats.revenue.total.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pending Payments: ${stats.revenue.pending.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="error">
                Overdue: ${stats.revenue.overdue.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Conversion Rate: {stats.conversionRate}%
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <List dense>
              {stats.recentActivities.slice(0, 5).map((activity) => (
                <ListItem key={activity.id}>
                  <ListItemText
                    primary={activity.description}
                    secondary={`${activity.firstName} ${activity.lastName} - ${new Date(activity.createdAt).toLocaleString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Tasks
            </Typography>
            <List>
              {stats.upcomingTasks.slice(0, 5).map((task) => (
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
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
