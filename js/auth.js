// Log In / Register / Forgot password page (auth.html)

// Built-in accounts (placeholders until there is a database)
var ACCOUNTS = [
  { email: "admin@gmail.com", password: "admin123", role: "admin", name: "Admin" },
  { email: "user@gmail.com", password: "user123", role: "user", name: "User" }
];

// Switch between Log In, Register and Forgot Password using the page link (#login, #register, #forgot)
var views = ["login", "register", "forgot"];
var titles = { login: "Log In", register: "Create Account", forgot: "Forgot Password" };

function showView() {
  var name = window.location.hash.replace("#", "");
  if (views.indexOf(name) === -1) name = "login";

  views.forEach(function (v) {
    document.getElementById("view-" + v).hidden = v !== name;
  });
  document.title = titles[name] + " – AlayDugo";
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", showView);
showView();

// Address: Region > Province > City/Municipality > Barangay, loaded from the PSGC Cloud API (psgc.cloud).
// If it cannot be reached, the same lists are loaded from the PSGC mirror at psgc.gitlab.io.
var SOURCES = ["https://psgc.cloud/api", "https://psgc.gitlab.io/api"];
var apiBase = null;

var regionSel = document.getElementById("reg-region");
var provinceSel = document.getElementById("reg-province");
var citySel = document.getElementById("reg-city");
var barangaySel = document.getElementById("reg-barangay");

function sortByName(items) {
  if (!Array.isArray(items) && items && Array.isArray(items.data)) items = items.data;
  return items.sort(function (a, b) { return a.name.localeCompare(b.name); });
}

function load(base, path) {
  return fetch(base + path).then(function (r) {
    if (!r.ok) throw new Error("bad response");
    return r.json();
  }).then(sortByName);
}

// Regions decide which source is used for the rest of the lists
function loadRegions() {
  var i = 0;
  function next() {
    if (i >= SOURCES.length) return Promise.reject(new Error("no source"));
    var base = SOURCES[i++];
    return load(base, "/regions").then(function (items) {
      apiBase = base;
      return items;
    }).catch(next);
  }
  return next();
}

function getList(path) {
  return load(apiBase, path);
}

function fill(select, placeholder, items) {
  select.innerHTML = "";
  var first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.appendChild(first);
  items.forEach(function (item) {
    var o = document.createElement("option");
    o.value = item.code;
    o.textContent = item.name;
    select.appendChild(o);
  });
  select.disabled = items.length === 0;
}

function reset(select, placeholder) {
  fill(select, placeholder, []);
}

function addressFailed() {
  document.getElementById("addr-error").hidden = false;
}

loadRegions().then(function (items) {
  fill(regionSel, "Select region", items);
}).catch(function () {
  reset(regionSel, "Unavailable");
  addressFailed();
});

regionSel.addEventListener("change", function () {
  reset(provinceSel, "Select province");
  reset(citySel, "Select city / municipality");
  reset(barangaySel, "Select barangay");
  provinceSel.required = true;
  if (!regionSel.value) return;
  getList("/regions/" + regionSel.value + "/provinces").then(function (items) {
    if (items.length) {
      fill(provinceSel, "Select province", items);
      return;
    }
    // e.g. Metro Manila has no provinces: go straight to its cities
    reset(provinceSel, "Not applicable");
    provinceSel.required = false;
    return getList("/regions/" + regionSel.value + "/cities-municipalities").then(function (cities) {
      fill(citySel, "Select city / municipality", cities);
    });
  }).catch(addressFailed);
});

provinceSel.addEventListener("change", function () {
  reset(citySel, "Select city / municipality");
  reset(barangaySel, "Select barangay");
  if (!provinceSel.value) return;
  getList("/provinces/" + provinceSel.value + "/cities-municipalities").then(function (items) {
    fill(citySel, "Select city / municipality", items);
  }).catch(addressFailed);
});

citySel.addEventListener("change", function () {
  reset(barangaySel, "Select barangay");
  if (!citySel.value) return;
  getList("/cities-municipalities/" + citySel.value + "/barangays").then(function (items) {
    fill(barangaySel, "Select barangay", items);
  }).catch(addressFailed);
});

// Forms do nothing yet (no database)
var consent = document.getElementById("reg-consent");
var consentError = document.getElementById("consent-error");

consent.addEventListener("change", function () {
  if (consent.checked) consentError.hidden = true;
});

document.querySelectorAll(".auth-card form").forEach(function (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Log in (only the built-in accounts work until there is a database)
    if (form.id === "form-login") {
      var who = document.getElementById("login-email").value.trim().toLowerCase();
      var pass = document.getElementById("login-password").value;
      var account = ACCOUNTS.filter(function (a) {
        return a.email === who && a.password === pass;
      })[0];

      if (account) {
        try {
          localStorage.setItem("alaydugo_user", JSON.stringify({ role: account.role, name: account.name, email: account.email }));
        } catch (err) {}
        window.location.href = "donate.html";
      } else {
        document.getElementById("login-error").hidden = false;
      }
      return;
    }

    // Do not continue creating the account without consent
    if (form.id === "form-register" && !consent.checked) {
      consentError.hidden = false;
      consent.focus();
      return;
    }
  });
});