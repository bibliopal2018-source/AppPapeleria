// =======================================================
// DATOS INICIALES (Solo se usan si localStorage está vacío)
// =======================================================
const PRODUCTOS_INICIALES = [
    {id: 'cuaderno', nombre: 'Cuaderno Profesional', descripcion: 'Cuadernos argollados, tapa dura, 100 hojas.', precio: 3500, unidad: 'unidad'},
    {id: 'lapices', nombre: 'Set de Lápices (x12)', descripcion: 'Lápices No. 2 con borrador. Caja de 12 unidades.', precio: 8900, unidad: 'set'},
    {id: 'fotocopias', nombre: 'Fotocopias B/N', descripcion: 'Copia e impresión a blanco y negro (Carta/Oficio).', precio: 100, unidad: 'página'},
    {id: 'pliego', nombre: 'Pliego de Cartulina', descripcion: 'Cartulina de colores surtidos.', precio: 1200, unidad: 'pliego'},
    {id: 'borrador', nombre: 'Borrador de Nata', descripcion: 'Borrador suave de alta calidad.', precio: 800, unidad: 'unidad'}
];

// =======================================================
// VARIABLES GLOBALES Y REFERENCIAS
// =======================================================
let listaProductos = []; // Esta lista se cargará/guardará dinámicamente
let ventasGuardadas = []; 

// Referencias del DOM
const seccionCatalogo = document.getElementById('seccionCatalogo');
const formulario = document.getElementById('formularioPedido');
const selectProducto = document.getElementById('producto');
const inputCantidad = document.getElementById('cantidad');
const spanPrecioTotal = document.getElementById('precioTotal');
const listaVentasDiv = document.getElementById('listaVentas'); 
const btnLimpiarVentas = document.getElementById('btnLimpiarVentas'); 

// Referencias de Administración
const formularioProducto = document.getElementById('formularioProducto');
const inputAdminId = document.getElementById('adminId');
const inputAdminNombre = document.getElementById('adminNombre');
const inputAdminDescripcion = document.getElementById('adminDescripcion');
const inputAdminPrecio = document.getElementById('adminPrecio');
const inputAdminUnidad = document.getElementById('adminUnidad');
const inputProductoIdEditar = document.getElementById('productoIdEditar');
const productosActivosDiv = document.getElementById('productosActivos');
const btnGuardarProducto = document.getElementById('btnGuardarProducto');
const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');


// -----------------------------------------------------
// LÓGICA DE GESTIÓN DE PRODUCTOS (CRUD y Carga/Guardado)
// -----------------------------------------------------

// Carga los productos desde localStorage o usa los iniciales
function cargarProductos() {
    const productosJSON = localStorage.getItem('listaProductosPapeleria');
    if (productosJSON) {
        // Si hay datos guardados, los usa
        listaProductos = JSON.parse(productosJSON);
    } else {
        // Si no hay nada, usa la lista inicial y la guarda inmediatamente
        listaProductos = PRODUCTOS_INICIALES;
        guardarProductos(); 
    }
    // Después de cargar, reconstruimos la interfaz
    cargarVentasInterface();
}

// Guarda los productos en localStorage
function guardarProductos() {
    localStorage.setItem('listaProductosPapeleria', JSON.stringify(listaProductos));
}

// Función auxiliar para refrescar todas las vistas dependientes
function cargarVentasInterface() {
    construirCatalogo();
    construirOpcionesVenta();
    mostrarProductosActivos();
    actualizarTotal();
}

// Muestra la lista de productos en el panel de administración
function mostrarProductosActivos() {
    productosActivosDiv.innerHTML = '';
    
    if (listaProductos.length === 0) {
        productosActivosDiv.innerHTML = '<p>No hay productos activos. ¡Añade el primero!</p>';
        return;
    }

    listaProductos.forEach(producto => {
        const fila = document.createElement('div');
        fila.className = 'producto-admin-fila';
        
        const precioFormateado = producto.precio.toLocaleString('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            minimumFractionDigits: 0 
        });

        fila.innerHTML = `
            <div class="producto-admin-info">
                <strong>${producto.nombre}</strong> (ID: ${producto.id})<br>
                Precio: ${precioFormateado} por ${producto.unidad}
            </div>
            <div class="producto-admin-acciones">
                <button class="btn-editar" data-id="${producto.id}">Editar</button>
                <button class="btn-eliminar" data-id="${producto.id}">Eliminar</button>
            </div>
        `;
        productosActivosDiv.appendChild(fila);
    });
}

