# Listly

[English](README.md) · [Español](README.es.md) · [Català](README.ca.md) · [Euskara](README.eu.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Italiano](README.it.md)

**Listly** é un xestor de listas local-first para o día a día. Crea tantas listas como necesites — compra, tarefas, equipaxe, despensa — organízaas en coleccións e vai marcando os elementos a medida que avanzas. As listas poden ser listas de verificación simples ou listas numéricas que rexistran un importe e unha cantidade por elemento cun total acumulado.

Todo funciona **no dispositivo**: os teus datos viven nunha base de datos SQLite local (sql.js + IndexedDB na web), nada sae do teu teléfono e non necesitas conta nin subscrición.

| | |
|---|---|
| **Plataformas** | iOS, Android e Web |
| **Versión** | 1.0.0 |
| **Idiomas** | Inglés, Español, Catalán, Galego, Éuscaro, Francés, Alemán, Portugués e Italiano |
| **Datos** | 100 % locais (SQLite en nativo, sql.js + IndexedDB na web) |
| **Temas** | Escuro, Claro e Automático (segue o sistema) |

## Funcións

- **Listas** — crea tantas listas como queiras, cada unha coa súa icona e cor, e escolle entre dous tipos de lista: **Estándar** (de verificación) ou **Numérica**, cun importe e unha cantidade por elemento.
- **Elementos** — engade elementos rapidamente desde a barra inferior, márcaos e abre un elemento para engadir unha **nota** ou unha **foto** (galería en todas as plataformas, cámara en iOS e Android).
- **Listas numéricas** — asigna a cada elemento un importe e unha cantidade; a cabeceira da lista mostra unha **barra de progreso por valor** xunto co **Total** e o subtotal **Feito**, e cada elemento mostra o seu total de liña (importe × cantidade). Tocar o importe dun elemento cando está baleiro ou a `0.00` baleira o campo para poder escribir un prezo directamente.
- **Coleccións** — agrupa listas en coleccións (cartafoles) como *Casa* ou *Traballo*, e arrastra unha lista sobre unha colección para movela dentro.
- **Arrastrar e soltar** — reordena listas e elementos premendo longo e arrastrando; gárdase mediante unha columna `position`.
- **Listas bloqueadas** — protexe unha lista cunha contrasinal; os seus elementos cífranse **no dispositivo** con AES-256-GCM. Se esquecas a contrasinal, non hai recuperación.
- **Duplicar, copiar e fusionar** — duplica unha lista enteira, copia unha lista con ou sen as notas, copia os elementos seleccionados a outra lista ou fusiona elementos noutra lista. Ao copiar unha lista numérica tamén se inclúe o importe × cantidade = total de cada elemento e as sumas Total/Feito.
- **Ordenación** — ordena unha lista manualmente, por nome ou polo momento en que se engadiu cada elemento, de forma ascendente ou descendente.
- **Modo selección** — entra en modo selección desde a cabeceira para seleccionar varios elementos e eliminalos (ou seleccionar varias listas á vez) dunha soa vez.
- **Busca** — filtra listas e elementos desde a busca da cabeceira en Inicio, Listas e dentro dunha lista.
- **Axustes** — tema, tamaño do texto, idioma, deseños por pantalla (grella ou filas) e campos opcionais por tipo de lista (notas e fotos na vista do elemento e na pantalla de edición).
- **Copia de seguridade** — exporta toda a base de datos como un ficheiro JSON e impórtaa de novo cando queiras, con accións protexidas de borrado total e restablecemento de fábrica.

## Capturas de pantalla

