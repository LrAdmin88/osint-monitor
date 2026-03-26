/**
 * SISTEMA DE MONITOREO DE INTELIGENCIA - NÚCLEO RÍGIDO
 * Versión consolidada con parches finos + categoría.
 */

// --- 1. MENÚ / INICIALIZACIÓN ---
function onOpen() {
  asegurarHojaLogs();

  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Monitoreo")
    .addItem("Ejecutar Monitoreo Filtrado", "ejecutarSoloFiltrada")
    .addItem("Ejecutar Monitoreo Completo", "ejecutarSoloCompleta")
    .addItem("Ejecutar Periodistas y Fuentes", "ejecutarSoloPeriodistas")
    .addSeparator()
    .addItem("Limpiar LOGS", "limpiarLogs")
    .addToUi();
}

// --- 2. LOGS ---
function asegurarHojaLogs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let hojaLogs = ss.getSheetByName("LOGS");

  if (!hojaLogs) {
    hojaLogs = ss.insertSheet("LOGS");
  }

  const esperado = ["FECHA", "PAÍS", "ACRÓNIMO", "CATEGORÍA", "QUERY", "NOTICIA", "ESTADO", "MOTIVO"];

  if (hojaLogs.getLastRow() === 0) {
    hojaLogs.appendRow(esperado);
    hojaLogs.getRange("A1:H1").setFontWeight("bold").setBackground("#fbbc04");
  } else {
    const encabezados = hojaLogs.getRange(1, 1, 1, Math.min(8, hojaLogs.getLastColumn())).getValues()[0];
    const actual = encabezados.map(String);

    if (JSON.stringify(actual) !== JSON.stringify(esperado)) {
      hojaLogs.clear();
      hojaLogs.appendRow(esperado);
      hojaLogs.getRange("A1:H1").setFontWeight("bold").setBackground("#fbbc04");
    }
  }
}

function registrarLog(pais, acronimo, categoria, query, titulo, estado, motivo) {
  asegurarHojaLogs();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaLogs = ss.getSheetByName("LOGS");
  hojaLogs.appendRow([new Date(), pais, acronimo, categoria || "Inteligencia", query, titulo, estado, motivo]);
}

function limpiarLogs() {
  asegurarHojaLogs();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName("LOGS");
  hoja.clear();
  hoja.appendRow(["FECHA", "PAÍS", "ACRÓNIMO", "CATEGORÍA", "QUERY", "NOTICIA", "ESTADO", "MOTIVO"]);
  hoja.getRange("A1:H1").setFontWeight("bold").setBackground("#fbbc04");
}

// --- 3. LANZADORES ---
function ejecutarSoloFiltrada() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const fechas = calcularFechas();
  procesarCanal(ss, "Lista Filtrada", "Monitoreo Filtrado", fechas.inicio, fechas.fin, 100);
  Logger.log("Canal Agencias Filtrado completado.");
}

function ejecutarSoloCompleta() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const fechas = calcularFechas();
  procesarCanal(ss, "Lista Completa", "Monitoreo Completo", fechas.inicio, fechas.fin, 150);
  Logger.log("Canal Agencias Completo completado.");
}

function monitoreoDobleCanal() {
  Logger.log("Para evitar timeout, ejecutar por separado: ejecutarSoloFiltrada() y luego ejecutarSoloCompleta().");
}

function calcularFechas() {
  const ahora = new Date();
  const diasAtras = (ahora.getDay() === 1) ? 3 : 1;
  return {
    inicio: new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diasAtras, 0, 0, 0),
    fin: ahora
  };
}

function obtenerUrlReal(url) {
  return url;
}

function extraerIdGoogleNews(urlGoogle) {
  const m = urlGoogle.match(/\/(?:rss\/)?articles\/([^?]+)/i);
  return m ? m[1] : null;
}

function limpiarUrlDecodificada(url) {
  return url
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
}

function extraerIdGoogleNews(urlGoogle) {
  const m = urlGoogle.match(/\/(?:rss\/)?articles\/([^?]+)/i);
  return m ? m[1] : null;
}

function limpiarUrlDecodificada(url) {
  return url
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
}

function extraerIdGoogleNews(urlGoogle) {
  const m = urlGoogle.match(/\/(?:rss\/)?articles\/([^?]+)/i);
  return m ? m[1] : null;
}

function limpiarUrlDecodificada(url) {
  return url
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
}

function pruebaObtenerUrlReal() {
  const url = "https://news.google.com/rss/articles/CBMi5wFBVV95cUxPYUVkdzdrYzdSM0d2WklCU2swM0hkTTF5dGdNSW9YOVVMWTZUX1lqYUpwa3NIMzZMM0VxcFNHWHZRb3pDZ1lRTTRscmRWN1RkOGgyQ0hTVVFTRjgzeVhaeXZNNThVeVBaY0hXZTZJaE9kSmppV0k1NnFfd2JpMzZLRW9YMkVYOENzSzQ3dnptVFMwVm80RVhYZjMxQ0xwMHplcjBlOGlKeXlrZVhfa0ZXU1hQTmpyVFVSeDljWnRwamlVRGNHRkhyYWFhY21OWGhlLW44c1N1cVF2bXBMYU5CS0MtaHlGOGc?oc=5";
  const resultado = obtenerUrlReal(url);
  Logger.log("Resultado final: " + resultado);
}

// --- 4. MOTOR DE PROCESAMIENTO DE AGENCIAS ---
function procesarCanal(ss, nombreOrigen, nombreDestino, fechaCorte, ahora, limiteFilas) {
  const hojaOrigen = ss.getSheetByName(nombreOrigen);
  const hojaDestino = ss.getSheetByName(nombreDestino);
  if (!hojaOrigen || !hojaDestino) return;

  hojaDestino.clear();
  hojaDestino.appendRow(["PAÍS", "ACRÓNIMO", "CATEGORÍA", "NOTICIA", "IMPACTO", "FECHA", "LINK"]);
  hojaDestino.getRange("A1:G1").setFontWeight("bold").setBackground("#cfe2ff");

  const ultimaFila = hojaOrigen.getLastRow();
  if (ultimaFila < 2) return;

  let datos = hojaOrigen.getRange(2, 1, ultimaFila - 1, 9).getValues();

  if (limiteFilas && datos.length > limiteFilas) {
    datos = datos.slice(0, limiteFilas);
  }

  datos.forEach((fila) => {
    const pais = fila[0];
    const nombreLargo = fila[3];
    const acronimo = fila[4];
    const directivos = [fila[5], fila[6], fila[7], fila[8]]
      .map(d => d ? d.toString().trim() : "")
      .filter(d => d !== "");

    if (pais && acronimo) {
      ejecutarConsultasAgencias(pais, nombreLargo, acronimo, directivos, fechaCorte, ahora, hojaDestino);
    }
  });

  finalizarHoja(hojaDestino);
}

// --- 5. HELPERS DE TEXTO / REGLAS ---
function esAcronimoAmbiguo(acronimo) {
  const ambiguos = ["SIA", "NIA", "DNI", "MSS", "NIS", "DIS", "GID", "CNI", "SIS", "FIS"];
  return ambiguos.includes((acronimo || "").toUpperCase());
}

function acronimoCoincide(acronimoFicha, acronimoObjetivo) {
  const ficha = (acronimoFicha || "").toUpperCase();
  const objetivo = (acronimoObjetivo || "").toUpperCase();
  return ficha.split("/").map(x => x.trim()).includes(objetivo);
}

function tituloMencionaPaisEsperado(titNorm, pais) {
  const p = (pais || "").toUpperCase();

  const aliases = {
    "AUSTRIA": ["austria", "austrian"],
    "BAHREIN": ["bahrain", "bahraini"],
    "BOLIVIA": ["bolivia", "bolivian", "boliviana", "boliviano"],
    "BRASIL": ["brasil", "brazil", "brazilian", "brasileiro", "brasileira"],
    "CHILE": ["chile", "chilean", "chileno", "chilena"],
    "CHINA": ["china", "chinese", "chino", "china's"],
    "COLOMBIA": ["colombia", "colombian", "colombiana", "colombiano"],
    "COREA DEL NORTE": ["north korea", "north korean", "dprk", "pyongyang"],
    "COREA DEL SUR": ["south korea", "south korean", "seoul", "rok"],
    "COSTA RICA": ["costa rica", "costa rican", "costarricense", "san jose", "san josé"],
    "ECUADOR": ["ecuador", "ecuadorian", "ecuatoriano", "ecuatoriana"],
    "EGIPTO": ["egypt", "egyptian", "egipto", "egipcio", "egipcia"],
    "EMIRATOS ÁRABES UNIDOS": ["uae", "united arab emirates", "emirati", "emiratos arabes unidos", "emiratos árabes unidos"],
    "ESPAÑA": ["espana", "españa", "spanish", "espanola", "española", "espanol", "español"],
    "ESTADOS UNIDOS": ["united states", "u.s.", "us ", "usa", "american", "america"],
    "INDIA": ["india", "indian"],
    "IRAN": ["iran", "iranian"],
    "ISRAEL": ["israel", "israeli"],
    "ITALIA": ["italy", "italian", "italia", "italiano", "italiana"],
    "JORDANIA": ["jordan", "jordanian", "jordania"],
    "KENIA": ["kenya", "kenyan", "kenia"],
    "MEXICO": ["mexico", "mexican", "mexicano", "mexicana"],
    "NIGERIA": ["nigeria", "nigerian"],
    "PAISES BAJOS": ["netherlands", "dutch", "holland", "países bajos", "paises bajos", "neerlandes", "neerlandés"],
    "PERU": ["peru", "perú", "peruvian", "peruano", "peruana"],
    "PORTUGAL": ["portugal", "portuguese", "portugues", "portugués"],
    "REINO UNIDO": ["united kingdom", "uk", "britain", "british"],
    "RUMANIA": ["romania", "romanian", "rumania", "rumano", "rumana"],
    "RUSIA": ["russia", "russian", "ruso", "rusia"],
    "SRI LANKA": ["sri lanka", "sri lankan"],
    "SUIZA": ["switzerland", "swiss", "suiza"],
    "TAILANDIA": ["thailand", "thai", "tailandia"],
    "UCRANIA": ["ukraine", "ukrainian", "ucrania", "ucraniano", "ucraniana"]
  };

  const lista = aliases[p] || [normalizarTexto(pais)];
  return lista.some(x => titNorm.includes(normalizarTexto(x)));
}

