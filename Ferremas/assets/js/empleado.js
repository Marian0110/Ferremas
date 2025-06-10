// empleado.js - Funcionalidades completas para Empleados según rol
document.addEventListener('DOMContentLoaded', function() {
    // Página de login
    if (document.getElementById('empleadoLoginForm')) {
        setupEmpleadoLogin();
        return;
    }

    // Verificar autenticación para otras páginas
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role === 'admin') {
        window.location.href = 'empleadologin.html';
        return;
    }

    // Configurar la página de empleado
    setupEmpleadoPage(currentUser);
});

// Configurar el login de empleados
function setupEmpleadoLogin() {
    const form = document.getElementById('empleadoLoginForm');
    form?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('empleadoEmail').value.trim();
        const password = document.getElementById('empleadoPassword').value;

        try {
            // Autenticar empleado (no admin)
            const { user, token } = authenticateEmployee(email, password);
            
            localStorage.setItem('ferremas-currentToken', token);
            
            Swal.fire({
                icon: 'success',
                title: 'Bienvenido',
                text: `Hola ${user.nombres}!`,
                confirmButtonColor: '#27ae60',
                timer: 1500
            }).then(() => {
                window.location.href = 'empleado.html';
            });
        } catch (error) {
            showError(error.message);
        }
    });
}

