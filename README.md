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

**Decisión tomada (25 de agosto de 2026):** por ahora se deja así, ya que esta base de datos la usa solo el equipo interno y nadie externo conoce la URL ni la llave. No se hizo ningún cambio de RLS. Si más adelante se quiere cerrar esto de verdad, hay dos caminos, y ninguno se puede hacer "solo en esta página" porque tocan la tabla `usuarios` y probablemente la app principal:

- **Arreglo real:** migrar el login actual a Supabase Auth (cuentas y sesiones reales) y luego escribir reglas de RLS que solo dejen ver/editar lo que a cada quien le corresponde.
- **Silenciar la alerta sin arreglar el fondo:** activar RLS con una regla que sigue permitiendo todo ("allow all"). Supabase deja de avisar, pero el acceso público de facto sigue igual.

## Qué incluye

- Pestaña **Reportes** separada, con los KPIs (total, cumplidos, en progreso, pendientes, avance promedio), el resumen por categoría (CI, Power Automate, Nuevo Proyecto) y las alertas de vencimiento — ver sección "Reportes (pestaña separada de Proyectos)" más abajo.
- Filtros por categoría, estado y país.
- Vista de tarjetas, vista Kanban (arrastra un proyecto entre columnas para cambiar su estado) y vista de tabla.
- Alertas automáticas de vencimiento: la campana del encabezado avisa sola qué proyectos ya vencieron o están por vencer (en los próximos 7 días), calculado con la fecha de fin real — no depende de que alguien cambie el estado a mano. Los proyectos Cumplidos o Cancelados no generan alerta. Al hacer clic en la campana te lleva directo a la pestaña Reportes con el panel de alertas abierto.
- Comentarios / bitácora por proyecto: dentro de cada proyecto (modo editar) hay una sección para que el equipo deje comentarios con su nombre y fecha, y para borrarlos. Necesita la tabla `proyecto_comentarios` en Supabase (ver instrucciones abajo); si todavía no existe, la app lo indica y el resto sigue funcionando normal.
- Roles y permisos propios de esta página (Administrador / Editor / Solo lectura) — ver sección "Menú lateral" abajo.
- Menú lateral con Usuarios, Accesos, Áreas, Países, Responsables y Carga de trabajo (catálogos e informativas) además de Proyectos — ver sección "Menú lateral" abajo.
- Agregar proyectos (uno o varios a la vez, mismo formulario tipo pestañas que usas en Hallazgos).
- Editar y eliminar proyectos.
- Formulario de proyecto rediseñado (ver secciones más abajo): secciones claras (Datos generales, Asignación, Fechas y estado, Ticket y archivo, Descripción), pestaña de **Cronograma** con línea de tiempo (Gantt), ruta crítica y **matriz RACI** por tarea, pestaña de **Riesgos** con matriz de probabilidad × impacto, pestaña de **Interesados** con matriz de influencia/interés y estrategia de gestión automática, vista de **Carga de trabajo** por persona, y pestaña de **Historial de cambios** que registra automáticamente quién cambió qué y cuándo.
- Exportar a Excel y a PDF la lista filtrada.

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

- Roles y permisos propios de esta página: hay tres roles — **Administrador** (acceso total, incluyendo gestionar usuarios), **Editor** (crea y edita proyectos, mueve el Kanban y comenta, pero no puede eliminar) y **Solo lectura** (solo ve, filtra y exporta a Excel). Un usuario Administrador puede asignar el rol de cada quien desde el nuevo botón "Usuarios y permisos" (ícono de personas) en el encabezado. **Importante:** cualquier usuario que todavía no tenga un rol asignado se trata automáticamente como Administrador, así que nadie pierde acceso al activar esta función — tú decides después a quién limitarle el acceso. Necesita la tabla `proyecto_permisos` (ver instrucciones abajo); si no existe, todos siguen funcionando como Administrador sin problema.

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
- **Proyectos** — filtros, vista de tarjetas/Kanban/tabla, agregar/editar/eliminar y exportar a Excel/PDF. Esta y Reportes son las únicas secciones que ven los usuarios Editor y Solo lectura.

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

## Nuevo formulario de proyecto y Cronograma

