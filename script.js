// =======================================================
// AJUSTE CRÍTICO PARA EL ENVÍO DE PEDIDOS (Formspree)
// =======================================================
// Corregido: Nombre de variable y URL CORRECTOS
const FORM_ENDPOINT = 'https://formspree.io/f/myznrkbv';
// =======================================================
// DATOS INICIALES Y VARIABLES GLOBALES
// =======================================================
const PRODUCTOS_INICIALES = [
    {id: 'cuaderno', nombre: 'Cuaderno Profesional', descripcion: 'Cuadernos argollados, tapa dura, 100 hojas.', precio: 3500, unidad: 'unidad'},
    {id: 'lapices', nombre: 'Set de Lápices (x12)', descripcion: 'Lápices No. 2 con borrador. Caja de 12 unidades.', precio: 8900, unidad: 'set'},
    {id: 'fotocopias', nombre: 'Fotocopias B/N', descripcion: 'Copia e impresión a blanco y negro (Carta/Oficio).', precio: 100, unidad: 'página'},
    {id: 'pliego', nombre: 'Pliego de Cartulina', descripcion: 'Cartulina de colores surtidos.', precio: 1200, unidad: 'pliego'},
    {id: 'borrador', nombre: 'Borrador de Nata', descripcion: 'Borrador suave de alta calidad.', precio: 800, unidad: 'unidad'}
];

let listaProductos = []; 
let ventasGuardadas = []; 

// Referencias del DOM (Todas las referencias están aquí)
const seccionCatalogo = document.getElementById('seccionCatalogo');
const formulario = document.getElementById('formularioPedido');
const selectProducto = document.getElementById('producto');
const inputCantidad = document.getElementById('cantidad');
const spanPrecioTotal = document.getElementById('precioTotal');
const listaVentasDiv = document.getElementById('listaVentas'); 
const btnLimpiarVentas = document.getElementById('btnLimpiarVentas'); 
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
// LÓGICA DE GESTIÓN DE PRODUCTOS (CRUD y Persistencia)
// -----------------------------------------------------

// Carga los productos desde localStorage o usa los iniciales
function cargarProductos() {
    const productosJSON = localStorage.getItem('listaProductosPapeleria');
    if (productosJSON) {
        listaProductos = JSON.parse(productosJSON);
    } else {
        // Si no hay datos, usa la lista inicial y la guarda inmediatamente
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

// Función auxiliar para refrescar todas las vistas
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
    const precio = Number(inputAdminPrecio.value); 
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
// FUNCIONES DE VENTA/CATÁLOGO Y CÁLCULO
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


// --- Lógica de Historial de Ventas (SOLO LOCAL) ---

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


// -----------------------------------------------------
// FUNCIÓN PRINCIPAL: ENVÍO DE PEDIDOS (Formspree)
// -----------------------------------------------------

formulario.addEventListener('submit', async function(evento) {
    evento.preventDefault(); 
    
    const productoSeleccionadoId = selectProducto.value;
    const producto = listaProductos.find(p => p.id === productoSeleccionadoId); 
    const cantidad = Number(inputCantidad.value) || 0;
    const totalCalculado = (producto ? producto.precio : 0) * cantidad;

    // Validar que se haya seleccionado un producto
    if (!producto) {
        alert('Por favor, selecciona un producto antes de registrar la venta.');
        return;
    }

    // 1. Prepara los datos del pedido para enviar
    const datosPedido = {
        "Nombre del Cliente": document.getElementById('nombreCliente').value,
        "Producto ID": productoSeleccionadoId,
        "Producto Solicitado": producto.nombre,
        "Cantidad": cantidad,
        "Total Estimado": totalCalculado.toLocaleString('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            minimumFractionDigits: 0 
        }),
        "Notas Adicionales": document.getElementById('notas').value,
        "_subject": `Nuevo Pedido de Papelería: ${producto.nombre}`,
        "Fecha": new Date().toLocaleDateString('es-CO') 
    };

    // 2. Envía la solicitud (fetch) a Formspree
    try {
        const respuesta = await fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Usamos application/json
            },
            body: JSON.stringify(datosPedido)
        });

        // 3. Manejo de la respuesta
        const mensajeConfirmacionDiv = document.getElementById('mensajeConfirmacion');
        
        if (respuesta.ok) {
            // Éxito: El correo se envió y guardamos localmente
            const datosVentaLocal = {
                cliente: datosPedido["Nombre del Cliente"], 
                nombreProducto: datosPedido["Producto Solicitado"],
                cantidad: datosPedido.Cantidad,
                totalPagado: totalCalculado,
                fecha: datosPedido.Fecha
            };
            ventasGuardadas.push(datosVentaLocal);
            guardarVentas(); 
            mostrarVentas(); 

            mensajeConfirmacionDiv.textContent = '¡Pedido enviado y registrado con éxito! Revisa tu correo.';
            mensajeConfirmacionDiv.style.backgroundColor = '#28a745';
        } else {
            // Error al enviar
            mensajeConfirmacionDiv.textContent = 'Error al enviar el pedido. Verifica el ENDPOINT de Formspree.';
            mensajeConfirmacionDiv.style.backgroundColor = '#dc3545';
        }

    } catch (error) {
        // Error de conexión
        document.getElementById('mensajeConfirmacion').textContent = 'Error de conexión. Verifica tu internet o la URL de Formspree.';
        document.getElementById('mensajeConfirmacion').style.backgroundColor = '#dc3545';
    }

    // Muestra el mensaje y limpia el formulario
    document.getElementById('mensajeConfirmacion').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('mensajeConfirmacion').style.display = 'none';
        formulario.reset(); 
        actualizarTotal(); 
    }, 5000); // 5 segundos para que el usuario lea
});


// -----------------------------------------------------
// INICIALIZACIÓN (BLOQUE REEMPLAZADO)
// -----------------------------------------------------

// Eventos que disparan el cálculo del total (Verificación de existencia añadida)
if (selectProducto && inputCantidad) {
    selectProducto.addEventListener('change', actualizarTotal);
    inputCantidad.addEventListener('input', actualizarTotal); 
}

// Bloque de inicialización más seguro
function inicializarApp() {
    // Usamos esta función para asegurarnos de que los elementos DOM
    // estén listos antes de llamar a cargarProductos
    if (!seccionCatalogo || !selectProducto) {
        // En caso de error, mostramos un mensaje en la consola del desarrollador.
        console.error('Error: Elementos del Catálogo o Formulario no encontrados.');
        return; 
    }
    
    cargarProductos(); // Carga productos y construye la interfaz
    cargarVentas(); // Carga las ventas
    actualizarTotal(); // Forzamos el cálculo inicial
}

document.addEventListener('DOMContentLoaded', inicializarApp);









