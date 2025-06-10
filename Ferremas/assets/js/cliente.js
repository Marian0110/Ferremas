// cliente.js - Funcionalidades completas para Clientes
document.addEventListener('DOMContentLoaded', function() {
    // Verificar en qué página estamos
    if (document.getElementById('loginForm')) {
        setupLogin();
    } else if (document.getElementById('registroForm')) {
        setupRegistro();
    } else if (document.querySelector('.user-profile')) {
        setupUsuario();
    }
    setupConversorDivisas();
});

// ==============================================
// Configuración del Login (modificado para "Recordarme")
// ==============================================
function setupLogin() {
    const form = document.getElementById('loginForm');
    form?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;

        try {
            // Autenticar cliente
            const { user, token } = authenticateClient(email, password);
            
            localStorage.setItem('ferremas-currentToken', token);
            
            // Guardar email si el checkbox está marcado
            if (remember) {
                localStorage.setItem('ferremas-remembered-email', email);
            } else {
                localStorage.removeItem('ferremas-remembered-email');
            }
            
            Swal.fire({
                icon: 'success',
                title: 'Bienvenido',
                text: `Hola ${user.nombres}!`,
                confirmButtonColor: '#27ae60',
                timer: 1500
            }).then(() => {
                window.location.href = 'indexcliente.html';
            });
        } catch (error) {
            showError(error.message);
        }
    });
}

// Autenticación específica para clientes
function authenticateClient(email, password) {
    const user = window.db.users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password &&
        u.role === 'cliente'
    );

    if (!user) {
        throw new Error('Credenciales incorrectas');
    }

    const token = window.db.generateId();
    window.db.sessions.push({
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    window.db.save();

    return { user, token };
}

// ==============================================
// Configuración del Registro (modificado para incluir newsletter)
// ==============================================
function setupRegistro() {
  const form = document.getElementById('registroForm');
  form?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombres = document.getElementById('firstName').value.trim();
    const apellidos = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const telefono = document.getElementById('phone').value.trim();
    const direccion = document.getElementById('address').value.trim();
    const newsletter = document.getElementById('newsletter').checked;

    try {
      if (password !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      if (window.db.users.some(u => u.email === email)) {
        throw new Error('El correo ya está registrado');
      }

      // Crear nuevo cliente con todos los campos necesarios
      const newClient = {
        id: window.db.generateId(),
        nombres,
        apellidos,
        email,
        password,
        telefono,
        direccion,
        newsletter,
        role: 'cliente',
        createdAt: new Date().toISOString(),
        puntos: 0
      };

      window.db.users.push(newClient);
      window.db.save();

      Swal.fire({
        icon: 'success',
        title: 'Registro exitoso',
        text: '¡Bienvenido a Ferremas! Ahora puedes iniciar sesión',
        confirmButtonColor: '#27ae60'
      }).then(() => {
        window.location.href = 'login.html';
      });
    } catch (error) {
      showError(error.message);
    }
  });
}

// ==============================================
// Configuración de la Página de Usuario
// ==============================================
function setupUsuario() {
    // Verificar autenticación
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'cliente') {
        window.location.href = 'login.html';
        return;
    }

    // Configurar perfil del usuario
    setupUserProfile(currentUser);
    
    // Configurar historial de pedidos
    setupPedidosHistorial(currentUser);
    
    // Configurar carrito de compras
    setupCarritoCompras();
    
    // Configurar catálogo de productos
    setupCatalogoProductos();
    
    // Configurar eventos de logout
    setupLogout();
}

