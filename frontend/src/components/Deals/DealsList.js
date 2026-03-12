import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Paper, Typography, Card, CardContent, Grid, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { dealsAPI, companiesAPI, contactsAPI } from '../../services/api';
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

const DealsList = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    stage: 'New Lead',
    workSubStage: '',
    probability: 0,
    expectedCloseDate: '',
    companyId: '',
    contactId: ''
  });

  useEffect(() => {
    fetchDeals();
    fetchCompanies();
    fetchContacts();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await dealsAPI.getAll();
      setDeals(response.data.data);
    } catch (error) {
      toast.error('Failed to load deals');
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getAll({ limit: 100 });
      setCompanies(response.data.data);
    } catch (error) {
      console.error('Failed to load companies');
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await contactsAPI.getAll({ limit: 100 });
      setContacts(response.data.data);
    } catch (error) {
      console.error('Failed to load contacts');
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        workSubStage: formData.stage === 'Work in Progress' ? formData.workSubStage || null : null,
      };
      await dealsAPI.create(payload);
      toast.success('Deal created');
      setOpenDialog(false);
      setFormData({
        title: '',
        value: '',
        stage: 'New Lead',
        workSubStage: '',
        probability: 0,
        expectedCloseDate: '',
        companyId: '',
        contactId: ''
      });
      fetchDeals();
    } catch (error) {
      toast.error('Failed to create deal');
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      'New Lead': 'default',
      'Initial Contact': 'info',
      'Requirement Discussion': 'info',
      'Proposal / Quotation Sent': 'primary',
      'Follow-up / Re-approach': 'warning',
      'Deal Confirmed': 'success',
      'Invoice Sent': 'primary',
      'Payment Pending': 'warning',
      'Payment Received': 'success',
      'Work in Progress': 'secondary',
      'Client Feedback / Revision': 'warning',
      'Project Completed': 'success',
      'Closed': 'default'
    };
    return colors[stage] || 'default';
  };

  const groupedDeals = workProgressStages.reduce((acc, stage) => {
    acc[stage] = deals.filter(deal => deal.stage === stage);
    return acc;
  }, {});

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Deals Pipeline</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>Add Deal</Button>
      </Box>
      <Grid container spacing={2}>
        {workProgressStages.map((stage) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={stage}>
            <Paper sx={{ p: 2, minHeight: 400, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>{stage}</Typography>
              <Typography variant="caption" color="textSecondary">
                {groupedDeals[stage]?.length || 0} deals - ₹
                {groupedDeals[stage]?.reduce((sum, deal) => sum + parseFloat(deal.value || 0), 0).toFixed(2)}
              </Typography>
              {groupedDeals[stage]?.map((deal) => (
                <Card key={deal.id} sx={{ mt: 1, cursor: 'pointer' }} onClick={() => navigate(`/deals/${deal.id}`)}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="body2" fontWeight="bold">{deal.title}</Typography>
                    <Typography variant="caption">{deal.companyName}</Typography>
                    <Typography variant="h6" color="primary">₹{deal.value}</Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={deal.stage} size="small" color={getStageColor(deal.stage)} />
                      {deal.workSubStage ? <Chip label={deal.workSubStage} size="small" variant="outlined" /> : null}
                      <Chip label={`${deal.probability}%`} size="small" />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Deal</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Value" type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Stage" value={formData.stage} onChange={(e) => setFormData({ ...formData, stage: e.target.value })}>
                {workProgressStages.map((stage) => <MenuItem key={stage} value={stage}>{stage}</MenuItem>)}
              </TextField>
            </Grid>
            {formData.stage === 'Work in Progress' ? (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Work in Progress Sub-status"
                  value={formData.workSubStage}
                  onChange={(e) => setFormData({ ...formData, workSubStage: e.target.value })}
                >
                  {workInProgressSubStages.map((subStage) => (
                    <MenuItem key={subStage} value={subStage}>{subStage}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            ) : null}
            <Grid item xs={6}><TextField fullWidth label="Probability (%)" type="number" value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Expected Close Date" type="date" InputLabelProps={{ shrink: true }} value={formData.expectedCloseDate} onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Company" value={formData.companyId} onChange={(e) => setFormData({ ...formData, companyId: e.target.value })} SelectProps={{ native: true }}>
                <option value="">Select Company</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Contact" value={formData.contactId} onChange={(e) => setFormData({ ...formData, contactId: e.target.value })} SelectProps={{ native: true }}>
                <option value="">Select Contact</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DealsList;
