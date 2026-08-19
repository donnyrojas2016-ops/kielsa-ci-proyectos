# Kielsa CI — Proyectos (página independiente)

Página nueva y separada que muestra únicamente el módulo de **Proyectos** de Kielsa CI: listar, filtrar, agregar, editar, eliminar y exportar a Excel. Tiene su propio login y se conecta a la misma base de datos (Supabase) que la app principal, así que los datos están siempre sincronizados con la app original.

## Contenido
- `index.html` — la aplicación completa (un solo archivo, sin necesidad de build).

## Cómo desplegar en Vercel (proyecto nuevo y separado)

1. Sube este `index.html` a un repositorio nuevo de GitHub (puede ser el único archivo del repo).
2. Entra a vercel.com → **Add New... → Project** → importa ese repositorio.
3. En "Framework Preset" selecciona **Other** (no necesita build ni instalación).
4. Deploy. Vercel te dará una URL nueva y separada de la app principal (por ejemplo `kielsa-proyectos.vercel.app`).

También puedes arrastrar la carpeta directamente en Vercel o usar `vercel deploy` desde la CLI, sin configuración adicional.

## Login

Usa el mismo usuario y contraseña que ya usas para entrar a Kielsa CI (se valida contra la tabla `usuarios` de la misma base de datos). No es necesario crear usuarios nuevos.

**Nota de seguridad:** al igual que en la app principal, la validación de usuario/clave se hace hoy comparando el texto en el navegador (no hay cifrado de contraseñas ni verificación en el servidor). Esto ya lo señalé en la revisión general que te envié — si más adelante quieres que lo blindemos (contraseñas cifradas + verificación en servidor), lo hacemos como una tarea aparte.

## Qué incluye

- KPIs (total, cumplidos, en progreso, pendientes, avance promedio).
- Resumen por categoría (CI, Power Automate, Nuevo Proyecto) con filtro al hacer clic.
- Filtros por categoría, estado y país.
- Vista de tarjetas, vista Kanban (arrastra un proyecto entre columnas para cambiar su estado) y vista de tabla.
- Agregar proyectos (uno o varios a la vez, mismo formulario tipo pestañas que usas en Hallazgos).
- Editar y eliminar proyectos.
- Exportar a Excel la lista filtrada.

## Verificación realizada

Antes de entregarla, probé el archivo con un navegador automatizado (React + Babel compilando sin errores) y simulé el flujo completo de login → agregar proyecto → ver reflejado en KPIs y lista, sin errores de consola. Los íconos y las llamadas reales a Supabase no se pudieron probar en vivo desde este entorno (no tiene salida a internet), así que la primera prueba real de conexión a datos debe hacerse ya en Vercel.
