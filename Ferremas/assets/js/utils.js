// utils.js - Base de datos (Versión Final Corregida)
class Database {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('ferremas-users')) || [];
    this.products = JSON.parse(localStorage.getItem('ferremas-products')) || [];
    this.categories = JSON.parse(localStorage.getItem('ferremas-categories')) || [];
    this.sessions = JSON.parse(localStorage.getItem('ferremas-sessions')) || [];
    this.initDefaultData();
  }

  initDefaultData() {
    if (!this.users.some(u => u.username === 'Root')) {
      this.users.push({
        id: this.generateId(),
        username: 'Root',
        password: 'Admin123',
        role: 'admin',
        nombres: 'Administrador',
        apellidos: 'Principal',
        email: 'admin@ferremas.com',
        telefono: '+56912345678',
        createdAt: new Date().toISOString()
      });
    }

    if (this.categories.length === 0) {
      this.initDefaultCategoriesAndProducts();
      this.save();
    }
  }

  initDefaultCategoriesAndProducts() {
    const defaultCategories = [
      {
        name: 'Herramientas Manuales',
        products: [
          { name: 'Martillos', codigo: 'HM-001', marca: 'Truper', precio: 15000, stock: 50 },
          { name: 'Destornilladores', codigo: 'HM-002', marca: 'Stanley', precio: 8500, stock: 75 },
          { name: 'Llaves', codigo: 'HM-003', marca: 'Truper', precio: 12750, stock: 60 },
          { name: 'Herramientas Eléctricas', codigo: 'HM-004', marca: 'DeWalt', precio: 89990, stock: 25 },
          { name: 'Taladros', codigo: 'HM-005', marca: 'Bosch', precio: 120000, stock: 15 },
          { name: 'Sierras', codigo: 'HM-006', marca: 'Makita', precio: 95500, stock: 20 },
          { name: 'Lijadoras', codigo: 'HM-007', marca: 'Black+Decker', precio: 65250, stock: 30 }
        ]
      },
      {
        name: 'Materiales Basicos',
        products: [
          { name: 'Cemento', codigo: 'MC-001', marca: 'Melón', precio: 8990, stock: 200 },
          { name: 'Arena', codigo: 'MC-002', marca: 'Áridos', precio: 5500, stock: 150 },
          { name: 'Ladrillos', codigo: 'MC-003', marca: 'Cerámica', precio: 750, stock: 500 },
          { name: 'Pinturas', codigo: 'MC-004', marca: 'Sipa', precio: 25990, stock: 40 },
          { name: 'Barnices', codigo: 'MC-005', marca: 'Suvinil', precio: 22500, stock: 35 },
          { name: 'Cerámicos', codigo: 'MC-006', marca: 'Cerámica', precio: 12750, stock: 80 }
        ]
      },
      {
        name: 'Equipos de Seguridad',
        products: [
          { name: 'Cascos', codigo: 'ES-001', marca: '3M', precio: 18990, stock: 45 },
          { name: 'Guantes', codigo: 'ES-002', marca: 'Ansell', precio: 9500, stock: 90 },
          { name: 'Lentes de Seguridad', codigo: 'ES-003', marca: 'Honeywell', precio: 12250, stock: 60 },
          { name: 'Accesorios Varios', codigo: 'ES-004', marca: 'Segur', precio: 7990, stock: 120 }
        ]
      }
    ];

    this.categories = defaultCategories.map(category => ({
      id: this.generateId(),
      name: category.name,
      products: category.products.map(product => ({
        id: this.generateId(),
        name: product.name,
        attributes: {
          "Código del producto": product.codigo,
          "Marca": product.marca,
          "Código": product.codigo,
          "Nombre": product.name,
          "Precio": [{ "Fecha": new Date().toISOString(), "Valor": product.precio }],
          "Stock": product.stock
        }
      }))
    }));

    this.products = this.categories.flatMap(cat => cat.products);
  }

  generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  }

  save() {
    this.products = this.categories.flatMap(cat => cat.products);
    localStorage.setItem('ferremas-users', JSON.stringify(this.users));
    localStorage.setItem('ferremas-products', JSON.stringify(this.products));
    localStorage.setItem('ferremas-categories', JSON.stringify(this.categories));
    localStorage.setItem('ferremas-sessions', JSON.stringify(this.sessions));
  }

  authenticate(username, password) {
    const user = this.users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );
    if (!user) throw new Error('Credenciales incorrectas');

    const token = this.generateId();
    this.sessions.push({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    this.save();
    return { user, token };
  }

  addEmployee(employeeData) {
    if (this.users.some(u => u.email === employeeData.email)) {
      throw new Error('El correo ya está registrado');
    }

    const newEmployee = {
      id: this.generateId(),
      ...employeeData,
      createdAt: new Date().toISOString()
    };
    this.users.push(newEmployee);
    this.save();
    return newEmployee;
  }

  addCategory(name) {
    if (!name?.trim()) throw new Error('Nombre de categoría requerido');
    if (this.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('La categoría ya existe');
    }

    const newCategory = {
      id: this.generateId(),
      name: name.trim(),
      products: []
    };
    this.categories.push(newCategory);
    this.save();
    return newCategory;
  }

  addProduct(categoryId, productData) {
    const category = this.categories.find(c => c.id === categoryId);
    if (!category) throw new Error('Categoría no encontrada');
    if (!productData.name || !productData.codigo || !productData.precio) {
      throw new Error('Nombre, código y precio son requeridos');
    }

    const newProduct = {
      id: this.generateId(),
      name: productData.name,
      attributes: {
        "Código del producto": productData.codigo,
        "Marca": productData.marca || '',
        "Código": productData.codigoMarca || '',
        "Nombre": productData.name,
        "Precio": [{ 
          "Fecha": new Date().toISOString(), 
          "Valor": parseFloat(productData.precio) 
        }],
        "Stock": parseInt(productData.stock) || 0
      }
    };
    
    category.products.push(newProduct);
    this.save();
    return newProduct;
  }
}

// Inicialización global
if (typeof window !== 'undefined' && !window.db) {
  window.db = new Database();
  window.getCurrentUser = function() {
    const token = localStorage.getItem('ferremas-currentToken');
    if (!token) return null;
    const session = window.db.sessions.find(s => s.token === token);
    if (!session || new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem('ferremas-currentToken');
      return null;
    }
    return window.db.users.find(u => u.id === session.userId);
  };

  window.logout = function() {
    localStorage.removeItem('ferremas-currentToken');
    window.location.href = 'login.html';
  };

  window.initCharts = function() {
    return {
      ventasData: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{
          label: 'Ventas 2025',
          data: [120000, 190000, 300000, 250000, 220000, 350000],
          backgroundColor: 'rgba(231, 76, 60, 0.2)',
          borderColor: 'rgba(231, 76, 60, 1)',
          borderWidth: 2,
          tension: 0.4
        }]
      },
      inventarioData: {
        labels: window.db.categories.map(c => c.name),
        datasets: [{
          label: 'Productos por categoría',
          data: window.db.categories.map(c => c.products.length),
          backgroundColor: [
            'rgba(52, 152, 219, 0.7)',
            'rgba(155, 89, 182, 0.7)',
            'rgba(46, 204, 113, 0.7)'
          ],
          borderWidth: 1
        }]
      }
    };
  };
}