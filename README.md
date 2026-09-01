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
- Agregar proyectos (uno o varios a la vez, una tarjeta por proyecto con sus datos en una lista de Campo / Valor).
- Editar y eliminar proyectos.
- Botón "Editar" con Datos del proyecto (misma lista de Campo / Valor, más el Plan de acción) y Comentarios — ver sección "Nuevo formulario de proyecto (lista de Campo / Valor)" más abajo.
- Plan de acción por proyecto (debajo de la tabla, al seleccionarlo), con formato tipo Excel: tabla de actividades con días hábiles, responsable, fechas, % de avance, estado, observaciones, % planificado y desvío, más un resumen de avance y de actividades por estado, y exportar ese plan a Excel y a PDF — ver sección "Tabla de proyectos y Plan de acción".
- Exportar a Excel y a PDF la lista completa de proyectos (botones junto a los filtros).
- Evaluación Financiera Proyectos: sección nueva del menú lateral para asociar a cada proyecto que lo necesite una evaluación financiera con proyección a 3 años, ROI, VPN, TIR, Payback y veredicto, calculados en vivo — ver sección "Evaluación Financiera Proyectos".

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
- **Evaluación Financiera Proyectos** — sección nueva, justo después de Proyectos, para asociar una evaluación financiera (proyección a 3 años, ROI, VPN, TIR, Payback, etc.) al proyecto que la necesite. Ver sección "Evaluación Financiera Proyectos" más abajo.

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

## Nuevo formulario de proyecto (lista de Campo / Valor)

Probamos el llenado como una tabla de columnas (una fila por proyecto, scroll horizontal para ver todos los datos) y no te convenció — se veía amontonado. Te mandé tres opciones de comparación y elegiste la de **lista de Campo / Valor**: cada dato del proyecto es una fila de dos columnas — el nombre del campo a la izquierda (Código, Categoría, Nombre, Descripción, Ticket, Responsable, Área, Estado, Avance, fechas, Archivo...) y su campo editable a la derecha — apiladas verticalmente, con las filas alternando un tono de fondo muy suave para que sea fácil seguirlas con la vista. No tiene scroll lateral. Al editar un proyecto hay dos pestañas:

- **Datos del proyecto** — la lista de Campo / Valor con todos los datos del proyecto, y al final la sección **Plan de trabajo (opcional)** (al agregar un proyecto nuevo) o **Plan de acción** (al editar uno ya existente) — ver el detalle abajo.
- **Comentarios** — la bitácora de comentarios de siempre.

Al **agregar** proyectos, cada proyecto es una tarjeta con su propia lista de Campo / Valor. El botón "Agregar otro proyecto" agrega una tarjeta más debajo; si hay más de una, cada tarjeta tiene su título ("Proyecto 1", "Proyecto 2"...) y un botón "Quitar". Dentro de cada tarjeta hay un botón **"Plan de trabajo — N tarea(s)"** que despliega, debajo de esa misma tarjeta, el plan de trabajo opcional de ese proyecto en particular (nombre de la tarea, responsable, fechas, dependencia, % de avance, estatus) — se guarda junto con su proyecto en cuanto haces clic en "Guardar". También puedes dejarlo vacío al crear el proyecto y agregar las tareas después.

Y al **editar** un proyecto ya existente, debajo de su lista de datos aparece la sección **"Plan de acción"** con el Cronograma completo de ese proyecto — la misma tabla de tareas y botones de Excel/PDF que se ven al seleccionar la fila en la pantalla de Proyectos (ver la siguiente sección), pero ahora también disponible **desde dentro del formulario de Editar**, sin tener que cerrarlo. Agregar, editar o eliminar una tarea ahí se guarda de inmediato en la base de datos — no hace falta hacer clic en "Guardar cambios" para las tareas (ese botón es solo para los datos generales del proyecto).

## Tabla de proyectos y Plan de acción

La pantalla de Proyectos tiene solo la tabla (sin vistas de Tarjetas ni Kanban). Al hacer clic en cualquier fila, justo debajo se despliega una tarjeta nueva, **"Plan de acción — [nombre del proyecto]"**. Hacer clic en la misma fila otra vez, o en el botón "Cerrar" del panel, lo oculta. Seleccionar otro proyecto cambia el panel para mostrar el plan de ese proyecto.

Esta misma tarjeta también aparece **dentro del formulario "Editar proyecto"**, al final de la pestaña "Datos del proyecto" — así puedes gestionar el plan de acción sin salir del formulario de edición. Ahí no tiene botón "Cerrar" (siempre está visible mientras edites ese proyecto).

