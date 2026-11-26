// Shared by every page: mobile menu, login state, Log Out confirmation, login gate and toast message.

// Toggle the mobile menu
var toggle = document.getElementById("menu-toggle");
if (toggle) {
  toggle.addEventListener("click", function () {
    document.getElementById("links").classList.toggle("open");
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