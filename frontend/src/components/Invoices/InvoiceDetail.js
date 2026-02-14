import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Chip } from '@mui/material';
import { ArrowBack, PictureAsPdf } from '@mui/icons-material';
import { invoicesAPI } from '../../services/api';
import { toast } from 'react-toastify';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await invoicesAPI.getOne(id);
      setInvoice(response.data.data);
    } catch (error) {
      toast.error('Failed to load invoice');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await invoicesAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  if (!invoice) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/invoices')}>Back</Button>
        <Button variant="contained" startIcon={<PictureAsPdf />} onClick={handleDownloadPDF}>Download PDF</Button>
      </Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Invoice {invoice.invoiceNumber}</Typography>
        <Chip label={invoice.status} color="primary" sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Bill To</Typography>
            <Typography>{invoice.contactFirstName} {invoice.contactLastName}</Typography>
            <Typography>{invoice.companyName}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}</Typography>
            <Typography><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>Items</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">${item.rate}</TableCell>
                  <TableCell align="right">${item.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Typography>Subtotal: ${invoice.subtotal}</Typography>
          <Typography>Tax ({invoice.taxRate}%): ${invoice.taxAmount}</Typography>
          <Typography variant="h6">Total: ${invoice.total}</Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default InvoiceDetail;