![Pantalla de inicio](images/screenshots/01-home-empty.png)<br>*Pantalla de inicio antes de que exista ningunha colección ou lista.*<br><br>
![Inicio con datos](images/screenshots/02-home.png)<br>*Inicio cunha colección e listas soltas, incluída unha lista bloqueada.*<br><br>
![Menú lateral](images/screenshots/03-hamburger.png)<br>*Menú lateral con Inicio, Coleccións, Listas e Axustes — e a versión da app abaixo.*<br><br>
![Crear lista](images/screenshots/04-create-list.png)<br>*Crear unha lista: nome, tipo (Estándar ou Numérica), icona e cor.*<br><br>
![Detalle de lista](images/screenshots/05-list-detail.png)<br>*Unha lista estándar con elementos marcados, unha nota, o control de orde e accións por lotes.*<br><br>
![Lista numérica](images/screenshots/06-numeric-list-v2.png)<br>*Unha lista numérica cunha barra de progreso por valor, Total e Feito, totais de liña e a fila de importe/cantidade.*<br><br>
![Engadir elemento ampliado](images/screenshots/07-add-item-expanded.png)<br>*A barra de engadir ampliada para adxuntar unha nota e fotos ao novo elemento.*<br><br>
![Editar elemento](images/screenshots/08-item-edit.png)<br>*Editar un elemento: nome, nota e fotos.*<br><br>
![Coleccións](images/screenshots/09b-collections.png)<br>*A pantalla de Coleccións.*<br><br>
![Listas](images/screenshots/09-lists.png)<br>*A pantalla de Listas, coa pertenza a coleccións e o progreso por lista.*<br><br>
![Detalle de colección](images/screenshots/10-collection-detail.png)<br>*Unha colección coas súas listas membro.*<br><br>
![Bloquear lista](images/screenshots/12-lock-list.png)<br>*Bloquear unha lista cunha contrasinal.*<br><br>
![Lista bloqueada](images/screenshots/12b-locked-list.png)<br>*Unha lista bloqueada, agardando a contrasinal.*<br><br>
![Modo selección](images/screenshots/13-select-mode.png)<br>*Modo selección coa barra de accións inferior.*<br><br>
![Axustes](images/screenshots/14-settings.png)<br>*Axustes: Aparencia, Rexional, Personalización e Datos.*<br><br>
![Axustes de aparencia](images/screenshots/15-settings-appearance.png)<br>*Aparencia: tema e tamaño do texto.*<br><br>
![Selector de idioma](images/screenshots/16b-settings-language.png)<br>*O selector de idioma cos nove idiomas e as súas bandeiras.*<br><br>
![Axustes rexionais](images/screenshots/16-settings-regional.png)<br>*Axustes rexionais: idioma.*<br><br>
![Axustes de personalización](images/screenshots/17-settings-personalization.png)<br>*Personalización: deseños por pantalla e campos opcionais por tipo de lista.*<br><br>
![Axustes de datos](images/screenshots/18-settings-data.png)<br>*Datos: exportar/importar e as accións protexidas de borrado e restablecemento.*<br><br>

## Tecnoloxías

| Capa | Tecnoloxía |
|---|---|
| Framework | React Native con Expo (SDK 57) |
| Linguaxe | TypeScript |
| Navegación | React Navigation (Stack + Drawer) |
| Iconas | @expo/vector-icons (Ionicons) |
| Arrastrar e soltar | react-native-sortables |
| Selector de cor | reanimated-color-picker |
| Cifrado | quick-crypto (AES-256-GCM para as listas bloqueadas) |
| Persistencia | SQLite (expo-sqlite) en nativo, sql.js (WASM) + IndexedDB na web |
| ORM | Drizzle ORM (query builder sobre un `DatabaseHandle` compartido) |
| Validación | Esquemas Zod como única fonte de verdade para as filas gardadas |
| Web | react-native-web |
| Estado | Context API (AppContext + ConfigContext) |
| i18n | Sistema propio (en, es, ca, gl, eu, fr, de, pt, it) |

## Desenvolvemento

Esta sección é para colaboradores e para calquera que queira executar, facer un fork ou ampliar a app.

### Requisitos

- Node.js 20+ (recoméndase Node 24)
- npm
- Un emulador de Android opcional (o cartafol `android/` xérao CNG — ver abaixo)

### A primeira vez tras clonar

```bash
cd ListlyApp
npm install
npx expo start
```

Isto arranca Metro Bundler. Despois:

| Para velo en… | Fai isto |
|---|---|
| **Navegador** | Abre http://localhost:8081 ou executa `npx expo start --web` |
| **Android (emulador)** | Executa `npx expo run:android` |
| **iOS (simulador)** | Executa `npx expo run:ios` (só macOS) |

> Nota: as listas bloqueadas e a folla de compartir dependen de módulos nativos, así que usa unha compilación de desenvolvemento ou de release en lugar de Expo Go.

### Comandos

