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

**Nota de seguridad:** al igual que en la app principal, la validación de usuario/clave se hace hoy comparando el texto en el navegador (no hay cifrado de contraseñas ni verificación en el servidor). Esto ya lo señalé en la revisión general que te envié.

Ya hice una primera mejora sobre esto (ver "Endurecimiento del login" más abajo): antes, con solo abrir la pantalla de inicio de sesión (sin siquiera escribir nada), la app pedía la lista completa de usuarios con su contraseña en texto — es decir, cualquiera que abriera las herramientas del navegador podía ver la contraseña de todo el mundo, no solo la suya, aunque nunca llegara a entrar. Ahora solo se pide el usuario que se está escribiendo, así que por la red ya no viaja la contraseña de nadie más.

Cifrar la contraseña de verdad (que se guarde y compare como hash, no en texto) es un cambio más grande que no pude hacer "solo en esta página": la tabla `usuarios` es la misma que usa la app principal de Kielsa CI, así que si cambio el formato de la contraseña aquí, la app principal también tendría que saber leerlo o la gente se quedaría sin poder entrar ahí — y esa app no está en este espacio de trabajo para revisarla. Si más adelante quieres hacerlo, lo ideal es coordinarlo con quien mantiene la app principal para actualizar las dos a la vez.

### Aviso de Supabase: "Table publicly accessible" (RLS desactivado)

Es esperable que en algún momento te llegue (o ya te haya llegado) un correo de Supabase avisando que varias tablas del proyecto `kielsa-ci` son de acceso público porque no tienen Row-Level Security (RLS) activado. Es real, no es spam: como ninguna de las dos apps (esta ni la principal) usa el sistema de cuentas de Supabase (Supabase Auth) — ambas tienen su propio login casero que compara usuario/clave contra una tabla y luego hacen sus consultas con la llave pública "anon" — cualquiera que consiga esa llave y la URL del proyecto (ambas viven en el código fuente de la página) podría leer, editar o borrar esas tablas directamente, sin pasar por el login.

El aviso cubre el proyecto de Supabase completo, no solo las tablas `proyecto_*` que agregamos aquí: la app principal usa además `hallazgos`, `planes`, `usuarios`, `paises`, `procesos`, `auditores`, `areas`, `responsables`, `planes_trabajo` y `evidencias`, que probablemente también aparezcan en el aviso. Para ver la lista exacta de qué tablas están señaladas, en supabase.com → tu proyecto → **Database → Advisors**.

**Decisión tomada (25 de agosto de 2026):** se activó RLS en las tablas `proyecto_*` (incluyendo `proyectos` y `proyecto_tareas`) con una regla que sigue permitiendo todo al rol `anon` — el script está en `activar_rls_silenciar_aviso.sql`, incluido en este mismo paquete. También se corrió el equivalente para las tablas de la app principal (`paises`, `usuarios`, `hallazgos`, `planes`, `procesos`, `auditores`, `areas`, `responsables`, `planes_trabajo`, `evidencias`) — ese script está en `activar_rls_app_principal.sql`. Esto hace que el Security Advisor de Supabase deje de marcar esas tablas como "RLS Disabled in Public" ("Errors: 0" confirmado el 25 de agosto), pero **no cierra el acceso de fondo**: como ninguna de las dos apps usa Supabase Auth, cualquiera con la URL y la llave `anon` puede seguir leyendo/editando esas tablas directamente, igual que antes. Es "apagar la alarma", no "poner la chapa".

`proyecto_tareas` necesitó correrse aparte (fuera del ciclo del script) porque quedó pendiente en el primer intento; una vez corrida individualmente, quedó igual que las demás. Si te llegan más avisos de "Warnings" o "Suggestions" en el Security Advisor (no "Errors"), son de menor severidad — probablemente sugerencias de rendimiento u otras tablas no relacionadas con estas dos apps; se pueden revisar aparte si se quiere.

Si más adelante se quiere cerrar el hueco de verdad (no solo silenciar el aviso), el camino es migrar el login actual a Supabase Auth (cuentas y sesiones reales) y luego escribir reglas de RLS que sí restrinjan por usuario. Eso es un proyecto aparte que toca la tabla `usuarios` compartida y casi seguro la app principal también — no se puede hacer "solo en esta página".

## Qué incluye

