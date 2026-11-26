// Log In / Register / Forgot password page (auth.html)

// Built-in accounts (placeholders until there is a database)
var ACCOUNTS = [
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

// Address: City/Municipality > Barangay (a hardcoded sample list, not every place in Cebu)
var ADDRESSES = {
  "Cebu City": ["Apas", "Banilad", "Capitol Site", "Guadalupe", "Lahug", "Mabolo", "Talamban", "Tisa"],
  "Consolacion": ["Cansaga", "Casili", "Jugan", "Nangka", "Pitogo", "Tayud"],
  "Lapu-Lapu City": ["Basak", "Gun-ob", "Mactan", "Marigondon", "Pajo", "Pusok"],
  "Liloan": ["Catarman", "Cotcot", "Jubay", "Poblacion", "Tayud", "Yati"],
  "Mandaue City": ["Alang-Alang", "Bakilid", "Banilad", "Centro", "Subangdaku", "Tipolo"],
  "Minglanilla": ["Calajo-an", "Linao", "Pakigne", "Tulay", "Tunghaan", "Tungkop"],
  "Talisay City": ["Bulacao", "Lawaan I", "Poblacion", "San Roque", "Tabunok"]
};

var citySel = document.getElementById("reg-city");
var barangaySel = document.getElementById("reg-barangay");

function addOptions(select, names) {
  names.forEach(function (name) {
    var o = document.createElement("option");
    o.value = name;
    o.textContent = name;
    select.appendChild(o);
  });
}

addOptions(citySel, Object.keys(ADDRESSES));

citySel.addEventListener("change", function () {
  barangaySel.length = 1; // keep only "Select barangay"
  barangaySel.disabled = !citySel.value;
  if (citySel.value) addOptions(barangaySel, ADDRESSES[citySel.value]);
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