# Modelo de acceso

- **User** representa una cuenta.
- **Affiliate** representa una afiliación.
- **Role** representa autorización técnica.

`Usuario` es el rol base de una cuenta sin permisos administrativos.
`Vecino/Afiliado` existe únicamente durante la transición y será eliminado
posteriormente mediante una migración explícita. No debe usarse en código nuevo.
