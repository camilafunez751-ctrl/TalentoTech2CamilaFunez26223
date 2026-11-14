package com.ejemplo.articulos.articulo_api.repository;

import com.ejemplo.articulos.articulo_api.model.MovimientoStock;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MovimientoStockRepository extends JpaRepository<MovimientoStock, Long> {

    List<MovimientoStock> findByArticuloIdOrderByFechaDesc(Long articuloId);

    List<MovimientoStock> findAllByOrderByFechaDesc();
}
