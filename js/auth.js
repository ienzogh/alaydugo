// Built-in accounts (placeholders until there is a database)
var ACCOUNTS = [
  { email: "admin@gmail.com", password: "admin123", role: "admin", name: "Admin" },
  { email: "donor@gmail.com", password: "donor123", role: "donor", name: "Donor" },
  { email: "requester@gmail.com", password: "requester123", role: "requester", name: "Requester" }
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

// Highlight the selected role card
document.querySelectorAll('input[name="role"]').forEach(function (radio) {
  radio.addEventListener("change", function () {
    document.querySelectorAll(".role").forEach(function (card) {
      card.classList.toggle("selected", card.querySelector("input").checked);
    });
  });
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
        window.location.href = "campaigns.html";
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