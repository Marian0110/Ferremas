// admin.js - Funcionalidades del Administrador (Versión Final Corregida)
document.addEventListener('DOMContentLoaded', function() {
  // Página de login
  if (document.getElementById('adminLoginForm')) {
    setupAdminLogin();
    return;
  }

  // Verificar autenticación
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = 'adminlogin.html';
    return;
  }

  // Configurar navbar
  setupNavbar();

  // Configurar página específica
  if (document.getElementById('ventasChart')) {
    setupAdminDashboard();
  } else if (document.getElementById('listaEmpleados')) {
    setupEmployeeManagement();
  } else if (document.getElementById('categoriasAccordion')) {
    setupProductManagement();
  }
});

// Función para mostrar errores
function showError(message) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    confirmButtonColor: '#e74c3c'
  });
}

// Función para obtener nombre de sucursal
function getSucursalName(sucursalCode) {
  const sucursales = {
    // Región de Arica y Parinacota (XV)
    'xv-arica': 'Arica (XV)',
    'xv-parinacota': 'Putre (XV)',
    
    // Región de Tarapacá (I)
    'i-iquique': 'Iquique (I)',
    'i-alto-hospicio': 'Alto Hospicio (I)',
    
    // Región de Antofagasta (II)
    'ii-antofagasta': 'Antofagasta (II)',
    'ii-calama': 'Calama (II)',
    'ii-mejillones': 'Mejillones (II)',
    
    // Región de Atacama (III)
    'iii-copiapo': 'Copiapó (III)',
    'iii-vallenar': 'Vallenar (III)',
    'iii-caldera': 'Caldera (III)',
    
    // Región de Coquimbo (IV)
    'iv-la-serena': 'La Serena (IV)',
    'iv-coquimbo': 'Coquimbo (IV)',
    'iv-ovalle': 'Ovalle (IV)',
    
    // Región de Valparaíso (V)
    'v-valparaiso': 'Valparaíso (V)',
    'v-vina-del-mar': 'Viña del Mar (V)',
    'v-quilpue': 'Quilpué (V)',
    'v-san-antonio': 'San Antonio (V)',
    'v-los-andes': 'Los Andes (V)',
    
    // Región Metropolitana (RM)
    'rm-santiago-centro': 'Santiago Centro (RM)',
    'rm-alameda': 'Alameda (RM)',
    'rm-providencia': 'Providencia (RM)',
    'rm-las-condes': 'Las Condes (RM)',
    'rm-nunoa': 'Ñuñoa (RM)',
    'rm-maipu': 'Maipú (RM)',
    'rm-pudahuel': 'Pudahuel (RM)',
    'rm-san-bernardo': 'San Bernardo (RM)',
    'rm-puente-alto': 'Puente Alto (RM)',
    'rm-la-florida': 'La Florida (RM)',
    'rm-la-cisterna': 'La Cisterna (RM)',
    'rm-la-reina': 'La Reina (RM)',
    'rm-la-pintana': 'La Pintana (RM)',
    'rm-estacion-central': 'Estación Central (RM)',
    'rm-quilicura': 'Quilicura (RM)',
    
    // Región del Libertador Bernardo O'Higgins (VI)
    'vi-rancagua': 'Rancagua (VI)',
    'vi-san-fernando': 'San Fernando (VI)',
    'vi-machali': 'Machalí (VI)',
    'vi-santa-cruz': 'Santa Cruz (VI)',
    
    // Región del Maule (VII)
    'vii-talca': 'Talca (VII)',
    'vii-curico': 'Curicó (VII)',
    'vii-linares': 'Linares (VII)',
    'vii-constitucion': 'Constitución (VII)',
    
    // Región del Ñuble (XVI)
    'xvi-chillan': 'Chillán (XVI)',
    'xvi-bulnes': 'Bulnes (XVI)',
    'xvi-san-carlos': 'San Carlos (XVI)',
    
    // Región del Biobío (VIII)
    'viii-concepcion': 'Concepción (VIII)',
    'viii-talcahuano': 'Talcahuano (VIII)',
    'viii-san-pedro': 'San Pedro de la Paz (VIII)',
    'viii-chiguayante': 'Chiguayante (VIII)',
    'viii-los-angeles': 'Los Ángeles (VIII)',
    
    // Región de La Araucanía (IX)
    'ix-temuco': 'Temuco (IX)',
    'ix-villarrica': 'Villarrica (IX)',
    'ix-angol': 'Angol (IX)',
    'ix-pucon': 'Pucón (IX)',
    
    // Región de Los Ríos (XIV)
    'xiv-valdivia': 'Valdivia (XIV)',
    'xiv-la-union': 'La Unión (XIV)',
    'xiv-rio-bueno': 'Río Bueno (XIV)',
    
    // Región de Los Lagos (X)
    'x-puertomontt': 'Puerto Montt (X)',
    'x-osorno': 'Osorno (X)',
    'x-castro': 'Castro (X)',
    'x-ancud': 'Ancud (X)',
    'x-puerto-varas': 'Puerto Varas (X)',
    
    // Región de Aysén (XI)
    'xi-coyhaique': 'Coyhaique (XI)',
    'xi-puerto-aysen': 'Puerto Aysén (XI)',
    'xi-chile-chico': 'Chile Chico (XI)',
    
    // Región de Magallanes (XII)
    'xii-punta-arenas': 'Punta Arenas (XII)',
    'xii-natales': 'Puerto Natales (XII)',
    'xii-porvenir': 'Porvenir (XII)'
  };
  return sucursales[sucursalCode] || sucursalCode;
}

