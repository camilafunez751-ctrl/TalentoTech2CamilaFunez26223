
package com.ejemplo.articulos.articulo_api.service;

import com.ejemplo.articulos.articulo_api.model.Articulo;
import com.ejemplo.articulos.articulo_api.model.Categoria;
import com.ejemplo.articulos.articulo_api.repository.ArticuloRepository;
import com.ejemplo.articulos.articulo_api.repository.CategoriaRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class ArticuloServiceImpl implements ArticuloService {

    private final ArticuloRepository repositorio;
    private final CategoriaRepository categoriaRepository;
    private final MovimientoStockService movimientoStockService;

    public ArticuloServiceImpl(
            ArticuloRepository repositorio,
            CategoriaRepository categoriaRepository,
            MovimientoStockService movimientoStockService) {

        this.repositorio = repositorio;
        this.categoriaRepository = categoriaRepository;
        this.movimientoStockService = movimientoStockService;
    }

    @Override
    public List<Articulo> listarTodos() {
        return repositorio.findAll();
    }

    @Override
    public Articulo buscarPorId(Long id) {
        return repositorio.findById(id).orElse(null);
    }

    // CREAR ARTICULO CON STOCK INICIAL
    @Override
    @Transactional
    public Articulo guardar(Articulo articulo) {

        if (articulo.getPrecioCosto() == null
                || articulo.getPrecioVenta() == null) {

            throw new IllegalArgumentException(
                    "Debés ingresar el precio de costo y el precio de venta");
        }

        Integer stockInicial = articulo.getStockActual() == null
                ? 0 : articulo.getStockActual();

        if (stockInicial < 0) {
            throw new IllegalArgumentException(
                    "El stock inicial no puede ser negativo");
        }

        if (articulo.getCategoria() != null
                && articulo.getCategoria().getId() != null) {

            Categoria categoria = categoriaRepository
                    .findById(articulo.getCategoria().getId())
                    .orElseThrow(() ->
                            new RuntimeException("Categoría no encontrada"));

            articulo.setCategoria(categoria);
        }

        // Guardar primero el artículo con stock cero.
        articulo.setStockActual(0);

        Articulo guardado = repositorio.save(articulo);

        // Registrar el ingreso del stock inicial.
        if (stockInicial > 0) {

            movimientoStockService.registrar(
                    guardado.getId(),
                    "ENTRADA",
                    stockInicial,
                    "Stock inicial"
            );
        }

        // Recuperar el artículo con el stock actualizado.
        return repositorio.findById(guardado.getId())
                .orElseThrow(() ->
                        new RuntimeException("No se pudo recuperar el artículo"));
    }

    // ACTUALIZAR ARTICULO Y AJUSTAR STOCK MEDIANTE MOVIMIENTOS
    @Override
    @Transactional
    public Articulo actualizar(Long id, Articulo articulo) {

        Articulo existente = repositorio.findById(id).orElse(null);

        if (existente == null) {
            return null;
        }

        // Actualizar datos generales.
        existente.setNombre(articulo.getNombre());
        existente.setPrecioCosto(articulo.getPrecioCosto());
        existente.setPrecioVenta(articulo.getPrecioVenta());
        existente.setFechaVencimiento(articulo.getFechaVencimiento());
        existente.setCodigoBarras(articulo.getCodigoBarras());
        existente.setDescripcion(articulo.getDescripcion());
        existente.setStockMinimo(articulo.getStockMinimo());
        existente.setUbicacion(articulo.getUbicacion());

        // Actualizar categoría.
        if (articulo.getCategoria() != null
                && articulo.getCategoria().getId() != null) {

            Categoria categoria = categoriaRepository
                    .findById(articulo.getCategoria().getId())
                    .orElseThrow(() ->
                            new RuntimeException("Categoría no encontrada"));

            existente.setCategoria(categoria);
        }

        // Ajustar stock mediante movimientos.
        if (articulo.getStockActual() != null) {

            int stockActual = existente.getStockActual() == null
                    ? 0 : existente.getStockActual();

            int stockDeseado = articulo.getStockActual();

            if (stockDeseado < 0) {
                throw new IllegalArgumentException(
                        "El stock no puede ser negativo");
            }

            int diferencia = stockDeseado - stockActual;

            if (diferencia > 0) {

                movimientoStockService.registrar(
                        id,
                        "ENTRADA",
                        diferencia,
                        "Ajuste de stock por edición"
                );

            } else if (diferencia < 0) {

                movimientoStockService.registrar(
                        id,
                        "SALIDA",
                        Math.abs(diferencia),
                        "Ajuste de stock por edición"
                );
            }
        }

        return repositorio.save(existente);
    }

    @Override
    public void eliminar(Long id) {
        repositorio.deleteById(id);
    }

    @Override
    public List<Articulo> buscarFlexible(String busqueda) {

        if (busqueda == null || busqueda.isBlank()) {
            return repositorio.findAll();
        }

        String termino = normalizar(busqueda);

        return repositorio.findAll().stream()
                .filter(articulo ->
                        articulo.getNombre() != null
                        && normalizar(articulo.getNombre()).contains(termino))
                .toList();
    }

    private String normalizar(String texto) {

        String sinAcentos = Normalizer.normalize(
                texto, Normalizer.Form.NFD
        ).replaceAll("\\p{M}", "");

        return sinAcentos
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", "");
    }
}
