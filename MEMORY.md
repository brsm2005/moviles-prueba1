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
- Sync (R9): sync.service.ts (cerrojo, sin duplicados) y useSyncListener montado en _layout.
- R10: validarLecturaExistente en lecturas.service (bloquea al guardar).
- Pantalla /historial (R10): chips PENDIENTE/ENVIADO, edición solo PENDIENTE, enlace desde /busqueda.
- _layout.tsx: fuentes Roboto, QueryClientProvider (staleTime 24h), init SQLite, Stack.
- Medidores (R2, R3): medidores.types/validator/service.ts y hook useMedidorQuery.
- Pantalla /busqueda (TanStack Form + useQuery, tarjeta con 7 datos).
- NetworkStatusBar (R9) solo montada en /busqueda.
- Store Zustand useLecturaStore (R5) y borrador.service.ts (R8: guardar, obtener, limpiar, restaurar, autoguardado).
- Pantalla /registro/paso1-estado (R5, R8): estados, motivo/daño obligatorios, borrador Continuar/Descartar.
- Utilidades: calculoConsumo.ts (R6), utils/fileSystemStorage.ts (R7), lecturas.service.ts (R4, guarda y limpia borrador).
- Pantallas paso2-lectura (R5, R6) y confirmacion (R4, R7, R8: cámara, guardar, reset, alerta).

---

## Falta por hacer

- Probar flujo completo en dispositivo (cámara, permisos, modo avión, sync al reconectar).
- Mostrar aviso R10 en UI antes del paso 1 (hoy bloquea al guardar).
- Montar NetworkStatusBar en todas las pantallas (R9) y sincronización automática sin duplicados.
- limpiarBorrador + resetFormulario al finalizar el registro.
- Edición PENDIENTE y control de duplicados por mes (R10).
- Logout, EXPO_PUBLIC_MOCKAPI_URL en .env, limpiar plantilla (explore.tsx, app-tabs).
- Corregir ruta de axiosClient en ADR-002 (real: src/axios/apiClient.ts).

---

## Checklist de Finalización

- [ ] Diseño aprobado.
- [ ] Código revisado.
- [ ] Pruebas ejecutadas.
- [ ] Documentación actualizada.
- [ ] Feature desplegada.
- [ ] Validación de negocio realizada.