Rediseñé por completo el formulario de "Agregar/Editar proyecto" con el formato clásico por secciones que me pediste, usando como referencia el Excel que me compartiste. Al editar un proyecto ahora hay tres pestañas:

- **Datos del proyecto** — organizado en secciones: Datos generales (código, categoría, prioridad, nombre), Asignación (área, país, responsable), Fechas y estado (fecha de solicitud, fecha de inicio, vencimiento, estado y avance), Ticket y archivo (ticket, archivo/documento) y Descripción. Abajo del todo se ve un pequeño texto con la fecha y el usuario de la última actualización.
- **Cronograma** — la tabla de tareas del proyecto, estilo Gantt: cada tarea tiene número EDT (automático, según el orden), responsable, de qué otra tarea depende, fecha de inicio y de entrega, días de duración (calculados solos), % de avance y estatus (Pendiente / En proceso / Completada). Si una tarea no está completada y ya pasó su fecha de entrega, el sistema la marca sola como **Vencida** en rojo, sin que nadie tenga que cambiarla a mano. El avance general del proyecto ahora es el promedio del % de avance de todas sus tareas (antes solo contaba tareas completas vs. incompletas).
- **Comentarios** — la misma bitácora de comentarios de antes, ahora en su propia pestaña.

Al agregar un proyecto nuevo (una o varias a la vez) se ve solo la pestaña "Datos del proyecto" — el Cronograma se agrega después de crear el proyecto, desde "Editar".

## Línea de tiempo (Gantt) y ruta crítica

A partir del diagnóstico que te mandé comparando la app contra estándares internacionales de gestión de proyectos (PMBOK/ISO 21500), lo primero que implementamos fue lo que marcamos como más prioritario: una línea de tiempo visual y el cálculo automático de la ruta crítica.

Ahora, arriba de la tabla del Cronograma (siempre que el proyecto tenga al menos una tarea), aparece un pequeño Gantt: cada tarea es una barra horizontal ubicada según su fecha de inicio y de entrega, con el color de su estatus y una franja más clara que muestra su % de avance. Si una tarea todavía no tiene fecha de inicio o de entrega, aparece como "Sin fechas" en vez de una barra, para no dañar la escala del resto.

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

3. Listo. En cuanto subas el `index.html` de este paquete, el formulario de proyecto ya se ve con las pestañas nuevas y la pestaña Cronograma ya puede guardar tareas con responsable, fechas, dependencia, % de avance y estatus.

## Registro de riesgos

Segunda mejora del diagnóstico de estándares internacionales: ahora cada proyecto tiene, junto a Cronograma y Comentarios, una pestaña **Riesgos**. Se usa igual que el Cronograma — un botón "Agregar riesgo" abre un formulario con la descripción del riesgo, probabilidad (Baja/Media/Alta), impacto (Bajo/Medio/Alto), responsable de darle seguimiento, plan de mitigación y estado (Abierto/Mitigado/Cerrado/Ocurrió).

El **nivel** de cada riesgo (Bajo, Medio o Alto) se calcula solo combinando probabilidad e impacto, con la matriz que usan los estándares de gestión de riesgos (probabilidad × impacto, en una escala de 1 a 9): por ejemplo, un riesgo con probabilidad Alta e impacto Alto sale automáticamente en nivel Alto, mientras que uno con probabilidad Baja e impacto Bajo sale en nivel Bajo. Cuando un proyecto tiene algún riesgo de nivel Alto que sigue Abierto, aparece un aviso destacado en rojo arriba de la tabla para que no se pierda de vista.

### Activar el registro de riesgos (una sola vez en Supabase)

Esta sí es una tabla nueva, así que además de crearla hay que quitarle la seguridad a nivel de fila y darle permisos al usuario que usa la app (igual que con Áreas, Responsables y las demás tablas nuevas que ya activaste):

1. Entra a supabase.com → tu proyecto → **SQL Editor** → **New query**.
2. Pega y ejecuta (botón **Run**) exactamente esto:

```sql
create table proyecto_riesgos (
  id bigint generated by default as identity primary key,
  "proyectoId" bigint not null,
  nombre text not null,
  probabilidad text default 'Media',
  impacto text default 'Medio',
  responsable text,
  mitigacion text,
  estado text default 'Abierto',
  "createdAt" timestamptz not null default now()
);
alter table proyecto_riesgos disable row level security;
grant select, insert, update, delete on proyecto_riesgos to anon, authenticated;
```

