// Donate Now page (campaigns): sample campaigns, filters and registration.
// Campaigns are hardcoded samples until there is a database.
(function () {
  var SAMPLES = [
    {
      id: "sample-1",
      title: "Community Blood Donation Drive",
      image: "sample_pics/sample1.jpg",
      date: "2026-12-05",
      organizer: "AlayDugo Volunteers",
      start: "08:00",
      end: "15:00",
      venue: "CTU Main Campus Gymnasium",
      address: "Corner M.J. Cuenco Ave. and R. Palma St., Cebu City",
      description: "Join our community drive and give the gift of life. Light snacks are provided for every donor."
    },
    {
      id: "sample-2",
      title: "Barangay Blood Donation Day",
      image: "sample_pics/sample2.jpg",
      date: "2026-12-12",
      organizer: "AlayDugo Student Volunteers",
      start: "09:00",
      end: "16:00",
      venue: "Liloan Municipal Gymnasium",
      address: "Poblacion, Liloan, Cebu",
      description: "A one-day donation event for residents of Liloan and nearby towns. Please bring a valid ID."
    }
  ];

  var ICONS = {
    calendar: "icons/calendar.png",
    clock: "icons/clock.png",
    location: "icons/location.png",
    organizer: "icons/organizer.png"
  };
  var DROP = '<svg viewBox="0 0 24 24"><path d="M12 2.5S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5z"/></svg>';

  var me = getUser();

  var grid = document.getElementById("camp-grid");
  var emptyMsg = document.getElementById("camp-empty");
  var searchInput = document.getElementById("search");
  var cityField = document.getElementById("city");
  var dateField = document.getElementById("date");
  var resetBtn = document.getElementById("reset-btn");
  var confirmModal = document.getElementById("confirm-modal");
  // Campaigns this user registered for (kept in this browser until there is a database)
  var regKey = "alaydugo_regs_" + (me ? (me.email || me.role) : "guest");
  var regs = [];
  try { regs = JSON.parse(localStorage.getItem(regKey)) || []; } catch (e) {}

  function saveRegs() {
    try { localStorage.setItem(regKey, JSON.stringify(regs)); } catch (e) {}
  }

  // ---- helpers ----
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function parseDate(d) {
    var p = d.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function fmtTime(t) {
    var p = t.split(":");
    var h = +p[0];
    var ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return h + ":" + p[1] + " " + ap;
  }

  function metaRow(icon, text) {
    var li = el("li");
    var pic = el("img");
    pic.src = icon;
    pic.alt = "";
    li.appendChild(pic);
    li.appendChild(document.createTextNode(text));
    return li;
  }

  // ---- show the cards ----
  function matches(c) {
    var q = searchInput.value.trim().toLowerCase();
    if (q && (c.title + " " + c.venue + " " + c.organizer).toLowerCase().indexOf(q) === -1) return false;

    var words = cityField.value.toLowerCase().split(/[\s,]+/).filter(Boolean);
    var city = c.address.toLowerCase();
    if (!words.every(function (w) { return city.indexOf(w) !== -1; })) return false;

    if (dateField.value && c.date !== dateField.value) return false;
    return true;
  }

  function render() {
    grid.innerHTML = "";
    var list = SAMPLES.filter(matches).sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    });

    list.forEach(function (c) {
      var d = parseDate(c.date);
      var card = el("div", "camp-card");

      var img = el("div", "camp-img");
      if (c.image) {
        var pic = el("img");
        pic.src = c.image;
        pic.alt = c.title;
        // If the picture can't be loaded, fall back to the red drop
        pic.onerror = function () {
          pic.remove();
          img.insertAdjacentHTML("beforeend", DROP);
        };
        img.appendChild(pic);
      } else {
        img.insertAdjacentHTML("beforeend", DROP);
      }

      var badge = el("div", "camp-date");
      badge.appendChild(el("span", "m", d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()));
      badge.appendChild(el("span", "d", String(d.getDate())));
      img.appendChild(badge);

      card.appendChild(img);

      var body = el("div", "camp-body");
      body.appendChild(el("h3", "", c.title));

      var meta = el("ul", "camp-meta");
      meta.appendChild(metaRow(ICONS.calendar, d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })));
      if (c.start && c.end) meta.appendChild(metaRow(ICONS.clock, fmtTime(c.start) + " – " + fmtTime(c.end)));
      else if (c.start) meta.appendChild(metaRow(ICONS.clock, "Starts at " + fmtTime(c.start)));
      else if (c.end) meta.appendChild(metaRow(ICONS.clock, "Ends at " + fmtTime(c.end)));
      meta.appendChild(metaRow(ICONS.location, c.venue + ", " + c.address));
      meta.appendChild(metaRow(ICONS.organizer, "Organizer: " + c.organizer));
      body.appendChild(meta);

      body.appendChild(el("p", "camp-desc", c.description));

      // Register / cancel registration
      var joined = regs.indexOf(c.id) !== -1;
      var reg = el("button", "btn btn-register" + (joined ? " registered" : ""), joined ? "\u2713 Registered \u2013 Cancel" : "Register");
      reg.type = "button";
      reg.addEventListener("click", function () {
        if (joined) {
          askConfirm("Please confirm", "Cancel your registration for this campaign?", "Yes, cancel", function () {
            regs = regs.filter(function (id) { return id !== c.id; });
            saveRegs();
            render();
            showToast("Registration cancelled");
          });
        } else {
          var when = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          askConfirm("Register for this campaign", "Register for \u201C" + c.title + "\u201D on " + when + "?", "Yes, register", function () {
            regs.push(c.id);
            saveRegs();
            render();
            showToast("Registration confirmed");
          });
        }
      });
      body.appendChild(reg);

      card.appendChild(body);
      grid.appendChild(card);
    });

    emptyMsg.hidden = list.length !== 0;
  }

  [searchInput, cityField, dateField].forEach(function (f) {
    f.addEventListener("input", render);
  });
  resetBtn.addEventListener("click", function () {
    searchInput.value = "";
    cityField.value = "";
    dateField.value = "";
    render();
  });

  // ---- popups ----
  function closeAll() {
    document.querySelectorAll(".modal").forEach(function (m) { m.classList.remove("open"); });
  }

  document.querySelectorAll(".modal").forEach(function (m) {
    m.addEventListener("click", function (e) {
      if (e.target === m) m.classList.remove("open");
    });
    m.querySelectorAll(".modal-x, .modal-cancel").forEach(function (b) {
      b.addEventListener("click", function () { m.classList.remove("open"); });
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll();
  });

  // ---- confirm popup (register, cancel registration) ----
  var onYes = null;

  function askConfirm(title, text, yesLabel, callback) {
    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-text").textContent = text;
    document.getElementById("confirm-yes").textContent = yesLabel;
    onYes = callback;
    confirmModal.classList.add("open");
  }

  document.getElementById("confirm-yes").addEventListener("click", function () {
    var run = onYes;
    onYes = null;
    closeAll();
    if (run) run();
  });

  render();
})();