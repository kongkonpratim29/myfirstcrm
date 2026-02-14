import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Grid, Divider, List, ListItem, ListItemText } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { companiesAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    try {
      const response = await companiesAPI.getOne(id);
      setCompany(response.data.data);
    } catch (error) {
      toast.error('Failed to load company');
    }
  };

  if (!company) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/companies')} sx={{ mb: 2 }}>Back</Button>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>{company.name}</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Company Info</Typography>
            <Typography><strong>Industry:</strong> {company.industry}</Typography>
            <Typography><strong>Website:</strong> {company.website}</Typography>
            <Typography><strong>Email:</strong> {company.email}</Typography>
            <Typography><strong>Phone:</strong> {company.phone}</Typography>
            <Typography><strong>Employees:</strong> {company.employeeCount}</Typography>
            <Typography><strong>Address:</strong> {company.address}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Associated Contacts</Typography>
            <List>
              {company.contacts?.map((contact) => (
                <ListItem key={contact.id}>
                  <ListItemText primary={`${contact.firstName} ${contact.lastName}`} secondary={contact.email} />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6">Activity History</Typography>
        <List>
          {company.activities?.map((activity) => (
            <ListItem key={activity.id}>
              <ListItemText primary={activity.description} secondary={new Date(activity.createdAt).toLocaleString()} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default CompanyDetail;
