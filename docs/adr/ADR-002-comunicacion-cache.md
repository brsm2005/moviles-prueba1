# ADR-002: Usar TanStack Query y Axios para la gestión de caché y peticiones al sistema de oficina

## Estado
Aceptado.

## Fecha
2026-10-26

## Requisitos relacionados
R2, R3, R9

## Contexto
La aplicación consulta los datos del medidor a MockAPI (sistema de oficina) cuando el técnico ingresa un código válido (R2). Si el técnico vuelve a consultar el mismo medidor durante la jornada laboral, la aplicación no debe realizar una nueva descarga a través de la red (R3). Además, se deben gestionar de forma defensiva los estados de carga, la perdida de red y los reintentos cuando la conexión sea inestable.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **TanStack Query + Axios** | TanStack Query gestiona la caché en memoria mediante `staleTime: Infinity` para evitar descargas repetidas del mismo medidor (R3). Axios permite configurar una `baseURL` única para MockAPI y tiempos de espera (`timeout`) cortos ante falta de señal. | Agrega dos dependencias adicionales al proyecto y requiere envolver la raíz de la aplicación con un `QueryClientProvider`. |
| **Fetch nativo con `useState` / `useEffect` manual** | No agrega dependencias externas al `package.json`, usando las herramientas nativas del entorno de ejecución. | Exige escribir lógica manual extensa en cada pantalla para verificar si la consulta ya existe en la memoria o en SQLite, además de manejar manualmente los estados de reintento, errores y timeouts de red. |

## Decisión
Se usan **TanStack Query** y **Axios** para gestionar la capa de red y la caché en memoria de las consultas a MockAPI. Las consultas de medidores se configuran con un tiempo de validez indefinido durante la sesión (`staleTime: Infinity`) para garantizar el cumplimiento estricto del requisito R3.

## Consecuencias
- Se evita realizar peticiones HTTP innecesarias al sistema de la oficina cuando el técnico consulta un medidor por segunda vez.
- La gestión de estados de carga (`isLoading`), error y datos se realiza de forma declarativa con el hook `useQuery`.
- **Riesgo:** Si no se sincroniza la respuesta de TanStack Query con la base de datos local (SQLite, según ADR-001), los datos en caché podrían perderse al reiniciar completamente la aplicación en modo avión. Se debe asegurar la persistencia en SQLite en la primera descarga.

## Verificación
- El archivo `src/api/axiosClient.ts` define la instancia de Axios con la URL de MockAPI.
- La raíz en `app/_layout.tsx` envuelve la navegación en un `QueryClientProvider`.
- Al consultar un medidor con señal, activar el modo avión y volver a consultar el mismo medidor, la aplicación muestra la información en pantalla al instante sin arrojar error de red.

## Uso de IA
Se le consultó a la IA sobre cómo evitar peticiones duplicadas a la API al consultar un mismo medidor. La IA sugirió TanStack Query configurado con `staleTime`. Se aceptó la recomendación debido a la simplicidad que aporta en la gestión de caché y estados de red.