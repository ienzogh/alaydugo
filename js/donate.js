// Donate Now page: eligibility check, center search and appointment booking.
// Frontend prototype: selections live in JavaScript variables only. Nothing is saved or sent.

// ===== Eligibility checker (step 1) =====
// Preliminary donor screening for step 1 of the Donate Now page.
// A guide only: qualified blood donation staff make the final decision.
// Answers never block booking.
(function () {
  var RULES = { minAge: 16, adultAge: 18, maxAge: 65, minKg: 50, minLb: 110, minSleep: 5, donationMonths: 3, tattooMonths: 12 };

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // ---- dates ----
  function today() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function parseDate(s) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    if (!p) return null;
    var d = new Date(+p[1], p[2] - 1, +p[3]);
    return d.getFullYear() >= 1900 && d <= today() ? d : null;
  }
  // Same day some months later; 30 Nov + 3 months becomes the last day of February
  function addMonths(d, n) {
    var last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
    return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
  }
  function longDate(d) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  // ---- results: "met", "review" or "none" (not answered yet) ----
  function met(text) { return { status: "met", text: text }; }
  function defer(text) { return { status: "review", text: text }; }
  function none(text) { return { status: "none", text: text || "" }; }

  function number(v) { return v === undefined || String(v).trim() === "" ? null : Number(v); }

  function waitFor(a, months, what) {
    var d = parseDate(a.date);
    if (!d) return none(a.date ? "Enter a valid date that is not in the future." : "");
    var next = addMonths(d, months);
    if (next > today()) {
      return defer("The guide is to wait " + months + " months after your last " + what + ", which would be " + longDate(next) + ".");
    }
    return null;
  }

  // One entry per card, in the same order as the cards
  var CARDS = [
    {
      title: "Age",
      fields: [
        { key: "age", type: "number", label: "How old are you?", min: 1, max: 120 },
        { key: "consent", type: "radio", label: "Do you have written consent from a parent or guardian?", options: [["yes", "Yes"], ["no", "Not yet"]],
          show: function (a) { var n = number(a.age); return n >= RULES.minAge && n < RULES.adultAge; } }
      ],
      check: function (a) {
        var n = number(a.age);
        if (n === null) return none();
        if (!Number.isInteger(n) || n < 1 || n > 120) return none("Enter your age in whole years.");
        if (n < RULES.minAge) return defer("Your age is below the 16–65 guide.");
        if (n > RULES.maxAge) return defer("Your age is above the 16–65 guide.");
        if (n < RULES.adultAge) {
          if (a.consent === "yes") return met("Age guide met. Parental consent is required, so please bring it with you.");
          if (a.consent === "no") return defer("Parental consent is required for ages 16–17.");
          return none("Parental consent is required for donors aged 16–17.");
        }
        return met("Age guide met.");
      }
    },
    {
      title: "Weight",
      fields: [
        { key: "weight", type: "number", label: "How much do you weigh?", min: 1, step: "0.1" },
        { key: "unit", type: "radio", label: "Unit", options: [["kg", "Kilograms (kg)"], ["lb", "Pounds (lbs)"]], value: "kg" }
      ],
      check: function (a) {
        var n = number(a.weight), lb = a.unit === "lb";
        if (n === null) return none();
        if (!(n >= (lb ? 44 : 20) && n <= (lb ? 660 : 300))) return none("Check your weight and unit.");
        if (n < (lb ? RULES.minLb : RULES.minKg)) return defer("Your weight is below the 50 kg (110 lbs) guide.");
        return met("Weight guide met.");
      }
    },
    {
      title: "Rest & Hydration",
      fields: [
        { key: "sleep", type: "number", label: "How many hours did you sleep last night?", min: 0, max: 24, step: "0.5" },
        { key: "alcohol", type: "radio", label: "Have you had any alcohol in the past 24 hours?", options: [["no", "No"], ["yes", "Yes"]] }
      ],
      check: function (a) {
        var n = number(a.sleep), problems = [];
        if (n !== null && !(n >= 0 && n <= 24)) return none("Enter sleep hours from 0 to 24.");
        if (n !== null && n < RULES.minSleep) problems.push("Try to get at least 5 hours of sleep before donating.");
        if (a.alcohol === "yes") problems.push("Avoid alcohol for 24 hours before donating.");
        if (problems.length) return defer(problems.join(" "));
        if (n === null || !a.alcohol) return none();
        return met("Rest guide met. Remember to drink water.");
      }
    },
    {
      title: "Last Donation",
      fields: [
        { key: "history", type: "radio", label: "Have you donated blood before?", options: [["first", "No, this is my first time"], ["before", "Yes"], ["unsure", "Yes, but I don't remember when"]] },
        { key: "date", type: "date", label: "Date of your last donation", show: function (a) { return a.history === "before"; } }
      ],
      check: function (a) {
        if (a.history === "first") return met("Welcome, first-time donor!");
        if (a.history === "unsure") return defer("Staff will confirm when you last donated.");
        if (a.history !== "before") return none();
        return waitFor(a, RULES.donationMonths, "donation") || met("3 months or more since your last donation.");
      }
    },
    {
      title: "General Health",
      fields: [
        { key: "symptoms", type: "checks", label: "Do you have any of these now?", options: [["fever", "Fever"], ["cough", "Cough"], ["cold", "Cold"], ["none", "None of these"], ["unsure", "I'm not sure, or I have another health concern"]] }
      ],
      check: function (a) {
        var s = a.symptoms || [];
        var sick = s.filter(function (v) { return v !== "none" && v !== "unsure"; });
        var advice = "";
        if (sick.length) {
          var names = sick.map(function (v) { return v === "cough" ? "a cough" : v === "cold" ? "a cold" : "a fever"; });
          advice = "You reported " + names.join(" and ") + ". You may need to postpone until you feel well.";
        }
        if (s.indexOf("unsure") !== -1) return defer((advice ? advice + " " : "") + "Please discuss your health with donation staff.");
        if (advice) return defer(advice);
        return s.indexOf("none") !== -1 ? met("No fever, cough, or cold reported.") : none();
      }
    },
    {
      title: "Tattoos & Piercings",
      fields: [
        { key: "tattoo", type: "radio", label: "Have you ever had a tattoo or piercing?", options: [["never", "No"], ["yes", "Yes"], ["unsure", "I had one, but I don't remember when"]] },
        { key: "date", type: "date", label: "Date of your most recent tattoo or piercing", show: function (a) { return a.tattoo === "yes"; } }
      ],
      check: function (a) {
        if (a.tattoo === "never") return met("No recent tattoo or piercing.");
        if (a.tattoo === "unsure") return defer("Staff will review the date of your tattoo or piercing.");
        if (a.tattoo !== "yes") return none();
        return waitFor(a, RULES.tattooMonths, "tattoo or piercing") || met("At least 12 months have passed since your last tattoo or piercing.");
      }
    }
  ];

  var answers = CARDS.map(function () { return {}; });
  var cards = document.querySelectorAll(".dn-item");

  // ---- result box under the cards ----
  function render() {
    var count = { met: 0, review: 0, none: 0 };
    var notes = [];
    CARDS.forEach(function (c, i) {
      var a = answers[i], r = c.check(a), card = cards[i];
      count[r.status]++;
      c.fields.forEach(function (f) {
        $("q" + i + "-" + f.key).hidden = !!f.show && !f.show(a);
      });
      card.querySelector(".dn-mark").checked = r.status === "met";
      card.classList.toggle("met", r.status === "met");
      card.classList.toggle("review", r.status === "review");
      var note = $("note-" + i);
      if (note.textContent !== r.text) note.textContent = r.text;
      if (r.status === "review") notes.push(c.title + ": " + r.text);
    });

    var ok = count.met === CARDS.length;
    var title = count.review ? "Needs Further Review" : ok ? "Preliminary Requirements Met" : "Information Incomplete";
    if (ok) {
      notes.push("Your answers meet the preliminary guide. You may continue to find a donation center.");
      if (number(answers[0].age) < RULES.adultAge) notes.push("Please bring your parental consent.");
    } else {
      if (count.none) notes.push(count.none + (count.none === 1 ? " question is" : " questions are") + " still incomplete.");
      notes.push("You can still continue. Donation staff will review your answers during screening.");
    }

    $("elig-result").classList.toggle("ok", ok);
    $("elig-title").textContent = title;
    var text = $("elig-text");
    text.textContent = "";
    notes.forEach(function (line) { text.appendChild(el("span", "", line)); });
    $("elig-bar").style.width = ((CARDS.length - count.none) / CARDS.length * 100) + "%";
  }

  // ---- questions inside each card ----
  function field(f, i) {
    var a = answers[i];
    var many = f.type === "radio" || f.type === "checks";
    var wrap = el(many ? "fieldset" : "div", "dn-q");
    wrap.id = "q" + i + "-" + f.key;

    if (!many) {
      var label = el("label", "dn-q-label", f.label);
      label.htmlFor = "in" + i + "-" + f.key;
      var input = el("input");
      input.id = label.htmlFor;
      input.type = f.type;
      if (f.type === "number") {
        input.min = f.min;
        if (f.max !== undefined) input.max = f.max;
        input.step = f.step || "1";
        input.inputMode = "decimal";
      } else {
        var now = today();
        input.max = now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2);
      }
      input.addEventListener("input", function () {
        a[f.key] = input.value;
        render();
      });
      wrap.appendChild(label);
      wrap.appendChild(input);
      return wrap;
    }

    wrap.appendChild(el("legend", "dn-q-label", f.label));
    if (f.value) a[f.key] = f.value;
    f.options.forEach(function (o) {
      var row = el("label", "dn-option");
      var input = el("input");
      input.type = f.type === "radio" ? "radio" : "checkbox";
      input.name = "q" + i + "-" + f.key;
      input.value = o[0];
      input.checked = a[f.key] === o[0];
      input.addEventListener("change", function () {
        if (f.type === "radio") {
          a[f.key] = o[0];
        } else {
          // "None of these" cannot be combined with other answers
          wrap.querySelectorAll("input").forEach(function (other) {
            if (input.checked && other !== input && (o[0] === "none" || other.value === "none")) other.checked = false;
          });
          a[f.key] = Array.prototype.filter.call(wrap.querySelectorAll("input"), function (x) { return x.checked; })
            .map(function (x) { return x.value; });
        }
        render();
      });
      row.appendChild(input);
      row.appendChild(document.createTextNode(o[1]));
      wrap.appendChild(row);
    });
    return wrap;
  }

  CARDS.forEach(function (c, i) {
    var box = cards[i].querySelector(".dn-answers");
    c.fields.forEach(function (f) { box.appendChild(field(f, i)); });
    var note = el("p", "dn-feedback");
    note.id = "note-" + i;
    note.setAttribute("aria-live", "polite");
    box.appendChild(note);
  });
  render();
})();

