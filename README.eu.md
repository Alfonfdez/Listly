# Listly

[English](README.md) · [Español](README.es.md) · [Català](README.ca.md) · [Galego](README.gl.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Italiano](README.it.md)

**Listly** egunerokorako zerrenda-kudeatzaile local-first bat da. Ahal adina zerrenda sortu — erosketa, zereginak, ekipajea, despentsa — kolekzioetan antolatu, eta elementuak markatu aurrera egin ahala. Zerrendak kontrol-zerrenda soilak izan daitezke, edo elementu bakoitzeko zenbateko bat eta kantitate bat erregistratzen dituzten zerrenda numerikoak, guztira metatua barne.

Dena **gailuan** exekutatzen da: zure datuak tokiko SQLite datu-basean bizi dira (sql.js + IndexedDB webean), ezer ez da zure telefonotik ateratzen, eta ez da konturik edo harpidetzarik behar.

| | |
|---|---|
| **Plataformak** | iOS, Android eta Web |
| **Bertsioa** | 1.0.0 |
| **Hizkuntzak** | Ingelesa, Gaztelania, Katalana, Galiziera, Euskara, Frantsesa, Alemana, Portugesa eta Italiera |
| **Datuak** | % 100 lokalak (SQLite natiboan, sql.js + IndexedDB webean) |
| **Gaiak** | Iluna, Argia eta Automatikoa (sistema jarraitzen du) |

## Funtzioak

- **Zerrendak** — ahal adina zerrenda sortu, bakoitza bere ikono eta kolorearekin, eta aukeratu bi zerrenda motaren artean: **Estandarra** (kontrol-zerrenda) edo **Numerikoa**, elementu bakoitzeko zenbateko batekin eta kantitate batekin.
- **Elementuak** — elementuak azkar gehitzen dira beheko barratik, markatu, eta ireki elementu bat **ohar** bat edo **argazki** bat gehitzeko (galeria plataforma guztietan, kamera iOS eta Android-en).
- **Zerrenda numerikoak** — esleitu elementu bakoitzari zenbateko bat eta kantitate bat; zerrendaren goiburukoak **Guztira** eta **Eginda** azpitotala erakusten ditu, eta elementu bakoitzak bere lerro-totala (zenbatekoa × kantitatea).
- **Kolekzioak** — zerrendak kolekzio (karpeta)etan multzokatu, hala nola *Etxea* edo *Lana*, eta arrastatu zerrenda bat kolekzio baten gainera hara eramateko.
- **Arrastatu eta jaregin** — berrantolatu zerrendak eta elementuak luze sakatuta eta arrastatuta; `position` zutabe baten bidez gordetzen da.
- **Blokeatutako zerrendak** — babestu zerrenda bat pasahitz batekin; bere elementuak **gailuan** zifratzen dira AES-256-GCM-rekin. Pasahitza ahazten baduzu, ez dago berreskuratzerik.
- **Bikoiztu, kopiatu eta batu** — bikoiztu zerrenda oso bat, kopiatu zerrenda bat oharrekin edo hauek gabe, kopiatu hautatutako elementuak beste zerrenda batera, edo batu elementuak beste zerrenda batean.
- **Ordenatzea** — ordenatu zerrenda bat eskuz, izenaren arabera edo elementu bakoitza gehitu zen unekoaren arabera, gorantz edo beherantz.
- **Hautapen modua** — sartu hautapen moduan goiburutik hainbat elementu hautatu eta ezabatzeko (edo hainbat zerrenda aldi berean hautatzeko) batean.
- **Bilaketa** — iragazi zerrendak eta elementuak goiburuko bilaketatik Hasiera, Zerrendak eta zerrenda baten barruan.
- **Ezarpenak** — gaia, testu-tamaina, hizkuntza, pantaila bakoitzeko diseinuak (sareta edo errenkadak) eta zerrenda mota bakoitzeko eremu aukerakoak (oharrak eta argazkiak elementuaren ikuspegian eta edizio-pantailan).
- **Babeskopia** — esportatu datu-base osoa JSON fitxategi gisa eta inportatu berriro nahi duzunean, ezabaketa osoa eta fabrikako berrezarpena babestutako ekintzekin.

## Pantaila-argazkiak

