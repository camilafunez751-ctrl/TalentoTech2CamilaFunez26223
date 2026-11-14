document.addEventListener("DOMContentLoaded", () => {
    const API_ARTICULOS = "/articulos";
    const API_CATEGORIAS = "/categorias";
    const API_MOVIMIENTOS = "/movimientos";

    const $ = (id) => document.getElementById(id);

    const tablaArticulos = $("tablaArticulos");
    const tablaArticulosLista = $("tablaArticulosLista");
    const tablaCategorias = $("tablaCategorias");
    const tablaVencimientos = $("tablaVencimientos");
    const tablaInventario = $("tablaInventario");
    const tablaMovimientos = $("tablaMovimientos");

    const modal = $("modalArticulo");
    const modalMovimiento = $("modalMovimiento");
    const formulario = $("formArticulo");
    const formularioMovimiento = $("formMovimiento");

    const campoPrecioCosto = $("precioCosto");
    const campoPrecioVenta = $("precioVenta");

    let articulos = [];
    let movimientos = [];
    let articuloEditando = null;

    // FUNCIONES GENERALES

    function formatoPrecio(valor) {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS"
        }).format(Number(valor) || 0);
    }

    function mostrarMensaje(id, mensaje) {
        const elemento = $(id);
        if (elemento) elemento.textContent = mensaje;
    }

    function nombreCategoria(articulo) {
        return articulo?.categoria?.nombre ?? "";
    }

    async function peticionAPI(url, opciones = {}) {
        const respuesta = await fetch(url, {
            headers: { "Content-Type": "application/json" },
            ...opciones
        });

        if (!respuesta.ok) {
            const mensaje = await respuesta.text();
            throw new Error(mensaje || `Error HTTP ${respuesta.status}`);
        }

        if (respuesta.status === 204) return null;

        const texto = await respuesta.text();
        return texto ? JSON.parse(texto) : null;
    }

    // NAVEGACIÓN

    document.querySelectorAll(".enlace-menu").forEach((boton) => {
        boton.addEventListener("click", (evento) => {
            evento.preventDefault();

            const destino = boton.dataset.seccion;

            document.querySelectorAll(".vista").forEach((vista) => {
                vista.classList.toggle("activa", vista.id === destino);
            });

            document.querySelectorAll(".enlace-menu").forEach((item) => {
                item.classList.toggle("activo", item === boton);
            });

            const titulos = {
                dashboard: ["Dashboard", "Bienvenido al sistema de gestión de inventario."],
                articulos: ["Artículos", "Administrá tus artículos y sus precios."],
                inventario: ["Inventario", "Control de existencias y valoración."],
                movimientos: ["Movimientos", "Historial de entradas, salidas y ventas."],
                categorias: ["Categorías", "Categorías registradas en el sistema."],
                vencimientos: ["Vencimientos", "Control de fechas de vencimiento."]
            };

            if (titulos[destino]) {
                $("tituloSeccion").textContent = titulos[destino][0];
                $("descripcionSeccion").textContent = titulos[destino][1];
            }

            if (destino === "dashboard" || destino === "articulos") {
                cargarArticulos();
            }

            if (destino === "inventario") {
                cargarInventario();
            }

            if (destino === "movimientos") {
                cargarMovimientos();
                cargarSelectArticulos();
            }

            if (destino === "categorias") {
                cargarCategorias();
            }

            if (destino === "vencimientos") {
                cargarVencimientos();
            }
        });
    });

    // ARTÍCULOS

    async function cargarArticulos() {
        try {
            articulos = await peticionAPI(API_ARTICULOS) || [];

            mostrarArticulos(articulos);
            actualizarResumen();

        } catch (error) {
            console.error("Error al cargar artículos:", error);

            mostrarMensaje(
                "mensajeArticulos",
                "No se pudieron cargar los artículos. Verificá que Spring Boot esté iniciado."
            );

            mostrarMensaje(
                "mensajeArticulosLista",
                "No se pudieron cargar los artículos."
            );
        }
    }

    function mostrarArticulos(lista) {
        if (tablaArticulos) tablaArticulos.innerHTML = "";
        if (tablaArticulosLista) tablaArticulosLista.innerHTML = "";

        lista.forEach((articulo) => {
            if (tablaArticulos) {
                tablaArticulos.appendChild(crearFilaArticulo(articulo));
            }

            if (tablaArticulosLista) {
                tablaArticulosLista.appendChild(crearFilaArticulo(articulo));
            }
        });

        const mensaje = lista.length
            ? ""
            : "No hay artículos registrados.";

        mostrarMensaje("mensajeArticulos", mensaje);
        mostrarMensaje("mensajeArticulosLista", mensaje);
    }

    function crearFilaArticulo(articulo) {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${articulo.id ?? ""}</td>
            <td>${articulo.nombre ?? ""}</td>
            <td>${formatoPrecio(articulo.precioCosto)}</td>
            <td>${formatoPrecio(articulo.precioVenta)}</td>
            <td>${nombreCategoria(articulo)}</td>
            <td>${articulo.fechaVencimiento ?? "—"}</td>
            <td>
                <button type="button" class="accion editar">Editar</button>
                <button type="button" class="accion eliminar">Eliminar</button>
            </td>
        `;

        fila.querySelector(".accion.editar").addEventListener("click", () => {
            abrirModal(articulo);
        });

        fila.querySelector(".accion.eliminar").addEventListener("click", () => {
            eliminarArticulo(articulo.id);
        });

        return fila;
    }

    // ABRIR Y CERRAR FORMULARIO

    async function abrirModal(articulo = null) {
        articuloEditando = articulo;

        if (formulario) {
            formulario.reset();
        }

        $("idArticulo").value = articulo?.id ?? "";
        $("nombre").value = articulo?.nombre ?? "";

        campoPrecioCosto.value = articulo?.precioCosto ?? "";
        campoPrecioVenta.value = articulo?.precioVenta ?? "";

        $("fechaVencimiento").value =
            articulo?.fechaVencimiento ?? "";

        $("stockMinimo").value = articulo?.stockMinimo ?? 0;
        $("ubicacion").value = articulo?.ubicacion ?? "";

        $("codigoBarras").value = articulo?.codigoBarras ?? "";
        $("descripcion").value = articulo?.descripcion ?? "";

        $("tituloModal").textContent = articulo
            ? "Editar artículo"
            : "Nuevo artículo";

        $("btnGuardarArticulo").textContent = articulo
            ? "Guardar cambios"
            : "Guardar artículo";

        await cargarOpcionesCategorias();

        $("categoria").value = articulo?.categoria?.id ?? "";

        if (modal) {
            modal.classList.add("activo");
        }
    }

    function cerrarModal() {
        if (modal) {
            modal.classList.remove("activo");
        }

        if (formulario) {
            formulario.reset();
        }

        articuloEditando = null;
    }

    // GUARDAR Y EDITAR ARTÍCULOS

    async function guardarArticulo(evento) {
        evento.preventDefault();

        const precioCosto = Number(campoPrecioCosto.value);
        const precioVenta = Number(campoPrecioVenta.value);

        const nombre = $("nombre").value.trim();
        const categoriaId = $("categoria").value;

        if (
            !nombre ||
            !categoriaId ||
            campoPrecioCosto.value === "" ||
            campoPrecioVenta.value === "" ||
            !Number.isFinite(precioCosto) ||
            !Number.isFinite(precioVenta) ||
            precioCosto < 0 ||
            precioVenta < 0
        ) {
            alert(
                "Completá el nombre, la categoría y ambos precios con valores válidos."
            );
            return;
        }

        const articulo = {
            nombre: nombre,
            precioCosto: precioCosto,
            precioVenta: precioVenta,

            categoria: {
                id: Number(categoriaId)
            },

            codigoBarras: $("codigoBarras").value.trim(),
            descripcion: $("descripcion").value.trim(),

        stockActual: Number($("stockInicial").value || 0),

            stockMinimo: Number($("stockMinimo").value || 0),
            ubicacion: $("ubicacion").value.trim(),

            fechaVencimiento:
                $("fechaVencimiento").value || null
        };

        const estabaEditando = Boolean(articuloEditando);
        console.log("STOCK INICIAL DEL FORMULARIO:", $("stockInicial").value);
console.log("STOCK ENVIADO AL BACKEND:", articulo.stockActual);

        try {
            if (articuloEditando) {
                await peticionAPI(
                    `${API_ARTICULOS}/${articuloEditando.id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(articulo)
                    }
                );

            } else {
                await peticionAPI(API_ARTICULOS, {
                    method: "POST",
                    body: JSON.stringify(articulo)
                });
            }

            cerrarModal();

            await cargarArticulos();

            alert(
                estabaEditando
                    ? "Artículo actualizado correctamente."
                    : "Artículo creado correctamente."
            );

        } catch (error) {
            console.error("Error al guardar artículo:", error);

            alert(`No se pudo guardar el artículo. ${error.message}`);
        }
    }

    // ELIMINAR ARTÍCULOS

    async function eliminarArticulo(id) {
        if (!confirm("¿Seguro que querés eliminar este artículo?")) {
            return;
        }

        try {
            await peticionAPI(`${API_ARTICULOS}/${id}`, {
                method: "DELETE"
            });

            await cargarArticulos();

            alert("Artículo eliminado correctamente.");

        } catch (error) {
            console.error("Error al eliminar artículo:", error);

            alert(
                "No se pudo eliminar el artículo. Puede tener movimientos asociados o existir una restricción en la base de datos. Revisaremos el backend si ocurre."
            );
        }
    }

    // RESUMEN GENERAL Y FINANCIERO

    function actualizarResumen() {
        const totalArticulos = articulos.length;

        const totalUnidades = articulos.reduce(
            (total, articulo) =>
                total + Number(articulo.stockActual || 0),
            0
        );

        const totalCostoInventario = articulos.reduce(
            (total, articulo) =>
                total +
                Number(articulo.stockActual || 0) *
                Number(articulo.precioCosto || 0),
            0
        );

        const stockBajo = articulos.filter((articulo) =>
            Number(articulo.stockActual || 0) <=
            Number(articulo.stockMinimo || 0)
        ).length;

        if ($("totalArticulos")) {
            $("totalArticulos").textContent = totalArticulos;
        }

        if ($("totalUnidades")) {
            $("totalUnidades").textContent = totalUnidades;
        }

        if ($("totalDinero")) {
            $("totalDinero").textContent =
                formatoPrecio(totalCostoInventario);
        }

        if ($("inventarioTotal")) {
            $("inventarioTotal").textContent = totalArticulos;
        }

        if ($("inventarioStockBajo")) {
            $("inventarioStockBajo").textContent = stockBajo;
        }

        if ($("totalStockBajo")) {
            $("totalStockBajo").textContent = stockBajo;
        }

        if ($("inventarioCostoTotal")) {
            $("inventarioCostoTotal").textContent =
                formatoPrecio(totalCostoInventario);
        }

        const proximo = articulos.filter((articulo) => {
            if (!articulo.fechaVencimiento) return false;

            const dias = (
                new Date(articulo.fechaVencimiento + "T00:00:00") -
                new Date()
            ) / 86400000;

            return dias >= 0 && dias <= 30;
        }).length;

        if ($("proximosVencimientos")) {
            $("proximosVencimientos").textContent = proximo;
        }

        actualizarResumenFinanciero();
    }

    // INVENTARIO

    async function cargarInventario() {
        try {
            articulos = await peticionAPI(API_ARTICULOS) || [];

            mostrarInventario(articulos);
            actualizarResumen();

            await cargarMovimientos();

        } catch (error) {
            console.error("Error al cargar inventario:", error);

            alert("No se pudo cargar el inventario.");
        }
    }

    function mostrarInventario(lista) {
        if (!tablaInventario) return;

        tablaInventario.innerHTML = "";

        lista.forEach((articulo) => {
            const stock = Number(articulo.stockActual || 0);
            const minimo = Number(articulo.stockMinimo || 0);

            let estado = "Disponible";
            let clase = "disponible";

            if (stock <= 0) {
                estado = "Sin stock";
                clase = "sin-stock";

            } else if (stock <= minimo) {
                estado = "Stock bajo";
                clase = "stock-bajo";
            }

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${articulo.id ?? ""}</td>
                <td>${articulo.nombre ?? ""}</td>
                <td>${nombreCategoria(articulo)}</td>
                <td>${formatoPrecio(articulo.precioCosto)}</td>
                <td>${formatoPrecio(articulo.precioVenta)}</td>
                <td>${stock}</td>
                <td>${minimo}</td>
                <td>${articulo.ubicacion ?? ""}</td>
                <td>
                    <span class="estado ${clase}">
                        ${estado}
                    </span>
                </td>
            `;

            tablaInventario.appendChild(fila);
        });
    }

    // MOVIMIENTOS DE STOCK

    async function cargarMovimientos() {
        try {
            movimientos = await peticionAPI(API_MOVIMIENTOS) || [];

            mostrarMovimientos(movimientos);
            actualizarResumenFinanciero();

        } catch (error) {
            console.error("Error al cargar movimientos:", error);

            mostrarMensaje(
                "mensajeMovimientos",
                "No se pudieron cargar los movimientos."
            );
        }
    }

    function mostrarMovimientos(lista) {
        if (!tablaMovimientos) return;

        tablaMovimientos.innerHTML = "";

        lista.forEach((movimiento) => {
            const tipo = movimiento.tipo || "";

            const etiqueta =
                tipo === "ENTRADA" ? "Entrada" :
                tipo === "VENTA" ? "Venta" :
                tipo === "SALIDA" ? "Salida" :
                tipo;

            const clase =
                tipo === "ENTRADA" ? "disponible" :
                tipo === "VENTA" ? "vendido" :
                "sin-stock";

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${movimiento.fecha ?? ""}</td>
                <td>${movimiento.articulo?.nombre ?? ""}</td>
                <td>
                    <span class="estado ${clase}">
                        ${etiqueta}
                    </span>
                </td>
                <td>${movimiento.cantidad ?? 0}</td>
                <td>${movimiento.motivo ?? ""}</td>
            `;

            tablaMovimientos.appendChild(fila);
        });

        mostrarMensaje(
            "mensajeMovimientos",
            lista.length ? "" : "Todavía no hay movimientos registrados."
        );
    }

    async function cargarSelectArticulos() {
        try {
            articulos = await peticionAPI(API_ARTICULOS) || [];

            const select = $("articuloMovimiento");

            if (!select) return;

            select.innerHTML =
                '<option value="">Seleccionar artículo</option>';

            articulos.forEach((articulo) => {
                const opcion = document.createElement("option");

                opcion.value = articulo.id;
                opcion.textContent = articulo.nombre;

                select.appendChild(opcion);
            });

        } catch (error) {
            console.error(
                "Error al cargar artículos para movimientos:",
                error
            );
        }
    }

    async function guardarMovimiento(evento) {
    evento.preventDefault();

    const articuloId = $("articuloMovimiento").value;
    const tipo = $("tipoMovimiento").value;
    const cantidad = Number($("cantidadMovimiento").value);
    const motivo = $("motivoMovimiento").value.trim();

    if (
        !articuloId ||
        !tipo ||
        !Number.isInteger(cantidad) ||
        cantidad <= 0 ||
        !motivo
    ) {
        alert(
            "Completá todos los datos del movimiento. La cantidad debe ser un número entero mayor que cero."
        );
        return;
    }

    try {
        // Actualizar los artículos para consultar el stock real.
        const articulosActualizados =
            await peticionAPI(API_ARTICULOS) || [];

        articulos = articulosActualizados;

        const articulo = articulos.find(
            item => Number(item.id) === Number(articuloId)
        );

        if (!articulo) {
            alert("No se encontró el artículo seleccionado.");
            return;
        }

        const stockDisponible = Number(articulo.stockActual ?? 0);

        if (
            (tipo === "SALIDA" || tipo === "VENTA") &&
            cantidad > stockDisponible
        ) {
            alert(
                `Stock insuficiente. Hay ${stockDisponible} unidades disponibles y estás intentando retirar ${cantidad}.`
            );
            return;
        }

        // Registrar el movimiento en el backend.
        await peticionAPI(API_MOVIMIENTOS, {
            method: "POST",
            body: JSON.stringify({
                articuloId: Number(articuloId),
                tipo: tipo,
                cantidad: cantidad,
                motivo: motivo
            })
        });

        // Limpiar y cerrar el formulario.
        if (formularioMovimiento) {
            formularioMovimiento.reset();
        }

        if (modalMovimiento) {
            modalMovimiento.classList.remove("activo");
        }

        // Actualizar las tablas y los indicadores.
        await cargarArticulos();
        await cargarMovimientos();
        await cargarInventario();

        alert("Movimiento registrado correctamente.");

    } catch (error) {
        console.error("Error al registrar movimiento:", error);

        alert(
            `No se pudo registrar el movimiento. ${error.message}`
        );
    }
}

    // RESUMEN FINANCIERO

    function actualizarResumenFinanciero() {
        const ventas = movimientos.filter(
            movimiento => movimiento.tipo === "VENTA"
        );

        const ingresos = ventas.reduce(
            (total, movimiento) =>
                total +
                Number(movimiento.precioVenta || 0) *
                Number(movimiento.cantidad || 0),
            0
        );

        const costoVentas = ventas.reduce(
            (total, movimiento) =>
                total +
                Number(movimiento.precioCosto || 0) *
                Number(movimiento.cantidad || 0),
            0
        );

        const ganancias = ingresos - costoVentas;

        if ($("inventarioIngresosVentas")) {
            $("inventarioIngresosVentas").textContent =
                formatoPrecio(ingresos);
        }

        if ($("inventarioGanancias")) {
            $("inventarioGanancias").textContent =
                formatoPrecio(ganancias);
        }
    }

    // CATEGORÍAS

    async function cargarOpcionesCategorias() {
        const select = $("categoria");

        if (!select) return;

        try {
            const categorias = await peticionAPI(API_CATEGORIAS) || [];

            const valorActual = select.value;

            select.innerHTML =
                '<option value="">Seleccionar categoría</option>';

            categorias.forEach((categoria) => {
                const opcion = document.createElement("option");

                opcion.value = categoria.id;
                opcion.textContent = categoria.nombre;

                select.appendChild(opcion);
            });

            if (valorActual) {
                select.value = valorActual;
            }

        } catch (error) {
            console.error(
                "Error al cargar categorías para el formulario:",
                error
            );

            mostrarMensaje(
                "mensajeArticulos",
                "No se pudieron cargar las categorías."
            );
        }
    }

    async function cargarCategorias() {
        try {
            const categorias = await peticionAPI(API_CATEGORIAS) || [];

            if (tablaCategorias) {
                tablaCategorias.innerHTML = "";

                categorias.forEach((categoria) => {
                    const fila = document.createElement("tr");

                    fila.innerHTML = `
                        <td>${categoria.id ?? ""}</td>
                        <td>${categoria.nombre ?? ""}</td>
                    `;

                    tablaCategorias.appendChild(fila);
                });
            }

            if ($("totalCategorias")) {
                $("totalCategorias").textContent = categorias.length;
            }

            mostrarMensaje(
                "mensajeCategorias",
                categorias.length ? "" : "No hay categorías registradas."
            );

            await cargarOpcionesCategorias();

        } catch (error) {
            console.error("Error al cargar categorías:", error);

            mostrarMensaje(
                "mensajeCategorias",
                "No se pudieron cargar las categorías."
            );
        }
    }

    // VENCIMIENTOS

    async function cargarVencimientos() {
        try {
            articulos = await peticionAPI(API_ARTICULOS) || [];

            if (!tablaVencimientos) return;

            tablaVencimientos.innerHTML = "";

            const conVencimiento = articulos.filter(
                articulo => articulo.fechaVencimiento
            );

            conVencimiento.forEach((articulo) => {
                const fecha = new Date(
                    articulo.fechaVencimiento + "T00:00:00"
                );

                const dias = Math.ceil(
                    (fecha - new Date()) / 86400000
                );

                const estado =
                    dias < 0 ? "Vencido" :
                    dias <= 30 ? "Próximo a vencer" :
                    "Vigente";

                const fila = document.createElement("tr");

                fila.innerHTML = `
                    <td>${articulo.nombre ?? ""}</td>
                    <td>${nombreCategoria(articulo)}</td>
                    <td>${articulo.fechaVencimiento}</td>
                    <td>${estado}</td>
                `;

                tablaVencimientos.appendChild(fila);
            });

            mostrarMensaje(
                "mensajeVencimientos",
                conVencimiento.length
                    ? ""
                    : "No hay artículos con fecha de vencimiento."
            );

        } catch (error) {
            console.error("Error al cargar vencimientos:", error);

            mostrarMensaje(
                "mensajeVencimientos",
                "No se pudieron cargar los vencimientos."
            );
        }
    }

    // EVENTOS DE FORMULARIOS Y MODALES

    const btnNuevoLista = $("btnNuevoArticuloLista");

    if (btnNuevoLista) {
        btnNuevoLista.addEventListener("click", () => {
            abrirModal();
        });
    }

    if (formulario) {
        formulario.addEventListener("submit", guardarArticulo);
    }

    ["cerrarModal", "btnCancelar"].forEach((id) => {
        if ($(id)) {
            $(id).addEventListener("click", cerrarModal);
        }
    });

    const cerrarModalMovimiento = () => {
        if (modalMovimiento) {
            modalMovimiento.classList.remove("activo");
        }

        if (formularioMovimiento) {
            formularioMovimiento.reset();
        }
    };

    ["cerrarModalMovimiento", "btnCancelarMovimiento"].forEach((id) => {
        if ($(id)) {
            $(id).addEventListener("click", cerrarModalMovimiento);
        }
    });

    ["btnNuevoMovimiento", "btnNuevoMovimientoHistorial"].forEach((id) => {
        if ($(id)) {
            $(id).addEventListener("click", async () => {
                await cargarSelectArticulos();

                if (modalMovimiento) {
                    modalMovimiento.classList.add("activo");
                }
            });
        }
    });

    if (formularioMovimiento) {
        formularioMovimiento.addEventListener(
            "submit",
            guardarMovimiento
        );
    }

    // BÚSQUEDAS

    const buscarLista = $("buscarArticuloLista");

    if (buscarLista) {
        buscarLista.addEventListener("input", () => {
            const termino = buscarLista.value.toLowerCase().trim();

            const filtrados = articulos.filter((articulo) =>
                (articulo.nombre || "").toLowerCase().includes(termino)
            );

            if (tablaArticulosLista) {
                tablaArticulosLista.innerHTML = "";

                filtrados.forEach((articulo) => {
                    tablaArticulosLista.appendChild(
                        crearFilaArticulo(articulo)
                    );
                });
            }
        });
    }

    const buscarInventario = $("buscarInventario");

    if (buscarInventario) {
        buscarInventario.addEventListener("input", () => {
            const termino = buscarInventario.value.toLowerCase().trim();

            mostrarInventario(
                articulos.filter((articulo) =>
                    `${articulo.nombre || ""} ${articulo.id || ""} ${articulo.codigoBarras || ""}`
                        .toLowerCase()
                        .includes(termino)
                )
            );
        });
    }

    // INICIO

    cargarArticulos();
    cargarOpcionesCategorias();

});
