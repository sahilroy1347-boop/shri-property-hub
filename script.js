
const STORAGE_KEY = "shriPropertyHubListings";

const demoProperties = [
  {
    id: "apartment",
    title: "Modern Family Apartment",
    location: "navi-mumbai",
    address: "Navi Mumbai, Maharashtra",
    purpose: "buy",
    type: "apartment",
    price: "Price on request",
    bedrooms: "2 BHK",
    area: "Add verified area",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80",
    description: "Demo listing for a residential apartment. Confirm all details and availability before publishing."
  },
  {
    id: "office",
    title: "Commercial Office Space",
    location: "thane",
    address: "Thane, Maharashtra",
    purpose: "rent",
    type: "commercial",
    price: "Rent on request",
    bedrooms: "Not applicable",
    area: "Add verified area",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80",
    description: "Demo commercial office listing. Confirm the actual rent, area and terms before publishing."
  },
  {
    id: "plot",
    title: "Land & Investment Opportunity",
    location: "mumbai",
    address: "Mumbai Region, Maharashtra",
    purpose: "buy",
    type: "plot",
    price: "Price on request",
    bedrooms: "Not applicable",
    area: "Add verified area",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80",
    description: "Demo land listing. Verify ownership, location, plot area and permitted use."
  }
];

function loadProperties() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return demoProperties.map(p => ({ ...p }));

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error("Invalid listing data");

    return parsed;
  } catch (error) {
    console.error("Could not load property listings:", error);
    return demoProperties.map(p => ({ ...p }));
  }
}

function saveProperties(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error("Could not save listings:", error);
    alert("Could not save. Browser storage may be unavailable or full.");
    return false;
  }
}

function safeText(value) {
  return String(value ?? "");
}

function locationName(value) {
  return ({
    "mumbai": "Mumbai",
    "navi-mumbai": "Navi Mumbai",
    "thane": "Thane"
  })[value] || value;
}

function typeName(value) {
  return ({
    "apartment": "Apartment",
    "commercial": "Commercial",
    "plot": "Plot & Land"
  })[value] || value;
}

function purposeName(value) {
  return value === "rent" ? "For Rent" : "For Sale";
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// HOMEPAGE
function renderHomepage() {
  const grid = document.getElementById("propertyGrid");
  if (!grid) return;

  const properties = loadProperties();
  grid.replaceChildren();

  properties.forEach(property => {
    const card = makeElement("article", "property-card");
    card.dataset.id = property.id;
    card.dataset.purpose = property.purpose;
    card.dataset.type = property.type;
    card.dataset.location = property.location;

    const photo = makeElement("div", "property-image");
    photo.style.backgroundImage =
      `url("${String(property.image).replace(/["\\\n\r]/g, "")}")`;

    const tag = makeElement("span", "tag", purposeName(property.purpose));
    const label = makeElement("span", "image-label", "LISTING");
    photo.append(tag, label);

    const info = makeElement("div", "property-info");
    info.append(makeElement("p", "property-location", locationName(property.location)));
    info.append(makeElement("h3", "", property.title));
    info.append(makeElement("p", "details",
      `${typeName(property.type)} · ${property.bedrooms || "Details on request"}`));

    const bottom = makeElement("div", "property-bottom");
    bottom.append(makeElement("strong", "", property.price));

    const link = makeElement("a", "view-link", "View Details →");
    link.href = `property-details.html?id=${encodeURIComponent(property.id)}`;
    bottom.append(link);

    info.append(bottom);
    card.append(photo, info);
    grid.append(card);
  });

  const form = document.getElementById("searchForm");
  if (form && !form.dataset.bound) {
    form.dataset.bound = "true";

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const purpose = document.getElementById("purpose").value;
      const type = document.getElementById("propertyType").value;
      const location = document.getElementById("location").value;
      let count = 0;

      grid.querySelectorAll(".property-card").forEach(card => {
        const matches =
          (purpose === "all" || card.dataset.purpose === purpose) &&
          (type === "all" || card.dataset.type === type) &&
          (location === "all" || card.dataset.location === location);

        card.hidden = !matches;
        if (matches) count++;
      });

      const message = document.getElementById("resultMessage");
      if (message) message.textContent = `${count} listing(s) found.`;
    });
  }
}

