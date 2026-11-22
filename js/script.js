// Toggle the mobile menu
var toggle = document.getElementById("menu-toggle");
if (toggle) {
  toggle.addEventListener("click", function () {
    document.getElementById("links").classList.toggle("open");
  });
}

// Send inquiry popup (open and close only, nothing is sent yet)
var modal = document.getElementById("inquiry-modal");
if (modal) {
  var title = document.getElementById("modal-title");

  function closeModal() {
    modal.classList.remove("open");
  }

  document.querySelectorAll(".btn-inquiry").forEach(function (btn) {
    btn.addEventListener("click", function () {
      title.textContent = "Send inquiry to " + btn.dataset.name;
      modal.classList.add("open");
    });
  });

  modal.querySelector(".modal-cancel").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });
}

// Find Blood Donors search (filters the sample cards on the page)
var searchBtn = document.getElementById("search-btn");
if (searchBtn) {
  var typeSelect = document.getElementById("blood-type");
  var cityInput = document.getElementById("city");
  var availSelect = document.getElementById("availability");
  var cards = document.querySelectorAll(".donor-card");
  var countText = document.getElementById("donor-count");
  var emptyText = document.getElementById("donor-empty");

  function runSearch() {
    var type = typeSelect.value;
    var words = cityInput.value.toLowerCase().split(/[\s,]+/).filter(Boolean);
    var shown = 0;

    cards.forEach(function (card) {
      var loc = card.dataset.loc.toLowerCase();
      var okType = type === "Any" || card.dataset.type === type;
      var okLoc = words.every(function (w) { return loc.indexOf(w) !== -1; });
      var okAvail = !availSelect || availSelect.value === "Any" || card.dataset.avail === availSelect.value;
      var show = okType && okLoc && okAvail;
      card.style.display = show ? "" : "none";
      if (show) shown++;
    });

    countText.textContent = shown + (shown === 1 ? " donor found" : " donors found");
    emptyText.hidden = shown !== 0;
  }

  searchBtn.addEventListener("click", runSearch);
  cityInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") runSearch();
  });
}

// Logged-in state (kept in this browser only until there is a database)
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("alaydugo_user"));
  } catch (e) {
    return null;
  }
}

var currentUser = getUser();

// Nav: "Log In" becomes "Log Out" when someone is logged in
var loginLink = document.querySelector(".btn-login");
if (loginLink && currentUser) {
  loginLink.textContent = "Log Out";
  loginLink.setAttribute("href", "index.html");
  loginLink.addEventListener("click", function (e) {
    e.preventDefault();
    openLogoutConfirm();
  });
}

// Ask first before logging out
function openLogoutConfirm() {
  var box = document.getElementById("logout-modal");

  if (!box) {
    box = document.createElement("div");
    box.className = "modal";
    box.id = "logout-modal";
    box.innerHTML =
      '<div class="modal-box confirm-box">' +
        '<div class="modal-head"><h3>Log out</h3>' +
        '<button type="button" class="modal-x" aria-label="Close">\u00D7</button></div>' +
        '<p>Are you sure you want to log out?</p>' +
        '<div class="modal-actions">' +
          '<button type="button" class="btn modal-cancel">Cancel</button>' +
          '<button type="button" class="btn modal-send" id="logout-yes">Yes, log out</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(box);

    var close = function () { box.classList.remove("open"); };
    box.querySelector(".modal-x").addEventListener("click", close);
    box.querySelector(".modal-cancel").addEventListener("click", close);
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    document.getElementById("logout-yes").addEventListener("click", function () {
      try { localStorage.removeItem("alaydugo_user"); } catch (err) {}
      window.location.href = "index.html";
    });
  }

  box.classList.add("open");
}

// Nav: no Register button once logged in
var registerLink = document.querySelector(".nav .btn-red");
if (registerLink && currentUser) {
  registerLink.parentNode.hidden = true;
}

// Home page: no "Become a Donor" buttons once logged in
if (currentUser) {
  document.querySelectorAll(".join-btn").forEach(function (b) { b.hidden = true; });
}

// Pages that need a login: show the content instead of the "Log in to continue" card
var gateEl = document.getElementById("gate");
var protectedEl = document.getElementById("protected");
if (gateEl && protectedEl && currentUser) {
  gateEl.hidden = true;
  protectedEl.hidden = false;
}

// Small message at the bottom right
function showToast(message) {
  var t = document.createElement("div");
  t.className = "toast";
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(function () { t.classList.add("show"); }, 10);
  setTimeout(function () {
    t.classList.remove("show");
    setTimeout(function () { t.remove(); }, 300);
  }, 2600);
}