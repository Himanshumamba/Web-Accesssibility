window.GA_MEASUREMENT_ID = "G-ZW63XDF22R";

(function () {
  var id = window.GA_MEASUREMENT_ID;

  if (!id || id === "YOUR_GA_MEASUREMENT_ID") {
    return;
  }

  var externalScript = document.createElement("script");
  externalScript.async = true;
  externalScript.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
  document.head.appendChild(externalScript);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", id);
})();