3. Listo. En cuanto subas el `index.html` de este paquete, la pestaña "Riesgos" de cada proyecto ya podrá crear, editar y eliminar riesgos.

## Carga de trabajo por persona

Tercera mejora del diagnóstico: en el menú lateral hay un ítem nuevo, **Carga de trabajo**, que junta las tareas del Cronograma de TODOS los proyectos (no solo uno) y las agrupa por responsable. Para cada persona muestra cuántas tareas activas tiene en este momento (sin contar las ya completadas), cuántas de esas están vencidas, en qué proyectos están, y una etiqueta de carga: **Baja** (1-2 tareas activas), **Media** (3-5) o **Alta** (6 o más) — para detectar de un vistazo quién tiene demasiado encima y quién tiene espacio para más trabajo. Las tareas sin responsable asignado se agrupan aparte, como "Sin asignar", para que no se pierdan de vista.

Esta vista **no necesita ninguna tabla ni columna nueva en Supabase** — usa exactamente las mismas tareas del Cronograma que ya se cargan para las alertas y el avance de cada proyecto, solo que agrupadas de otra forma. En cuanto subas el `index.html` de este paquete, "Carga de trabajo" ya funciona.

## Registro de cambios

Cuarta mejora del diagnóstico: cada proyecto ahora tiene, junto a Cronograma, Riesgos y Comentarios, una pestaña **Historial de cambios**. A diferencia de las demás, esta no tiene formulario ni botón — se llena sola cada vez que guardas una edición al proyecto: la app compara los datos de antes y después de guardar (código, categoría, prioridad, área, país, responsable, estado, fechas y ticket) y, por cada campo que haya cambiado, agrega una fila con la fecha, quién hizo el cambio, el campo, el valor anterior (tachado) y el valor nuevo. Si no cambió nada relevante en ese guardado, no se agrega ninguna fila.

Esto responde a lo que piden los estándares de gestión de proyectos como control de cambios / trazabilidad: poder ver quién cambió qué y cuándo, sin depender de que alguien lo anote a mano en un comentario. Es de solo lectura — no se puede editar ni borrar una fila del historial una vez creada, para que sirva como bitácora confiable.

### Activar el registro de cambios (una sola vez en Supabase)

Esta también es una tabla nueva, así que hay que quitarle la seguridad a nivel de fila y darle permisos al usuario que usa la app (igual que con Riesgos):

1. Entra a supabase.com → tu proyecto → **SQL Editor** → **New query**.
2. Pega y ejecuta (botón **Run**) exactamente esto:

```sql
create table proyecto_cambios (
  id bigint generated by default as identity primary key,
  "proyectoId" bigint not null,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario text,
  "createdAt" timestamptz not null default now()
);
alter table proyecto_cambios disable row level security;
grant select, insert, update, delete on proyecto_cambios to anon, authenticated;
```

3. Listo. En cuanto subas el `index.html` de este paquete, la pestaña "Historial de cambios" de cada proyecto empezará a registrar automáticamente cada edición que se guarde a partir de ese momento (los cambios hechos antes de activar la tabla no se pueden recuperar, porque no se guardaron en ningún lado).

## Matriz RACI por tarea

Quinta mejora del diagnóstico: dentro de la pestaña Cronograma, cada tarea ahora tiene su propia mini "matriz RACI" además del Responsable de siempre. Al agregar o editar una tarea vas a ver una sección nueva, "Matriz RACI de la tarea", con tres campos: **Aprobador** (quien rinde cuentas por el resultado — se elige del mismo catálogo de Responsables), **Consultados** (a quién se le pide opinión antes o durante la tarea) e **Informados** (a quién se le avisa del avance o resultado, sin que participe directamente) — estos dos últimos son de texto libre, para poner uno o varios nombres separados por coma.

Para verlos todos juntos sin tener que abrir tarea por tarea, arriba de la tabla del Cronograma hay un botón **"Ver matriz RACI"** que despliega una tabla compacta con una fila por tarea y una columna por cada letra (R/A/C/I), con su leyenda arriba. Esto responde a lo que piden los estándares de gestión de proyectos sobre roles y responsabilidades claras: quién ejecuta (R, el Responsable de siempre) no tiene por qué ser lo mismo que quién aprueba (A), y ambos son distintos de a quién solo se consulta o se informa.

