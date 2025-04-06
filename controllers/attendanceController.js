const Attendance = require('../models/attendanceModel');

// @desc    Update or create attendance record for a worker
// @route   PUT /api/attendance
// @access  Private
const putAttendance = async (req, res) => {
    try {
        const { rfid, subdomain } = req.body;

        if (!subdomain || subdomain == 'main') {
            res.status(401);
            throw new Error('Subdomain is missing, check');
        }

        if (!rfid || rfid == '') {
            res.status(401);
            throw new Error('RFID is required');
        }

        const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

        const lastAttendance = await Attendance.findOne({ rfid, subdomain }).sort({ createdAt: -1 });

        if (lastAttendance) {
            const lastDate = new Date(lastAttendance.date).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

            if (lastDate === currentDate) {
                // If it's the same day, toggle the presence
                lastAttendance.presence = !lastAttendance.presence;
                await lastAttendance.save();
                return res.status(200).json({ message: 'Attendance updated successfully', attendance: lastAttendance });
            }
        }

        // If it's a new day or no previous record exists, create a new attendance record
        const newAttendance = await Attendance.create({
            ...req.body,
            date: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
            time: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }),
            presence: true
        });

        res.status(201).json({ message: 'Attendance created successfully', attendance: newAttendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Retrieve all attendance records for a specific subdomain
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
    try {
        const { subdomain } = req.body;

        if (!subdomain || subdomain == 'main') {
            res.status(401);
            throw new Error('Subdomain is missing, check');
        }

        const attendanceData = await Attendance.find({ subdomain });

        res.status(200).json({ message: 'Attendance data retrieved successfully', attendance: attendanceData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Retrieve attendance records for a specific worker by RFID and subdomain
// @route   GET /api/attendance/worker
// @access  Public
const getWorkerAttendance = async (req, res) => {
    try {
        const { rfid, subdomain } = req.body;

        if (!subdomain || subdomain == 'main') {
            res.status(401);
            throw new Error('Subdomain is missing, check');
        }

        if (!rfid || rfid == '') {
            res.status(401);
            throw new Error('RFID is required');
        }

        const workerAttendance = await Attendance.find({ rfid, subdomain });

        res.status(200).json({ message: 'Worker attendance data retrieved successfully', attendance: workerAttendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { putAttendance, getAttendance, getWorkerAttendance };