function normalizarTexto(texto) {
  return (texto || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[‘’“”"']/g, "")
    .replace(/[|•·]/g, " ")
    .replace(/[—–-]+/g, " ")
    .replace(/[,:;(){}\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escaparRegex(texto) {
  return (texto || "").toString().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function contienePalabraExacta(texto, palabra) {
  const t = normalizarTexto(texto || "");
  const p = normalizarTexto(palabra || "");
  const regex = new RegExp(`(^|\\s)${escaparRegex(p)}(\\s|$)`, "i");
  return regex.test(t);
}

function contieneAlguno(texto, lista) {
  return lista.some(x => texto.includes(normalizarTexto(x)));
}
function coincidePaisAcronimo(pais, acronimo, titNorm) {
  const p = (pais || "").toUpperCase();
  const a = (acronimo || "").toUpperCase();
  const t = titNorm || "";

  // ======================================================
  // ACRÓNIMOS CONFLICTIVOS: validación por país + contexto
  // ======================================================

  // ----- CNI -----
  if (a === "CNI") {
    if (p === "ESPAÑA") {
      return contieneAlguno(t, [
        "cni",
        "centro nacional de inteligencia",
        "inteligencia espanola",
        "inteligencia española",
        "servicios secretos espanoles",
        "servicios secretos españoles",
        "pegasus",
        "cup",
        "exdiputados de la cup"
      ]);
    }

    if (p === "ECUADOR") {
      const identidadEcuador = contieneAlguno(t, [
        "cies",
        "cni",
        "centro de inteligencia estrategica",
        "centro de inteligencia estratégica",
        "sistema nacional de inteligencia",
        "inteligencia ecuatoriana",
        "servicios de inteligencia de ecuador",
        "ecuador",
        "ecuatoriano",
        "ecuatoriana",
        "quito",
        "gobierno de ecuador",
        "seguridad nacional"
      ]);

      const ruidoEcuadorNegocio = contieneAlguno(t, [
        "packaging",
        "sector packaging",
        "industria",
        "empresas",
        "corporativo",
        "retail",
        "marketing",
        "innovacion",
        "innovación",
        "negocios",
        "mercado",
        "transformacion digital",
        "transformación digital"
      ]);

      return identidadEcuador && !ruidoEcuadorNegocio;
    }

    if (p === "MEXICO") {
      return contieneAlguno(t, [
        "mexico",
        "mexicano",
        "mexicana",
        "inteligencia mexicana",
        "seguridad nacional",
        "cartel",
        "cártel",
        "crimen organizado",
        "organizacion criminal",
        "organización criminal",
        "tunel",
        "túnel",
        "frontera"
      ]);
    }

    return false;
  }

  // ----- DNI -----
  if (a === "DNI") {
    if (p === "COLOMBIA") {
      return contieneAlguno(t, [
        "direccion nacional de inteligencia",
        "dirección nacional de inteligencia",
        "dni colombia",
        "colombia",
        "inteligencia colombiana",
        "chuzado",
        "contrainteligencia"
      ]);
    }

    if (p === "BOLIVIA") {
      return contieneAlguno(t, [
        "direccion nacional de inteligencia",
        "dirección nacional de inteligencia",
        "bolivia",
        "boliviano",
        "boliviana"
      ]);
    }

    if (p === "PERU") {
      const identidadPeru = contieneAlguno(t, [
        "direccion nacional de inteligencia",
        "dirección nacional de inteligencia",
        "dni peru",
        "dni perú",
        "inteligencia peruana",
        "servicio de inteligencia del peru",
        "servicio de inteligencia del perú",
        "peru",
        "perú",
        "peruano",
        "peruana"
      ]);

      const ruidoPeruIA = contieneAlguno(t, [
        "inteligencia artificial",
        "artificial intelligence",
        "transformacion laboral",
        "transformación laboral",
        "retail",
        "mall",
        "malls",
        "america malls",
        "america malls & retail",
        "empleo",
        "empleos",
        "trabajo",
        "laboral"
      ]);

  return identidadPeru && !ruidoPeruIA;
}

    return false;
  }

  // ----- ANI -----
  if (a === "ANI") {
    if (p === "CHILE") {
      return contieneAlguno(t, [
        "agencia nacional de inteligencia",
        "inteligencia chilena",
        "director de la ani",
        "nuevo director de la ani",
        "jefe de la ani",
        "chile",
        "chileno",
        "chilena"
      ]);
    }

    return false;
  }

  // ----- DIS -----
  if (a === "DIS") {
    if (p === "COSTA RICA") {
      return contieneAlguno(t, [
        "direccion de inteligencia y seguridad",
        "dirección de inteligencia y seguridad",
        "costa rica",
        "costarricense",
        "san jose",
        "san josé"
      ]);
    }

    if (p === "ITALIA") {
      const identidadItalia = contieneAlguno(t, [
        "dipartimento delle informazioni per la sicurezza",
        "intelligence italiana",
        "servizi segreti italiani",
        "italia",
        "italian intelligence"
      ]);

      const ruidoFinanciero = contieneAlguno(t, [
        "revenue",
        "profit",
        "stock",
        "market",
        "trading",
        "tradingview",
        "earnings",
        "financial",
        "shares",
        "investor",
        "guidance",
        "forecast",
        "full-year",
        "economic",
        "quarter",
        "results",
        "nav",
        "bond market",
        "cash flow"
      ]);

      return identidadItalia && !ruidoFinanciero;
    }

    return false;
  }


  // ----- AISE -----
  if (a === "AISE") {
    if (p === "ITALIA") {
      const identidadAISE = contieneAlguno(t, [
        "aise",
        "agenzia informazioni e sicurezza esterna",
        "intelligence italiana",
        "servizi segreti italiani",
        "italian intelligence",
        "italia"
      ]);

      const ruidoDiplomaticoComercial = contieneAlguno(t, [
        "made in italy",
        "camara de comercio",
        "cámara de comercio",
        "commercio",
        "imprese italiane",
        "rappresentanza permanente",
        "onu",
        "eventi",
        "incontro",
        "roadshow",
        "community",
        "vetrina",
        "soiree",
        "soirée",
        "vino",
        "spumante",
        "mercati",
        "export",
        "canada",
        "croazia",
        "croatia",
        "luxe",
        "automobile"
      ]);

      return identidadAISE && !ruidoDiplomaticoComercial;
    }

    return false;
  }
  
  // ----- BND -----
  if (a === "BND") {
    if (p === "ALEMANIA") {
      return contieneAlguno(t, [
        "bundesnachrichtendienst",
        "german intelligence",
        "alemania",
        "germany",
        "german"
      ]);
    }

    return false;
  }

  // ----- DGSE / DGSI -----
  if (a === "DGSE") {
    if (p === "FRANCIA") {
      return contieneAlguno(t, [
        "dgse",
        "direction generale de la securite exterieure",
        "direction générale de la sécurité extérieure",
        "renseignement exterieur",
        "renseignement extérieur",
        "foreign intelligence",
        "french intelligence"
      ]);
    }
    return false;
  }

  if (a === "DGSI") {
  if (p === "FRANCIA") {
    return contieneAlguno(t, [
      "dgsi",
      "direction generale de la securite interieure",
      "direction générale de la sécurité intérieure",
      "securite interieure",
      "sécurité intérieure",
      "counterintelligence",
      "interior security",
      "antiterrorisme",
      "anti-terrorisme",

      // claves de injerencia / seguridad interna
      "ingerence etrangere",
      "ingérence étrangère",
      "tentative d ingerence",
      "tentative d’ingérence",
      "tentative d'ingerence",
      "interference etrangere",
      "interférence étrangère",
      "foreign interference",
      "foreign influence",
      "roubaix",
      "lfi",
      "candidat",
      "candidate"
    ]);
  }
  return false;
}
  // ======================================================
  // ACRÓNIMOS SIN CONFLICTO IMPORTANTE
  // ======================================================
  return true;
}

function sinDecision() {
  return null;
}

function esContextoCiber(titNorm) {
  const terminosCiber = [
    "cyber", "cyberattack", "cyber attack", "cybercrime", "cyber crime", "cybersecurity",
    "ciber", "ciberataque", "ciber ataque", "cibercrimen", "cibercrimenes",
    "hacker", "hackers", "hacking", "ransomware", "malware", "phishing", "botnet",
    "dark web", "darkweb", "forum", "forums", "breach", "data breach", "leak",
    "stolen data", "spyware"
  ];
  return contieneAlguno(titNorm, terminosCiber);
}

function esOperacionCiber(titNorm) {
  const terminosOperacion = [
    "dismantled", "dismantlement", "takedown", "take down", "shut down", "shutdown",
    "seized", "seizure", "arrested", "arrest", "charged", "indicted", "sanctioned",
    "disrupted", "disruption", "crackdown", "closed", "operation", "international operation", "led operation"
  ];
  return contieneAlguno(titNorm, terminosOperacion);
}

function esActorInstitucionalCiber(titNorm) {
  const actores = [
    "fbi", "cia", "nsa", "doj", "department of justice", "justice department",
    "europol", "interpol", "law enforcement", "international partners", "u.s.", "united states"
  ];
  return contieneAlguno(titNorm, actores);
}

function esRuidoCiberDebil(titNorm) {
  const ruido = ["travel safety tips", "safety tips", "opinion", "editorial", "how to", "guide", "explainer", "review"];
  return contieneAlguno(titNorm, ruido);
}

function esRuidoFbiPolicial(titNorm) {
  const ruido = [
    "campus shooting", "school shooting", "mass shooting", "shooting", "murder", "homicide", "robbery",
    "drug bust", "police response", "response to", "local police", "county sheriff", "sheriff",
    "missing person", "serial killer", "court filing", "trial", "sentencing"
  ];
  return contieneAlguno(titNorm, ruido);
}

function esRuidoFbiPolitico(titNorm) {
  const ruido = [
    "biden", "trump", "kash patel", "susie wiles", "democrats", "republicans", "white house",
    "campaign", "election", "hearing", "partisan", "political attack", "assault on",
  ];
  return contieneAlguno(titNorm, ruido);
}


function esRuidoIntelligenceTecnologica(titNorm) {
  const ruido = [
    "artificial intelligence",
    "machine learning",
    "business intelligence",
    "energy intelligence",
    "market intelligence",
    "customer intelligence",
    "tech analysis",
    "data intelligence",
    "smart intelligence",
    "inteligencia artificial",
    "algoritmos",
    "aprendizaje automatico",
    "aprendizaje automático"
  ];

  const senalesEstatales = [
    "intelligence agency",
    "intelligence service",
    "intelligence ministry",
    "security service",
    "spy",
    "spies",
    "espionage",
    "counterintelligence",
    "foreign agents",
    "mossad",
    "shin bet",
    "cia",
    "fbi",
    "mi5",
    "mi6",
    "bnd",
    "bfv",
    "abin",
    "mss",
    "sbu",
    "ssu",
    "vevak",
    "ministry of intelligence",
    "servizi segreti",
    "verfassungsschutz",
    "department of justice"
  ];

  const excepcionesEstado = [
    "german intelligence",
    "us intelligence",
    "uk intelligence",
    "russian intelligence",
    "israeli intelligence",
    "iranian intelligence",
    "finnish intelligence"
  ];

  const ruidoNormal = contieneAlguno(titNorm, ruido);
  const iaSola = contienePalabraExacta(titNorm, "ia");
  const tieneRuido = ruidoNormal || iaSola;

  return tieneRuido &&
         !contieneAlguno(titNorm, senalesEstatales) &&
         !contieneAlguno(titNorm, excepcionesEstado);
}

function tieneSenalPositivaDura(titNorm, pais, acronimo, nombreLargo) {
  const p = (pais || "").toUpperCase();
  const a = (acronimo || "").toUpperCase();
  const n = normalizarTexto(nombreLargo || "");

  // ===== ALEMANIA / BND / BFV =====
  if (p === "ALEMANIA" || a === "BND" || a === "BFV") {
  if ((a === "BND" || a === "BFV") && !coincidePaisAcronimo(p, a, titNorm)) return false;

  return contieneAlguno(titNorm, [
    "verfassungsschutz",
    "bundesamt fur verfassungsschutz",
    "bfv",
    "bundesnachrichtendienst",
    "bnd",
    "german intelligence"
  ]);
}

  // ===== ITALIA / DIS / AISE / AISI =====
  if (p === "ITALIA" || a === "DIS" || a === "AISE" || a === "AISI") {
  if (a === "DIS" && !coincidePaisAcronimo(p, a, titNorm)) return false;

  return contieneAlguno(titNorm, [
    "servizi segreti",
    "intelligence italiana",
    "dipartimento delle informazioni per la sicurezza",
    "agenzia informazioni e sicurezza esterna",
    "aise",
    "aisi",
    "dis",
    "vittorio rizzi",
    "rizzi"
  ]);
}

  // ===== ISRAEL / MOSSAD / SHIN BET =====
  if (p === "ISRAEL" || a === "MOSSAD" || a === "SHIN BET") {
    return contieneAlguno(titNorm, [
      "mossad", "shin bet", "shabak", "israeli intelligence", "israeli spy", "israeli spies", "espionage"
    ]);
  }

  if (p === "IRAN" || a === "MOIS" || a === "VEVAK" || a === "INTELLIGENCE MINISTRY") {
    return contieneAlguno(titNorm, [
      "intelligence ministry", "iranian intelligence", "ministry of intelligence",
      "spies", "spy", "espionage", "foreign agents", "agents"
    ]);
  }

  return !!(n && titNorm.includes(n));
}

function obtenerPalabrasRadarTematico() {
  return [
    "intelligence", "spy", "espionage", "cyber attack", "security service", "counterintelligence",
    "inteligencia", "espia", "espía", "espionaje", "ciberataque", "servicio de seguridad", "contrainteligencia"
  ];
}

function construirQueryTematica(base) {
  const temas = obtenerPalabrasRadarTematico().map(x => `"${x}"`).join(" OR ");
  return `(${base}) (${temas})`;
}

function obtenerReglas(pais, acronimo) {
  const p = (pais || "").toUpperCase();
  const a = (acronimo || "").toUpperCase();

  // ======================================================
  // BLOQUES POR PAÍS / AGENCIA - REGLAS BASE
  // Buscar siempre por este orden visual:
  // ALEMANIA, AUSTRIA, BOLIVIA, BRASIL, CHILE, CHINA,
  // COLOMBIA, COSTA RICA, ECUADOR, ESPAÑA, ESTADOS UNIDOS,
  // FRANCIA, INDIA, IRÁN, ISRAEL, ITALIA, PAÍSES BAJOS,
  // PERÚ, REINO UNIDO, RUSIA, UCRANIA.
  // ======================================================

  // ===== ALEMANIA / BND / BFV =====
  if (p === "ALEMANIA") {
  return {
    positivos: [
      "bnd",
      "bfv",
      "bundesnachrichtendienst",
      "bundesamt fur verfassungsschutz",
      "verfassungsschutz",
      "german intelligence",
      "german domestic intelligence",
      "domestic intelligence germany",
      "geheimdienst",
      "spionage",
      "espionage",
      "counterintelligence",
      "verfassungsschutzprasident",
      "verfassungsschutz praesident",
      "präsident des verfassungsschutzes",
      "praesident des verfassungsschutzes",
      "sinan selen"
    ],
    negativos: [
      "voter guide",
      "board district",
      "democratic primary",
      "election guide",
      "school board",
      "high school",
      "affordable price",
      "watch review",
      "hodinkee",
      "vintage diver",
      "celebrity",
      "movie",
      "series",
      "fashion",
      "football",
      "soccer",
      "bonds",
      "stocks",
      "nasdaq",
      "etf",
      "seeking alpha",
      "market",
      "investing",
      "shares",
      "stablecoin",
      "crypto",
      "blockchain",
      "liga",
      "schulliga",
      "anmelden",
      "transfer window",
      "sports",
      "daredevil",
      "spider-man",
      "spider man",
      "brand new day",
      "born again",
      "buffy",
      "firefly",
      "bctv",
      "daily dispatch",
      "marvel",
      "comic",
      "comics",
      "tv"
    ]
  };
}

  // ===== AUSTRIA / SIA =====
  if (p === "AUSTRIA" || a === "SIA") {
    return {
      positivos: [
        "sia", "intelligence", "espionage", "spy", "security service", "counterintelligence",
        "austrian intelligence", "inteligencia", "espionaje", "contrainteligencia"
      ],
      negativos: ["tour operator", "ecotourism", "promotion", "travel", "tourism", "hotel", "holiday", "vacation", "airline", "destination"]
    };
  }

  // ===== BOLIVIA / DNI =====
  if (p === "BOLIVIA") {
  return {
    positivos: [
      "dni",
      "direccion nacional de inteligencia",
      "dirección nacional de inteligencia",
      "bolivia",
      "boliviano",
      "boliviana",
      "inteligencia",
      "contrainteligencia",
      "narcotrafico",
      "narcotráfico",
      "financiacion",
      "financiación",
      "cooperacion internacional",
      "cooperación internacional",
      "seguridad",
      "espionaje",
      "servicio de seguridad"
    ],
    negativos: [
      "deportes",
      "celebridad",
      "farándula"
    ]
  };
}

  // ===== BRASIL / ABIN =====
  if (p === "BRASIL" || a === "ABIN") {
    return {
      positivos: [
        "abin", "agencia brasileira de inteligencia", "agência brasileira de inteligência", "inteligencia",
        "inteligência", "espionagem", "abin paralela", "cyber attack", "ciberataque",
        "counterintelligence", "contrainteligencia"
      ],
      negativos: ["futebol", "novela", "celebridade", "show", "festival", "reality show"]
    };
  }

  // ===== CHILE / ANI =====
  if (p === "CHILE") {
  return {
    positivos: [
      "ani",
      "agencia nacional de inteligencia",
      "inteligencia chilena",
      "inteligencia",
      "espionaje",
      "counterintelligence",
      "contrainteligencia",
      "security service",
      "servicio de seguridad",
      "cyber attack",
      "ciberataque"
    ],
    negativos: [
      "deportes",
      "festival",
      "celebridad",
      "show",
      "lady ani",
      "last days of eden",
      "metalcry",
      "vocalista",
      "entrevista",
      "banda"
    ]
  };
}

  // ===== CHINA / MSS =====
  if (p === "CHINA" || a === "MSS") {
    return {
      positivos: [
        "mss", "ministry of state security", "china spies", "chinese spies", "espionage", "spy", "spying",
        "uk", "britain", "british", "united kingdom", "foreign interference", "cyber attack", "ciberataque",
        "inteligencia", "counterintelligence"
      ],
      negativos: ["fashion", "recipe", "sports", "celebrity", "movie", "series"]
    };
  }

  // ===== COLOMBIA / DNI =====
  if (p === "COLOMBIA") {
  return {
    positivos: [
      "dni",
      "direccion nacional de inteligencia",
      "dirección nacional de inteligencia",
      "inteligencia",
      "chuzado",
      "david luna",
      "ivan marquez",
      "iván márquez",
      "rene guarin",
      "rené guarín",
      "director de la dni",
      "testigos electorales",
      "cne",
      "contrainteligencia",
      "seguimiento",
      "espionaje",
      "servicio de seguridad"
    ],
    negativos: [
      "deportes",
      "farándula",
      "celebridad",
      "reality",
      "show",
      "inteligencia artificial",
      "artificial intelligence",
      "aws",
      "nequi",
      "curso",
      "cursos",
      "convocatoria",
      "colombia inteligente",
      "tecnologias cuanticas",
      "tecnologías cuánticas",
      "machine learning"
    ]
  };
}

  // ===== COSTA RICA / DIS =====
  if (p === "COSTA RICA") {
  return {
    positivos: [
      "costa rica",
      "costa rican",
      "costarricense",
      "san jose",
      "san josé",
      "direccion de inteligencia y seguridad",
      "dirección de inteligencia y seguridad",
      "seguridad costarricense",
      "hans sequeira",
      "dis"
    ],
    negativos: [
      "italia",
      "italian intelligence",
      "servizi segreti",
      "aise",
      "aisi",
      "crosetto",
      "mantovano",
      "quirinale",
      "vittorio rizzi",
      "rizzi"
    ]
  };
}

  // ===== ECUADOR / CIES / CNI =====
  if (p === "ECUADOR") {
    return {
      positivos: [
        "cies",
        "cni",
        "centro de inteligencia estrategica",
        "centro de inteligencia estratégica",
        "sistema nacional de inteligencia",
        "inteligencia ecuatoriana",
        "servicios de inteligencia de ecuador",
        "ecuador",
        "ecuatoriano",
        "ecuatoriana",
        "quito",
        "espionaje",
        "contrainteligencia",
        "seguridad"
      ],
      negativos: [
        "centro nacional de inteligencia",
        "inteligencia espanola",
        "inteligencia española",
        "servicios secretos espanoles",
        "servicios secretos españoles",
        "pegasus",
        "cup",
        "cataluna",
        "cataluña",
        "catalan",
        "catalán",
        "barcelona"
      ]
    };
  }

  // ===== ESPAÑA / CNI =====
  if (p === "ESPAÑA") {
  return {
    positivos: [
      "cni",
      "centro nacional de inteligencia",
      "espionaje",
      "inteligencia espanola",
      "inteligencia española",
      "servicios secretos espanoles",
      "servicios secretos españoles",
      "pegasus",
      "cup",
      "counterintelligence",
      "contrainteligencia",
      "security service",
      "ciberseguridad",
      "ciberataque",
      "ciberataques",
      "ccn",
      "ccn-cert",
      "incibe",
      "hacker",
      "hackeo",
      "hackeos",
      "seguridad digital",
      "infraestructura critica",
      "infraestructura crítica",
      "directiva nis",
      "directiva nis2"
    ],
    negativos: [
      "villarejo",
      "telecinco",
      "supervivientes",
      "futbol",
      "fútbol",
      "cine",
      "serie",
      "famoso",
      "inversion",
      "inversión",
      "bilateral",
      "empresas",
      "comercio",
      "camara de comercio",
      "camara",
      "cámara",
      "fortalecer inversion",
      "fortalecer inversión",
      "inteligencia artificial",
      "celebridades",
      "deportes",
      "show"
    ]
  };
  }

  // ===== ESTADOS UNIDOS / CIA =====
  if (a === "CIA") {
    return {
      positivos: [
        "cia", "intelligence", "agency", "drone", "iran", "riyadh", "strike", "kurd",
        "spy", "official", "security", "war", "us intelligence", "intelligence community", "intelligence officials", "us intelligence officials"
      ],
      negativos: ["season", "episode", "mtv", "film", "show", "review", "cast", "trailer"]
    };
  }
  // ===== ESTADOS UNIDOS / FBI =====
  if (a === "FBI") {
    return {
      positivos: [
        "fbi", "investigation", "counterintelligence", "intelligence", "security", "classified",
        "espionage", "probe", "spy", "federal bureau of investigation", "us intelligence", "intelligence community",
        "intelligence officials", "us intelligence officials", 
      ],
      negativos: ["locker room", "hockey team", "aaron rodgers", "party", "celebrating", "slams", "rips", "bad look", "us weekly", "people.com", "mandatory"]
    };
  }

  // ===== FRANCIA / DGSE =====
  /*if (p === "FRANCIA" || a === "DGSE") {
    return {
      positivos: [
        "dgse",
        "direction generale de la securite exterieure",
        "direction générale de la sécurité extérieure",
        "renseignement",
        "services secrets francais",
        "intelligence francais",
        "french intelligence",
        "espionage",
        "spy",
        "counterintelligence"
      ],
      negativos: [
        "cine",
        "festival",
        "celebridad",
        "chroniques du secret",
        "héroines de l'ombre",
        "heroines de l'ombre",
        "héroïnes de l'ombre",
        "seconde guerre mondiale",
        "deuxieme guerre mondiale",
        "deuxième guerre mondiale",
        "transmettrices",
        "operatrices radio",
        "opératrices radio",
        "cryptographes",
        "role essentiel des femmes",
        "rôle essentiel des femmes",
        "memoire",
        "mémoire",
        "commemoration",
        "commémoration"
      ]
    };
  }*/
  
  // ===== INDIA / IB =====
  if (p === "INDIA" || a === "IB") {
    return {
      positivos: [
        "ib", "intelligence bureau", "indian intelligence", "espionage", "counterintelligence",
        "security service", "inteligencia", "espionaje", "contrainteligencia"
      ],
      negativos: ["ib group", "international baccalaureate", "investment banking", "ib diploma", "school", "education"]
    };
  }

  // ===== INDIA / RAW =====
  if (p === "INDIA" || a === "RAW") {
    return {
      positivos: [
        "raw", "research and analysis wing", "indian intelligence", "espionage", "spy",
        "counterintelligence", "operation", "inteligencia", "espionaje", "ciberataque"
      ],
      negativos: ["raw bar", "raw food", "raw mango", "raw milk", "raw material", "raw vegan", "raw deal", "raw beauty", "raw denim"]
    };
  }

  // ===== IRÁN / MOIS / VEVAK =====
  if (p === "IRAN" || a === "MOIS" || a === "VEVAK") {
    return {
      positivos: [
        "intelligence ministry", "ministry of intelligence", "iranian intelligence",
        "spy", "spies", "espionage", "foreign agents", "counterintelligence", "us intelligence"
      ],
      negativos: ["movie", "series", "celebrity", "football", "sports"]
    };
  }
  
  // ----- FALLBACKS Y BLOQUES GENERALES POR PAÍS / AGENCIA -----

  // ===== ISRAEL / MOSSAD / SHIN BET =====
  if (p === "ISRAEL" || a === "MOSSAD" || a === "SHIN BET") {
    return {
      positivos: [
        "mossad", "shin bet", "shabak", "israeli intelligence", "israeli spy", "israeli spies",
        "espionage", "spy", "counterintelligence", "gaza", "iran"
      ],
      negativos: ["movie", "series", "celebrity", "football", "sports"]
    };
  }

  // ===== ITALIA / DIS / AISE / AISI =====
  if (p === "ITALIA") {
  return {
    positivos: [
      "dis",
      "aise",
      "aisi",
      "dipartimento delle informazioni per la sicurezza",
      "agenzia informazioni e sicurezza esterna",
      "agenzia informazioni e sicurezza interna",
      "intelligence italiana",
      "servizi segreti italiani",
      "servizio segreto italiano",
      "italian intelligence",
      "counterintelligence",
      "espionage",
      "spy",
      "spionaggio",
      "sicurezza nazionale"
    ],
    negativos: [
      "revenue",
      "profit",
      "stock",
      "market",
      "trading",
      "tradingview",
      "earnings",
      "financial",
      "shares",
      "investor",
      "guidance",
      "forecast",
      "full-year",
      "economic",
      "quarter",
      "results",
      "nav",
      "bond market",
      "cash flow",

      "made in italy",
      "camara de comercio",
      "cámara de comercio",
      "commercio",
      "imprese italiane",
      "rappresentanza permanente",
      "onu",
      "eventi",
      "incontro",
      "roadshow",
      "community",
      "vetrina",
      "soiree",
      "soirée",
      "vino",
      "spumante",
      "mercati",
      "export",
      "canada",
      "croazia",
      "croatia",
      "luxe",
      "automobile"
    ]
  };
}

  // ===== PAÍSES BAJOS / AIVD / MIVD =====
  if (p === "PAISES BAJOS" || a === "AIVD" || a === "MIVD") {
    return {
      positivos: [
        "aivd", "mivd", "dutch intelligence", "netherlands intelligence", "intelligence", "spy", "espionage",
        "cyber attack", "security service", "counterintelligence", "inteligencia", "espionaje", "ciberataque",
        "servicio de seguridad", "contrainteligencia", "hackers", "journalists", "officials"
      ],
      negativos: ["travel", "tourism", "festival", "celebrity", "movie", "series"]
    };
  }

  // ===== PERÚ / DINI =====
  if (p === "PERU" || a === "DINI") {
    return {
      positivos: [
        "dni", "direccion nacional de inteligencia", "dirección nacional de inteligencia", "escuela de inteligencia", "dni peru", "dni perú",
        "inteligencia", "espionaje", "spy", "counterintelligence", "contrainteligencia", "security service", "inteligencia peruana", "seguridad", "peru", "perú", "peruano", "peruana",
        "servicio de seguridad", "sistema de inteligencia", "servicios de inteligencia", "inteligencia peru", "dini", "servicios de inteligencia del peru", "servicios de inteligencia del perú", 
      ],
      negativos: ["deportes", "farándula", "celebridad", "show", "inteligencia artificial", "artificial intelligence", "transformacion laboral", "transformación laboral", "retail", "mall", "malls", "america malls", "america malls & retail", "empleo", "empleos", "trabajo", "laboral"]
    };
  }

  // ===== REINO UNIDO / MI5 / MI6 =====
  if (a === "MI5" || a === "MI6") {
    return {
      positivos: [
        "mi5", "mi6", "british intelligence", "uk intelligence", "british spy", "british spies",
        "espionage", "spy", "counterintelligence"
      ],
      negativos: [
        "presidential security service", "state security service", "national security service",
        "security service ids", "bukhaksan", "celebrity", "movie", "series"
      ]
    };
  }

  // ===== RUSIA / SVR / FSB =====
  if (p === "RUSIA" || a === "SVR" || a === "FSB") {
    return {
      positivos: [
        "fsb", "svr", "russian intelligence", "russian security", "espionage", "spy",
        "security service", "counterintelligence", "navalny", "agent", "repression",
        "terrorist", "terrorismo", "inteligencia", "servicio de seguridad"
      ],
      negativos: [
        "range rover", "land rover", "sport sv", "svr model", "ultimate edition", "horsepower",
        "v8", "engine", "supercharged", "top gear", "car review", "auto", "motor", "0-60",
        "hiconsumption", "edition", "tribute"
      ]
    };
  }

  // ===== UCRANIA / SBU / SSU =====
  if (p === "UCRANIA" || a === "SBU" || a === "SSU") {
    return {
      positivos: [
        "ssu", "sbu", "ukraine", "ukrainian", "kyiv", "terrorist attack", "russian-linked agent",
        "security service", "counterintelligence", "foils", "foiled", "intelligence", "inteligencia",
        "espionage", "espionaje"
      ],
      negativos: []
    };
  }

  if (p === "VENEZUELA" || a === "SEBIN" || a === "DGCIM") {
    return {
      positivos: [
        "sebin",
        "servicio bolivariano de inteligencia nacional",
        "dgcim",
        "direccion general de contrainteligencia militar",
        "dirección general de contrainteligencia militar",
        "contrainteligencia militar",
        "inteligencia venezolana",
        "espionaje",
        "spy",
        "spying",
        "counterintelligence",
        "helicoide",
        "gustavo gonzalez lopez",
        "gustavo gonzález lópez",
        "ministro de defensa",
        "defense minister",
        "intelligence head"
      ],
      negativos: [
        "show",
        "celebridad",
        "deportes",
        "futbol",
        "entretenimiento"
      ]
    };
  }
  
  return {
    positivos: [],
    negativos: []
  };
}
// EVALUAR BLOQUES
function evaluarBloqueEspanaCNI(ctx) {
  const {
    p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
    mencionaPais, score, categoria, motivoBase, rescatePorSenalesFuertes
  } = ctx;

  if (!(p === "ESPAÑA" && a === "CNI")) return sinDecision();
  if (!coincidePaisAcronimo(p, a, titNorm)) return sinDecision();

  const contextoCNIEspana = contieneAlguno(titNorm, [
    "cni",
    "centro nacional de inteligencia",
    "inteligencia espanola",
    "inteligencia española",
    "servicios secretos espanoles",
    "servicios secretos españoles",
    "pegasus",
    "espionaje",
    "exdiputados de la cup",
    "cup"
  ]);

  const ruidoEspana = contieneAlguno(titNorm, [
    "inteligencia artificial",
    "celebridad",
    "deportes",
    "show",
    "entretenimiento"
  ]);

  if (ruidoEspana) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | España/CNI ruido`
    };
  }

  const valido = !tieneNegativo && (
    identidadNombre ||
    contextoCNIEspana ||
    (identidadAcronimo && contextoCNIEspana) ||
    (mencionaPais && score >= 1 && contextoCNIEspana) ||
    rescatePorSenalesFuertes
  );

  if (!valido) return sinDecision();

  return {
    valido: true,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | España/CNI fuerte`
  };
}

function evaluarBloqueEcuadorCNI_CIES(ctx) {
  const {
    p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
    mencionaPais, score, categoria, motivoBase, rescatePorSenalesFuertes
  } = ctx;

  if (!(p === "ECUADOR" && (a === "CNI" || a === "CIES"))) return sinDecision();

  const contextoEcuador = contieneAlguno(titNorm, [
    "cies",
    "cni",
    "centro de inteligencia estrategica",
    "centro de inteligencia estratégica",
    "sistema nacional de inteligencia",
    "inteligencia ecuatoriana",
    "servicios de inteligencia de ecuador",
    "ecuador",
    "ecuatoriano",
    "ecuatoriana",
    "quito",
    "gobierno de ecuador",
    "seguridad nacional",
    "espionaje",
    "contrainteligencia",
    "seguimiento"
  ]);

  const ruidoPorEspana = contieneAlguno(titNorm, [
    "centro nacional de inteligencia",
    "inteligencia espanola",
    "inteligencia española",
    "servicios secretos espanoles",
    "servicios secretos españoles",
    "pegasus",
    "cup",
    "cataluna",
    "cataluña",
    "barcelona"
  ]);

  const ruidoPorPeru = contieneAlguno(titNorm, [
    "peru",
    "perú",
    "el peruano",
    "peru debate",
    "perú debate"
  ]);

  const ruidoEcuadorNegocio = contieneAlguno(titNorm, [
    "packaging",
    "sector packaging",
    "industria",
    "empresas",
    "corporativo",
    "retail",
    "marketing",
    "innovacion",
    "innovación",
    "negocios",
    "mercado",
    "transformacion digital",
    "transformación digital", 
    "peru debate",
    "perú debate",
    "el peruano",
    "planes de gobierno",
    "seminario",
    "elecciones 2026",
    "fortalecer planes de gobierno"
  ]);

  // Si es claramente una colisión con España, este bloque no decide.
  if (ruidoPorEspana) {
    return sinDecision();
  }

  if (ruidoPorPeru && !contieneAlguno(titNorm, [
  "ecuador",
  "ecuatoriano",
  "ecuatoriana",
  "quito",
  "gobierno de ecuador"
])) {
  return {
    valido: false,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | Ecuador/CNI-CIES colisión con Perú`
  };
}
  // Si es ruido de industria/negocio, hay que descartarlo explícitamente
  // para que no lo rescate la regla general.
  if (ruidoEcuadorNegocio) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Ecuador/CNI-CIES ruido negocio/packaging`
    };
  }

  // Si ni siquiera coincide con la identidad mínima de Ecuador, no decide.
  if (!coincidePaisAcronimo(p, a, titNorm) && !contextoEcuador) {
    return sinDecision();
  }

  const valido = !tieneNegativo && (
    identidadNombre ||
    contextoEcuador ||
    (identidadAcronimo && contextoEcuador) ||
    rescatePorSenalesFuertes
  );

  if (!valido) return sinDecision();

  return {
    valido: true,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | Ecuador/CNI-CIES fuerte`
  };
}

function evaluarBloqueMexicoCNI(ctx) {
  const {
    p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
    mencionaPais, score, categoria, motivoBase, rescatePorSenalesFuertes
  } = ctx;

  if (!(p === "MEXICO" && a === "CNI")) return sinDecision();
  if (!coincidePaisAcronimo(p, a, titNorm)) return sinDecision();

  const contextoMexicoInteligencia = contieneAlguno(titNorm, [
    "mexico",
    "mexicano",
    "mexicana",
    "inteligencia mexicana",
    "seguridad nacional",
    "centro nacional de inteligencia"
  ]);

  const contextoMexicoFuerte = contieneAlguno(titNorm, [
    "cartel",
    "cártel",
    "narcotrafico",
    "narcotráfico",
    "droga",
    "trafico de drogas",
    "tráfico de drogas",
    "tunel",
    "túnel",
    "frontera",
    "crimen organizado",
    "organizacion criminal",
    "organización criminal",
    "operativo",
    "detenido",
    "capturado"
  ]);

  const ruidoMexico = contieneAlguno(titNorm, [
    "celebridad",
    "show",
    "deportes",
    "futbol",
    "entretenimiento"
  ]);

  if (ruidoMexico) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Mexico/CNI ruido`
    };
  }

  const valido = !tieneNegativo && (
    identidadNombre ||
    contextoMexicoInteligencia ||
    (identidadAcronimo && contextoMexicoInteligencia) ||
    (mencionaPais && score >= 2 && (contextoMexicoInteligencia || contextoMexicoFuerte)) ||
    rescatePorSenalesFuertes
  );

  if (!valido) return sinDecision();

  return {
    valido: true,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | Mexico/CNI fuerte`
  };
}

function evaluarBloqueColombiaDNI(ctx) {
  const {
    p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
    mencionaPais, score, categoria, motivoBase, rescatePorSenalesFuertes
  } = ctx;

  if (!(p === "COLOMBIA" && a === "DNI")) return sinDecision();
  if (!coincidePaisAcronimo(p, a, titNorm)) return sinDecision();

  const contextoColombiaDNI = contieneAlguno(titNorm, [
      "direccion nacional de inteligencia",
      "dirección nacional de inteligencia",
      "dni colombia",
      "colombia",
      "inteligencia colombiana",
      "dian",
      "colombianos",
      "colombianas",
      "elecciones presidenciales",
      "hackearon a la dian",
      "chuzado",
      "contrainteligencia",
      "seguimiento",
      "espionaje"
    ]);

  const ruidoBolivia = contieneAlguno(titNorm, [
    "bolivia",
    "boliviano",
    "boliviana"
  ]);

  if (ruidoBolivia && !contieneAlguno(titNorm, [
    "colombia",
    "dian",
    "direccion nacional de inteligencia",
    "dirección nacional de inteligencia"
  ])) {
    return sinDecision();
  }

  const valido = !tieneNegativo && (
    identidadNombre ||
    contextoColombiaDNI ||
    (identidadAcronimo && contextoColombiaDNI) ||
    (mencionaPais && score >= 1 && contextoColombiaDNI) ||
    rescatePorSenalesFuertes
  );

  if (!valido) return sinDecision();

  return {
    valido: true,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | Colombia/DNI fuerte`
  };
}

function evaluarBloqueBoliviaDNI(ctx) {
  const {
    p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
    mencionaPais, score, categoria, motivoBase, rescatePorSenalesFuertes
  } = ctx;

  if (!(p === "BOLIVIA" && a === "DNI")) return sinDecision();

  const contextoBoliviaDNI = contieneAlguno(titNorm, [
    "direccion nacional de inteligencia",
    "dirección nacional de inteligencia",
    "bolivia",
    "boliviano",
    "boliviana",
    "inteligencia boliviana",
    "presidenciales del 31 de mayo",
    "riesgos para las elecciones presidenciales"
  ]);

  const ruidoColombia = contieneAlguno(titNorm, [
    "colombia",
    "colombiano",
    "colombiana",
    "colombianos",
    "colombianas",
    "dian",
    "elecciones presidenciales en colombia",
    "hackearon a la dian",
    "direccion nacional de inteligencia: podrian alterar los datos",
    "dirección nacional de inteligencia: podrían alterar los datos",
    "objetivos electorales"
  ]);

  // 🔴 CLAVE:
  // si estamos en la fila de BOLIVIA/DNI y el título tiene señales fuertes de Colombia,
  // hay que DESCARTAR de forma explícita para que no lo rescate la regla general.
  if (ruidoColombia && !contieneAlguno(titNorm, [
    "bolivia",
    "boliviano",
    "boliviana"
  ])) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Bolivia/DNI colisión con Colombia`
    };
  }

  // Si ni siquiera coincide con Bolivia, este bloque no decide.
  if (!coincidePaisAcronimo(p, a, titNorm) && !contextoBoliviaDNI) {
    return sinDecision();
  }

  const valido = !tieneNegativo && (
    identidadNombre ||
    contextoBoliviaDNI ||
    (identidadAcronimo && contextoBoliviaDNI) ||
    (mencionaPais && score >= 1 && contextoBoliviaDNI) ||
    rescatePorSenalesFuertes
  );

  if (!valido) return sinDecision();

  return {
    valido: true,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | Bolivia/DNI fuerte`
  };
}

function evaluarBloquePeruDNI(ctx) {
  const {
    p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
    mencionaPais, score, categoria, motivoBase, rescatePorSenalesFuertes
  } = ctx;

  if (!(p === "PERU" && a === "DNI")) return sinDecision();

  const contextoPeruDNI = contieneAlguno(titNorm, [
    "direccion nacional de inteligencia",
    "dirección nacional de inteligencia",
    "dni peru",
    "dni perú",
    "inteligencia peruana",
    "servicio de inteligencia del peru",
    "servicio de inteligencia del perú",
    "peru",
    "perú",
    "peruano",
    "peruana"
  ]);

  const ruidoPeruIA = contieneAlguno(titNorm, [
    "inteligencia artificial",
    "artificial intelligence",
    "transformacion laboral",
    "transformación laboral",
    "retail",
    "mall",
    "malls",
    "america malls",
    "america malls & retail",
    "empleo",
    "empleos",
    "trabajo",
    "laboral"
  ]);

  if (ruidoPeruIA) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Peru/DNI ruido AI/retail`
    };
  }

  if (!coincidePaisAcronimo(p, a, titNorm) && !contextoPeruDNI) {
    return sinDecision();
  }

  const valido = !tieneNegativo && (
    identidadNombre ||
    contextoPeruDNI ||
    (identidadAcronimo && contextoPeruDNI) ||
    rescatePorSenalesFuertes
  );

  if (!valido) return sinDecision();

  return {
    valido: true,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | Peru/DNI fuerte`
  };
}

function evaluarBloqueItaliaDIS(ctx) {
  const {
    p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
    mencionaPais, score, categoria, motivoBase, rescatePorSenalesFuertes
  } = ctx;

  if (!(p === "ITALIA" && a === "DIS")) return sinDecision();

  const contextoItaliaDIS = contieneAlguno(titNorm, [
    "dipartimento delle informazioni per la sicurezza",
    "intelligence italiana",
    "servizi segreti italiani",
    "servizio segreto italiano",
    "sicurezza nazionale italiana",
    "intelligence italy",
    "italian intelligence",
    "agenzia informazioni e sicurezza",
    "ai se",
    "ai si",
    "dis italia",
    "italia",
    "italian"
  ]);

  const ruidoFinanciero = contieneAlguno(titNorm, [
    "revenue",
    "profit",
    "stock",
    "shares",
    "market",
    "trading",
    "tradingview",
    "economic",
    "earnings",
    "full-year",
    "forecast",
    "guidance",
    "investor",
    "financial results",
    "financial",
    "quarter",
    "results",
    "nav",
    "bond market",
    "cash flow"
  ]);

  if (ruidoFinanciero) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Italia/DIS ruido financiero`
    };
  }

  if (!coincidePaisAcronimo(p, a, titNorm) && !contextoItaliaDIS) {
    return sinDecision();
  }

  const valido = !tieneNegativo && (
    identidadNombre ||
    contextoItaliaDIS ||
    (identidadAcronimo && contextoItaliaDIS) ||
    rescatePorSenalesFuertes
  );

  if (!valido) return sinDecision();

  return {
    valido: true,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | Italia/DIS fuerte`
  };
}

function evaluarBloqueItaliaAISE(ctx) {
  const {
    p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
    score, categoria, motivoBase, rescatePorSenalesFuertes
  } = ctx;

  if (!(p === "ITALIA" && a === "AISE")) return sinDecision();

  const contextoItaliaAISE = contieneAlguno(titNorm, [
    "aise",
    "agenzia informazioni e sicurezza esterna",
    "intelligence italiana",
    "servizi segreti italiani",
    "servizio segreto italiano",
    "italian intelligence",
    "sicurezza nazionale",
    "espionage",
    "spy",
    "spionaggio"
  ]);

  const ruidoDiplomaticoComercial = contieneAlguno(titNorm, [
    "made in italy",
    "camara de comercio",
    "cámara de comercio",
    "commercio",
    "imprese italiane",
    "rappresentanza permanente",
    "onu",
    "eventi",
    "incontro",
    "roadshow",
    "community",
    "vetrina",
    "soiree",
    "soirée",
    "vino",
    "spumante",
    "mercati",
    "export",
    "canada",
    "croazia",
    "croatia",
    "luxe",
    "automobile"
  ]);

  if (ruidoDiplomaticoComercial) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Italia/AISE ruido diplomático-comercial`
    };
  }

  if (!coincidePaisAcronimo(p, a, titNorm) && !contextoItaliaAISE) {
    return sinDecision();
  }

  const valido = !tieneNegativo && (
    identidadNombre ||
    contextoItaliaAISE ||
    (identidadAcronimo && contextoItaliaAISE) ||
    rescatePorSenalesFuertes
  );

  if (!valido) return sinDecision();

  return {
    valido: true,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | Italia/AISE fuerte`
  };
}