- Pestaña **Reportes** separada, con los KPIs (total, cumplidos, en progreso, pendientes, avance promedio), el resumen por categoría (CI, Power Automate, Nuevo Proyecto) y las alertas de vencimiento — ver sección "Reportes (pestaña separada de Proyectos)" más abajo.
- Filtros por categoría, estado y país.
- Una sola tabla de proyectos: al hacer clic en una fila, justo debajo aparece su **Plan de acción** (Cronograma) — ver sección "Tabla de proyectos y Plan de acción" más abajo.
- Alertas automáticas de vencimiento: la campana del encabezado avisa sola qué proyectos ya vencieron o están por vencer (en los próximos 7 días), calculado con la fecha de fin real — no depende de que alguien cambie el estado a mano. Los proyectos Cumplidos o Cancelados no generan alerta. Al hacer clic en la campana te lleva directo a la pestaña Reportes con el panel de alertas abierto.
- Comentarios / bitácora por proyecto: dentro de cada proyecto (botón "Editar") hay una sección para que el equipo deje comentarios con su nombre y fecha, y para borrarlos. Necesita la tabla `proyecto_comentarios` en Supabase (ver instrucciones abajo); si todavía no existe, la app lo indica y el resto sigue funcionando normal.
- Roles y permisos propios de esta página (Administrador / Editor / Solo lectura) — ver sección "Menú lateral" abajo.
- Menú lateral con Usuarios, Accesos, Áreas, Países, Responsables y Carga de trabajo (catálogos e informativas) además de Proyectos — ver sección "Menú lateral" abajo.
- Agregar proyectos (uno o varios a la vez, mismo formulario tipo pestañas que usas en Hallazgos).
- Editar y eliminar proyectos.
- Botón "Editar" con Datos del proyecto (secciones Datos generales, Asignación, Fechas y estado, Ticket y archivo, Descripción) y Comentarios — ver sección "Nuevo formulario de proyecto" más abajo.
- Plan de acción por proyecto (debajo de la tabla, al seleccionarlo): línea de tiempo (Gantt) y ruta crítica, más exportar ese plan a Excel y a PDF — ver sección "Tabla de proyectos y Plan de acción".
- Exportar a Excel y a PDF la lista completa de proyectos (botones junto a los filtros).

## Activar los comentarios (una sola vez en Supabase)

1. Entra a tu proyecto en supabase.com → **SQL Editor** → **New query**.
2. Pega y ejecuta (botón **Run**) exactamente esto:

```sql
create table proyecto_comentarios (
  id bigint generated by default as identity primary key,
  "proyectoId" bigint not null,
  autor text,
  texto text not null,
  "createdAt" timestamptz not null default now()
);
alter table proyecto_comentarios disable row level security;
```

3. Listo — no hace falta reiniciar nada más. En cuanto subas el `index.html` de este paquete, la sección "Comentarios / bitácora" ya podrá guardar y mostrar comentarios reales.

- Roles y permisos propios de esta página: hay tres roles — **Administrador** (acceso total, incluyendo gestionar usuarios), **Editor** (crea y edita proyectos, gestiona el Plan de acción y comenta, pero no puede eliminar) y **Solo lectura** (solo ve, filtra y exporta a Excel). Un usuario Administrador puede asignar el rol de cada quien desde el nuevo botón "Usuarios y permisos" (ícono de personas) en el encabezado. **Importante:** cualquier usuario que todavía no tenga un rol asignado se trata automáticamente como Administrador, así que nadie pierde acceso al activar esta función — tú decides después a quién limitarle el acceso. Necesita la tabla `proyecto_permisos` (ver instrucciones abajo); si no existe, todos siguen funcionando como Administrador sin problema.

## Activar los roles y permisos (una sola vez en Supabase)

1. Entra a supabase.com → tu proyecto → **SQL Editor** → **New query**.
2. Pega y ejecuta (botón **Run**) exactamente esto:

```sql
create table proyecto_permisos (
  id bigint generated by default as identity primary key,
  "usuarioId" bigint not null,
  rol text not null default 'admin'
);
alter table proyecto_permisos disable row level security;
```

3. Sube el `index.html` de este paquete a GitHub. En cuanto cargue, entra como Administrador y ve al menú lateral, ítem **Accesos** — ahí le asignas "Editor" o "Solo lectura" a quien quieras limitar. Los demás quedan como Administrador por defecto.

## Menú lateral (nuevo)

Ahora la página tiene un menú a la izquierda con 6 secciones:

