package com.ejemplo.articulos.articulo_api.model;

public class Servicio extends Producto {

    public Servicio() {
        super();
    }

    public Servicio(String nombre, Double precioCosto, Double precioVenta) {
        super(nombre, precioCosto, precioVenta);
    }

    @Override
    public String obtenerTipo() {
        return "Servicio";
    }
}
