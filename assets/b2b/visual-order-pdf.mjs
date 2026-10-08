let pdfLibPromise;

function loadPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (!pdfLibPromise) {
    pdfLibPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/vendor/pdf-lib.min.js";
      script.onload = () => window.PDFLib ? resolve(window.PDFLib) : reject(new Error("No se pudo iniciar el generador PDF."));
      script.onerror = () => reject(new Error("No se pudo cargar el generador PDF."));
      document.head.appendChild(script);
    });
  }
  return pdfLibPromise;
}

function pdfText(value) {
  // Standard PDF fonts cannot encode every Unicode symbol.
  return String(value ?? "")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[^\x20-\x7E\u00A1-\u00FF]/g, " ")
    .replace(/\s+/g, " ").trim();
}

export async function downloadVisualOrderPdf({ items, customer, signature }) {
  if (!Array.isArray(items) || items.length < 1) throw new Error("Añade al menos un producto antes de descargar el PDF.");
  const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(.12, .12, .13);
  const muted = rgb(.38, .37, .36);
  const gold = rgb(.84, .61, .1);
  let page;
  let y;

  const newPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    y = 795;
    page.drawText("RORAIMA DISTRIBUCIONES", { x: 42, y, size: 16, font: bold, color: ink });
    page.drawRectangle({ x: 42, y: y - 15, width: 511, height: 2, color: gold });
    y -= 42;
  };
  const ensureSpace = (height) => { if (y - height < 62) newPage(); };
  const line = (text, { font = regular, size = 10, color = ink, indent = 0 } = {}) => {
    const words = pdfText(text).split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > 505 - indent && current) {
        ensureSpace(18);
        page.drawText(current, { x: 44 + indent, y, size, font, color });
        y -= 17;
        current = word;
      } else current = candidate;
    }
    if (current) {
      ensureSpace(18);
      page.drawText(current, { x: 44 + indent, y, size, font, color });
      y -= 17;
    }
  };

  newPage();
  line("BORRADOR DE PEDIDO PROFESIONAL", { font: bold, size: 13 });
  line(`Fecha: ${new Date().toLocaleDateString("es-MX")}`, { color: muted });
  line("Documento descargado por el usuario. No confirma recepcion, disponibilidad, precio ni compra.", { color: muted });
  y -= 12;
  line("DATOS DEL CLIENTE / OPTICA", { font: bold, size: 11 });
  const fields = [
    ["Optica", customer.optical_name], ["Razon social", customer.company_name],
    ["Contacto", customer.contact_name], ["Correo", customer.email],
    ["Telefono", customer.phone], ["Ciudad", customer.city],
    ["Pais", customer.country], ["Direccion", customer.address],
    ["Observaciones", customer.notes],
  ];
  for (const [label, value] of fields) if (value) line(`${label}: ${value}`);
  y -= 12;
  line("PRODUCTOS SELECCIONADOS", { font: bold, size: 11 });
  let currentBrand = "";
  let total = 0;
  for (const item of items) {
    if (item.brand !== currentBrand) {
      currentBrand = item.brand;
      y -= 8;
      line(currentBrand === "silhouette" ? "SILHOUETTE" : "ALFRED KERBS", { font: bold, size: 10 });
    }
    const quantity = Math.max(1, Number(item.quantity) || 1);
    total += quantity;
    line(`${quantity} x ${item.name || item.model || item.sku} | ${item.sku || "Sin referencia"} | ${item.color || "Sin color"}`, { indent: 10 });
  }
  y -= 8;
  line(`Total de piezas: ${total}`, { font: bold, size: 11 });
  y -= 16;
  ensureSpace(130);
  line("FIRMA DEL CLIENTE", { font: bold, size: 11 });
  if (signature) {
    const image = await pdf.embedPng(signature);
    const scaled = image.scaleToFit(300, 95);
    page.drawImage(image, { x: 44, y: y - scaled.height, width: scaled.width, height: scaled.height });
    y -= 110;
  } else {
    line("Sin firma manuscrita", { color: muted });
  }
  line("La firma dibujada es una constancia visual; este PDF no incorpora firma electronica certificada.", { color: muted, size: 9 });

  const bytes = await pdf.save();
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `roraima-pedido-borrador-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
