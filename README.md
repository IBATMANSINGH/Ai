# Invoice Generator

A comprehensive web application for creating, managing, and tracking invoices with product management capabilities.

## Overview

Invoice Generator is a Node.js-based web application that allows users to create and manage invoices, track products, and maintain business settings. The application uses Express.js for the backend, EJS for templating, and SQLite for data storage.

## Features

- **Invoice Management**: Create, view, edit, and delete invoices
- **Product Management**: Add, update, and remove products with image support
- **Business Settings**: Customize company information, logo, and invoice settings
- **Invoice History**: Track and review past invoices
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS templates, HTML, CSS, JavaScript
- **Database**: SQLite3
- **Image Processing**: Sharp, Multer
- **Logging**: Morgan

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd Invoice_Generator
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the application:
   ```
   npm start
   ```

   For development with auto-reload:
   ```
   npm run dev
   ```

5. Access the application in your browser:
   ```
   http://localhost:3000
   ```

## Project Structure

- **controllers/**: Contains business logic for products, invoices, and settings
- **models/**: Database models and operations
- **routes/**: API routes and endpoints
- **views/**: EJS templates for the frontend
- **public/**: Static assets (CSS, JavaScript, images)
- **uploads/**: Storage for uploaded product images
- **data/**: SQLite database files
- **utils/**: Utility functions

## API Endpoints

### Products
- `GET /api/products`: Get all products
- `GET /api/products/:id`: Get a specific product
- `POST /api/products`: Create a new product
- `PUT /api/products/:id`: Update a product
- `DELETE /api/products/:id`: Delete a product

### Invoices
- `GET /api/invoices`: Get all invoices
- `GET /api/invoices/:id`: Get a specific invoice
- `POST /api/invoices`: Create a new invoice
- `PUT /api/invoices/:id`: Update an invoice
- `DELETE /api/invoices/:id`: Delete an invoice

### Settings
- `GET /settings`: View settings page
- `POST /settings`: Update settings

## License

This project is licensed under the ISC License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

[Ankit Singh]
