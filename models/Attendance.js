const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true
    },
    rfid: {
        type: String,
        required: [true, 'RFID is missing'],
        unique: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [/.+@.+\..+/, 'Please add a valid email']
    },
    subdomain: {
        type: String,
        required: [true, 'Subdomain is missing']
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Please select a department']
    },
    photo: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        default: () => new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
        required: [true, 'Date is required']
    },
    time: {
        type: String,
        default: () => new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }),
        required: [true, 'Time is required']
    },
    presence: {
        type: Boolean,
        required: [true, 'Presence is required'] // true for in, false for out
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: [true, 'Worker is required']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);