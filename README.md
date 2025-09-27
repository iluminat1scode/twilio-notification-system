# Twilio Notification System 📞

A professional Node.js application for managing automated voice notifications and client communications using Twilio APIs.

## 🚀 Features

- **Automated Voice Calls**: Schedule and send voice notifications to clients
- **Appointment Reminders**: Automated reminder system for scheduled appointments
- **Order Confirmations**: Instant voice confirmations for order updates
- **IVR Support**: Interactive Voice Response for customer interaction
- **Call Logging**: Comprehensive logging of all communication attempts
- **RESTful API**: Easy integration with existing systems
- **Webhook Support**: Real-time call status updates
- **MongoDB Integration**: Persistent storage for notifications and logs
- **Cron Scheduling**: Automated processing of scheduled notifications

## 📋 Prerequisites

- Node.js (v14.0.0 or higher)
- MongoDB (v4.4 or higher)
- Twilio Account (with verified phone numbers)
- ngrok or similar service for local webhook testing

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/twilio-notification-system.git
cd twilio-notification-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
MONGODB_URI=mongodb://localhost:27017/notification-system
BASE_URL=https://your-domain.com
PORT=3000
```

4. Start MongoDB:
```bash
mongod
```

5. Run the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 📡 API Endpoints

### Health Check
```http
GET /health
```

### Schedule a Notification
```http
POST /api/notifications/schedule
Content-Type: application/json

{
  "recipient": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  },
  "type": "appointment",
  "message": "Your appointment is tomorrow at 10 AM",
  "scheduledTime": "2024-01-01T10:00:00Z"
}
```

### Make Immediate Call
```http
POST /api/calls/make
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "This is an urgent notification"
}
```

### Get Call History
```http
GET /api/calls/history?limit=10&offset=0
```

### Get Notification Status
```http
GET /api/notifications/:id
```

### Cancel Notification
```http
DELETE /api/notifications/:id
```

## 🔧 Configuration

### Webhook Setup

For local development, use ngrok to expose your local server:

```bash
ngrok http 3000
```

Update your `.env` file with the ngrok URL:
```env
BASE_URL=https://your-ngrok-id.ngrok.io
```

### MongoDB Schema

The system uses two main collections:

1. **Notifications**: Stores scheduled and processed notifications
2. **CallLogs**: Maintains detailed logs of all calls

## 📊 Use Cases

This system is designed for legitimate business communications:

- **Healthcare**: Appointment reminders and follow-ups
- **E-commerce**: Order confirmations and delivery updates
- **Service Industry**: Booking confirmations and schedule changes
- **Customer Support**: Automated follow-up calls
- **Emergency Notifications**: Critical service alerts

## 🔒 Security & Compliance

- **TCPA Compliance**: All recipients must opt-in before receiving calls
- **Time Restrictions**: Calls only between 9 AM - 8 PM local time
- **Rate Limiting**: Prevents excessive calling
- **Secure Storage**: All credentials stored in environment variables
- **Input Validation**: Phone number and data validation
- **Error Handling**: Comprehensive error handling and logging

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

## 🙏 Acknowledgments

- [Twilio](https://www.twilio.com) for their excellent communication APIs
- [Express.js](https://expressjs.com) for the web framework
- [MongoDB](https://www.mongodb.com) for database solutions

## 📈 Project Status

This project is actively maintained and used in production environments. Regular updates ensure compatibility with the latest Twilio API versions.

---

**Note**: This system is designed for legitimate business communications only. Users must ensure compliance with all applicable regulations including TCPA, GDPR, and local telecommunication laws.
