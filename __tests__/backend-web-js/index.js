const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

// User and Product Interfaces
// In JavaScript, we don't use TypeScript interfaces, so we skip them

class ApiServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 4000;

    // In-memory data stores (simulating a database)
    this.users = [];
    this.products = [];

    this.setupMiddleware();
    this.setupRoutes();
    this.seedInitialData();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(bodyParser.json());

    // Simple logging middleware
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  seedInitialData() {
    // Seed initial users
    this.users = [
      {
        id: uuidv4(),
        name: "John Doe",
        email: "john.doe@example.com",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      },
      {
        id: uuidv4(),
        name: "Jane Smith",
        email: "jane.smith@example.com",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
      },
    ];

    // Seed initial products
    this.products = [
      {
        id: uuidv4(),
        name: "Wireless Headphones",
        price: 199.99,
        description: "High-quality noise-cancelling wireless headphones",
      },
      {
        id: uuidv4(),
        name: "Smart Watch",
        price: 249.99,
        description: "Advanced fitness tracking smartwatch",
      },
    ];
  }

  setupRoutes() {
    // User Profile Routes
    this.app.get("/user-profile", this.getUserProfile.bind(this));
    this.app.put("/user-profile", this.updateUserProfile.bind(this));

    // Products Routes
    this.app.get("/products", this.getProducts.bind(this));
    this.app.post("/products", this.createProduct.bind(this));
    this.app.put("/products/:id", this.updateProduct.bind(this));
    this.app.delete("/products/:id", this.deleteProduct.bind(this));

    // Error handling middleware
    this.app.use(this.errorHandler.bind(this));
  }

  // User Profile Endpoints
  getUserProfile(req, res) {
    const user = this.users[0];

    if (!user) {
      return res.status(404).json({
        title: "User Not Found",
        desc: "The user you are looking for does not exist.",
        error: "User not found",
      });
    }

    res.json(user);
  }

  updateUserProfile(req, res) {
    const { name, email } = req.body;
    const user = this.users[0];

    if (!user) {
      return res.status(404).json({
        title: "User Not Found",
        desc: "The user you are trying to update does not exist.",
        error: "User not found",
      });
    }

    user.name = name || user.name;
    user.email = email || user.email;

    res.json(user);
  }

  // Products Endpoints
  getProducts(req, res) {
    res.json(this.products);
  }

  createProduct(req, res) {
    const { name, price, description } = req.body;

    // Check if the user has already added 3 products
    if (this.products.length >= 3) {
      return res.status(400).json({
        title: "Product Limit Exceeded",
        desc: "You can only add up to 3 products.",
        error: "Product limit exceeded",
        showErrorToast: true,
      });
    }

    if (!name || !price) {
      return res.status(400).json({
        title: "Bad Request",
        desc: "Name and price are required to create a product.",
        error: "Name and price are required",
      });
    }

    const newProduct = {
      id: uuidv4(),
      name,
      price,
      description: description || "",
    };

    this.products.push(newProduct);
    res.status(201).json(newProduct);
  }

  updateProduct(req, res) {
    const { id } = req.params;
    const { name, price, description } = req.body;

    const productIndex = this.products.findIndex((p) => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({
        title: "Product Not Found",
        desc: "The product you are trying to update does not exist.",
        error: "Product not found",
      });
    }

    this.products[productIndex] = {
      ...this.products[productIndex],
      name: name || this.products[productIndex].name,
      price: price || this.products[productIndex].price,
      description: description || this.products[productIndex].description,
    };

    res.json(this.products[productIndex]);
  }

  deleteProduct(req, res) {
    const { id } = req.params;

    const productIndex = this.products.findIndex((p) => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({
        title: "Product Not Found",
        desc: "The product you are trying to delete does not exist.",
        error: "Product not found",
      });
    }

    const deletedProduct = this.products.splice(productIndex, 1)[0];
    res.json(deletedProduct);
  }

  // Global Error Handler
  errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({
      title: "Internal Server Error",
      desc: "An unexpected error occurred while processing the request.",
      error: "Something went wrong!",
      message: err.message,
    });
  }

  // Start the server
  start() {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}

// Create and start the server
const server = new ApiServer();
server.start();

module.exports = server;
