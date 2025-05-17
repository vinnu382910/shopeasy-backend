# ShopEasy - eCommerce Backend API

![Node.js](https://img.shields.io/badge/Node.js-14.x%2B-green)
![Express](https://img.shields.io/badge/Express-4.x-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-4.x-green)
![Cloudinary](https://img.shields.io/badge/Cloudinary-API-orange)

A robust backend API for ShopEasy eCommerce platform built with Node.js, Express, MongoDB, and Cloudinary for image storage.

## Features

- **User Authentication**: Secure JWT-based authentication for users and merchants
- **Product Management**: CRUD operations for products with image uploads to Cloudinary
- **Shopping Cart**: Full cart functionality with item management
- **Wishlist**: Save favorite products for later
- **Order Processing**: Complete order lifecycle management (**We will add this feature soon**)
- **Profile Management**: User and merchant profile updates

## API Documentation

### Base URL
`https://shopeasy-backend-0wjl.onrender.com/`

### Authentication
All endpoints (except public ones) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## API Endpoints

### 1. Authentication
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/auth/signup` | POST | User registration | Public |
| `/auth/login` | POST | User login | Public |
| `/auth/merchant/signup` | POST | Merchant registration | Public |
| `/auth/merchant/login` | POST | Merchant login | Public |

### 2. Products
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/products` | GET | Get all products (paginated) | Public |
| `/products/:id` | GET | Get product by ID | Public |
| `/products/search` | GET | Search products | Public |
| `/products/category/:category` | GET | Get products by category | Public |
| `/merchant/additem` | POST | Add new product | Merchant |
| `/merchant/updateitem/:id` | PUT | Update product | Merchant |
| `/merchant/deleteitem/:id` | DELETE | Delete product | Merchant |
| `/merchant/myproducts` | GET | Get merchant's products | Merchant |

### 3. Cart
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/usercart` | GET | Get user cart | User |
| `/usercart` | POST | Add to cart | User |
| `/usercart/:id` | PUT | Update cart item | User |
| `/usercart/:id` | DELETE | Remove from cart | User |

### 4. Wishlist
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/wishlist` | GET | Get user wishlist | User |
| `/wishlist` | POST | Add to wishlist | User |
| `/wishlist/:id` | DELETE | Remove from wishlist | User |

### 5. Orders
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/orders` | GET | Get user orders | User |
| `/orders/:id` | GET | Get order by ID | User |
| `/orders` | POST | Place new order | User |
| `/orders/:id/cancel` | PUT | Cancel order | User |
| `/merchant/orders` | GET | Get merchant orders | Merchant |
| `/merchant/orders/:id/status` | PUT | Update order status | Merchant |

### 6. Profile
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/user/profile` | GET | Get user profile | User |
| `/user/profile` | PUT | Update user profile | User |
| `/merchant/profile` | GET | Get merchant profile | Merchant |
| `/merchant/profile` | PUT | Update merchant profile | Merchant |

## Database Models

### User
```typescript
{
  name: String,
  email: String,
  password: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  isPhoneVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Merchant
```typescript
{
  merchantName: String,
  email: String,
  password: String,
  phoneNumber: String,
  address: String,
  businessName: String,
  gstNumber: String,
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Product
```typescript
{
  title: String,
  description: String,
  price: Number,
  discount: Number,
  finalPrice: Number,
  currency: String,
  category: String,
  subcategory: String,
  images: [String], // Cloudinary URLs
  deliveryCharge: Number,
  deliveryTime: String,
  warranty: String,
  returnPolicy: String,
  tags: String,
  stock: Number,
  rating: Number,
  featured: Boolean,
  specifications: [{
    key: String,
    value: String
  }],
  merchantId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## Image Uploads with Cloudinary

All product images are automatically uploaded to Cloudinary when merchants add new products. The system:
1. Accepts 1-5 image files per product (max 5MB each)
2. Validates file types (JPG/PNG/WEBP)
3. Uploads to Cloudinary with optimized settings
4. Stores the secure URLs in MongoDB

## Environment Variables

Create a `.env` file with the following variables:

```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/vinnu382910/shopeasy-backend
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. For production:
```bash
npm start
```

## Technologies Used

- **Node.js**: JavaScript runtime environment
- **Express**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Cloudinary**: Image and video management
- **JWT**: JSON Web Tokens for authentication
- **Multer**: File upload middleware
- **Bcrypt**: Password hashing
- **Validator**: Input validation

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
```

This README provides comprehensive documentation for your eCommerce backend, including:
- API endpoints organized by functionality
- Database schemas
- Authentication details
- Cloudinary integration information
- Setup instructions
- Technology stack

You can customize it further with:
- Deployment instructions
- API usage examples
- Testing guidelines
- Contact information
- Screenshots of API responses (if available)
