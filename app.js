// Twilio Notification System
// A professional notification service for client communications
// Author: Your Name
// License: MIT

require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const cron = require('node-cron');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize Express
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Twilio Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/notification-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Notification Schema
const NotificationSchema = new mongoose.Schema({
    recipient: {
        name: String,
        phone: String,
        email: String
    },
    type: {
        type: String,
        enum: ['appointment', 'order', 'reminder', 'follow-up', 'emergency']
    },
    message: String,
    scheduledTime: Date,
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'cancelled'],
        default: 'pending'
    },
    callSid: String,
    attempts: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = mongoose.model('Notification', NotificationSchema);

// Call Log Schema
const CallLogSchema = new mongoose.Schema({
    callSid: String,
    from: String,
    to: String,
    status: String,
    duration: Number,
    direction: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const CallLog = mongoose.model('CallLog', CallLogSchema);

// API Endpoints

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'operational',
        service: 'Twilio Notification System',
        version: '1.0.0'
    });
});

// Schedule a notification
app.post('/api/notifications/schedule', async (req, res) => {
    try {
        const { recipient, type, message, scheduledTime } = req.body;
        
        // Validate phone number
        if (!recipient.phone || !isValidPhoneNumber(recipient.phone)) {
            return res.status(400).json({ error: 'Invalid phone number' });
        }
        
        // Create notification
        const notification = new Notification({
            recipient,
            type,
            message,
            scheduledTime: new Date(scheduledTime)
        });
        
        await notification.save();
        
        res.json({
            success: true,
            notificationId: notification._id,
            message: 'Notification scheduled successfully'
        });
    } catch (error) {
        console.error('Error scheduling notification:', error);
        res.status(500).json({ error: 'Failed to schedule notification' });
    }
});

// Make an immediate call
app.post('/api/calls/make', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        const call = await client.calls.create({
            twiml: `<Response>
                <Say voice="alice" language="en-US">${message}</Say>
                <Pause length="1"/>
                <Say voice="alice">Thank you for your time. Have a great day!</Say>
            </Response>`,
            to: to,
            from: twilioPhoneNumber,
            statusCallback: `${process.env.BASE_URL}/api/calls/status`,
            statusCallbackMethod: 'POST',
            statusCallbackEvent: ['initiated', 'answered', 'completed']
        });
        
        // Log the call
        await CallLog.create({
            callSid: call.sid,
            from: twilioPhoneNumber,
            to: to,
            status: 'initiated',
            direction: 'outbound'
        });
        
        res.json({
            success: true,
            callSid: call.sid,
            status: call.status
        });
    } catch (error) {
        console.error('Error making call:', error);
        res.status(500).json({ error: 'Failed to make call' });
    }
});

// Call status webhook
app.post('/api/calls/status', async (req, res) => {
    try {
        const { CallSid, CallStatus, CallDuration } = req.body;
        
        await CallLog.findOneAndUpdate(
            { callSid: CallSid },
            { 
                status: CallStatus,
                duration: CallDuration
            }
        );
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error updating call status:', error);
        res.status(500).send('Error');
    }
});

// Get call history
app.get('/api/calls/history', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        
        const calls = await CallLog.find()
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset));
            
        const total = await CallLog.countDocuments();
        
        res.json({
            calls,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching call history:', error);
        res.status(500).json({ error: 'Failed to fetch call history' });
    }
});

// Get notification status
app.get('/api/notifications/:id', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json(notification);
    } catch (error) {
        console.error('Error fetching notification:', error);
        res.status(500).json({ error: 'Failed to fetch notification' });
    }
});

// Cancel a notification
app.delete('/api/notifications/:id', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        if (notification.status === 'sent') {
            return res.status(400).json({ error: 'Cannot cancel sent notification' });
        }
        
        notification.status = 'cancelled';
        await notification.save();
        
        res.json({
            success: true,
            message: 'Notification cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling notification:', error);
        res.status(500).json({ error: 'Failed to cancel notification' });
    }
});

// Cron job to process scheduled notifications
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const pendingNotifications = await Notification.find({
            status: 'pending',
            scheduledTime: { $lte: now }
        });
        
        for (const notification of pendingNotifications) {
            await processNotification(notification);
        }
    } catch (error) {
        console.error('Error processing scheduled notifications:', error);
    }
});

// Process notification function
async function processNotification(notification) {
    try {
        notification.attempts++;
        
        const call = await client.calls.create({
            twiml: `<Response>
                <Say voice="alice" language="en-US">Hello ${notification.recipient.name}. ${notification.message}</Say>
                <Pause length="1"/>
                <Say voice="alice">Press 1 to confirm receipt of this message, or press 2 to repeat.</Say>
                <Gather numDigits="1" action="${process.env.BASE_URL}/api/calls/gather" method="POST">
                    <Pause length="5"/>
                </Gather>
                <Say voice="alice">We did not receive a response. Thank you.</Say>
            </Response>`,
            to: notification.recipient.phone,
            from: twilioPhoneNumber,
            statusCallback: `${process.env.BASE_URL}/api/calls/status`,
            statusCallbackMethod: 'POST'
        });
        
        notification.status = 'sent';
        notification.callSid = call.sid;
        await notification.save();
        
        await CallLog.create({
            callSid: call.sid,
            from: twilioPhoneNumber,
            to: notification.recipient.phone,
            status: 'initiated',
            direction: 'outbound'
        });
        
    } catch (error) {
        console.error('Error processing notification:', error);
        
        if (notification.attempts >= 3) {
            notification.status = 'failed';
        }
        await notification.save();
    }
}

// Gather response handler
app.post('/api/calls/gather', (req, res) => {
    const { Digits } = req.body;
    const twiml = new twilio.twiml.VoiceResponse();
    
    if (Digits === '1') {
        twiml.say({ voice: 'alice' }, 'Thank you for confirming. Have a great day!');
    } else if (Digits === '2') {
        twiml.redirect(`${process.env.BASE_URL}/api/calls/repeat`);
    } else {
        twiml.say({ voice: 'alice' }, 'Invalid option. Goodbye.');
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// Utility function to validate phone numbers
function isValidPhoneNumber(phone) {
    // Simple validation - you can enhance this
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Twilio Notification System running on port ${PORT}`);
    console.log(`Webhook URL: ${process.env.BASE_URL}`);
});

module.exports = app;