// Escucha el envío del formulario de producto (Añadir o Editar)
formularioProducto.addEventListener('submit', function(e) {
    e.preventDefault();

    const id = inputAdminId.value.trim().toLowerCase(); 
    const nombre = inputAdminNombre.value.trim();
    const descripcion = inputAdminDescripcion.value.trim();
    const precio = Number(inputAdminPrecio.value); // Usa Number() para robustez
    const unidad = inputAdminUnidad.value.trim();
    const idAEditar = inputProductoIdEditar.value;

    // Validación de Precio: debe ser un número entero positivo
    if (isNaN(precio) || precio <= 0 || !Number.isInteger(precio)) {
        alert('El precio unitario debe ser un número entero positivo (sin puntos ni símbolos).');
        return;
    }

    const nuevoProducto = { id, nombre, descripcion, precio, unidad };

    if (idAEditar) {
        // MODO EDICIÓN
        const indice = listaProductos.findIndex(p => p.id === idAEditar);
        if (indice !== -1) {
            listaProductos[indice] = { ...nuevoProducto, id: idAEditar }; 
        }
        
        // Limpiar después de editar
        inputProductoIdEditar.value = '';
        btnGuardarProducto.textContent = 'Añadir Producto';
        btnCancelarEdicion.style.display = 'none';
        inputAdminId.disabled = false;
    } else {
        // MODO AÑADIR
        if (listaProductos.some(p => p.id === id)) {
            alert(`Ya existe un producto con el ID: ${id}. Por favor, usa un ID único.`);
            return;
        }
        listaProductos.push(nuevoProducto);
    }
    
    guardarProductos();
    cargarVentasInterface(); // Refrescar todas las vistas
    formularioProducto.reset();
});

// Delega eventos de clic para Editar y Eliminar
productosActivosDiv.addEventListener('click', function(e) {
    const boton = e.target;
    const id = boton.dataset.id;
    
    if (boton.classList.contains('btn-eliminar')) {
        if (confirm(`¿Estás seguro de que quieres eliminar el producto con ID: ${id}?`)) {
            listaProductos = listaProductos.filter(p => p.id !== id);
            guardarProductos();
            cargarVentasInterface(); 
        }
    } else if (boton.classList.contains('btn-editar')) {
        const producto = listaProductos.find(p => p.id === id);
        if (producto) {
            // Rellenar el formulario
            inputAdminId.value = producto.id;
            inputAdminNombre.value = producto.nombre;
            inputAdminDescripcion.value = producto.descripcion;
            inputAdminPrecio.value = producto.precio;
            inputAdminUnidad.value = producto.unidad;
            
            // Configurar el modo edición
            inputProductoIdEditar.value = producto.id; 
            btnGuardarProducto.textContent = 'Guardar Cambios';
            btnCancelarEdicion.style.display = 'inline';
            inputAdminId.disabled = true; 
        }
    }
});

btnCancelarEdicion.addEventListener('click', function() {
    formularioProducto.reset();
    inputProductoIdEditar.value = '';
    btnGuardarProducto.textContent = 'Añadir Producto';
    btnCancelarEdicion.style.display = 'none';
    inputAdminId.disabled = false;
});


// -----------------------------------------------------
// FUNCIONES DE VENTA/CATÁLOGO
// -----------------------------------------------------

function construirCatalogo() {
    seccionCatalogo.innerHTML = '<h2>Catálogo de Productos y Servicios</h2>'; 
    
    listaProductos.forEach(producto => { 
        const tarjeta = document.createElement('div');
        tarjeta.className = 'producto-tarjeta'; 
        const precioFormateado = producto.precio.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
        tarjeta.innerHTML = `
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion}</p>
            <p class="precio">${precioFormateado} por ${producto.unidad}</p>
        `;
        seccionCatalogo.appendChild(tarjeta);
    });
}