// Configurar perfil del usuario
function setupUserProfile(user) {
    // Actualizar avatar
    const initials = (user.nombres?.charAt(0) || '') + (user.apellidos?.charAt(0) || '');
    const avatar = document.querySelector('.user-avatar');
    if (avatar) {
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=e74c3c&color=fff&size=200`;
        avatar.alt = `Avatar de ${user.nombres} ${user.apellidos}`;
    }

    // Actualizar información del perfil
    document.querySelector('.user-profile h4').textContent = `${user.nombres} ${user.apellidos}`;
    document.querySelector('.user-profile .badge').textContent = user.puntos?.toLocaleString() || '0';
    
    // Configurar botón de editar perfil
    document.querySelector('.user-profile .btn-outline-primary')?.addEventListener('click', function() {
        editarPerfil(user);
    });
}

// Editar perfil del usuario (modificado para actualización en tiempo real)
function editarPerfil(user) {
    Swal.fire({
        title: 'Editar Perfil',
        html: `
            <form id="editarPerfilForm">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label class="form-label">Nombres</label>
                        <input type="text" class="form-control" id="editNombres" value="${user.nombres || ''}" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Apellidos</label>
                        <input type="text" class="form-control" id="editApellidos" value="${user.apellidos || ''}" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Correo Electrónico</label>
                    <input type="email" class="form-control" id="editEmail" value="${user.email || ''}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Teléfono</label>
                    <input type="tel" class="form-control" id="editTelefono" value="${user.telefono || ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Dirección</label>
                    <textarea class="form-control" id="editDireccion" rows="2">${user.direccion || ''}</textarea>
                </div>
            </form>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cambios',
        confirmButtonColor: '#e74c3c', // Botón rojo
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        preConfirm: () => {
            const nombres = document.getElementById('editNombres').value.trim();
            const apellidos = document.getElementById('editApellidos').value.trim();
            const email = document.getElementById('editEmail').value.trim();
            const telefono = document.getElementById('editTelefono').value.trim();
            const direccion = document.getElementById('editDireccion').value.trim();

            if (!nombres || !apellidos || !email) {
                Swal.showValidationMessage('Nombre, apellido y email son requeridos');
                return false;
            }

            return { nombres, apellidos, email, telefono, direccion };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const updatedData = result.value;
            const userIndex = window.db.users.findIndex(u => u.id === user.id);
            
            if (userIndex !== -1) {
                // Actualizar usuario en la base de datos
                window.db.users[userIndex] = {
                    ...window.db.users[userIndex],
                    ...updatedData
                };
                window.db.save();
                
                // Actualizar interfaz inmediatamente
                actualizarDatosUsuario(window.db.users[userIndex]);
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Perfil Actualizado!',
                    text: 'Tus cambios se han guardado correctamente.',
                    confirmButtonColor: '#27ae60'
                });
            }
        }
    });
}

// Configurar historial de pedidos
function setupPedidosHistorial(user) {
    // Obtener pedidos del usuario ordenados por fecha (más recientes primero)
    const pedidos = window.db.pedidos?.filter(p => p.clienteId === user.id) || [];
    pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    const tbody = document.querySelector('#tablaPedidos tbody');
    if (!tbody) return;
    
    const formatter = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    });
    
    // Mostrar solo los últimos 5 pedidos inicialmente
    const pedidosAMostrar = pedidos.slice(0, 5);
    
    tbody.innerHTML = pedidosAMostrar.map(pedido => `
        <tr>
            <td>${pedido.id}</td>
            <td>${new Date(pedido.fecha).toLocaleDateString('es-CL')}</td>
            <td>${formatter.format(pedido.total)}</td>
            <td><span class="badge ${getBadgeClassForEstado(pedido.estado)}">${pedido.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary ver-detalle-pedido" data-id="${pedido.id}">
                    <i class="fas fa-eye me-1"></i> Detalles
                </button>
            </td>
        </tr>
    `).join('');
    
    // Configurar botón "Ver todos los pedidos"
    const btnVerTodos = document.getElementById('btnVerTodosPedidos');
    if (btnVerTodos) {
        if (pedidos.length > 5) {
            btnVerTodos.style.display = 'inline-block';
            btnVerTodos.addEventListener('click', function(e) {
                e.preventDefault();
                tbody.innerHTML = pedidos.map(pedido => `
                    <tr>
                        <td>${pedido.id}</td>
                        <td>${new Date(pedido.fecha).toLocaleDateString('es-CL')}</td>
                        <td>${formatter.format(pedido.total)}</td>
                        <td><span class="badge ${getBadgeClassForEstado(pedido.estado)}">${pedido.estado}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary ver-detalle-pedido" data-id="${pedido.id}">
                                <i class="fas fa-eye me-1"></i> Detalles
                            </button>
                        </td>
                    </tr>
                `).join('');
                btnVerTodos.style.display = 'none';
                
                // Volver a configurar los eventos de los botones de detalles
                configurarEventosDetallesPedidos();
            });
        } else {
            btnVerTodos.style.display = 'none';
        }
    }
    
    // Configurar eventos para ver detalles del pedido
    configurarEventosDetallesPedidos();
}

function configurarEventosDetallesPedidos() {
    document.querySelectorAll('.ver-detalle-pedido').forEach(btn => {
        btn.addEventListener('click', function() {
            const pedidoId = this.dataset.id;
            verDetallePedido(pedidoId);
        });
    });
}