// Configurar navbar
function setupNavbar() {
  const currentUser = getCurrentUser();
  if (currentUser && document.getElementById('userInfo')) {
    document.getElementById('userInfo').textContent = `${currentUser.nombres} ${currentUser.apellidos}`;
  }

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

// Configurar login
function setupAdminLogin() {
  const form = document.getElementById('adminLoginForm');
  form?.addEventListener('submit', function(e) {
    e.preventDefault();
    try {
      const { user, token } = window.db.authenticate(
        document.getElementById('adminUser').value.trim(),
        document.getElementById('adminPassword').value
      );
      localStorage.setItem('ferremas-currentToken', token);
      Swal.fire({
        icon: 'success',
        title: 'Bienvenido',
        text: `Hola ${user.nombres}!`,
        confirmButtonColor: '#27ae60',
        timer: 1500
      }).then(() => window.location.href = 'admin.html');
    } catch (error) {
      showError('Credenciales incorrectas');
    }
  });
}

// Dashboard
function setupAdminDashboard() {
  updateSummaryData();
  initCharts();
}

function updateSummaryData() {
  const currentUser = getCurrentUser();
  if (currentUser && document.getElementById('welcomeMessage')) {
    document.getElementById('welcomeMessage').textContent = `Bienvenido, ${currentUser.nombres}`;
  }

  // Formatear en CLP ($ chileno)
  const formatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  });

  // Calcular total de productos y productos con stock bajo
  let totalProducts = 0;
  let lowStockProducts = 0;
  let totalValue = 0;

  window.db.categories.forEach(cat => {
    totalProducts += cat.products.length;
    cat.products.forEach(prod => {
      const stock = prod.attributes.Stock || 0;
      const precio = prod.attributes.Precio[0]?.Valor || 0;
      
      if (stock < 10) {
        lowStockProducts++;
      }
      totalValue += precio * stock;
    });
  });

  // Actualizar la UI
  if (document.getElementById('productosStock')) {
    document.getElementById('productosStock').textContent = totalProducts;
    document.getElementById('productosBajos').textContent = lowStockProducts;
    document.getElementById('valorInventario').textContent = formatter.format(totalValue);
  }
}