// DETAILS PAGE
function renderDetailsPage() {
  const content = document.getElementById("detailsContent");
  if (!content) return;

  const id = new URLSearchParams(location.search).get("id");
  const property = loadProperties().find(p => p.id === id);
  const status = document.getElementById("detailsStatus");
  const missing = document.getElementById("detailsNotFound");

  if (!property) {
    if (status) status.hidden = true;
    if (missing) missing.hidden = false;
    return;
  }

  document.title = `${property.title} | Shri Property Hub`;

  document.getElementById("detailLocation").textContent =
    locationName(property.location);
  document.getElementById("detailTitle").textContent = property.title;
  document.getElementById("detailAddress").textContent = property.address;
  document.getElementById("detailPurpose").textContent = purposeName(property.purpose);
  document.getElementById("detailPrice").textContent = property.price;
  document.getElementById("detailDescription").textContent = property.description;

  document.getElementById("detailPhoto").style.backgroundImage =
    `url("${String(property.image).replace(/["\\\n\r]/g, "")}")`;

  const features = [
    ["Property Type", typeName(property.type)],
    ["Bedrooms", property.bedrooms || "Not specified"],
    ["Area", property.area || "Not specified"],
    ["Availability", "Confirm with agent"]
  ];

  const featureGrid = document.getElementById("detailFeatures");
  featureGrid.replaceChildren();

  features.forEach(([label, value]) => {
    const item = makeElement("div", "feature-item");
    item.append(makeElement("span", "", label));
    item.append(makeElement("strong", "", value));
    featureGrid.append(item);
  });

  const number = "918127787178"; // Replace with your real WhatsApp number
  const message = `Hello Shri Property Hub, I am interested in ${property.title} in ${locationName(property.location)}. Please share details.`;

  document.getElementById("detailWhatsApp").href =
    `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  if (status) status.hidden = true;
  content.hidden = false;
}

// ADMIN PANEL
function renderAdmin() {
  const form = document.getElementById("propertyForm");
  const listElement = document.getElementById("adminListings");
  if (!form || !listElement) return;

  const byId = id => document.getElementById(id);
  const message = byId("formMessage");

  function resetForm() {
    form.reset();
    byId("propertyId").value = "";
    byId("formTitle").textContent = "Add New Property";
    byId("saveButton").textContent = "Save Property";
    byId("cancelButton").hidden = true;
  }

  function drawListings() {
    const listings = loadProperties();
    listElement.replaceChildren();
    byId("listingCount").textContent = `(${listings.length})`;

    if (listings.length === 0) {
      listElement.append(makeElement("p", "", "No listings yet. Add your first property above."));
      return;
    }

    listings.forEach(property => {
      const row = makeElement("div", "admin-listing");
      const img = document.createElement("img");
      img.src = property.image;
      img.alt = "Property preview";
      img.loading = "lazy";
      img.onerror = () => { img.removeAttribute("src"); };

      const info = makeElement("div", "admin-listing-info");
      info.append(makeElement("h3", "", property.title));
      info.append(makeElement("p", "", `${locationName(property.location)} · ${purposeName(property.purpose)}`));
      info.append(makeElement("p", "", property.price));

      const actions = makeElement("div", "admin-listing-actions");
      const edit = makeElement("button", "admin-edit", "Edit");
      edit.type = "button";
      edit.addEventListener("click", () => {
        byId("propertyId").value = property.id;
        byId("title").value = property.title;
        byId("purpose").value = property.purpose;
        byId("type").value = property.type;
        byId("location").value = property.location;
        byId("price").value = property.price;
        byId("bedrooms").value = property.bedrooms || "";
        byId("area").value = property.area || "";
        byId("address").value = property.address;
        byId("imageUrl").value = property.image || "";
        byId("description").value = property.description;
        byId("formTitle").textContent = "Edit Property";
        byId("saveButton").textContent = "Update Property";
        byId("cancelButton").hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      const del = makeElement("button", "admin-delete", "Delete");
      del.type = "button";
      del.addEventListener("click", () => {
        if (!confirm(`Delete "${property.title}"? This cannot be undone in this demo.`)) return;

        const remaining = loadProperties().filter(p => p.id !== property.id);
        if (saveProperties(remaining)) {
          drawListings();
          message.textContent = "Listing deleted from this browser.";
        }
      });

      actions.append(edit, del);
      row.append(img, info, actions);
      listElement.append(row);
    });
  }

 form.addEventListener("submit", async event => {
    event.preventDefault();

    const id = byId("propertyId").value;
    const current = loadProperties();
let imageUrl = byId("imageUrl").value.trim();
const selectedFile = imageFileInput?.files?.[0];

if (selectedFile) {
  try {
    message.textContent = "Uploading property photo...";
    imageUrl = await uploadPropertyImage(selectedFile);
  } catch (error) {
    console.error("Photo upload failed:", error);
    message.textContent = "Photo upload failed. Please try again.";
    return;
  }
}
    const property = {
      id: id || `property-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: byId("title").value.trim(),
      purpose: byId("purpose").value,
      type: byId("type").value,
      location: byId("location").value,
      price: byId("price").value.trim(),
      bedrooms: byId("bedrooms").value.trim(),
      area: byId("area").value.trim(),
      address: byId("address").value.trim(),
      image: imageUrl,
      description: byId("description").value.trim()
    };

    if (!/^https?:\/\//i.test(property.image)) {
      message.textContent = "Please enter a valid HTTP or HTTPS image URL.";
      return;
    }

    const updated = id
      ? current.map(p => p.id === id ? property : p)
      : [...current, property];

    if (saveProperties(updated)) {
      resetForm();
      drawListings();
      message.textContent = id
        ? "Property updated in this browser."
        : "Property added in this browser.";
    }
  });

  byId("cancelButton").addEventListener("click", resetForm);
  drawListings();
}

renderHomepage();
renderDetailsPage();
renderAdmin();
const imageFileInput = document.getElementById("imageFile");
const imagePreview = document.getElementById("imagePreview");
const imageUrlInput = document.getElementById("imageUrl");

// अपनी Cloudinary जानकारी यहाँ भरो
const CLOUD_NAME = "zofwcvco";
const UPLOAD_PRESET = "shri_property_upload";

imageFileInput?.addEventListener("change", () => {
  const file = imageFileInput.files?.[0];
  imageUrlInput.value = "";

  if (!file) {
    imagePreview.style.display = "none";
    return;
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    alert("कृपया JPG, PNG या WebP फोटो चुनें।");
    imageFileInput.value = "";
    imagePreview.style.display = "none";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("फोटो 5 MB से छोटी होनी चाहिए।");
    imageFileInput.value = "";
    imagePreview.style.display = "none";
    return;
  }

  imagePreview.src = URL.createObjectURL(file);
  imagePreview.style.display = "block";
});

async function uploadPropertyImage(file) {
  if (!file) return "";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const result = await response.json();

  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || "Photo upload failed");
  }

  return result.secure_url;
}