# Listly

[English](README.md) · [Español](README.es.md) · [Galego](README.gl.md) · [Euskara](README.eu.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Italiano](README.it.md)

**Listly** és un gestor de llistes local-first per al dia a dia. Crea tantes llistes com vulguis — compra, tasques, equipatge, rebost — organitza-les en col·leccions i ves marcant els elements a mesura que avances. Les llistes poden ser llistes de verificació simples o llistes numèriques que registren un import i una quantitat per element amb un total acumulat.

Tot funciona **al dispositiu**: les teves dades viuen en una base de dades SQLite local (sql.js + IndexedDB a la web), res no surt del teu telèfon i no cal compte ni subscripció.

| | |
|---|---|
| **Plataformes** | iOS, Android i Web |
| **Versió** | 1.0.0 |
| **Idiomes** | Anglès, Espanyol, Català, Gallec, Basc, Francès, Alemany, Portuguès i Italià |
| **Dades** | 100 % locals (SQLite en natiu, sql.js + IndexedDB a la web) |
| **Temes** | Fosc, Clar i Automàtic (segueix el sistema) |

## Funcions

- **Llistes** — crea tantes llistes com vulguis, cadascuna amb la seva icona i color, i tria entre dos tipus de llista: **Estàndard** (de verificació) o **Numèrica**, amb un import i una quantitat per element.
- **Elements** — afegeix elements ràpidament des de la barra inferior, marca'ls i obre un element per afegir-hi una **nota** o una **foto** (galeria a totes les plataformes, càmera a iOS i Android).
- **Llistes numèriques** — assigna a cada element un import i una quantitat; la capçalera de la llista mostra una **barra de progrés per valor** juntament amb el **Total** i el subtotal **Fet**, i cada element mostra el seu total de línia (import × quantitat). Tocar l'import d'un element quan és buit o a `0.00` buida el camp per poder escriure un preu directament.
- **Col·leccions** — agrupa llistes en col·leccions (carpetes) com *Casa* o *Feina*, i arrossega una llista sobre una col·lecció per moure-la-hi.
- **Arrossegar i deixar anar** — reordena llistes i elements prement llargament i arrossegant; es desa mitjançant una columna `position`.
- **Llistes blocades** — protegeix una llista amb una contrasenya; els seus elements s'encripten **al dispositiu** amb AES-256-GCM. Si oblides la contrasenya, no hi ha recuperació.
- **Duplicar, copiar i fusionar** — duplica una llista sencera, copia una llista amb o sense les notes, copia els elements seleccionats a una altra llista o fusiona elements en una altra llista. En copiar una llista numèrica també s'inclou l'import × quantitat = total de cada element i les sumes Total/Fet.
- **Ordenació** — ordena una llista manualment, per nom o pel moment en què es va afegir cada element, de manera ascendent o descendent.
- **Mode selecció** — entra en mode selecció des de la capçalera per seleccionar diversos elements i eliminar-los (o seleccionar diverses llistes alhora) d'una sola vegada.
- **Cerca** — filtra llistes i elements des de la cerca de la capçalera a Inici, Llistes i dins d'una llista.
- **Ajustos** — tema, mida del text, idioma, dissenys per pantalla (graella o files) i camps opcionals per tipus de llista (notes i fotos a la vista de l'element i a la pantalla d'edició).
- **Còpia de seguretat** — exporta tota la base de dades com un fitxer JSON i importa-la de nou quan vulguis, amb accions protegides d'esborrat total i restabliment de fàbrica.

## Captures de pantalla

