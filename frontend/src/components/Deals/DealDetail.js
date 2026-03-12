import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Grid, Chip, Divider, List, ListItem, ListItemText, TextField, MenuItem } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { dealsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const workProgressStages = [
  'New Lead',
  'Initial Contact',
  'Requirement Discussion',
  'Proposal / Quotation Sent',
  'Follow-up / Re-approach',
  'Deal Confirmed',
  'Invoice Sent',
  'Payment Pending',
  'Payment Received',
  'Work in Progress',
  'Client Feedback / Revision',
  'Project Completed',
  'Closed'
];

const workInProgressSubStages = [
  'Design in Progress',
  'Development in Progress',
  'Testing / Review'
];

const formatDateForInput = (dateString) => {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().split('T')[0];
};

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [progressForm, setProgressForm] = useState({ stage: 'New Lead', workSubStage: '' });
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  const fetchDeal = useCallback(async () => {
    try {
      const response = await dealsAPI.getOne(id);
      setDeal(response.data.data);
      setProgressForm({
        stage: response.data.data.stage || 'New Lead',
        workSubStage: response.data.data.workSubStage || '',
      });
    } catch (error) {
      toast.error('Failed to load deal');
    }
  }, [id]);

  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);

  const handleSaveProgress = async () => {
    if (!deal) {
      return;
    }

    try {
      setIsSavingProgress(true);

      const payload = {
        title: deal.title,
        value: deal.value,
        stage: progressForm.stage,
        workSubStage: progressForm.stage === 'Work in Progress' ? progressForm.workSubStage || null : null,
        probability: deal.probability,
        expectedCloseDate: formatDateForInput(deal.expectedCloseDate),
        companyId: deal.companyId,
        contactId: deal.contactId,
      };

      const response = await dealsAPI.update(id, payload);
      setDeal((prev) => ({ ...prev, ...response.data.data }));
      toast.success('Work progress updated');
    } catch (error) {
      toast.error('Failed to update work progress');
    } finally {
      setIsSavingProgress(false);
    }
  };

  if (!deal) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/deals')} sx={{ mb: 2 }}>Back</Button>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>{deal.title}</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={deal.stage} color="primary" />
          {deal.workSubStage ? <Chip label={deal.workSubStage} variant="outlined" /> : null}
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Deal Information</Typography>
            <Typography><strong>Value:</strong> ₹{deal.value}</Typography>
            <Typography><strong>Probability:</strong> {deal.probability}%</Typography>
            <Typography><strong>Expected Close:</strong> {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '-'}</Typography>
            <Typography><strong>Company:</strong> {deal.companyName}</Typography>
            <Typography><strong>Contact:</strong> {deal.contactFirstName} {deal.contactLastName}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Update Work Progress</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Work Progress"
                  value={progressForm.stage}
                  onChange={(e) => setProgressForm((prev) => ({ ...prev, stage: e.target.value }))}
                >
                  {workProgressStages.map((stage) => (
                    <MenuItem key={stage} value={stage}>{stage}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {progressForm.stage === 'Work in Progress' ? (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Sub-status"
                    value={progressForm.workSubStage}
                    onChange={(e) => setProgressForm((prev) => ({ ...prev, workSubStage: e.target.value }))}
                  >
                    {workInProgressSubStages.map((subStage) => (
                      <MenuItem key={subStage} value={subStage}>{subStage}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              ) : null}
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleSaveProgress} disabled={isSavingProgress}>
                  {isSavingProgress ? 'Saving...' : 'Save Progress'}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6">Activity Timeline</Typography>
        <List>
          {deal.activities?.map((activity) => (
            <ListItem key={activity.id}>
              <ListItemText primary={activity.description} secondary={new Date(activity.createdAt).toLocaleString()} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default DealDetail;