// Ver detalle de un pedido
function verDetallePedido(pedidoId) {
    const pedido = window.db.pedidos.find(p => p.id === pedidoId);
    if (!pedido) {
        Swal.fire('Error', 'No se encontró el pedido solicitado', 'error');
        return;
    }
    
    const formatter = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    });
    
    const productosHTML = pedido.productos.map(p => `
        <tr>
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>${formatter.format(p.precioUnitario)}</td>
            <td>${formatter.format(p.precioUnitario * p.cantidad)}</td>
        </tr>
    `).join('');
    
    Swal.fire({
        title: `Detalle Pedido #${pedido.id}`,
        html: `
            <div class="text-start mb-3">
                <p><strong>Fecha:</strong> ${new Date(pedido.fecha).toLocaleDateString('es-CL')} ${new Date(pedido.fecha).toLocaleTimeString('es-CL')}</p>
                <p><strong>Estado:</strong> <span class="badge ${getBadgeClassForEstado(pedido.estado)}">${pedido.estado}</span></p>
                <p><strong>Método de Pago:</strong> ${getNombreMetodoPago(pedido.metodoPago)}</p>
                <p><strong>Método de Entrega:</strong> ${pedido.metodoEntrega === 'retiro' ? 'Retiro en Tienda' : 'Despacho a Domicilio'}</p>
                ${pedido.direccionEntrega ? `<p><strong>Dirección de Entrega:</strong> ${pedido.direccionEntrega}</p>` : ''}
                <hr>
            </div>
            
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productosHTML}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-end"><strong>Subtotal:</strong></td>
                            <td>${formatter.format(pedido.subtotal)}</td>
                        </tr>
                        ${pedido.costoEntrega > 0 ? `
                        <tr>
                            <td colspan="3" class="text-end"><strong>Costo de Envío:</strong></td>
                            <td>${formatter.format(pedido.costoEntrega)}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td colspan="3" class="text-end"><strong>Total:</strong></td>
                            <td><strong>${formatter.format(pedido.total)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `,
        width: '800px',
        confirmButtonText: 'Cerrar'
    });
}

// ==============================================
// Carrito de Compras
// ==============================================
function setupCarritoCompras() {
    // Inicializar carrito si no existe
    if (!localStorage.getItem('ferremas-carrito')) {
        localStorage.setItem('ferremas-carrito', JSON.stringify([]));
    }
    
    // Configurar eventos para el carrito
    document.addEventListener('click', function(e) {
        if (e.target.closest('.agregar-carrito')) {
            const productoId = e.target.closest('button').dataset.id;
            agregarAlCarrito(productoId);
        }
        
        if (e.target.closest('.eliminar-item-carrito')) {
            const productoId = e.target.closest('button').dataset.id;
            eliminarDelCarrito(productoId);
        }
        
        if (e.target.closest('.actualizar-cantidad')) {
            const productoId = e.target.closest('button').dataset.id;
            const nuevaCantidad = parseInt(e.target.closest('.input-group').querySelector('input').value);
            actualizarCantidadCarrito(productoId, nuevaCantidad);
        }
        
        if (e.target.closest('.realizar-pedido')) {
            // Cambiamos realizarPedido() por realizarCheckout()
            realizarCheckout();
        }
    });
    
    // Actualizar contador del carrito
    actualizarContadorCarrito();
    verificarRetornoWebPay();
}

// Mantenemos estas funciones igual para conservar las notificaciones y el contador
function agregarAlCarrito(productoId) {
    const producto = window.db.products.find(p => p.id === productoId);
    if (!producto) return;
    
    const carrito = JSON.parse(localStorage.getItem('ferremas-carrito'));
    const itemExistente = carrito.find(item => item.id === productoId);
    
    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({
            id: productoId,
            nombre: producto.name,
            precio: producto.attributes.Precio[0]?.Valor || 0,
            cantidad: 1,
            imagen: 'assets/img/' + getImagenProducto(producto.name)
        });
    }
    
    localStorage.setItem('ferremas-carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    
    Swal.fire({
        icon: 'success',
        title: 'Producto agregado',
        text: `${producto.name} se ha añadido al carrito`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
}

function eliminarDelCarrito(productoId) {
    let carrito = JSON.parse(localStorage.getItem('ferremas-carrito'));
    carrito = carrito.filter(item => item.id !== productoId);
    localStorage.setItem('ferremas-carrito', JSON.stringify(carrito));
    
    actualizarContadorCarrito();
    // Disparamos el evento para actualizar la vista del carrito
    if (document.getElementById('carrito') && !document.getElementById('carrito').classList.contains('d-none')) {
        actualizarVistaCarrito();
    }
}

function actualizarCantidadCarrito(productoId, nuevaCantidad) {
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(productoId);
        return;
    }
    
    let carrito = JSON.parse(localStorage.getItem('ferremas-carrito'));
    const item = carrito.find(item => item.id === productoId);
    
    if (item) {
        item.cantidad = nuevaCantidad;
        localStorage.setItem('ferremas-carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
        // Disparamos el evento para actualizar la vista del carrito
        if (document.getElementById('carrito') && !document.getElementById('carrito').classList.contains('d-none')) {
            actualizarVistaCarrito();
        }
    }
}

function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('ferremas-carrito')) || [];
    const contadores = document.querySelectorAll('.contador-carrito');
    
    contadores.forEach(contador => {
        contador.textContent = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        contador.style.display = carrito.length > 0 ? 'inline-block' : 'none';
    });
}

// ==============================================
// Checkout y Realización de Pedido
// ==============================================
function realizarCheckout() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    const carrito = JSON.parse(localStorage.getItem('ferremas-carrito')) || [];
    if (carrito.length === 0) return;
    
    // Obtener método de entrega seleccionado
    const metodoEntrega = document.querySelector('input[name="metodoEntrega"]:checked').value;
    const costoEntrega = metodoEntrega === 'despacho' ? 5000 : 0;
    
    // Calcular totales
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const total = subtotal + costoEntrega;
    
    // Generar orden de compra
    const ordenCompra = 'PED-' + window.db.generateId().substr(0, 8);
    
    // Obtener session ID del token actual
    const sessionId = localStorage.getItem('ferremas-currentToken');
    
    // Validar dirección si es despacho
    if (metodoEntrega === 'despacho' && (!currentUser.direccion || currentUser.direccion.trim() === '')) {
        Swal.fire({
            icon: 'error',
            title: 'Dirección requerida',
            text: 'Debes tener una dirección registrada para despacho a domicilio',
            confirmButtonText: 'Actualizar mi dirección',
            showCancelButton: true,
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'usuario.html';
            }
        });
        return;
    }
    
    // Datos para WebPay
    const datosWebPay = {
        montoTotal: total,
        ordenCompra: ordenCompra,
        sessionId: sessionId,
        metodoEntrega: metodoEntrega,
        costoEntrega: costoEntrega,
        items: carrito.map(item => ({
            id: item.id,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio
        })),
        cliente: {
            id: currentUser.id,
            nombre: `${currentUser.nombres} ${currentUser.apellidos}`,
            email: currentUser.email,
            direccion: metodoEntrega === 'despacho' ? currentUser.direccion : null
        }
    };
    
    // Mostrar confirmación antes de proceder con WebPay
    const formatter = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    });
    
    Swal.fire({
        title: 'Confirmar compra',
        html: `
            <div class="text-start">
                <p><strong>Método de entrega:</strong> ${metodoEntrega === 'retiro' ? 'Retiro en tienda' : 'Despacho a domicilio'}</p>
                ${metodoEntrega === 'despacho' ? `<p><strong>Dirección de entrega:</strong> ${currentUser.direccion}</p>` : ''}
                <p><strong>Total a pagar:</strong> ${formatter.format(total)}</p>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Pagar con WebPay',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0d6efd'
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar carga mientras se procesa
            Swal.fire({
                title: 'Procesando pago',
                html: 'Estamos conectando con WebPay...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Llamar a la función de integración con WebPay
            iniciarPagoWebPay(datosWebPay).catch(error => {
                Swal.close();
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ocurrió un error al comunicarse con WebPay: ' + error.message,
                    confirmButtonColor: '#dc3545'
                });
                console.error('Error en WebPay:', error);
            });
        }
    });
}
function crearPedido(currentUser, carrito, metodoEntrega, costoEntrega, metodoPago, ordenCompra, datosTransaccion) {
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const total = datosTransaccion?.amount || subtotal + costoEntrega;
    
    const nuevoPedido = {
        id: ordenCompra,
        clienteId: currentUser.id,
        cliente: `${currentUser.nombres} ${currentUser.apellidos}`,
        productos: carrito.map(item => ({
            id: item.id,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
            ubicacion: 'Bodega A'
        })),
        fecha: datosTransaccion?.transactionDate || new Date().toISOString(),
        subtotal: subtotal,
        costoEntrega: costoEntrega,
        total: total,
        metodoPago: metodoPago,
        metodoEntrega: metodoEntrega === 'retiro' ? 'Retiro en Tienda' : 'Despacho a Domicilio',
        direccionEntrega: metodoEntrega === 'despacho' ? currentUser.direccion : null,
        estado: 'Aprobado',
        fechaActualizacion: new Date().toISOString(),
        // Guardar datos de transacción
        datosTransaccion: {
            cardNumber: datosTransaccion?.cardNumber,
            authorizationCode: datosTransaccion?.authorizationCode,
            transactionDate: datosTransaccion?.transactionDate
        }
    };
    
    if (!window.db.pedidos) window.db.pedidos = [];
    window.db.pedidos.push(nuevoPedido);
    window.db.save();
    
    // Actualizar puntos de cliente si es necesario
    if (window.db.users) {
        const userIndex = window.db.users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            window.db.users[userIndex].puntos = (window.db.users[userIndex].puntos || 0) + Math.floor(total / 1000);
            window.db.save();
        }
    }
    
    // Mostrar confirmación con los datos de la transacción
    mostrarConfirmacionPedido(nuevoPedido);
}

