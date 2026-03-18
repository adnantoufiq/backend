# 📱 Mini Social Feed App

A full-stack social media application built with **Node.js/Express** (backend) and **React Native/Expo** (mobile). Users can post text updates, like and comment on posts, and receive real-time Firebase push notifications.

---

## 📁 Repository Structure

```
mini-social-feed/
├── backend/          # Node.js + Express REST API
└── mobile/           # React Native Expo mobile app
```

---

## 🔧 Backend Setup (Node.js + Express + MongoDB)

### Prerequisites
- Node.js >= 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Firebase project (for push notifications)

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs (use a long random string) |
| `JWT_EXPIRES_IN` | JWT expiry (e.g. `7d`) |
| `FIREBASE_PROJECT_ID` | From Firebase Console → Project Settings |
| `FIREBASE_PRIVATE_KEY` | From Firebase service account JSON |
| `FIREBASE_CLIENT_EMAIL` | From Firebase service account JSON |

> **Firebase Setup:** Go to Firebase Console → Project Settings → Service Accounts → Generate New Private Key. Copy the values into your `.env`.

### Running the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:5000`.

---

## 📡 API Documentation

**Base URL:** `http://localhost:5000/api`

All protected routes require the header:
```
Authorization: Bearer <token>
```

### Auth Endpoints

#### `POST /auth/signup`
Register a new user.

**Request body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": { "_id": "...", "username": "john_doe", "email": "john@example.com" },
    "token": "<jwt>"
  }
}
```

---

#### `POST /auth/login`
Authenticate an existing user.

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": { "user": { ... }, "token": "<jwt>" }
}
```

---

#### `GET /auth/me` 🔒
Get the currently authenticated user's profile.

---

#### `PUT /auth/fcm-token` 🔒
Save or update the device's FCM token for push notifications.

**Request body:**
```json
{ "fcmToken": "device-fcm-token-string" }
```

---

### Post Endpoints

#### `POST /posts` 🔒
Create a new text-only post.

**Request body:**
```json
{ "content": "Hello world! This is my first post." }
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "post": {
      "_id": "...",
      "author": { "_id": "...", "username": "john_doe" },
      "content": "Hello world!",
      "likes": [],
      "comments": [],
      "likesCount": 0,
      "commentsCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

#### `GET /posts` 🔒
Retrieve all posts, newest first, with pagination and optional username filter.

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Posts per page (max 50) |
| `username` | string | — | Filter posts by author username |

**Example:** `GET /posts?page=1&limit=10&username=john_doe`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "posts": [ { ... } ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

#### `POST /posts/:id/like` 🔒
Toggle like/unlike on a post. Sends an FCM push notification to the post author.

**Response `200`:**
```json
{
  "success": true,
  "message": "Post liked",
  "data": { "liked": true, "likesCount": 5 }
}
```

---

#### `POST /posts/:id/comment` 🔒
Add a comment to a post. Sends an FCM push notification to the post author.

**Request body:**
```json
{ "text": "Great post!" }
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "comment": {
      "_id": "...",
      "user": { "_id": "...", "username": "jane_doe" },
      "text": "Great post!",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Error Response Format

All errors follow this structure:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" }
  ]
}
```

| Status | Meaning |
|---|---|
| `400` | Bad request / invalid ID |
| `401` | Unauthorized (missing or invalid token) |
| `404` | Resource not found |
| `409` | Conflict (duplicate email/username) |
| `422` | Validation failed |
| `500` | Internal server error |

---

## 📲 Mobile Setup (React Native + Expo)

### Prerequisites
- Node.js >= 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- [EAS CLI](https://docs.expo.dev/eas-update/getting-started/) (for builds): `npm install -g eas-cli`
- Android Studio or Xcode (for emulators), or the Expo Go app

### Installation

```bash
cd mobile
npm install
```

### Configuration

1. **API URL** — In `app.config.ts`, update the `API_BASE_URL`:
   - Android emulator talking to local backend: `http://10.0.2.2:5000/api`
   - iOS simulator: `http://localhost:5000/api`
   - Physical device: use your machine's LAN IP, e.g. `http://192.168.1.100:5000/api`

2. **Firebase / Push Notifications:**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Add an Android app → download `google-services.json` → place it in `mobile/`
   - Update `projectId` in `app.config.ts` and `notification.service.ts` with your EAS project ID

3. **EAS Project ID** — Run `eas init` in the `mobile/` folder to generate a project ID and update `app.config.ts`.

### Running the App

```bash
# Start Expo dev server
npm start

# Android emulator
npm run android

# iOS simulator
npm run ios
```

### Building APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build preview APK for Android
eas build -p android --profile preview
```

The APK download link will appear in the terminal and at [expo.dev](https://expo.dev).

---

## ✨ Features

### Backend
- JWT authentication (signup / login)
- Password hashing with bcrypt (12 salt rounds)
- Input validation on all endpoints using `express-validator`
- Paginated post feed (newest first), filterable by username
- Like / Unlike toggle with idempotent behavior
- Comment creation with 500-character limit
- FCM push notifications on like and comment events (skips self-actions)
- Centralized error handling with consistent API response format
- MongoDB indexes for efficient paginated queries

### Mobile App
- Login & Signup screens with full client-side validation
- Persistent session using AsyncStorage (survives app restarts)
- Scrollable feed with infinite pagination (load-more on scroll)
- Filter feed by username (search bar)
- Like / Unlike posts with optimistic UI update
- Expand/collapse comments per post
- Add comments inline without leaving the feed
- Create Post screen with live character counter and progress bar
- Profile screen showing user stats (total posts, total likes received)
- Pull-to-refresh on all list screens
- FCM push notification registration on login
- Foreground notification handling
- Sign out with confirmation dialog
- Tab-based navigation (Feed / Create Post / Profile)

---

## 🔔 Push Notification Flow

1. User logs in → app calls `notificationService.syncTokenWithBackend()`
2. Expo requests notification permission from the OS
3. Device token is sent to `PUT /api/auth/fcm-token` and saved on the user record
4. When User A likes/comments on User B's post:
   - Backend controller fires `sendPushNotification()` via Firebase Admin SDK
   - FCM delivers the notification to User B's device
   - If the app is in the foreground, the notification is shown via `Notifications.setNotificationHandler`

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, MongoDB, Mongoose |
| Authentication | JWT (jsonwebtoken), bcryptjs |
| Validation | express-validator |
| Push Notifications | Firebase Admin SDK (FCM) |
| Mobile | React Native, Expo (SDK 50), Expo Router |
| Navigation | Expo Router (file-based routing) |
| State Management | React Context API |
| HTTP Client | Axios |
| Local Storage | AsyncStorage |
| Notifications | expo-notifications |