// Autenticación específica para empleados
function authenticateEmployee(email, password) {
    const user = window.db.users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password &&
        u.role !== 'admin'
    );

    if (!user) {
        throw new Error('Credenciales incorrectas o no tiene permisos de empleado');
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

// Configurar la página principal del empleado
function setupEmpleadoPage(user) {
    // Mostrar información del empleado
    updateUserProfile(user);
    
    // Configurar logout
    setupLogout();
    
    // Mostrar el panel según el rol
    setupRoleSpecificContent(user.role);
}

// Actualizar perfil del usuario
function updateUserProfile(user) {
    document.getElementById('nombreEmpleadoNav').textContent = `${user.nombres} ${user.apellidos}`;
    document.getElementById('nombreEmpleado').textContent = `${user.nombres} ${user.apellidos}`;
    document.getElementById('rolEmpleado').textContent = getRoleName(user.role);
    document.getElementById('emailEmpleado').textContent = user.email || 'No especificado';
    document.getElementById('telefonoEmpleado').textContent = user.telefono || 'No especificado';
    document.getElementById('sucursalEmpleado').textContent = getSucursalName(user.sucursal) || 'No especificada';
    
    // Configurar avatar
    setupEmployeeAvatar(user);
}

// Función para obtener nombre de sucursal
function getSucursalName(sucursalCode) {
  const sucursales = {
    'rm-santiago': 'Santiago (RM)',
    'v-valparaiso': 'Valparaíso (V)',
    'vi-rancagua': 'Rancagua (VI)',
    'vii-talca': 'Talca (VII)',
    'viii-concepcion': 'Concepción (VIII)',
    'ix-temuco': 'Temuco (IX)',
    'x-puertomontt': 'Puerto Montt (X)',
    'xv-iquique': 'Iquique (XV)'
  };
  return sucursales[sucursalCode] || sucursalCode;
}

// Configurar avatar del empleado con API
function setupEmployeeAvatar(user) {
    const avatar = document.getElementById('avatarEmpleado');
    if (!avatar) return;
    
    const initials = (user.nombres?.charAt(0) || '') + (user.apellidos?.charAt(0) || '');
    avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=e74c3c&color=fff&size=150`;
    avatar.alt = `Avatar de ${user.nombres} ${user.apellidos}`;
    avatar.style.border = '3px solid #f39c12';
    avatar.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
}

// Configurar logout
function setupLogout() {
    document.querySelector('a[href="login.html"]')?.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
}

// Configurar contenido específico por rol
function setupRoleSpecificContent(role) {
    // Ocultar todos los paneles primero
    document.getElementById('vendedorContent')?.classList.add('d-none');
    document.getElementById('bodegueroContent')?.classList.add('d-none');
    document.getElementById('contadorContent')?.classList.add('d-none');
    
    // Mostrar el panel correspondiente al rol
    switch(role) {
        case 'vendedor':
            setupVendedorPanel();
            break;
        case 'bodeguero':
            setupBodegueroPanel();
            break;
        case 'contador':
            setupContadorPanel();
            break;
    }
}

// ==============================================
// Funcionalidades específicas para VENDEDOR
// ==============================================
function setupVendedorPanel() {
    const panel = document.getElementById('vendedorContent');
    if (!panel) return;
    
    panel.classList.remove('d-none');
    
    // Cargar productos en bodega
    loadProductosBodega();
    
    // Configurar buscador de productos
    document.getElementById('buscarProducto')?.addEventListener('input', function(e) {
        filterProductosBodega(e.target.value);
    });
    
    // Cargar pedidos pendientes
    loadPedidosVendedor();
    
    // Cargar despachos
    loadDespachosVendedor();
    
    // Configurar tabs
    setupVendedorTabs();
    
    // Configurar eventos para botones de acciones
    setupVendedorActions();
}

function setupVendedorTabs() {
    const tabEls = document.querySelectorAll('#vendedorTabs button');
    tabEls.forEach(tab => {
        tab.addEventListener('click', function(event) {
            const tabId = event.target.getAttribute('data-bs-target').substring(1);
            // Puedes agregar lógica adicional al cambiar de pestaña si es necesario
        });
    });
}

function loadProductosBodega() {
    const tbody = document.getElementById('tablaProductosBodega');
    if (!tbody) return;
    
    const formatter = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    });
    
    const allProducts = window.db.categories.flatMap(cat => 
        cat.products.map(prod => ({
            ...prod,
            categoria: cat.name
        }))
    );
    
    tbody.innerHTML = allProducts.map(prod => {
        const stock = prod.attributes.Stock || 0;
        const isLowStock = stock < 10;
        
        return `
            <tr ${isLowStock ? 'class="table-warning"' : ''}>
                <td>${prod.attributes["Código del producto"] || ''}</td>
                <td>${prod.name || ''}</td>
                <td>${prod.attributes.Marca || ''}</td>
                <td>${formatter.format(prod.attributes.Precio[0]?.Valor || 0)}</td>
                <td ${isLowStock ? 'class="text-danger fw-bold"' : ''}>${stock}</td>
                <td>${prod.categoria}</td>
            </tr>
        `;
    }).join('');
}

function filterProductosBodega(searchTerm) {
    const rows = document.querySelectorAll('#tablaProductosBodega tr');
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

function loadPedidosVendedor() {
    const tbody = document.getElementById('tablaPedidosVendedor');
    if (!tbody) return;
    
    const pedidos = window.db.pedidos || [];
    
    tbody.innerHTML = pedidos.map(pedido => `
        <tr>
            <td>${pedido.id}</td>
            <td>${pedido.cliente}</td>
            <td>${pedido.productos.map(p => p.nombre).join(', ')}</td>
            <td>$${pedido.total.toLocaleString('es-CL')}</td>
            <td>${new Date(pedido.fecha).toLocaleDateString()}</td>
            <td><span class="badge ${getBadgeClassForEstado(pedido.estado)}">${pedido.estado}</span></td>
            <td>
                ${pedido.estado === 'Pendiente' ? `
                <button class="btn btn-sm btn-success aprobar-pedido" data-id="${pedido.id}">
                    <i class="fas fa-check"></i> Aprobar
                </button>
                <button class="btn btn-sm btn-danger rechazar-pedido" data-id="${pedido.id}">
                    <i class="fas fa-times"></i> Rechazar
                </button>
                ` : ''}
                ${pedido.estado === 'Aprobado' ? `
                <button class="btn btn-sm btn-primary enviar-bodega" data-id="${pedido.id}">
                    <i class="fas fa-box"></i> Enviar a Bodega
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function loadDespachosVendedor() {
    const tbody = document.getElementById('tablaDespachos');
    if (!tbody) return;
    
    const despachos = window.db.despachos || [];
    
    tbody.innerHTML = despachos.map(despacho => `
        <tr>
            <td>${despacho.id}</td>
            <td>${despacho.pedidoId}</td>
            <td>${despacho.cliente}</td>
            <td>${despacho.direccion}</td>
            <td>${despacho.productos.join(', ')}</td>
            <td><span class="badge ${getBadgeClassForEstado(despacho.estado)}">${despacho.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-warning actualizar-despacho" data-id="${despacho.id}">
                    <i class="fas fa-sync-alt"></i> Actualizar
                </button>
            </td>
        </tr>
    `).join('');
}

function setupVendedorActions() {
    // Aprobar pedidos
    document.addEventListener('click', function(e) {
        if (e.target.closest('.aprobar-pedido')) {
            const pedidoId = e.target.closest('button').dataset.id;
            aprobarPedido(pedidoId);
        }
        
        if (e.target.closest('.rechazar-pedido')) {
            const pedidoId = e.target.closest('button').dataset.id;
            rechazarPedido(pedidoId);
        }
        
        if (e.target.closest('.enviar-bodega')) {
            const pedidoId = e.target.closest('button').dataset.id;
            enviarABodega(pedidoId);
        }
        
        if (e.target.closest('.actualizar-despacho')) {
            const despachoId = e.target.closest('button').dataset.id;
            actualizarDespacho(despachoId);
        }
    });
}

function aprobarPedido(pedidoId) {
    Swal.fire({
        title: '¿Aprobar pedido?',
        text: `Estás a punto de aprobar el pedido ${pedidoId}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, aprobar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const pedido = window.db.pedidos.find(p => p.id === pedidoId);
            if (pedido) {
                pedido.estado = 'Aprobado';
                window.db.save();
                Swal.fire(
                    '¡Aprobado!',
                    `El pedido ${pedidoId} ha sido aprobado.`,
                    'success'
                ).then(() => {
                    loadPedidosVendedor();
                });
            }
        }
    });
}