function evaluarBloqueAlemaniaBND(ctx) {
  const {
    p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
    mencionaPais, score, categoria, motivoBase, rescatePorSenalesFuertes
  } = ctx;

  if (!(p === "ALEMANIA" && a === "BND")) return sinDecision();
  if (!coincidePaisAcronimo(p, a, titNorm)) return sinDecision();

  const contextoBND = contieneAlguno(titNorm, [
    "bnd",
    "bundesnachrichtendienst",
    "german intelligence",
    "foreign intelligence",
    "auslandsgeheimdienst",
    "nachrichtendienst",
    "cyberspionage",
    "mini-nsa",
    "cyberzentrum",
    "bonn"
  ]);

  const contextoBFV = contieneAlguno(titNorm, [
    "bfv",
    "verfassungsschutz",
    "bundesamt fur verfassungsschutz",
    "bundesamt für verfassungsschutz",
    "domestic intelligence",
    "contrainteligencia interna",
    "innengeheimdienst"
  ]);

  const ruidoAlemania = contieneAlguno(titNorm, [
    "daredevil",
    "spider-man",
    "spider man",
    "brand new day",
    "born again",
    "buffy",
    "firefly",
    "bctv",
    "daily dispatch",
    "marvel",
    "comic",
    "comics",
    "tv",
    "football",
    "soccer",
    "liga",
    "pokal",
    "school",
    "district",
    "emergency",
    "crypto",
    "token",
    "market",
    "stock"
  ]);

  if (ruidoAlemania) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Alemania/BND ruido`
    };
  }

  // Si el título habla claramente de BFV/Verfassungsschutz y no de BND,
  // este bloque debe descartarlo explícitamente para evitar mezcla interna.
  if (contextoBFV && !contextoBND) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Alemania/BND colisión con BFV`
    };
  }

  const valido = !tieneNegativo && (
    identidadNombre ||
    contextoBND ||
    (identidadAcronimo && contextoBND) ||
    (mencionaPais && score >= 2 && contextoBND) ||
    rescatePorSenalesFuertes
  );

  if (!valido) return sinDecision();

  return {
    valido: true,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | Alemania/BND fuerte`
  };
}

function evaluarBloqueAlemaniaBFV(ctx) {
  const {
    p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
    mencionaPais, score, categoria, motivoBase, rescatePorSenalesFuertes
  } = ctx;

  if (!(p === "ALEMANIA" && a === "BFV")) return sinDecision();
  if (!coincidePaisAcronimo(p, a, titNorm)) return sinDecision();

  const contextoBFV = contieneAlguno(titNorm, [
    "bfv",
    "verfassungsschutz",
    "bundesamt fur verfassungsschutz",
    "bundesamt für verfassungsschutz",
    "domestic intelligence",
    "inland intelligence",
    "contrainteligencia",
    "sabotage und spionage",
    "riesikoappetit",
    "risikoappetit",
    "spy",
    "spies",
    "espias",
    "espías",
    "detienen",
    "detenido",
    "detenidos",
    "arrested",
    "arrest",
    "counterintelligence",
    "russian spy",
    "russian spies",
    "espias rusos",
    "espías rusos"
  ]);

  const fuenteOficialBFV = contieneAlguno(titNorm, [
    "verfassungsschutz.de"
  ]);

  const contextoBND = contieneAlguno(titNorm, [
    "bnd",
    "bundesnachrichtendienst",
    "foreign intelligence",
    "nachrichtendienst",
    "cyberspionage",
    "mini-nsa",
    "cyberzentrum",
    "bonn",
    "germanys bnd",
    "germany's bnd",
    "former vice president",
    "ex vice president",
    "ex-vice president",
    "former head of bnd",
    "former bnd",
    "ex bnd",
    "former intelligence chief"
  ]);

  const ruidoAlemania = contieneAlguno(titNorm, [
    "daredevil",
    "spider-man",
    "spider man",
    "brand new day",
    "born again",
    "buffy",
    "firefly",
    "bctv",
    "daily dispatch",
    "marvel",
    "comic",
    "comics",
    "tv",
    "football",
    "soccer",
    "liga",
    "pokal",
    "school",
    "district",
    "emergency",
    "crypto",
    "token",
    "market",
    "stock"
  ]);

  if (ruidoAlemania) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Alemania/BFV ruido`
    };
  }

  // Si el título habla claramente de BND y no de BFV/Verfassungsschutz,
  // este bloque debe descartarlo explícitamente para evitar mezcla interna.
  if (contextoBND && !contextoBFV) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Alemania/BFV colisión con BND`
    };
  }

  const valido = !tieneNegativo && (
    identidadNombre ||
    contextoBFV ||
    fuenteOficialBFV ||
    (identidadAcronimo && contextoBFV) ||
    (mencionaPais && score >= 2 && contextoBFV) ||
    rescatePorSenalesFuertes
  );

  if (!valido) return sinDecision();

  return {
    valido: true,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | Alemania/BFV fuerte`
  };
}