### Plan de acción con formato tipo Excel (reemplaza la tabla anterior)

Me mandaste tu propio Excel de "Cronograma de proyectos" (tabla + panel de Resumen de avance a la derecha) y pediste que el Plan de acción de cada proyecto se viera así. El Plan de acción quedó rediseñado por completo:

- **Tabla de actividades** — Actividad, Días, Responsable, Inicio, Terminado, % Avance (con barra), Estado, Observaciones, % Plan y Desvío. Ya no se muestran las columnas EDT ni "Depende de" (esa dependencia se sigue guardando y usando internamente — por ejemplo en la carga masiva — solo que ya no ocupa una columna en pantalla).
- **Días (hábiles)** — al agregar o editar una tarea, ya no escribes la fecha de entrega directamente: escribes la **Fecha de inicio** y los **Días (hábiles)** que va a tomar, y la fecha de término se calcula sola contando solo de lunes a viernes (sin excluir festivos, porque tus proyectos son de varios países y cada uno tiene su propio calendario). El formulario te muestra la fecha calculada ("Termina") antes de guardar. Las tareas que ya tenías (creadas antes de este cambio, con fecha de inicio y de entrega pero sin "Días") lo siguen mostrando igual: los Días se calculan solos a partir de esas dos fechas.
- **Observaciones** — campo de texto libre nuevo por tarea, para anotar cualquier cosa (igual que en tu Excel).
- **% Plan y Desvío** — el "% Plan" es el avance que la tarea debería tener a la fecha de hoy, calculado a partir de su fecha de inicio y sus Días (si ya pasó su fecha de término, el plan es 100%; si todavía no empieza, es 0%). El "Desvío" es el avance real menos el % Plan — en rojo si vas atrasado, en verde si vas adelantado.
- **Resumen de avance** (panel a la derecha) — Fecha de corte (siempre hoy), Avance real ponderado por días (el promedio de avance de las tareas, pero pesando más las que duran más días), Avance planificado a la fecha (el mismo promedio ponderado pero con el % Plan de cada tarea), Desviación (real menos plan) y Avance simple (el promedio de siempre, sin ponderar — es el mismo número que ya se usaba antes para el % de avance del proyecto en la tabla de Proyectos).
- **Actividades por estado** (panel a la derecha, debajo del anterior) — cuántas tareas hay en cada estado y su porcentaje: Completada, En progreso, Atrasada (antes "Vencida") y No iniciada (antes "Pendiente"). Es solo cómo se llaman en este resumen; en el resto de la app y en la base de datos se siguen guardando igual que siempre.

Los botones **Excel** y **PDF** del Plan de acción exportan ahora las mismas columnas de la tabla nueva (incluidos % Plan, Desvío y Observaciones), más la Fecha de corte y el Avance real/planificado en el encabezado del archivo.

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

### Activar Días y Observaciones del Plan de acción tipo Excel (una sola vez en Supabase)

Para el nuevo formato tipo Excel (Días hábiles y Observaciones por tarea), agrega estas dos columnas a `proyecto_tareas` de la misma forma que las anteriores — entra a supabase.com → tu proyecto → **SQL Editor** → **New query**, pega y ejecuta:

```sql
alter table proyecto_tareas add column if not exists dias integer;
alter table proyecto_tareas add column if not exists observaciones text;
```

No borra ni afecta ninguna tarea existente. En cuanto subas el `index.html` de este paquete, ya puedes guardar Días y Observaciones en cada tarea.

## Carga masiva de planes de trabajo desde Excel

Tanto en **"Plan de trabajo (opcional)"** (al agregar un proyecto nuevo) como en **"Plan de acción"** (al editar uno existente) hay dos botones nuevos junto a "Agregar tarea":

- **Plantilla** — descarga un Excel de ejemplo (`Plantilla_plan_de_trabajo.xlsx`) con las columnas esperadas: `EDT`, `Tarea`, `Responsable`, `Inicio`, `Días (hábiles)`, `% Avance`, `Estatus`, `Observaciones`, `Depende de (EDT)`, y dos filas de ejemplo (la segunda depende de la primera) para que quede claro cómo llenarlo.
- **Carga masiva** — abre el explorador de archivos para elegir un `.xlsx`/`.xls` ya lleno; en cuanto lo eliges, todas las tareas del archivo se agregan de una sola vez al plan de trabajo.

Cómo se interpreta el archivo:

- Solo hace falta la columna **Tarea** (el nombre) — las filas sin nombre de tarea se ignoran. El resto de columnas son opcionales.
- Las fechas de **Inicio** y **Entrega/Terminado** aceptan celdas de fecha de Excel, o texto en formato `AAAA-MM-DD` o `DD/MM/AAAA`.
- Si el archivo trae una fecha de **Entrega/Terminado** directa, se usa esa fecha tal cual (y los Días se calculan solos a partir de las dos fechas, si no vinieron ya). Si en cambio trae **Días (hábiles)** pero no una fecha de entrega, la fecha de término se calcula sola en días hábiles a partir del Inicio — igual que al escribir una tarea a mano.
- **% Avance** se ajusta entre 0 y 100; si no viene o no es un número, queda en 0.
- **Estatus** acepta "Pendiente", "En proceso" o "Completada" (sin distinguir mayúsculas); si viene vacío o con otro texto (por ejemplo "Sin Iniciar" o "No iniciada"), se calcula solo a partir del % de avance.
- **Observaciones** se guarda tal cual, si la columna existe en el archivo.
- **Depende de (EDT)** es el número de la columna **EDT** de otra fila del mismo archivo — así puedes cargar de una vez una cadena de tareas ya encadenadas (por ejemplo, la tarea con EDT 2 puede depender de la EDT 1). Los nombres de columnas se reconocen sin importar mayúsculas, acentos ni espacios, así que también funcionan variantes como "Fecha de entrega" o "Depende de EDT".
- Si el archivo no tiene una columna EDT, se usa el número de fila como EDT automáticamente.
- El encabezado (la fila con los nombres de columna) puede estar en cualquier parte del archivo, no necesariamente en la primera fila — el importador busca la primera fila que tenga una columna "Tarea" y usa esa como encabezado. Así funciona igual con la Plantilla, con un archivo exportado con el botón "Excel" del Plan de acción (que trae "Proyecto" y "Código" arriba), o con tu propio cronograma en Excel.

En el **Plan de trabajo** de un proyecto nuevo, las tareas importadas quedan en memoria junto con las que agregues a mano, y se crean de verdad en la base de datos hasta que guardes el proyecto (igual que las tareas agregadas una por una). En el **Plan de acción** de un proyecto ya existente, las tareas importadas se guardan de inmediato en Supabase, igual que al agregar una tarea con el formulario normal.

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

## Renumerar el Código de los proyectos

El campo **Código** (columna "Cód." de la tabla) se sigue escribiendo a mano, como siempre, desde el formulario de cada proyecto. Pero como al eliminar proyectos van quedando huecos en la numeración (por ejemplo 5, 6, 7, 8, 9, 14, 17...), agregué un botón **"Renumerar"** junto a Excel/PDF en la pantalla de Proyectos (solo lo ven Administrador y Editor).

Al hacer clic, pide confirmación (te avisa que va a reemplazar el Código de **todos** los proyectos, no solo los que ves filtrados) y, si confirmas, le pone 1, 2, 3... a todos los proyectos según el orden en que se crearon — sin huecos. Los proyectos nuevos que agregues después siguen sin numerarse solos; cuando quieras volver a quitar los huecos, usas el botón otra vez.

No necesita ningún cambio en Supabase — usa la misma columna `codigo` que ya existe. En cuanto subas el `index.html` de este paquete, ya queda activo.

## Evaluación Financiera Proyectos

Sección nueva en el menú lateral, justo después de **Proyectos** (como se pidió). Sirve para asociar una evaluación financiera a cualquier proyecto que la necesite — no todos los proyectos tienen por qué tenerla, y cada proyecto puede tener como máximo una (se crea una vez y después se sigue editando, igual que el Plan de acción).

**Cómo se usa:** la lista empieza en blanco — solo muestra los proyectos que ya tienen una Evaluación Financiera creada, con su veredicto (semáforo de color). Para crear una nueva, usa el botón **"Nueva evaluación"** del encabezado: te pregunta primero a qué proyecto la vas a asociar (un desplegable con los proyectos que todavía no tienen evaluación) y, en cuanto lo eliges, se abre su panel debajo para que la llenes. Al hacer clic en cualquier proyecto que ya aparece en la lista se abre su panel de Evaluación Financiera abajo — con la misma apariencia de tabla, colores y estructura por secciones que tu Excel original (barras de color, celda amarilla para lo que se escribe a mano y celda gris para lo que se calcula solo), con:

