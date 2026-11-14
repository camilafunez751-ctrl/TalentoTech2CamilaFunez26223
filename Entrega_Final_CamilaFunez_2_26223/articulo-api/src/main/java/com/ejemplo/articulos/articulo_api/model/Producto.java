
package com.ejemplo.articulos.articulo_api.model;

import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Column;

@MappedSuperclass
public abstract class Producto {

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private Double precioCosto = 0.0;

    @Column(nullable = false)
    private Double precioVenta = 0.0;

    public Producto() {
    }

    public Producto(String nombre, Double precioCosto, Double precioVenta) {
        this.nombre = nombre;
        this.precioCosto = precioCosto;
        this.precioVenta = precioVenta;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Double getPrecioCosto() {
        return precioCosto;
    }

    public void setPrecioCosto(Double precioCosto) {
        this.precioCosto = precioCosto;
    }

    public Double getPrecioVenta() {
        return precioVenta;
    }

    public void setPrecioVenta(Double precioVenta) {
        this.precioVenta = precioVenta;
    }

    public abstract String obtenerTipo();
}
