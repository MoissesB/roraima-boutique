(() => {
  "use strict";

  const STORAGE_KEY = "roraima-silhouette-audience-gate-v1";
  const STORAGE_VERSION = 1;
  const LANGUAGE_KEY = "silhouette-site-language";
  const SUPPORTED_LANGUAGES = ["es", "en", "fr"];
  const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;
  const WEBHOOK_ENDPOINTS = {
    b2c: "https://services.leadconnectorhq.com/hooks/fHXK54ukeNMjxEcZtyDv/webhook-trigger/31f025f4-614b-4fa9-b4ea-fdf155240900",
b2b: "https://services.leadconnectorhq.com/hooks/fHXK54ukeNMjxEcZtyDv/webhook-trigger/pysyrR6zjikRdy8lLzFU"
  };
  const ADS_B2B_CONVERSION_SEND_TO = "AW-18382327581/VWN9CJz_9t8cEJ2esL1E";
  const ADS_B2B_CONVERSION_ID = ADS_B2B_CONVERSION_SEND_TO.split("/")[0];
  let adsB2bConversionSent = false;
  const PRODUCT_ROUTE = /(?:\/|#\/)producto\/[a-z0-9-]+/i;
  const B2B_BUTTON = /^(?:a[nñ]adir(?: m[aá]s unidades| al pedido)?|revisar mi pedido|contactar (?:con |un )?asesor|mi pedido)$/i;

  if (/^(?:www\.)?roraimamx\.com$/i.test(window.location.hostname)) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("config", ADS_B2B_CONVERSION_ID);
  }

  const COUNTRY_CODES = [
    "MX", "AR", "BO", "BR", "BZ", "CA", "CL", "CO", "CR", "CU", "DO", "EC", "SV", "GT", "GY", "HN", "HT", "JM", "NI", "PA", "PE", "PY", "SR", "TT", "US", "UY", "VE",
    "AC", "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BQ", "BS", "BT", "BV", "BW", "BY", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CM", "CN", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DZ", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GU", "GW", "HK", "HM", "HR", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SS", "ST", "SX", "SY", "SZ", "TA", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TV", "TW", "TZ", "UA", "UG", "UM", "UZ", "VA", "VC", "VG", "VI", "VN", "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM", "ZW"
  ];

  const PHONE_DIAL_CODES = {
    AC: "247", AD: "376", AE: "971", AF: "93", AG: "1", AI: "1", AL: "355", AM: "374", AO: "244", AQ: "672", AR: "54", AS: "1", AT: "43", AU: "61", AW: "297", AX: "358", AZ: "994",
    BA: "387", BB: "1", BD: "880", BE: "32", BF: "226", BG: "359", BH: "973", BI: "257", BJ: "229", BL: "590", BM: "1", BN: "673", BO: "591", BQ: "599", BR: "55", BS: "1", BT: "975", BV: "47", BW: "267", BY: "375", BZ: "501",
    CA: "1", CC: "61", CD: "243", CF: "236", CG: "242", CH: "41", CI: "225", CK: "682", CL: "56", CM: "237", CN: "86", CO: "57", CR: "506", CU: "53", CV: "238", CW: "599", CX: "61", CY: "357", CZ: "420",
    DE: "49", DJ: "253", DK: "45", DM: "1", DO: "1", DZ: "213", EC: "593", EE: "372", EG: "20", EH: "212", ER: "291", ES: "34", ET: "251", FI: "358", FJ: "679", FK: "500", FM: "691", FO: "298", FR: "33",
    GA: "241", GB: "44", GD: "1", GE: "995", GF: "594", GG: "44", GH: "233", GI: "350", GL: "299", GM: "220", GN: "224", GP: "590", GQ: "240", GR: "30", GS: "500", GT: "502", GU: "1", GW: "245", GY: "592",
    HK: "852", HM: "672", HN: "504", HR: "385", HT: "509", HU: "36", ID: "62", IE: "353", IL: "972", IM: "44", IN: "91", IO: "246", IQ: "964", IR: "98", IS: "354", IT: "39",
    JE: "44", JM: "1", JO: "962", JP: "81", KE: "254", KG: "996", KH: "855", KI: "686", KM: "269", KN: "1", KP: "850", KR: "82", KW: "965", KY: "1", KZ: "7",
    LA: "856", LB: "961", LC: "1", LI: "423", LK: "94", LR: "231", LS: "266", LT: "370", LU: "352", LV: "371", LY: "218", MA: "212", MC: "377", MD: "373", ME: "382", MF: "590", MG: "261", MH: "692", MK: "389", ML: "223", MM: "95", MN: "976", MO: "853", MP: "1", MQ: "596", MR: "222", MS: "1", MT: "356", MU: "230", MV: "960", MW: "265", MX: "52", MY: "60", MZ: "258",
    NA: "264", NC: "687", NE: "227", NF: "672", NG: "234", NI: "505", NL: "31", NO: "47", NP: "977", NR: "674", NU: "683", NZ: "64", OM: "968", PA: "507", PE: "51", PF: "689", PG: "675", PH: "63", PK: "92", PL: "48", PM: "508", PN: "64", PR: "1", PS: "970", PT: "351", PW: "680", PY: "595",
    QA: "974", RE: "262", RO: "40", RS: "381", RU: "7", RW: "250", SA: "966", SB: "677", SC: "248", SD: "249", SE: "46", SG: "65", SH: "290", SI: "386", SJ: "47", SK: "421", SL: "232", SM: "378", SN: "221", SO: "252", SR: "597", SS: "211", ST: "239", SV: "503", SX: "1", SY: "963", SZ: "268",
    TA: "290", TC: "1", TD: "235", TF: "262", TG: "228", TH: "66", TJ: "992", TK: "690", TL: "670", TM: "993", TN: "216", TO: "676", TR: "90", TT: "1", TV: "688", TW: "886", TZ: "255", UA: "380", UG: "256", UM: "1", US: "1", UY: "598", UZ: "998",
    VA: "39", VC: "1", VE: "58", VG: "1", VI: "1", VN: "84", VU: "678", WF: "681", WS: "685", XK: "383", YE: "967", YT: "262", ZA: "27", ZM: "260", ZW: "263"
  };

  const B2C_CONTACT_FIELDS = [
    { name: "fullName", label: "Nombre completo", placeholder: "Escribe tu nombre completo", type: "text", autocomplete: "name" },
    { name: "phone", label: "Teléfono", type: "tel", autocomplete: "tel" },
    { name: "email", label: "Correo electrónico", placeholder: "nombre@correo.com", type: "email", autocomplete: "email" },
    { name: "city", label: "Ciudad", placeholder: "Escribe tu ciudad", type: "text", autocomplete: "address-level2" },
    { name: "country", label: "País de origen", type: "country", autocomplete: "country" }
  ];

  const B2B_CONTACT_FIELDS = [
    { name: "fullName", label: "Nombre completo", placeholder: "Escribe tu nombre completo", type: "text", autocomplete: "name" },
    { name: "phone", label: "Teléfono", type: "tel", autocomplete: "tel" },
    { name: "email", label: "Correo electrónico", placeholder: "nombre@empresa.com", type: "email", autocomplete: "email" },
    { name: "company", label: "Nombre de la óptica o empresa", placeholder: "Escribe el nombre comercial", type: "text", autocomplete: "organization" },
    { name: "address", label: "Dirección", placeholder: "Escribe la dirección comercial", type: "text", autocomplete: "street-address", wide: true },
    { name: "city", label: "Ciudad", placeholder: "Escribe tu ciudad", type: "text", autocomplete: "address-level2" },
    { name: "country", label: "País de origen", type: "country", autocomplete: "country" }
  ];

  const B2C_QUESTIONS = [
    {
      name: "productInterest",
      label: "¿Qué producto o modelo Silhouette te interesa?",
      options: ["Montura óptica", "Lentes de sol", "Un modelo específico", "Aún no estoy seguro(a)"]
    },
    {
      name: "contactPreference",
      label: "¿Cómo prefieres continuar la atención?",
      options: ["WhatsApp", "Llamada telefónica", "Correo electrónico", "Solo quiero ver opciones por ahora"]
    }
  ];

  const B2B_QUESTIONS = [
    {
      name: "opticalProfile",
      label: "¿Cuál describe mejor el perfil actual de su óptica?",
      options: ["Premium / alta gama (Silhouette encaja muy bien aquí)", "Medio-alto (Silhouette puede encajar aquí)", "En transición a premium (podría aplicar)", "Precio / volumen"]
    },
    {
      name: "sellingRange",
      label: "¿Cuál es el rango de precio final que mejor vende su óptica?",
      options: ["$2,500 a $3,999 MXN", "$4,000 a $5,999 MXN (aquí entra Silhouette)", "$6,000 a $8,999 MXN (muy compatible con Silhouette)", "Más de $9,000 MXN (muy compatible con Silhouette)"]
    },
    {
      name: "premiumBrands",
      label: "¿Actualmente su óptica trabaja con marcas premium o de perfil alto?",
      options: ["Sí, de forma sólida (aquí encaja muy bien Silhouette)", "Estamos incorporando ese perfil (Silhouette podría aplicar)", "No trabajamos ese perfil actualmente"]
    },
    {
      name: "brandFamiliarity",
      label: "¿Qué tan familiarizada está su óptica con Silhouette?",
      options: ["Ya la hemos trabajado anteriormente", "Sí, la conocemos bien", "La hemos escuchado", "Aún no la conocemos", "La confundimos con otra marca"]
    },
    {
      name: "incorporationLikelihood",
      label: "¿Qué tan posible ve incorporar una marca como Silhouette en su óptica?",
      options: ["Muy posible (Silhouette encaja muy bien aquí)", "Sí, podría encajar (Silhouette puede entrar aquí)", "Tal vez, habría que revisarlo", "Más adelante", "No por ahora"]
    }
  ];

  const TRANSLATIONS = {
    en: {
      "Cerrar": "Close",
      "Silhouette · Roraima México": "Silhouette · Roraima Mexico",
      "¿Cómo quieres conocer Silhouette?": "How would you like to explore Silhouette?",
      "Antes de abrir la ficha del producto, indícanos qué tipo de atención necesitas. Los recorridos para comprador final y profesional se mantienen separados.": "Before opening the product page, tell us which type of service you need. Consumer and professional journeys remain separate.",
      "B2C · Comprador final": "B2C · Consumer",
      "Quiero comprar lentes": "I want to buy eyewear",
      "Explora la ficha como consumidor y cuéntanos qué modelo o experiencia estás buscando.": "Explore the product as a consumer and tell us which model or experience you are looking for.",
      "B2B · Profesional": "B2B · Professional",
      "Soy óptica o distribuidor": "I represent an optical store or distributor",
      "Continúa con la atención comercial, selección profesional y contacto con un asesor.": "Continue with commercial service, professional selection and advisor contact.",
      "Cuéntanos qué estás buscando": "Tell us what you are looking for",
      "Solicitud comercial Silhouette": "Silhouette commercial inquiry",
      "Completa tus datos y preferencias para continuar a la ficha. El país de origen debe seleccionarse antes de avanzar.": "Complete your contact details and preferences to continue. You must select your country of origin before proceeding.",
      "Completa los datos de tu óptica y las preguntas comerciales para continuar al producto y conservar el acceso B2B.": "Complete your optical business details and commercial questions to continue to the product and keep B2B access.",
      "B2B · Óptica o distribuidor": "B2B · Optical store or distributor",
      "Datos de contacto": "Contact details",
      "Tus preferencias": "Your preferences",
      "Perfil comercial": "Commercial profile",
      "Volver": "Back",
      "Continuar a la ficha": "Continue to product",
      "Tus datos se enviarán al CRM de Roraima México únicamente para responder esta solicitud. No se mezclan con otras marcas.": "Your data will be sent to Roraima Mexico's CRM only to respond to this request. It will not be mixed with other brands.",
      "Nombre completo": "Full name",
      "Escribe tu nombre completo": "Enter your full name",
      "Teléfono": "Phone",
      "Correo electrónico": "Email address",
      "nombre@correo.com": "name@example.com",
      "nombre@empresa.com": "name@company.com",
      "Ciudad": "City",
      "Escribe tu ciudad": "Enter your city",
      "País de origen": "Country of origin",
      "Nombre de la óptica o empresa": "Optical store or company name",
      "Escribe el nombre comercial": "Enter the business name",
      "Dirección": "Address",
      "Escribe la dirección comercial": "Enter the business address",
      "Buscar país...": "Search country...",
      "Abrir o cerrar la lista de países": "Open or close the country list",
      "No se encontraron países.": "No countries found.",
      "Prefijo": "Prefix",
      "Buscar país, código o prefijo": "Search country, code or prefix",
      "Buscar país, código o prefijo telefónico": "Search country, code or phone prefix",
      "Ej. México, MX o +52": "E.g. Mexico, MX or +52",
      "Prefijos internacionales": "International calling codes",
      "No se encontraron países o prefijos.": "No countries or calling codes found.",
      "Número de teléfono": "Phone number",
      "El prefijo y el número se guardan en formato internacional.": "The calling code and number are stored in international format.",
      "Selecciona un país válido de la lista.": "Select a valid country from the list.",
      "Selecciona un país y prefijo internacional de la lista.": "Select a country and international calling code from the list.",
      "Escribe el número de teléfono.": "Enter the phone number.",
      "Escribe solo el número nacional; el prefijo ya está seleccionado.": "Enter only the national number; the calling code is already selected.",
      "Revisa el número: debe tener entre 6 dígitos nacionales y 15 dígitos totales.": "Check the number: it must contain at least 6 national digits and no more than 15 total digits.",
      "No fue posible normalizar el teléfono.": "The phone number could not be normalized.",
      "Completa este campo.": "Complete this field.",
      "Selecciona una opción.": "Select an option.",
      "Escribe un correo electrónico válido.": "Enter a valid email address.",
      "¿Qué producto o modelo Silhouette te interesa?": "Which Silhouette product or model interests you?",
      "Montura óptica": "Optical frame",
      "Lentes de sol": "Sunglasses",
      "Un modelo específico": "A specific model",
      "Aún no estoy seguro(a)": "I am not sure yet",
      "¿Cómo prefieres continuar la atención?": "How would you prefer to continue?",
      "Llamada telefónica": "Phone call",
      "Correo electrónico": "Email",
      "Solo quiero ver opciones por ahora": "I only want to view options for now",
      "¿Cuál describe mejor el perfil actual de su óptica?": "Which best describes your optical store's current profile?",
      "Premium / alta gama (Silhouette encaja muy bien aquí)": "Premium / high-end (Silhouette is a strong fit)",
      "Medio-alto (Silhouette puede encajar aquí)": "Upper mid-range (Silhouette may fit)",
      "En transición a premium (podría aplicar)": "Transitioning to premium (may apply)",
      "Precio / volumen": "Price / volume",
      "¿Cuál es el rango de precio final que mejor vende su óptica?": "Which retail price range sells best in your optical store?",
      "$2,500 a $3,999 MXN": "$2,500 to $3,999 MXN",
      "$4,000 a $5,999 MXN (aquí entra Silhouette)": "$4,000 to $5,999 MXN (Silhouette fits here)",
      "$6,000 a $8,999 MXN (muy compatible con Silhouette)": "$6,000 to $8,999 MXN (highly compatible with Silhouette)",
      "Más de $9,000 MXN (muy compatible con Silhouette)": "More than $9,000 MXN (highly compatible with Silhouette)",
      "¿Actualmente su óptica trabaja con marcas premium o de perfil alto?": "Does your optical store currently carry premium or high-end brands?",
      "Sí, de forma sólida (aquí encaja muy bien Silhouette)": "Yes, with a strong premium presence (Silhouette fits very well)",
      "Estamos incorporando ese perfil (Silhouette podría aplicar)": "We are adding that profile (Silhouette may apply)",
      "No trabajamos ese perfil actualmente": "We do not currently carry that profile",
      "¿Qué tan familiarizada está su óptica con Silhouette?": "How familiar is your optical store with Silhouette?",
      "Ya la hemos trabajado anteriormente": "We have carried it before",
      "Sí, la conocemos bien": "Yes, we know it well",
      "La hemos escuchado": "We have heard of it",
      "Aún no la conocemos": "We do not know it yet",
      "La confundimos con otra marca": "We confuse it with another brand",
      "¿Qué tan posible ve incorporar una marca como Silhouette en su óptica?": "How likely is your optical store to add a brand such as Silhouette?",
      "Muy posible (Silhouette encaja muy bien aquí)": "Very likely (Silhouette is a strong fit)",
      "Sí, podría encajar (Silhouette puede entrar aquí)": "Yes, it could fit (Silhouette may work here)",
      "Tal vez, habría que revisarlo": "Maybe; we would need to review it",
      "Más adelante": "Later",
      "No por ahora": "Not for now",
      "Enviando de forma segura…": "Sending securely…",
      "No pudimos registrar tu solicitud. Revisa tu conexión e inténtalo nuevamente.": "We could not register your request. Check your connection and try again.",
      "Solicitud registrada": "Request registered",
      "Tus datos se registraron correctamente. Ya puedes continuar a la ficha del producto.": "Your information was registered successfully. You can now continue to the product page.",
      "Tus datos comerciales se registraron correctamente. Revisa el proceso de pedido antes de entrar a la ficha.": "Your commercial information was registered successfully. Review the ordering process before opening the product page.",
      "Revisar cómo preparar mi pedido": "Review how to prepare my order",
      "B2B · Siguiente paso": "B2B · Next step",
      "Cómo preparar tu pedido Silhouette": "How to prepare your Silhouette order",
      "Al entrar a la ficha podrás construir una selección profesional y contactar directamente con Distribuciones Roraima.": "On the product page you can build a professional selection and contact Distribuciones Roraima directly.",
      "Pasos para preparar el pedido profesional": "Steps to prepare the professional order",
      "Selecciona los productos específicos": "Select the specific products",
      "Revisa la ficha, el acabado y la referencia exacta que te interesa.": "Review the product, finish and exact reference you need.",
      "Agrégalos a «Mi pedido»": "Add them to “My order”",
      "Usa la acción de pedido para reunir las referencias y cantidades.": "Use the order action to collect references and quantities.",
      "Revisa cómo funciona el pedido": "Review how the order works",
      "Abre «Mi pedido» para comprobar la selección, las cantidades y los pasos profesionales.": "Open “My order” to check the selection, quantities and professional steps.",
      "Descarga el PDF": "Download the PDF",
      "Completa los datos requeridos y genera el documento de revisión.": "Complete the required details and generate the review document.",
      "Contacta por WhatsApp": "Contact us on WhatsApp",
      "Desde la acción existente, inicia voluntariamente el contacto directo con el distribuidor y adjunta el PDF. No se enviará ningún mensaje automáticamente.": "From the existing action, voluntarily start direct contact with the distributor and attach the PDF. No message will be sent automatically.",
      "Entrar a la ficha": "Open product page",
      "B2C · Directorio nacional": "B2C · National directory",
      "Encuentra una óptica cerca de ti": "Find an optical store near you",
      "Escribe tu ciudad, colonia o parte de tu dirección en México. El buscador consulta únicamente el directorio aprobado de ópticas Silhouette.": "Enter your city, neighborhood or part of your address in Mexico. The search uses only the approved Silhouette optical-store directory.",
      "Ciudad o dirección": "City or address",
      "Ej. Monterrey, Mérida o Avenida Vallarta": "E.g. Monterrey, Merida or Avenida Vallarta",
      "Buscar ópticas": "Search optical stores",
      "El directorio no incluye coordenadas. Esta versión local ordena coincidencias por ciudad/dirección y no afirma una distancia exacta ni realiza geocodificación externa.": "The directory does not include coordinates. This local version ranks matches by city/address and does not claim an exact distance or use external geocoding.",
      "Escribe al menos dos caracteres de tu ciudad o dirección.": "Enter at least two characters from your city or address.",
      "Volver a la ficha": "Return to product",
      "Encuentra tu óptica más cercana": "Find your nearest optical store"
    },
    fr: {
      "Cerrar": "Fermer",
      "Silhouette · Roraima México": "Silhouette · Roraima Mexico",
      "¿Cómo quieres conocer Silhouette?": "Comment souhaitez-vous découvrir Silhouette ?",
      "Antes de abrir la ficha del producto, indícanos qué tipo de atención necesitas. Los recorridos para comprador final y profesional se mantienen separados.": "Avant d’ouvrir la fiche produit, indiquez le type d’accompagnement souhaité. Les parcours particulier et professionnel restent séparés.",
      "B2C · Comprador final": "B2C · Particulier",
      "Quiero comprar lentes": "Je souhaite acheter des lunettes",
      "Explora la ficha como consumidor y cuéntanos qué modelo o experiencia estás buscando.": "Explorez la fiche comme particulier et indiquez le modèle ou l’expérience recherchés.",
      "B2B · Profesional": "B2B · Professionnel",
      "Soy óptica o distribuidor": "Je représente un opticien ou un distributeur",
      "Continúa con la atención comercial, selección profesional y contacto con un asesor.": "Poursuivez avec l’accompagnement commercial, la sélection professionnelle et un conseiller.",
      "Cuéntanos qué estás buscando": "Dites-nous ce que vous recherchez",
      "Solicitud comercial Silhouette": "Demande commerciale Silhouette",
      "Completa tus datos y preferencias para continuar a la ficha. El país de origen debe seleccionarse antes de avanzar.": "Renseignez vos coordonnées et vos préférences pour continuer. Le pays d’origine doit être sélectionné avant de poursuivre.",
      "Completa los datos de tu óptica y las preguntas comerciales para continuar al producto y conservar el acceso B2B.": "Renseignez les informations de votre magasin et les questions commerciales pour continuer vers le produit et conserver l’accès B2B.",
      "B2B · Óptica o distribuidor": "B2B · Opticien ou distributeur",
      "Datos de contacto": "Coordonnées",
      "Tus preferencias": "Vos préférences",
      "Perfil comercial": "Profil commercial",
      "Volver": "Retour",
      "Continuar a la ficha": "Continuer vers le produit",
      "Tus datos se enviarán al CRM de Roraima México únicamente para responder esta solicitud. No se mezclan con otras marcas.": "Vos données seront envoyées au CRM de Roraima Mexico uniquement pour répondre à cette demande. Elles ne seront pas mélangées avec d’autres marques.",
      "Nombre completo": "Nom complet",
      "Escribe tu nombre completo": "Saisissez votre nom complet",
      "Teléfono": "Téléphone",
      "Correo electrónico": "Adresse e-mail",
      "nombre@correo.com": "nom@exemple.com",
      "nombre@empresa.com": "nom@entreprise.com",
      "Ciudad": "Ville",
      "Escribe tu ciudad": "Saisissez votre ville",
      "País de origen": "Pays d’origine",
      "Nombre de la óptica o empresa": "Nom du magasin ou de l’entreprise",
      "Escribe el nombre comercial": "Saisissez le nom commercial",
      "Dirección": "Adresse",
      "Escribe la dirección comercial": "Saisissez l’adresse professionnelle",
      "Buscar país...": "Rechercher un pays...",
      "Abrir o cerrar la lista de países": "Ouvrir ou fermer la liste des pays",
      "No se encontraron países.": "Aucun pays trouvé.",
      "Prefijo": "Indicatif",
      "Buscar país, código o prefijo": "Rechercher un pays, un code ou un indicatif",
      "Buscar país, código o prefijo telefónico": "Rechercher un pays, un code ou un indicatif téléphonique",
      "Ej. México, MX o +52": "Ex. Mexique, MX ou +52",
      "Prefijos internacionales": "Indicatifs internationaux",
      "No se encontraron países o prefijos.": "Aucun pays ni indicatif trouvé.",
      "Número de teléfono": "Numéro de téléphone",
      "El prefijo y el número se guardan en formato internacional.": "L’indicatif et le numéro sont enregistrés au format international.",
      "Selecciona un país válido de la lista.": "Sélectionnez un pays valide dans la liste.",
      "Selecciona un país y prefijo internacional de la lista.": "Sélectionnez un pays et un indicatif international dans la liste.",
      "Escribe el número de teléfono.": "Saisissez le numéro de téléphone.",
      "Escribe solo el número nacional; el prefijo ya está seleccionado.": "Saisissez uniquement le numéro national ; l’indicatif est déjà sélectionné.",
      "Revisa el número: debe tener entre 6 dígitos nacionales y 15 dígitos totales.": "Vérifiez le numéro : au moins 6 chiffres nationaux et 15 chiffres au total au maximum.",
      "No fue posible normalizar el teléfono.": "Le numéro de téléphone n’a pas pu être normalisé.",
      "Completa este campo.": "Renseignez ce champ.",
      "Selecciona una opción.": "Sélectionnez une option.",
      "Escribe un correo electrónico válido.": "Saisissez une adresse e-mail valide.",
      "¿Qué producto o modelo Silhouette te interesa?": "Quel produit ou modèle Silhouette vous intéresse ?",
      "Montura óptica": "Monture optique",
      "Lentes de sol": "Lunettes de soleil",
      "Un modelo específico": "Un modèle précis",
      "Aún no estoy seguro(a)": "Je ne suis pas encore sûr(e)",
      "¿Cómo prefieres continuar la atención?": "Comment souhaitez-vous poursuivre ?",
      "Llamada telefónica": "Appel téléphonique",
      "Correo electrónico": "E-mail",
      "Solo quiero ver opciones por ahora": "Je souhaite seulement voir les options pour le moment",
      "¿Cuál describe mejor el perfil actual de su óptica?": "Quelle description correspond le mieux au profil actuel de votre magasin ?",
      "Premium / alta gama (Silhouette encaja muy bien aquí)": "Premium / haut de gamme (Silhouette convient très bien)",
      "Medio-alto (Silhouette puede encajar aquí)": "Moyen-haut de gamme (Silhouette peut convenir)",
      "En transición a premium (podría aplicar)": "Transition vers le premium (peut convenir)",
      "Precio / volumen": "Prix / volume",
      "¿Cuál es el rango de precio final que mejor vende su óptica?": "Quelle gamme de prix de vente fonctionne le mieux dans votre magasin ?",
      "$2,500 a $3,999 MXN": "2 500 à 3 999 MXN",
      "$4,000 a $5,999 MXN (aquí entra Silhouette)": "4 000 à 5 999 MXN (Silhouette se situe ici)",
      "$6,000 a $8,999 MXN (muy compatible con Silhouette)": "6 000 à 8 999 MXN (très compatible avec Silhouette)",
      "Más de $9,000 MXN (muy compatible con Silhouette)": "Plus de 9 000 MXN (très compatible avec Silhouette)",
      "¿Actualmente su óptica trabaja con marcas premium o de perfil alto?": "Votre magasin travaille-t-il actuellement avec des marques premium ou haut de gamme ?",
      "Sí, de forma sólida (aquí encaja muy bien Silhouette)": "Oui, de manière solide (Silhouette convient très bien)",
      "Estamos incorporando ese perfil (Silhouette podría aplicar)": "Nous intégrons ce profil (Silhouette peut convenir)",
      "No trabajamos ese perfil actualmente": "Nous ne travaillons pas encore ce profil",
      "¿Qué tan familiarizada está su óptica con Silhouette?": "Dans quelle mesure votre magasin connaît-il Silhouette ?",
      "Ya la hemos trabajado anteriormente": "Nous avons déjà travaillé avec la marque",
      "Sí, la conocemos bien": "Oui, nous la connaissons bien",
      "La hemos escuchado": "Nous en avons entendu parler",
      "Aún no la conocemos": "Nous ne la connaissons pas encore",
      "La confundimos con otra marca": "Nous la confondons avec une autre marque",
      "¿Qué tan posible ve incorporar una marca como Silhouette en su óptica?": "Quelle est la probabilité d’intégrer une marque comme Silhouette dans votre magasin ?",
      "Muy posible (Silhouette encaja muy bien aquí)": "Très probable (Silhouette convient très bien)",
      "Sí, podría encajar (Silhouette puede entrar aquí)": "Oui, elle pourrait convenir",
      "Tal vez, habría que revisarlo": "Peut-être, après examen",
      "Más adelante": "Plus tard",
      "No por ahora": "Pas pour le moment",
      "Enviando de forma segura…": "Envoi sécurisé…",
      "No pudimos registrar tu solicitud. Revisa tu conexión e inténtalo nuevamente.": "Nous n’avons pas pu enregistrer votre demande. Vérifiez votre connexion et réessayez.",
      "Solicitud registrada": "Demande enregistrée",
      "Tus datos se registraron correctamente. Ya puedes continuar a la ficha del producto.": "Vos informations ont été enregistrées. Vous pouvez maintenant continuer vers la fiche produit.",
      "Tus datos comerciales se registraron correctamente. Revisa el proceso de pedido antes de entrar a la ficha.": "Vos informations commerciales ont été enregistrées. Consultez le processus de commande avant d’ouvrir la fiche produit.",
      "Revisar cómo preparar mi pedido": "Voir comment préparer ma commande",
      "B2B · Siguiente paso": "B2B · Étape suivante",
      "Cómo preparar tu pedido Silhouette": "Comment préparer votre commande Silhouette",
      "Al entrar a la ficha podrás construir una selección profesional y contactar directamente con Distribuciones Roraima.": "Dans la fiche produit, vous pourrez composer une sélection professionnelle et contacter directement Distribuciones Roraima.",
      "Pasos para preparar el pedido profesional": "Étapes de préparation de la commande professionnelle",
      "Selecciona los productos específicos": "Sélectionnez les produits précis",
      "Revisa la ficha, el acabado y la referencia exacta que te interesa.": "Vérifiez la fiche, la finition et la référence exacte recherchée.",
      "Agrégalos a «Mi pedido»": "Ajoutez-les à « Ma commande »",
      "Usa la acción de pedido para reunir las referencias y cantidades.": "Utilisez l’action de commande pour regrouper les références et les quantités.",
      "Revisa cómo funciona el pedido": "Consultez le fonctionnement de la commande",
      "Abre «Mi pedido» para comprobar la selección, las cantidades y los pasos profesionales.": "Ouvrez « Ma commande » pour vérifier la sélection, les quantités et les étapes professionnelles.",
      "Descarga el PDF": "Téléchargez le PDF",
      "Completa los datos requeridos y genera el documento de revisión.": "Renseignez les informations demandées et générez le document de contrôle.",
      "Contacta por WhatsApp": "Contactez-nous sur WhatsApp",
      "Desde la acción existente, inicia voluntariamente el contacto directo con el distribuidor y adjunta el PDF. No se enviará ningún mensaje automáticamente.": "Depuis l’action existante, démarrez volontairement le contact avec le distributeur et joignez le PDF. Aucun message ne sera envoyé automatiquement.",
      "Entrar a la ficha": "Ouvrir la fiche produit",
      "B2C · Directorio nacional": "B2C · Annuaire national",
      "Encuentra una óptica cerca de ti": "Trouvez un opticien près de chez vous",
      "Escribe tu ciudad, colonia o parte de tu dirección en México. El buscador consulta únicamente el directorio aprobado de ópticas Silhouette.": "Saisissez votre ville, votre quartier ou une partie de votre adresse au Mexique. La recherche utilise uniquement l’annuaire agréé des opticiens Silhouette.",
      "Ciudad o dirección": "Ville ou adresse",
      "Ej. Monterrey, Mérida o Avenida Vallarta": "Ex. Monterrey, Mérida ou Avenida Vallarta",
      "Buscar ópticas": "Rechercher des opticiens",
      "El directorio no incluye coordenadas. Esta versión local ordena coincidencias por ciudad/dirección y no afirma una distancia exacta ni realiza geocodificación externa.": "L’annuaire ne contient pas de coordonnées. Cette version locale classe les résultats par ville/adresse, sans annoncer de distance exacte ni utiliser de géocodage externe.",
      "Escribe al menos dos caracteres de tu ciudad o dirección.": "Saisissez au moins deux caractères de votre ville ou adresse.",
      "Volver a la ficha": "Retour à la fiche produit",
      "Encuentra tu óptica más cercana": "Trouvez l’opticien le plus proche"
    }
  };

  let gate;
  let body;
  let pendingUrl = null;
  let directEntry = false;
  let activeAudience = null;
  let activeGateView = "closed";
  let previousFocus = null;
  let lastRenderedLanguage = "es";

  function currentLanguage() {
    const stored = window.localStorage.getItem(LANGUAGE_KEY);
    const documentLanguage = String(document.documentElement.lang || "").split("-")[0].toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
    return SUPPORTED_LANGUAGES.includes(documentLanguage) ? documentLanguage : "es";
  }

  function t(value) {
    const language = currentLanguage();
    return language === "es" ? value : TRANSLATIONS[language]?.[value] || value;
  }

  function localeTag() {
    return currentLanguage() === "es" ? "es-MX" : currentLanguage();
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function readGrant() {
    try {
      const value = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      return value && value.version === STORAGE_VERSION && ["b2c", "b2b"].includes(value.audience) ? value : null;
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  function writeGrant(audience) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, audience, completedAt: new Date().toISOString() }));
    document.documentElement.dataset.silAudience = audience;
  }

  function isProductUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      return url.origin === window.location.origin && PRODUCT_ROUTE.test(`${url.pathname}${url.hash}`);
    } catch {
      return false;
    }
  }

  function productSlugFromUrl(value) {
    try {
      const url = new URL(value || window.location.href, window.location.href);
      return `${url.pathname}${url.hash}`.match(/(?:\/|#\/)producto\/([a-z0-9-]+)/i)?.[1]?.toLowerCase() || "";
    } catch {
      return "";
    }
  }

  function trackAudienceFormComplete(audience, productSlug = productSlugFromUrl(pendingUrl || window.location.href)) {
    if (audience === "b2b" && !adsB2bConversionSent) {
      adsB2bConversionSent = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("event", "conversion", { send_to: ADS_B2B_CONVERSION_SEND_TO });
    }
    if (!productSlug || typeof window.__RORAIMA_TRACK_FORM_COMPLETE__ !== "function") return;
    window.__RORAIMA_TRACK_FORM_COMPLETE__({
      form_id: `silhouette_${audience}_product_gate`,
      audience,
      product_slug: productSlug
    }, `silhouette:${audience}:${productSlug}`);
  }

  function cleanFormValue(formData, name) {
    return String(formData.get(name) || "")
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function sha256(value) {
    if (!window.crypto?.subtle) throw new Error("crypto_unavailable");
    const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, "0")).join("");
  }

  async function serializeAudienceForm(form, audience, productSlug) {
    const formData = new FormData(form);
    const submittedAt = new Date().toISOString();
    const fullName = cleanFormValue(formData, "fullName");
    const payload = {
      schema_version: 1,
      source: "roraimamx.com",
      brand: "silhouette",
      audience,
      form_id: `silhouette_${audience}_product_gate`,
      language: currentLanguage(),
      product_slug: String(productSlug || "").trim().toLowerCase(),
      submitted_at: submittedAt,
      idempotency_key: "",
      full_name: fullName,
      phone_e164: cleanFormValue(formData, "phone"),
      email: cleanFormValue(formData, "email").toLowerCase(),
      city: cleanFormValue(formData, "city"),
      country: cleanFormValue(formData, "country").toUpperCase(),
      website: cleanFormValue(formData, "website"),
      test_mode: /^test no contactar\b/i.test(fullName)
    };

    if (audience === "b2c") {
      payload.product_interest = cleanFormValue(formData, "productInterest");
      payload.contact_preference = cleanFormValue(formData, "contactPreference");
    } else if (audience === "b2b") {
      payload.company_name = cleanFormValue(formData, "company");
      payload.address = cleanFormValue(formData, "address");
      payload.optical_profile = cleanFormValue(formData, "opticalProfile");
      payload.selling_range = cleanFormValue(formData, "sellingRange");
      payload.premium_brands = cleanFormValue(formData, "premiumBrands");
      payload.brand_familiarity = cleanFormValue(formData, "brandFamiliarity");
      payload.incorporation_likelihood = cleanFormValue(formData, "incorporationLikelihood");
    } else {
      throw new Error("invalid_audience");
    }

    const identityWindow = Math.floor(Date.parse(submittedAt) / IDEMPOTENCY_WINDOW_MS);
    const identity = [payload.audience, payload.email, payload.phone_e164, payload.product_slug, identityWindow].join("\n");
    payload.idempotency_key = `sha256:${await sha256(identity)}`;
    return payload;
  }

  function submissionMarkerKey(audience, productSlug) {
    return `${STORAGE_KEY}:submitted:${audience}:${productSlug}`;
  }

  function hasSubmissionMarker(audience, productSlug) {
    return Boolean(sessionStorage.getItem(submissionMarkerKey(audience, productSlug)));
  }

  function writeSubmissionMarker(audience, productSlug) {
    sessionStorage.setItem(submissionMarkerKey(audience, productSlug), new Date().toISOString());
  }

  function setFormSubmissionState(form, pending, message = "", state = "") {
    const submit = form.querySelector("button[type='submit']");
    const status = form.querySelector("[data-form-status]");
    if (submit) {
      submit.disabled = pending;
      submit.textContent = pending ? t("Enviando de forma segura…") : submit.dataset.readyLabel || t("Continuar a la ficha");
    }
    if (status) {
      status.textContent = message;
      status.hidden = !message;
      status.dataset.state = state;
    }
  }

  function validateLocalizedFields(form) {
    let firstInvalid = null;
    form.querySelectorAll("input[required]").forEach((input) => {
      if (input.matches("[data-country-search], [data-phone-national]")) return;
      input.setCustomValidity("");
      if (input.type === "radio") {
        const checked = form.querySelector(`input[type='radio'][name='${input.name}']:checked`);
        input.setCustomValidity(checked ? "" : t("Selecciona una opción."));
      } else if (!input.value.trim()) {
        input.setCustomValidity(t("Completa este campo."));
      } else if (input.type === "email" && !input.validity.valid) {
        input.setCustomValidity(t("Escribe un correo electrónico válido."));
      }
      if (!firstInvalid && !input.validity.valid) firstInvalid = input;
    });
    firstInvalid?.focus();
    return !firstInvalid;
  }

  async function submitAudienceForm(form, audience, productSlug) {
    const endpoint = WEBHOOK_ENDPOINTS[audience];
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.hostname !== "services.leadconnectorhq.com") throw new Error("webhook_not_allowed");
    const payload = await serializeAudienceForm(form, audience, productSlug);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url.href, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "strict-origin-when-cross-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok) throw new Error("webhook_submission_failed");
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function renderSubmissionConfirmation(audience) {
    activeAudience = audience;
    activeGateView = "confirmation";
    const isB2B = audience === "b2b";
    body.innerHTML = shell(`
      <p class="sil-audience-eyebrow">${escapeHtml(t(isB2B ? "B2B · Óptica o distribuidor" : "B2C · Comprador final"))}</p>
      <h1 class="sil-audience-title" id="sil-audience-title">${escapeHtml(t("Solicitud registrada"))}</h1>
      <p class="sil-audience-intro">${escapeHtml(t(isB2B ? "Tus datos comerciales se registraron correctamente. Revisa el proceso de pedido antes de entrar a la ficha." : "Tus datos se registraron correctamente. Ya puedes continuar a la ficha del producto."))}</p>
      <div class="sil-audience-form__actions sil-audience-form__actions--guide">
        <button class="sil-audience-button sil-audience-button--primary" type="button" data-gate-action="continue-after-submit">${escapeHtml(t(isB2B ? "Revisar cómo preparar mi pedido" : "Continuar a la ficha"))}</button>
      </div>`);
    body.scrollTop = 0;
    window.setTimeout(() => body.querySelector("[data-gate-action='continue-after-submit']")?.focus(), 0);
  }

  function catalogUrl() {
    const url = new URL(window.location.href);
    if (PRODUCT_ROUTE.test(url.hash)) {
      url.hash = "#/catalogo";
      return url.href;
    }
    url.pathname = `${window.__RORAIMA_SILHOUETTE_BASE__ || "/silhouette/"}catalogo`.replace(/\/{2,}/g, "/");
    url.hash = "";
    url.search = "";
    return url.href;
  }

  function countryOptions() {
    let displayNames;
    try {
      displayNames = new Intl.DisplayNames([localeTag(), "es-MX"], { type: "region" });
    } catch {
      displayNames = null;
    }
    const collator = new Intl.Collator(localeTag(), { sensitivity: "base" });
    return COUNTRY_CODES
      .map((code) => ({ code, label: displayNames ? displayNames.of(code) : code }))
      .filter((item) => item.label)
      .sort((left, right) => {
        if (left.code === "MX") return -1;
        if (right.code === "MX") return 1;
        return collator.compare(left.label, right.label);
      });
  }

  function flagEmoji(code) {
    return String(code || "")
      .toUpperCase()
      .replace(/[A-Z]/g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
  }

  function phoneCountryOptions() {
    return countryOptions()
      .filter(({ code }) => PHONE_DIAL_CODES[code])
      .map((item) => ({ ...item, dial: PHONE_DIAL_CODES[item.code], flag: flagEmoji(item.code) }));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderCountryField(classes, field) {
    const options = countryOptions();
    const listOptions = options.map(({ code, label }, index) => `
      <button id="sil-country-option-${index}" class="sil-country-option" type="button" role="option" aria-selected="false" data-country-code="${code}" data-country-label="${escapeHtml(label)}">
        ${escapeHtml(label)}
      </button>`).join("");
    const controlledOptions = options.map(({ code, label }) => `<option value="${code}">${escapeHtml(label)}</option>`).join("");
    return `
      <div class="${classes}">
        <label id="sil-country-label" for="sil-country-search">${escapeHtml(t(field.label))} *</label>
        <div class="sil-country-combobox">
          <div class="sil-country-input-shell">
            <input id="sil-country-search" class="sil-country-search" type="search" role="combobox" aria-labelledby="sil-country-label" aria-controls="sil-country-listbox" aria-expanded="false" aria-autocomplete="list" aria-required="true" placeholder="${escapeHtml(t("Buscar país..."))}" autocomplete="off" data-country-search required>
            <button class="sil-country-toggle" type="button" aria-label="${escapeHtml(t("Abrir o cerrar la lista de países"))}" aria-controls="sil-country-listbox" aria-expanded="false" data-country-toggle>
              <span aria-hidden="true"></span>
            </button>
          </div>
          <div id="sil-country-listbox" class="sil-country-listbox" role="listbox" aria-labelledby="sil-country-label" hidden>
            ${listOptions}
            <p class="sil-country-empty" role="status" hidden>${escapeHtml(t("No se encontraron países."))}</p>
          </div>
          <select class="sil-country-control-value" name="${field.name}" autocomplete="${field.autocomplete}" tabindex="-1" aria-hidden="true">
            <option value=""></option>${controlledOptions}
          </select>
        </div>
      </div>`;
  }

  function renderPhoneField(classes, field) {
    const options = phoneCountryOptions();
    const listOptions = options.map(({ code, label, dial, flag }, index) => `
      <button id="sil-phone-country-option-${index}" class="sil-phone-country-option" type="button" role="option" aria-selected="false" data-phone-country-code="${code}" data-phone-country-label="${escapeHtml(label)}" data-phone-dial="${dial}">
        <span class="sil-phone-country-flag" aria-hidden="true">${flag}</span>
        <span class="sil-phone-country-name">${escapeHtml(label)}</span>
        <span class="sil-phone-country-meta">${code} · +${dial}</span>
      </button>`).join("");
    const controlledOptions = options.map(({ code, label, dial }) => `<option value="${code}" data-dial="${dial}">${escapeHtml(label)} (+${dial})</option>`).join("");
    return `
      <div class="${classes} sil-phone-field">
        <span id="sil-phone-label">${escapeHtml(t(field.label))} *</span>
        <div class="sil-phone-control">
          <div class="sil-phone-prefix-combobox">
            <button class="sil-phone-prefix-toggle" type="button" aria-labelledby="sil-phone-label sil-phone-prefix-summary" aria-controls="sil-phone-country-panel" aria-expanded="false" aria-haspopup="listbox" aria-required="true" data-phone-toggle>
              <span id="sil-phone-prefix-summary" data-phone-summary><span aria-hidden="true">🌐</span> ${escapeHtml(t("Prefijo"))}</span>
              <span class="sil-phone-prefix-chevron" aria-hidden="true"></span>
            </button>
            <div id="sil-phone-country-panel" class="sil-phone-country-panel" hidden>
              <label class="sil-phone-country-search-label" for="sil-phone-country-search">${escapeHtml(t("Buscar país, código o prefijo"))}</label>
              <input id="sil-phone-country-search" class="sil-phone-country-search" type="search" role="combobox" aria-label="${escapeHtml(t("Buscar país, código o prefijo telefónico"))}" aria-controls="sil-phone-country-listbox" aria-expanded="false" aria-autocomplete="list" placeholder="${escapeHtml(t("Ej. México, MX o +52"))}" autocomplete="off" data-phone-search>
              <div id="sil-phone-country-listbox" class="sil-phone-country-listbox" role="listbox" aria-label="${escapeHtml(t("Prefijos internacionales"))}">
                ${listOptions}
                <p class="sil-phone-country-empty" role="status" hidden>${escapeHtml(t("No se encontraron países o prefijos."))}</p>
              </div>
            </div>
            <select class="sil-country-control-value" name="phoneCountry" tabindex="-1" aria-hidden="true">
              <option value=""></option>${controlledOptions}
            </select>
            <input type="hidden" name="phoneDialCode" value="">
            <input type="hidden" name="${field.name}" value="" data-phone-normalized>
          </div>
          <input class="sil-phone-national" name="phoneNational" type="tel" inputmode="tel" autocomplete="tel-national" aria-labelledby="sil-phone-label" aria-describedby="sil-phone-help sil-phone-error" placeholder="${escapeHtml(t("Número de teléfono"))}" data-phone-national required>
        </div>
        <small id="sil-phone-help" class="sil-phone-help">${escapeHtml(t("El prefijo y el número se guardan en formato internacional."))}</small>
        <small id="sil-phone-error" class="sil-phone-error" role="alert" hidden></small>
      </div>`;
  }

  function renderContactField(field) {
    const classes = `sil-audience-field${field.wide ? " sil-audience-field--wide" : ""}`;
    if (field.type === "country") return renderCountryField(classes, field);
    if (field.type === "tel") return renderPhoneField(classes, field);
    return `<label class="${classes}"><span>${escapeHtml(t(field.label))} *</span><input name="${field.name}" type="${field.type}" autocomplete="${field.autocomplete}"${field.placeholder ? ` placeholder="${escapeHtml(t(field.placeholder))}"` : ""} required></label>`;
  }

  function getCountryElements(input) {
    const combo = input.closest(".sil-country-combobox");
    return {
      combo,
      listbox: combo?.querySelector("[role='listbox']"),
      select: combo?.querySelector("select[name='country']"),
      empty: combo?.querySelector(".sil-country-empty"),
      toggle: combo?.querySelector("[data-country-toggle]")
    };
  }

  function visibleCountryOptions(input) {
    const { listbox } = getCountryElements(input);
    return listbox ? [...listbox.querySelectorAll("[data-country-code]")].filter((option) => !option.hidden) : [];
  }

  function setActiveCountryOption(input, option) {
    const { listbox } = getCountryElements(input);
    listbox?.querySelectorAll(".is-active").forEach((item) => item.classList.remove("is-active"));
    if (!option) {
      input.removeAttribute("aria-activedescendant");
      return;
    }
    option.classList.add("is-active");
    input.setAttribute("aria-activedescendant", option.id);
    option.scrollIntoView({ block: "nearest" });
  }

  function openCountryList(input) {
    const { listbox, toggle } = getCountryElements(input);
    if (!listbox) return;
    listbox.hidden = false;
    input.setAttribute("aria-expanded", "true");
    toggle?.setAttribute("aria-expanded", "true");
    const selected = listbox.querySelector("[aria-selected='true']");
    setActiveCountryOption(input, selected || visibleCountryOptions(input)[0]);
  }

  function closeCountryList(input) {
    const { listbox, toggle } = getCountryElements(input);
    if (!listbox) return;
    listbox.hidden = true;
    input.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    listbox.querySelectorAll(".is-active").forEach((item) => item.classList.remove("is-active"));
  }

  function filterCountryOptions(input) {
    const { listbox, select, empty } = getCountryElements(input);
    if (!listbox || !select) return;
    select.value = "";
    input.setCustomValidity("");
    listbox.querySelectorAll("[aria-selected='true']").forEach((item) => item.setAttribute("aria-selected", "false"));
    const query = normalizeText(input.value);
    let visibleCount = 0;
    listbox.querySelectorAll("[data-country-code]").forEach((option) => {
      const matches = !query || normalizeText(option.dataset.countryLabel).includes(query);
      option.hidden = !matches;
      if (matches) visibleCount += 1;
    });
    if (empty) empty.hidden = visibleCount > 0;
    openCountryList(input);
    setActiveCountryOption(input, visibleCountryOptions(input)[0]);
  }

  function selectCountryOption(input, option) {
    const { listbox, select } = getCountryElements(input);
    if (!listbox || !select || !option) return;
    input.value = option.dataset.countryLabel;
    input.setCustomValidity("");
    select.value = option.dataset.countryCode;
    listbox.querySelectorAll("[aria-selected='true']").forEach((item) => item.setAttribute("aria-selected", "false"));
    option.setAttribute("aria-selected", "true");
    input.focus();
    closeCountryList(input);
  }

  function validateControlledCountry(form) {
    const input = form.querySelector("[data-country-search]");
    if (!input) return true;
    const { select } = getCountryElements(input);
    const isValid = Boolean(select?.value);
    input.setCustomValidity(isValid ? "" : t("Selecciona un país válido de la lista."));
    if (!isValid) input.focus();
    return isValid;
  }

  function getPhoneElements(element) {
    const field = element?.closest?.(".sil-phone-field") || (element?.matches?.(".sil-phone-field") ? element : null);
    const combo = element?.closest?.(".sil-phone-prefix-combobox") || field?.querySelector(".sil-phone-prefix-combobox") || element;
    return {
      combo,
      field,
      toggle: combo?.querySelector("[data-phone-toggle]"),
      panel: combo?.querySelector(".sil-phone-country-panel"),
      search: combo?.querySelector("[data-phone-search]"),
      listbox: combo?.querySelector(".sil-phone-country-listbox"),
      select: combo?.querySelector("select[name='phoneCountry']"),
      dialInput: combo?.querySelector("input[name='phoneDialCode']"),
      normalizedInput: combo?.querySelector("[data-phone-normalized]"),
      numberInput: field?.querySelector("[data-phone-national]"),
      summary: combo?.querySelector("[data-phone-summary]"),
      empty: combo?.querySelector(".sil-phone-country-empty"),
      error: field?.querySelector(".sil-phone-error")
    };
  }

  function visiblePhoneOptions(element) {
    const { listbox } = getPhoneElements(element);
    return listbox ? [...listbox.querySelectorAll("[data-phone-country-code]")].filter((option) => !option.hidden) : [];
  }

  function setActivePhoneOption(element, option) {
    const { search, listbox } = getPhoneElements(element);
    listbox?.querySelectorAll(".is-active").forEach((item) => item.classList.remove("is-active"));
    if (!option) {
      search?.removeAttribute("aria-activedescendant");
      return;
    }
    option.classList.add("is-active");
    search?.setAttribute("aria-activedescendant", option.id);
    option.scrollIntoView({ block: "nearest" });
  }

  function openPhoneList(element, focusSearch = false) {
    const { panel, search, toggle, listbox } = getPhoneElements(element);
    if (!panel || !search || !toggle || !listbox) return;
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    search.setAttribute("aria-expanded", "true");
    const selected = listbox.querySelector("[aria-selected='true']");
    setActivePhoneOption(element, selected || visiblePhoneOptions(element)[0]);
    if (focusSearch) window.setTimeout(() => search.focus(), 0);
  }

  function closePhoneList(element, restoreFocus = false) {
    const { panel, search, toggle, listbox } = getPhoneElements(element);
    if (!panel) return;
    panel.hidden = true;
    toggle?.setAttribute("aria-expanded", "false");
    search?.setAttribute("aria-expanded", "false");
    search?.removeAttribute("aria-activedescendant");
    listbox?.querySelectorAll(".is-active").forEach((item) => item.classList.remove("is-active"));
    if (restoreFocus) toggle?.focus();
  }

  function filterPhoneOptions(search) {
    const { listbox, empty } = getPhoneElements(search);
    if (!listbox) return;
    const query = normalizeText(search.value);
    let visibleCount = 0;
    listbox.querySelectorAll("[data-phone-country-code]").forEach((option) => {
      const searchable = `${option.dataset.phoneCountryLabel} ${option.dataset.phoneCountryCode} +${option.dataset.phoneDial} ${option.dataset.phoneDial}`;
      const matches = !query || normalizeText(searchable).includes(query);
      option.hidden = !matches;
      if (matches) visibleCount += 1;
    });
    if (empty) empty.hidden = visibleCount > 0;
    openPhoneList(search, false);
    setActivePhoneOption(search, visiblePhoneOptions(search)[0]);
  }

  function clearPhoneError(element) {
    const { numberInput, toggle, error } = getPhoneElements(element);
    numberInput?.setCustomValidity("");
    toggle?.removeAttribute("aria-invalid");
    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  }

  function updatePhoneNormalized(element) {
    const { select, dialInput, normalizedInput, numberInput } = getPhoneElements(element);
    if (!normalizedInput || !numberInput) return "";
    const raw = numberInput.value.trim();
    const digits = raw.replace(/\D/g, "");
    const selectedDial = select?.selectedOptions?.[0]?.dataset?.dial || "";
    if (dialInput) dialInput.value = selectedDial ? `+${selectedDial}` : "";
    const dial = selectedDial.replace(/\D/g, "");
    const allowed = /^[0-9\s().-]*$/.test(raw);
    const totalDigits = dial.length + digits.length;
    const isValid = Boolean(select?.value && dial && allowed && digits.length >= 6 && totalDigits >= 7 && totalDigits <= 15);
    normalizedInput.value = isValid ? `+${dial}${digits}` : "";
    return normalizedInput.value;
  }

  function selectPhoneOption(element, option) {
    const { listbox, select, dialInput, summary, numberInput, search } = getPhoneElements(element);
    if (!listbox || !select || !dialInput || !summary || !option) return;
    const code = option.dataset.phoneCountryCode;
    const dial = option.dataset.phoneDial;
    const label = option.dataset.phoneCountryLabel;
    select.value = code;
    dialInput.value = `+${dial}`;
    summary.innerHTML = `<span class="sil-phone-country-flag" aria-hidden="true">${flagEmoji(code)}</span><span>+${escapeHtml(dial)}</span>`;
    summary.setAttribute("aria-label", `${label}, ${t("Prefijo")} +${dial}`);
    listbox.querySelectorAll("[aria-selected='true']").forEach((item) => item.setAttribute("aria-selected", "false"));
    option.setAttribute("aria-selected", "true");
    if (search) search.value = "";
    listbox.querySelectorAll("[data-phone-country-code]").forEach((item) => { item.hidden = false; });
    clearPhoneError(element);
    closePhoneList(element, false);
    updatePhoneNormalized(element);
    numberInput?.focus();
  }

  function validateControlledPhone(form) {
    const field = form.querySelector(".sil-phone-field");
    if (!field) return true;
    const { select, dialInput, normalizedInput, numberInput, toggle, error } = getPhoneElements(field);
    const raw = numberInput?.value.trim() || "";
    const digits = raw.replace(/\D/g, "");
    const dial = (dialInput?.value || "").replace(/\D/g, "");
    let message = "";
    let focusTarget = numberInput;
    if (!select?.value || !dial) {
      message = t("Selecciona un país y prefijo internacional de la lista.");
      focusTarget = toggle;
    } else if (!raw) {
      message = t("Escribe el número de teléfono.");
    } else if (!/^[0-9\s().-]+$/.test(raw) || raw.includes("+")) {
      message = t("Escribe solo el número nacional; el prefijo ya está seleccionado.");
    } else if (digits.length < 6 || dial.length + digits.length > 15) {
      message = t("Revisa el número: debe tener entre 6 dígitos nacionales y 15 dígitos totales.");
    }
    updatePhoneNormalized(field);
    if (!message && !normalizedInput?.value) message = t("No fue posible normalizar el teléfono.");
    numberInput?.setCustomValidity(message);
    toggle?.toggleAttribute("aria-invalid", Boolean(message && focusTarget === toggle));
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
    if (message) focusTarget?.focus();
    return !message;
  }

  function renderQuestion(question, index) {
    const options = question.options.map((option, optionIndex) => `
      <label class="sil-audience-option">
        <input type="radio" name="${question.name}" value="${escapeHtml(option)}"${optionIndex === 0 ? " required" : ""}>
        <span>${escapeHtml(t(option))}</span>
      </label>`).join("");
    return `<fieldset class="sil-audience-question"><legend>${index + 1}. ${escapeHtml(t(question.label))}</legend><div class="sil-audience-options">${options}</div></fieldset>`;
  }

  function shell(content, closeLabel = t("Cerrar")) {
    return `
      <div class="sil-audience-dialog__topline"></div>
      <div class="sil-audience-dialog__body">
        <button class="sil-audience-dialog__close" type="button" data-gate-action="close" aria-label="${closeLabel}">×</button>
        ${content}
      </div>`;
  }

  function renderChoice() {
    activeAudience = null;
    activeGateView = "choice";
    body.innerHTML = shell(`
      <p class="sil-audience-eyebrow">${escapeHtml(t("Silhouette · Roraima México"))}</p>
      <h1 class="sil-audience-title" id="sil-audience-title">${escapeHtml(t("¿Cómo quieres conocer Silhouette?"))}</h1>
      <p class="sil-audience-intro">${escapeHtml(t("Antes de abrir la ficha del producto, indícanos qué tipo de atención necesitas. Los recorridos para comprador final y profesional se mantienen separados."))}</p>
      <div class="sil-audience-choice-grid">
        <button class="sil-audience-choice" type="button" data-audience="b2c">
          <b>${escapeHtml(t("B2C · Comprador final"))}</b>
          <span>${escapeHtml(t("Quiero comprar lentes"))}</span>
          <small>${escapeHtml(t("Explora la ficha como consumidor y cuéntanos qué modelo o experiencia estás buscando."))}</small>
        </button>
        <button class="sil-audience-choice" type="button" data-audience="b2b">
          <b>${escapeHtml(t("B2B · Profesional"))}</b>
          <span>${escapeHtml(t("Soy óptica o distribuidor"))}</span>
          <small>${escapeHtml(t("Continúa con la atención comercial, selección profesional y contacto con un asesor."))}</small>
        </button>
      </div>`);
    body.scrollTop = 0;
    window.setTimeout(() => body.querySelector("[data-audience]")?.focus(), 0);
  }

  function renderForm(audience) {
    activeAudience = audience;
    activeGateView = "form";
    const isB2C = audience === "b2c";
    const contactFields = isB2C ? B2C_CONTACT_FIELDS : B2B_CONTACT_FIELDS;
    const questions = isB2C ? B2C_QUESTIONS : B2B_QUESTIONS;
    const title = isB2C ? "Cuéntanos qué estás buscando" : "Solicitud comercial Silhouette";
    const intro = isB2C
      ? "Completa tus datos y preferencias para continuar a la ficha. El país de origen debe seleccionarse antes de avanzar."
      : "Completa los datos de tu óptica y las preguntas comerciales para continuar al producto y conservar el acceso B2B.";
    body.innerHTML = shell(`
      <p class="sil-audience-eyebrow">${escapeHtml(t(isB2C ? "B2C · Comprador final" : "B2B · Óptica o distribuidor"))}</p>
      <h1 class="sil-audience-title" id="sil-audience-title">${escapeHtml(t(title))}</h1>
      <p class="sil-audience-intro">${escapeHtml(t(intro))}</p>
      <form class="sil-audience-form" data-form-audience="${audience}">
        <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="sil-audience-honeypot">
        <fieldset class="sil-audience-section">
          <legend>${escapeHtml(t("Datos de contacto"))}</legend>
          <div class="sil-audience-contact-grid">${contactFields.map(renderContactField).join("")}</div>
        </fieldset>
        <fieldset class="sil-audience-section">
          <legend>${escapeHtml(t(isB2C ? "Tus preferencias" : "Perfil comercial"))}</legend>
          ${questions.map(renderQuestion).join("")}
        </fieldset>
        <div class="sil-audience-form__actions">
          <button class="sil-audience-button sil-audience-button--secondary" type="button" data-gate-action="back">${escapeHtml(t("Volver"))}</button>
          <button class="sil-audience-button sil-audience-button--primary" type="submit" data-ready-label="${escapeHtml(t("Continuar a la ficha"))}">${escapeHtml(t("Continuar a la ficha"))}</button>
        </div>
        <p class="sil-audience-submit-status" role="status" aria-live="polite" data-form-status hidden></p>
        <p class="sil-audience-privacy">${escapeHtml(t("Tus datos se enviarán al CRM de Roraima México únicamente para responder esta solicitud. No se mezclan con otras marcas."))}</p>
      </form>`);
    body.scrollTop = 0;
    window.setTimeout(() => body.querySelector("input, select")?.focus(), 0);
  }

  function captureFormState() {
    const form = body?.querySelector(".sil-audience-form");
    if (!form) return null;
    const values = {};
    new FormData(form).forEach((value, key) => { values[key] = String(value); });
    values.phoneNational = form.querySelector("[data-phone-national]")?.value || "";
    return { audience: form.dataset.formAudience, values };
  }

  function restoreFormState(snapshot) {
    if (!snapshot?.values) return;
    const form = body?.querySelector(".sil-audience-form");
    if (!form) return;
    Object.entries(snapshot.values).forEach(([name, value]) => {
      if (["country", "phoneCountry", "phone", "phoneDialCode", "phoneNational"].includes(name)) return;
      const inputs = [...form.querySelectorAll(`[name='${name}']`)];
      inputs.forEach((input) => {
        if (input.type === "radio") input.checked = input.value === value;
        else input.value = value;
      });
    });
    const countryInput = form.querySelector("[data-country-search]");
    const countryOption = [...form.querySelectorAll("[data-country-code]")].find((option) => option.dataset.countryCode === snapshot.values.country);
    if (countryInput && countryOption) selectCountryOption(countryInput, countryOption);
    const phoneOption = [...form.querySelectorAll("[data-phone-country-code]")].find((option) => option.dataset.phoneCountryCode === snapshot.values.phoneCountry);
    if (phoneOption) selectPhoneOption(phoneOption, phoneOption);
    const phoneNumber = form.querySelector("[data-phone-national]");
    if (phoneNumber) {
      phoneNumber.value = snapshot.values.phoneNational || "";
      updatePhoneNormalized(phoneNumber);
    }
  }

  function rerenderGateForLanguage() {
    const language = currentLanguage();
    if (language === lastRenderedLanguage) return;
    lastRenderedLanguage = language;
    if (!gate || gate.hidden) {
      applyAudienceVisibility();
      return;
    }
    const formState = captureFormState();
    const opticianQuery = body?.querySelector("[data-optician-query]")?.value || "";
    if (activeGateView === "choice") renderChoice();
    else if (activeGateView === "form" && activeAudience) {
      renderForm(activeAudience);
      restoreFormState(formState);
    } else if (activeGateView === "confirmation" && activeAudience) renderSubmissionConfirmation(activeAudience);
    else if (activeGateView === "b2b-guide") renderB2BGuide();
    else if (activeGateView === "optician") {
      renderOpticianLocator();
      const query = body.querySelector("[data-optician-query]");
      if (query && opticianQuery) {
        query.value = opticianQuery;
        renderOpticianResults(opticianQuery);
      }
    }
  }

  function opticianDirectory() {
    return Array.isArray(window.__RORAIMA_SILHOUETTE_OPTICAS__) ? window.__RORAIMA_SILHOUETTE_OPTICAS__ : [];
  }

  function opticianMatches(query) {
    const normalizedQuery = normalizeText(query);
    const tokens = normalizedQuery.split(" ").filter((token) => token.length > 1);
    if (!normalizedQuery || !tokens.length) return [];
    return opticianDirectory()
      .map((item) => {
        const normalizedName = normalizeText(item.name);
        const normalizedAddress = normalizeText(item.address);
        const searchable = `${normalizedName} ${normalizedAddress}`;
        if (!tokens.every((token) => searchable.includes(token))) return null;
        let score = searchable.includes(normalizedQuery) ? 500 : 0;
        if (normalizedAddress.includes(normalizedQuery)) score += 300;
        if (normalizedName.includes(normalizedQuery)) score += 200;
        tokens.forEach((token) => {
          if (normalizedAddress.includes(token)) score += 12;
          if (normalizedName.includes(token)) score += 8;
        });
        return { item, score };
      })
      .filter(Boolean)
      .sort((left, right) => right.score - left.score || left.item.name.localeCompare(right.item.name, "es"))
      .map(({ item }) => item);
  }

  function approvedRouteUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && /(^|\.)google\.com$/i.test(url.hostname) && url.pathname.startsWith("/maps/") ? url.href : "";
    } catch {
      return "";
    }
  }

  function renderOpticianResults(query) {
    const results = body?.querySelector("[data-optician-results]");
    const status = body?.querySelector("[data-optician-status]");
    if (!results || !status) return;
    const cleanQuery = String(query || "").trim();
    if (cleanQuery.length < 2) {
      status.textContent = "Escribe al menos dos caracteres de tu ciudad o dirección.";
      results.innerHTML = "";
      return;
    }
    const matches = opticianMatches(cleanQuery);
    if (!matches.length) {
      status.textContent = `No encontramos coincidencias verificadas para «${cleanQuery}». Prueba con otra ciudad, colonia o parte de la dirección.`;
      results.innerHTML = "";
      return;
    }
    const shown = matches.slice(0, 12);
    status.textContent = `${matches.length} ${matches.length === 1 ? "óptica coincide" : "ópticas coinciden"} con tu ubicación. Se ordenan por relevancia del texto, no por distancia geográfica.`;
    results.innerHTML = shown.map((item, index) => {
      const route = approvedRouteUrl(item.route);
      return `
        <article class="sil-optician-card"${index === 0 ? " data-best-text-match" : ""}>
          ${index === 0 ? '<p class="sil-optician-card__match">Mejor coincidencia de ubicación</p>' : ""}
          <h2>${escapeHtml(item.name)}</h2>
          <p><strong>Dirección</strong><span>${escapeHtml(item.address)}</span></p>
          ${item.phone ? `<p><strong>Teléfono</strong><span>${escapeHtml(item.phone)}</span></p>` : ""}
          ${item.hours ? `<p><strong>Horario</strong><span>${escapeHtml(item.hours)}</span></p>` : ""}
          ${route ? `<a class="sil-optician-route" href="${escapeHtml(route)}" target="_blank" rel="noopener noreferrer">Abrir ubicación proporcionada</a>` : '<small class="sil-optician-no-route">La fuente no proporciona un enlace de ubicación para esta óptica.</small>'}
        </article>`;
    }).join("");
  }

  function renderOpticianLocator() {
    activeAudience = "b2c";
    activeGateView = "optician";
    body.innerHTML = shell(`
      <p class="sil-audience-eyebrow">${escapeHtml(t("B2C · Directorio nacional"))}</p>
      <h1 class="sil-audience-title" id="sil-audience-title">${escapeHtml(t("Encuentra una óptica cerca de ti"))}</h1>
      <p class="sil-audience-intro">${escapeHtml(t("Escribe tu ciudad, colonia o parte de tu dirección en México. El buscador consulta únicamente el directorio aprobado de ópticas Silhouette."))}</p>
      <form class="sil-optician-search" data-optician-search-form>
        <label for="sil-optician-query">${escapeHtml(t("Ciudad o dirección"))}</label>
        <div class="sil-optician-search__controls">
          <input id="sil-optician-query" type="search" placeholder="${escapeHtml(t("Ej. Monterrey, Mérida o Avenida Vallarta"))}" autocomplete="street-address" data-optician-query required minlength="2">
          <button class="sil-audience-button sil-audience-button--primary" type="submit">${escapeHtml(t("Buscar ópticas"))}</button>
        </div>
      </form>
      <p class="sil-optician-limit">${escapeHtml(t("El directorio no incluye coordenadas. Esta versión local ordena coincidencias por ciudad/dirección y no afirma una distancia exacta ni realiza geocodificación externa."))}</p>
      <p class="sil-optician-status" role="status" aria-live="polite" data-optician-status>${escapeHtml(t("Escribe al menos dos caracteres de tu ciudad o dirección."))}</p>
      <div class="sil-optician-results" data-optician-results></div>
      <div class="sil-audience-form__actions">
        <button class="sil-audience-button sil-audience-button--secondary" type="button" data-gate-action="close">${escapeHtml(t("Volver a la ficha"))}</button>
      </div>`);
    body.scrollTop = 0;
    window.setTimeout(() => body.querySelector("[data-optician-query]")?.focus(), 0);
  }

  function openOpticianLocator(button) {
    if (readGrant()?.audience !== "b2c") return;
    if (!gate) createGate();
    previousFocus = button || document.activeElement;
    pendingUrl = null;
    directEntry = false;
    lastRenderedLanguage = currentLanguage();
    renderOpticianLocator();
    gate.hidden = false;
    document.body.classList.add("sil-audience-gate-open");
  }

  function ensureOpticianButton() {
    const existing = document.querySelector(".sil-b2c-optician-button");
    const isB2CProduct = readGrant()?.audience === "b2c" && isProductUrl(window.location.href);
    const label = t("Encuentra tu óptica más cercana");
    if (!isB2CProduct) {
      existing?.remove();
      return;
    }
    if (existing) {
      if (existing.textContent !== label) existing.textContent = label;
      return;
    }
    const advisor = [...document.querySelectorAll("button, a")].find((element) => /^contactar (?:con |un )?asesor$/i.test(normalizeText(element.textContent)));
    if (!advisor?.parentElement) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sil-b2c-optician-button";
    button.textContent = label;
    button.setAttribute("aria-haspopup", "dialog");
    button.addEventListener("click", () => openOpticianLocator(button));
    advisor.insertAdjacentElement("afterend", button);
  }

  function renderB2BGuide() {
    activeAudience = "b2b";
    activeGateView = "b2b-guide";
    body.innerHTML = shell(`
      <p class="sil-audience-eyebrow">${escapeHtml(t("B2B · Siguiente paso"))}</p>
      <h1 class="sil-audience-title" id="sil-audience-title">${escapeHtml(t("Cómo preparar tu pedido Silhouette"))}</h1>
      <p class="sil-audience-intro">${escapeHtml(t("Al entrar a la ficha podrás construir una selección profesional y contactar directamente con Distribuciones Roraima."))}</p>
      <ol class="sil-b2b-guide" aria-label="${escapeHtml(t("Pasos para preparar el pedido profesional"))}">
        <li><b>1</b><span><strong>${escapeHtml(t("Selecciona los productos específicos"))}</strong><small>${escapeHtml(t("Revisa la ficha, el acabado y la referencia exacta que te interesa."))}</small></span></li>
        <li><b>2</b><span><strong>${escapeHtml(t("Agrégalos a «Mi pedido»"))}</strong><small>${escapeHtml(t("Usa la acción de pedido para reunir las referencias y cantidades."))}</small></span></li>
        <li><b>3</b><span><strong>${escapeHtml(t("Revisa cómo funciona el pedido"))}</strong><small>${escapeHtml(t("Abre «Mi pedido» para comprobar la selección, las cantidades y los pasos profesionales."))}</small></span></li>
        <li><b>4</b><span><strong>${escapeHtml(t("Descarga el PDF"))}</strong><small>${escapeHtml(t("Completa los datos requeridos y genera el documento de revisión."))}</small></span></li>
        <li><b>5</b><span><strong>${escapeHtml(t("Contacta por WhatsApp"))}</strong><small>${escapeHtml(t("Desde la acción existente, inicia voluntariamente el contacto directo con el distribuidor y adjunta el PDF. No se enviará ningún mensaje automáticamente."))}</small></span></li>
      </ol>
      <div class="sil-audience-form__actions sil-audience-form__actions--guide">
        <button class="sil-audience-button sil-audience-button--primary" type="button" data-gate-action="continue-b2b">${escapeHtml(t("Entrar a la ficha"))}</button>
      </div>`);
    body.scrollTop = 0;
    window.setTimeout(() => {
      body.querySelector("[data-gate-action='continue-b2b']")?.focus({ preventScroll: true });
      body.scrollTop = 0;
    }, 0);
  }

  function createGate() {
    gate = document.createElement("div");
    gate.className = "sil-audience-gate";
    gate.hidden = true;
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "sil-audience-title");
    gate.innerHTML = '<div class="sil-audience-dialog" role="document"></div>';
    body = gate.firstElementChild;
    document.body.appendChild(gate);

    gate.addEventListener("click", (event) => {
      const phoneOption = event.target.closest("[data-phone-country-code]");
      if (phoneOption) {
        selectPhoneOption(phoneOption, phoneOption);
        return;
      }
      const phoneToggle = event.target.closest("[data-phone-toggle]");
      if (phoneToggle) {
        if (phoneToggle.getAttribute("aria-expanded") === "true") closePhoneList(phoneToggle, true);
        else openPhoneList(phoneToggle, true);
        return;
      }
      const countryToggle = event.target.closest("[data-country-toggle]");
      if (countryToggle) {
        const input = countryToggle.closest(".sil-country-combobox")?.querySelector("[data-country-search]");
        if (!input) return;
        if (countryToggle.getAttribute("aria-expanded") === "true") closeCountryList(input);
        else {
          openCountryList(input);
          input.focus();
        }
        return;
      }
      const countryOption = event.target.closest("[data-country-code]");
      if (countryOption) {
        const input = countryOption.closest(".sil-country-combobox")?.querySelector("[data-country-search]");
        if (input) selectCountryOption(input, countryOption);
        return;
      }
      const audienceButton = event.target.closest("[data-audience]");
      if (audienceButton) {
        renderForm(audienceButton.dataset.audience);
        return;
      }
      const actionButton = event.target.closest("[data-gate-action]");
      if (!actionButton) return;
      if (actionButton.dataset.gateAction === "back") renderChoice();
      if (actionButton.dataset.gateAction === "close") closeGate(true);
      if (actionButton.dataset.gateAction === "continue-after-submit") {
        if (activeAudience === "b2b") {
          renderB2BGuide();
        } else {
          writeGrant("b2c");
          applyAudienceVisibility();
          continueToProduct();
        }
      }
      if (actionButton.dataset.gateAction === "continue-b2b") {
        writeGrant("b2b");
        applyAudienceVisibility();
        continueToProduct();
      }
    });

    gate.addEventListener("focusin", (event) => {
      const input = event.target.closest("[data-country-search]");
      if (input) openCountryList(input);
      const phoneNumber = event.target.closest("[data-phone-national]");
      if (phoneNumber) closePhoneList(phoneNumber, false);
    });

    gate.addEventListener("input", (event) => {
      const input = event.target.closest("[data-country-search]");
      if (input) filterCountryOptions(input);
      const phoneSearch = event.target.closest("[data-phone-search]");
      if (phoneSearch) filterPhoneOptions(phoneSearch);
      const phoneNumber = event.target.closest("[data-phone-national]");
      if (phoneNumber) {
        clearPhoneError(phoneNumber);
        updatePhoneNormalized(phoneNumber);
      }
      const requiredField = event.target.closest(".sil-audience-form input[required]");
      if (requiredField && !requiredField.matches("[data-country-search], [data-phone-national]")) requiredField.setCustomValidity("");
      const opticianQuery = event.target.closest("[data-optician-query]");
      if (opticianQuery) renderOpticianResults(opticianQuery.value);
    });

    gate.addEventListener("keydown", (event) => {
      const countryToggle = event.target.closest("[data-country-toggle]");
      if (countryToggle && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        const countryInput = countryToggle.closest(".sil-country-combobox")?.querySelector("[data-country-search]");
        if (countryInput) {
          openCountryList(countryInput);
          countryInput.focus();
        }
        return;
      }
      if (countryToggle && event.key === "Escape") {
        event.preventDefault();
        const countryInput = countryToggle.closest(".sil-country-combobox")?.querySelector("[data-country-search]");
        if (countryInput) closeCountryList(countryInput);
        return;
      }

      const phoneToggle = event.target.closest("[data-phone-toggle]");
      if (phoneToggle && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        openPhoneList(phoneToggle, true);
        return;
      }
      if (phoneToggle && event.key === "Escape") {
        event.preventDefault();
        closePhoneList(phoneToggle, false);
        return;
      }

      const phoneSearch = event.target.closest("[data-phone-search]");
      if (phoneSearch) {
        const options = visiblePhoneOptions(phoneSearch);
        const currentIndex = options.findIndex((option) => option.classList.contains("is-active"));
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          openPhoneList(phoneSearch, false);
          const direction = event.key === "ArrowDown" ? 1 : -1;
          const nextIndex = currentIndex < 0 ? (direction > 0 ? 0 : options.length - 1) : (currentIndex + direction + options.length) % options.length;
          setActivePhoneOption(phoneSearch, options[nextIndex]);
        } else if (event.key === "Enter" && phoneSearch.getAttribute("aria-expanded") === "true") {
          const active = options.find((option) => option.classList.contains("is-active"));
          if (active) {
            event.preventDefault();
            selectPhoneOption(phoneSearch, active);
          }
        } else if (event.key === "Escape") {
          event.preventDefault();
          closePhoneList(phoneSearch, true);
        } else if (event.key === "Tab") {
          closePhoneList(phoneSearch, false);
        }
        return;
      }

      const input = event.target.closest("[data-country-search]");
      if (!input) return;
      const options = visibleCountryOptions(input);
      const currentIndex = options.findIndex((option) => option.classList.contains("is-active"));
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openCountryList(input);
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = currentIndex < 0 ? (direction > 0 ? 0 : options.length - 1) : (currentIndex + direction + options.length) % options.length;
        setActiveCountryOption(input, options[nextIndex]);
      } else if (event.key === "Enter" && input.getAttribute("aria-expanded") === "true") {
        const active = options.find((option) => option.classList.contains("is-active"));
        if (active) {
          event.preventDefault();
          selectCountryOption(input, active);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeCountryList(input);
      } else if (event.key === "Tab") {
        closeCountryList(input);
      }
    });

    gate.addEventListener("submit", async (event) => {
      const opticianForm = event.target.closest("[data-optician-search-form]");
      if (opticianForm) {
        event.preventDefault();
        const input = opticianForm.querySelector("[data-optician-query]");
        if (input?.reportValidity()) renderOpticianResults(input.value);
        return;
      }
      const form = event.target.closest(".sil-audience-form");
      if (!form) return;
      event.preventDefault();
      const phoneValid = validateControlledPhone(form);
      const countryValid = validateControlledCountry(form);
      const localizedFieldsValid = validateLocalizedFields(form);
      if (!phoneValid || !countryValid || !localizedFieldsValid) {
        form.reportValidity();
        return;
      }
      if (!form.reportValidity()) return;
      const audience = form.dataset.formAudience;
      const productSlug = productSlugFromUrl(pendingUrl || window.location.href);
      if (!audience || !productSlug) return;
      if (hasSubmissionMarker(audience, productSlug)) {
        renderSubmissionConfirmation(audience);
        return;
      }
      setFormSubmissionState(form, true);
      try {
        await submitAudienceForm(form, audience, productSlug);
        writeSubmissionMarker(audience, productSlug);
        trackAudienceFormComplete(audience, productSlug);
        renderSubmissionConfirmation(audience);
      } catch {
        setFormSubmissionState(form, false, t("No pudimos registrar tu solicitud. Revisa tu conexión e inténtalo nuevamente."), "error");
      }
    });
  }

  function openGate(url, isDirect = false) {
    if (!gate) createGate();
    pendingUrl = url || window.location.href;
    directEntry = isDirect;
    previousFocus = document.activeElement;
    lastRenderedLanguage = currentLanguage();
    renderChoice();
    gate.hidden = false;
    document.body.classList.add("sil-audience-gate-open");
  }

  function closeGate(cancelled = false) {
    if (!gate || gate.hidden) return;
    gate.hidden = true;
    document.body.classList.remove("sil-audience-gate-open");
    previousFocus?.focus?.();
    if (cancelled && directEntry && !readGrant()) window.location.replace(catalogUrl());
    pendingUrl = null;
    directEntry = false;
    activeAudience = null;
    activeGateView = "closed";
  }

  function continueToProduct() {
    const destination = pendingUrl;
    const alreadyThere = destination && new URL(destination, window.location.href).href === window.location.href;
    closeGate(false);
    if (destination && !alreadyThere) {
      window.location.assign(destination);
      return;
    }
    applyAudienceVisibility();
  }

  function applyAudienceVisibility() {
    const grant = readGrant();
    const isB2C = grant?.audience === "b2c";
    document.documentElement.dataset.silAudience = grant?.audience || "";
    document.querySelectorAll(".sil-audience-hidden").forEach((element) => element.classList.remove("sil-audience-hidden"));
    if (!isB2C) {
      ensureOpticianButton();
      return;
    }
    document.querySelectorAll(".btn-card-order, .sil-order-fab").forEach((element) => element.classList.add("sil-audience-hidden"));
    document.querySelectorAll("button, a").forEach((element) => {
      if (B2B_BUTTON.test(normalizeText(element.textContent))) element.classList.add("sil-audience-hidden");
    });
    ensureOpticianButton();
  }

  function interceptProductNavigation(event) {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || readGrant()) return;
    const anchor = event.target.closest?.("a[href]");
    if (!anchor || !isProductUrl(anchor.href)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openGate(anchor.href, false);
  }

  function checkDirectProductRoute() {
    if (!readGrant() && isProductUrl(window.location.href) && (!gate || gate.hidden)) openGate(window.location.href, true);
    applyAudienceVisibility();
  }

  function init() {
    createGate();
    lastRenderedLanguage = currentLanguage();
    document.addEventListener("click", interceptProductNavigation, true);
    window.addEventListener("popstate", checkDirectProductRoute);
    window.addEventListener("hashchange", checkDirectProductRoute);
    const gateObserver = new MutationObserver((records) => {
      if (records.some((record) => record.type === "attributes" && record.attributeName === "lang")) rerenderGateForLanguage();
      if (records.some((record) => record.type === "childList")) applyAudienceVisibility();
    });
    gateObserver.observe(document.getElementById("app") || document.body, { childList: true, subtree: true });
    gateObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    checkDirectProductRoute();
  }

  window.__RORAIMA_SILHOUETTE_AUDIENCE_GATE__ = {
    getState: () => ({ grant: readGrant(), pendingUrl, directEntry, activeAudience }),
    open: (url = window.location.href) => openGate(url, isProductUrl(window.location.href)),
    reset: () => {
      sessionStorage.removeItem(STORAGE_KEY);
      delete document.documentElement.dataset.silAudience;
      applyAudienceVisibility();
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
