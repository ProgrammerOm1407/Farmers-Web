# Firebase Setup Guide for Farmers Web

This guide will help you set up Firebase for your Farmers Web application to store orders, customer data, and user authentication.

## Prerequisites

1. A Google account
2. Access to the Firebase Console

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "farmers-web")
4. Choose whether to enable Google Analytics (recommended)
5. Select or create a Google Analytics account if you enabled it
6. Click "Create project"

## Step 2: Set up Firestore Database

1. In your Firebase project console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for now (you can secure it later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## Step 3: Set up Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

## Step 4: Get your Firebase Configuration

1. In your Firebase project console, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the web icon (`</>`) to add a web app
5. Enter an app nickname (e.g., "farmers-web-app")
6. Check "Also set up Firebase Hosting" if you want to host your app on Firebase
7. Click "Register app"
8. Copy the Firebase configuration object

## Step 5: Update Firebase Configuration

1. Open `js/firebase-config.js` in your project
2. Replace the placeholder configuration with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id",
  measurementId: "your-actual-measurement-id"
};
```

## Step 6: Set up Firestore Security Rules

1. In your Firebase project console, go to "Firestore Database"
2. Click on the "Rules" tab
3. Replace the default rules with the following (for development):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow read access to products for everyone
    match /products/{productId} {
      allow read: if true;
    }
    
    // Allow write access to orders and customers for everyone (for guest checkout)
    match /orders/{orderId} {
      allow read, write: if true;
    }
    
    match /customers/{customerId} {
      allow read, write: if true;
    }
    
    // Allow write access to analytics for everyone
    match /analytics/{eventId} {
      allow write: if true;
    }
  }
}
```

4. Click "Publish"

**Note:** These rules are permissive for development. In production, you should implement more restrictive rules.

## Step 7: Initialize Sample Data (Optional)

You can add some sample products to your Firestore database:

1. Go to "Firestore Database" in your Firebase console
2. Click "Start collection"
3. Collection ID: `products`
4. Add documents with the following structure:

```json
{
  "name": "Organic Rice",
  "price": 120,
  "category": "Grains",
  "description": "Premium quality organic rice",
  "image": "../images/products/rice.jpg",
  "stock": 100,
  "unit": "kg"
}
```

## Step 8: Test the Integration

1. Open your Farmers Web application
2. Add some items to the cart
3. Go through the checkout process
4. Check your Firestore database to see if the order was saved

## Database Collections Structure

Your Firebase project will have the following collections:

### Orders Collection
```json
{
  "orderNumber": "FW123456ABC",
  "customerId": "customer_doc_id",
  "userId": "user_uid_if_authenticated",
  "customerInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  },
  "items": [
    {
      "id": "product_id",
      "name": "Product Name",
      "price": 100,
      "quantity": 2,
      "total": 200
    }
  ],
  "pricing": {
    "subtotal": 200,
    "shippingCost": 40,
    "tax": 10,
    "discount": 0,
    "total": 250
  },
  "shippingAddress": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "pincode": "123456"
  },
  "paymentMethod": "Razorpay",
  "paymentId": "pay_xyz123",
  "status": "processing",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Customers Collection
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "address": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "pincode": "123456"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Users Collection (for authenticated users)
```json
{
  "uid": "firebase_user_uid",
  "fullname": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Analytics Collection
```json
{
  "event": "order_placed",
  "orderId": "order_doc_id",
  "orderNumber": "FW123456ABC",
  "paymentMethod": "Razorpay",
  "total": 250,
  "itemCount": 3,
  "userId": "user_uid_or_null",
  "customerId": "customer_doc_id",
  "timestamp": "timestamp"
}
```

## Production Security Considerations

When deploying to production, consider:

1. **Firestore Security Rules**: Implement proper security rules
2. **API Key Restrictions**: Restrict your API keys in Google Cloud Console
3. **Authentication**: Require authentication for sensitive operations
4. **Data Validation**: Validate data on the client and server side
5. **Rate Limiting**: Implement rate limiting to prevent abuse

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure you're serving your app from a web server, not opening HTML files directly
2. **Permission Denied**: Check your Firestore security rules
3. **Configuration Errors**: Verify your Firebase configuration is correct
4. **Module Import Errors**: Ensure you're using the correct Firebase SDK version

### Testing Locally:

You can use Firebase emulators for local development:

```bash
npm install -g firebase-tools
firebase login
firebase init emulators
firebase emulators:start
```

Then uncomment the emulator connection lines in `firebase-config.js`.

## Support

For more detailed information, visit the [Firebase Documentation](https://firebase.google.com/docs).

If you encounter issues, check the browser console for error messages and refer to the Firebase documentation or community forums.