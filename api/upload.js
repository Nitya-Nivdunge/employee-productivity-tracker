const uploadController = require('./controllers/uploadController');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    return await uploadController.uploadData(req, res);
  }
  res.status(405).json({ error: 'Method not allowed' });
};