function rechazarPedido(pedidoId) {
    Swal.fire({
        title: 'Motivo de rechazo',
        input: 'text',
        inputLabel: 'Ingrese el motivo del rechazo',
        inputPlaceholder: 'Ej: Producto no disponible',
        showCancelButton: true,
        confirmButtonText: 'Rechazar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) {
                return 'Debe ingresar un motivo';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const pedido = window.db.pedidos.find(p => p.id === pedidoId);
            if (pedido) {
                pedido.estado = 'Rechazado';
                pedido.motivoRechazo = result.value;
                window.db.save();
                Swal.fire(
                    '¡Rechazado!',
                    `El pedido ${pedidoId} ha sido rechazado. Motivo: ${result.value}`,
                    'success'
                ).then(() => {
                    loadPedidosVendedor();
                });
            }
        }
    });
}

function enviarABodega(pedidoId) {
    Swal.fire({
        title: '¿Enviar a bodega?',
        text: `El pedido ${pedidoId} será enviado a bodega para preparación`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, enviar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const pedido = window.db.pedidos.find(p => p.id === pedidoId);
            if (pedido) {
                pedido.estado = 'En preparación';
                window.db.save();
                Swal.fire(
                    '¡Enviado!',
                    `El pedido ${pedidoId} ha sido enviado a bodega.`,
                    'success'
                ).then(() => {
                    loadPedidosVendedor();
                });
            }
        }
    });
}

function actualizarDespacho(despachoId) {
    Swal.fire({
        title: 'Actualizar estado de despacho',
        input: 'select',
        inputOptions: {
            'preparacion': 'En preparación',
            'transito': 'En tránsito',
            'entregado': 'Entregado'
        },
        inputPlaceholder: 'Seleccione estado',
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const despacho = window.db.despachos.find(d => d.id === despachoId);
            if (despacho) {
                despacho.estado = result.value;
                window.db.save();
                Swal.fire(
                    '¡Actualizado!',
                    `El despacho ${despachoId} ahora está: ${result.value}`,
                    'success'
                ).then(() => {
                    loadDespachosVendedor();
                });
            }
        }
    });
}

