// Need Blood? page: find the nearest hospitals for blood requesters and blood donors.
// Hospital data below is hardcoded SAMPLE data until hospitals are connected (no database yet).
(function () {
  var me = getUser();
  if (!me || !document.getElementById("find-btn")) return;

  var TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // stock = units on hand, in the order of TYPES. need: 0 = sufficient, 1 = needed, 2 = urgent.
  // days = how many days from today the hospital holds a donation day.
  var HOSPITALS = [
    { name: "Cebu Doctors' University Hospital", kind: "Private hospital", street: "Osmeña Boulevard", city: "Cebu City, Cebu",
      phone: "(032) 555-0101", email: "bloodbank@cdu.example.com", hours: "Mon–Sat, 8:00 AM – 4:00 PM", lat: 10.3170, lng: 123.8910,
      stock: [14, 3, 9, 0, 6, 1, 22, 4], need: [0, 2, 0, 2, 1, 2, 0, 1], days: [2, 6, 9], slots: "8:00 AM – 3:00 PM" },
    { name: "Chong Hua Hospital", kind: "Private hospital", street: "Don Mariano Cui St., Fuente Osmeña", city: "Cebu City, Cebu",
      phone: "(032) 555-0102", email: "bloodbank@chonghua.example.com", hours: "Mon–Sun, 8:00 AM – 5:00 PM", lat: 10.3080, lng: 123.8920,
      stock: [8, 0, 12, 2, 4, 0, 15, 0], need: [1, 2, 0, 1, 1, 2, 0, 2], days: [1, 3, 8], slots: "8:00 AM – 4:00 PM" },
    { name: "Vicente Sotto Memorial Medical Center", kind: "Government hospital", street: "B. Rodriguez St.", city: "Cebu City, Cebu",
      phone: "(032) 555-0103", email: "bloodbank@vsmmc.example.com", hours: "Mon–Fri, 8:00 AM – 3:00 PM", lat: 10.3010, lng: 123.8930,
      stock: [20, 6, 18, 5, 8, 2, 30, 7], need: [0, 1, 0, 0, 0, 1, 0, 1], days: [4, 7, 11], slots: "8:00 AM – 2:00 PM" },
    { name: "Perpetual Succour Hospital", kind: "Private hospital", street: "Gorordo Avenue", city: "Cebu City, Cebu",
      phone: "(032) 555-0104", email: "bloodbank@pshospital.example.com", hours: "Mon–Sat, 9:00 AM – 4:00 PM", lat: 10.3100, lng: 123.8900,
      stock: [5, 0, 7, 0, 2, 0, 9, 1], need: [1, 2, 1, 2, 2, 2, 1, 2], days: [2, 5, 10], slots: "9:00 AM – 3:00 PM" },
    { name: "Cebu Velez General Hospital", kind: "Private hospital", street: "F. Ramos St.", city: "Cebu City, Cebu",
      phone: "(032) 555-0105", email: "bloodbank@velez.example.com", hours: "Mon–Sat, 8:00 AM – 4:00 PM", lat: 10.3140, lng: 123.8940,
      stock: [11, 2, 4, 1, 3, 0, 13, 2], need: [0, 1, 1, 1, 1, 2, 0, 1], days: [3, 6, 13], slots: "8:00 AM – 3:00 PM" },
    { name: "Lapu-Lapu City Hospital", kind: "Government hospital", street: "Gun-ob", city: "Lapu-Lapu City, Cebu",
      phone: "(032) 555-0106", email: "bloodbank@llch.example.com", hours: "Mon–Fri, 8:00 AM – 4:00 PM", lat: 10.3100, lng: 123.9640,
      stock: [9, 1, 10, 3, 5, 1, 17, 3], need: [0, 2, 0, 1, 0, 2, 0, 1], days: [2, 4, 12], slots: "8:00 AM – 3:00 PM" }
  ];
  var DEFAULT_SPOT = { lat: 10.3157, lng: 123.8854, label: "Cebu City" };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  var typeSel = document.getElementById("f-type");
  var roleSel = document.getElementById("f-role");
  var findBtn = document.getElementById("find-btn");
  var errBox = document.getElementById("find-error");
  var results = document.getElementById("results");
  var note = document.getElementById("res-note");
  var topBox = document.getElementById("res-top");
  var othersTitle = document.getElementById("res-others-title");
  var others = document.getElementById("res-others");

  // distance in km between two points
  function km(a, b) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  // Ask the browser for the person's location; use Cebu City if it is not allowed
  function getSpot(done) {
    if (!navigator.geolocation) { done(DEFAULT_SPOT, false); return; }
    navigator.geolocation.getCurrentPosition(
      function (p) { done({ lat: p.coords.latitude, lng: p.coords.longitude }, true); },
      function () { done(DEFAULT_SPOT, false); },
      { timeout: 8000 }
    );
  }

  function dateFor(days) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d;
  }
  function fmtDate(d) {
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }

  function row(label, value) {
    var p = el("p", "hosp-row");
    p.appendChild(el("strong", "", label + " "));
    p.appendChild(document.createTextNode(value));
    return p;
  }

  function card(h, rank, idx, type, role) {
    var isTop = rank === 1;
    var c = el("div", "hosp-card" + (isTop ? " top" : ""));
    if (isTop) c.appendChild(el("span", "hosp-flag", "Top choice near you"));

    var head = el("div", "hosp-head");
    head.appendChild(el("div", "hosp-rank", "#" + rank));
    var titles = el("div");
    titles.appendChild(el("h3", "", h.name));
    titles.appendChild(el("p", "hosp-area", h.kind + " · " + h.dist.toFixed(1) + " km away"));
    head.appendChild(titles);
    c.appendChild(head);

    if (role === "requester") {
      var units = h.stock[idx];
      var box = el("div", "hosp-units");
      box.appendChild(el("span", "hosp-units-num", String(units)));
      box.appendChild(el("span", "hosp-units-text", (units === 1 ? "unit" : "units") + " of " + type + " available" + (units < 5 ? " (low stock)" : "")));
      c.appendChild(box);
    } else {
      var need = h.need[idx];
      c.appendChild(el("p", "hosp-need" + (need === 2 ? " urgent" : ""), need === 2 ? type + " donors urgently needed" : type + " donors needed"));
      var dates = el("div", "hosp-dates");
      dates.appendChild(el("strong", "", "Available dates for donating"));
      var ul = el("ul");
      h.days.forEach(function (n) {
        ul.appendChild(el("li", "", fmtDate(dateFor(n)) + " · " + h.slots));
      });
      dates.appendChild(ul);
      c.appendChild(dates);
    }

    c.appendChild(row("Address:", h.street + ", " + h.city));
    c.appendChild(row("Contact number:", h.phone));
    c.appendChild(row("Email:", h.email));
    c.appendChild(row(role === "requester" ? "Blood bank hours:" : "Donation hours:", h.hours));

    if (role === "donor") {
      var b = el("button", "btn btn-register hosp-btn", "Email an appointment");
      b.type = "button";
      b.addEventListener("click", function () { openAppt(h, type); });
      c.appendChild(b);
    }
    return c;
  }

  function showResults(spot, located) {
    var type = typeSel.value, role = roleSel.value;
    var idx = TYPES.indexOf(type);

    var list = HOSPITALS.map(function (h) {
      var copy = {}; for (var k in h) copy[k] = h[k];
      copy.dist = km(spot, h);
      return copy;
    }).filter(function (h) {
      // requesters only see hospitals that have the chosen blood type; donors only see hospitals that need it
      return role === "requester" ? h.stock[idx] > 0 : h.need[idx] > 0;
    }).sort(function (a, b) { return a.dist - b.dist; });

    topBox.innerHTML = "";
    others.innerHTML = "";
    note.textContent = (located ? "Using your current location. " : "We could not get your location, so results are near " + DEFAULT_SPOT.label + ". ") +
      "Hospitals are ranked from nearest to farthest.";

    if (!list.length) {
      topBox.appendChild(el("p", "res-none", role === "requester"
        ? "None of the sample hospitals have " + type + " in stock right now."
        : "None of the sample hospitals need " + type + " donors right now."));
      othersTitle.hidden = true;
    } else {
      topBox.appendChild(card(list[0], 1, idx, type, role));
      list.slice(1).forEach(function (h, i) {
        others.appendChild(card(h, i + 2, idx, type, role));
      });
      othersTitle.hidden = list.length < 2;
    }
    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  findBtn.addEventListener("click", function () {
    if (!typeSel.value || !roleSel.value) {
      errBox.textContent = "Please choose a blood type and whether you are a blood donor or a blood requester.";
      errBox.hidden = false;
      return;
    }
    errBox.hidden = true;
    findBtn.disabled = true;
    findBtn.textContent = "Searching…";
    getSpot(function (spot, located) {
      findBtn.disabled = false;
      findBtn.textContent = "Search";
      showResults(spot, located);
    });
  });

  // ---- appointment popup (opens the donor's email app with the request ready to send) ----
  var modal = document.getElementById("appt-modal");
  var form = document.getElementById("appt-form");
  var aErr = document.getElementById("a-error");
  var dateSel = document.getElementById("a-date");
  var current = null;

  function openAppt(h, type) {
    current = { h: h, type: type };
    form.reset();
    aErr.hidden = true;
    document.getElementById("a-name").value = (me && me.name && me.name !== "User") ? me.name : "";
    dateSel.innerHTML = "";
    h.days.forEach(function (n) {
      var o = document.createElement("option");
      o.textContent = fmtDate(dateFor(n)) + " · " + h.slots;
      dateSel.appendChild(o);
    });
    document.getElementById("appt-title").textContent = "Appointment at " + h.name;
    modal.classList.add("open");
  }
  function closeAppt() { modal.classList.remove("open"); }

  modal.querySelector(".modal-x").addEventListener("click", closeAppt);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeAppt(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAppt(); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("a-name").value.trim();
    var phone = document.getElementById("a-phone").value.trim();
    if (!name || !phone) {
      aErr.textContent = "Please fill in all required fields.";
      aErr.hidden = false;
      return;
    }
    var when = dateSel.value;
    var subject = "Blood donation appointment request (" + current.type + ")";
    var body = "Good day,\n\nI would like to book a blood donation appointment at " + current.h.name + ".\n\n" +
      "Name: " + name + "\nContact number: " + phone + "\nBlood type: " + current.type +
      "\nPreferred schedule: " + when + "\n\nSent through AlayDugo. Thank you.";
    closeAppt();
    window.location.href = "mailto:" + current.h.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    showToast("Your email app opened. Press send to complete the request.");
  });
})();