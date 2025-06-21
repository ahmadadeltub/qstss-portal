const express = require('express');
const router = express.Router();

console.log('Auth route file loaded');
console.log('Router type:', typeof router);

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route test works' });
});

module.exports = router;
