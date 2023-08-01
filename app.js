const express = require('express');
const ProductManager = require('./ProductManager');
const productManager = new ProductManager('./products.json');


const app = express();

app.get('/products', async (req, res) => {
  const { limit } = req.query;
  const products = await productManager.getProducts();

  if (limit) {
    const limitedProducts = products.slice(0, limit);
    res.json(limitedProducts);
  } else {
    res.json(products);
  }
});

app.get('/products/:pid', async (req, res) => {
  const { pid } = req.params;
  const productId = parseInt(pid);

  if (isNaN(productId)) {
    res.status(400).json({ error: 'Invalid product ID' });
    return;
  }

  const product = await productManager.getProductById(productId);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  res.json(product);
});

const port = 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