// ==============================================
// Funcionalidades específicas para BODEGUERO
// ==============================================
function setupBodegueroPanel() {
    const panel = document.getElementById('bodegueroContent');
    if (!panel) return;
    
    panel.classList.remove('d-none');
    
    // Cargar pedidos pendientes
    loadPedidosBodeguero();
    
    // Configurar eventos para botones de acciones
    setupBodegueroActions();
}

function loadPedidosBodeguero() {
    const tbody = document.getElementById('tablaPedidos');
    if (!tbody) return;
    
    const pedidos = window.db.pedidos.filter(p => p.estado === 'En preparación');
    
    tbody.innerHTML = pedidos.map(pedido => `
        <tr>
            <td>${pedido.id}</td>
            <td>${pedido.productos.map(p => p.nombre).join(', ')}</td>
            <td>${pedido.productos.map(p => p.cantidad).join(', ')}</td>
            <td>${pedido.productos.map(p => p.ubicacion || 'Bodega A').join(', ')}</td>
            <td><span class="badge ${getBadgeClassForEstado(pedido.estado)}">${pedido.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-success marcar-preparado" data-id="${pedido.id}">
                    <i class="fas fa-check-double"></i> Marcar como preparado
                </button>
            </td>
        </tr>
    `).join('');
}

function setupBodegueroActions() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.marcar-preparado')) {
            const pedidoId = e.target.closest('button').dataset.id;
            marcarPedidoPreparado(pedidoId);
        }
    });
}

function marcarPedidoPreparado(pedidoId) {
    Swal.fire({
        title: '¿Marcar como preparado?',
        text: `Confirma que el pedido ${pedidoId} está listo para despacho`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, marcar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const pedido = window.db.pedidos.find(p => p.id === pedidoId);
            if (pedido) {
                pedido.estado = 'Listo para despacho';
                
                // Crear registro de despacho
                const despacho = {
                    id: 'DESP-' + window.db.generateId().substr(0, 8),
                    pedidoId: pedido.id,
                    cliente: pedido.cliente,
                    direccion: pedido.direccion,
                    productos: pedido.productos.map(p => p.nombre),
                    estado: 'preparacion'
                };
                
                if (!window.db.despachos) window.db.despachos = [];
                window.db.despachos.push(despacho);
                window.db.save();
                
                Swal.fire(
                    '¡Listo!',
                    `El pedido ${pedidoId} ha sido marcado como preparado.`,
                    'success'
                ).then(() => {
                    loadPedidosBodeguero();
                });
            }
        }
    });
}

// ==============================================
// Funcionalidades específicas para CONTADOR
// ==============================================
function setupContadorPanel() {
    const panel = document.getElementById('contadorContent');
    if (!panel) return;
    
    panel.classList.remove('d-none');
    
    // Cargar datos financieros
    loadDatosFinancieros();
    
    // Configurar eventos para botones de acciones
    setupContadorActions();
}

