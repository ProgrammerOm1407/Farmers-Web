# Farmers Web - Grain Selling Website

A modern, responsive e-commerce website for selling grains with a glassy UI/UX design, shopping cart functionality, and checkout system with Razorpay integration.

## Features

- **Modern Glassy UI/UX Design**: Beautiful, responsive interface with glass-morphism effects
- **Product Catalog**: Browse and filter various grain products
- **Shopping Cart**: Add products to cart, update quantities, and remove items
- **User Authentication**: Mobile OTP-based login system
- **Checkout System**: Complete checkout flow with shipping and payment options
- **Payment Integration**: Razorpay payment gateway integration
- **Responsive Design**: Works on all devices (desktop, tablet, mobile)

## Pages

1. **Home Page**: Featured products, testimonials, and newsletter signup
2. **Products Page**: Complete product catalog with filtering and sorting options
3. **Login Page**: User authentication with mobile OTP verification
4. **Checkout Page**: Multi-step checkout process with Razorpay integration

## Technologies Used

- HTML5
- CSS3 (with modern features like Flexbox, Grid, and CSS Variables)
- Vanilla JavaScript (ES6+)
- Razorpay Payment Gateway
- Font Awesome Icons
- Google Fonts

## Setup Instructions

1. **Clone or download** this repository to your local machine
2. **Open the project** in your preferred code editor
3. **Launch the website** by opening `index.html` in a web browser

## Payment Integration

For the Razorpay integration to work properly:

1. Sign up for a Razorpay account at [razorpay.com](https://razorpay.com)
2. Replace the test key in `checkout.js` with your actual Razorpay key:
   ```javascript
   key: 'rzp_test_YourRazorpayKeyHere', // Replace with your Razorpay key
   ```

## Product Images

For a complete implementation:

1. Create a `products` directory inside the `images` directory
2. Add product images with names matching those referenced in the JavaScript files:
   - basmati-rice.jpg
   - wheat-flour.jpg
   - brown-rice.jpg
   - quinoa.jpg
   - etc.
3. Add a `product-placeholder.jpg` as a fallback image

## Mobile OTP Verification

The mobile OTP verification is simulated for demonstration purposes. In a production environment, you would need to:

1. Set up a backend server to handle OTP generation and verification
2. Integrate with an SMS gateway service to send actual OTPs to mobile numbers

## Customization

- **Colors**: Edit the CSS variables in `style.css` to change the color scheme
- **Products**: Modify the product data in `products.js` and `main.js` to add your own products
- **Content**: Update text content in HTML files to match your business information

## License

This project is available for personal and commercial use.

## Credits

- Icons: [Font Awesome](https://fontawesome.com)
- Fonts: [Google Fonts](https://fonts.google.com)
- Payment Gateway: [Razorpay](https://razorpay.com)

---

Created with ❤️ for grain sellers and farmers