function construirOpcionesVenta() {
    selectProducto.innerHTML = '<option value="">Selecciona un producto...</option>';
    
    listaProductos.forEach(producto => { 
        const opcion = document.createElement('option');
        opcion.value = producto.id; 
        opcion.textContent = `${producto.nombre} (${producto.unidad})`; 
        selectProducto.appendChild(opcion);
    });
}

function actualizarTotal() {
    const productoSeleccionadoId = selectProducto.value;
    const cantidad = Number(inputCantidad.value) || 0; 
    
    const producto = listaProductos.find(p => p.id === productoSeleccionadoId);
    
    // Asegura que el precio sea un número válido
    const precioUnitario = producto && typeof producto.precio === 'number' ? producto.precio : 0; 
    
    const total = precioUnitario * cantidad;
    
    spanPrecioTotal.textContent = total.toLocaleString('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        minimumFractionDigits: 0 
    });
}


// --- Lógica de Historial de Ventas ---

function cargarVentas() {
    const ventasJSON = localStorage.getItem('ventasPapeleria');
    if (ventasJSON) {
        ventasGuardadas = JSON.parse(ventasJSON);
    } else {
        ventasGuardadas = [];
    }
    mostrarVentas();
}

function guardarVentas() {
    localStorage.setItem('ventasPapeleria', JSON.stringify(ventasGuardadas));
}

function mostrarVentas() {
    listaVentasDiv.innerHTML = '<h3>Ventas Registradas Recientes</h3>';

    if (ventasGuardadas.length === 0) {
        listaVentasDiv.innerHTML += '<p>No hay ventas guardadas aún.</p>';
        return;
    }
    
    ventasGuardadas.slice().reverse().forEach((venta) => {
        const registro = document.createElement('div');
        registro.className = 'registro-venta';
        const totalFormateado = venta.totalPagado.toLocaleString('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            minimumFractionDigits: 0 
        });

        registro.innerHTML = `
            <p><strong>Fecha:</strong> ${venta.fecha} | <strong>Cliente:</strong> ${venta.cliente}</p>
            <p><strong>Producto:</strong> ${venta.nombreProducto} (x${venta.cantidad})</p>
            <p class="precio"><strong>TOTAL:</strong> ${totalFormateado}</p>
        `;
        listaVentasDiv.appendChild(registro);
    });
}

btnLimpiarVentas.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres eliminar todas las ventas guardadas? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('ventasPapeleria');
        ventasGuardadas = []; 
        mostrarVentas(); 
    }
});


formulario.addEventListener('submit', function(evento) {
    evento.preventDefault(); 
    
    const productoSeleccionadoId = selectProducto.value;
    const producto = listaProductos.find(p => p.id === productoSeleccionadoId); 
    const cantidad = Number(inputCantidad.value) || 0;
    const totalCalculado = (producto ? producto.precio : 0) * cantidad;

    const datosVenta = {
        cliente: document.getElementById('nombreCliente').value,
        productoID: productoSeleccionadoId,
        nombreProducto: producto ? producto.nombre : 'ERROR: Producto no encontrado',
        cantidad: cantidad,
        totalPagado: totalCalculado, 
        notasAdicionales: document.getElementById('notas').value,
        fecha: new Date().toLocaleDateString('es-CO') 
    };

    ventasGuardadas.push(datosVenta);
    guardarVentas(); 
    mostrarVentas(); 

    document.getElementById('mensajeConfirmacion').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('mensajeConfirmacion').style.display = 'none';
        formulario.reset(); 
        actualizarTotal(); 
    }, 3000);
});


// -----------------------------------------------------
// INICIALIZACIÓN
// -----------------------------------------------------

// Eventos que disparan el cálculo del total
selectProducto.addEventListener('change', actualizarTotal);
inputCantidad.addEventListener('input', actualizarTotal); 

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos(); // Carga productos y construye la interfaz
    cargarVentas(); // Carga las ventas
    actualizarTotal(); // Forzamos el cálculo inicial
});