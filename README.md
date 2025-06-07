# User Registration API with MongoDB, Image Upload, and Email Confirmation

This project is a RESTful User Registration API built using **Node.js**, **Express.js**, **MongoDB**, and **Mongoose**. It allows users to register by submitting their name, email, password, and a profile picture. Upon successful registration, the user’s data is saved in MongoDB, and a confirmation email is sent to verify the user's email address.

## Features

- User registration with name, email, password, and profile picture.
- Input validation with meaningful error responses.
- Email uniqueness check.
- Secure password hashing using bcrypt.
- Profile image upload and validation (format and size).
- Confirmation email sent upon registration.
- Error handling for unexpected issues.

---

## Technologies Used

- Node.js
- Express.js
- MongoDB & Mongoose
- Multer and Cloudnary(for image upload)
- Nodemailer (for sending emails)
- Bcrypt (for password hashing)
- dotenv (for managing environment variables)

---
## 🌍 API Base URL
[Backend Deployed on Render](https://user-registration-system-uniw.onrender.com/)

## Setup Instructions

1.Clone the Repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

## 2. Install Dependencies
npm install

## 3. Create .env File
PORT=5000

# MongoDB
MONGO_URL=your_mongodb_connection_string

# session secret
SECRET=your_secret_key

# Cloudinary (image uploads)
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# Email configuration
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password


# Run the Server
node app.js
