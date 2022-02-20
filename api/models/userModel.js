const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/network-monitoring-app');
const db = mongoose.connection;

db.on('error', err => {
    console.log(err);
});

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