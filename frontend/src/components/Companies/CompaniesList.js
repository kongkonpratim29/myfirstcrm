import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
} from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { companiesAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CompaniesList = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '', industry: '', website: '', address: '', phone: '', email: '', employeeCount: ''
  });

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
    } else {
      setEditingCompany(null);
      setFormData({ name: '', industry: '', website: '', address: '', phone: '', email: '', employeeCount: '' });
    }
    setOpenDialog(true);
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
            <Grid item xs={12}><TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Industry" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Employees" type="number" value={formData.employeeCount} onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" multiline rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></Grid>
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