function loadDatosFinancieros() {
    // Calcular ventas del día
    const hoy = new Date().toISOString().split('T')[0];
    const ventasHoy = window.db.ventas
        ?.filter(v => v.fecha.split('T')[0] === hoy)
        ?.reduce((sum, v) => sum + v.monto, 0) || 0;
    
    // Calcular ventas del mes actual
    const mesActual = new Date().getMonth() + 1;
    const añoActual = new Date().getFullYear();
    const ventasMes = window.db.ventas
        ?.filter(v => {
            const fecha = new Date(v.fecha);
            return fecha.getMonth() + 1 === mesActual && fecha.getFullYear() === añoActual;
        })
        ?.reduce((sum, v) => sum + v.monto, 0) || 0;
    
    // Calcular valor total del inventario
    const totalValue = window.db.categories.reduce((sum, cat) => {
        return sum + cat.products.reduce((sumProd, prod) => {
            return sumProd + (prod.attributes.Precio[0].Valor * (prod.attributes.Stock || 0));
        }, 0);
    }, 0);
    
    const formatter = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    });
    
    document.getElementById('ventasHoy').textContent = formatter.format(ventasHoy);
    document.getElementById('ventasMes').textContent = formatter.format(ventasMes);
    document.getElementById('totalInventario').textContent = formatter.format(totalValue);
    
    // Cargar tabla de finanzas
    const tbody = document.getElementById('tablaFinanzas');
    if (!tbody) return;
    
    const ventas = window.db.ventas || [];
    
    tbody.innerHTML = ventas.map(venta => `
        <tr>
            <td>${new Date(venta.fecha).toLocaleDateString()}</td>
            <td>${venta.id}</td>
            <td>${venta.cliente}</td>
            <td>${formatter.format(venta.monto)}</td>
            <td>${venta.metodo}</td>
            <td>
                ${venta.metodo === 'Transferencia' && !venta.pagoConfirmado ? `
                <button class="btn btn-sm btn-success confirmar-pago" data-id="${venta.id}">
                    <i class="fas fa-check-circle"></i> Confirmar pago
                </button>
                ` : ''}
                ${!venta.entregaRegistrada ? `
                <button class="btn btn-sm btn-primary registrar-entrega" data-id="${venta.id}">
                    <i class="fas fa-truck"></i> Registrar entrega
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function setupContadorActions() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.confirmar-pago')) {
            const ventaId = e.target.closest('button').dataset.id;
            confirmarPago(ventaId);
        }
        
        if (e.target.closest('.registrar-entrega')) {
            const ventaId = e.target.closest('button').dataset.id;
            registrarEntrega(ventaId);
        }
    });
}

function confirmarPago(ventaId) {
    Swal.fire({
        title: '¿Confirmar pago?',
        text: `Confirma que el pago de la venta ${ventaId} ha sido recibido`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const venta = window.db.ventas.find(v => v.id === ventaId);
            if (venta) {
                venta.pagoConfirmado = true;
                venta.fechaConfirmacion = new Date().toISOString();
                window.db.save();
                Swal.fire(
                    '¡Confirmado!',
                    `El pago de la venta ${ventaId} ha sido confirmado.`,
                    'success'
                ).then(() => {
                    loadDatosFinancieros();
                });
            }
        }
    });
}

function registrarEntrega(ventaId) {
    Swal.fire({
        title: 'Registrar entrega',
        input: 'text',
        inputLabel: 'Número de comprobante o guía de despacho',
        inputPlaceholder: 'Ej: GD-2023-001',
        showCancelButton: true,
        confirmButtonText: 'Registrar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) {
                return 'Debe ingresar un número de comprobante';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const venta = window.db.ventas.find(v => v.id === ventaId);
            if (venta) {
                venta.entregaRegistrada = true;
                venta.comprobanteEntrega = result.value;
                venta.fechaEntrega = new Date().toISOString();
                window.db.save();
                Swal.fire(
                    '¡Registrado!',
                    `La entrega de la venta ${ventaId} ha sido registrada con comprobante: ${result.value}`,
                    'success'
                ).then(() => {
                    loadDatosFinancieros();
                });
            }
        }
    });
}

// ==============================================
// Funciones auxiliares
// ==============================================
function getRoleName(role) {
    const roles = { 
        'vendedor': 'Vendedor', 
        'bodeguero': 'Bodeguero', 
        'contador': 'Contador' 
    };
    return roles[role] || role;
}

function getBadgeClassForEstado(estado) {
    const classes = {
        'Pendiente': 'bg-secondary',
        'Aprobado': 'bg-success',
        'Rechazado': 'bg-danger',
        'En preparación': 'bg-warning text-dark',
        'Listo para despacho': 'bg-info',
        'Entregado': 'bg-primary'
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

function logout() {
    localStorage.removeItem('ferremas-currentToken');
    window.location.href = 'login.html';
}