function mostrarConfirmacionPedido(nuevoPedido) {
    const formatter = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    });
    
    // Obtener los datos de la transacción de WebPay
    const datosTransaccion = nuevoPedido.datosTransaccion || {};
    
    Swal.fire({
        icon: 'success',
        title: '¡Pedido Realizado!',
        html: `
            <div class="text-start">
                <p>Tu pedido <strong>#${nuevoPedido.id}</strong> ha sido registrado exitosamente.</p>
                <p><strong>Fecha:</strong> ${new Date(nuevoPedido.fecha).toLocaleDateString('es-CL')}</p>
                <p><strong>Estado:</strong> <span class="badge ${getBadgeClassForEstado(nuevoPedido.estado)}">${nuevoPedido.estado}</span></p>
                <p><strong>Método de entrega:</strong> ${nuevoPedido.metodoEntrega}</p>
                ${nuevoPedido.direccionEntrega ? `<p><strong>Dirección:</strong> ${nuevoPedido.direccionEntrega}</p>` : ''}
                <hr>
                <div class="alert alert-success">
                    <h5 class="alert-heading">Pago exitoso</h5>
                    <p><strong>Método:</strong> WebPay</p>
                    <p><strong>Total pagado:</strong> ${formatter.format(nuevoPedido.total)}</p>
                    ${datosTransaccion.cardNumber ? `<p><strong>Tarjeta:</strong> ${datosTransaccion.cardNumber}</p>` : ''}
                    ${datosTransaccion.authorizationCode ? `<p><strong>Código de autorización:</strong> ${datosTransaccion.authorizationCode}</p>` : ''}
                    ${datosTransaccion.transactionDate ? `<p><strong>Fecha de transacción:</strong> ${new Date(datosTransaccion.transactionDate).toLocaleString('es-CL')}</p>` : ''}
                </div>
            </div>
        `,
        confirmButtonText: 'Ver mis pedidos',
        confirmButtonColor: '#198754',
        width: '32em' // Un poco más ancho para acomodar toda la información
    }).then(() => {
        // Navegar al historial de pedidos
        const btnMisPedidos = document.getElementById('btnMisPedidos');
        if (btnMisPedidos) {
            btnMisPedidos.click();
        } else {
            // Si no existe el botón, redirigir directamente
            const misPedidosURL = document.querySelector('a[href="#misPedidos"]');
            if (misPedidosURL) {
                misPedidosURL.click();
            }
        }
    });
}