- **Identificación del proyecto** — Nombre, Responsable y País se traen solos del proyecto (no se repiten); solo se escriben el Problema que resuelve y el Objetivo principal.
- **Tasas de crecimiento anual** — Ingresos, Gastos y Ahorros operativos, Año 1→2 y Año 2→3.
- **Supuestos base (Año 1)** — Ventas, Ahorros operativos, % de Costo de Ventas (COGS), Gastos operativos, Licencias/software/cloud, Gastos de desarrollo, Otros gastos, Inversión inicial (CapEx, solo Año 1) y la Tasa de descuento / WACC. Estos son los únicos datos que se escriben a mano — el resto se calcula solo, en vivo, mientras vas llenando el formulario.
- **Proyección a 3 años** (calculada) — Ingresos, Costo de Ventas, Margen bruto, Gastos operativos/licencias/desarrollo/otros, Ahorros operativos, Beneficio Operativo (EBITDA) y Flujo de caja neto/acumulado, año por año y el total de los 3 años.
- **Métricas financieras clave** (calculadas) — ROI, VPN, TIR, Payback, Margen bruto promedio y Relación Beneficio/Costo (B/C), cada una con su semáforo (✅/🟡/🔴) según qué tan buena sea.
- **Veredicto** — "GO" si el ROI y el VPN son positivos, "REVISAR" si no, o "Completar todos los datos" si todavía falta llenar el formulario.

Esto sigue el formato de tu archivo *"Formato BC Evaluación Financiera Proyectos.xlsx"* (hoja "Evaluación Financiera" — la hoja "Caso de negocio" del mismo archivo no se incluyó, quedó como un ejemplo aparte, no como parte del formato general). Una diferencia a propósito: el % de Costo de Ventas (COGS) se aplica directo sobre las Ventas (Costo = Ventas × %), tal como dice su propia nota de ayuda ("Retail/Farma típico: 55%-75%"); en el Excel original ese % venía jalado con una fórmula de la otra hoja (el caso de negocio de un proyecto específico) que lo dejaba invertido, y esa fórmula no aplicaba de forma general para cualquier proyecto.

Cada evaluación tiene sus propios botones **Guardar**, **Excel** y **PDF** (el Excel/PDF exportan la proyección completa y las métricas, igual que se ve en pantalla).

### Activar Evaluación Financiera Proyectos (una sola vez en Supabase)

1. Entra a supabase.com → tu proyecto → **SQL Editor** → **New query**.
2. Pega y ejecuta (botón **Run**) exactamente esto (también está incluido en `setup_completo_supabase.sql` de este paquete):

```sql
create table if not exists proyecto_evaluaciones_financieras (
  id bigint generated by default as identity primary key,
  "proyectoId" bigint not null,
  problema text,
  objetivo text,
  tasa_ingresos_a2 numeric,
  tasa_ingresos_a3 numeric,
  tasa_gastos_a2 numeric,
  tasa_gastos_a3 numeric,
  tasa_ahorros_a2 numeric,
  tasa_ahorros_a3 numeric,
  ventas_ano1 numeric,
  ahorros_ano1 numeric,
  pct_cogs numeric,
  gastos_operativos_ano1 numeric,
  licencias_ano1 numeric,
  gastos_desarrollo_ano1 numeric,
  otros_gastos_ano1 numeric,
  inversion_inicial numeric,
  wacc numeric,
  "createdAt" timestamptz not null default now(),
  unique ("proyectoId")
);
alter table proyecto_evaluaciones_financieras disable row level security;
grant select, insert, update, delete on proyecto_evaluaciones_financieras to anon, authenticated;
```

3. Listo. En cuanto subas el `index.html` de este paquete, la sección "Evaluación Financiera Proyectos" ya puede crear, guardar y editar evaluaciones. Si todavía no corres este SQL, la sección se ve vacía (sin marcar error) hasta que lo actives.

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

**Plan de acción también al editar (26 de agosto de 2026):** me avisaste que al editar un proyecto ya existente no aparecía por ningún lado la forma de tocar su plan de trabajo — solo se podía desde la tabla, seleccionando la fila, y para eso había que cerrar el formulario primero. Agregué la sección "Plan de acción" al final de la pestaña "Datos del proyecto" del formulario de Editar, con la misma tabla de tareas y botones Excel/PDF que ya tenías en el panel de la tabla (reutilicé el mismo componente, así que cualquier corrección futura aplica en los dos lugares por igual). Probé, con capturas de pantalla: abrir "Editar" en un proyecto con tareas existentes y confirmar que aparecen de inmediato, sin tener que cerrar el formulario; agregar una tarea nueva desde ahí adentro y verla aparecer al instante en la tabla; cerrar el formulario y volver a abrir "Editar" en el mismo proyecto para confirmar que la tarea se guardó de verdad en la base de datos (no se perdió al cerrar, porque se guarda al momento y no depende de hacer clic en "Guardar cambios"). Todo sin errores de consola.

