# MEMORY.md - Metodología FDD (Feature Driven Development)

## Propósito
Este archivo sirve como memoria de referencia para proyectos que utilizan la metodología FDD (Feature Driven Development), permitiendo mantener criterios, decisiones y prácticas consistentes durante el desarrollo.

---

## Principios de FDD

1. Desarrollar un modelo general del dominio.
2. Construir una lista de funcionalidades (Features).
3. Planificar por funcionalidad.
4. Diseñar por funcionalidad.
5. Construir por funcionalidad.

---

## Definición de Feature

Una feature debe:
- Aportar valor al negocio.
- Ser pequeña y desarrollable en pocos días.
- Tener un resultado observable.

Formato recomendado:

<Acción> <Resultado> <Objeto>

Ejemplos:
- Generar reporte de ventas.
- Actualizar información de cliente.
- Consultar historial de pagos.

---

## Estructura del Proyecto

### Dominios
- Gestión de Clientes
- Gestión de Productos
- Gestión de Ventas
- Reportes

### Roles
- Project Manager
- Chief Architect
- Development Manager
- Chief Programmer
- Class Owner
- Domain Expert

---

## Convenciones

### Nomenclatura
- Features: Verbo + Objeto.
- Clases: PascalCase.
- Métodos: camelCase.
- Variables: camelCase.

### Control de Versiones
- main: producción.
- develop: integración.
- feature/<nombre-feature>: desarrollo.

## Registro de Decisiones

| Fecha | Decisión | Responsable |
|---------|---------|---------|
| YYYY-MM-DD | Descripción | Nombre |

---

## Lecciones Aprendidas

- Documentar hallazgos relevantes.
- Registrar problemas recurrentes.
- Mantener recomendaciones para futuras iteraciones.

---

## Métricas Recomendadas

- Features completadas por iteración.
- Tiempo promedio por feature.
- Defectos por feature.
- Cobertura de pruebas.
- Velocidad del equipo.

---

## Ya implementado

- SQLite: src/db/database.ts (medidores_cache, lecturas_pendientes, borrador_registro).
- Axios: src/axios/apiClient.ts y api.services.ts (medidores, lecturas).
- Auth: src/features/auth/auth.service.ts (sesión en AsyncStorage).
- Login R1 en src/app/index.tsx (TanStack Form, redirige a /busqueda).
- Deps agregadas: expo-sqlite, @react-native-async-storage/async-storage.

---

## Falta por hacer

- Cargar fuentes Roboto y proveedor QueryClient en _layout.tsx; quitar tabs de plantilla.
- Pantalla /busqueda (R2, R3), registro (R4-R8), header de red/pendientes (R9), edición (R10).
- Hook useNetworkStatus, sincronización de cola, logout.
- Definir EXPO_PUBLIC_MOCKAPI_URL en .env.

---

## Checklist de Finalización

- [ ] Diseño aprobado.
- [ ] Código revisado.
- [ ] Pruebas ejecutadas.
- [ ] Documentación actualizada.
- [ ] Feature desplegada.
- [ ] Validación de negocio realizada.