function evaluarBloqueFranciaDGSE(ctx) {
  const {
    p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
    mencionaPais, score, categoria, motivoBase, rescatePorSenalesFuertes
  } = ctx;

  if (!(p === "FRANCIA" && a === "DGSE")) return sinDecision();
  if (!coincidePaisAcronimo(p, a, titNorm)) return sinDecision();

  const contextoDGSE = contieneAlguno(titNorm, [
    "dgse",
    "direction generale de la securite exterieure",
    "direction générale de la sécurité extérieure",
    "renseignement exterieur",
    "renseignement extérieur",
    "intelligence exterieure",
    "intelligence extérieure",
    "french intelligence",
    "foreign intelligence",
    "espionage",
    "spy"
  ]);

  const contextoDGSI = contieneAlguno(titNorm, [
    "dgsi",
    "direction generale de la securite interieure",
    "direction générale de la sécurité intérieure",
    "securite interieure",
    "sécurité intérieure",
    "interior security",
    "counterintelligence",
    "antiterrorisme",
    "anti-terrorisme",
    "terrorisme"
  ]);

  const ruidoFranciaHistorico = contieneAlguno(titNorm, [
    "chroniques du secret",
    "heroines de l'ombre",
    "héroines de l'ombre",
    "héroïnes de l'ombre",
    "seconde guerre mondiale",
    "deuxieme guerre mondiale",
    "deuxième guerre mondiale",
    "transmettrices",
    "operatrices radio",
    "opératrices radio",
    "cryptographes",
    "role essentiel des femmes",
    "rôle essentiel des femmes",
    "memoire",
    "mémoire",
    "commemoration",
    "commémoration",
    "histoire",
    "historique",
    "chronique",
    "hommage",
    "biographie",
    "profil"
  ]);

  if (ruidoFranciaHistorico) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Francia/DGSE histórico-divulgativo`
    };
  }

  // Si el título es claramente de DGSI y no de DGSE, descartamos para evitar mezcla interna.
  if (contextoDGSI && !contextoDGSE) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Francia/DGSE colisión con DGSI`
    };
  }

  const valido = !tieneNegativo && (
    identidadNombre ||
    contextoDGSE ||
    (identidadAcronimo && contextoDGSE) ||
    (mencionaPais && score >= 2 && contextoDGSE) ||
    rescatePorSenalesFuertes
  );

  if (!valido) return sinDecision();

  return {
    valido: true,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | Francia/DGSE fuerte`
  };
}

function evaluarBloqueFranciaDGSI(ctx) {
  const {
    p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
    mencionaPais, score, categoria, motivoBase, rescatePorSenalesFuertes
  } = ctx;

  if (!(p === "FRANCIA" && a === "DGSI")) return sinDecision();
  if (!coincidePaisAcronimo(p, a, titNorm)) return sinDecision();

  const contextoDGSI = contieneAlguno(titNorm, [
    "dgsi",
    "direction generale de la securite interieure",
    "direction générale de la sécurité intérieure",
    "securite interieure",
    "sécurité intérieure",
    "interior security",
    "counterintelligence",
    "contre-espionnage",
    "contre espionnage",
    "antiterrorisme",
    "anti-terrorisme",
    "terrorisme",
    "radicalisation",

     // 🔥 NUEVO BLOQUE CLAVE
    "ingerence etrangere",
    "ingérence étrangère",
    "tentative d ingerence",
    "tentative d’ingérence",
    "interference etrangere",
    "interférence étrangère",
    "foreign interference",
    "foreign influence",
    "elections",
    "politique",
    "candidate",
    "candidat", 
    "tentative d'ingerence",
    "lfi",
    "roubaix"
  ]);

  const contextoDGSE = contieneAlguno(titNorm, [
    "dgse",
    "direction generale de la securite exterieure",
    "direction générale de la sécurité extérieure",
    "renseignement exterieur",
    "renseignement extérieur",
    "foreign intelligence",
    "espionage",
    "spy"
  ]);

  const ruidoFranciaHistorico = contieneAlguno(titNorm, [
    "chroniques du secret",
    "heroines de l'ombre",
    "héroines de l'ombre",
    "héroïnes de l'ombre",
    "seconde guerre mondiale",
    "deuxieme guerre mondiale",
    "deuxième guerre mondiale",
    "transmettrices",
    "operatrices radio",
    "opératrices radio",
    "cryptographes",
    "role essentiel des femmes",
    "rôle essentiel des femmes",
    "memoire",
    "mémoire",
    "commemoration",
    "commémoration",
    "histoire",
    "historique",
    "chronique",
    "hommage",
    "biographie",
    "profil"
  ]);

  if (ruidoFranciaHistorico) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Francia/DGSI histórico-divulgativo`
    };
  }

  // Si el título es claramente de DGSE y no de DGSI, descartamos para evitar mezcla interna.
  if (contextoDGSE && !contextoDGSI) {
    return {
      valido: false,
      score: score,
      categoria: categoria,
      motivo: `${motivoBase} | Francia/DGSI colisión con DGSE`
    };
  }

  const valido = !tieneNegativo && (
    identidadNombre ||
    contextoDGSI ||
    (identidadAcronimo && contextoDGSI) ||
    (mencionaPais && score >= 2 && contextoDGSI) ||
    rescatePorSenalesFuertes
  );

  if (!valido) return sinDecision();

  return {
    valido: true,
    score: score,
    categoria: categoria,
    motivo: `${motivoBase} | Francia/DGSI fuerte`
  };
}

function detectarCategoria(titNorm, flags) {
  if (flags.includes("ciber") || flags.includes("ciber_operacion") || flags.includes("ciber_actor")) {
    return "Ciberinteligencia";
  }

  if (contieneAlguno(titNorm, [
    "counterintelligence", "contrainteligencia", "foreign agents", "spy ring", "spy network",
    "spies", "arrests spies", "espionage plot", "foiled plot"
  ])) {
    return "Contrainteligencia";
  }

  if (contieneAlguno(titNorm, [
    "submarine cable", "cable submarino", "soberania digital", "soberanía digital", "critical infrastructure", "strategic", "retaliatory attacks",
    "hybrid threats", "sabotage", "security architecture", "digital sovereignty", "critical infrastructure", "infraestructura critica", "infraestructura crítica", 
    "telecommunications infrastructure", "telecom infrastructure", "strategic infrastructure", "satellite network", "5g network", "puerto estrategico", "puerto estratégico"
  ])) {
    return "Seguridad estratégica";
  }

  return "Inteligencia";
}