- **Usuarios** — administrar las cuentas que entran a esta página: agregar una nueva, editar usuario/contraseña/nombre, asignarle un país y activarla o inactivarla (solo Administradores la ven).
- **Accesos** — asignar el rol (Administrador / Editor / Solo lectura) de cada usuario (solo Administradores).
- **Áreas** — catálogo de áreas para asignar a los proyectos: crear, editar el nombre o eliminar (solo Administradores).
- **Países** — mismo catálogo de países que ya usa el resto de Kielsa CI; aquí se puede agregar, editar o eliminar (solo Administradores).
- **Responsables** — catálogo de responsables. En el formulario de "Agregar/Editar proyecto", el campo Responsable ahora es una lista desplegable que se llena con este catálogo, en vez de tener que escribirlo a mano cada vez (solo Administradores gestionan el catálogo; cualquiera con permiso de editar proyectos puede elegir de la lista al crear/editar un proyecto).
- **Reportes** — KPIs, resumen por categoría y alertas de vencimiento, en su propia pestaña separada de Proyectos (ver sección "Reportes (pestaña separada de Proyectos)" más abajo).
- **Proyectos** — filtros, tabla de proyectos con su Plan de acción al seleccionar uno, agregar/editar/eliminar y exportar a Excel/PDF. Esta y Reportes son las únicas secciones que ven los usuarios Editor y Solo lectura.

**Nota:** si las tablas de Áreas o Responsables todavía no existen en Supabase (ver instrucciones abajo), la app no se rompe: el campo Área usa una lista fija como antes y el campo Responsable vuelve a ser de texto libre, hasta que actives las tablas.

## Activar los catálogos de Áreas y Responsables (una sola vez en Supabase)

1. Entra a supabase.com → tu proyecto → **SQL Editor** → **New query**.
2. Pega y ejecuta (botón **Run**) exactamente esto:

```sql
create table proyecto_areas (
  id bigint generated by default as identity primary key,
  nombre text not null
);
alter table proyecto_areas disable row level security;

create table proyecto_responsables (
  id bigint generated by default as identity primary key,
  nombre text not null
);
alter table proyecto_responsables disable row level security;
```

3. Listo. En cuanto subas el `index.html` de este paquete, los ítems "Áreas" y "Responsables" del menú lateral ya podrán crear, editar y eliminar registros, y el campo Responsable del formulario de proyectos se volverá una lista desplegable automáticamente.

La sección **Países** del menú lateral usa la tabla `paises` que ya existe y ya usa el resto de Kielsa CI — no necesita ninguna tabla nueva.

## Administrar usuarios (agregar, editar, inactivar, país)

En **Usuarios** ahora puedes:

- **Agregar usuario** — crea una cuenta nueva (usuario, contraseña, nombre, país y estado) sin tener que pedírselo a nadie más.
- **Editar** — cambia el usuario, el nombre, el país o el estado de una cuenta que ya existe. La contraseña se deja en blanco si no la quieres cambiar.
- **Inactivar / Activar** — desactiva el acceso de alguien con un clic (por ejemplo si alguien deja la empresa), sin necesidad de borrar su cuenta ni su historial. Se puede reactivar en cualquier momento.
- **Países** — a cada usuario le puedes marcar uno, varios o todos los países (con un clic en "Todos"), usando casillas de selección. Es solo informativo por ahora, para saber con qué países trabaja cada quien.

Esto usa la misma tabla `usuarios` de siempre (la que comparten con el resto de Kielsa CI) para el usuario/contraseña/nombre/estado, así que cualquier cambio aquí también aplica si esa persona usa la app principal. El país es una excepción: se guarda en una tabla aparte (`proyecto_usuario_paises`) que solo usa esta página, para no tocar la tabla compartida. Necesita esa tabla en Supabase (ver instrucciones abajo); si no existe, la columna País simplemente no se muestra y el resto sigue funcionando normal.

## Activar el país por usuario (una sola vez en Supabase)

1. Entra a supabase.com → tu proyecto → **SQL Editor** → **New query**.
2. Pega y ejecuta (botón **Run**) exactamente esto:

```sql
create table proyecto_usuario_paises (
  id bigint generated by default as identity primary key,
  "usuarioId" bigint not null,
  pais_id bigint
);
alter table proyecto_usuario_paises disable row level security;
```

3. Listo. En cuanto subas el `index.html` de este paquete, la columna "País" de Usuarios ya podrá mostrarse y asignarse desde ahí.

## Exportar a PDF

Junto al botón de Excel hay uno nuevo de **PDF**: descarga exactamente la misma lista de proyectos que se ve filtrada en pantalla (mismas columnas que el Excel), en un PDF horizontal listo para imprimir o compartir.

## Nuevo formulario de proyecto

Rediseñé el formulario de "Agregar/Editar proyecto" con el formato clásico por secciones que me pediste, usando como referencia el Excel que me compartiste. Al editar un proyecto ahora hay dos pestañas:

- **Datos del proyecto** — organizado en secciones: Datos generales (código, categoría, prioridad, nombre), Asignación (área, país, responsable), Fechas y estado (fecha de solicitud, fecha de inicio, vencimiento, estado y avance), Ticket y archivo (ticket, archivo/documento), Descripción y, si estás **agregando** un proyecto nuevo, una sección más al final: **Plan de trabajo (opcional)**.
- **Comentarios** — la bitácora de comentarios de siempre.

El Cronograma / Plan de acción de un proyecto **ya existente** ya no vive dentro de este formulario — se maneja aparte, debajo de la tabla de proyectos, seleccionando la fila del proyecto (ver la siguiente sección). Pero al **agregar** un proyecto nuevo, el mismo formulario de "Agregar proyectos" trae ahora una sección "Plan de trabajo (opcional)" donde puedes capturar de una vez las tareas del plan (nombre, responsable, fechas, dependencia, % de avance, estatus) — se guardan junto con el proyecto en cuanto haces clic en "Guardar". Si agregas varios proyectos a la vez (con el botón "Agregar proyecto" de arriba, uno por pestaña), cada uno tiene su propio plan de trabajo independiente. Por supuesto, también puedes dejarlo vacío al crear el proyecto y agregar las tareas después, seleccionándolo en la tabla — ambos caminos llegan al mismo lugar.

## Tabla de proyectos y Plan de acción

Por pedido tuyo, la pantalla de Proyectos se simplificó: ya no hay vistas de Tarjetas ni Kanban, solo la tabla. Al hacer clic en cualquier fila de la tabla, justo debajo de esa misma fila se despliega una tarjeta nueva, **"Plan de acción — [nombre del proyecto]"**, con todo el Cronograma de ese proyecto: línea de tiempo (Gantt), ruta crítica y la tabla de tareas con botones para agregar, editar y eliminar (según tu rol). Hacer clic en la misma fila otra vez, o en el botón "Cerrar" del panel, lo oculta. Seleccionar otro proyecto cambia el panel para mostrar el plan de ese proyecto.

Dentro del Plan de acción hay dos botones de exportación propios de ese proyecto:

- **Excel** — descarga un archivo con el nombre del proyecto y su cronograma completo (EDT, tarea, responsable, fechas, % de avance, estatus).
- **PDF** — genera un informe en PDF del plan de acción, con la misma tabla de tareas y el avance general del proyecto.

Estos son aparte de los botones de Excel/PDF que ya existían junto a los filtros, que siguen exportando la **lista completa de proyectos** (no el plan de uno solo).

### Línea de tiempo (Gantt) y ruta crítica

A partir del diagnóstico que te mandé comparando la app contra estándares internacionales de gestión de proyectos (PMBOK/ISO 21500), lo primero que implementamos fue lo que marcamos como más prioritario: una línea de tiempo visual y el cálculo automático de la ruta crítica.

Ahora, arriba de la tabla de tareas del Plan de acción (siempre que el proyecto tenga al menos una tarea), aparece un pequeño Gantt: cada tarea es una barra horizontal ubicada según su fecha de inicio y de entrega, con el color de su estatus y una franja más clara que muestra su % de avance. Si una tarea todavía no tiene fecha de inicio o de entrega, aparece como "Sin fechas" en vez de una barra, para no dañar la escala del resto.

Encima de esas barras, las tareas que están en **ruta crítica** se resaltan en rojo con un ícono de alerta, tanto en el Gantt como en la fila de la tabla. La ruta crítica es la cadena de tareas dependientes entre sí (tarea → de qué depende → de qué depende esa...) que termina en la fecha de entrega más tardía del proyecto: si cualquiera de esas tareas se atrasa, se atrasa el proyecto completo. Como hoy cada tarea solo puede depender de una tarea anterior, el cálculo es directo; si más adelante quieres que una tarea dependa de varias a la vez (como permite el estándar), lo ampliamos.

**Sobre el campo "Archivo / documento":** por ahora es un campo de texto (para poner el nombre del archivo o un enlace, por ejemplo a un Drive o SharePoint), no una carga de archivo real. Lo hice así para no meter la complejidad de subir y guardar archivos (que en Supabase requiere configurar un "bucket" de almacenamiento con sus propios permisos, y ya tuvimos bastante trabajo ajustando permisos con las otras tablas). Si más adelante quieres que sea una carga de archivo de verdad, lo hacemos como una tarea aparte.

### Activar el Cronograma y los campos nuevos (una sola vez en Supabase)

Estas columnas se agregan a las tablas `proyectos` y `proyecto_tareas` que ya existen y ya funcionan, así que **no hace falta tocar permisos ni RLS** — solo agregar las columnas nuevas:

1. Entra a supabase.com → tu proyecto → **SQL Editor** → **New query**.
2. Pega y ejecuta (botón **Run**) exactamente esto:

