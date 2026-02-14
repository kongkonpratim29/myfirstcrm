import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Grid, Chip, Divider, List, ListItem, ListItemText } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { dealsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);

  const fetchDeal = useCallback(async () => {
    try {
      const response = await dealsAPI.getOne(id);
      setDeal(response.data.data);
    } catch (error) {
      toast.error('Failed to load deal');
    }
  }, [id]);

  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);

  if (!deal) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/deals')} sx={{ mb: 2 }}>Back</Button>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>{deal.title}</Typography>
        <Chip label={deal.stage} color="primary" sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Deal Information</Typography>
            <Typography><strong>Value:</strong> ${deal.value}</Typography>
            <Typography><strong>Probability:</strong> {deal.probability}%</Typography>
            <Typography><strong>Expected Close:</strong> {new Date(deal.expectedCloseDate).toLocaleDateString()}</Typography>
            <Typography><strong>Company:</strong> {deal.companyName}</Typography>
            <Typography><strong>Contact:</strong> {deal.contactFirstName} {deal.contactLastName}</Typography>
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
