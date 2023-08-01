const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const PRODUCTS_FILE_PATH = path.join(__dirname, 'products.json');
const CARTS_FILE_PATH = path.join(__dirname, 'cart.json');

class ProductManager {
  constructor(productsFilePath) {
    this.productsFilePath = productsFilePath;
    this.products = [];
    this.loadProducts();
  }

  loadProducts() {
    try {
      const data = fs.readFileSync(this.productsFilePath, 'utf-8');
      this.products = JSON.parse(data);
    } catch (error) {
      console.error('Error loading products:', error.message);
    }
  }

  saveProducts() {
    try {
      fs.writeFileSync(this.productsFilePath, JSON.stringify(this.products, null, 2));
    } catch (error) {
      console.error('Error saving products:', error.message);
    }
  }

  getNextProductId() {
    const maxId = this.products.reduce((max, product) => Math.max(max, product.id), 0);
    return maxId + 1;
  }

  isProductValid(product) {
    return (
      product.title &&
      product.description &&
      product.price &&
      product.code &&
      product.stock &&
      !this.products.some(p => p.code === product.code)
    );
  }

  addProduct(product) {
    if (!this.isProductValid(product)) {
      throw new Error('Invalid product data');
    }

    const newProduct = {
      id: this.getNextProductId(),
      status: true,
      ...product,
    };

    this.products.push(newProduct);
    this.saveProducts();
    return newProduct;
  }

  getProductById(id) {
    return this.products.find(p => p.id === id);
  }

  updateProduct(productId, updatedFields) {
    const product = this.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (updatedFields.id) {
      throw new Error('Cannot update product ID');
    }

    Object.assign(product, updatedFields);
    this.saveProducts();
    return product;
  }

  deleteProduct(productId) {
    const index = this.products.findIndex(p => p.id === productId);
    if (index === -1) {
      throw new Error('Product not found');
    }

    this.products.splice(index, 1);
    this.saveProducts();
  }
}

const productManager = new ProductManager(PRODUCTS_FILE_PATH);

class CartManager {
  constructor(cartsFilePath) {
    this.cartsFilePath = cartsFilePath;
    this.carts = [];
    this.loadCarts();
  }

  addProductToCart(cartId, productId, quantity = 1) {
    const cart = this.getCartById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const existingProduct = cart.products.find(product => product.id === productId);
    if (existingProduct) {
      existingProduct.quantity += quantity;
    } else {
      cart.products.push({ id: productId, quantity });
    }

    this.saveCarts();
    return cart;
  }


  loadCarts() {
    try {
      const data = fs.readFileSync(this.cartsFilePath, 'utf-8');
      this.carts = JSON.parse(data);
    } catch (error) {
      console.error('Error loading carts:', error.message);
    }
  }

  saveCarts() {
    try {
      fs.writeFileSync(this.cartsFilePath, JSON.stringify(this.carts, null, 2));
    } catch (error) {
      console.error('Error saving carts:', error.message);
    }
  }

  getNextCartId() {
    const maxId = this.carts.reduce((max, cart) => Math.max(max, cart.id), 0);
    return maxId + 1;
  }

  createCart() {
    const newCart = {
      id: this.getNextCartId(),
      products: [],
    };

    this.carts.push(newCart);
    this.saveCarts();
    return newCart;
  }

  getCartById(cartId) {
    return this.carts.find(cart => cart.id === cartId);
  }

  addProductToCart(cartId, productId) {
    const cart = this.getCartById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const existingProduct = cart.products.find(product => product.id === productId);
    if (existingProduct) {
      existingProduct.quantity++;
    } else {
      cart.products.push({ id: productId, quantity: 1 });
    }

    this.saveCarts();
    return cart;
  }
}

const cartManager = new CartManager(CARTS_FILE_PATH);

// Rutas para el manejo de productos
app.get('/api/products', (req, res) => {
  const { limit } = req.query;
  const products = productManager.products;

  if (limit) {
    const limitedProducts = products.slice(0, limit);
    res.json(limitedProducts);
  } else {
    res.json(products);
  }
});

app.get('/api/products/:pid', (req, res) => {
  const { pid } = req.params;
  const productId = parseInt(pid);

  if (isNaN(productId)) {
    res.status(400).json({ error: 'Invalid product ID' });
    return;
  }

  const product = productManager.getProductById(productId);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  res.json(product);
});

app.post('/api/products', (req, res) => {
  try {
    const product = req.body;
    const newProduct = productManager.addProduct(product);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/products/:pid', (req, res) => {
  try {
    const { pid } = req.params;
    const productId = parseInt(pid);

    if (isNaN(productId)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    const updatedProduct = req.body;
    const product = productManager.updateProduct(productId, updatedProduct);
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/products/:pid', (req, res) => {
  try {
    const { pid } = req.params;
    const productId = parseInt(pid);

    if (isNaN(productId)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    productManager.deleteProduct(productId);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rutas para el manejo de carritos
app.post('/api/carts', (req, res) => {
  try {
    const newCart = cartManager.createCart();
    res.status(201).json(newCart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/carts/:cid', (req, res) => {
  try {
    const { cid } = req.params;
    const cartId = parseInt(cid);

    if (isNaN(cartId)) {
      res.status(400).json({ error: 'Invalid cart ID' });
      return;
    }

    const cart = cartManager.getCartById(cartId);
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    res.json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/carts/:cid/product/:pid', (req, res) => {
  try {
    const { cid, pid } = req.params;
    const cartId = parseInt(cid);
    const productId = parseInt(pid);

    if (isNaN(cartId) || isNaN(productId)) {
      res.status(400).json({ error: 'Invalid cart or product ID' });
      return;
    }

    const { quantity } = req.body;
    const cart = cartManager.addProductToCart(cartId, productId, quantity);
    res.json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


const port = 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
