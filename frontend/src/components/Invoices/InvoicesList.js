import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, MenuItem,
} from '@mui/material';
import { Add, Visibility, Delete, PictureAsPdf } from '@mui/icons-material';
import { invoicesAPI, companiesAPI, contactsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const InvoicesList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    companyId: '',
    contactId: '',
    taxRate: 10,
    items: [{ description: '', quantity: 1, rate: 0 }]
  });

  useEffect(() => {
    fetchInvoices();
    fetchCompanies();
    fetchContacts();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await invoicesAPI.getAll();
      setInvoices(response.data.data);
    } catch (error) {
      toast.error('Failed to load invoices');
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
      await invoicesAPI.create(formData);
      toast.success('Invoice created');
      setOpenDialog(false);
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  const handleDownloadPDF = async (id, invoiceNumber) => {
    try {
      const response = await invoicesAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this invoice?')) {
      try {
        await invoicesAPI.delete(id);
        toast.success('Invoice deleted');
        fetchInvoices();
      } catch (error) {
        toast.error('Failed to delete invoice');
      }
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const getStatusColor = (status) => {
    const colors = { 'Draft': 'default', 'Sent': 'info', 'Paid': 'success', 'Overdue': 'error', 'Cancelled': 'warning' };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Invoices</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>Create Invoice</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                <TableCell>{invoice.companyName}</TableCell>
                <TableCell>{invoice.contactFirstName} {invoice.contactLastName}</TableCell>
                <TableCell>${invoice.total}</TableCell>
                <TableCell><Chip label={invoice.status} color={getStatusColor(invoice.status)} size="small" /></TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => navigate(`/invoices/${invoice.id}`)}><Visibility /></IconButton>
                  <IconButton onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}><PictureAsPdf /></IconButton>
                  <IconButton onClick={() => handleDelete(invoice.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Invoice</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField fullWidth label="Date" type="date" InputLabelProps={{ shrink: true }} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Due Date" type="date" InputLabelProps={{ shrink: true }} value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></Grid>
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
            <Grid item xs={12}><TextField fullWidth label="Tax Rate (%)" type="number" value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })} /></Grid>
            <Grid item xs={12}><Typography variant="h6">Items</Typography></Grid>
            {formData.items.map((item, index) => (
              <React.Fragment key={index}>
                <Grid item xs={6}><TextField fullWidth label="Description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} /></Grid>
                <Grid item xs={3}><TextField fullWidth label="Quantity" type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} /></Grid>
                <Grid item xs={3}><TextField fullWidth label="Rate" type="number" value={item.rate} onChange={(e) => updateItem(index, 'rate', e.target.value)} /></Grid>
              </React.Fragment>
            ))}
            <Grid item xs={12}><Button onClick={addItem}>Add Item</Button></Grid>
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

export default InvoicesList;