```sql
alter table proyectos add column if not exists fecha_solicitud date;
alter table proyectos add column if not exists archivo_nombre text;
alter table proyectos add column if not exists actualizado_en timestamptz;
alter table proyectos add column if not exists actualizado_por text;

alter table proyecto_tareas add column if not exists responsable text;
alter table proyecto_tareas add column if not exists fecha_inicio date;
alter table proyecto_tareas add column if not exists fecha_entrega date;
alter table proyecto_tareas add column if not exists porcentaje_avance numeric default 0;
alter table proyecto_tareas add column if not exists estatus text default 'Pendiente';
alter table proyecto_tareas add column if not exists depende_id bigint;
```

3. Listo. En cuanto subas el `index.html` de este paquete, el formulario de proyecto ya se ve con las secciones nuevas y el Plan de acción (debajo de la tabla, al seleccionar un proyecto) ya puede guardar tareas con responsable, fechas, dependencia, % de avance y estatus.

## Carga de trabajo por persona

Tercera mejora del diagnóstico: en el menú lateral hay un ítem nuevo, **Carga de trabajo**, que junta las tareas del Cronograma de TODOS los proyectos (no solo uno) y las agrupa por responsable. Para cada persona muestra cuántas tareas activas tiene en este momento (sin contar las ya completadas), cuántas de esas están vencidas, en qué proyectos están, y una etiqueta de carga: **Baja** (1-2 tareas activas), **Media** (3-5) o **Alta** (6 o más) — para detectar de un vistazo quién tiene demasiado encima y quién tiene espacio para más trabajo. Las tareas sin responsable asignado se agrupan aparte, como "Sin asignar", para que no se pierdan de vista.

Esta vista **no necesita ninguna tabla ni columna nueva en Supabase** — usa exactamente las mismas tareas del Cronograma que ya se cargan para las alertas y el avance de cada proyecto, solo que agrupadas de otra forma. En cuanto subas el `index.html` de este paquete, "Carga de trabajo" ya funciona.

## Matriz RACI (quitada)

Habíamos agregado, dentro del formulario de cada tarea del Plan de acción, los campos Aprobador/Consultados/Informados y un botón "Ver matriz RACI" que los mostraba en una tabla compacta (R/A/C/I). Por pedido tuyo, quité el botón, la tabla y esos tres campos del formulario de tareas — el formulario de tareas se quedó solo con Nombre, Responsable, Depende de, Fechas, % de avance y Estatus.

Si ya habías corrido el SQL que agregaba las columnas `aprobador`, `consultados` e `informados` a `proyecto_tareas`, no hace falta que las borres — se quedan sin usarse, sin ningún efecto sobre el resto de la app (igual que con Presupuesto/Gasto real y las tablas de Riesgos/Interesados/Cambios).

## Riesgos, Interesados e Historial de cambios (quitados)

Habíamos agregado, dentro del formulario de proyecto, una pestaña de Riesgos (matriz probabilidad × impacto), una de Interesados (matriz influencia/interés con estrategia de gestión automática) y una de Historial de cambios (registro automático de quién cambió qué). Por pedido tuyo, quité las tres pestañas y todo su código de la app — ya no aparecen en ningún lado.

Si en algún momento corriste el SQL que creaba las tablas `proyecto_riesgos`, `proyecto_interesados` y `proyecto_cambios` en Supabase, no hace falta que las borres — se quedan ahí sin usarse, sin ningún efecto sobre el resto de la app (igual que se hizo antes con Presupuesto/Gasto real). Si prefieres borrarlas también de la base de datos, dímelo y te paso el `drop table` correspondiente — esa sí es una operación que borra datos, así que la dejo fuera de las instrucciones automáticas.

## Reportes (pestaña separada de Proyectos)

Antes, los KPIs, el resumen por categoría y las alertas de vencimiento aparecían arriba de la lista de proyectos, todo en la misma pantalla. Ahora están en su propia pestaña, **Reportes**, separada de **Proyectos** en el menú lateral — para que la pantalla de Proyectos quede solo con los filtros y la tabla que usas para trabajar día a día, sin tener que hacer scroll pasando los KPIs cada vez.

- **Reportes** — KPIs (total, cumplidos, en progreso, pendientes, avance promedio), resumen por categoría y el panel de alertas de vencimiento.
- **Proyectos** — filtros (categoría, estado, país), botones de Excel/PDF/Agregar proyecto, y la tabla (selecciona una fila para ver su Plan de acción debajo).

Se conservan los dos atajos que ya tenías, ahora cruzando entre pestañas:

- Hacer clic en una tarjeta del resumen por categoría (en Reportes) te lleva a Proyectos con esa categoría ya filtrada.
- Hacer clic en la campana de alertas (visible en cualquier pestaña) te lleva a Reportes con el panel de alertas abierto.

No necesita ningún cambio en Supabase — es solo una reorganización de la pantalla. En cuanto subas el `index.html` de este paquete, ya queda activo.

## Logo y créditos de autoría

Se agregó el logo de Kielsa (el mismo que ya usa la app principal, tomado de ahí — círculo azul con cruz amarilla + texto "Kielsa") en el encabezado de la app y en la pantalla de inicio de sesión, además del ícono de la pestaña del navegador (favicon). Va incrustado directamente en el `index.html` como imagen (no depende de ningún archivo aparte ni de conexión a internet para cargar).

De paso, la pantalla de login se rediseñó para que se vea igual que la de la app principal de Kielsa CI: el mismo degradado de fondo azul, la misma tarjeta blanca centrada con el logo arriba, los mismos estilos de campos y de aviso de error, y el botón "Entrar →" con el mismo degradado. Ya no dice "Ingresar" sino "Entrar →", igual que en Kielsa CI.

También se agregó el texto **"Desarrollado por Donny Rojas"** en dos lugares: en la pantalla de inicio de sesión (debajo del botón "Entrar →") y como pie de página dentro de la app, debajo de la lista de proyectos.

No necesita ningún cambio en Supabase — en cuanto subas el `index.html` de este paquete, todo esto ya se ve.

## Endurecimiento del login

Mejora de seguridad al login, sin tocar el formato de la contraseña (ver la nota de seguridad más arriba sobre por qué el cifrado completo no se puede hacer solo en esta página). Antes, la pantalla de inicio de sesión pedía la tabla `usuarios` completa — con la contraseña de cada persona en texto — en cuanto alguien cargaba la página, sin importar si llegaba a escribir algo o si el usuario/clave eran correctos. Ahora la consulta se filtra por el usuario que se está escribiendo, así que solo esa una fila viaja por la red; la contraseña del resto de la gente ya no se expone en cada intento de login.

No necesita ningún cambio en Supabase — es solo un ajuste a cómo la app pide los datos. En cuanto subas el `index.html` de este paquete, ya queda activo.

## Sobre el costo del proyecto (quitado)

Habíamos agregado Presupuesto, Gasto real, la comparación de salud de presupuesto y el panel de Valor Ganado (EVM), pero se decidió no incluir el costo del proyecto en esta página — así que quité los tres del formulario, de la vista de tabla y de las exportaciones a Excel y PDF. La sección "Presupuesto y archivos" del formulario ahora es simplemente "Ticket y archivo".

Si en algún momento ya habías corrido el SQL que agregaba las columnas `presupuesto` y `gasto_real` a la tabla `proyectos`, no hace falta que las borres — se quedan ahí sin usarse, sin ningún efecto sobre el resto de la app. Si prefieres quitarlas también de la base de datos, dímelo y te paso el `alter table ... drop column` correspondiente (esa sí es una operación que borra datos, así que la dejo fuera de las instrucciones automáticas).

## Verificación realizada

Antes de entregarla, probé el archivo con un navegador automatizado (React + Babel compilando sin errores) simulando datos de Supabase, cubriendo: login → agregar/editar/eliminar proyecto → KPIs y lista actualizados; Kanban (arrastrar y soltar entre columnas); alertas de vencimiento; comentarios/bitácora (agregar y borrar); roles y permisos (Administrador ve todo, Editor no puede eliminar, Solo lectura no puede editar); el menú lateral completo (Usuarios, Accesos, Áreas, Países, Responsables, Proyectos), el alta/edición/baja de Áreas y Responsables, que los nuevos valores aparecen de inmediato como opción en el formulario de proyectos, y la descarga en PDF — todo sin errores de consola.

En esta última ronda (formulario rediseñado y Cronograma) probé además: abrir un proyecto y moverse entre las tres pestañas (Datos del proyecto, Cronograma, Comentarios); agregar una tarea nueva al Cronograma y verla aparecer con su número EDT, duración calculada y estatus; editar esa misma tarea; que una tarea vencida (fecha de entrega ya pasada y no completada) se marque sola como "Vencida"; que el avance general del proyecto se recalcule como el promedio del % de avance de todas las tareas, tanto en la pestaña Cronograma como en la barra de solo-lectura de la pestaña Datos; que el modo "Agregar proyectos" (uno o varios a la vez) siga funcionando sin pestañas, tal como antes; y que la exportación a Excel y PDF incluya el avance correcto — todo sin errores de consola.

