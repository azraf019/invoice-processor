const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fields: [{
    type: String,
    required: true
  }],
  // Optional: Description for the template
  description: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Template', templateSchema);
