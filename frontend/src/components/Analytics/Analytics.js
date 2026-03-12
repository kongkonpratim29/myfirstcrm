import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Handshake as HandshakeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { analyticsAPI } from '../../services/api';
import { toast } from 'react-toastify';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CHART_COLORS = [
  'rgba(25, 118, 210, 0.8)',
  'rgba(220, 0, 78, 0.8)',
  'rgba(255, 152, 0, 0.8)',
  'rgba(76, 175, 80, 0.8)',
  'rgba(156, 39, 176, 0.8)',
  'rgba(0, 188, 212, 0.8)',
  'rgba(255, 87, 34, 0.8)',
  'rgba(63, 81, 181, 0.8)',
  'rgba(233, 30, 99, 0.8)',
  'rgba(0, 150, 136, 0.8)',
  'rgba(121, 85, 72, 0.8)',
  'rgba(96, 125, 139, 0.8)',
  'rgba(255, 193, 7, 0.8)',
];

const CHART_COLORS_LIGHT = CHART_COLORS.map(c => c.replace('0.8', '0.2'));

const Analytics = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const textColor = theme.palette.text.primary;
  const gridColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

  const [summary, setSummary] = useState(null);
  const [dealTrends, setDealTrends] = useState(null);
  const [customerBehavior, setCustomerBehavior] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendPeriod, setTrendPeriod] = useState('12');

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchDealTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendPeriod]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [summaryRes, trendsRes, behaviorRes, pipelineRes] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getDealTrends(trendPeriod),
        analyticsAPI.getCustomerBehavior(),
        analyticsAPI.getPipeline(),
      ]);
      setSummary(summaryRes.data.data);
      setDealTrends(trendsRes.data.data);
      setCustomerBehavior(behaviorRes.data.data);
      setPipeline(pipelineRes.data.data);
    } catch (error) {
      toast.error('Failed to load analytics data');
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealTrends = async () => {
    try {
      const res = await analyticsAPI.getDealTrends(trendPeriod);
      setDealTrends(res.data.data);
    } catch (error) {
      console.error('Deal trends error:', error);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toFixed(0)}`;
  };

  const getGrowth = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // --- Summary Cards ---
  const dealsGrowth = summary ? getGrowth(summary.thisMonth.deals, summary.lastMonth.deals) : 0;
  const contactsGrowth = summary ? getGrowth(summary.thisMonth.contacts, summary.lastMonth.contacts) : 0;

  // --- Deal Trends Chart ---
  const dealTrendsChart = dealTrends ? {
    labels: dealTrends.dealTrends.map(d => {
      const [y, m] = d.month.split('-');
      return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Deal Value (₹)',
        data: dealTrends.dealTrends.map(d => d.totalValue || 0),
        borderColor: 'rgba(25, 118, 210, 1)',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Deal Count',
        data: dealTrends.dealTrends.map(d => d.totalDeals),
        borderColor: 'rgba(76, 175, 80, 1)',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  } : null;

  const chartTextPlugin = { color: textColor };
  const chartGridStyle = { color: gridColor };

  const dealTrendsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top', labels: chartTextPlugin } },
    scales: {
      y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Value (₹)', ...chartTextPlugin }, ticks: chartTextPlugin, grid: chartGridStyle },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false, ...chartGridStyle }, title: { display: true, text: 'Count', ...chartTextPlugin }, ticks: chartTextPlugin },
    },
  };

  // --- Pipeline Funnel Chart ---
  const pipelineChart = pipeline ? {
    labels: pipeline.pipelineSnapshot.map(p => p.stage),
    datasets: [{
      label: 'Deals',
      data: pipeline.pipelineSnapshot.map(p => p.count),
      backgroundColor: CHART_COLORS.slice(0, pipeline.pipelineSnapshot.length),
    }],
  } : null;

  // --- Win/Loss Doughnut ---
  const winLossChart = pipeline ? {
    labels: pipeline.winLossData.map(w => w.outcome),
    datasets: [{
      data: pipeline.winLossData.map(w => w.count),
      backgroundColor: pipeline.winLossData.map(w =>
        w.outcome === 'Won' ? 'rgba(76, 175, 80, 0.8)' :
        w.outcome === 'Lost' ? 'rgba(244, 67, 54, 0.8)' :
        'rgba(255, 152, 0, 0.8)'
      ),
    }],
  } : null;

  // --- Contact Growth Chart ---
  const contactGrowthChart = customerBehavior ? {
    labels: customerBehavior.contactGrowth.map(c => {
      const [y, m] = c.month.split('-');
      return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    datasets: [{
      label: 'New Contacts',
      data: customerBehavior.contactGrowth.map(c => c.newContacts),
      backgroundColor: 'rgba(25, 118, 210, 0.6)',
      borderColor: 'rgba(25, 118, 210, 1)',
      borderWidth: 1,
    }],
  } : null;

  // --- Industry Pie ---
  const industryChart = customerBehavior ? {
    labels: customerBehavior.companiesByIndustry.map(c => c.industry),
    datasets: [{
      data: customerBehavior.companiesByIndustry.map(c => c.count),
      backgroundColor: CHART_COLORS.slice(0, customerBehavior.companiesByIndustry.length),
    }],
  } : null;

  // --- Activity Distribution ---
  const activityChart = customerBehavior ? {
    labels: customerBehavior.activityDistribution.map(a => a.type),
    datasets: [{
      label: 'Activities',
      data: customerBehavior.activityDistribution.map(a => a.count),
      backgroundColor: CHART_COLORS_LIGHT.slice(0, customerBehavior.activityDistribution.length),
      borderColor: CHART_COLORS.slice(0, customerBehavior.activityDistribution.length),
      borderWidth: 1,
    }],
  } : null;

  // --- Monthly Conversions ---
  const conversionsChart = pipeline ? {
    labels: pipeline.monthlyConversions.map(c => {
      const [y, m] = c.month.split('-');
      return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Converted Value (₹)',
        data: pipeline.monthlyConversions.map(c => c.convertedValue || 0),
        backgroundColor: 'rgba(76, 175, 80, 0.6)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1,
      },
      {
        label: 'Conversions',
        data: pipeline.monthlyConversions.map(c => c.conversions),
        type: 'line',
        borderColor: 'rgba(255, 152, 0, 1)',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        yAxisID: 'y1',
        tension: 0.4,
      },
    ],
  } : null;

  const conversionsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: chartTextPlugin } },
    scales: {
      y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Value (₹)', ...chartTextPlugin }, ticks: chartTextPlugin, grid: chartGridStyle },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false, ...chartGridStyle }, title: { display: true, text: 'Count', ...chartTextPlugin }, ticks: chartTextPlugin },
    },
  };

  const SummaryCard = ({ title, value, subtitle, icon, color, growth }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" variant="body2" gutterBottom>{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value}</Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Box sx={{ color, fontSize: 40, mb: 1 }}>{icon}</Box>
            {growth !== undefined && (
              <Chip
                size="small"
                icon={Number(growth) >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={`${growth > 0 ? '+' : ''}${growth}%`}
                color={Number(growth) >= 0 ? 'success' : 'error'}
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Analytics & Reporting
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Revenue"
            value={formatCurrency(summary?.totalRevenue)}
            subtitle="From closed deals"
            icon={<MoneyIcon fontSize="inherit" />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Pipeline Value"
            value={formatCurrency(summary?.totalPipelineValue)}
            subtitle="Active deals"
            icon={<HandshakeIcon fontSize="inherit" />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Deals This Month"
            value={summary?.thisMonth?.deals || 0}
            subtitle={formatCurrency(summary?.thisMonth?.dealsValue)}
            icon={<TrendingUpIcon fontSize="inherit" />}
            color="#ff9800"
            growth={dealsGrowth}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="New Contacts"
            value={summary?.thisMonth?.contacts || 0}
            subtitle={`Task completion: ${summary?.taskCompletionRate || 0}%`}
            icon={<PeopleIcon fontSize="inherit" />}
            color="#9c27b0"
            growth={contactsGrowth}
          />
        </Grid>
      </Grid>

      {/* Deal Trends */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Deal Trends</Typography>
              <ToggleButtonGroup
                size="small"
                value={trendPeriod}
                exclusive
                onChange={(e, val) => val && setTrendPeriod(val)}
              >
                <ToggleButton value="3">3M</ToggleButton>
                <ToggleButton value="6">6M</ToggleButton>
                <ToggleButton value="12">1Y</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ height: 350 }}>
              {dealTrendsChart ? (
                <Line data={dealTrendsChart} options={dealTrendsOptions} />
              ) : (
                <Typography color="textSecondary">No data available</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Pipeline & Win/Loss */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Pipeline Breakdown</Typography>
            <Box sx={{ height: 350 }}>
              {pipelineChart ? (
                <Bar
                  data={pipelineChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { title: { display: true, text: 'Number of Deals', ...chartTextPlugin }, ticks: chartTextPlugin, grid: chartGridStyle },
                      y: { ticks: chartTextPlugin, grid: chartGridStyle },
                    },
                  }}
                />
              ) : (
                <Typography color="textSecondary">No data</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Win / Loss / Open</Typography>
            <Box sx={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {winLossChart ? (
                <Doughnut
                  data={winLossChart}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: chartTextPlugin } } }}
                />
              ) : (
                <Typography color="textSecondary">No data</Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Chip
                icon={<CheckCircleIcon />}
                label={`Avg. cycle: ${Math.round(pipeline?.avgCycleTime || 0)} days`}
                variant="outlined"
                color="primary"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Customer Behavior Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Contact Growth</Typography>
            <Box sx={{ height: 300 }}>
              {contactGrowthChart ? (
                <Bar
                  data={contactGrowthChart}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: chartTextPlugin, grid: chartGridStyle }, y: { ticks: chartTextPlugin, grid: chartGridStyle } } }}
                />
              ) : (
                <Typography color="textSecondary">No data</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Companies by Industry</Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              {industryChart ? (
                <Pie
                  data={industryChart}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: chartTextPlugin } } }}
                />
              ) : (
                <Typography color="textSecondary">No data</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Conversions & Activity */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Monthly Conversions</Typography>
            <Box sx={{ height: 300 }}>
              {conversionsChart ? (
                <Bar data={conversionsChart} options={conversionsOptions} />
              ) : (
                <Typography color="textSecondary">No data</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Activity Distribution</Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              {activityChart ? (
                <Doughnut
                  data={activityChart}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: chartTextPlugin } } }}
                />
              ) : (
                <Typography color="textSecondary">No data</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Companies Table */}
      {customerBehavior?.topCompaniesByDeals?.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Top Companies by Deal Value</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell align="right">Deals</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customerBehavior.topCompaniesByDeals.map((company, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{company.companyName}</TableCell>
                    <TableCell align="right">{company.dealCount}</TableCell>
                    <TableCell align="right">{formatCurrency(company.totalValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default Analytics;
