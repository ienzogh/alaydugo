// Need Blood? page (need_blood.html): find available blood units near a Philippine location.
// Stock and email addresses below are SAMPLE data until hospitals are connected (no database yet).
// Phone numbers are publicly listed hotlines (checked November 2026).
(function () {
  if (!getUser() || !document.getElementById("f-type")) return;

  var TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Red cell compatibility: donor type -> recipient types it can give to
  var GIVES_TO = {
    "A+": ["A+", "AB+"],
    "A-": ["A+", "A-", "AB+", "AB-"],
    "B+": ["B+", "AB+"],
    "B-": ["B+", "B-", "AB+", "AB-"],
    "AB+": ["AB+"],
    "AB-": ["AB+", "AB-"],
    "O+": ["A+", "B+", "AB+", "O+"],
    "O-": TYPES.slice()
  };
  var PROFILE = {
    "A+": "One of the most common blood groups, widely needed for transfusions.",
    "A-": "Rh-negative type. Important for patients who can only receive Rh-negative blood.",
    "B+": "A less common blood group, often in demand because fewer donors share it.",
    "B-": "Rh-negative and uncommon, so donors with this type are especially valuable.",
    "AB+": "Universal red cell recipient. Plasma from AB donors can be given to any patient.",
    "AB-": "Among the rarest blood types. Plasma from AB donors is useful in emergencies.",
    "O+": "Most common blood group. Essential for trauma and emergency surgery transfusions.",
    "O-": "Universal red cell donor. Used in emergencies when a patient's type is not yet known."
  };
  function canReceiveFrom(type) {
    return TYPES.filter(function (d) { return GIVES_TO[d].indexOf(type) !== -1; });
  }

  // Places you can type (coordinates are approximate). Anything else is looked up online.
  var PLACES = {
    "CTU Main Campus": [10.2937, 123.8945],
    "Cebu City": [10.3157, 123.8854],
    "Mandaue City": [10.3236, 123.9223],
    "Lapu-Lapu City": [10.3103, 123.9494],
    "Talisay City": [10.2447, 123.8494],
    "Minglanilla": [10.2450, 123.7960],
    "Naga City": [10.2092, 123.7581],
    "Consolacion": [10.3772, 123.9575],
    "Liloan": [10.3994, 123.9981],
    "Danao City": [10.5208, 124.0272],
    "Carcar City": [10.1060, 123.6400],
    "Toledo City": [10.3773, 123.6380],
    "Alcantara": [9.9667, 123.4000],
    "Alcoy": [9.7050, 123.5030],
    "Alegria": [9.7333, 123.3333],
    "Aloguinsan": [10.2272, 123.5472],
    "Argao": [9.8828, 123.6061],
    "Asturias": [10.5667, 123.7167],
    "Badian": [9.8667, 123.4000],
    "Balamban": [10.4667, 123.7167],
    "Bantayan": [11.1672, 123.7219],
    "Barili": [10.1167, 123.5167],
    "Bogo City": [11.0517, 124.0058],
    "Boljoon": [9.6333, 123.4833],
    "Borbon": [10.8333, 124.0333],
    "Carmen": [10.5833, 124.0167],
    "Catmon": [10.7167, 124.0167],
    "Compostela": [10.4500, 124.0167],
    "Cordova": [10.2500, 123.9500],
    "Daanbantayan": [11.2500, 124.0167],
    "Dalaguete": [9.7667, 123.5333],
    "Dumanjug": [10.0500, 123.4333],
    "Ginatilan": [9.6000, 123.3500],
    "Madridejos": [11.2667, 123.7333],
    "Malabuyoc": [9.6500, 123.4167],
    "Medellin": [11.1333, 123.9667],
    "Moalboal": [9.9500, 123.4000],
    "Oslob": [9.5167, 123.4333],
    "Pilar": [10.7000, 124.1167],
    "Pinamungajan": [10.2667, 123.5833],
    "Poro": [10.6333, 124.4167],
    "Ronda": [10.0167, 123.4167],
    "Samboan": [9.5333, 123.3167],
    "San Fernando": [10.1667, 123.7000],
    "San Francisco": [10.6500, 124.3833],
    "San Remigio": [11.0667, 123.9500],
    "Santa Fe": [11.1500, 123.8000],
    "Santander": [9.4333, 123.3333],
    "Sibonga": [10.0000, 123.6333],
    "Sogod": [10.7500, 124.0000],
    "Tabogon": [10.9333, 124.0333],
    "Tabuelan": [10.8167, 123.8833],
    "Tuburan": [10.7333, 123.8333],
    "Tudela": [10.6500, 124.3667],
    "Manila": [14.5995, 120.9842],
    "Quezon City": [14.6760, 121.0437],
    "Davao City": [7.1907, 125.4553]
  };
  var DEFAULT_PLACE = "CTU Main Campus";

  // stock = units on hand, in the order of TYPES (A+, A-, B+, B-, AB+, AB-, O+, O-)
  var HOSPITALS = [
    { name: "Cebu Doctors' University Hospital", area: "Osmeña Blvd, Cebu City", phone: "(032) 255-5555", email: "bloodbank@cdu.example.com", lat: 10.3170, lng: 123.8910, stock: [14, 3, 9, 0, 6, 1, 22, 4] },
    { name: "Chong Hua Hospital", area: "Fuente Osmeña, Cebu City", phone: "(032) 255-8000", email: "bloodbank@chonghua.example.com", lat: 10.3080, lng: 123.8920, stock: [8, 0, 12, 2, 4, 0, 15, 0] },
    { name: "Vicente Sotto Memorial Medical Center", area: "B. Rodriguez St, Cebu City", phone: "(032) 253-9891", email: "bloodbank@vsmmc.example.com", lat: 10.3010, lng: 123.8930, stock: [20, 6, 18, 5, 8, 2, 30, 7] },
    { name: "Perpetual Succour Hospital", area: "Gorordo Ave, Cebu City", phone: "(032) 233-8620", email: "bloodbank@pshospital.example.com", lat: 10.3100, lng: 123.8900, stock: [5, 0, 7, 0, 2, 0, 9, 1] },
    { name: "Cebu Velez General Hospital", area: "F. Ramos St, Cebu City", phone: "(032) 253-1871", email: "bloodbank@velez.example.com", lat: 10.3140, lng: 123.8940, stock: [11, 2, 4, 1, 3, 0, 13, 2] },
    { name: "Philippine Red Cross – Cebu Chapter", area: "Osmeña Blvd, Cebu City", phone: "(032) 253-4611", email: "bloodcenter@redcross.example.com", lat: 10.3125, lng: 123.8915, stock: [26, 8, 21, 6, 10, 3, 38, 9] },
    { name: "Mandaue City Hospital", area: "Mandaue City, Cebu", phone: "(032) 345-9740", email: "bloodbank@mandaue.example.com", lat: 10.3340, lng: 123.9380, stock: [7, 0, 6, 1, 3, 0, 12, 2] },
    { name: "Lapu-Lapu City Hospital", area: "Gun-ob, Lapu-Lapu City", phone: "(032) 340-0248", email: "bloodbank@llch.example.com", lat: 10.3100, lng: 123.9640, stock: [9, 1, 10, 3, 5, 1, 17, 3] },
    { name: "Talisay District Hospital", area: "Talisay City, Cebu", phone: "(032) 273-3226", email: "bloodbank@talisay.example.com", lat: 10.2625, lng: 123.8420, stock: [6, 1, 5, 0, 2, 0, 10, 1] }
  ];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function $(id) { return document.getElementById(id); }

  var typeSel = $("f-type"), cityInp = $("f-city"), radiusInp = $("f-radius"), radiusVal = $("f-radius-val");
  var errBox = $("fb-error"), resTitle = $("res-title"), resList = $("res-list");

  var center = { lat: PLACES[DEFAULT_PLACE][0], lng: PLACES[DEFAULT_PLACE][1], label: DEFAULT_PLACE };

  // distance in km between two points
  function km(a, b) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  // ---------- map (Leaflet + OpenStreetMap) ----------
  var map = null, layer = null;
  if (typeof L !== "undefined") {
    map = L.map("map", { scrollWheelZoom: false }).setView([center.lat, center.lng], 14);
    // Map tiles: CARTO (works from any page). If it fails, switch to Esri street tiles.
    var tiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd", maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    var failed = 0, switched = false;
    tiles.on("tileerror", function () {
      failed++;
      if (failed > 3 && !switched) {
        switched = true;
        map.removeLayer(tiles);
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
          maxZoom: 19, attribution: "Tiles © Esri"
        }).addTo(map);
      }
    });
    // scroll-wheel zoom only after the map is clicked, so the page can still scroll
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    map.on("mouseout", function () { map.scrollWheelZoom.disable(); });
    layer = L.layerGroup().addTo(map);
  } else {
    $("map").textContent = "The map could not be loaded. Please check your internet connection.";
    $("map").className += " fb-map-off";
  }
  var markers = {};

  function pin(label, you) {
    return L.divIcon({
      className: "fb-pin-wrap",
      html: '<div class="fb-pin' + (you ? " you" : "") + '"><span>' + label + "</span></div>",
      iconSize: [40, 48], iconAnchor: [20, 46], popupAnchor: [0, -42]
    });
  }

  // ---------- search ----------
  function status(units) {
    if (units >= 10) return ["Available (" + units + " Units)", ""];
    if (units >= 5) return ["Low (" + units + " Units)", "low"];
    return ["Critical (" + units + (units === 1 ? " Unit" : " Units") + ")", "crit"];
  }

  function requestUnits(h, type, units) {
    var subject = "Blood unit request (" + type + ")";
    var body = "Good day,\n\nI would like to request " + type + " blood units from " + h.name +
      ".\n\nPatient blood type needed: " + type + "\nUnits needed: \nContact number: \nHospital / ward of the patient: " +
      "\n\nSent through AlayDugo. Thank you.";
    window.location.href = "mailto:" + h.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    showToast("Your email app opened. Press send to complete the request.");
  }

  function render() {
    var need = typeSel.value;
    var radius = Number(radiusInp.value);
    var accepted = need ? canReceiveFrom(need) : []; // exact type first, then compatible donors
    $("map-note").textContent = "Showing within " + radius + " km of " + center.label;

    var rows = [];
    HOSPITALS.forEach(function (h) {
      var d = km(center, h);
      if (d > radius) return;
      accepted.forEach(function (t) {
        var units = h.stock[TYPES.indexOf(t)];
        if (units > 0) rows.push({ h: h, type: t, units: units, dist: d, exact: t === need });
      });
    });
    rows.sort(function (a, b) {
      return a.dist - b.dist || (b.exact - a.exact) || b.units - a.units;
    });

    resTitle.textContent = need ? "Available Results (" + rows.length + ")" : "Available Results";
    resList.innerHTML = "";

    if (!need) {
      resList.appendChild(el("p", "res-none", "Select the blood group needed to see results."));
    } else if (!rows.length) {
      resList.appendChild(el("p", "res-none", "No hospitals within " + radius + " km have " + need + " or compatible blood in stock. Try a larger search radius."));
    }

    rows.forEach(function (r, i) {
      var st = status(r.units);
      var card = el("div", "fb-card" + (i === 0 ? " top" : ""));
      var left = el("div", "fb-card-main");

      card.appendChild(el("span", "fb-rank" + (i === 0 ? " first" : ""), String(i + 1)));
      if (i === 0) left.appendChild(el("span", "fb-flag", "Top choice"));
      var top = el("div", "fb-card-top");
      top.appendChild(el("span", "fb-type", r.type));
      top.appendChild(el("span", "fb-status " + st[1], st[0]));
      if (!r.exact) top.appendChild(el("span", "fb-compat", "Compatible"));
      left.appendChild(top);

      left.appendChild(el("h3", "", r.h.name));
      var loc = el("p", "fb-loc");
      loc.appendChild(document.createTextNode(r.h.area + " "));
      loc.appendChild(el("strong", "", "· " + r.dist.toFixed(1) + " km away"));
      left.appendChild(loc);
      card.appendChild(left);

      var right = el("div", "fb-card-side");
      var btn = el("button", "btn btn-register", "Request Units");
      btn.type = "button";
      btn.addEventListener("click", function (e) { e.stopPropagation(); requestUnits(r.h, r.type, r.units); });
      right.appendChild(btn);
      var call = el("a", "fb-phone", r.h.phone);
      call.href = "tel:+63" + r.h.phone.replace(/\D/g, "").slice(1);
      call.addEventListener("click", function (e) { e.stopPropagation(); });
      right.appendChild(call);
      card.appendChild(right);

      card.addEventListener("click", function () {
        var m = markers[r.h.name];
        if (m && map) { map.setView(m.getLatLng(), 15); m.openPopup(); }
      });
      resList.appendChild(card);
    });

    // map pins: one per hospital
    if (!map) return;
    layer.clearLayers();
    markers = {};
    L.circle([center.lat, center.lng], { radius: radius * 1000, color: "#B71C1C", weight: 2, fillColor: "#E53935", fillOpacity: 0.08 }).addTo(layer);
    L.marker([center.lat, center.lng], { icon: pin("YOU", true), title: "Your search location: " + center.label, alt: "Your search location" }).addTo(layer);

    var seen = {};
    rows.forEach(function (r) {
      if (seen[r.h.name]) { seen[r.h.name].rows.push(r); return; }
      seen[r.h.name] = { first: r, rows: [r] };
    });
    Object.keys(seen).forEach(function (name) {
      var g = seen[name], h = g.first.h;
      var html = "<strong>" + h.name.replace(/</g, "&lt;") + "</strong><br>" + g.rows.map(function (r) {
        return r.type + ": " + r.units + " units";
      }).join("<br>");
      var m = L.marker([h.lat, h.lng], { icon: pin(g.first.type), title: h.name, alt: h.name, keyboard: true }).bindPopup(html).addTo(layer);
      markers[name] = m;
    });

    var pts = [[center.lat, center.lng]];
    rows.forEach(function (r) { pts.push([r.h.lat, r.h.lng]); });
    var circle = L.latLng(center.lat, center.lng).toBounds(radius * 2000);
    map.fitBounds(circle, { padding: [10, 10] });
  }

  // ---------- location ----------
  function showError(msg) {
    errBox.textContent = msg;
    errBox.hidden = !msg;
  }

  function useCenter(lat, lng, label) {
    center = { lat: lat, lng: lng, label: label };
    showError("");
    render();
  }

  // Search for a Philippine place. Built-in places answer instantly; everything else
  // (barangays, streets, landmarks, other cities) is looked up online with Photon, then Nominatim.
  var PH_BOX = "116.9,4.5,126.6,21.2"; // west,south,east,north
  function localMatches(q) {
    q = q.toLowerCase();
    return Object.keys(PLACES).filter(function (n) { return n.toLowerCase().indexOf(q) !== -1; })
      .sort(function (a, b) { return (a.toLowerCase().indexOf(q) === 0 ? 0 : 1) - (b.toLowerCase().indexOf(q) === 0 ? 0 : 1); })
      .map(function (n) { return { name: n, lat: PLACES[n][0], lng: PLACES[n][1] }; });
  }

  function remoteSearch(q, limit) {
    return fetch("https://photon.komoot.io/api/?limit=" + limit + "&bbox=" + PH_BOX + "&q=" + encodeURIComponent(q))
      .then(function (r) { if (!r.ok) throw new Error("photon"); return r.json(); })
      .then(function (data) {
        return data.features.filter(function (f) { return !f.properties.countrycode || f.properties.countrycode === "PH"; }).map(function (f) {
          var p = f.properties;
          var parts = [p.name, p.district || p.locality, p.city || p.county, p.state].filter(Boolean);
          var seen = {};
          parts = parts.filter(function (x) { if (seen[x]) return false; seen[x] = 1; return true; });
          return { name: parts.join(", "), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
        });
      })
      .catch(function () {
        return fetch("https://nominatim.openstreetmap.org/search?format=json&limit=" + limit + "&countrycodes=ph&q=" + encodeURIComponent(q))
          .then(function (r) { if (!r.ok) throw new Error("nominatim"); return r.json(); })
          .then(function (res) {
            return res.map(function (x) { return { name: x.display_name.split(", ").slice(0, 3).join(", "), lat: Number(x.lat), lng: Number(x.lon) }; });
          });
      });
  }

  function choose(item) {
    cityInp.value = item.name;
    closeSuggest();
    useCenter(item.lat, item.lng, item.name);
  }

  function findPlace() {
    var q = cityInp.value.trim();
    closeSuggest();
    if (!q) { q = DEFAULT_PLACE; cityInp.value = q; }
    var local = localMatches(q);
    if (local.length) { choose(local[0]); return; }
    showError("Searching…");
    remoteSearch(q, 1).then(function (res) {
      if (!res.length) { showError("We could not find \"" + q + "\" in the Philippines. Try a city, barangay or landmark, like Mandaue City or Ayala Center Cebu."); return; }
      choose(res[0]);
    }).catch(function () {
      showError("We could not search right now. Check your internet connection or pick a place from the list.");
    });
  }

  // suggestions under the box
  var suggest = $("city-suggest"), items = [], active = -1, timer = null, lastQ = "";
  function closeSuggest() {
    suggest.hidden = true;
    suggest.innerHTML = "";
    items = []; active = -1;
    cityInp.setAttribute("aria-expanded", "false");
  }
  function drawSuggest() {
    suggest.innerHTML = "";
    items.forEach(function (it, i) {
      var li = el("li", i === active ? "on" : "", it.name);
      li.setAttribute("role", "option");
      li.addEventListener("mousedown", function (e) { e.preventDefault(); choose(it); });
      suggest.appendChild(li);
    });
    suggest.hidden = items.length === 0;
    cityInp.setAttribute("aria-expanded", items.length ? "true" : "false");
  }
  cityInp.addEventListener("input", function () {
    var q = cityInp.value.trim();
    lastQ = q;
    clearTimeout(timer);
    showError("");
    if (q.length < 2) { items = localMatches("").slice(0, 15); active = -1; drawSuggest(); return; }
    items = localMatches(q).slice(0, 8); active = -1; drawSuggest();
    if (q.length >= 3) {
      timer = setTimeout(function () {
        remoteSearch(q, 5).then(function (res) {
          if (q !== lastQ) return; // the box changed meanwhile
          var names = {};
          items.forEach(function (i) { names[i.name] = 1; });
          res.forEach(function (r) { if (!names[r.name]) { items.push(r); names[r.name] = 1; } });
          drawSuggest();
        }).catch(function () {});
      }, 400);
    }
  });
  cityInp.addEventListener("focus", function () {
    cityInp.select();
    items = localMatches("").slice(0, 15); active = -1; drawSuggest();
  });
  cityInp.addEventListener("blur", function () { setTimeout(closeSuggest, 150); });
  cityInp.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!items.length) return;
      e.preventDefault();
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      drawSuggest();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) choose(items[active]); else findPlace();
    } else if (e.key === "Escape") {
      closeSuggest();
    }
  });
  $("city-btn").addEventListener("click", findPlace);
  typeSel.addEventListener("change", render);
  radiusInp.addEventListener("input", function () {
    radiusVal.textContent = radiusInp.value + " km";
    render();
  });

  $("gps-btn").addEventListener("click", function () {
    if (!navigator.geolocation) { showError("Your browser does not support GPS location."); return; }
    var btn = $("gps-btn");
    btn.disabled = true;
    btn.textContent = "Locating…";
    navigator.geolocation.getCurrentPosition(function (p) {
      btn.disabled = false;
      btn.textContent = "Use My GPS";
      cityInp.value = "My location";
      useCenter(p.coords.latitude, p.coords.longitude, "your position");
    }, function () {
      btn.disabled = false;
      btn.textContent = "Use My GPS";
      showError("We could not get your location. Allow location access, or type your city instead.");
    }, { timeout: 10000 });
  });

  // ---------- compatibility grid ----------
  var cgTypes = $("cg-types"), cgProfile = $("cg-profile"), cgTable = $("cg-table");
  var cgSel = "A+";

  function colored(list, cls) {
    var span = el("span", cls, list.join(", "));
    return span;
  }

  function renderGrid() {
    cgTypes.innerHTML = "";
    TYPES.forEach(function (t) {
      var b = el("button", "cg-type" + (t === cgSel ? " on" : ""), t);
      b.type = "button";
      b.addEventListener("click", function () { cgSel = t; renderGrid(); });
      cgTypes.appendChild(b);
    });

    cgProfile.innerHTML = "";
    cgProfile.appendChild(el("div", "cg-badge", cgSel));
    var info = el("div");
    info.appendChild(el("h3", "", "Blood Type " + cgSel + " Clinical Profile"));
    info.appendChild(el("p", "", PROFILE[cgSel]));
    var line = el("p", "cg-line");
    var receive = el("span", "cg-pair");
    receive.appendChild(el("strong", "", "Can receive red cells from: "));
    receive.appendChild(colored(canReceiveFrom(cgSel), "cg-from"));
    line.appendChild(receive);
    info.appendChild(line);
    cgProfile.appendChild(info);

    cgTable.innerHTML = "";
    var thead = el("thead"), hr = el("tr");
    hr.appendChild(el("th", "", "Blood Type"));
    TYPES.forEach(function (t) { hr.appendChild(el("th", "", t)); });
    thead.appendChild(hr);
    cgTable.appendChild(thead);

    // each row is a blood type; each column says whether that row can receive from that type
    var tbody = el("tbody");
    TYPES.forEach(function (r) {
      var tr = el("tr", r === cgSel ? "sel" : "");
      var th = el("th");
      th.appendChild(el("span", "cg-rowtype", r));
      tr.appendChild(th);
      TYPES.forEach(function (d) {
        var ok = GIVES_TO[d].indexOf(r) !== -1;
        var td = el("td", ok ? "yes" : "no");
        var mark = el("img");
        mark.src = ok ? "icons/check.png" : "icons/wrong.png";
        mark.alt = ok ? "Yes" : "No";
        td.appendChild(mark);
        td.setAttribute("aria-label", r + " can" + (ok ? "" : "not") + " receive from " + d);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    cgTable.appendChild(tbody);
  }

  renderGrid();
  render();
})();