**Llenado en tabla y Gantt/ruta crítica quitados (26 de agosto de 2026):** me dijiste que el formulario de "Agregar/Editar proyecto" no coincidía con "como tabla", tal como me habías mandado el diseño (tu Excel de proyectos, con una fila por proyecto y una columna por dato). Cambié el formulario de secciones apiladas a una tabla de verdad: cada proyecto es una fila y cada dato es una columna editable en su celda (País, Categoría, Prioridad, Código, Nombre, Descripción, Ticket, Responsable, Área, Estado, Avance, Fecha de solicitud, Fecha de inicio, Vencimiento, Archivo), con scroll horizontal para que quepan todas. Al agregar varios proyectos a la vez, el botón "Agregar otro proyecto" ahora agrega una fila más a esa misma tabla (ya no abre una pestaña nueva), y cada fila tiene su propio botón "N tarea(s)" para desplegar su Plan de trabajo debajo. Casi al mismo tiempo me pediste también, con una captura de un proyecto de una sola tarea, quitar el Gantt y el resaltado de "ruta crítica" del Plan de acción — tenía sentido, porque con una sola tarea aislada no debería marcarse nada como "ruta crítica" y confundía. Quité el gráfico Gantt y todo el cálculo de ruta crítica (tanto del panel de la tabla como del que ahora vive dentro de Editar, ya que comparten el mismo componente); el Plan de acción quedó como una tabla pura de tareas, sin gráfico ni iconos de alerta. Probé, con capturas de pantalla: llenar los campos de un proyecto directamente en las celdas de la tabla; agregar una segunda fila con "Agregar otro proyecto" y llenarla también; abrir el Plan de trabajo de la primera fila, agregar una tarea, y confirmar que solo queda asociada a esa fila (no a la otra); guardar los dos proyectos y confirmar que ambos se crean, con la tarea guardada en el proyecto correcto; y abrir "Editar" en un proyecto ya existente para confirmar que también se ve como tabla de una fila, con su Plan de acción abajo mostrando la tabla de tareas sin ningún rastro de Gantt ni de "Ruta crítica". Todo sin errores de consola (corregí en el camino una advertencia de React por una fila de tabla sin identificador único, que no afectaba lo que se veía pero es buena práctica dejar limpia).

**Tabla más clara y con más espacio (26 de agosto de 2026):** me dijiste que la tabla de datos se veía "amontonada" y pediste algo más claro y limpio. Le di más aire a toda la tabla: encabezados y celdas con más relleno (padding), letra un poco más grande, columnas más anchas (sobre todo Nombre del proyecto y Descripción, que ahora tienen más espacio para escribir), el campo de Avance más ancho para que no se corte, y agregué una franja de color muy suave que alterna entre filas para que sea más fácil seguir una fila con la vista cuando hay varios proyectos a la vez. Los mismos cambios de espaciado aplican también a la tabla de Editar (que es la misma, con una sola fila) y a su Plan de acción de abajo. Probé, con capturas de pantalla, que se vea la tabla con un proyecto, con dos proyectos (para confirmar el franjeado de filas), y la vista de Editar con el Plan de acción debajo — todo sin errores de consola.

**Lista de Campo / Valor, en vez de la tabla con scroll lateral (26 de agosto de 2026):** ya con más espacio, la tabla seguía sin convencerte — me dijiste que buscáramos otra forma de mostrar los datos del proyecto. Antes de adivinar de nuevo, te mandé una comparación con tres opciones (cuadrícula sin scroll, el formulario original por secciones, y una lista de Campo/Valor) usando los datos reales de tu captura ("Proyecto Docto SV (ES)") para que las vieras lado a lado. Elegiste la lista de Campo / Valor, así que reemplacé la tabla de columnas por esto: cada dato es una fila de dos columnas (el nombre del campo a la izquierda, su campo editable a la derecha), apiladas verticalmente, con las filas alternando un tono de fondo suave. Sin scroll lateral en ningún caso. Al agregar varios proyectos, cada uno es ahora una tarjeta separada con su propia lista y su botón "Quitar" (si hay más de una), y el botón "Plan de trabajo — N tarea(s)" quedó dentro de la tarjeta de cada proyecto, no aparte. Probé, con capturas de pantalla: agregar un proyecto y llenar sus campos en la lista; agregar una segunda tarjeta y confirmar que cada una tiene su propio título y botón de quitar; abrir el Plan de trabajo de la primera tarjeta, agregarle una tarea, y confirmar que queda asociada solo a esa tarjeta; guardar y confirmar que el proyecto y su tarea se crean bien; y abrir "Editar" en un proyecto existente para confirmar que también se ve como la lista de Campo/Valor, con el Plan de acción completo debajo. Todo sin errores de consola.

