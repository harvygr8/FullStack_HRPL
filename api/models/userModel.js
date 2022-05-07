// Import the mongoose library and create a database connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/network-monitoring-app');
const db = mongoose.connection;

// Error handler
db.on('error', err => {
    console.log(err);
});

// Successfully connecting to database
db.once('open', () => {
    console.log('Database opened successfully');
});

// Schema
const userSchema = new mongoose.Schema({
    id: { type: String, required: true },
    speed: { type: Number, required: true},
    location: { type: String, required: true},
    frequency: { type: Number, required: true}
});

// Model
const user = mongoose.model('user', userSchema);
module.exports = user;