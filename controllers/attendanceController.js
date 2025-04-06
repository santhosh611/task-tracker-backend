const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');

// @desc    Update or create attendance record for a worker
// @route   PUT /api/attendance
// @access  Private
const putAttendance = async (req, res) => {
    try {
        const { rfid, subdomain } = req.body;

        if (!subdomain || subdomain === 'main') {
            res.status(401);
            throw new Error('Subdomain is missing, check');
        }

        if (!rfid || rfid === '') {
            res.status(401);
            throw new Error('RFID is required');
        }

        // Check if the worker exists in the Worker model
        const worker = await Worker.findOne({ subdomain, rfid });
        if (!worker) {
            res.status(404);
            throw new Error('Worker not found');
        }

        // Get the current date and time in 'Asia/Kolkata' timezone
        const indiaTimezone = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const currentDate = indiaTimezone.format(new Date());
        const currentTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' });

        // Check if this is the first attendance for the worker on the current date
        const allAttendances = await Attendance.find({ rfid, subdomain }).sort({ createdAt: -1 });

        let presence = true;
        if (allAttendances.length > 0) {
            const lastAttendance = allAttendances[0];
            presence = !lastAttendance.presence;
        }

        // Insert attendance record
        const newAttendance = await Attendance.create({
            name: worker.name,
            username: worker.username,
            rfid,
            email: worker.email,
            subdomain,
            department: worker.department,
            photo: worker.photo,
            date: currentDate,
            time: currentTime,
            presence,
            worker: worker._id
        });

        res.status(201).json({
            message: presence ? 'Attendance marked as in' : 'Attendance marked as out',
            attendance: newAttendance
        });
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