| Comando | Descripción |
|---|---|
| `npm start` | Arranca Expo en modo desenvolvemento |
| `npm run web` | Arranca e abre no navegador |
| `npm run android` | Arranca no emulador de Android |
| `npm run ios` | Arranca no simulador de iOS (só macOS) |
| `npm run typecheck` | Comprobación de TypeScript (`tsc --noEmit`) |
| `npm run lint` | ESLint mediante `expo lint` |
| `npm test` | Executa a suite de Vitest |
| `npm run test:watch` | Executa Vitest en modo watch |
| `npm run test:all` | typecheck + lint + tests (a porta local completa) |

### Probas

- **Unitarias / de integración** — Vitest. A suite cobre os repositorios da base de datos nos dous backends de SQLite (nativo + sql.js), os ciclos de copia de seguridade, o cifrado e compoñentes renderizados con `@testing-library/react-native`.
- **Verificación web** — os criterios de aceptación de cada función verifícanse nun navegador real a 375px con Playwright.
- O pipeline de CI executa a porta completa `npm run test:all` en cada push e pull request a `develop` e `main`.

> **Porta local:** un cambio só está rematado cando `npm run test:all` pasa.

### Estrutura do proxecto

```
ListlyApp/
  src/
    components/    — compoñentes de UI reutilizables
    constants/     — temas, tipos, cores, iconas
    context/       — AppContext, ConfigContext (estado global)
    database/      — motores SQLite/sql.js, repositorios, migracións, esquema Drizzle
    hooks/         — hooks propios
    i18n/          — traducións (en, es, ca, gl, eu, fr, de, pt, it)
    navigation/    — AppNavigator (Drawer + Stack)
    screens/       — compoñentes de pantalla (PascalCase)
    utils/         — formateadores, plataforma, idioma
```

### Base de datos

- Unha única interface de motor (`DatabaseHandle`) en todas as plataformas: expo-sqlite en nativo, sql.js (WASM) con persistencia en IndexedDB na web.
- O esquema créase desde un `createSchema` canónico e versiónase con `PRAGMA user_version`; as migracións execútanse unha vez, dentro dunha transacción.
- Os repositorios escríbense co query builder de Drizzle sobre o handle compartido; as filas gardadas valídanse con esquemas Zod.
- Na web os bytes exportados de SQLite persisten en IndexedDB, así que os mesmos datos sobreviven ás recargas.

### Xerar un APK / AAB de Android (EAS Build)

**Listly** usa EAS Build, que xestiona a clave de sinatura de Android para que as versións consecutivas compartan unha mesma sinatura e se actualicen no sitio. Require unha conta de Expo e a CLI de EAS:

```bash
npm install -g eas-cli
eas login
cd ListlyApp
```

| Perfil | Comando | Resultado |
|---|---|---|
| Development | `eas build --profile development` | build de dev-client (interno) |
| Preview | `eas build --platform android --profile preview` | APK instalable (interno) |
| Production | `eas build --platform android --profile production --no-wait` | AAB publicable (tenda) |

O perfil `production` de `eas.json` usa `"distribution": "store"` e `"buildType": "app-bundle"`, producindo un AAB para enviar á tenda. `cli.appVersionSource` é `"local"`, así que os metadatos de versión len directamente de `app.json` — **sobe `android.versionCode` (enteiro, estritamente crecente) e `ios.buildNumber` en cada versión**. EAS xera e garda a clave de sinatura de release no primeiro build de produción; fai unha copia con `eas credentials` e non a subas nunca ao repositorio (as claves están no .gitignore).

Para unha proba local rápida podes seguir compilando un APK asinado con debug desde o cartafol nativo xerado (usa unha clave de sinatura distinta, de debug — non para distribuír):

```bash
cd ListlyApp
npx expo prebuild --platform android   # rexera o proxecto nativo tras cambios de assets/config
cd android
./gradlew assembleRelease   # APK → app/build/outputs/apk/release/app-release.apk
```

### Metodoloxía

Este proxecto usa **Specification-Driven Development (SDD).** As especificacións viven en `spec/` e son a única fonte de verdade — o que hai que construir defínese primeiro en documentos `1-spec.md`, despois impleméntase e despois verifícase contra os criterios de aceptación. A folla de ruta séguense en `spec/constitution/3-roadmap.md`.

## Licenza

Listly está baixo a licenza MIT — consulta o ficheiro [LICENSE](LICENSE).
