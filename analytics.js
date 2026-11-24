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

  window.trackLeadEvent = function (method) {
    window.gtag("event", "generate_lead", {
      method: method || "contact_form"
    });
  };

  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link) {
      return;
    }

    var href = link.getAttribute("href") || "";
    if (href.indexOf("calendly.com/") !== -1) {
      window.gtag("event", "book_call_click", {
        link_url: href
      });
    } else if (href.indexOf("mailto:") === 0) {
      window.gtag("event", "email_contact_click");
    }
  });
})();
