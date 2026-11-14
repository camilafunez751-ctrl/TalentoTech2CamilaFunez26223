
package com.ejemplo.articulos.articulo_api.service;

import com.ejemplo.articulos.articulo_api.model.Articulo;
import com.ejemplo.articulos.articulo_api.model.MovimientoStock;
import com.ejemplo.articulos.articulo_api.repository.ArticuloRepository;
import com.ejemplo.articulos.articulo_api.repository.MovimientoStockRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class MovimientoStockService {

    private final ArticuloRepository articuloRepository;
    private final MovimientoStockRepository movimientoRepository;

    public MovimientoStockService(
            ArticuloRepository articuloRepository,
            MovimientoStockRepository movimientoRepository) {

        this.articuloRepository = articuloRepository;
        this.movimientoRepository = movimientoRepository;
    }

    // REGISTRAR MOVIMIENTO DE STOCK
    @Transactional
    public MovimientoStock registrar(
            Long articuloId,
            String tipo,
            Integer cantidad,
            String motivo) {

        if (cantidad == null || cantidad <= 0) {
            throw new IllegalArgumentException(
                "La cantidad debe ser mayor que cero"
            );
        }

        if (tipo == null || tipo.isBlank()) {
            throw new IllegalArgumentException(
                "Debés indicar el tipo de movimiento"
            );
        }

        Articulo articulo = articuloRepository.findById(articuloId)
            .orElseThrow(() ->
                new RuntimeException("Artículo no encontrado")
            );

        if (articulo.getStockActual() == null) {
            articulo.setStockActual(0);
        }

        String movimiento = tipo.trim().toUpperCase(Locale.ROOT);

        // ENTRADA: SUMA STOCK
        if (movimiento.equals("ENTRADA")) {

            articulo.setStockActual(
                articulo.getStockActual() + cantidad
            );

        // SALIDA O VENTA: DESCUENTA STOCK
        } else if (movimiento.equals("SALIDA")
                || movimiento.equals("VENTA")) {

            if (articulo.getStockActual() < cantidad) {
                throw new IllegalArgumentException(
                    "No hay suficiente stock disponible"
                );
            }

            articulo.setStockActual(
                articulo.getStockActual() - cantidad
            );

        } else {
            throw new IllegalArgumentException(
                "Tipo de movimiento inválido"
            );
        }

        // GUARDAR STOCK ACTUALIZADO
        articuloRepository.save(articulo);

        // CREAR REGISTRO DEL MOVIMIENTO
        MovimientoStock nuevo = new MovimientoStock();

        nuevo.setArticulo(articulo);
        nuevo.setTipo(movimiento);
        nuevo.setCantidad(cantidad);
        nuevo.setMotivo(motivo);

        // GUARDAR PRECIOS VIGENTES
        nuevo.setPrecioCosto(
            articulo.getPrecioCosto() != null
                ? articulo.getPrecioCosto()
                : 0.0
        );

        nuevo.setPrecioVenta(
            articulo.getPrecioVenta() != null
                ? articulo.getPrecioVenta()
                : 0.0
        );

        return movimientoRepository.save(nuevo);
    }

    // LISTAR TODOS LOS MOVIMIENTOS
    public List<MovimientoStock> listarTodos() {
        return movimientoRepository.findAllByOrderByFechaDesc();
    }

    // LISTAR MOVIMIENTOS DE UN ARTICULO
    public List<MovimientoStock> listarPorArticulo(Long articuloId) {
        return movimientoRepository
            .findByArticuloIdOrderByFechaDesc(articuloId);
    }
}
