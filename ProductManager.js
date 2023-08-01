const fs = require('fs');

class ProductManager {
  constructor(filePath) {
    this.path = filePath;
    this.products = [];
    this.nextId = 1;
    this.loadProducts();
  }

  addProduct(product) {
    if (!this.isProductValid(product)) {
      console.log("Error: faltan campos obligatorios.");
      return;
    }

    const newProduct = {
      id: this.nextId,
      ...product
    };

    this.products.push(newProduct);
    this.nextId++;

    this.saveProducts();
  }

  isProductValid(product) {
    const { title, description, price, thumbnail, code, stock } = product;
    if (!title || !description || !price || !thumbnail || !code || !stock) {
      return false;
    }

    if (this.products.some(p => p.code === code)) {
      console.log(`Error: el código '${code}' ya está en uso.`);
      return false;
    }

    return true;
  }

  getProductById(id) {
    const product = this.products.find(p => p.id === id);
    if (!product) {
      console.log("Error: Producto no encontrado.");
      return;
    }

    return product;
  }

  getProducts() {
    return this.products;
  }

  updateProduct(id, updatedFields) {
    const productIndex = this.products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      console.log("Error: Producto no encontrado.");
      return;
    }

    const updatedProduct = {
      ...this.products[productIndex],
      ...updatedFields
    };

    this.products[productIndex] = updatedProduct;

    this.saveProducts();
  }

  deleteProduct(id) {
    const productIndex = this.products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      console.log("Error: Producto no encontrado.");
      return;
    }

    this.products.splice(productIndex, 1);

    this.saveProducts();
  }

  loadProducts() {
    try {
      const data = fs.readFileSync(this.path, 'utf8');
      this.products = JSON.parse(data);
      if (Array.isArray(this.products)) {
        const lastProduct = this.products[this.products.length - 1];
        this.nextId = lastProduct ? lastProduct.id + 1 : 1;
      }
    } catch (error) {
      console.log(`Error al cargar los productos desde el archivo: ${error}`);
    }
  }

  saveProducts() {
    try {
      const data = JSON.stringify(this.products, null, 2);
      fs.writeFileSync(this.path, data, 'utf8');
    } catch (error) {
      console.log(`Error al guardar los productos en el archivo: ${error}`);
    }
  }
}
module.exports = ProductManager;
// Ejemplo de uso
const filePath = 'products.json';
const manager = new ProductManager(filePath);

manager.addProduct({
  title: "God of War",
  description: "juego de dioses",
  price: 5000,
  thumbnail: "https://gmedia.playstation.com/is/image/SIEPDC/god-of-war-listing-thumb-01-ps4-us-12jun17?$1600px$",
  code: "P001",
  stock: 10
});

manager.addProduct({
  title: "The last of us",
  description: "juego de zombies",
  price: 4000,
  thumbnail: "https://gmedia.playstation.com/is/image/SIEPDC/the-last-of-us-part-i-keyart-01-en-18may22?$1600px$",
  code: "P002",
  stock: 5
});

manager.addProduct({
  title: "Uncharted",
  description: "juego de aventura",
  price: 3000,
  thumbnail: "https://gmedia.playstation.com/is/image/SIEPDC/uncharted-legacy-of-thieves-hero-keyart-02-en-15sep21?$1200px$",
  code: "P003",
  stock: 15
});

// Obtener todos los productos
const allProducts = manager.getProducts();
console.log(allProducts);

// Obtener un producto por su ID
// const product1 = manager.getProductById(1);
// console.log(product1);

// Actualizar un producto
// manager.updateProduct(2, { price: 4500 });
// const updatedProduct2 = manager.getProductById(2);
// console.log(updatedProduct2);

// Eliminar un producto
// manager.deleteProduct(3);
// const deletedProduct3 = manager.getProductById(3);
// console.log(deletedProduct3);