Después, ya con la línea de tiempo (Gantt) y la ruta crítica, probé con un proyecto de prueba con tareas encadenadas por dependencia (una tarea depende de la anterior, y esa de otra) que la ruta crítica calculada coincidiera con la cadena que realmente determina la fecha de fin del proyecto — y no con una tarea vencida pero aislada que no afecta el fin real —, que las barras del Gantt quedaran bien ubicadas y del tamaño correcto según sus fechas, que la franja de % de avance se viera dentro de cada barra, y que una tarea sin fecha de inicio o de entrega se mostrara como "Sin fechas" en vez de romper la escala del resto. Todo sin errores de consola.

Con el registro de riesgos probé: abrir la pestaña Riesgos y ver los riesgos existentes con su nivel ya calculado; agregar un riesgo nuevo y verlo aparecer con los valores por defecto (Media/Medio); editar un riesgo existente y confirmar que el formulario se llena con sus datos; que un riesgo Alto/Alto salga en nivel "Alto" y dispare el aviso rojo, mientras que uno Media/Medio sale en "Medio" sin disparar el aviso; y que el contador de la pestaña ("Riesgos 3") se actualice al agregar. Todo sin errores de consola.

Con la carga de trabajo probé, usando tareas de dos proyectos distintos asignadas a las mismas personas: que las tareas se agrupen bien por responsable sumando de todos los proyectos (no solo uno); que el conteo de tareas activas y vencidas salga correcto; que la lista de proyectos por persona se arme bien; que las tareas sin responsable se agrupen aparte como "Sin asignar"; y que la etiqueta de carga (Baja/Media/Alta) coincida con los umbrales esperados. Todo sin errores de consola.

Con el registro de cambios probé: abrir la pestaña "Historial de cambios" de un proyecto con un cambio ya registrado y ver la fila con su fecha, usuario, campo, valor anterior tachado y valor nuevo; editar el proyecto cambiando el Estado y guardar; reabrir el proyecto y confirmar que la fila nueva aparece sola en el historial, con el campo correcto ("Estado"), el valor anterior real (no el que estaba en el formulario a medio llenar) y el valor nuevo; y que guardar sin cambiar nada relevante no agregue filas de más. Todo sin errores de consola.

Con la matriz RACI probé: abrir el botón "Ver matriz RACI" de un proyecto con tareas que ya tenían Aprobador/Consultados/Informados capturados y confirmar que la tabla compacta los muestra bien, uno por columna; editar una tarea que no tenía nada de RACI, llenar el Aprobador (de la lista de Responsables), Consultados e Informados (texto libre) y guardar; confirmar que la matriz se actualiza sola, sin recargar, con los valores nuevos en la fila correcta; y, ya con la pestaña cerrada y el proyecto completo guardado, reabrirlo desde cero y confirmar que los datos de RACI siguen ahí (no se perdieron al recargar desde el origen de datos). Todo sin errores de consola.

Con el registro de interesados probé: abrir la pestaña Interesados de un proyecto con dos interesados ya capturados en cuadrantes distintos (uno "Gestionar de cerca", otro "Mantener satisfecho") y confirmar que la estrategia de cada uno se calcula y se pinta correctamente, y que aparece el aviso rojo por tener uno en "Gestionar de cerca"; agregar un tercer interesado con influencia Baja e interés Alto y confirmar que sale como "Mantener informado" (el cuarto cuadrante, "Monitorear", se validó por código ya que solo faltaba probar la combinación baja/bajo); y confirmar que el nombre, tipo, rol, contacto y estrategia se ven bien en la tabla. Todo sin errores de consola.

Con el endurecimiento del login probé: iniciar sesión con usuario y clave correctos (como Administrador y como Editor, dos cuentas distintas) y confirmar que ambas entran normal; escribir una clave incorrecta y confirmar que sigue mostrando el mismo mensaje de error de siempre ("Usuario y clave incorrectas"), sin distinguir si el usuario existe o no (para no dar pistas de más); y confirmar que la consulta a Supabase ahora sí va filtrada por el usuario escrito. Todo sin errores de consola.

Después de quitar el costo del proyecto probé: que la pestaña "Datos del proyecto" ya no muestre Presupuesto, Gasto real ni el panel de Valor Ganado en ningún proyecto (revisé uno que antes sí los mostraba); que la vista de tabla ya no tenga la columna "Presupuesto"; que guardar un proyecto (sin tocar nada de costo) siga funcionando normal; y que la descarga de Excel y de PDF se sigan generando sin errores, ya sin esas columnas. Todo sin errores de consola. Los íconos y las llamadas reales a Supabase no se pudieron probar en vivo desde este entorno (no tiene salida a internet), así que la primera prueba real de conexión a datos debe hacerse ya en Vercel.