![Pantalla d'inici](images/screenshots/01-home-empty.png)<br>*Pantalla d'inici abans que existeixi cap col·lecció o llista.*<br><br>
![Inici amb dades](images/screenshots/02-home.png)<br>*Inici amb una col·lecció i llistes soltes, inclosa una llista blocada.*<br><br>
![Menú lateral](images/screenshots/03-hamburger.png)<br>*Menú lateral amb Inici, Col·leccions, Llistes i Ajustos — i la versió de l'app a baix.*<br><br>
![Crear llista](images/screenshots/04-create-list.png)<br>*Crear una llista: nom, tipus (Estàndard o Numèrica), icona i color.*<br><br>
![Detall de llista](images/screenshots/05-list-detail.png)<br>*Una llista estàndard amb elements marcats, una nota, el control d'ordre i accions per lots.*<br><br>
![Llista numèrica](images/screenshots/06-numeric-list-v2.png)<br>*Una llista numèrica amb barra de progrés per valor, Total i Fet, totals de línia i la fila d'import/cantitat.*<br><br>
![Afegir element ampliat](images/screenshots/07-add-item-expanded.png)<br>*La barra d'afegir ampliada per adjuntar una nota i fotos al nou element.*<br><br>
![Editar element](images/screenshots/08-item-edit.png)<br>*Editar un element: nom, nota i fotos.*<br><br>
![Col·leccions](images/screenshots/09b-collections.png)<br>*La pantalla de Col·leccions.*<br><br>
![Llistes](images/screenshots/09-lists.png)<br>*La pantalla de Llistes, amb la pertinença a col·leccions i el progrés per llista.*<br><br>
![Detall de col·lecció](images/screenshots/10-collection-detail.png)<br>*Una col·lecció amb les seves llistes membre.*<br><br>
![Blocar llista](images/screenshots/12-lock-list.png)<br>*Blocar una llista amb una contrasenya.*<br><br>
![Llista blocada](images/screenshots/12b-locked-list.png)<br>*Una llista blocada, esperant la contrasenya.*<br><br>
![Mode selecció](images/screenshots/13-select-mode.png)<br>*Mode selecció amb la barra d'accions inferior.*<br><br>
![Ajustos](images/screenshots/14-settings.png)<br>*Ajustos: Aparença, Regional, Personalització i Dades.*<br><br>
![Ajustos d'aparença](images/screenshots/15-settings-appearance.png)<br>*Aparença: tema i mida del text.*<br><br>
![Selector d'idioma](images/screenshots/16b-settings-language.png)<br>*El selector d'idioma amb els nou idiomes i les seves banderes.*<br><br>
![Ajustos regionals](images/screenshots/16-settings-regional.png)<br>*Ajustos regionals: idioma.*<br><br>
![Ajustos de personalització](images/screenshots/17-settings-personalization.png)<br>*Personalització: dissenys per pantalla i camps opcionals per tipus de llista.*<br><br>
![Ajustos de dades](images/screenshots/18-settings-data.png)<br>*Dades: exportar/importar i les accions protegides d'esborrat i restabliment.*<br><br>

## Tecnologies

| Capa | Tecnologia |
|---|---|
| Framework | React Native amb Expo (SDK 57) |
| Llenguatge | TypeScript |
| Navegació | React Navigation (Stack + Drawer) |
| Icones | @expo/vector-icons (Ionicons) |
| Arrossegar i deixar anar | react-native-sortables |
| Selector de color | reanimated-color-picker |
| Xifrat | quick-crypto (AES-256-GCM per a les llistes blocades) |
| Persistència | SQLite (expo-sqlite) en natiu, sql.js (WASM) + IndexedDB a la web |
| ORM | Drizzle ORM (query builder sobre un `DatabaseHandle` compartit) |
| Validació | Esquemes Zod com a única font de veritat per a les files desades |
| Web | react-native-web |
| Estat | Context API (AppContext + ConfigContext) |
| i18n | Sistema propi (en, es, ca, gl, eu, fr, de, pt, it) |

## Desenvolupament

Aquesta secció és per a col·laboradors i per a qualsevol que vulgui executar, fer un fork o ampliar l'app.

### Requisits

- Node.js 20+ (es recomana Node 24)
- npm
- Un emulador d'Android opcional (la carpeta `android/` la genera CNG — vegeu més avall)

### La primera vegada després de clonar

```bash
cd ListlyApp
npm install
npx expo start
```

Això arrenca Metro Bundler. Després:

| Per veure-ho a… | Fes això |
|---|---|
| **Navegador** | Obre http://localhost:8081 o executa `npx expo start --web` |
| **Android (emulador)** | Executa `npx expo run:android` |
| **iOS (simulador)** | Executa `npx expo run:ios` (només macOS) |

> Nota: les llistes blocades i el full de compartir depenen de mòduls natius, així que fes servir una compilació de desenvolupament o de release en lloc d'Expo Go.

### Ordres

| Ordre | Descripció |
|---|---|
| `npm start` | Arrenca Expo en mode desenvolupament |
| `npm run web` | Arrenca i obre al navegador |
| `npm run android` | Arrenca a l'emulador d'Android |
| `npm run ios` | Arrenca al simulador d'iOS (només macOS) |
| `npm run typecheck` | Comprovació de TypeScript (`tsc --noEmit`) |
| `npm run lint` | ESLint mitjançant `expo lint` |
| `npm test` | Executa la suite de Vitest |
| `npm run test:watch` | Executa Vitest en mode watch |
| `npm run test:all` | typecheck + lint + tests (la porta local completa) |

### Proves

- **Unitàries / d'integració** — Vitest. La suite cobreix els repositoris de la base de dades als dos backends de SQLite (natiu + sql.js), els cicles de còpia de seguretat, el xifrat i components renderitzats amb `@testing-library/react-native`.
- **Verificació web** — els criteris d'acceptació de cada funció es verifiquen en un navegador real a 375px amb Playwright.
- El pipeline de CI executa la porta completa `npm run test:all` a cada push i pull request a `develop` i `main`.

> **Porta local:** un canvi només està acabat quan `npm run test:all` passa.

### Estructura del projecte

```
ListlyApp/
  src/
    components/    — components d'UI reutilitzables
    constants/     — temes, tipus, colors, icones
    context/       — AppContext, ConfigContext (estat global)
    database/      — motors SQLite/sql.js, repositoris, migracions, esquema Drizzle
    hooks/         — hooks propis
    i18n/          — traduccions (en, es, ca, gl, eu, fr, de, pt, it)
    navigation/    — AppNavigator (Drawer + Stack)
    screens/       — components de pantalla (PascalCase)
    utils/         — formatejadors, plataforma, idioma
```

### Base de dades

- Una única interfície de motor (`DatabaseHandle`) a totes les plataformes: expo-sqlite en natiu, sql.js (WASM) amb persistència a IndexedDB a la web.
- L'esquema es crea des d'un `createSchema` canònic i es versiona amb `PRAGMA user_version`; les migracions s'executen una vegada, dins d'una transacció.
- Els repositoris s'escriuen amb el query builder de Drizzle sobre el handle compartit; les files desades es validen amb esquemes Zod.
- A la web els bytes exportats de SQLite es persisteixen a IndexedDB, així que les mateixes dades sobreviuen a les recàrregues.

### Generar un APK / AAB d'Android (EAS Build)

**Listly** fa servir EAS Build, que gestiona la clau de signatura d'Android perquè les versions consecutives comparteixin una mateixa signatura i s'actualitzin al lloc. Requereix un compte d'Expo i la CLI d'EAS:

```bash
npm install -g eas-cli
eas login
cd ListlyApp
```

| Perfil | Ordre | Resultat |
|---|---|---|
| Development | `eas build --profile development` | build de dev-client (intern) |
| Preview | `eas build --platform android --profile preview` | APK instal·lable (intern) |
| Production | `eas build --platform android --profile production --no-wait` | AAB publicable (botiga) |

El perfil `production` d'`eas.json` fa servir `"distribution": "store"` i `"buildType": "app-bundle"`, i produeix un AAB per enviar a la botiga. `cli.appVersionSource` és `"local"`, així que les metadades de versió es llegeixen directament d'`app.json` — **augmenta `android.versionCode` (enter, estrictament creixent) i `ios.buildNumber` a cada versió**. EAS genera i desa la clau de signatura de release al primer build de producció; fes-ne una còpia amb `eas credentials` i no la pugis mai al repositori (les claus són al .gitignore).

Per a una prova local ràpida pots seguir compilant un APK signat amb debug des de la carpeta nativa generada (fa servir una clau de signatura diferent, de debug — no per distribuir):

```bash
cd ListlyApp
npx expo prebuild --platform android   # regenera el projecte natiu després de canvis d'assets/config
cd android
./gradlew assembleRelease   # APK → app/build/outputs/apk/release/app-release.apk
```

### Metodologia

Aquest projecte fa servir **Specification-Driven Development (SDD).** Les especificacions viuen a `spec/` i són l'única font de veritat — què cal construir es defineix primer en documents `1-spec.md`, després s'implementa i després es verifica contra els criteris d'acceptació. La fulla de ruta es segueix a `spec/constitution/3-roadmap.md`.

## Llicència

Listly està sota la llicència MIT — consulta el fitxer [LICENSE](LICENSE).