![Hasierako pantaila](images/screenshots/01-home-empty.png)<br>*Hasierako pantaila, kolekzio edo zerrendarik oraindik ez dagoenean.*<br><br>
![Hasiera datuekin](images/screenshots/02-home.png)<br>*Hasiera kolekzio batekin eta zerrenda solteekin, blokeatutako zerrenda bat barne.*<br><br>
![Alboko menua](images/screenshots/03-hamburger.png)<br>*Alboko menua Hasiera, Kolekzioak, Zerrendak eta Ezarpenekin — eta apparen bertsioa behean.*<br><br>
![Zerrenda sortu](images/screenshots/04-create-list.png)<br>*Zerrenda sortu: izena, mota (Estandarra edo Numerikoa), ikonoa eta kolorea.*<br><br>
![Zerrenda-xehetasuna](images/screenshots/05-list-detail.png)<br>*Zerrenda estandar bat, markatutako elementuekin, ohar batekin, ordena-kontrolarekin eta lote-ekintzekin.*<br><br>
![Zerrenda numerikoa](images/screenshots/06-numeric-list.png)<br>*Zerrenda numeriko bat Guztira eta Eginda-rekin, lerro-totalekin eta zenbateko/kantitate errenkadarekin.*<br><br>
![Gehitu elementua zabalik](images/screenshots/07-add-item-expanded.png)<br>*Gehitzeko barra zabaldua, elementu berriari oharra eta argazkiak eransteko.*<br><br>
![Elementua editatu](images/screenshots/08-item-edit.png)<br>*Elementu bat editatzen: izena, oharra eta argazkiak.*<br><br>
![Kolekzioak](images/screenshots/09b-collections.png)<br>*Kolekzioen pantaila.*<br><br>
![Zerrendak](images/screenshots/09-lists.png)<br>*Zerrenden pantaila, kolekzio-egozpena eta zerrendako aurrerapena erakutsita.*<br><br>
![Kolekzio-xehetasuna](images/screenshots/10-collection-detail.png)<br>*Kolekzio bat bere kide diren zerrendekin.*<br><br>
![Zerrenda blokeatu](images/screenshots/12-lock-list.png)<br>*Zerrenda bat pasahitz batekin blokeatzea.*<br><br>
![Blokeatutako zerrenda](images/screenshots/12b-locked-list.png)<br>*Blokeatutako zerrenda bat, pasahitzaren zain.*<br><br>
![Hautapen modua](images/screenshots/13-select-mode.png)<br>*Hautapen modua beheko ekintza-barrarekin.*<br><br>
![Ezarpenak](images/screenshots/14-settings.png)<br>*Ezarpenak: Itxura, Eskualdea, Pertsonalizazioa eta Datuak.*<br><br>
![Itxura-ezarpenak](images/screenshots/15-settings-appearance.png)<br>*Itxura: gaia eta testu-tamaina.*<br><br>
![Hizkuntza-hautatzailea](images/screenshots/16b-settings-language.png)<br>*Hizkuntza-hautatzailea, bederatzi hizkuntzekin eta haien banderekin.*<br><br>
![Eskualde-ezarpenak](images/screenshots/16-settings-regional.png)<br>*Eskualde-ezarpenak: hizkuntza.*<br><br>
![Pertsonalizazio-ezarpenak](images/screenshots/17-settings-personalization.png)<br>*Pertsonalizazioa: pantaila bakoitzeko diseinuak eta zerrenda mota bakoitzeko eremu aukerakoak.*<br><br>
![Datu-ezarpenak](images/screenshots/18-settings-data.png)<br>*Datuak: esportatu/inportatu eta ezabaketa eta berrezarpen babestutako ekintzak.*<br><br>

## Teknologiak

| Geruza | Teknologia |
|---|---|
| Framework | React Native Expo-rekin (SDK 57) |
| Hizkuntza | TypeScript |
| Nabigazioa | React Navigation (Stack + Drawer) |
| Ikonoak | @expo/vector-icons (Ionicons) |
| Arrastatu eta jaregin | react-native-sortables |
| Kolore-hautatzailea | reanimated-color-picker |
| Zifratzea | quick-crypto (AES-256-GCM blokeatutako zerrendetarako) |
| Iraunkortasuna | SQLite (expo-sqlite) natiboan, sql.js (WASM) + IndexedDB webean |
| ORM | Drizzle ORM (query builder `DatabaseHandle` partekatu baten gainean) |
| Balidazioa | Zod eskemak gordetako errenkaden egia-iturri bakarra gisa |
| Web | react-native-web |
| Egoera | Context API (AppContext + ConfigContext) |
| i18n | Sistema propioa (en, es, ca, gl, eu, fr, de, pt, it) |

## Garapena

Atal hau laguntzaileentzat da, eta appa exekutatu, fork egin edo zabaldu nahi duenarentzat.

### Eskakizunak

- Node.js 20+ (Node 24 gomendatzen da)
- npm
- Android emuladore aukerako bat (`android/` karpeta CNG-k sortzen du — ikusi behean)