function evaluarNoticia(titulo, pais, acronimo, nombreLargo) {
  const titNorm = normalizarTexto(titulo);
  const reglas = obtenerReglas(pais, acronimo, nombreLargo);

  // ======================================================
  // EVALUACIÓN CENTRAL
  // 1) Señales generales y scoring
  // 2) Bloques especiales por país/agencia
  // 3) Reglas de fallback por país/agencia
  // ======================================================

  const p = (pais || "").toString().trim().toUpperCase();
  const a = (acronimo || "").toString().trim().toUpperCase();
  const n = normalizarTexto(nombreLargo || "");

  const identidadAcronimo = acronimoCoincide(titNorm, acronimo);
  const identidadNombre = !!(n && titNorm.includes(n));
  const mencionaPais = pais ? tituloMencionaPaisEsperado(titNorm, pais) : false;
  const tienePositivo = contieneAlguno(titNorm, reglas.positivos || []);
  const tieneNegativo = contieneAlguno(titNorm, reglas.negativos || []);
  const ruidoIntelligenceTecnologica = esRuidoIntelligenceTecnologica(titNorm);

  let score = 0;
  const flags = [];

  // ----- SCORING BASE / SEÑALES GENERALES -----
  if (identidadAcronimo) {
    score += 3;
    flags.push("acronimo");
  }

  if (identidadNombre) {
    score += 4;
    flags.push("nombre");
  }

  if (mencionaPais) {
    score += 1;
    flags.push("pais");
  }

  if (tienePositivo) {
    score += 2;
    flags.push("positivo");
  }

  if (tieneNegativo) {
    score -= 4;
    flags.push("negativo");
  }

  const contextoCiber = esContextoCiber(titNorm);
  const operacionCiber = esOperacionCiber(titNorm);
  const actorInstitucionalCiber = esActorInstitucionalCiber(titNorm);
  const ruidoCiberDebil = esRuidoCiberDebil(titNorm);

  if (contextoCiber) {
    score += 1;
    flags.push("ciber");
  }

  if (contextoCiber && operacionCiber) {
    score += 1;
    flags.push("ciber_operacion");
  }

  if (contextoCiber && actorInstitucionalCiber) {
    score += 1;
    flags.push("ciber_actor");
  }

  if (ruidoCiberDebil && contextoCiber && !operacionCiber) {
    score -= 1;
    flags.push("ciber_ruido");
  }

  const radarTematico = contieneAlguno(titNorm, [
    "intelligence", "intel", "spy", "spies", "espionage", "counterintelligence",
    "security service", "secret service", "cyber attack", "cyberattack", "cybercrime",
    "ciberataque", "cibercrimen", "hacker", "hackers", "ransomware", "botnet", "malware",
    "dark web", "inteligencia", "espionaje", "contrainteligencia", "servicio de seguridad",
    "agencia de inteligencia"
  ]);

  if (radarTematico) {
    score += 1;
    flags.push("radar");
  }

  
  if (ruidoIntelligenceTecnologica) {
    score -= 3;
    flags.push("ruido_ai");
  }

  const senalPositivaDura = tieneSenalPositivaDura(titNorm, pais, acronimo, nombreLargo);
  const rescatePorSenalesFuertes =
    !tieneNegativo && (
      (senalPositivaDura && score >= 4) ||
      (senalPositivaDura && flags.includes("positivo")) ||
      (senalPositivaDura && flags.includes("radar")) ||
      (identidadAcronimo && score >= 4) ||
      (identidadNombre && score >= 4)
    );

  const ciberFuerte =
    !tieneNegativo &&
    contextoCiber && (
      (operacionCiber && actorInstitucionalCiber) ||
      (operacionCiber && score >= 3)
    );

    const flagsTxt = flags.length ? flags.join(",") : "sin_senales";
    const motivoBase = `score=${score} | flags=${flagsTxt}`;
    const categoria = detectarCategoria(titNorm, flags);

    if (esAcronimoAmbiguo(a) && !identidadNombre && !mencionaPais && !tienePositivo) {
      return { valido: false, score: score, categoria: categoria, motivo: `${motivoBase} | acrónimo ambiguo sin contexto` };
    }

    if (ciberFuerte) {
      return { valido: true, score: score, categoria: categoria, motivo: `${motivoBase} | Ciberinteligencia fuerte` };
    }


    // ======================================================
    // BLOQUES ESPECIALES POR PAÍS / AGENCIA
    // Orden alfabético para editar sin cruzar países.
    // ======================================================
    const ctx = {
      p, a, titNorm, tieneNegativo, identidadNombre, identidadAcronimo,
      mencionaPais, score, categoria, motivoBase, rescatePorSenalesFuertes
    };

    let decision = evaluarBloqueEspanaCNI(ctx);
    if (decision) return decision;

    decision = evaluarBloqueEcuadorCNI_CIES(ctx);
    if (decision) return decision;

    decision = evaluarBloqueMexicoCNI(ctx);
    if (decision) return decision;

    decision = evaluarBloqueColombiaDNI(ctx);
    if (decision) return decision;

    decision = evaluarBloqueBoliviaDNI(ctx);
    if (decision) return decision;

    decision = evaluarBloquePeruDNI(ctx);
    if (decision) return decision;

    decision = evaluarBloqueItaliaDIS(ctx);
    if (decision) return decision;

    decision = evaluarBloqueItaliaAISE(ctx);
    if (decision) return decision;

    decision = evaluarBloqueAlemaniaBND(ctx);
    if (decision) return decision;

    decision = evaluarBloqueAlemaniaBFV(ctx);
    if (decision) return decision;

    decision = evaluarBloqueFranciaDGSE(ctx);
    if (decision) return decision;

    decision = evaluarBloqueFranciaDGSI(ctx);
    if (decision) return decision;
  
  // ===== ALEMANIA / BND / BFV =====
  /*if (p === "ALEMANIA" && (a === "BND" || a === "BFV")) {

    const contextoAlemaniaFuerte = contieneAlguno(titNorm, [
      "bundesnachrichtendienst",
      "bundesamt fur verfassungsschutz",
      "verfassungsschutz",
      "german intelligence",
      "german domestic intelligence",
      "domestic intelligence germany",
      "geheimdienst",
      "espionage",
      "counterintelligence",
      "spying",
      "spy"
    ]);

    const mencionaAlemania = contieneAlguno(titNorm, [
      "germany",
      "alemania",
      "german"
    ]);

    const ruidoAlemania = contieneAlguno(titNorm, [
      // deportes
      "pokal",
      "liga",
      "verbandspokal",
      "football",
      "soccer",
      "match",

      // educación / local
      "school",
      "high school",
      "student",
      "district",
      "emergency",
      "county",

      // finanzas / crypto
      "crypto",
      "token",
      "convert",
      "usd",
      "price",
      "market",
      "trading",
      "stock",

      // genéricos no inteligencia
      "association",
      "club",
      "foundation"
    ]);

    const siglaSinContexto = identidadAcronimo && !contextoAlemaniaFuerte;

    if (ruidoAlemania || siglaSinContexto) {
      return {
        valido: false,
        score: score,
        categoria: categoria,
        motivo: `${motivoBase} | Alemania ruido o sigla sin contexto`
      };
    }

    const valido = !tieneNegativo && (
      identidadNombre ||
      (identidadAcronimo && contextoAlemaniaFuerte) ||
      contextoAlemaniaFuerte ||
      (mencionaAlemania && score >= 4 && contextoAlemaniaFuerte) ||
      rescatePorSenalesFuertes
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | Alemania fuerte`
        : `${motivoBase} | Alemania débil`
    };
  }*/
  
  // ===== ALEMANIA / BND / BFV =====
  /*if (p === "ALEMANIA" || a === "BND" || a === "BFV") {
    const esBFV = a === "BFV" || n.includes("verfassungsschutz");
    const esBND = a === "BND" || n.includes("bundesnachrichtendienst");

    const identidadBFVNombre = contieneAlguno(titNorm, ["verfassungsschutz", "bundesamt fur verfassungsschutz"]);
    const identidadBFVAcronimo = contieneAlguno(titNorm, ["bfv"]);
    const identidadBNDNombre = contieneAlguno(titNorm, ["bundesnachrichtendienst", "german intelligence"]);
    const identidadBNDAcronimo = contieneAlguno(titNorm, ["bnd"]);
     const ruidoAlemaniaBlanda = contieneAlguno(titNorm, [
      "netflix",
      "serie",
      "series",
      "tv series",
      "videobotschaft",
      "berufsverbot"
    ]);
     
     if (ruidoAlemaniaBlanda) {
        return {
          valido: false,
          score: score,
          categoria: categoria,
          motivo: `${motivoBase} | Alemania ruido cultural/editorial`
        };
      }
    const ruidoFinancieroAlemania = contieneAlguno(titNorm, [
      "stablecoin",
      "crypto",
      "cryptocurrency",
      "blockchain",
      "token",
      "defi",
      "long/short",
      "stock traders daily",
      "bnd:ca",
      "report (bnd:ca)",
      "ticker"
    ]);

    if (ruidoFinancieroAlemania) {
      return {
        valido: false,
        score,
        categoria: "Inteligencia",
        motivo: `${motivoBase} | Alemania ruido financiero`
      };
    }

   
    const contextoAlemaniaFuerte = contieneAlguno(titNorm, [
      "geheimdienst", "spionage", "espionage", "counterintelligence", "russian spy", "russian spies", "sabotage", "mehr spione", "martin jager", "martin jaeger", "kreml", "russische wirtschaft", "russian economy"
    ]);

    const contextoAlemaniaMedio = contieneAlguno(titNorm, [
      "germany", "german", "domestic intelligence", "intelligence service", "intel service",
      "intel services", "privacy watchdog", "privacy chief"
    ]);

   

    let scoreLocal = score;
    const flagsLocal = flags.slice();

    if (identidadBFVNombre && !flagsLocal.includes("verfassungsschutz")) {
      scoreLocal += 3;
      flagsLocal.push("verfassungsschutz");
    }
    if (identidadBFVAcronimo && !flagsLocal.includes("bfv")) {
      scoreLocal += 1;
      flagsLocal.push("bfv");
    }
    if (identidadBNDNombre && !flagsLocal.includes("bnd_nombre")) {
      scoreLocal += 3;
      flagsLocal.push("bnd_nombre");
    }
    if (identidadBNDAcronimo && !flagsLocal.includes("bnd")) {
      scoreLocal += 1;
      flagsLocal.push("bnd");
    }

    const motivoBaseLocal = `score=${scoreLocal} | flags=${flagsLocal.length ? flagsLocal.join(",") : "sin_senales"}`;

    let valido = false;

    if (esBFV) {
      valido = !tieneNegativo && (
        identidadBFVNombre ||
        (identidadBFVAcronimo && contextoAlemaniaFuerte) ||
        (identidadBFVAcronimo && scoreLocal >= 4) ||
        (mencionaPais && identidadBFVNombre) ||
        (mencionaPais && contextoAlemaniaFuerte && scoreLocal >= 4) ||
        (senalPositivaDura && scoreLocal >= 4)
      );
    } else if (esBND) {
      valido = !tieneNegativo && (
        identidadBNDNombre ||
        (identidadBNDAcronimo && contextoAlemaniaFuerte) ||
        (identidadBNDAcronimo && scoreLocal >= 3) ||
        (mencionaPais && identidadBNDNombre) ||
        (mencionaPais && contextoAlemaniaFuerte && scoreLocal >= 3) ||
        (senalPositivaDura && scoreLocal >= 4)
      );
    } else {
      valido = !tieneNegativo && (
        contextoAlemaniaFuerte ||
        (contextoAlemaniaMedio && scoreLocal >= 4 && (mencionaPais || identidadAcronimo || identidadNombre)) ||
        (senalPositivaDura && scoreLocal >= 4)
      );
    }

    return {
      valido: valido,
      score: scoreLocal,
      categoria: detectarCategoria(titNorm, flagsLocal),
      motivo: valido ? `${motivoBaseLocal} | Alemania fuerte` : `${motivoBaseLocal} | Alemania ruido o contexto débil`
    };
  }*/

  // ===== CHILE / ANI =====
  if (p === "CHILE" && a === "ANI") {
    const identidadANI = contieneAlguno(titNorm, [
      "agencia nacional de inteligencia",
      "inteligencia chilena"
    ]);

    const mencionaANIExacta = contienePalabraExacta(titNorm, "ani");

    const contextoANIChile = contieneAlguno(titNorm, [
      "agencia nacional de inteligencia",
      "inteligencia chilena",
      "director de la ani",
      "nuevo director de la ani",
      "jefe de la ani",
      "director ani",
      "servicios de inteligencia de chile",
      "contrainteligencia chilena",
      "espionaje en chile"
    ]);

    const ruidoANI = contieneAlguno(titNorm, [
      "ani pharmaceuticals",
      "inteligencia artificial",
      "geoespacial",
      "investing.com",
      "esri chile",
      "lady ani",
      "last days of eden",
      "metalcry",
      "vocalista",
      "entrevista",
      "banda",
      "grupo de metal"
    ]);

    const valido = !tieneNegativo && !ruidoANI && (
      identidadANI ||
      (mencionaANIExacta && contextoANIChile)
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | Chile ANI fuerte`
        : `${motivoBase} | Chile ANI ruido o contexto débil`
    };
  }

  // ===== COLOMBIA / DNI =====
  /*if (p === "COLOMBIA" && a === "DNI") {

    const contextoDNIColombia = contieneAlguno(titNorm, [
      "direccion nacional de inteligencia",
      "dirección nacional de inteligencia",
      "director de la dni",
      "dni colombia",
      "inteligencia colombiana",
      "contrainteligencia",
      "espionaje",
      "seguimiento",
      "chuzado",
      "servicio de seguridad"
    ]);

    const ruidoColombiaIA = contieneAlguno(titNorm, [
      "inteligencia artificial",
      "artificial intelligence",
      "aws",
      "nequi",
      "curso",
      "cursos",
      "convocatoria",
      "colombia inteligente",
      "tecnologias cuanticas",
      "tecnologías cuánticas",
      "machine learning"
    ]);

    if (ruidoColombiaIA) {
      return {
        valido: false,
        score: score,
        categoria: categoria,
        motivo: `${motivoBase} | Colombia ruido AI/tech`
      };
    }

    const valido = !tieneNegativo && !ruidoColombiaIA && (
      identidadNombre ||
      (identidadAcronimo && contextoDNIColombia) ||
      contextoDNIColombia ||
      (mencionaPais && score >= 4 && contextoDNIColombia) ||
      rescatePorSenalesFuertes
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | Colombia fuerte`
        : `${motivoBase} | Colombia ruido o contexto débil`
    };
  }*/

  // ===== COSTA RICA / DIS =====
  if (p === "COSTA RICA" && a === "DIS") {
    const contextoCostaRica = contieneAlguno(titNorm, [
      "costa rica", "costa rican", "costarricense", "san jose", "san josé",
      "direccion de inteligencia y seguridad", "dirección de inteligencia y seguridad",
      "seguridad costarricense", "hans sequeira"
    ]);

    const contextoItaliano = contieneAlguno(titNorm, [
      "italia", "italian intelligence", "servizi segreti", "aise", "aisi",
      "crosetto", "mantovano", "quirinale", "vittorio rizzi", "rizzi"
    ]);

    const contextoDirectivoDIS = contieneAlguno(titNorm, [
      "director de la dis",
      "exdirector de la dis",
      "ex director de la dis",
      "jefe de la dis",
      "exjefe de la dis",
      "ex jefe de la dis",
      "direccion de inteligencia y seguridad",
      "dirección de inteligencia y seguridad"
    ]);

    const contextoSensitivoCR = contieneAlguno(titNorm, [
      "extradicion",
      "extradición",
      "narcotrafico",
      "narcotráfico",
      "corrupcion",
      "corrupción",
      "causa penal",
      "investigacion",
      "investigación",
      "acusado",
      "imputado",
      "captura",
      "detenido",
      "juicio"
    ]);

    const valido = !tieneNegativo && !contextoItaliano && (
      identidadNombre ||
      (identidadAcronimo && contextoCostaRica) ||
      (contextoDirectivoDIS && contextoCostaRica) ||
      (contextoDirectivoDIS && contextoSensitivoCR) ||
      (mencionaPais && score >= 4)
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | Costa Rica/DIS fuerte`
        : `${motivoBase} | Costa Rica/DIS ruido o colisión con Italia`
    };
  }

  // ===== ECUADOR / CIES / CNI =====
  if (p === "ECUADOR" && (a === "CIES" || a === "CNI")) {

    const contextoEcuadorCIES = contieneAlguno(titNorm, [
      "cies",
      "centro de inteligencia estrategica",
      "centro de inteligencia estratégica",
      "sistema nacional de inteligencia",
      "ecuador",
      "ecuatoriano",
      "ecuatoriana",
      "quito"
    ]);

    const ruidoEcuadorPorCNI_Espana = contieneAlguno(titNorm, [
      "centro nacional de inteligencia",
      "cni españa",
      "pegasus",
      "cup",
      "cataluna",
      "cataluña",
      "catalan",
      "catalán"
    ]);

    if (ruidoEcuadorPorCNI_Espana) {
      return {
        valido: false,
        score: score,
        categoria: categoria,
        motivo: `${motivoBase} | Ecuador/CIES colisión con CNI España`
      };
    }

    const valido = !tieneNegativo && (
      identidadNombre ||
      contextoEcuadorCIES ||
      (identidadAcronimo && contextoEcuadorCIES) ||
      (mencionaPais && score >= 4 && contextoEcuadorCIES) ||
      rescatePorSenalesFuertes
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | Ecuador/CIES fuerte`
        : `${motivoBase} | Ecuador/CIES ruido o contexto débil`
    };
  }

  // ===== ESTADOS UNIDOS / FBI =====
  if (a === "FBI") {
    const contextoFBI = contieneAlguno(titNorm, [
      "fbi", "federal bureau of investigation", "counterintelligence", "espionage", "spy", "terrorism", "terrorist", "terror investigation", "counterterrorism",
      "cyber attack", "cyberattack", "cybercrime", "hacker", "hackers", "ransomware",
      "botnet", "dark web", "malware", "phishing", "classified", "national security",
      "foreign interference", "intelligence"
    ]);

    const ruidoPolicial = esRuidoFbiPolicial(titNorm);
    const ruidoPolitico = esRuidoFbiPolitico(titNorm);

    const valido = !tieneNegativo && !ruidoPolicial && !ruidoPolitico && (
      identidadAcronimo ||
      identidadNombre ||
      contextoFBI ||
      ciberFuerte
    );

    let motivoExtra = "FBI ruido o contexto débil";
    if (ruidoPolicial) motivoExtra = "FBI ruido policial";
    if (ruidoPolitico) motivoExtra = "FBI ruido político";
    if (valido) motivoExtra = "FBI fuerte";

    return { valido: valido, score: score, categoria: categoria, motivo: `${motivoBase} | ${motivoExtra}` };
  }
  // ===== ESTADOS UNIDOS / NSA =====
  if (a === "NSA") {
    const contextoNSA = contieneAlguno(titNorm, [
      "nsa",
      "national security agency",
      "cyber command",
      "cybercom",
      "signals intelligence",
      "sigint",
      "us cyber command"
    ]);

    const valido = !tieneNegativo && (
      identidadNombre ||
      identidadAcronimo ||
      contextoNSA ||
      (mencionaPais && score >= 3) ||
      rescatePorSenalesFuertes
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
      ? `${motivoBase} | NSA fuerte`
      : `${motivoBase} | NSA ruido o contexto débil`
    };
  }
  // ----- FALLBACKS Y BLOQUES GENERALES POR PAÍS / AGENCIA -----

  // ===== FRANCIA / DGSE =====
  /*if (p === "FRANCIA" && a === "DGSE") {

    const contextoFranciaOperativo = contieneAlguno(titNorm, [
      "espionage",
      "spy",
      "counterintelligence",
      "renseignement",
      "french intelligence",
      "services secrets francais",
      "operation",
      "opération",
      "cyber attack",
      "ciberataque"
    ]);

    const ruidoFranciaHistorico = contieneAlguno(titNorm, [
      "chroniques du secret",
      "heroines de l'ombre",
      "héroines de l'ombre",
      "héroïnes de l'ombre",
      "seconde guerre mondiale",
      "deuxieme guerre mondiale",
      "deuxième guerre mondiale",
      "transmettrices",
      "operatrices radio",
      "opératrices radio",
      "cryptographes",
      "role essentiel des femmes",
      "rôle essentiel des femmes",
      "memoire",
      "mémoire",
      "commemoration",
      "commémoration"
    ]);

    if (ruidoFranciaHistorico) {
      return {
        valido: false,
        score: score,
        categoria: categoria,
        motivo: `${motivoBase} | Francia/DGSE histórico-divulgativo`
      };
    }

    const valido = !tieneNegativo && !ruidoFranciaHistorico && (
      identidadNombre ||
      (identidadAcronimo && contextoFranciaOperativo) ||
      (mencionaPais && score >= 4 && contextoFranciaOperativo) ||
      rescatePorSenalesFuertes
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | Francia/DGSE fuerte`
        : `${motivoBase} | Francia/DGSE ruido o contexto débil`
    };
  }*/


  // ======================================================
  // FALLBACKS POR PAÍS / AGENCIA
  // Orden alfabético para edición y mantenimiento.
  // ======================================================

  // ===== AUSTRIA / SIA =====
  if (p === "AUSTRIA" || a === "SIA") {
    const contextoAustria = contieneAlguno(titNorm, [
      "sia", "state intelligence agency", "austrian intelligence", "espionage", "counterintelligence"
    ]);

    const valido = !tieneNegativo && (
      identidadNombre || identidadAcronimo || contextoAustria || (mencionaPais && score >= 4)
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido ? `${motivoBase} | Austria fuerte` : `${motivoBase} | Austria ruido o contexto débil`
    };
  }

  // ===== BRASIL / ABIN =====
  if (p === "BRASIL" || a === "ABIN") {
    const contextoBrasil = contieneAlguno(titNorm, [
      "abin", "agencia brasileira de inteligencia", "brazilian intelligence", "intelligence agency",
      "espionage", "spy", "counterintelligence", "abin paralela"
    ]);

    const valido = !tieneNegativo && (
      identidadNombre || identidadAcronimo || contextoBrasil || (mencionaPais && score >= 4)
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido ? `${motivoBase} | Brasil fuerte` : `${motivoBase} | Brasil ruido o contexto débil`
    };
  }

  // ===== ECUADOR / CNI / CIES =====
  /*if (p === "ECUADOR" || a === "CNI" || a === "CIES") {
    const contextoEcuador = contieneAlguno(titNorm, [
      "cni",
      "cies",
      "ecuador",
      "inteligencia",
      "espionaje",
      "counterintelligence",
      "contrainteligencia",
      "farc",
      "campamento",
      "ataque",
      "entrenamiento",
      "disidencias",
      "operacion",
      "operación",
      "security service",
      "servicio de seguridad"
    ]);
  
    if (ruidoIntelligenceTecnologica) {
      return {
        valido: false,
        score: score,
        categoria: categoria,
        motivo: `${motivoBase} | Ecuador ruido AI`
      };
    }

    const valido = !tieneNegativo && !ruidoIntelligenceTecnologica && (
      identidadNombre ||
      (identidadAcronimo && contextoEcuador) ||
      contextoEcuador ||
      (mencionaPais && score >= 4) ||
      rescatePorSenalesFuertes
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | Ecuador fuerte`
        : `${motivoBase} | Ecuador ruido o contexto débil`
    };
  }*/
    // ===== CHINA / MSS =====
  if (p === "CHINA" && a === "MSS") {

    const ruidoChinaCultural = contieneAlguno(titNorm, [
      "thriller",
      "film",
      "movie",
      "series",
      "tv series",
      "documentary",
      "novel",
      "book"
    ]);

    const contextoChina = contieneAlguno(titNorm, [
      "mss",
      "ministry of state security",
      "chinese intelligence",
      "china intelligence",
      "state security"
    ]);

    const valido = !tieneNegativo && !ruidoChinaCultural && (
      identidadNombre ||
      identidadAcronimo ||
      contextoChina ||
      (mencionaPais && score >= 4)
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | China/MSS fuerte`
        : `${motivoBase} | China ruido cultural o contexto débil`
    };
  }

  // ===== ESPAÑA / CNI =====
  /*if (p === "ESPAÑA" && a === "CNI") {
    const contextoEspana = contieneAlguno(titNorm, [
      "espana",
      "españa",
      "espanol",
      "español",
      "espanola",
      "española",
      "madrid",
      "defensa",
      "ministerio de defensa",
      "jueces espanoles",
      "jueces españoles",
      "fiscales espanoles",
      "fiscales españoles",
      "militares espanoles",
      "militares españoles",
      "pegasus"
    ]);

    const contextoLatamCNI = contieneAlguno(titNorm, [
      "mexico",
      "méxico",
      "mexican",
      "sedena",
      "guardia nacional",
      "claudia sheinbaum",
      "andres manuel lopez obrador",
      "amlo",
      "ecuador",
      "noboa",
      "ecuadorian",
      "ecuadorian intelligence"
    ]);

    const identidadCNI = contieneAlguno(titNorm, [
      "centro nacional de inteligencia",
      "spanish intelligence"
    ]) || contienePalabraExacta(titNorm, "cni");

    const valido = !tieneNegativo && !contextoLatamCNI && (
      identidadNombre ||
      (identidadCNI && contextoEspana) ||
      (mencionaPais && score >= 4)
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | España CNI fuerte`
        : `${motivoBase} | España CNI ruido o colisión externa`
    };
  }*/

  // ===== ESTADOS UNIDOS / CIA =====
  if (a === "CIA") {
    const contextoCIA = contieneAlguno(titNorm, [
      "cia", "central intelligence agency", "us intelligence", "american intelligence",
      "espionage", "spy", "counterintelligence"
    ]);

    const ruidoEditorialCIA = contieneAlguno(titNorm, [
      "travel tips", "safety tips", "career advice", "life advice", "opinion", "commentary"
    ]);

    if (ruidoEditorialCIA && score < 4) {
      return {
        valido: false,
        score: score,
        categoria: categoria,
        motivo: `${motivoBase} | CIA contenido editorial`
      };
    }

    const valido = !tieneNegativo && (
      identidadAcronimo || identidadNombre || contextoCIA || ciberFuerte
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido ? `${motivoBase} | CIA fuerte` : `${motivoBase} | CIA ruido o contexto débil`
    };
  }
  // ===== FRANCIA / DGSE =====
  /*if (p === "FRANCIA" || a === "DGSE") {
    const contextoFrancia = contieneAlguno(titNorm, [
      "dgse",
      "direction generale de la securite exterieure",
      "direction générale de la sécurité extérieure",
      "french intelligence",
      "renseignement",
      "services secrets francais",
      "services secrets français",
      "espionage",
      "spy",
      "counterintelligence",
      "mali"
    ]);
  
    const ruidoFranciaInstitucional = contieneAlguno(titNorm, [
      "salon carrieres defense",
      "salon carrières défense",
      "carrières défense",
      "printemps des poetes",
      "printemps des poètes",
      "ecrit sur le mur",
      "écrit sur le mur",
      "communique",
      "communiqué",
      "au salon",
      "nous parle",
      "entretien",
      "interview"
    ]);

    const excepcionFranciaValida = contieneAlguno(titNorm, [
      "nomme",
      "nommé",
      "nommee",
      "nommée",
      "directeur",
      "director",
      "chef",
      "operations",
      "opérations",
      "espionnage",
      "espionage",
      "contre-espionnage",
      "counterintelligence",
      "recrutement",
      "recruter",
      "rejoindre",
      "join"
    ]);
    if (ruidoFranciaInstitucional && !excepcionFranciaValida) {
      return {
        valido: false,
        score: score,
        categoria: categoria,
        motivo: `${motivoBase} | Francia institucional/promocional`
      };
    }
  
    const valido = !tieneNegativo && (
      identidadNombre ||
      (identidadAcronimo && contextoFrancia) ||
      contextoFrancia ||
      (mencionaPais && score >= 4) ||
      rescatePorSenalesFuertes
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | Francia fuerte`
        : `${motivoBase} | Francia ruido o contexto débil`
    };
  }*/
  // ===== INDIA / IB =====
  if (p === "INDIA" || a === "IB") {
    const contextoIB = contieneAlguno(titNorm, [
      "intelligence bureau", "indian intelligence", "counterintelligence", "espionage", "spy"
    ]);

    const valido = !tieneNegativo && (
      identidadNombre || contextoIB || (mencionaPais && score >= 4)
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido ? `${motivoBase} | India/IB fuerte` : `${motivoBase} | India/IB ruido o contexto débil`
    };
  }

  // ===== INDIA / RAW =====
  if (p === "INDIA" || a === "RAW") {
    const contextoRAW = contieneAlguno(titNorm, [
      "raw", "research and analysis wing", "indian intelligence", "espionage", "spy", "counterintelligence"
    ]);

    const valido = !tieneNegativo && (
      identidadNombre || identidadAcronimo || contextoRAW || (mencionaPais && score >= 4)
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido ? `${motivoBase} | India/RAW fuerte` : `${motivoBase} | India/RAW ruido o contexto débil`
    };
  }

  // ===== IRÁN / MOIS / VEVAK =====
  if (p === "IRAN" || a === "MOIS" || a === "VEVAK") {
    const contextoIran = contieneAlguno(titNorm, [
      "intelligence ministry", "ministry of intelligence", "iranian intelligence", "spy", "spies", "espionage", "foreign agents", "counterintelligence", "us intelligence",
      "iran espionage", "espionaje iran", "inteligencia iran", "intelligence on iran", "shared intelligence", "sharing intelligence", "drone tactics", "advice", "military asset",
      "military assets", "target us forces", "attacks by iran", "retaliatory attacks"
    ]);

    const valido = !tieneNegativo && (
      identidadNombre ||
      identidadAcronimo ||
      contextoIran ||
      (mencionaPais && score >= 3 && flags.includes("radar")) ||
      (mencionaPais && score >= 4) ||
      rescatePorSenalesFuertes
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido ? `${motivoBase} | Irán fuerte` : `${motivoBase} | Irán ruido o contexto débil`
    };
  }
  // ===== ISRAEL / MOSSAD / SHIN BET =====
  if (p === "ISRAEL" || a === "MOSSAD" || a === "SHIN BET") {
    const contextoIsrael = contieneAlguno(titNorm, [
      "mossad", "shin bet", "shabak", "israeli intelligence", "israeli spy", "israeli spies", "espionage", "spy", "counterintelligence", "israeli intelligence", 
      "israeli espionage", "israeli spy", "espionaje israeli", "inteligencia israeli"
    ]);

    const valido = !tieneNegativo && (
      identidadNombre || identidadAcronimo || contextoIsrael || (mencionaPais && score >= 4) || rescatePorSenalesFuertes
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido ? `${motivoBase} | Israel fuerte` : `${motivoBase} | Israel ruido o contexto débil`
    };
  }

  // ===== ITALIA / DIS / AISE / AISI =====
  if (p === "ITALIA" || a === "DIS" || a === "AISE" || a === "AISI") {
    const contextoItalia = contieneAlguno(titNorm, [
      "servizi segreti",
      "servizio segreto",
      "intelligence italiana",
      "italian intelligence",
      "dipartimento delle informazioni per la sicurezza",
      "agenzia informazioni e sicurezza esterna",
      "agenzia informazioni e sicurezza interna",
      "espionage",
      "spy",
      "counterintelligence",
      "sicurezza nazionale",
      "sicurezza dello stato",
      "vittorio rizzi",
      "crosetto",
      "mantovano",
      "rapporto dis",
      "dipartimento delle informazioni per la sicurezza",
      "narcotraffico internazionale",
      "ndrangheta"
    ]);

    const ruidoItaliaNoIntel = contieneAlguno(titNorm, [
      "rimborsi",
      "sicilia",
      "sanita",
      "sanità",
      "agenasalute",
      "tariffario",
      "regioni",
      "consulta", 
      "semana del",
      "curso 2025/2026",
      "adjudicaciones",
      "interinos",
      "csif"
    ]);

    if (ruidoItaliaNoIntel && !contextoItalia) {
      return {
        valido: false,
        score: score,
        categoria: "Inteligencia",
        motivo: `${motivoBase} | Italia ruido sectorial`
      };
    }

    const valido = !tieneNegativo && (
      identidadNombre ||
      (identidadAcronimo && contextoItalia) ||
      contextoItalia ||
      (mencionaPais && score >= 4 && contextoItalia) ||
      rescatePorSenalesFuertes
    );

    return {
      valido: valido,
      score: score,
      categoria: "Inteligencia",
      motivo: valido
        ? `${motivoBase} | Italia fuerte`
        : `${motivoBase} | Italia ruido o contexto débil`
    };
  }
  // ===== MÉXICO / CNI =====
    /*if (p === "MEXICO" && a === "CNI") {

    const contextoMexicoFuerte = contieneAlguno(titNorm, [
      "cartel",
      "cártel",
      "narcotrafico",
      "narcotráfico",
      "droga",
      "trafico de drogas",
      "tráfico de drogas",
      "tunel",
      "túnel",
      "frontera",
      "seguridad nacional",
      "crimen organizado",
      "organización criminal",
      "organizacion criminal",
      "operativo",
      "detenido",
      "capturado"
    ]);

    const contextoMexicoInteligencia = contieneAlguno(titNorm, [
      "cni mexico",
      "centro nacional de inteligencia",
      "inteligencia mexicana",
      "servicios de inteligencia"
    ]);

    const ruidoMexico = contieneAlguno(titNorm, [
      "celebridad",
      "show",
      "deportes",
      "futbol",
      "entretenimiento"
    ]);

    const valido = !tieneNegativo && !ruidoMexico && (
      contextoMexicoInteligencia ||
      contextoMexicoFuerte
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | Mexico seguridad/crimen organizado`
        : `${motivoBase} | Mexico ruido o contexto débil`
    };
    }*/
  
  // ===== PARAGUAY / SIN =====
  if (p === "PARAGUAY" && a === "SIN") {
    const identidadSIN = contieneAlguno(titNorm, [
      "secretaria de inteligencia",
      "servicio de inteligencia",
      "inteligencia paraguaya"
    ]) || contienePalabraExacta(titNorm, "sin");

    const contextoSensitivoPY = contieneAlguno(titNorm, [
      "secuestro",
      "secuestrado",
      "novedades sobre el secuestro",
      "autoridades dicen tener nuevos datos",
      "investigacion"
    ]);

    const valido = !tieneNegativo && (
      identidadSIN || contextoSensitivoPY
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | Paraguay sensible`
        : `${motivoBase} | Paraguay ruido o contexto débil`
    };
  }
  
  // ===== REINO UNIDO / MI5 / MI6 =====
  if (a === "MI5" || a === "MI6") {
    const contextoUKFuerte = contieneAlguno(titNorm, [
      "mi5", "mi6", "british intelligence", "uk intelligence", "british spy",
      "british spies", "espionage", "spy", "counterintelligence"
    ]);

    const mencionaMI5Formal = contieneAlguno(titNorm, [
      "security service uk", "uk security service", "british security service"
    ]);

    const mencionaMI6Formal = contieneAlguno(titNorm, [
      "british secret intelligence service", "uk secret intelligence service", "secret intelligence service"
    ]);

    const ruidoFinancieroMI6 = (a === "MI6") && contieneAlguno(titNorm, [
      "asx:mi6",
      "asx mi6",
      "valuation",
      "half year loss",
      "wider half year loss",
      "market cap",
      "earnings",
      "shares",
      "stock",
      "investor",
      "simplywall"
    ]);

    const identidadNombreSegura =
      (a === "MI5" && mencionaMI5Formal) ||
      (a === "MI6" && mencionaMI6Formal);

    const valido = !tieneNegativo && !ruidoFinancieroMI6 && (
      identidadAcronimo || identidadNombreSegura || contextoUKFuerte
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: ruidoFinancieroMI6
        ? `${motivoBase} | MI6 ruido financiero/bursátil`
        : (valido
          ? `${motivoBase} | Reino Unido fuerte`
          : `${motivoBase} | Reino Unido ruido o contexto débil`)
    };
  }
  
  // ===== RUSIA / SVR / FSB =====
  if (p === "RUSIA" || a === "SVR" || a === "FSB") {
    const contextoRusoFuerte = contieneAlguno(titNorm, [
      "fsb", "svr", "federal security service", "foreign intelligence service", "russian intelligence",
      "russian security service", "espionage", "spy", "counterintelligence", "navalny", "agent", "cyber attack", "cyberwar", "sabotage", "infrastructure", "internet shutdown", 
      "mobile network", "telecommunications", "critical infrastructure",
      //español
      "ciberataque", "ciberataques", "sabotaje", "infraestructura critica", "infraestructura crítica", "internet", "telefonia movil", "telefonía móvil", "red movil", "red móvil"
    ]);

    const contextoRusoDebil = contieneAlguno(titNorm, ["russia", "russian", "security", "terrorism"]);

    const valido = !tieneNegativo && (
      identidadNombre ||
      identidadAcronimo ||
      contextoRusoFuerte ||
      (mencionaPais && score >= 4 && !contextoRusoDebil)
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido ? `${motivoBase} | Rusia fuerte` : `${motivoBase} | Rusia ruido o contexto débil`
    };
  }

  // ===== UCRANIA / SSU / SBU =====
  if (p === "UCRANIA" || a === "SSU" || a === "SBU") {
    const contextoUcrania = contieneAlguno(titNorm, [
      "ssu", "sbu", "security service of ukraine", "ukrainian intelligence",
      "ukraine intelligence", "espionage", "spy", "counterintelligence"
    ]);

    const valido = !tieneNegativo && (
      identidadNombre || identidadAcronimo || contextoUcrania || (mencionaPais && score >= 4)
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido ? `${motivoBase} | Ucrania fuerte` : `${motivoBase} | Ucrania ruido o contexto débil`
    };
  }

  if (p === "VENEZUELA" && (a === "SEBIN" || a === "DGCIM")) {

    const contextoVenezuelaFuerte = contieneAlguno(titNorm, [
      "sebin",
      "servicio bolivariano de inteligencia nacional",
      "dgcim",
      "direccion general de contrainteligencia militar",
      "dirección general de contrainteligencia militar",
      "contrainteligencia militar",
      "helicoide",
      "gustavo gonzalez lopez",
      "gustavo gonzález lópez",
      "intelligence head",
      "defense minister",
      "ministro de defensa"
    ]);

    const contextoDesignacionRelevante = contieneAlguno(titNorm, [
      "replaces long-time defense minister",
      "names new defense chief",
      "acting president replaces",
      "new defense minister",
      "nuevo ministro de defensa",
      "designacion",
      "designación",
      "nombramiento",
      "reemplaza",
      "sustituye"
    ]);

    const contextoRepresivo = contieneAlguno(titNorm, [
      "torture",
      "helicoide",
      "detention",
      "prison",
      "espionage",
      "counterintelligence"
    ]);

    const ruidoVenezuela = contieneAlguno(titNorm, [
      "show",
      "celebridad",
      "deportes",
      "futbol",
      "entretenimiento"
    ]);

    const valido = !tieneNegativo && !ruidoVenezuela && (
      identidadNombre ||
      contextoVenezuelaFuerte ||
      (contextoDesignacionRelevante && contieneAlguno(titNorm, [
        "gustavo gonzalez lopez",
        "gustavo gonzález lópez",
        "intelligence head",
        "sebin",
        "dgcim"
      ])) ||
      (contextoRepresivo && contieneAlguno(titNorm, [
        "helicoide",
        "sebin",
        "dgcim",
        "venezuela"
      ])) ||
      (mencionaPais && score >= 2 && (
        contextoVenezuelaFuerte || contextoDesignacionRelevante || contextoRepresivo
      )) ||
      rescatePorSenalesFuertes
    );

    return {
      valido: valido,
      score: score,
      categoria: categoria,
      motivo: valido
        ? `${motivoBase} | Venezuela fuerte`
        : `${motivoBase} | Venezuela ruido o contexto débil`
    };
  }
  const validoGeneral = score >= 3 && !tieneNegativo && !ruidoIntelligenceTecnologica;

  // ======================================================
  // RESCATE CONTROLADO - CRIMEN ORGANIZADO TRANSNACIONAL
  // ======================================================
  const contextoCrimenOrganizadoFuerte = contieneAlguno(titNorm, [
  "cartel",
  "cártel",
  "narcotrafico",
  "narcotráfico",
  "trafico de drogas",
  "tráfico de drogas",
  "tunel",
  "túnel",
  "crimen organizado",
  "organizacion criminal",
  "organización criminal"
]);

const contextoFrontera = contieneAlguno(titNorm, [
  "frontera",
  "border",
  "cross-border"
]);

// 🔥 RESCATE CONTROLADO
if (
  contextoCrimenOrganizadoFuerte &&
  contextoFrontera &&
  !tieneNegativo
) {
  return {
    valido: true,
    score: score + 2,
    categoria: categoria,
    motivo: `${motivoBase} | Rescate crimen organizado transnacional`
  };
}
  return {
    valido: validoGeneral,
    score: score,
    categoria: categoria,
    motivo: validoGeneral ? `${motivoBase} | Regla general` : `${motivoBase} | Regla general insuficiente o ruido`
  };
}

function calcularImpacto(titulo, categoria, motivo) {

  const t = titulo.toLowerCase();

  // -------- ALTO IMPACTO --------

  if (
    t.includes("bomb") ||
    t.includes("attack") ||
    t.includes("sabotage") ||
    t.includes("spy network") ||
    t.includes("spy ring") ||
    t.includes("espionage case") ||
    t.includes("counterintelligence operation") ||
    t.includes("recruit spies") ||
    t.includes("intelligence leak") ||
    t.includes("assassination") ||
    t.includes("thwarted") ||
    t.includes("cyber attack") ||
    t.includes("cyber espionage") ||
    t.includes("critical infrastructure") ||
    t.includes("government systems") ||
    t.includes("ministry") ||
    t.includes("defense") ||
    t.includes("defence") ||
    t.includes("parliament") ||
    t.includes("opens office") ||
    t.includes("spy") ||
    t.includes("convicted spy") ||
    t.includes("permanent office")
  ) {
    return "ALTO";
  }

  // -------- CIBER GUBERNAMENTAL --------

  if (categoria === "Ciberinteligencia" && (
      t.includes("government") ||
      t.includes("state") ||
      t.includes("ministry") ||
      t.includes("infrastructure")
  )) {
    return "ALTO";
  }

  if (
  t.includes("director de la ani") ||
  t.includes("director ani") ||
  t.includes("head of nsa") ||
  t.includes("director del cni") ||
  t.includes("chief of mossad") ||
  t.includes("director general") ||
  t.includes("head of intelligence")
) {
  return "ALTO";
}
  // -------- IMPACTO MEDIO --------

  if (
    t.includes("director") ||
    t.includes("nombrado") ||
    t.includes("designado") ||
    t.includes("warning") ||
    t.includes("alert") ||
    t.includes("memo") ||
    t.includes("report") ||
    t.includes("assessment") ||
    t.includes("cooperation") ||
    t.includes("hearing") ||
    t.includes("investigation")
  ) {
    return "MEDIO";
  }

  // -------- BAJO IMPACTO --------

  if (
    t.includes("conference") ||
    t.includes("speech") ||
    t.includes("career") ||
    t.includes("former") ||
    t.includes("event") ||
    t.includes("festival") ||
    t.includes("awareness") ||
    t.includes("program") ||
    t.includes("joins") ||
    t.includes("most wanted") ||
    t.includes("film") ||
    t.includes("movie") ||
    t.includes("thriller") ||
    t.includes("series") ||
    t.includes("book") ||
    t.includes("documentary") ||
    t.includes("talk")
  ) {
    return "BAJO";
  }

  // default
  return "MEDIO";
}

// --- 6. BLOQUES DE CONSULTA PARA AGENCIAS ---
function ejecutarConsultasAgencias(pais, nombreLargo, acronimo, directivos, fechaCorte, ahora, hojaDestino) {
  const p = pais.toUpperCase();
  const a = acronimo.toUpperCase();

  // ======================================================
  // QUERIES RSS POR PAÍS / AGENCIA
  // Nota: este bloque mantiene la lógica original.
  // Se agregan separadores visuales y orden alfabético
  // por país/agencia para evitar tocar el país equivocado.
  // ======================================================

  let hl = "en";
  let gl = "US";
  let ceid = "US:en";
  let queries = [];

  // ===== ALEMANIA / BND / BFV =====
  if (p === "ALEMANIA" || a === "BND" || a === "BFV") {
    ejecutarRss('("BfV" OR "BND" OR "Verfassungsschutz" OR "Bundesamt für Verfassungsschutz" OR "Bundesnachrichtendienst")', "de", "DE", "DE:de", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("Verfassungsschutz" OR "Bundesamt für Verfassungsschutz" OR "BfV") (Deutschland OR Geheimdienst OR Spionage OR Extremismus OR Präsident OR Praesident)', "de", "DE", "DE:de", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("Verfassungsschutz" OR "Bundesamt für Verfassungsschutz") ("neuer Mann" OR Präsident OR Praesident OR Chef OR Leitung)', "de", "DE", "DE:de", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("BfV" OR "BND" OR "Verfassungsschutz" OR "Bundesnachrichtendienst") (Spionage OR Gegenspionage OR Geheimdienst OR Terrorismus OR Sabotage)', "de", "DE", "DE:de", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("BfV" OR "BND" OR "Verfassungsschutz" OR "Bundesamt für Verfassungsschutz" OR "Bundesnachrichtendienst" OR "German intelligence" OR "German domestic intelligence")', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("BfV" OR "BND" OR "Verfassungsschutz" OR "Bundesamt für Verfassungsschutz") (espionage OR counterintelligence OR sabotage OR Russia OR Russian)', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("BfV" OR "BND" OR "Verfassungsschutz" OR "Bundesamt para la Protección de la Constitución" OR "inteligencia alemana" OR "contrainteligencia alemana")', "es", "AR", "AR:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== AUSTRIA / SIA =====
  if (p === "AUSTRIA" && a === "SIA") {
    ejecutarRss('"SIA" Austria intelligence OR espionage OR security service', "en", "AT", "AT:de", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"SIA" Austria spy OR counterintelligence', "en", "AT", "AT:de", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"SIA" OR "Austria"'), "en", "AT", "AT:de", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== BOLIVIA / DNI =====
  if (p === "BOLIVIA" && a === "DNI") {
    ejecutarRss('"DNI" Bolivia inteligencia', "es", "BO", "BO:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"DNI" Bolivia espionaje', "es", "BO", "BO:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"Bolivia" "narcotráfico" "financiación" OR "cooperación internacional"', "es", "BO", "BO:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"DNI" OR "Dirección Nacional de Inteligencia" OR "Bolivia"'), "es", "BO", "BO:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== BRASIL / ABIN =====
  if (p === "BRASIL" || a === "ABIN") {
    ejecutarRss('("ABIN" OR "Agência Brasileira de Inteligência" OR "Agencia Brasileira de Inteligencia") Brasil', "pt", "BR", "BR:pt", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("ABIN" OR "Agência Brasileira de Inteligência") espionagem OR inteligência OR "abin paralela"', "pt", "BR", "BR:pt", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"ABIN" OR "Agência Brasileira de Inteligência" OR "Agencia Brasileira de Inteligencia" OR "Brasil"'), "pt", "BR", "BR:pt", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== CHILE / ANI =====
  if (p === "CHILE" && a === "ANI") {
    ejecutarRss('("ANI" OR "Agencia Nacional de Inteligencia" OR "inteligencia chilena")', "es", "CL", "CL:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("ANI" OR "Agencia Nacional de Inteligencia") (director OR jefe OR nombrado OR designado)', "es", "CL", "CL:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }
  // ===== CHILE / ANI =====
  if (p === "CHILE" && a === "ANI") {
    ejecutarRss('("ANI" OR "Agencia Nacional de Inteligencia") Chile', "es", "CL", "CL:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("Chile" AND ("Agencia Nacional de Inteligencia" OR ANI OR inteligencia OR contrainteligencia OR espionaje))', "es", "CL", "CL:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("Chile" AND ("cable submarino" OR "soberanía digital" OR "infraestructura crítica" OR "seguridad estratégica" OR telecomunicaciones OR China))', "es", "CL", "CL:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"ANI" OR "Agencia Nacional de Inteligencia" OR "Chile"'), "es", "CL", "CL:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== CHINA / MSS =====
  if (p === "CHINA" || a === "MSS") {
    ejecutarRss('"MSS" China OR "Ministry of State Security" OR "China spies"', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('China spies UK OR "Chinese spies" UK OR "China espionage" Britain', "en", "GB", "GB:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"China" "spies on the UK"', "en", "GB", "GB:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"Ministry of State Security" Britain OR UK OR espionage', "en", "GB", "GB:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"MSS" OR "Ministry of State Security" OR "China"'), "en", "GB", "GB:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }
  // ===== COLOMBIA / DNI =====
  if (p === "COLOMBIA" && a === "DNI") {
    ejecutarRss('DNI Colombia "David Luna" OR "chuzado"', "es", "CO", "CO:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"Dirección Nacional de Inteligencia" Colombia', "es", "CO", "CO:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"director de la DNI" Colombia OR "René Guarín" OR "Rene Guarin"', "es", "CO", "CO:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"DNI" Colombia "Iván Márquez" OR "Ivan Marquez"', "es", "CO", "CO:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"DNI" Colombia "testigos electorales" OR CNE', "es", "CO", "CO:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"DNI" Colombia inteligencia', "es", "CO", "CO:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"DNI" OR "Dirección Nacional de Inteligencia" OR "Colombia"'), "es", "CO", "CO:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }
  // ===== COSTA RICA / DIS =====
  if (p === "COSTA RICA" && a === "DIS") {
  ejecutarRss(
    '("DIS" OR "Dirección de Inteligencia y Seguridad" OR "inteligencia Costa Rica")', "es", "CR", "CR:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
  return;
}
  // ===== ECUADOR / CNI / CIES =====
  if (p === "ECUADOR" && (a === "CNI" || a === "CIES")) {
    ejecutarRss(
      '("CIES" OR "Centro de Inteligencia Estratégica" OR "Sistema Nacional de Inteligencia") (Ecuador OR ecuatoriano OR ecuatoriana OR Quito OR gobierno)',
      "es", "EC", "EC:es",
      pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino
    );

    ejecutarRss(
      '("CIES" OR "Centro de Inteligencia Estratégica") (inteligencia OR espionaje OR contrainteligencia OR seguridad OR seguimiento)',
      "es", "EC", "EC:es",
      pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino
    );
    return;
  }

  // ===== ESPAÑA / CNI =====
  if (p === "ESPAÑA" && a === "CNI") {
    ejecutarRss('("CNI" OR "Centro Nacional de Inteligencia") España', "es", "ES", "ES:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("CNI" OR "Centro Nacional de Inteligencia") (espionaje OR inteligencia OR spy OR espionage)', "es", "ES", "ES:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"CNI" OR "Centro Nacional de Inteligencia" OR "España"'), "es", "ES", "ES:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== ESTADOS UNIDOS / CIA =====
  if (a === "CIA") {
    const q = 'CIA "intelligence" OR "agency" OR "drone" OR "Iran" OR "Riyadh" OR "strike" OR "Kurd"';
    ejecutarRss(q, hl, gl, ceid, pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== ESTADOS UNIDOS / FBI =====
  if (a === "FBI") {
    queries.push('FBI counterintelligence');
    queries.push('FBI espionage');
    queries.push('FBI intelligence');
    queries.push('FBI cybercrime');
    queries.push('FBI ransomware');
    queries.push('FBI botnet');
    queries.push('FBI hacker forum');
    queries.push('FBI dark web');
    queries.push('FBI foreign interference');
    queries.push('FBI classified');
    queries.push('("FBI" OR "Department of Justice" OR DOJ) (cybercrime OR ransomware OR botnet OR "hacker forum" OR "dark web")');
    queries.push('("FBI" OR DOJ OR "Department of Justice") (dismantled OR dismantlement OR takedown OR seized OR charged) (hacker OR ransomware OR botnet OR forum)');
    queries.push('FBI office opened');
    queries.push('FBI office Ecuador');
    queries.push('FBI cooperation');
    queries.push('FBI international office');

    if (directivos.length > 0) {
      directivos.forEach(d => {
        queries.push(`FBI "${d}" counterintelligence`);
        queries.push(`FBI "${d}" intelligence`);
      });
    }

    queries.forEach(q => ejecutarRss(q, hl, gl, ceid, pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino));
    ejecutarRss(
    '("FBI") (terrorism OR terrorist OR extremism OR "terror investigation" OR "terror probe" OR "terror attack")', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos,
  fechaCorte,  ahora, hojaDestino);
    return;
  }

  // ===== FRANCIA / DGSE =====
  if (p === "FRANCIA" && a === "DGSE") {
    ejecutarRss('("DGSE" OR "Direction Générale de la Sécurité Extérieure" OR "Direction Generale de la Securite Exterieure")', "fr", "FR", "FR:fr", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("DGSE" OR "renseignement français" OR "services secrets français" OR "french intelligence")', "fr", "FR", "FR:fr", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("DGSE" OR "french intelligence" OR "renseignement français") ("espionnage" OR "espionage" OR "sécurité" OR "security" OR "Mali" OR "Russie" OR "Moscou")', "fr", "FR", "FR:fr", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"French foreign intelligence" OR "French external intelligence" OR "DGSE France"', "en", "FR", "FR:fr", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"DGSE" OR "Direction Générale de la Sécurité Extérieure" OR "french intelligence" OR "France"'), "fr", "FR", "FR:fr", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }
  // ===== FRANCIA / DGSI =====
  if (p === "FRANCIA" && a === "DGSI") {
    ejecutarRss('("DGSI" OR "Direction Générale de la Sécurité Intérieure" OR "Direction Generale de la Securite Interieure")', "fr", "FR", "FR:fr", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("DGSI" OR "contre-espionnage" OR "contre-ingérence" OR "ingérence étrangère")', "fr", "FR", "FR:fr", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("DGSI" OR "French counterintelligence" OR "French internal intelligence") ("espionnage" OR "espionage" OR "contre-ingérence" OR "counterintelligence" OR "foreign interference" OR "terrorisme")', "fr", "FR", "FR:fr", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"French counterintelligence" OR "French internal intelligence" OR "DGSI France"', "en", "FR", "FR:fr", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== INDIA / IB =====
  if (p === "INDIA" && a === "IB") {
    ejecutarRss('"IB" India intelligence OR "Intelligence Bureau" OR counterintelligence', "en", "IN", "IN:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"Intelligence Bureau" India', "en", "IN", "IN:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"IB" OR "Intelligence Bureau" OR "India"'), "en", "IN", "IN:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== INDIA / RAW =====
  if (p === "INDIA" && a === "RAW") {
    ejecutarRss('"RAW" India intelligence OR espionage OR "Research and Analysis Wing"', "en", "IN", "IN:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"Research and Analysis Wing" India', "en", "IN", "IN:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"RAW" OR "Research and Analysis Wing" OR "India"'), "en", "IN", "IN:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== ITALIA / DIS / AISE / AISI =====
  if (p === "ITALIA" || a === "DIS" || a === "AISE" || a === "AISI") {
    ejecutarRss('("DIS" OR "AISE" OR "AISI" OR "Dipartimento delle Informazioni per la Sicurezza" OR "Agenzia Informazioni e Sicurezza Esterna")', "it", "IT", "IT:it", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("DIS" OR "AISE" OR "AISI") Crosetto OR servizi segreti OR intelligence', "it", "IT", "IT:it", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("DIS" OR "AISE" OR "AISI") cybersecurity OR cybersicurezza OR Rizzi', "it", "IT", "IT:it", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("DIS" OR "AISE" OR "AISI" OR "servicios secretos italianos" OR "inteligencia italiana")', "es", "AR", "AR:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"AISE" OR "AISI" OR "Dipartimento delle Informazioni per la Sicurezza" OR "Agenzia Informazioni e Sicurezza Esterna" OR "Italia"'), "it", "IT", "IT:it", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }
  // ===== MÉXICO / CNI =====
  if (p === "MEXICO" && a === "CNI") {
    ejecutarRss('("CNI" OR "Centro Nacional de Inteligencia") Mexico inteligencia OR espionaje', "es", "MX", "MX:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"CNI" OR "Centro Nacional de Inteligencia" OR "Mexico"'), "es", "MX", "MX:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== PAÍSES BAJOS / AIVD / MIVD =====
  if (p === "PAISES BAJOS" || a === "AIVD" || a === "MIVD") {
    ejecutarRss('("AIVD" OR "MIVD" OR "Dutch intelligence" OR "Netherlands intelligence")', "en", "NL", "NL:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('Russia hackers Netherlands officials OR journalists cyber attack', "en", "NL", "NL:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"AIVD" OR "MIVD" OR "Dutch intelligence" OR "Netherlands"'), "en", "NL", "NL:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }
  // ===== PARAGUAY =====
  if (p === "PARAGUAY") {
    ejecutarRss('Paraguay inteligencia OR espionaje OR inteligencia policial', "es", "PY", "PY:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('Paraguay secuestro inteligencia OR investigación inteligencia', "es", "PY", "PY:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);

    return;
  }
  // ===== PERÚ / DINI =====
  if (p === "PERU" && a === "DINI") {
    ejecutarRss('("DINI" OR "Direccion Nacional de Inteligencia" OR "Dirección Nacional de Inteligencia") Peru', "es", "PE", "PE:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"Escuela de inteligencia" Peru OR DINI', "es", "PE", "PE:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"DINI" OR "Dirección Nacional de Inteligencia" OR "Peru" OR "Perú"'), "es", "PE", "PE:es", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== REINO UNIDO / MI5 =====
  if (a === "MI5") {
    ejecutarRss('("MI5" OR "British intelligence" OR "UK intelligence" OR "British Security Service")', "en", "GB", "GB:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("MI5") (spy OR spies OR espionage OR counterintelligence OR Russia OR Russian OR China OR Chinese)', "en", "GB", "GB:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== REINO UNIDO / MI6 =====
  if (a === "MI6") {
    ejecutarRss('("MI6" OR "British intelligence" OR "UK intelligence" OR "British Secret Intelligence Service")', "en", "GB", "GB:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("MI6") (spy OR spies OR espionage OR intelligence OR covert OR Russia OR Russian OR China OR Chinese OR Iran)', "en", "GB", "GB:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("MI6" OR "British intelligence" OR "UK Secret Intelligence Service") (recruit OR recruitment OR "recruit spies" OR "dark web")', "en", "GB", "GB:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("UK security" OR "British security" OR "British intelligence") ("recruit spies" OR recruitment OR recruit OR "dark web portal" OR "dark web")', "en", "GB", "GB:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("Secret Intelligence Service" OR "British Secret Intelligence Service" OR "UK intelligence") (recruit OR recruitment OR "recruit spies" OR "dark web")', "en", "GB", "GB:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== RUSIA / SVR / FSB / GRU =====
  if (p === "RUSIA" || a === "SVR" || a === "FSB" || a === "GRU") {
    ejecutarRss('("FSB" OR "SVR" OR "GRU") Russia ("intelligence" OR "security service" OR "espionage" OR "spy" OR "counterintelligence")', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("FSB" OR "SVR" OR "GRU") Russian intelligence OR Russian spy OR Russian espionage', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"Russian intelligence" OR "Russian spy" OR "Russian spies" OR "Russian espionage"', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"Russian security service" OR "Russian security services" OR "Russian foreign intelligence" OR "Russian military intelligence"', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('Russia ("counterintelligence" OR "spy ring" OR "spy network" OR "intelligence operation" OR "espionage case")', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('Russia ("cyber attack" OR "cyber espionage" OR "cyber operation") intelligence OR spy', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("FSB" OR "SVR" OR "GRU") Russia ("espionage" OR "spy" OR "intelligence operation" OR "covert operation" OR "counterintelligence")', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"FSB" OR "SVR" OR "GRU" OR "Russian intelligence" OR "Russia"'), "en", "RU", "RU:ru", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== UCRANIA / SBU / SSU =====
  if (p === "UCRANIA" || a === "SBU" || a === "SSU") {
    ejecutarRss('"SBU" OR "SSU" Ukraine "Novorossiysk" OR "prisoner"', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"SSU" Kyiv terrorist attack OR "SBU" Kyiv terrorist attack', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"SSU" Ukraine Russian-linked agent OR "SBU" Ukraine Russian-linked agent', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('"SSU" foils terrorist attack Kyiv OR "SBU" foils terrorist attack Kyiv', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss(construirQueryTematica('"SBU" OR "SSU" OR "Ukraine"'), "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    return;
  }

  // ===== SALIDA TEMPRANA / AGENCIAS GENERALES =====
  if (a === "CIA" || a === "FBI") {
    ejecutarRss('("cybercrime forum" OR "hacker forum" OR "dark web forum" OR ransomware OR botnet) (dismantled OR dismantlement OR takedown OR seized OR charged)', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
    ejecutarRss('("United States" OR FBI OR DOJ OR "Department of Justice" OR Europol OR Interpol OR "international partners") (cybercrime OR ransomware OR botnet OR "hacker forum" OR "dark web")', "en", "US", "US:en", pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
  }

  const agenciasElite = ["MI5", "MI6", "MOSSAD"];
  const baseDefault = agenciasElite.includes(a)
    ? `"${acronimo}" OR "${nombreLargo}"`
    : `"${acronimo}" OR "${nombreLargo}" OR "${pais}"`;

  ejecutarRss(
    agenciasElite.includes(a) ? `(\"${acronimo}\" OR \"${nombreLargo}\")` : `"${acronimo}" ${pais}`,
    hl, gl, ceid, pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino
  );

  ejecutarRss(construirQueryTematica(baseDefault), hl, gl, ceid, pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino);
}

// --- 7. MOTOR RSS PARA AGENCIAS ---
function ejecutarRss(q, hl, gl, ceid, pais, acronimo, nombreLargo, directivos, fechaCorte, ahora, hojaDestino) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${ceid}&tbs=qdr:d2`;

  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const xml = response.getContentText();

    if (!xml || xml.trim() === "") {
      registrarLog(pais, acronimo, "Sistema", q, "ERROR", "CRÍTICO", "RSS vacío");
      return;
    }

    const doc = XmlService.parse(xml);
    const root = doc.getRootElement();
    const channel = root.getChild("channel");

    if (!channel) {
      registrarLog(pais, acronimo, "Sistema", q, "ERROR", "CRÍTICO", "RSS sin channel");
      return;
    }

    const items = channel.getChildren("item").slice(0, 8);

    items.forEach(item => {
      const titulo = item.getChildText("title") || "";
      const pubDateText = item.getChildText("pubDate") || "";
      const link = item.getChildText("link") || "";
      const pubDate = new Date(pubDateText);

      const linkNorm = normalizarTexto(link);
      const tituloNorm = normalizarTexto(titulo);

      if (linkNorm.includes("aol.com") || linkNorm.includes("msn.com")) {
        const contextoFuerte = contieneAlguno(tituloNorm, [
          "intelligence", "espionage", "spy", "counterintelligence", "cyber", "security service",
          "servizi segreti", "fbi", "cia", "mossad", "bnd", "fsb", "sbu", "ssu", "dni",
          "hacker", "ransomware", "botnet", "dark web"
        ]);

        if (!contextoFuerte) {
          registrarLog(pais, acronimo, "Sistema", q, titulo, "DESCARTADO", "Fuente republicadora (AOL/MSN)");
          return;
        }
      }

      if ((pais || "").toUpperCase() === "ITALIA") {
        const contextoItaliaFuerte = contieneAlguno(tituloNorm, [
          "servizi segreti", "intelligence italiana", "cybersicurezza", "crosetto", "rizzi",
          "dipartimento delle informazioni per la sicurezza", "agenzia informazioni e sicurezza esterna", "aise", "dis", "aisi"
        ]);

        if (linkNorm.includes("lamilano.it") && !contextoItaliaFuerte) {
          registrarLog(pais, acronimo, "Sistema", q, titulo, "DESCARTADO", "Italia: fuente La Milano irrelevante");
          return;
        }
      }

      if (isNaN(pubDate.getTime())) {
        registrarLog(pais, acronimo, "Sistema", q, titulo, "DESCARTADO", "Fecha inválida");
        return;
      }

      if (pubDate < fechaCorte || pubDate > ahora) {
        return;
      }

      const edadDias = Math.floor((ahora.getTime() - pubDate.getTime()) / 86400000);
      if (edadDias > 7) {
        registrarLog(pais, acronimo, "Sistema", q, titulo, "DESCARTADO", "Fecha demasiado antigua");
        return;
      }

      if ((pais || "").toUpperCase() === "ITALIA" && (acronimo || "").toUpperCase() === "AISE") {
        const ruidoAiseMedio = contieneAlguno(tituloNorm, [
          "expat", "comites", "volontariato", "libro", "famiglie", "colloquio telefonico",
          "guida completa", "presentazione del libro"
        ]);

        const contextoInteligenciaAise = contieneAlguno(tituloNorm, [
          "servizi segreti", "intelligence", "sicurezza", "crosetto", "cybersicurezza", "inchiesta", "indagate", "dis"
        ]);

        if ((linkNorm.includes("aise.it") || tituloNorm.includes("aise.it")) && !contextoInteligenciaAise) {
          registrarLog(pais, acronimo, "Sistema", q, titulo, "DESCARTADO", "Italia: ruido Aise.it");
          return;
        }

        if (ruidoAiseMedio && !contextoInteligenciaAise) {
          registrarLog(pais, acronimo, "Sistema", q, titulo, "DESCARTADO", "Italia: ruido tematico Aise.it");
          return;
        }
      }

      const evaluacion = evaluarNoticia(titulo, pais, acronimo, nombreLargo);

      if (evaluacion.valido) {
        registrarLog(pais, acronimo, evaluacion.categoria || "Inteligencia", q, titulo, "ACEPTADO", evaluacion.motivo);
        escribirFila(hojaDestino, pais, acronimo, evaluacion.categoria || "Inteligencia", titulo, pubDate, link, evaluacion.motivo);
      } else {
        const motivo = evaluacion.motivo || "";
        if (
          !motivo.toLowerCase().includes("score=") ||
          motivo.toLowerCase().includes("ruido") ||
          motivo.toLowerCase().includes("contexto") ||
          motivo.toLowerCase().includes("ambiguo")
        ) {
          registrarLog(pais, acronimo, evaluacion.categoria || "Inteligencia", q, titulo, "DESCARTADO", evaluacion.motivo);
        }
      }
    });

  } catch (e) {
    registrarLog(pais, acronimo, "Sistema", q, "ERROR", "CRÍTICO", e.toString());
  }
}

// --- 8. UTILIDADES COMPARTIDAS ---
function escribirFila(hoja, pais, acronimo, categoria, titulo, pubDate, link, motivo) {
  const impacto = calcularImpacto(titulo, categoria, motivo);
  const linkFinal = obtenerUrlReal(link);

  hoja.appendRow([
    pais,
    acronimo,
    categoria,
    titulo,
    impacto,
    Utilities.formatDate(pubDate, "GMT-3", "dd/MM HH:mm"),
    linkFinal
  ]);
}
function compartenTokensSuficientes(tituloA, tituloB) {
  const tokensA = tokenizarTituloDedupe(tituloA);
  const tokensB = tokenizarTituloDedupe(tituloB);

  const comunes = interseccionTokens(tokensA, tokensB);

  return comunes >= 4;
}
function obtenerStopwordsDedupe() {
  return new Set([
    "the", "a", "an", "of", "to", "in", "on", "at", "for", "from", "by", "with", "and", "or",
    "is", "are", "was", "were", "be", "been", "being", "as", "that", "this", "these", "those",
    "after", "before", "over", "under", "into", "about", "against", "during", "through",
    "de", "del", "la", "las", "el", "los", "un", "una", "unos", "unas", "y", "o", "en", "por",
    "para", "con", "sin", "sobre", "contra", "desde", "hasta",
    "le", "les", "des", "du", "au", "aux", "et", "dans", "sur", "pour", "par", "avec", "sans",
    "une", "un"
  ]);
}

function limpiarTituloDedupe(titulo) {
  let t = normalizarTexto(titulo || "");

  t = t
    .replace(/\s[-|]\s[^-|]+$/, "")
    .replace(/\b(reuters|associated press|ap|afp|bbc|cnn|dw|ansa|efe|rfi|france info|newsweek|defense news|realcleardefense)\b$/i, "")

    // Normalización de plataformas / formatos
    .replace(/\b(f 35|f35)\b/g, "f35")

    // Normalización aérea / espionaje
    .replace(/\bspy planes\b/g, "spy plane")
    .replace(/\bspy aircraft\b/g, "spy plane")
    .replace(/\bspies\b/g, "spy")
    .replace(/\baircraft\b/g, "plane")
    .replace(/\bjets\b/g, "jet")
    .replace(/\bfighter jets\b/g, "jet")
    .replace(/\bfighter jet\b/g, "jet")
    .replace(/\bintercepts\b/g, "intercept")
    .replace(/\bintercepted\b/g, "intercept")
    .replace(/\bscrambles\b/g, "intercept")
    .replace(/\bscrambled\b/g, "intercept")
    .replace(/\bwar games zone\b/g, "military exercise")
    .replace(/\bnato drill\b/g, "military exercise")

    // Normalización general verbal
    .replace(/\bwarns of growing\b/g, "warn")
    .replace(/\bwarns\b/g, "warn")
    .replace(/\bwarned\b/g, "warn")
    .replace(/\boperations\b/g, "operation")

    // Normalización ciber
    .replace(/\bcyber espionage targeting\b/g, "cyberespionage targeting")
    .replace(/\bcyber espionage\b/g, "cyberespionage")
    .replace(/\btargeting government\b/g, "targeting")
    .replace(/\bcritical infrastructure\b/g, "infrastructure")
    .replace(/\bnational security overview 2026\b/g, "security overview")
    .replace(/\bchina and russia\b/g, "russia china")
    .replace(/\brussian and chinese\b/g, "russia china")
    .replace(/\btargeting finland\b/g, "finland")

    .replace(/\s+/g, " ")
    .trim();

  return t;
}

function tokenizarTituloDedupe(titulo) {
  const stopwords = obtenerStopwordsDedupe();
  const limpio = limpiarTituloDedupe(titulo);

  return limpio
    .split(" ")
    .map(x => x.trim())
    .filter(x => x.length >= 4 && !stopwords.has(x));
}

function firmaTituloDedupe(titulo) {
  const tokens = tokenizarTituloDedupe(titulo);
  return Array.from(new Set(tokens)).sort().join(" ");
}

function interseccionTokens(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  let comunes = 0;

  setA.forEach(x => {
    if (setB.has(x)) comunes++;
  });

  return comunes;
}

function sonTitulosParecidos(tituloA, tituloB) {
  const tokensA = tokenizarTituloDedupe(tituloA);
  const tokensB = tokenizarTituloDedupe(tituloB);

  if (tokensA.length === 0 || tokensB.length === 0) return false;

  const comunes = interseccionTokens(tokensA, tokensB);
  const minTokens = Math.min(new Set(tokensA).size, new Set(tokensB).size);
  const maxTokens = Math.max(new Set(tokensA).size, new Set(tokensB).size);

  const ratioMin = comunes / Math.max(1, minTokens);
  const ratioMax = comunes / Math.max(1, maxTokens);

  if (ratioMin >= 0.8) return true;
  if (comunes >= 5 && ratioMax >= 0.6) return true;

  return false;
}
function finalizarHoja(hoja) {
  const range = hoja.getDataRange();
  const datos = range.getValues();
  if (datos.length < 2) return;

  const cabecera = datos.shift();
  const limpias = [];
  const grupos = {};

  datos.forEach(f => {
    const pais = f[0];
    const categoria = f[2];
    const titulo = f[3];
    const link = f[5];

    const claveGrupo = `${pais}||${categoria}`;

    if (!grupos[claveGrupo]) {
      grupos[claveGrupo] = [];
    }

    let esDuplicada = false;

    for (const existente of grupos[claveGrupo]) {
      const mismoLink = link && existente[5] && link.toString().trim() === existente[5].toString().trim();
      const mismaFirma = firmaTituloDedupe(titulo) === firmaTituloDedupe(existente[3]);
      const tituloParecido = sonTitulosParecidos(titulo, existente[3]);
      const tokensFuertes = compartenTokensSuficientes(titulo, existente[3]);

      if (mismoLink || mismaFirma || tituloParecido || tokensFuertes) {
        esDuplicada = true;
        break;
      }
    }

    if (!esDuplicada) {
      grupos[claveGrupo].push(f);
      limpias.push(f);
    }
  });

  limpias.sort((a, b) => {
    if (a[0] === "GLOBAL" && b[0] !== "GLOBAL") return 1;
    if (a[0] !== "GLOBAL" && b[0] === "GLOBAL") return -1;
    return 0;
  });

  hoja.clear();
  hoja.appendRow(cabecera);
  hoja.getRange("A1:G1").setFontWeight("bold").setBackground("#cfe2ff");

  if (limpias.length > 0) {
    hoja.getRange(2, 1, limpias.length, 7).setValues(limpias);
  }
}

// Placeholder para evitar error si el menú lo invoca y aún no existe en esta versión.
function ejecutarSoloPeriodistas() {
  Logger.log("Función ejecutarSoloPeriodistas() no incluida en este archivo base.");
}