function initCharts() {
  const { ventasData, inventarioData } = window.initCharts();

  // Gráfico de ventas
  const ventasCtx = document.getElementById('ventasChart');
  if (ventasCtx) {
    new Chart(ventasCtx.getContext('2d'), {
      type: 'line',
      data: ventasData,
      options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });
  }

  // Gráfico de inventario
  const inventarioCtx = document.getElementById('inventarioChart');
  if (inventarioCtx) {
    new Chart(inventarioCtx.getContext('2d'), {
      type: 'doughnut',
      data: inventarioData,
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }
}

// Gestión de empleados
function setupEmployeeManagement() {
  loadEmployees();
  loadClientes(); // Nueva función para cargar clientes
  setupEmployeeForm();
}

function loadEmployees() {
  const employees = window.db.users.filter(u => u.role !== 'admin' && u.role !== 'cliente');
  const tbody = document.querySelector('#listaEmpleados');
  if (!tbody) return;

  tbody.innerHTML = employees.map(emp => `
    <tr>
      <td>${emp.nombres || ''} ${emp.apellidos || ''}</td>
      <td>${emp.email || ''}</td>
      <td><span class="badge ${getRoleBadgeClass(emp.role)}">${getRoleName(emp.role)}</span></td>
      <td>${getSucursalName(emp.sucursal)}</td>
      <td>${emp.telefono || ''}</td>
      <td>
        <button class="btn btn-sm btn-warning edit-employee" data-id="${emp.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger delete-employee" data-id="${emp.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');

  document.getElementById('totalEmpleados').textContent = `${employees.length} empleados`;
}

// Nueva función para cargar clientes
function loadClientes() {
  const clientes = window.db.users.filter(u => u.role === 'cliente');
  const tbody = document.querySelector('#listaClientes');
  if (!tbody) return;

  tbody.innerHTML = clientes.map(cliente => `
    <tr>
      <td>${cliente.nombres || ''} ${cliente.apellidos || ''}</td>
      <td>${cliente.email || ''}</td>
      <td>${cliente.telefono || ''}</td>
      <td>${cliente.direccion || ''}</td>
      <td>${cliente.createdAt ? new Date(cliente.createdAt).toLocaleDateString() : 'No registrada'}</td>
    </tr>
  `).join('');

  document.getElementById('totalClientes').textContent = `${clientes.length} clientes`;
}

function getRoleName(role) {
  const roles = { 
    'vendedor': 'Vendedor', 
    'bodeguero': 'Bodeguero', 
    'contador': 'Contador',
    'cliente': 'Cliente' // Agregado para consistencia
  };
  return roles[role] || role;
}

function getRoleBadgeClass(role) {
  const classes = { 
    'vendedor': 'bg-primary', 
    'bodeguero': 'bg-success', 
    'contador': 'bg-info',
    'cliente': 'bg-secondary' // Agregado para consistencia
  };
  return classes[role] || 'bg-secondary';
}

function setupEmployeeForm() {
  const form = document.getElementById('crearEmpleadoForm');
  form?.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = {
      nombres: document.getElementById('empNombre').value.trim(),
      apellidos: document.getElementById('empApellido').value.trim(),
      email: document.getElementById('empEmail').value.trim(),
      telefono: document.getElementById('empTelefono').value.trim(),
      role: document.getElementById('empRol').value,
      sucursal: document.getElementById('empSucursal').value,
      password: document.getElementById('empPassword').value
    };

    if (!formData.nombres || !formData.apellidos || !formData.email || !formData.role || !formData.sucursal) {
      return showError('Todos los campos son requeridos');
    }

    if (formData.password !== document.getElementById('empConfirmPassword').value) {
      return showError('Las contraseñas no coinciden');
    }

    try {
      const newEmployee = window.db.addEmployee(formData);
      Swal.fire({
        icon: 'success',
        title: 'Empleado creado',
        text: `${formData.nombres} ha sido registrado`,
        confirmButtonColor: '#27ae60'
      }).then(() => {
        form.reset();
        loadEmployees();
      });
    } catch (error) {
      showError(error.message);
    }
  });

  // Manejar edición/eliminación
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  if (btn.classList.contains('delete-employee')) {
    deleteEmployee(btn.dataset.id);
  } else if (btn.classList.contains('edit-employee')) {
    editEmployee(btn.dataset.id);
  }
});
}

function editEmployee(id) {
  const employee = window.db.users.find(u => u.id === id);
  if (!employee) return;

  // Ocultar formulario de creación y lista de clientes, mostrar formulario de edición
  document.getElementById('crearEmpleadoForm').style.display = 'none';
  document.querySelector('.card-header.bg-primary').closest('.card').style.display = 'none'; // Oculta lista de clientes
  const editForm = document.getElementById('edicionEmpleadoCard');
  editForm.style.display = 'block';

  // Llenar el formulario con los datos del empleado
  document.getElementById('editEmpId').value = employee.id;
  document.getElementById('editEmpNombre').value = employee.nombres || '';
  document.getElementById('editEmpApellido').value = employee.apellidos || '';
  document.getElementById('editEmpEmail').value = employee.email || '';
  document.getElementById('editEmpTelefono').value = employee.telefono || '';
  document.getElementById('editEmpRol').value = employee.role || 'vendedor';
  document.getElementById('editEmpSucursal').value = employee.sucursal || 'rm-santiago';

  // Configurar el botón de cancelar
  document.getElementById('cancelarEdicionBtn').addEventListener('click', () => {
    editForm.style.display = 'none';
    document.getElementById('crearEmpleadoForm').style.display = 'block';
    document.querySelector('.card-header.bg-primary').closest('.card').style.display = 'block'; // Muestra lista de clientes
  });

  // Configurar el envío del formulario
  document.getElementById('editarEmpleadoForm').onsubmit = function(e) {
    e.preventDefault();
    
    const updatedEmployee = {
      nombres: document.getElementById('editEmpNombre').value.trim(),
      apellidos: document.getElementById('editEmpApellido').value.trim(),
      email: document.getElementById('editEmpEmail').value.trim(),
      telefono: document.getElementById('editEmpTelefono').value.trim(),
      role: document.getElementById('editEmpRol').value,
      sucursal: document.getElementById('editEmpSucursal').value
    };

    if (!updatedEmployee.nombres || !updatedEmployee.apellidos || !updatedEmployee.email || !updatedEmployee.role || !updatedEmployee.sucursal) {
      return showError('Todos los campos son requeridos');
    }

    // Actualizar el empleado
    Object.assign(employee, updatedEmployee);
    window.db.save();

    // Mostrar mensaje de éxito
    Swal.fire({
      icon: 'success',
      title: 'Empleado actualizado',
      text: `Los datos de ${updatedEmployee.nombres} han sido modificados`,
      confirmButtonColor: '#27ae60'
    });

    // Recargar la lista y volver al formulario de creación
    loadEmployees();
    editForm.style.display = 'none';
    document.getElementById('crearEmpleadoForm').style.display = 'block';
    document.querySelector('.card-header.bg-primary').closest('.card').style.display = 'block'; // Muestra lista de clientes
    this.reset();
  };
}

function deleteEmployee(id) {
  Swal.fire({
    title: '¿Eliminar empleado?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#7f8c8d'
  }).then((result) => {
    if (result.isConfirmed) {
      window.db.users = window.db.users.filter(u => u.id !== id);
      window.db.save();
      loadEmployees();
      Swal.fire('Eliminado', 'Empleado eliminado', 'success');
    }
  });
}

// Gestión de productos (Versión Corregida)
function setupProductManagement() {
  loadCategories();
  setupProductForms();
}

function loadCategories() {
  const accordion = document.getElementById('categoriasAccordion');
  if (!accordion) return;

  // Forzar recarga si no hay productos
  if (window.db.categories.some(cat => cat.products.length === 0)) {
    window.db.initDefaultCategoriesAndProducts();
  }

  // Formateador CLP (sin decimales, con separadores de miles)
  const clpFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  });

  // Calcular total de productos
  const totalProducts = window.db.categories.reduce((sum, cat) => sum + cat.products.length, 0);
  document.getElementById('totalProductos').textContent = `${totalProducts} productos`;

  accordion.innerHTML = window.db.categories.map((cat, catIndex) => `
    <div class="accordion-item">
      <h2 class="accordion-header" id="heading${catIndex}">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                data-bs-target="#collapse${catIndex}" aria-expanded="false" 
                aria-controls="collapse${catIndex}">
          ${cat.name} <span class="badge bg-danger ms-2">${cat.products.length} productos</span>
        </button>
      </h2>
      <div id="collapse${catIndex}" class="accordion-collapse collapse" 
           aria-labelledby="heading${catIndex}" data-bs-parent="#categoriasAccordion">
        <div class="accordion-body">
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Marca</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${cat.products.map(prod => {
                  const stock = prod.attributes.Stock || 0;
                  const isLowStock = stock < 10;
                  return `
                  <tr ${isLowStock ? 'class="table-warning"' : ''}>
                    <td>${prod.attributes["Código del producto"] || ''}</td>
                    <td>${prod.name || ''}</td>
                    <td>${prod.attributes.Marca || ''}</td>
                    <td>${clpFormatter.format(prod.attributes.Precio[0]?.Valor || 0)}</td>
                    <td ${isLowStock ? 'class="text-danger fw-bold"' : ''}>${stock}</td>
                    <td>
                      <button class="btn btn-sm btn-primary edit-product" 
                              data-cat-id="${cat.id}" data-prod-id="${prod.id}">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-sm btn-danger delete-product" 
                              data-cat-id="${cat.id}" data-prod-id="${prod.id}">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Actualizar selector de categorías
  const categorySelect = document.getElementById('categoriaProducto');
  if (categorySelect) {
    categorySelect.innerHTML = `
      <option value="">Seleccionar categoría</option>
      ${window.db.categories.map(cat => `
        <option value="${cat.id}">${cat.name}</option>
      `).join('')}
    `;
  }
}

function setupProductForms() {
  // Formulario para agregar categoría
  document.getElementById('agregarCategoriaForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('nombreCategoria').value.trim();
    if (!name) return showError('El nombre es requerido');

    try {
      window.db.addCategory(name);
      Swal.fire({
        icon: 'success',
        title: 'Categoría agregada',
        confirmButtonColor: '#27ae60'
      }).then(() => {
        this.reset();
        loadCategories();
      });
    } catch (error) {
      showError(error.message);
    }
  });

  // Formulario para agregar producto
  document.getElementById('agregarProductoForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = {
      categoryId: document.getElementById('categoriaProducto').value,
      name: document.getElementById('nombreProducto').value.trim(),
      codigo: document.getElementById('codigoProducto').value.trim(),
      marca: document.getElementById('marcaProducto').value.trim(),
      codigoMarca: document.getElementById('codigoMarca').value.trim(),
      precio: parseFloat(document.getElementById('precioProducto').value),
      stock: parseInt(document.getElementById('stockProducto').value) || 0
    };

    if (!formData.name || !formData.codigo || isNaN(formData.precio)) {
      return showError('Nombre, código y precio son requeridos');
    }

    try {
      window.db.addProduct(formData.categoryId, formData);
      Swal.fire({
        icon: 'success',
        title: 'Producto agregado',
        confirmButtonColor: '#27ae60'
      }).then(() => {
        this.reset();
        loadCategories();
        if (document.getElementById('ventasChart')) {
          updateSummaryData(); // Actualizar el dashboard si estamos en admin.html
        }
      });
    } catch (error) {
      showError(error.message);
    }
  });

  // Manejar edición/eliminación
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.classList.contains('delete-product')) {
      deleteProduct(btn.dataset.catId, btn.dataset.prodId);
    } else if (btn.classList.contains('edit-product')) {
      showEditProductModal(btn.dataset.catId, btn.dataset.prodId);
    }
  });
}

function showEditProductModal(categoryId, productId) {
  const category = window.db.categories.find(c => c.id === categoryId);
  const product = category?.products.find(p => p.id === productId);
  if (!product) return;

  // Formateador CLP para el input de precio
  const clpFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  });

  const modalHTML = `
    <div class="modal fade" id="editProductModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Editar Producto</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="editProductForm">
              <input type="hidden" id="editCategoryId" value="${categoryId}">
              <input type="hidden" id="editProductId" value="${productId}">
              
              <div class="mb-3">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-control" id="editProductName" value="${product.name}" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Código</label>
                <input type="text" class="form-control" id="editProductCode" 
                       value="${product.attributes["Código del producto"]}" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Marca</label>
                <input type="text" class="form-control" id="editProductBrand" 
                       value="${product.attributes.Marca}">
              </div>
              
              <div class="mb-3">
                <label class="form-label">Precio (CLP)</label>
                <input type="number" class="form-control" id="editProductPrice" 
                       value="${product.attributes.Precio[0].Valor}" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Stock</label>
                <input type="number" class="form-control" id="editProductStock" 
                       value="${product.attributes.Stock}">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="saveProductChanges">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  const modal = new bootstrap.Modal('#editProductModal');
  modal.show();

  document.getElementById('saveProductChanges').addEventListener('click', () => {
    const updatedProduct = {
      name: document.getElementById('editProductName').value.trim(),
      codigo: document.getElementById('editProductCode').value.trim(),
      marca: document.getElementById('editProductBrand').value.trim(),
      precio: parseFloat(document.getElementById('editProductPrice').value),
      stock: parseInt(document.getElementById('editProductStock').value) || 0
    };

    if (!updatedProduct.name || !updatedProduct.codigo || isNaN(updatedProduct.precio)) {
      return showError('Nombre, código y precio son requeridos');
    }

    Object.assign(product, {
      name: updatedProduct.name,
      attributes: {
        ...product.attributes,
        "Código del producto": updatedProduct.codigo,
        "Marca": updatedProduct.marca,
        "Precio": [{ "Fecha": new Date().toISOString(), "Valor": updatedProduct.precio }],
        "Stock": updatedProduct.stock
      }
    });

    window.db.save();
    loadCategories();
    modal.hide();
    Swal.fire('¡Actualizado!', 'Producto modificado', 'success');
    
    // Actualizar el dashboard si estamos en admin.html
    if (document.getElementById('ventasChart')) {
      updateSummaryData();
    }
    
    modal._element.addEventListener('hidden.bs.modal', () => {
      document.getElementById('editProductModal').remove();
    });
  });

  modal._element.addEventListener('hidden.bs.modal', () => {
    document.getElementById('editProductModal').remove();
  });
}

function deleteProduct(catId, prodId) {
  Swal.fire({
    title: '¿Eliminar producto?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c'
  }).then((result) => {
    if (result.isConfirmed) {
      const category = window.db.categories.find(c => c.id === catId);
      if (category) {
        category.products = category.products.filter(p => p.id !== prodId);
        window.db.save();
        loadCategories();
        // Actualizar el dashboard si estamos en admin.html
        if (document.getElementById('ventasChart')) {
          updateSummaryData();
        }
        Swal.fire('Eliminado', 'Producto eliminado', 'success');
      }
    }
  });
}