**Carga masiva de planes de trabajo desde Excel (27 de agosto de 2026):** pediste poder subir los planes de trabajo con carga masiva desde Excel. Agregué los botones "Plantilla" y "Carga masiva" tanto en el "Plan de trabajo (opcional)" al agregar un proyecto como en el "Plan de acción" al editar uno existente (ver la sección de arriba). Probé, con un navegador automatizado y capturas de pantalla: descargar y abrir la plantilla para confirmar sus columnas; en el Plan de trabajo de un proyecto nuevo, subir un Excel con dos tareas (la segunda dependiendo de la primera) y confirmar que ambas aparecen de inmediato en la tabla de previsualización, con el botón actualizado a "2 tareas"; guardar el proyecto y confirmar que se crea junto con sus dos tareas; y, en el Plan de acción de un proyecto ya existente (con tareas previas), subir el mismo archivo y confirmar que las dos tareas nuevas se agregan a las que ya había, guardadas de verdad en la base de datos, con la dependencia bien resuelta (la segunda tarea importada quedó apuntando al EDT correcto de la primera, ya como tareas reales del proyecto). Todo sin errores de consola.

**Corrección reportada en producción (27 de agosto de 2026):** intentaste importar tu plan de trabajo real (un cronograma de ~90 tareas, con el mismo formato que descarga el botón "Excel" del Plan de acción) y salió el aviso "No se encontraron tareas en el archivo". La causa: ese formato trae dos filas de título arriba de la tabla ("Proyecto" y "Código") y una fila en blanco antes del encabezado real, y el importador solo sabía leer el encabezado si estaba en la primera fila del archivo — como no lo estaba, no reconocía ninguna columna. Corregí el importador para que **busque el encabezado en cualquier fila** (la primera que tenga una columna reconocible como "Tarea"), en vez de asumir que siempre está en la fila 1 — así funciona tanto con la Plantilla como con un archivo exportado desde la propia app, o con cualquier otro formato de tabla que tengas. También se reconocen ahora estatus como "Sin Iniciar" (se traduce a "Pendiente", ya que la app no maneja ese estatus como tal) sin marcar error. Probé, con un archivo que reproduce exactamente ese formato (título + fila en blanco + encabezado + tareas, incluyendo tareas "de grupo" sin fechas ni responsable): que ya no salga el aviso de "no se encontraron tareas"; que las tareas se importen con su nombre, fechas y estatus correctos; y que el resto de la carga masiva (la del formato de la Plantilla, sin filas de título) siga funcionando exactamente igual que antes. Todo sin errores de consola.

**Renumerar el Código de los proyectos (27 de agosto de 2026):** me mandaste una captura donde el "Cód." de la tabla salía con huecos (5, 6, 7, 8, 9, 14, 17...) por los proyectos que habías eliminado, y pediste que el número se autogenerara de forma correlativa. Como el campo "Código" también se usa como texto libre en algunos proyectos (no siempre es un número), en vez de automatizarlo por completo agregué un botón **"Renumerar"** junto a Excel/PDF en la pantalla de Proyectos, que — con tu confirmación — le pone 1, 2, 3... a todos los proyectos según su orden de creación, de una sola vez, cuantas veces quieras usarlo. Probé, con un navegador automatizado: que el botón aparezca junto a Excel y PDF (solo para Administrador/Editor); que al hacer clic pida confirmación explicando que va a afectar a todos los proyectos; y que, tras confirmar, la columna "Cód." de la tabla quede en 1, 2, 3... en el mismo orden en que ya se mostraban los proyectos, sin huecos. Todo sin errores de consola.