### Activar la matriz RACI (una sola vez en Supabase)

Estas son columnas nuevas en la tabla `proyecto_tareas` que ya existe y ya funciona, así que **no hace falta tocar permisos ni RLS**:

1. Entra a supabase.com → tu proyecto → **SQL Editor** → **New query**.
2. Pega y ejecuta (botón **Run**) exactamente esto:

```sql
alter table proyecto_tareas add column if not exists aprobador text;
alter table proyecto_tareas add column if not exists consultados text;
alter table proyecto_tareas add column if not exists informados text;
```

3. Listo. En cuanto subas el `index.html` de este paquete, el formulario de tareas ya muestra los campos de Aprobador/Consultados/Informados, y el botón "Ver matriz RACI" ya funciona.

## Registro de interesados

Sexta y última mejora del diagnóstico: ahora cada proyecto tiene, junto a Cronograma, Riesgos y Comentarios, una pestaña **Interesados**. Un botón "Agregar interesado" abre un formulario con: nombre del interesado, tipo (Interno/Externo), rol o relación con el proyecto, influencia (poder que tiene sobre el proyecto: Baja/Media/Alta), interés (qué tanto le afecta o le importa el resultado: Bajo/Medio/Alto), contacto (opcional) y notas sobre la estrategia de gestión.

La **estrategia de gestión** se calcula sola combinando influencia e interés, con la matriz de poder/interés clásica que usa PMBOK (a veces llamada matriz de Mendelow) para priorizar a quién atender:

- **Gestionar de cerca** — alta influencia y alto interés: son quienes más pueden afectar el proyecto y más lo siguen de cerca.
- **Mantener satisfecho** — alta influencia pero bajo interés: hay que cuidarlos aunque no estén pendientes del día a día, porque pueden frenar el proyecto si se molestan.
- **Mantener informado** — bajo poder pero alto interés: no deciden, pero conviene tenerlos al tanto.
- **Monitorear** — bajo poder y bajo interés: basta con vigilarlos de lejos, sin invertirles mucho esfuerzo.

Cuando un proyecto tiene algún interesado en "Gestionar de cerca", aparece un aviso destacado en rojo arriba de la tabla, igual que con los riesgos de nivel Alto — para que no se pierda de vista a quien más puede afectar el proyecto.

### Activar el registro de interesados (una sola vez en Supabase)

Esta es una tabla nueva, así que hay que quitarle la seguridad a nivel de fila y darle permisos al usuario que usa la app (igual que con Riesgos y Registro de cambios):

1. Entra a supabase.com → tu proyecto → **SQL Editor** → **New query**.
2. Pega y ejecuta (botón **Run**) exactamente esto:

```sql
create table proyecto_interesados (
  id bigint generated by default as identity primary key,
  "proyectoId" bigint not null,
  nombre text not null,
  tipo text default 'Interno',
  rol text,
  influencia text default 'Media',
  interes text default 'Medio',
  contacto text,
  notas text,
  "createdAt" timestamptz not null default now()
);
alter table proyecto_interesados disable row level security;
grant select, insert, update, delete on proyecto_interesados to anon, authenticated;
```

3. Listo. En cuanto subas el `index.html` de este paquete, la pestaña "Interesados" de cada proyecto ya podrá crear, editar y eliminar interesados.

## Reportes (pestaña separada de Proyectos)

Antes, los KPIs, el resumen por categoría y las alertas de vencimiento aparecían arriba de la lista de proyectos, todo en la misma pantalla. Ahora están en su propia pestaña, **Reportes**, separada de **Proyectos** en el menú lateral — para que la pantalla de Proyectos quede solo con los filtros y la lista (tarjetas/Kanban/tabla) que usas para trabajar día a día, sin tener que hacer scroll pasando los KPIs cada vez.

- **Reportes** — KPIs (total, cumplidos, en progreso, pendientes, avance promedio), resumen por categoría y el panel de alertas de vencimiento.
- **Proyectos** — filtros (categoría, estado, país), botones de Excel/PDF/Agregar proyecto, y la lista en vista de tarjetas, Kanban o tabla.

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