Con la separación de Reportes probé, con capturas de pantalla: que al entrar la pantalla de Proyectos se vea solo con filtros y lista, sin KPIs ni resumen por categoría; que la pestaña Reportes muestre solo los KPIs, el resumen por categoría y las alertas, sin filtros ni lista; que hacer clic en una tarjeta de categoría (por ejemplo "CI") navegue a Proyectos con esa categoría ya filtrada (de 2 proyectos bajó a 1, el que es de categoría CI); y que hacer clic en la campana de alertas navegue a Reportes con el panel de alertas abierto. Todo sin errores de consola.

Con el logo y el rediseño del login probé, con capturas de pantalla: que el logo de Kielsa se vea en la pantalla de login (arriba de "Kielsa CI — Proyectos") y en el encabezado de la app ya adentro; que el fondo, la tarjeta, los campos y el botón "Entrar →" tengan el mismo estilo que la app principal de Kielsa CI; que "Desarrollado por Donny Rojas" se vea debajo del botón "Entrar →" en el login y también como pie de página después de iniciar sesión; y que escribir una clave incorrecta muestre el aviso rojo "Usuario y clave incorrectas" con el mismo estilo que en Kielsa CI. Todo sin errores de consola.

Con el rediseño de la tabla y el Plan de acción probé, con capturas de pantalla: que la pantalla de Proyectos muestre solo la tabla (sin botones de Tarjetas ni Kanban); que hacer clic en una fila la resalte y despliegue debajo la tarjeta "Plan de acción — [nombre]" con el Gantt, la ruta crítica, la tabla de tareas y el avance general; que el botón "Ver matriz RACI" del panel muestre y oculte la tabla RACI correctamente; que agregar una tarea nueva desde el panel la refleje de inmediato en el Gantt, en la tabla de tareas, y también actualice el % de avance y el conteo de tareas de esa fila en la tabla de proyectos; que seleccionar un segundo proyecto cambie el panel para mostrar su propio plan (sin mezclar tareas de otro proyecto); que hacer clic en la misma fila otra vez, o en "Cerrar", oculte el panel; que los botones "Excel" y "PDF" del panel descarguen el cronograma de ese proyecto (nombre del proyecto + tabla de tareas) sin errores; y que el botón "Editar" siga abriendo el formulario, ahora con solo dos pestañas (Datos del proyecto y Comentarios) y sin rastro de Riesgos, Interesados ni Historial de cambios. Todo sin errores de consola.

**Corrección reportada en producción (26 de agosto de 2026):** con tus 35 proyectos reales, el panel del Plan de acción sí se generaba al seleccionar una fila (sin errores en consola, confirmado con tu captura de las DevTools), pero aparecía hasta el final de toda la tabla — había que hacer scroll pasando las otras filas para verlo, así que parecía que no pasaba nada. Lo corregí para que el panel se despliegue **inmediatamente debajo de la fila seleccionada** en vez de al final de la tabla. Lo probé simulando una tabla de 10 proyectos con un viewport chico (para forzar que hubiera scroll de por medio) y confirmé, con captura de pantalla, que el panel aparece pegado a la fila que se seleccionó — sin importar la posición — sin necesidad de hacer scroll. Todo sin errores de consola.

Después quitaste la matriz RACI: probé que el formulario de una tarea (tanto en el Plan de acción de un proyecto existente como en el nuevo "Plan de trabajo" al agregar un proyecto) ya no muestre los campos Aprobador/Consultados/Informados; que el botón "Ver matriz RACI" y su tabla compacta ya no aparezcan en el panel del Plan de acción; y que el resto del plan (Gantt, ruta crítica, tabla de tareas, exportar a Excel/PDF) siga funcionando exactamente igual. Todo sin errores de consola.

Con el nuevo "Plan de trabajo (opcional)" al agregar un proyecto probé, con capturas de pantalla: abrir "Agregar proyecto", escribir el nombre, hacer clic en "Agregar tarea al plan" y capturar una tarea (sin guardarla todavía en Supabase, solo en memoria) — se ve de inmediato en una tabla debajo, con opción de editarla o quitarla antes de guardar; hacer clic en "Guardar" y confirmar que el proyecto se crea Y la tarea se guarda de verdad en la base de datos con el id real del proyecto recién creado (no un id temporal); y que al seleccionar ese proyecto nuevo en la tabla, su Plan de acción ya muestre esa misma tarea, con su EDT, su % de avance y su estatus correctos. Todo sin errores de consola.