**Plan de acción con formato tipo Excel (1 de septiembre de 2026):** me mandaste tu Excel de "Cronograma de proyectos" (tabla + panel de Resumen de avance) y pediste que el Plan de acción de cada proyecto se viera así. Antes de tocar código aclaramos tres cosas: reemplazar la tabla actual (no dejarla como vista alterna), que la Fecha de corte del resumen fuera siempre la de hoy (no un campo editable), y que "Días" pasara a ser un dato que tú escribes (en días hábiles, lunes a viernes, sin festivos porque los proyectos son de varios países) en vez de calcularse de las dos fechas. Con eso implementé el rediseño completo: la tabla de tareas cambió a Actividad/Días/Responsable/Inicio/Terminado/% Avance/Estado/Observaciones/% Plan/Desvío (ya sin las columnas EDT y "Depende de", aunque esa dependencia se sigue usando internamente); el formulario de tarea cambió "Fecha de entrega" por "Días (hábiles)" con la fecha de término calculada sola y mostrada como vista previa antes de guardar; agregué el campo "Observaciones" por tarea; y agregué el panel de la derecha con "Resumen de avance" (avance real ponderado por días, avance planificado a la fecha, desviación y avance simple) y "Actividades por estado" (Completada/En progreso/Atrasada/No iniciada con cantidad y %). Las exportaciones a Excel y PDF del Plan de acción se actualizaron con las mismas columnas nuevas. Probé, con un navegador automatizado y capturas de pantalla: que el Plan de acción de un proyecto con tareas existentes (sin el campo "Días" guardado) muestre los Días calculados solos a partir de sus fechas, y que el resumen calcule bien el avance ponderado, el planificado y la desviación (verificado a mano con los números de cada tarea); que agregar una tarea nueva con fecha de inicio un martes y 5 días hábiles calcule "Termina" el lunes siguiente (saltándose el fin de semana), y que se guarde con esa fecha, sus Días y su Observación; que el conteo de "Actividades por estado" sea correcto; y que el Plan de trabajo de un proyecto nuevo (antes de guardarlo) también muestre la columna Días. Todo sin errores de consola.

**Evaluación Financiera Proyectos (1 de septiembre de 2026):** pediste una nueva área "Evaluación Financiera Proyectos" dentro de Proyectos, amarrada al proyecto que la necesite. Aclaramos con preguntas antes de programar (que la app calculara todo automático como el Excel, que viviera como sección nueva del menú lateral justo después de Proyectos, que fuera una evaluación por proyecto editable, y que la hoja "Caso de negocio" de tu archivo no se incluyera) y después me mandaste `Formato BC Evaluación Financiera Proyectos.xlsx` con el detalle de qué debía contener. Construí la sección nueva completa: formulario de Identificación/Tasas de crecimiento/Supuestos base, y cálculo en vivo (sin guardar primero) de la Proyección a 3 años, las métricas ROI/VPN/TIR/Payback/Margen bruto promedio/B-C con semáforo, y el Veredicto — replicando las fórmulas de tu Excel (incluida la TIR, calculada por bisección ya que no hay una función nativa de IRR en el navegador). Probé, con un navegador automatizado y capturas de pantalla: que la lista de proyectos muestre "Sin crear" para los que no tienen evaluación; que abrir el panel de un proyecto traiga solo Nombre/Responsable/País (sin duplicar datos que ya tiene el proyecto); que llenar el formulario calcule en vivo la proyección y las métricas, verificado a mano contra los números esperados (Ventas Año 2 con la tasa de crecimiento aplicada, Costo de Ventas y Margen bruto con el % de COGS, etc.); que Guardar persista los datos (releídos después de cerrar y volver a abrir el panel) y actualice el badge/veredicto de la fila en la lista; y que las exportaciones a Excel y PDF no fallen. También probé casos límite a propósito — un proyecto sin Inversión inicial (para que ROI/B-C avisen "Sin datos" y Payback "Sin inversión" en vez de tronar), y un proyecto con Beneficio Operativo negativo en los 3 años (para confirmar que TIR cae a "N/D", VPN y ROI se muestran negativos sin errores, y Payback avisa "No se recupera en 3 años" en vez de decir por error "Sin inversión") — sin errores de consola en ningún caso.

**Lista en blanco + "Nueva evaluación" con selector de proyecto (1 de septiembre de 2026):** con tus 25 proyectos reales cargados, la lista salía llena de entradas "Sin crear" — pediste que empezara en blanco y que, al ir creando cada evaluación, se elija ahí mismo a qué proyecto amarrarla. Cambié la lista para que solo muestre los proyectos que ya tienen una evaluación creada, y agregué el botón "Nueva evaluación" que abre un desplegable con los proyectos todavía sin evaluación (los que ya tienen una dejan de aparecer ahí, para no crear una segunda por error). Probé, con un navegador automatizado: que la lista arranque vacía con el mensaje de "Todavía no has creado ninguna Evaluación Financiera"; que el botón "Nueva evaluación" abra el selector; que elegir un proyecto ahí abra su panel (con la lista todavía en blanco, porque ese proyecto aún no tiene nada guardado); que llenar y Guardar haga que el proyecto aparezca de inmediato en la tabla (ya con su veredicto) con el panel abierto justo debajo de su fila; y que, al volver a abrir "Nueva evaluación", ese proyecto ya no salga en el selector (solo los que faltan). Todo sin errores de consola.

