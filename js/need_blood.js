// Find Blood Donors page:
//  - donors: verify to become a donor, update availability
//  - requesters: blood request form, posted under "Become a Donor"
// Everything is saved in this browser only until there is a database. Nothing is uploaded or sent yet.
(function () {
  var me = getUser();
  var role = me ? me.role : "";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function wireModal(m) {
    m.addEventListener("click", function (e) {
      if (e.target === m) m.classList.remove("open");
    });
    m.querySelectorAll(".modal-x, .modal-cancel").forEach(function (b) {
      b.addEventListener("click", function () { m.classList.remove("open"); });
    });
  }

  var modals = ["verify-modal", "avail-modal", "request-modal", "apply-modal"].map(function (id) {
    return document.getElementById(id);
  });
  modals.forEach(wireModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      modals.forEach(function (m) { m.classList.remove("open"); });
    }
  });

  // ================= Blood requests (Become a Donor) =================
  var SAMPLE_REQUESTS = [
    {
      name: "Maria Santos", type: "O+", units: 2, date: "2026-11-24",
      hospital: "Cebu City Medical Center", address: "Brgy. Lahug, Cebu City",
      person: "Elena Santos", phone: "0900 000 0001", info: "Needed for scheduled surgery."
    },
    {
      name: "Juan Dela Cruz", type: "A+", units: 3, date: "2026-11-26",
      hospital: "Mandaue City Hospital", address: "Brgy. Mabolo, Cebu City",
      person: "Carlo Dela Cruz", phone: "0900 000 0002", info: ""
    }
  ];

  var REQ_KEY = "alaydugo_requests";
  var posted = [];
  try { posted = JSON.parse(localStorage.getItem(REQ_KEY)) || []; } catch (e) {}

  var rqGrid = document.getElementById("rq-grid");

  function line(label, value) {
    var p = el("p");
    p.appendChild(el("strong", "", label + ": "));
    p.appendChild(document.createTextNode(value));
    return p;
  }

  function renderRequests() {
    rqGrid.innerHTML = "";
    posted.concat(SAMPLE_REQUESTS).forEach(function (r) {
      var card = el("div", "rq-card");

      var top = el("div", "rq-top");
      top.appendChild(el("div", "badge-type", r.type));
      top.appendChild(el("span", "rq-units", r.units + " unit(s) needed"));
      card.appendChild(top);

      card.appendChild(el("h3", "", r.name));

      var p = r.date.split("-");
      var when = new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      card.appendChild(line("Date needed", when));
      card.appendChild(line("Hospital / Location", r.hospital));
      card.appendChild(line("Address", r.address));
      card.appendChild(line("Contact Person", r.person));
      card.appendChild(line("Contact Number", r.phone));

      if (r.info) {
        var info = el("p", "rq-info");
        info.appendChild(el("strong", "", "Additional Info: "));
        info.appendChild(document.createTextNode(r.info));
        card.appendChild(info);
      } else {
        card.appendChild(el("div", "rq-spacer"));
      }

      // Requesters cannot apply to donate. Sending the message does nothing yet.
      if (role !== "requester") {
        var apply = el("button", "btn btn-apply", "Apply to Donate");
        apply.type = "button";
        apply.addEventListener("click", function () {
          document.getElementById("apply-title").textContent = "Apply to donate to " + r.name;
          document.getElementById("apply-message").value = "";
          document.getElementById("apply-modal").classList.add("open");
        });
        card.appendChild(apply);
      }

      rqGrid.appendChild(card);
    });
  }
  renderRequests();

  // ---- requester: Request Blood ----
  var requestBtn = document.getElementById("request-btn");
  var requestModal = document.getElementById("request-modal");
  var requestForm = document.getElementById("request-form");
  var requestError = document.getElementById("r-error");

  if (role === "requester") {
    requestBtn.hidden = false;
  }

  function todayISO() {
    var n = new Date();
    var pad = function (x) { return (x < 10 ? "0" : "") + x; };
    return n.getFullYear() + "-" + pad(n.getMonth() + 1) + "-" + pad(n.getDate());
  }

  requestBtn.addEventListener("click", function () {
    requestForm.reset();
    requestError.hidden = true;
    document.getElementById("r-date").min = todayISO();
    requestModal.classList.add("open");
    document.getElementById("r-name").focus();
  });

  requestForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (id) { return document.getElementById(id).value.trim(); };

    var data = {
      name: v("r-name"), type: v("r-type"), units: v("r-units"), date: v("r-date"),
      person: v("r-person"), phone: v("r-phone"), address: v("r-address"),
      hospital: v("r-hospital"), info: v("r-info")
    };

    var missing = ["name", "type", "units", "date", "person", "phone", "address", "hospital"].some(function (k) {
      return data[k] === "";
    });
    if (missing) {
      requestError.textContent = "Please fill in all required fields.";
      requestError.hidden = false;
      return;
    }
    var idFile = document.getElementById("r-id").files[0];
    if (!idFile) {
      requestError.textContent = "Please upload your NID or Birth Certificate.";
      requestError.hidden = false;
      return;
    }
    var idOk = ["image/jpeg", "image/png", "image/webp"].indexOf(idFile.type) !== -1;
    if (!idOk || idFile.size > 5 * 1024 * 1024) {
      requestError.textContent = "File must be JPG, PNG, or WEBP and no larger than 5 MB.";
      requestError.hidden = false;
      return;
    }
    if (!(parseInt(data.units, 10) >= 1)) {
      requestError.textContent = "Number of units must be at least 1.";
      requestError.hidden = false;
      return;
    }
    if (data.date < todayISO()) {
      requestError.textContent = "Date needed cannot be in the past.";
      requestError.hidden = false;
      return;
    }

    data.units = parseInt(data.units, 10);
    posted.unshift(data);
    try { localStorage.setItem(REQ_KEY, JSON.stringify(posted)); } catch (err) {}

    requestModal.classList.remove("open");
    renderRequests();
    showToast("Blood request posted");
    document.getElementById("requests").scrollIntoView({ behavior: "smooth" });
  });

  // ================= Donor: verify and availability =================
  if (role !== "donor") return;

  var verifyBtn = document.getElementById("verify-btn");
  var availBtn = document.getElementById("avail-btn");
  var verifyModal = document.getElementById("verify-modal");
  var availModal = document.getElementById("avail-modal");
  var verifyForm = document.getElementById("verify-form");
  var verifyError = document.getElementById("v-error");
  var availOn = document.getElementById("av-available");
  var showLast = document.getElementById("av-last");

  var key = "alaydugo_donor_" + (me.email || "donor");
  var state = {};
  try { state = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) {}

  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {}
  }

  // Once verified, "Update Donor Availability" replaces "Verify to Become a Donor"
  function refresh() {
    verifyBtn.hidden = !!state.verified;
    availBtn.hidden = !state.verified;
  }

  verifyBtn.addEventListener("click", function () {
    verifyForm.reset();
    verifyError.hidden = true;
    verifyModal.classList.add("open");
  });

  verifyForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var file = document.getElementById("v-id").files[0];
    if (!file) {
      verifyError.textContent = "Please upload your NID or Birth Certificate.";
      verifyError.hidden = false;
      return;
    }
    var okType = ["image/jpeg", "image/png", "image/webp"].indexOf(file.type) !== -1;
    if (!okType || file.size > 5 * 1024 * 1024) {
      verifyError.textContent = "File must be JPG, PNG, or WEBP and no larger than 5 MB.";
      verifyError.hidden = false;
      return;
    }

    state.verified = true;
    state.donatedBefore = document.getElementById("v-donated").checked;
    if (state.available === undefined) state.available = true;
    save();
    verifyModal.classList.remove("open");
    refresh();
    showToast("Verification submitted");
  });

  availBtn.addEventListener("click", function () {
    availOn.checked = state.available !== false;
    showLast.checked = !!state.showLast;
    availModal.classList.add("open");
  });

  document.getElementById("av-save").addEventListener("click", function () {
    state.available = availOn.checked;
    state.showLast = showLast.checked;
    save();
    availModal.classList.remove("open");
    showToast("Availability updated");
  });

  refresh();
})();