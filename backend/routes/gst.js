const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   POST /api/gst/verify
// @desc    Verify GST number and get company details
// @access  Private
router.post('/verify', async (req, res) => {
  try {
    const { gstNumber } = req.body;

    if (!gstNumber) {
      return res.status(400).json({ success: false, message: 'GST number is required' });
    }

    // Validate GST format (15 characters)
    // Format: 2 digits (state code) + 10 chars (PAN) + 1 char (entity number) + Z + 1 char (checksum)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid GST number format. Should be 15 characters (e.g., 27AAPFU0939F1ZV)' 
      });
    }

    // Extract information from GST number structure
    const stateCode = gstNumber.substring(0, 2);
    const pan = gstNumber.substring(2, 12);
    const entityNumber = gstNumber.substring(12, 13);
    
    // State code mapping (sample)
    const stateCodes = {
      '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
      '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
      '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
      '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
      '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
      '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
      '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
      '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
      '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
      '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa',
      '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
      '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana',
      '37': 'Andhra Pradesh (New)', '38': 'Ladakh'
    };

    const state = stateCodes[stateCode] || 'Unknown State';

    // Note: In production, you would make an actual API call to GST portal here
    // For now, we simulate a successful verification response
    // Actual API URL: https://services.gst.gov.in/services/api/search
    // This requires proper authentication tokens and may have restrictions

    // Simulate verification (mock response)
    const verified = true;
    const legalName = `${pan.substring(4, 5) === 'P' ? 'Proprietary' : 'Private Limited'} Company - ${pan}`;
    const address = `Registered Address, ${state}, India - ${stateCode}`;

    // In a real implementation, you would call:
    // const response = await axios.post('https://services.gst.gov.in/services/api/search', {
    //   gstNumber: gstNumber
    // }, {
    //   headers: {
    //     'Authorization': 'Bearer YOUR_GST_API_TOKEN'
    //   }
    // });

    res.json({
      success: true,
      data: {
        gstNumber,
        verified,
        legalName,
        address,
        stateCode,
        state,
        pan
      },
      message: 'GST number verified successfully'
    });

  } catch (error) {
    console.error('GST verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify GST number',
      error: error.message 
    });
  }
});

module.exports = router;