// WEBPAY conectado a api
function iniciarPagoWebPay(datosPago) {
    return new Promise((resolve, reject) => {
        console.log("Iniciando pago WebPay con datos:", datosPago);
        
        const data = {
            buyOrder: datosPago.ordenCompra,
            amount: datosPago.montoTotal
        };
        
        console.log("Enviando petición a /crear-transaccion:", data);
        
        fetch('http://localhost:3000/crear-transaccion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log("Respuesta recibida, status:", response.status);
            
            if (!response.ok) {
                return response.text().then(text => {
                    console.error("Error en la respuesta:", text);
                    throw new Error(`Error del servidor: ${response.status} - ${text || response.statusText}`);
                });
            }
            return response.json();
        })
        .then(responseData => {
            console.log("Datos de respuesta:", responseData);
            
            if (!responseData.url || !responseData.token) {
                throw new Error("La respuesta del servidor no contiene la URL o token requerido");
            }
            
            // Guardar detalles del pedido en localStorage para recuperarlos luego
            localStorage.setItem('ferremas-pedido-pendiente', JSON.stringify({
                datosWebPay: datosPago,
                fechaCreacion: new Date().toISOString(),
                token: responseData.token
            }));
            
            // Construir manualmente la URL con el token_ws como parámetro de consulta
            const url = new URL(responseData.url);
            
            // Parametro añadido
            url.searchParams.set('token_ws', responseData.token);
            
            const redirectUrl = url.toString();
            console.log("URL con token:", redirectUrl);
            
            // Redirigir al usuario a la pag de pago de webpay
            window.location.href = redirectUrl;
            
            resolve({
                exito: true
            });
        })
        .catch(error => {
            console.error('Error detallado:', error);
            
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                html: `
                    <p>No se pudo procesar el pago con WebPay:</p>
                    <pre style="text-align: left; background: #f8f9fa; padding: 10px; border-radius: 5px;">${error.message}</pre>
                `,
                confirmButtonText: 'Entendido'
            });
            
            reject(error);
        });
    });
}

