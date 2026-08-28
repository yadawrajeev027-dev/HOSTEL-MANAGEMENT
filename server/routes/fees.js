const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all fee invoices with filters
router.get('/', (req, res) => {
  try {
    const { studentId, status, month, search } = req.query;
    let fees = db.find('fees');

    if (studentId) {
      fees = fees.filter(f => f.studentId === studentId);
    }
    if (status && status !== 'All') {
      fees = fees.filter(f => f.status.toLowerCase() === status.toLowerCase());
    }
    if (month && month !== 'All') {
      fees = fees.filter(f => f.month.toLowerCase() === month.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      fees = fees.filter(f =>
        (f.studentName && f.studentName.toLowerCase().includes(q)) ||
        (f.rollNo && f.rollNo.toLowerCase().includes(q)) ||
        (f.invoiceNo && f.invoiceNo.toLowerCase().includes(q)) ||
        (f.roomNumber && f.roomNumber.toLowerCase().includes(q))
      );
    }

    res.json(fees);
  } catch (err) {
    console.error('Error fetching fees:', err);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

// POST generate fee invoice
router.post('/', (req, res) => {
  try {
    const { studentId, amount, dueDate, month, description } = req.body;
    if (!studentId || !amount) {
      return res.status(400).json({ error: 'Student ID and amount are required' });
    }

    const student = db.findById('students', studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const invoiceCount = db.find('fees').length + 101;
    const invoiceNo = `INV-2026-${String(invoiceCount).padStart(4, '0')}`;

    const newInvoice = db.insert('fees', {
      invoiceNo,
      studentId: student.id,
      studentName: student.name,
      rollNo: student.rollNo,
      roomNumber: `${student.block ? student.block.replace('Block ', '') + '-' : ''}${student.roomNumber || 'N/A'}`,
      month: month || 'September 2026',
      amount: Number(amount),
      dueDate: dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: 'Pending',
      paidAt: null,
      paymentMethod: null,
      transactionId: null,
      description: description || 'Monthly Hostel Room Rent & Amenities'
    });

    // Update student feeStatus if pending
    if (student.feeStatus !== 'Paid') {
      db.update('students', student.id, { feeStatus: 'Pending' });
    }

    res.status(201).json(newInvoice);
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ error: 'Failed to create fee invoice' });
  }
});

// POST simulate payment of an invoice
router.post('/:id/pay', (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    const fee = db.findById('fees', req.params.id);
    if (!fee) return res.status(404).json({ error: 'Invoice not found' });

    const txn = transactionId || `TXN-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const updated = db.update('fees', req.params.id, {
      status: 'Paid',
      paidAt: new Date().toISOString(),
      paymentMethod: paymentMethod || 'UPI / Instant Pay',
      transactionId: txn
    });

    // Check if student has any other pending fees
    const remainingPending = db.find('fees', f => f.studentId === fee.studentId && f.id !== fee.id && f.status !== 'Paid');
    if (remainingPending.length === 0) {
      db.update('students', fee.studentId, { feeStatus: 'Paid' });
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      receipt: updated
    });
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// DELETE fee invoice
router.delete('/:id', (req, res) => {
  try {
    const deleted = db.remove('fees', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (err) {
    console.error('Error deleting fee invoice:', err);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;
