
package com.ejemplo.articulos.articulo_api.controller;

import com.ejemplo.articulos.articulo_api.model.MovimientoStock;
import com.ejemplo.articulos.articulo_api.service.MovimientoStockService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/movimientos")
public class MovimientoStockController {

    private final MovimientoStockService servicio;

    public MovimientoStockController(MovimientoStockService servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public List<MovimientoStock> listarTodos() {
        return servicio.listarTodos();
    }

    @GetMapping("/articulo/{id}")
    public List<MovimientoStock> listarPorArticulo(@PathVariable Long id) {
        return servicio.listarPorArticulo(id);
    }

    @PostMapping
    public MovimientoStock registrar(@RequestBody SolicitudMovimiento solicitud) {
        return servicio.registrar(
            solicitud.getArticuloId(),
            solicitud.getTipo(),
            solicitud.getCantidad(),
            solicitud.getMotivo()
        );
    }

    public static class SolicitudMovimiento {
        private Long articuloId;
        private String tipo;
        private Integer cantidad;
        private String motivo;

        public Long getArticuloId() { return articuloId; }
        public void setArticuloId(Long articuloId) { this.articuloId = articuloId; }
        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }
        public Integer getCantidad() { return cantidad; }
        public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
        public String getMotivo() { return motivo; }
        public void setMotivo(String motivo) { this.motivo = motivo; }
    }
}
