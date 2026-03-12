import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  InputAdornment, CircularProgress, Alert, Chip,
} from '@mui/material';
import { 
  Add, Edit, Delete, Visibility, 
  CheckCircle, Error as ErrorIcon, Verified 
} from '@mui/icons-material';
import { companiesAPI, gstAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CompaniesList = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '', industry: '', website: '', address: '', phone: '', email: '', employeeCount: '',
    gstNumber: '', gstVerified: false, gstLegalName: '', gstAddress: ''
  });
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [gstError, setGstError] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, [search]);

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getAll({ search });
      setCompanies(response.data.data);
    } catch (error) {
      toast.error('Failed to load companies');
    }
  };

  const handleOpenDialog = (company = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData(company);
      setGstVerified(company.gstVerified || false);
    } else {
      setEditingCompany(null);
      setFormData({ 
        name: '', industry: '', website: '', address: '', phone: '', email: '', employeeCount: '',
        gstNumber: '', gstVerified: false, gstLegalName: '', gstAddress: ''
      });
      setGstVerified(false);
    }
    setGstError('');
    setOpenDialog(true);
  };

  const handleVerifyGST = async () => {
    if (!formData.gstNumber || formData.gstNumber.length !== 15) {
      setGstError('Please enter a valid 15-character GST number');
      return;
    }

    try {
      setGstVerifying(true);
      setGstError('');
      const response = await gstAPI.verify(formData.gstNumber);
      
      if (response.data.success) {
        const { legalName, address } = response.data.data;
        setFormData({
          ...formData,
          gstVerified: true,
          gstLegalName: legalName,
          gstAddress: address,
          address: address // Auto-fill the main address field
        });
        setGstVerified(true);
        toast.success('GST verified successfully!');
      }
    } catch (error) {
      setGstError(error.response?.data?.message || 'Failed to verify GST number');
      setGstVerified(false);
      toast.error('GST verification failed');
    } finally {
      setGstVerifying(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingCompany) {
        await companiesAPI.update(editingCompany.id, formData);
        toast.success('Company updated successfully');
      } else {
        await companiesAPI.create(formData);
        toast.success('Company created successfully');
      }
      setOpenDialog(false);
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to save company');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this company?')) {
      try {
        await companiesAPI.delete(id);
        toast.success('Company deleted');
        fetchCompanies();
      } catch (error) {
        toast.error('Failed to delete company');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Companies</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>Add Company</Button>
      </Box>
      <TextField fullWidth placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Industry</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>GST Status</TableCell>
              <TableCell>Employees</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>{company.name}</TableCell>
                <TableCell>{company.industry}</TableCell>
                <TableCell>{company.email}</TableCell>
                <TableCell>{company.phone}</TableCell>
                <TableCell>
                  {company.gstNumber ? (
                    company.gstVerified ? (
                      <Chip 
                        icon={<CheckCircle />} 
                        label="Verified" 
                        color="success" 
                        size="small" 
                      />
                    ) : (
                      <Chip 
                        icon={<ErrorIcon />} 
                        label="Not Verified" 
                        color="warning" 
                        size="small" 
                      />
                    )
                  ) : (
                    <Typography variant="caption" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell>{company.employeeCount}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => navigate(`/companies/${company.id}`)}><Visibility /></IconButton>
                  <IconButton onClick={() => handleOpenDialog(company)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(company.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingCompany ? 'Edit Company' : 'Add Company'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              />
            </Grid>
            
            {/* GST Number Section */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Enter GST number to auto-verify and fetch company details from GST portal
                </Typography>
              </Alert>
              <TextField 
                fullWidth 
                label="GST Number (Optional)" 
                value={formData.gstNumber} 
                onChange={(e) => {
                  setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() });
                  setGstVerified(false);
                  setGstError('');
                }}
                placeholder="e.g., 27AAPFU0939F1ZV"
                inputProps={{ maxLength: 15 }}
                InputProps={{
                  endAdornment: formData.gstNumber && (
                    <InputAdornment position="end">
                      {gstVerified ? (
                        <Chip 
                          icon={<CheckCircle />} 
                          label="Verified" 
                          color="success" 
                          size="small" 
                        />
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleVerifyGST}
                          disabled={gstVerifying || formData.gstNumber.length !== 15}
                          sx={{ minWidth: '100px' }}
                        >
                          {gstVerifying ? <CircularProgress size={20} /> : 'Verify GST'}
                        </Button>
                      )}
                    </InputAdornment>
                  ),
                }}
                helperText={formData.gstNumber ? `${formData.gstNumber.length}/15 characters` : 'Enter 15-digit GST number'}
                error={!!gstError}
              />
              {gstError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {gstError}
                </Alert>
              )}
              {gstVerified && formData.gstLegalName && (
                <Alert severity="success" sx={{ mt: 1 }} icon={<Verified />}>
                  <Typography variant="body2">
                    <strong>Legal Name:</strong> {formData.gstLegalName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>GST Address:</strong> {formData.gstAddress}
                  </Typography>
                </Alert>
              )}
            </Grid>

            <Grid item xs={6}>
              <TextField 
                fullWidth 
                label="Industry" 
                value={formData.industry} 
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })} 
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth 
                label="Website" 
                value={formData.website} 
                onChange={(e) => setFormData({ ...formData, website: e.target.value })} 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Email" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth 
                label="Phone" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth 
                label="Employees" 
                type="number" 
                value={formData.employeeCount} 
                onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })} 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Address" 
                multiline 
                rows={2} 
                value={formData.address} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                helperText={gstVerified ? "Address auto-filled from GST details" : ""}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editingCompany ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompaniesList;
