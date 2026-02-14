import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { contactsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);

  useEffect(() => {
    fetchContact();
  }, [id]);

  const fetchContact = async () => {
    try {
      const response = await contactsAPI.getOne(id);
      setContact(response.data.data);
    } catch (error) {
      toast.error('Failed to load contact details');
    }
  };

  if (!contact) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/contacts')} sx={{ mb: 2 }}>
        Back to Contacts
      </Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {contact.firstName} {contact.lastName}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Contact Information</Typography>
            <Typography><strong>Email:</strong> {contact.email}</Typography>
            <Typography><strong>Phone:</strong> {contact.phone}</Typography>
            <Typography><strong>Position:</strong> {contact.position}</Typography>
            <Typography><strong>Company:</strong> {contact.companyName}</Typography>
            <Typography><strong>Address:</strong> {contact.address}</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Notes</Typography>
            <Typography>{contact.notes || 'No notes available'}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>Activity History</Typography>
        <List>
          {contact.activities && contact.activities.length > 0 ? (
            contact.activities.map((activity) => (
              <ListItem key={activity.id}>
                <ListItemText
                  primary={activity.description}
                  secondary={`${activity.firstName} ${activity.lastName} - ${new Date(activity.createdAt).toLocaleString()}`}
                />
              </ListItem>
            ))
          ) : (
            <Typography color="textSecondary">No activity history</Typography>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default ContactDetail;