**Panel igual a tu Excel — misma estructura y colores (1 de septiembre de 2026):** dijiste que el panel de Evaluación Financiera lo necesitabas "exactamente igual a Excel, no como lo diseñé — con la misma estructura y colores", en vez de la tarjeta con formulario en cuadrícula que tenía antes. Volví a abrir `Formato BC Evaluación Financiera Proyectos.xlsx` y esta vez extraje con detalle el color de relleno y de letra de cada celda, el negrita/tamaño de cada texto y el formato de cada número (con la librería `openpyxl`), para reconstruir el panel como una sola tabla continua tipo hoja de cálculo en vez de tarjetas separadas: la misma barra de título azul marino de arriba, la barra con el nombre del proyecto debajo, y cada sección con su propia barra de color igual que en tu archivo — 📌 Identificación del proyecto, ⚙️ Tasas de crecimiento anual (verde azulado), 💼 Supuestos base con sus tres bandas internas de Ingresos/Gastos y costos/Inversión inicial (verde, rojo y naranja), 📊 Estado de Resultados y 💰 Flujo de Caja (con la columna de Total 3 años resaltada en dorado, igual que la tuya), 🏆 Métricas financieras clave, y el Veredicto del CFO como una franja de color al final. Las celdas que se escriben a mano quedaron en amarillo (igual que tu convención de "celda editable"), y las que se calculan solas en gris — incluyendo Nombre/Responsable/País, que ahora se ven como una celda amarilla pero deshabilitada, ya que se traen solas del proyecto y no se escriben ahí. También agregué la leyenda de colores arriba del panel para que quede claro cuál es cuál. Probé, con un navegador automatizado y capturas de pantalla, que las barras de cada sección aparezcan con su texto correcto; que Nombre/Responsable/País sigan trayéndose solos (no editables); que llenar los Supuestos base calcule en vivo el Estado de Resultados, el Flujo de Caja y las Métricas con los números correctos (verificado a mano); que el Veredicto se muestre al final con su color; y que Guardar siga funcionando igual que antes (el proyecto aparece en la tabla con el panel nuevo abierto debajo de su fila, y los datos se mantienen al recargar). Todo sin errores de consola.

**Corrección: la tabla no quedaba alineada y le faltaban columnas (1 de septiembre de 2026):** me mandaste una captura donde la sección de "Tasas de crecimiento anual" salía descuadrada (el "5%" que habías escrito aparecía debajo de la columna equivocada, y la nota de "¿para qué sirve?" quedaba fuera de su columna) y me dijiste que además le faltaban partes al resto de la tabla para que quedara igual y completa que el Excel. La causa del descuadre: cada sección de la tabla estaba armando su propio número de columnas "a ojo" (algunas con 4, otras con 5), y como todas comparten la misma tabla HTML, el navegador las peleaba entre sí y todo se recorría. Lo corregí de raíz: ahora las 5 columnas reales del Excel (B a F de su hoja) se definen una sola vez al principio de la tabla y todas las secciones, sin excepción, las respetan — así el encabezado de cada bloque queda siempre alineado con sus propios datos. Aproveché para volver a revisar el Excel completo (se me había quedado corta la primera revisión, tenía 96 filas y yo solo había mirado hasta la 70) y completé varias piezas que le faltaban a la sección: la columna "Referencia" de las Tasas de crecimiento (con los rangos típicos, ej. "Retail/Farma: 8-20%"); que los Supuestos base ahora muestren la proyección a 3 años línea por línea (Ventas, Ahorros, cada gasto) y no solo el valor del Año 1, igual que tu Excel; la fila de "% Costo de Ventas (COGS)" con su valor repetido visualmente en las 3 columnas de año, tal como se ve en tu archivo; la fila de la Tasa de descuento/WACC (estaba mal ubicada, la moví a la sección de Métricas, que es donde está en tu Excel); las columnas "¿Qué significa?" y "Referencia/Meta" en la tabla de Métricas financieras (antes solo tenía Métrica/Resultado/Semáforo); y agregué la sección "📈 Gráficos financieros" al final, con una comparación simple de Ingresos/Gastos/EBITDA por año y el Flujo de caja acumulado. Probé, con un navegador automatizado y capturas de pantalla a página completa: que cada columna (Concepto/Año 1/Año 2/Año 3/Total, o las que correspondan según la sección) quede exactamente debajo de su encabezado en las 12 secciones de la tabla; que escribir una tasa de crecimiento distinta de cero se refleje correctamente en el Año 2 y Año 3 tanto de los Supuestos base como del Estado de Resultados (verificado a mano contra el número esperado); y que Guardar, Excel y PDF sigan funcionando sin errores. Todo sin errores de consola.
