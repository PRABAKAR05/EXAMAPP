# 📝 Online Examination System

A comprehensive MERN stack application for conducting secure online examinations with role-based access control, anti-cheating measures, and automated grading.

## ✨ Features

### 👨‍💼 Admin Features

- **User Management**: Create and manage teachers and students
- **Class Management**: Create subject-based classes and assign teachers
- **Student Enrollment**: Bulk or individual student enrollment with email notifications
- **System Dashboard**: Overview of users, classes, and exams

### 👨‍🏫 Teacher Features

- **Exam Creation**: Create public or private (class-specific) exams
- **Question Management**: Add multiple-choice questions with configurable marks
- **Exam Publishing**: Publish exams with automatic email notifications to students
- **Live Monitoring**: Extend exam time during active sessions
- **Results & Analytics**: View detailed results with violation tracking
- **Class Management**: View assigned classes and enrolled students

### 👨‍🎓 Student Features

- **Subject Dashboard**: View all enrolled subjects with exam counts
- **Exam Interface**: Secure fullscreen exam environment
- **Anti-Cheating**: Tab-switch and focus-loss detection (3-strike termination)
- **Real-time Timer**: Countdown with automatic submission
- **Result View**: Detailed result breakdown after exam completion
- **Email Notifications**: Receive exam schedules and enrollment confirmations

## 🛠️ Tech Stack

### Frontend

- **React 18** with Vite
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons
- **Tailwind CSS** for styling (dark mode support)

### Backend

- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Nodemailer** for email notifications
- **bcryptjs** for password hashing
- **Compression** for response optimization

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- Gmail account (for email notifications)

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd exam-app
```

### 2. Install dependencies

**Backend:**

```bash
cd server
npm install
```

**Frontend:**

```bash
cd client
npm install
```

### 3. Environment Setup

**Backend** - Create `server/.env`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

**Frontend** - Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run the application

**Backend** (Terminal 1):

```bash
cd server
npm run dev
```

**Frontend** (Terminal 2):

```bash
cd client
npm run dev
```

Application will be available at:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## 👤 Default Credentials

**Admin:**

- Username: `admin`
- Password: `admin123`

> ⚠️ **Important**: Change the admin password immediately after first login!

## 📁 Project Structure

```
exam-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # Axios configuration
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   └── App.jsx        # Main app component
│   └── package.json
│
├── server/                # Express backend
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Auth & error handling
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── index.js           # Server entry point
│
└── README.md
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Secure exam session management
- Anti-cheating violation tracking
- 1-minute exam lockdown before start time

## 📧 Email Notifications

The system sends automated emails for:

- User account creation (credentials)
- Class enrollment
- Teacher assignment/reassignment
- Exam scheduling
- Account deletion

## 🎯 Key Workflows

### Creating an Exam

1. Admin creates a class and assigns teacher
2. Admin enrolls students into the class
3. Teacher creates an exam (private or public)
4. Teacher adds questions with marks
5. Teacher publishes exam (students receive email)
6. Students take exam during scheduled time
7. Teacher views results and analytics

### Taking an Exam

1. Student logs in and views dashboard
2. Student selects subject/class
3. Student clicks "Start Exam" (triggers fullscreen)
4. Student answers questions
5. Auto-submit on timer expiration or manual submit
6. View results after exam end time

## 📊 Dashboard Limits

- **Student Dashboard**: Shows all enrolled subjects + 9 most recent exams
- **Teacher Dashboard**: Shows 9 most recently created exams
- Real-time exam counts per subject

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to:

- Vercel (Frontend)
- Render (Backend)
- MongoDB Atlas (Database)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with MERN stack
- Icons by Lucide React
- Designed with Tailwind CSS

---

**Made with ❤️ for secure online examinations**
