(function () {
  const brandName = "Roraima Distribuciones";
  const salesEmail = "ventas@roraimamx.net";
  const salesPhone = "+52 1 56 1008 4344";
  const salesAddress = "Av. Jaime Balmes 11, Torre A, Piso 1, Int. B, C.P. 11510, Miguel Hidalgo, Col. Polanco I Secci\u00f3n, CDMX (Plaza Polanco)";

  function replaceText(node) {
    const value = node.nodeValue;
    if (!value) return;
    node.nodeValue = value
      .replaceAll("Innova Boutique", brandName)
      .replaceAll("INNOVA BOUTIQUE", "RORAIMA DISTRIBUCIONES")
      .replaceAll("Innova Eyewear", brandName)
      .replaceAll("INNOVA EYEWEAR", "RORAIMA DISTRIBUCIONES")
      .replaceAll("Innova Fashion Accessories", brandName)
      .replaceAll("info@innova-eyewear.com", salesEmail)
      .replaceAll("+1 (754) 270-4613", salesPhone)
      .replaceAll("1206 Stirling Road Ste 3B", salesAddress)
      .replaceAll("Dania Beach, FL 33004", "");
  }

  function applyIdentity() {
    document.title = `${brandName} \u00b7 Portafolio de \u00f3ptica de lujo`;
    document.querySelectorAll("img[src*='innova'], img[alt*='Innova']").forEach((image) => {
      image.src = "assets/roraima-logo.png";
      image.alt = brandName;
    });
    document.querySelectorAll("a[href*='innova-eyewear.com'], a[href^='mailto:']").forEach((link) => {
      link.href = `mailto:${salesEmail}`;
      link.textContent = salesEmail;
    });
    document.querySelectorAll("a[href^='tel:+1754']").forEach((link) => {
      link.href = "tel:+5215610084344";
      link.textContent = salesPhone;
    });
    document.querySelectorAll("a[href*='wa.me/1754']").forEach((link) => {
      link.href = "https://wa.me/5215610084344";
      link.textContent = salesPhone;
    });
    document.querySelectorAll("p").forEach((node) => {
      if (/Dania Beach|1206 Stirling Road/i.test(node.textContent)) node.textContent = salesAddress;
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(replaceText);
    document.querySelectorAll("[aria-label]").forEach((node) => {
      node.setAttribute("aria-label", node.getAttribute("aria-label")
        .replaceAll("Innova Boutique", brandName)
        .replaceAll("Innova Eyewear", brandName));
    });
  }

  applyIdentity();
  window.addEventListener("roraima-catalog:languagechange", applyIdentity);
})();