function seleccionarMetodoPago(metodoEntrega, costoEntrega) {
    Swal.fire({
        title: 'Método de Pago',
        input: 'radio',
        inputOptions: {
            'debito': 'Tarjeta de Débito',
            'credito': 'Tarjeta de Crédito',
            'transferencia': 'Transferencia Bancaria'
        },
        inputValue: 'debito',
        showCancelButton: true,
        confirmButtonText: 'Finalizar Compra',
        cancelButtonText: 'Atrás',
        inputValidator: (value) => {
            if (!value) {
                return 'Debes seleccionar un método de pago';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const metodoPago = result.value;
            confirmarPedido(metodoEntrega, metodoPago, costoEntrega);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            realizarCheckout(); // Volver atrás
        }
    });
}

function confirmarPedido(metodoEntrega, metodoPago, costoEntrega) {
    const currentUser = getCurrentUser();
    const carrito = JSON.parse(localStorage.getItem('ferremas-carrito'));
    
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const total = subtotal + costoEntrega;
    
    const formatter = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    });
    
    Swal.fire({
        title: 'Confirmar Pedido',
        html: `
            <div class="text-start mb-3">
                <p><strong>Método de Entrega:</strong> ${metodoEntrega === 'retiro' ? 'Retiro en Tienda' : 'Despacho a Domicilio'}</p>
                ${metodoEntrega === 'despacho' ? `<p><strong>Dirección:</strong> ${currentUser.direccion || 'No especificada'}</p>` : ''}
                <p><strong>Método de Pago:</strong> ${getNombreMetodoPago(metodoPago)}</p>
                <hr>
                <p><strong>Subtotal:</strong> ${formatter.format(subtotal)}</p>
                ${costoEntrega > 0 ? `<p><strong>Costo de Envío:</strong> ${formatter.format(costoEntrega)}</p>` : ''}
                <p><strong>Total:</strong> ${formatter.format(total)}</p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirmar y Pagar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return procesarPago(metodoPago);
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Crear el pedido
            const nuevoPedido = {
                id: 'PED-' + window.db.generateId().substr(0, 8),
                clienteId: currentUser.id,
                cliente: `${currentUser.nombres} ${currentUser.apellidos}`,
                productos: carrito.map(item => ({
                    id: item.id,
                    nombre: item.nombre,
                    cantidad: item.cantidad,
                    precioUnitario: item.precio,
                    ubicacion: 'Bodega A'
                })),
                fecha: new Date().toISOString(),
                subtotal,
                costoEntrega,
                total,
                metodoPago,
                metodoEntrega: metodoEntrega === 'retiro' ? 'Retiro en Tienda' : 'Despacho a Domicilio',
                direccionEntrega: metodoEntrega === 'despacho' ? currentUser.direccion : null,
                estado: metodoPago === 'transferencia' ? 'Pendiente de Pago' : 'Pendiente'
            };
            
            if (!window.db.pedidos) window.db.pedidos = [];
            window.db.pedidos.push(nuevoPedido);
            window.db.save();
            
            // Vaciar el carrito
            localStorage.setItem('ferremas-carrito', JSON.stringify([]));
            actualizarContadorCarrito();

            // Actualizar el historial de pedidos
            if (currentUser) {
                setupPedidosHistorial(currentUser);
                
                // Forzar la actualización de la vista si estamos en la página de historial
                if (document.getElementById('misPedidos') && !document.getElementById('misPedidos').classList.contains('d-none')) {
                    const pedidos = window.db.pedidos?.filter(p => p.clienteId === currentUser.id) || [];
                    document.getElementById('contador-pedidos').textContent = pedidos.length;
                }
            }
            
            // Mostrar confirmación
            Swal.fire({
                icon: 'success',
                title: '¡Pedido Realizado!',
                html: `
                    <p>Tu pedido #${nuevoPedido.id} ha sido registrado.</p>
                    <p>Estado: <span class="badge ${getBadgeClassForEstado(nuevoPedido.estado)}">${nuevoPedido.estado}</span></p>
                    ${metodoPago === 'transferencia' ? `
                    <div class="alert alert-info mt-3">
                        <p>Por favor realiza la transferencia a:</p>
                        <p><strong>Banco:</strong> Banco de Chile</p>
                        <p><strong>Cuenta:</strong> 123-45678-9</p>
                        <p><strong>RUT:</strong> 12.345.678-9</p>
                        <p><strong>Monto:</strong> ${formatter.format(total)}</p>
                        <p><strong>Asunto:</strong> PED-${nuevoPedido.id}</p>
                    </div>
                    ` : ''}
                `,
                confirmButtonText: 'Ver mis pedidos'
            }).then(() => {
                // Navegar al historial de pedidos
                const btnMisPedidos = document.getElementById('btnMisPedidos');
                if (btnMisPedidos) {
                    btnMisPedidos.click();
                }
            });
        }
    });
}

function getNombreMetodoPago(metodo) {
    const metodos = {
        'debito': 'Tarjeta de Débito',
        'credito': 'Tarjeta de Crédito',
        'transferencia': 'Transferencia Bancaria'
    };
    return metodos[metodo] || metodo;
}

function procesarPago(metodoPago) {
    // Simular procesamiento de pago
    return new Promise((resolve) => {
        setTimeout(() => {
            if (metodoPago === 'transferencia') {
                resolve({ exito: true, requiereConfirmacion: true });
            } else {
                resolve({ exito: true });
            }
        }, 1500);
    });
}

// ==============================================
// Catálogo de Productos
// ==============================================
function setupCatalogoProductos() {
    // Verificar si estamos en una página con catálogo
    if (!document.getElementById('catalogoProductos')) return;
    
    const formatter = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    });
    
    // Cargar productos
    const productos = window.db.products || [];
    const catalogo = document.getElementById('catalogoProductos');
    
    catalogo.innerHTML = productos.map(producto => `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <img src="${producto.attributes.Imagen || 'assets/img/producto-default.jpg'}" 
                     class="card-img-top" 
                     alt="${producto.name}"
                     style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${producto.name}</h5>
                    <p class="text-muted">${producto.attributes.Marca || 'Sin marca'}</p>
                    <p class="card-text">${producto.attributes.Descripcion || 'Sin descripción disponible'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="h5 mb-0">${formatter.format(producto.attributes.Precio[0]?.Valor || 0)}</span>
                        <span class="badge ${producto.attributes.Stock > 0 ? 'bg-success' : 'bg-danger'}">
                            ${producto.attributes.Stock > 0 ? 'En stock' : 'Agotado'}
                        </span>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-primary w-100 agregar-carrito" 
                            data-id="${producto.id}"
                            ${producto.attributes.Stock <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus me-2"></i>
                        ${producto.attributes.Stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Configurar buscador de productos
    const buscador = document.getElementById('buscadorProductos');
    buscador?.addEventListener('input', function(e) {
        const termino = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('#catalogoProductos .card');
        
        cards.forEach(card => {
            const texto = card.textContent.toLowerCase();
            card.parentElement.style.display = texto.includes(termino) ? '' : 'none';
        });
    });
}

// ==============================================
// Funciones Auxiliares
// ==============================================
function getBadgeClassForEstado(estado) {
    const classes = {
        'Pendiente': 'bg-secondary',
        'Pendiente de Pago': 'bg-warning text-dark',
        'Aprobado': 'bg-success',
        'Rechazado': 'bg-danger',
        'En preparación': 'bg-warning text-dark',
        'Listo para despacho': 'bg-info',
        'En tránsito': 'bg-primary',
        'Entregado': 'bg-success'
    };
    return classes[estado] || 'bg-secondary';
}

function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonColor: '#e74c3c'
    });
}

function setupLogout() {
    document.querySelectorAll('a[href="login.html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
}

// ==============================================
// Funciones nuevas para manejar el retorno de WEBPAY
// ==============================================

function verificarRetornoWebPay() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('webpay') === 'true') {
    let transactionData;
    
    // Opción 1: Datos en URL
    const encodedData = urlParams.get('data');
    if (encodedData) {
      try {
        transactionData = JSON.parse(decodeURIComponent(encodedData));
        procesarDatosWebPay(transactionData);
      } catch (e) {
        console.error("Error al decodificar datos:", e);
        mostrarErrorPago("Error al procesar los datos de la transacción");
      }
    }
    // Opción 2: Datos en localStorage
    else if (localStorage.getItem('webpay-transaction')) {
      try {
        transactionData = JSON.parse(localStorage.getItem('webpay-transaction'));
        localStorage.removeItem('webpay-transaction'); // Limpiar después de usar
        procesarDatosWebPay(transactionData);
      } catch (e) {
        console.error("Error al recuperar datos:", e);
        mostrarErrorPago("Error al procesar los datos de la transacción");
      }
    }
  }
  // Verificar si hay error
  else if (urlParams.get('webpay') === 'error' || urlParams.get('status') === 'error') {
    const errorMsg = urlParams.get('message') || localStorage.getItem('webpay-error') || 'Error al procesar el pago';
    localStorage.removeItem('webpay-error');
    mostrarErrorPago(errorMsg);
  }
}