### Klonatu ondorengo lehen aldia

```bash
cd ListlyApp
npm install
npx expo start
```

Honek Metro Bundler abiarazten du. Ondoren:

| Non ikusi… | Egin hau |
|---|---|
| **Nabigatzailea** | Ireki http://localhost:8081 edo exekutatu `npx expo start --web` |
| **Android (emuladorea)** | Exekutatu `npx expo run:android` |
| **iOS (simuladorea)** | Exekutatu `npx expo run:ios` (macOS soilik) |

> Oharra: blokeatutako zerrendek eta partekatze-orriak modulu natiboak behar dituzte, beraz erabili garapeneko edo releaseko konpilazio bat Expo Go-ren ordez.

### Komandoak

| Komandoa | Azalpena |
|---|---|
| `npm start` | Expo abiarazi garapen moduan |
| `npm run web` | Abiarazi eta ireki nabigatzailean |
| `npm run android` | Abiarazi Android emuladorean |
| `npm run ios` | Abiarazi iOS simuladorean (macOS soilik) |
| `npm run typecheck` | TypeScript egiaztapena (`tsc --noEmit`) |
| `npm run lint` | ESLint `expo lint` bidez |
| `npm test` | Vitest suitea exekutatu |
| `npm run test:watch` | Vitest watch moduan exekutatu |
| `npm run test:all` | typecheck + lint + tests (tokiko ate osoa) |

### Probak

- **Unitarioak / integrazioak** — Vitest. Suiteak datu-basearen biltegiak estaltzen ditu SQLite backend bietan (natiboa + sql.js), babeskopia-zikloak, zifratzea eta `@testing-library/react-native`-rekin errendatutako osagaiak.
- **Web egiaztapena** — funtzio bakoitzaren onarpen-irizpideak nabigatzaile erreal batean egiaztatzen dira 375px-an Playwright-ekin.
- CI pipelineak `npm run test:all` ate osoa exekutatzen du `develop` eta `main` adarretara egindako push eta pull request bakoitzean.

> **Tokiko atea:** aldaketa bat amaituta dago `npm run test:all` pasatzen denean soilik.

### Proiektuaren egitura

```
ListlyApp/
  src/
    components/    — berrerabilgarriak diren UI osagaiak
    constants/     — gaiak, motak, koloreak, ikonoak
    context/       — AppContext, ConfigContext (egoera globala)
    database/      — SQLite/sql.js motorrak, biltegiak, migrazioak, Drizzle eskema
    hooks/         — hook propioak
    i18n/          — itzulpenak (en, es, ca, gl, eu, fr, de, pt, it)
    navigation/    — AppNavigator (Drawer + Stack)
    screens/       — pantaila-osagaiak (PascalCase)
    utils/         — formatzaileak, plataforma, hizkuntza
```

### Datu-basea

- Motor-interfaze bakarra (`DatabaseHandle`) plataforma guztietan: expo-sqlite natiboan, sql.js (WASM) IndexedDB iraunkortasunarekin webean.
- Eskema `createSchema` kanoniko batetik sortzen da eta `PRAGMA user_version`-ekin bertsionatzen da; migrazioak behin exekutatzen dira, transakzio baten barruan.
- Biltegiak Drizzle-ren query builder-arekin idazten dira handle partekatuaren gainean; gordetako errenkadak Zod eskemen bidez balidatzen dira.
- Webean SQLite-ren byte esportatuak IndexedDB-n persistitzen dira, beraz datu berak berriz kargatzean ere bizirik diraute.

### Android APK bat konpilatu

`android/` karpeta natiboa Expo CNG-k (`expo prebuild`) sortzen du eta ez da bertsionatzen:

```bash
cd ListlyApp
npx expo prebuild --platform android
cd android
./gradlew assembleRelease   # APK → app/build/outputs/apk/release/app-release.apk
```

Exekutatu `npx expo prebuild --platform android` berriro `assets/` edo `app.json`-eko ikono/splash konfigurazioa aldatzen diren bakoitzean, bestela APK-k ikono zaharkituak gordetzen ditu.

### Metodologia

Proiektu honek **Specification-Driven Development (SDD)** erabiltzen du. Espezifikazioak `spec/`-en bizi dira eta egia-iturri bakarra dira — zer eraiki behar den `1-spec.md` dokumentuetan definitzen da lehenik, gero inplementatzen da eta gero onarpen-irizpideen aurka egiaztatzen da. Bide-orria `spec/constitution/3-roadmap.md`-n jarraitzen da.

## Lizentzia

Listly MIT lizentziaren pean dago — ikusi [LICENSE](LICENSE) fitxategia.
