const { pool } = require('../config/database');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate unique invoice number
const generateInvoiceNumber = async () => {
  const [result] = await pool.query(
    'SELECT invoiceNumber FROM invoices ORDER BY id DESC LIMIT 1'
  );
  
  if (result.length === 0) {
    return 'INV-0001';
  }
  
  const lastNumber = parseInt(result[0].invoiceNumber.split('-')[1]);
  return `INV-${String(lastNumber + 1).padStart(4, '0')}`;
};

// @route   GET /api/invoices
// @desc    Get all invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT i.*, 
             c.name as companyName,
             cont.firstName as contactFirstName, cont.lastName as contactLastName,
             u.firstName as createdByFirstName, u.lastName as createdByLastName
      FROM invoices i
      LEFT JOIN companies c ON i.companyId = c.id
      LEFT JOIN contacts cont ON i.contactId = cont.id
      LEFT JOIN users u ON i.createdBy = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY i.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [invoices] = await pool.query(query, params);

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   GET /api/invoices/:id
// @desc    Get single invoice
// @access  Private
const getInvoice = async (req, res) => {
  try {
    const [invoices] = await pool.query(
      `SELECT i.*, 
              c.name as companyName, c.address as companyAddress,
              cont.firstName as contactFirstName, cont.lastName as contactLastName,
              u.firstName as createdByFirstName, u.lastName as createdByLastName
       FROM invoices i
       LEFT JOIN companies c ON i.companyId = c.id
       LEFT JOIN contacts cont ON i.contactId = cont.id
       LEFT JOIN users u ON i.createdBy = u.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Get invoice items
    const [items] = await pool.query(
      'SELECT * FROM invoice_items WHERE invoiceId = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      data: { ...invoices[0], items }
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/invoices
// @desc    Create invoice
// @access  Private
const createInvoice = async (req, res) => {
  try {
    const { date, dueDate, contactId, companyId, taxRate, items } = req.body;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const [result] = await pool.query(
      `INSERT INTO invoices (invoiceNumber, date, dueDate, contactId, companyId, subtotal, taxRate, taxAmount, total, status, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)`,
      [invoiceNumber, date, dueDate, contactId, companyId, subtotal, taxRate, taxAmount, total, req.user.id]
    );

    // Create invoice items
    for (const item of items) {
      const amount = item.quantity * item.rate;
      await pool.query(
        `INSERT INTO invoice_items (invoiceId, description, quantity, rate, amount)
         VALUES (?, ?, ?, ?, ?)`,
        [result.insertId, item.description, item.quantity, item.rate, amount]
      );
    }

    const [invoices] = await pool.query('SELECT * FROM invoices WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoices[0]
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   PUT /api/invoices/:id
// @desc    Update invoice
// @access  Private
const updateInvoice = async (req, res) => {
  try {
    const { date, dueDate, contactId, companyId, taxRate, status, items } = req.body;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Update invoice
    const [result] = await pool.query(
      `UPDATE invoices 
       SET date = ?, dueDate = ?, contactId = ?, companyId = ?, subtotal = ?, taxRate = ?, taxAmount = ?, total = ?, status = ?
       WHERE id = ?`,
      [date, dueDate, contactId, companyId, subtotal, taxRate, taxAmount, total, status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Delete old items and create new ones
    await pool.query('DELETE FROM invoice_items WHERE invoiceId = ?', [req.params.id]);
    
    for (const item of items) {
      const amount = item.quantity * item.rate;
      await pool.query(
        `INSERT INTO invoice_items (invoiceId, description, quantity, rate, amount)
         VALUES (?, ?, ?, ?, ?)`,
        [req.params.id, item.description, item.quantity, item.rate, amount]
      );
    }

    const [invoices] = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoices[0]
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   DELETE /api/invoices/:id
// @desc    Delete invoice
// @access  Private
const deleteInvoice = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   GET /api/invoices/:id/pdf
// @desc    Generate PDF for invoice
// @access  Private
const generateInvoicePDF = async (req, res) => {
  try {
    // Get invoice with items
    const [invoices] = await pool.query(
      `SELECT i.*, 
              c.name as companyName, c.address as companyAddress,
              cont.firstName as contactFirstName, cont.lastName as contactLastName
       FROM invoices i
       LEFT JOIN companies c ON i.companyId = c.id
       LEFT JOIN contacts cont ON i.contactId = cont.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const invoice = invoices[0];

    const [items] = await pool.query(
      'SELECT * FROM invoice_items WHERE invoiceId = ?',
      [req.params.id]
    );

    // Create PDF
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
    doc.moveDown();
    
    doc.text('Bill To:');
    doc.text(`${invoice.contactFirstName} ${invoice.contactLastName}`);
    if (invoice.companyName) {
      doc.text(invoice.companyName);
    }
    doc.moveDown();
    
    doc.text('Items:', { underline: true });
    doc.moveDown(0.5);
    
    items.forEach(item => {
      doc.text(`${item.description} - Qty: ${item.quantity} x $${item.rate} = $${item.amount}`);
    });
    
    doc.moveDown();
    doc.text(`Subtotal: $${invoice.subtotal}`);
    doc.text(`Tax (${invoice.taxRate}%): $${invoice.taxAmount}`);
    doc.fontSize(14).text(`Total: $${invoice.total}`, { bold: true });
    
    doc.end();
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  generateInvoicePDF
};