// Función para procesar los datos y crear el pedido en localstorage
function procesarDatosWebPay(datosTransaccion) {
  // Recuperar datos guardados
  const currentUser = getCurrentUser();
  const pendingOrder = JSON.parse(localStorage.getItem('ferremas-pedido-pendiente') || '{}');
  const carrito = JSON.parse(localStorage.getItem('ferremas-carrito') || '[]');
  const metodoEntrega = pendingOrder.datosWebPay?.metodoEntrega || 'retiro';
  const costoEntrega = pendingOrder.datosWebPay?.costoEntrega || 0;
  
  if (datosTransaccion.status === 'Aprobado') {
    // Crear el pedido
    crearPedido(
      currentUser,
      carrito,
      metodoEntrega,
      costoEntrega,
      'WebPay',
      datosTransaccion.buyOrder,
      datosTransaccion
    );
    
    // Limpiar datos temporales
    localStorage.removeItem('ferremas-pedido-pendiente');
    localStorage.setItem('ferremas-carrito', JSON.stringify([]));
    actualizarContadorCarrito();
  } else {
    mostrarErrorPago('La transacción no fue aprobada: ' + (datosTransaccion.details || 'Error desconocido'));
  }
}

// ==============================================
// Funciones nuevas GENERADOR DE DIVISAS
// ==============================================