// ===== Page steps, center search and booking =====
(function () {
  // Map positions are approximate. Verify them and the phone numbers before launch.
  var CENTERS = [
    { id: "prc-cebu", name: "Philippine Red Cross – Cebu Chapter", address: "Osmeña Blvd, Cebu City", phone: "(032) 253 9793", type: "Red Cross", lat: 10.3095, lng: 123.8929 },
    { id: "doh-visayas", name: "DOH Subnational Blood Center for Visayas", address: "Osmeña Blvd, Cebu City", phone: "0994 859 8607", type: "Blood Center", lat: 10.3052, lng: 123.8934 },
    { id: "vsmmc", name: "Vicente Sotto Memorial Medical Center", address: "B. Rodriguez St, Cebu City", phone: "(032) 253 9891", type: "Hospital Blood Bank", lat: 10.3078, lng: 123.8913 },
    { id: "prc-mandaue", name: "Philippine Red Cross – Mandaue Blood Station", address: "Jagobiao, Mandaue City", phone: "", type: "Red Cross", lat: 10.3770, lng: 123.9580 },
    // Sample mobile drives
    { id: "sample-1", name: "Community Blood Donation Drive", address: "CTU Main Campus Gymnasium, Cebu City", phone: "", type: "Mobile Drive (sample)", lat: 10.2976, lng: 123.9064, date: "2026-12-05", times: ["8:00 AM", "10:00 AM", "1:00 PM"] },
    { id: "sample-2", name: "Barangay Blood Donation Day", address: "Liloan Municipal Gymnasium, Liloan", phone: "", type: "Mobile Drive (sample)", lat: 10.3990, lng: 123.9990, date: "2026-12-12", times: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"] }
  ];
  var CITIES = {
    "Cebu City": [10.3099, 123.8932], "Mandaue City": [10.3333, 123.9333], "Lapu-Lapu City": [10.3103, 123.9494],
    "Talisay City": [10.2447, 123.8494], "Consolacion": [10.3766, 123.9573], "Liloan": [10.3994, 123.9992],
    "Compostela": [10.4550, 124.0100], "Cordova": [10.2519, 123.9494], "Minglanilla": [10.2450, 123.7960],
    "Naga City": [10.2090, 123.7580], "Carcar City": [10.1070, 123.6400], "Danao City": [10.5200, 124.0270],
    "Toledo City": [10.3770, 123.6380], "Bogo City": [11.0510, 124.0050], "Argao": [9.8820, 123.6070]
  };
  var TIMES = ["8:00 AM", "10:00 AM", "1:00 PM", "3:00 PM"];

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  var me = getUser();

  // ---- dates ----
  function iso(d) {
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function addDays(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return iso(d);
  }
  function fmtDate(s) {
    if (s === addDays(1)) return "Tomorrow";
    var p = s.split("-");
    return new Date(+p[0], p[1] - 1, +p[2]).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  function fullDate(s) {
    var p = s.split("-");
    return new Date(+p[0], p[1] - 1, +p[2]).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }

  // Past mobile drives are not shown
  var centers = CENTERS.filter(function (c) { return !c.date || c.date >= addDays(0); });

  var booking = null; // kept only until the page is closed or reloaded

  var step = 1;
  var chosen = null, date = "", time = "";
  var origin = CITIES["Cebu City"], originName = "Cebu City";
  var map, layer, markers = {};

  // ---- steps ----
  var HEADINGS = {
    1: ["Become a Lifesaver Today", "Check your eligibility in 60 seconds before booking a Cebu donation center."],
    2: ["Find a Donation Center", "Locate nearby blood banks and mobile drives in Cebu."],
    3: ["Schedule Your Donation", "Step 3 of 3 • Book your appointment to complete your blood donation."]
  };
  function updateSteps() {
    document.querySelectorAll(".dn-steps button").forEach(function (b) {
      var n = +b.dataset.go;
      b.disabled = n === 3 && !chosen && !booking;
      if (n === step) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    });
    $("saved-bar").hidden = !booking || step === 3;
    if (booking) $("saved-text").textContent = "Your preview appointment: " + fullDate(booking.date) + ", " + booking.time + ".";
  }

  function go(n, quiet) {
    step = n;
    [1, 2, 3].forEach(function (i) { $("step-" + i).hidden = i !== n; });
    $("dn-title").textContent = HEADINGS[n][0];
    $("dn-sub").textContent = HEADINGS[n][1];
    updateSteps();
    if (n === 2) showMap();
    if (!quiet) {
      $("dn-title").focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  document.querySelectorAll("[data-go]").forEach(function (b) {
    b.addEventListener("click", function () {
      var n = +b.dataset.go;
      if (n === 3 && !chosen && booking) { showBooking(); return; }
      go(n);
    });
  });

  // ---- step 1: continue, whatever the answers are ----
  $("to-centers").addEventListener("click", function () { go(2); });

  // ---- step 2: find a center ----
  function distance(a, lat, lng) {
    var r = Math.PI / 180;
    var x = Math.pow(Math.sin((lat - a[0]) * r / 2), 2) +
      Math.cos(a[0] * r) * Math.cos(lat * r) * Math.pow(Math.sin((lng - a[1]) * r / 2), 2);
    return 12742 * Math.asin(Math.sqrt(x));
  }

  function nearby() {
    var max = +$("radius").value;
    return centers.map(function (c) { return { c: c, km: distance(origin, c.lat, c.lng) }; })
      .filter(function (x) { return x.km <= max; })
      .sort(function (a, b) { return a.km - b.km; });
  }

  function renderCenters() {
    var list = nearby();
    var box = $("center-list");
    box.innerHTML = "";
    $("radius-out").textContent = $("radius").value + " km";
    $("center-count").textContent = "Available Centers (" + list.length + ")";
    $("map-note").textContent = "Showing within " + $("radius").value + " km of " + originName;

    list.forEach(function (x, i) {
      var c = x.c;
      var card = el("article", "dn-center" + (i === 0 ? " first" : ""));
      card.appendChild(el("span", "dn-rank", String(i + 1)));

      var main = el("div", "dn-center-main");
      main.appendChild(el("span", "dn-tag" + (c.date ? " drive" : ""), c.type));
      main.appendChild(el("h3", "", c.name));
      var line = el("p", "", c.address + " • ");
      line.appendChild(el("strong", "", x.km.toFixed(1) + " km away"));
      main.appendChild(line);
      if (c.date) main.appendChild(el("p", "", fullDate(c.date)));
      card.appendChild(main);

      var side = el("div", "dn-center-side");
      var btn = el("button", "dn-primary", "Book Slot");
      btn.type = "button";
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        pick(c);
      });
      side.appendChild(btn);
      if (c.phone) {
        var tel = el("a", "", c.phone);
        tel.href = "tel:" + c.phone.replace(/[^\d+]/g, "");
        tel.addEventListener("click", function (e) { e.stopPropagation(); });
        side.appendChild(tel);
      }
      card.appendChild(side);

      // Clicking the card shows the place on the map
      card.addEventListener("click", function () {
        if (map && markers[c.id]) {
          map.setView([c.lat, c.lng], 15);
          markers[c.id].openPopup();
        }
      });
      box.appendChild(card);
    });

    if (!list.length) box.appendChild(el("p", "dn-empty", "No centers within this distance. Try a larger search radius."));
    drawMap(list);
  }

  function showMap() {
    if (!window.L) {
      $("map").classList.add("off");
      $("map").textContent = "The map could not load. You can still book from the list.";
    } else if (!map) {
      map = L.map("map", { scrollWheelZoom: false }).setView(origin, 13);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri and its data providers"
      }).addTo(map);
      map.attributionControl.setPrefix(false); // hides the "Leaflet" link and flag
      layer = L.layerGroup().addTo(map);
    }
    if (map) map.invalidateSize();
    renderCenters();
  }

  function drawMap(list) {
    if (!map) return;
    layer.clearLayers();
    markers = {};
    var circle = L.circle(origin, { radius: $("radius").value * 1000, color: "#B71C1C", weight: 1.5, fillOpacity: .08 }).addTo(layer);
    list.forEach(function (x, i) {
      var icon = L.divIcon({ className: "dn-pin-wrap", html: '<div class="dn-pin"><span>' + (i + 1) + "</span></div>", iconSize: [32, 32], iconAnchor: [16, 38], popupAnchor: [0, -36] });
      markers[x.c.id] = L.marker([x.c.lat, x.c.lng], { icon: icon, title: x.c.name, zIndexOffset: -i * 10 }).bindPopup(el("strong", "", x.c.name)).addTo(layer);
    });
    map.fitBounds(circle.getBounds());
  }

  function searchError(text) {
    $("search-error").textContent = text;
    $("search-error").hidden = !text;
  }

  Object.keys(CITIES).forEach(function (name) {
    var o = el("option");
    o.value = name;
    $("city-list").appendChild(o);
  });

  $("search-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = $("city").value.trim().toLowerCase().replace(/\s*city$/, "");
    var found = Object.keys(CITIES).filter(function (n) {
      return q && n.toLowerCase().replace(/\s*city$/, "").indexOf(q) === 0;
    })[0];
    if (!found) { searchError("We couldn't find that place. Pick a Cebu city or municipality from the suggestions."); return; }
    searchError("");
    $("city").value = originName = found;
    origin = CITIES[found];
    renderCenters();
  });
  $("radius").addEventListener("input", renderCenters);
  $("blood").addEventListener("change", updatePass);

  $("gps").addEventListener("click", function () {
    if (!navigator.geolocation) { searchError("GPS is not available in this browser."); return; }
    searchError("");
    navigator.geolocation.getCurrentPosition(function (p) {
      origin = [p.coords.latitude, p.coords.longitude];
      originName = "your location";
      renderCenters();
    }, function () {
      searchError("We couldn't get your location. Allow location access or search by city.");
    }, { timeout: 10000 });
  });

  // ---- step 3: schedule ----
  function pills(box, values, current, label, choose) {
    box.innerHTML = "";
    values.forEach(function (v) {
      var b = el("button", "", label(v));
      b.type = "button";
      b.setAttribute("aria-pressed", String(v === current));
      b.addEventListener("click", function () {
        choose(v);
        pills(box, values, v, label, choose);
        updatePass();
      });
      box.appendChild(b);
    });
  }

  function pick(c) {
    // Booking another place replaces the saved appointment only after Confirm
    chosen = c;
    var dates = c.date ? [c.date] : [addDays(1), addDays(2), addDays(3)];
    var times = c.times || TIMES;
    date = dates[0];
    time = times[0];
    $("place-name").textContent = c.name;
    $("place-address").textContent = c.address;
    pills($("date-pills"), dates, date, fmtDate, function (v) { date = v; });
    pills($("time-pills"), times, time, String, function (v) { time = v; });
    $("book-form").hidden = false;
    $("pass-actions").hidden = true;
    updatePass();
    go(3);
  }

  // Shows the draft while typing, or the saved appointment
  function updatePass(saved) {
    var s = saved && saved.ref ? saved : null;
    $("p-name").textContent = s ? s.name : ($("f-name").value.trim() || "Your Name (Draft)");
    $("p-blood").textContent = (s ? s.blood : $("blood").value) || "Not yet known";
    $("p-center").textContent = s ? s.center : (chosen ? chosen.name : "");
    $("p-when").textContent = s ? fullDate(s.date) + ", " + s.time : (date ? fullDate(date) + ", " + time : "");
    $("p-ref").textContent = s ? s.ref : "Pending";
    $("p-foot").textContent = s ? "Preview only: no booking was sent. Final eligibility is decided at medical screening." : "Draft pass. Confirm your appointment to save it.";
  }
  $("f-name").addEventListener("input", updatePass);
  $("book-form").addEventListener("input", function () { $("book-error").hidden = true; });

  function showBooking() {
    $("book-form").hidden = true;
    $("pass-actions").hidden = false;
    updatePass(booking);
    go(3);
    $("dn-title").textContent = "Your Donor Pass";
    $("dn-sub").textContent = "Preview only. Contact the donation site to arrange your visit.";
  }
  $("saved-view").addEventListener("click", showBooking);

  $("book-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("f-name").value.trim();
    var email = $("f-email").value.trim();
    var phone = $("f-phone").value.replace(/[\s-]/g, "");
    var error = "";
    if (name.length < 2) error = "Please enter your full name.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = "Please enter a valid email address.";
    else if (!/^(09|\+639)\d{9}$/.test(phone)) error = "Please enter a valid mobile number, such as 09171234567.";
    $("book-error").textContent = error;
    $("book-error").hidden = !error;
    if (error) return;

    booking = {
      ref: "AD-" + Date.now().toString(36).slice(-6).toUpperCase(),
      name: name, blood: $("blood").value, center: chosen.name, date: date, time: time
    };
    chosen = null;
    showBooking();
    showToast("Preview pass created");
  });

  $("print-pass").addEventListener("click", function () { window.print(); });

  // ---- cancel popup ----
  var modal = $("confirm-modal");
  function closeModal() { modal.classList.remove("open"); }
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  modal.querySelectorAll(".modal-x, .modal-cancel").forEach(function (b) { b.addEventListener("click", closeModal); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

  $("cancel-booking").addEventListener("click", function () {
    $("confirm-text").textContent = "Cancel your donation appointment?";
    $("confirm-yes").textContent = "Yes, cancel";
    modal.classList.add("open");
  });
  $("confirm-yes").addEventListener("click", function () {
    closeModal();
    booking = null;
    chosen = null;
    go(2);
    showToast("Appointment cancelled");
  });

  // Fill in what we already know about the signed-in user
  if (me) {
    $("f-name").value = me.name || me.fullName || "";
    $("f-email").value = me.email || "";
    $("f-phone").value = me.phone || me.mobile || "";
  }

  go(1, true);
})();