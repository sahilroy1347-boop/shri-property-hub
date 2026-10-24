const SUPABASE_URL = "https://cbqsjvyrgaaiarplcnps.supabase.co";
const SUPABASE_KEY = "sb_publishable_RYvYwAM-e2-t8JvrraZlyw_NoL3L8Ic";
console.log("Supabase URL:", SUPABASE_URL);
console.log("Supabase Key Prefix:", SUPABASE_KEY.substring(0, 15));

const sbClient = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : null;


const locationName = value => ({
  mumbai: "Mumbai",
  "navi-mumbai": "Navi Mumbai",
  thane: "Thane"
}[value] || value || "Location on request");

const typeName = value => ({
  apartment: "Apartment",
  commercial: "Commercial",
  plot: "Plot & Land"
}[value] || value || "Property");

const purposeName = value =>
  value === "rent" ? "For Rent" : "For Sale";

function makeElement(tag, className, text) {
  const el = document.createElement(tag);

  if (className) el.className = className;

  if (text !== undefined && text !== null) {
    el.textContent = String(text);
  }

  return el;
}

async function loadProperties() {
  if (!sbClient) {
    throw new Error("Supabase client did not load.");
  }

  const { data, error } = await sbClient
    .from("properties")
    .select("id,title,purpose,type,location,price,bedrooms,area,address,image,description,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Array.isArray(data) ? data : [];
}

function safeImageUrl(value) {
  try {
    const url = new URL(String(value || "").trim());

    return ["https:", "http:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function setPropertyImage(element, image) {
  if (!element) return;

  const url = safeImageUrl(image);

  if (url) {
    element.style.backgroundImage =
      `url("${url.replace(/["\\\n\r]/g, "")}")`;
  } else {
    element.style.backgroundImage = "";
    element.classList.add("no-property-image");
  }
}

// HOMEPAGE

async function renderHomepage() {
  const grid = document.getElementById("propertyGrid");

  if (!grid) return;

  const message = document.getElementById("resultMessage");

  grid.replaceChildren();

  if (message) {
    message.textContent = "Loading properties…";
  }

  let properties;

  try {
    properties = await loadProperties();
  } catch (error) {
    console.log("ERROR MESSAGE:", error.message);
console.log("ERROR CODE:", error.code);
console.log("ERROR DETAILS:", error.details);
console.log("ERROR HINT:", error.hint);

    if (message) {
      message.textContent =
        "Properties could not be loaded. Please refresh or try again later.";
    }

    return;
  }

  if (!properties.length) {
    if (message) {
      message.textContent =
        "No properties listed yet. Please check back soon.";
    }

    return;
  }

  properties.forEach(property => {
    const card = makeElement("article", "property-card");

    card.dataset.id = property.id;
    card.dataset.purpose = property.purpose || "";
    card.dataset.type = property.type || "";
    card.dataset.location = property.location || "";

    const photo = makeElement("div", "property-image");

    setPropertyImage(photo, property.image);

    photo.append(
      makeElement("span", "tag", purposeName(property.purpose)),
      makeElement("span", "image-label", "LISTING")
    );

    const info = makeElement("div", "property-info");

    info.append(
      makeElement(
        "p",
        "property-location",
        locationName(property.location)
      ),
      makeElement(
        "h3",
        "",
        property.title || "Property"
      ),
      makeElement(
        "p",
        "details",
        `${typeName(property.type)} · ${property.bedrooms || "Details on request"}`
      )
    );

    const bottom = makeElement("div", "property-bottom");

    bottom.append(
      makeElement(
        "strong",
        "",
        property.price || "Price on request"
      )
    );

    const link = makeElement("a", "view-link", "View Details →");

    link.href =
      `property-details.html?id=${encodeURIComponent(property.id)}`;

    bottom.append(link);

    info.append(bottom);

    card.append(photo, info);

    grid.append(card);
  });

  const form = document.getElementById("searchForm");

  if (form && !form.dataset.bound) {
    form.dataset.bound = "true";

    form.addEventListener("submit", event => {
      event.preventDefault();

      const purpose =
        document.getElementById("purpose")?.value || "all";

      const type =
        document.getElementById("propertyType")?.value || "all";

      const location =
        document.getElementById("location")?.value || "all";

      let count = 0;

      grid.querySelectorAll(".property-card").forEach(card => {
        const matches =
          (purpose === "all" || card.dataset.purpose === purpose) &&
          (type === "all" || card.dataset.type === type) &&
          (location === "all" || card.dataset.location === location);

        card.hidden = !matches;

        if (matches) count++;
      });

      if (message) {
        message.textContent = `${count} listing(s) found.`;
      }
    });
  }

  if (message) {
    message.textContent = `${properties.length} listing(s) available.`;
  }
}

// PROPERTY DETAILS PAGE

async function renderDetailsPage() {
  const content = document.getElementById("detailsContent");

  if (!content) return;

  const status = document.getElementById("detailsStatus");

  const missing = document.getElementById("detailsNotFound");

  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    if (status) status.hidden = true;

    if (missing) missing.hidden = false;

    return;
  }

  if (status) {
    status.textContent = "Loading property details…";
  }

  let property;

  try {
    if (!sbClient) {
      throw new Error("Supabase client did not load.");
    }

    const { data, error } = await sbClient
      .from("properties")
      .select("id,title,purpose,type,location,price,bedrooms,area,address,image,description")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    property = data;

  } catch (error) {
    console.error("Property details load failed:", error);

    if (status) {
      status.textContent =
        "Could not load property details. Please refresh and try again.";
    }

    return;
  }

  if (!property) {
    if (status) status.hidden = true;

    if (missing) missing.hidden = false;

    return;
  }

  document.title =
    `${property.title || "Property"} | Shri Property Hub`;

  document.getElementById("detailLocation").textContent =
    locationName(property.location);

  document.getElementById("detailTitle").textContent =
    property.title || "Property";

  document.getElementById("detailAddress").textContent =
    property.address || "Address on request";

  document.getElementById("detailPurpose").textContent =
    purposeName(property.purpose);

  document.getElementById("detailPrice").textContent =
    property.price || "Price on request";

  document.getElementById("detailDescription").textContent =
    property.description ||
    "Please contact Shri Property Hub for more information.";

  setPropertyImage(
    document.getElementById("detailPhoto"),
    property.image
  );

  const features = [
    ["Property Type", typeName(property.type)],
    ["Bedrooms", property.bedrooms || "Not specified"],
    ["Area", property.area || "Not specified"],
    ["Availability", "Confirm with agent"]
  ];

  const featureGrid =
    document.getElementById("detailFeatures");

  featureGrid.replaceChildren();

  features.forEach(([label, value]) => {
    const item = makeElement("div", "feature-item");

    item.append(
      makeElement("span", "", label),
      makeElement("strong", "", value)
    );

    featureGrid.append(item);
  });

  const whatsappNumber = "918127787178";

  const whatsappMessage =
    `Hello Shri Property Hub, I am interested in ${property.title || "this property"} in ${locationName(property.location)}. Please share details.`;

  document.getElementById("detailWhatsApp").href =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  if (status) status.hidden = true;

  content.hidden = false;
}

// RUN

document.addEventListener("DOMContentLoaded", () => {
  renderHomepage();

  renderDetailsPage();
});