// Variables globales para el conversor
// Variables globales para el conversor
let tasaDolar = null;

// Función para obtener el valor del dólar
async function obtenerValorDolar() {
    try {
        const response = await fetch("http://localhost:3000/api/dolar");
        if (!response.ok) throw new Error("Error al obtener valor del dólar");
        const data = await response.json();
        
        if (!data.valorDolar) throw new Error("Valor del dólar no disponible");
        
        tasaDolar = data.valorDolar;
        console.log("Tasa del dólar obtenida:", tasaDolar);
        
        // Mostrar valor del dólar si existe el elemento
        const dolarElement = document.querySelector('.dolar-value');
        if (dolarElement) {
            dolarElement.textContent = `$${tasaDolar.toLocaleString('es-CL')} CLP`;
        }
        
        return tasaDolar;
    } catch (error) {
        console.error("Error en obtenerValorDolar:", error);
        // Mostrar mensaje de error al usuario
        const selectDivisa = document.getElementById('selectDivisa');
        if (selectDivisa) {
            selectDivisa.disabled = true;
            selectDivisa.innerHTML = '<option value="CLP" selected>Error al cargar divisas</option>';
        }
        return null;
    }
}

// Función para convertir y mostrar precios
function actualizarPrecios() {
    const divisaSeleccionada = document.getElementById('selectDivisa').value;
    console.log("Divisa seleccionada:", divisaSeleccionada);
    
    const productos = document.querySelectorAll('.product-card');
    console.log("Productos encontrados:", productos.length);
    
    productos.forEach(producto => {
        const precioCLP = parseFloat(producto.dataset.precio);
        const precioElement = producto.querySelector('.precio');
        const precioConvertidoElement = producto.querySelector('.precio-convertido');
        
        if (divisaSeleccionada === 'USD' && tasaDolar) {
            const precioUSD = precioCLP / tasaDolar;
            precioElement.textContent = `$${precioCLP.toLocaleString('es-CL')} CLP`;
            
            // Crear elemento si no existe
            if (!precioConvertidoElement) {
                const nuevoElemento = document.createElement('p');
                nuevoElemento.className = 'precio-convertido text-muted small mb-0';
                producto.querySelector('.card-body').appendChild(nuevoElemento);
                nuevoElemento.textContent = `$${precioUSD.toFixed(2)} USD`;
            } else {
                precioConvertidoElement.textContent = `$${precioUSD.toFixed(2)} USD`;
                precioConvertidoElement.style.display = 'block';
            }
        } else {
            precioElement.textContent = `$${precioCLP.toLocaleString('es-CL')} CLP`;
            if (precioConvertidoElement) {
                precioConvertidoElement.style.display = 'none';
            }
        }
    });
}

// Inicialización del conversor
function setupConversorDivisas() {
    const selectDivisa = document.getElementById('selectDivisa');
    if (!selectDivisa) return;
    
    selectDivisa.disabled = true;
    selectDivisa.innerHTML = '<option value="CLP" selected>Cargando divisas...</option>';
    
    obtenerValorDolar().then(() => {
        selectDivisa.disabled = false;
        selectDivisa.innerHTML = `
            <option value="CLP" selected>CLP $</option>
            <option value="USD">USD $</option>
        `;
        
        selectDivisa.addEventListener('change', actualizarPrecios);
        
        // Actualizar precios si estamos en página de productos
        if (document.getElementById('listaProductos')) {
            actualizarPrecios();
        }
    });
}