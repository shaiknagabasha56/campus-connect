document.addEventListener("DOMContentLoaded", () => {

    /*==================================================
        ELEMENTS
    ==================================================*/

    const flipCard = document.querySelector(".flip-card");

    const showSignup = document.getElementById("showSignup");
    const showLogin = document.getElementById("showLogin");

    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("password");

    const signupFullName = document.getElementById("signupFullName");
    const signupPhone = document.getElementById("signupPhone");
    const signupEmail = document.getElementById("signupEmail");
    const signupPassword = document.getElementById("signupPassword");
    const confirmPassword = document.getElementById("confirmPassword");

    const togglePassword = document.getElementById("togglePassword");
    const toggleSignupPassword = document.getElementById("toggleSignupPassword");

    const loginBtn = document.querySelector(".card-front .login-btn");
    const signupBtn = document.querySelector(".card-back .login-btn");

    /*==================================================
        LOGIN ↔ SIGNUP FLIP
    ==================================================*/

    if (showSignup) {

        showSignup.addEventListener("click", (e) => {

            e.preventDefault();

            flipCard.classList.add("flip");

        });

    }

    if (showLogin) {

        showLogin.addEventListener("click", (e) => {

            e.preventDefault();

            flipCard.classList.remove("flip");

        });

    }

    /*==================================================
        LOGIN PASSWORD TOGGLE
    ==================================================*/

    if (togglePassword && loginPassword) {

        togglePassword.addEventListener("click", () => {

            if (loginPassword.type === "password") {

                loginPassword.type = "text";
                togglePassword.textContent = "HIDE";

            } else {

                loginPassword.type = "password";
                togglePassword.textContent = "SHOW";

            }

        });

    }

    /*==================================================
        SIGNUP PASSWORD TOGGLE
    ==================================================*/

    if (toggleSignupPassword && signupPassword) {

        toggleSignupPassword.addEventListener("click", () => {

            if (signupPassword.type === "password") {

                signupPassword.type = "text";
                toggleSignupPassword.textContent = "HIDE";

            } else {

                signupPassword.type = "password";
                toggleSignupPassword.textContent = "SHOW";

            }

        });

    }

    /*==================================================
        LOGIN VALIDATION
    ==================================================*/

    

    

    /*==================================================
        SIGNUP VALIDATION
    ==================================================*/

    if (signupBtn) {

        signupBtn.addEventListener("click", async () => {

            const fullName = signupFullName.value.trim();
            const phone = signupPhone.value.trim();
            const email = signupEmail.value.trim();
            const password = signupPassword.value.trim();
            const confirm = confirmPassword.value.trim();

            if (fullName === "") {
                showMessage(signupError, "error", "Please enter your full name.");
                return;
            }

            if (phone === "") {
                showMessage(signupError, "error", "Please enter your phone number.");
                return;
            }

            if (email === "") {
                showMessage(signupError, "error", "Please enter your email address.");
                return;
            }

            if (password === "") {
                showMessage(signupError, "error", "Please enter a password.");
                return;
            }

            if (password.length < 6) {
                showMessage(signupError, "error", "Password must be at least 6 characters.");
                return;
            }

            if (confirm === "") {
                showMessage(signupError, "error", "Please confirm your password.");
                return;
            }

            if (password !== confirm) {
                showMessage(signupError, "error", "Passwords do not match.");
                return;
            }

            signupBtn.disabled = true;

            try {

                const response = await fetch("/api/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        full_name: fullName,
                        phone: phone,
                        email: email,
                        password: password,
                        confirm_password: confirm
                    })
                });

                const data = await response.json();

                if (data.success) {

                    showMessage(signupError, "success", "✅ " + data.message);

                    setTimeout(() => {
                        flipCard.classList.remove("flip");
                    }, 1200);

                } else {

                    showMessage(signupError, "error", data.message || "Signup failed.");

                }

            } catch (err) {

                showMessage(signupError, "error", "Could not reach the server. Please try again.");

            } finally {

                signupBtn.disabled = false;

            }

        });

    }

});

/*==================================================
        FORGOT PASSWORD POPUP
==================================================*/

const forgotBtn = document.getElementById("forgotPasswordBtn");
const forgotOverlay = document.getElementById("forgotOverlay");
const forgotCard = document.getElementById("forgotCard");
const closeForgot = document.getElementById("closeForgot");
const sendReset = document.getElementById("sendReset");
const forgotEmail = document.getElementById("forgotEmail");
const forgotMessage = document.getElementById("forgotMessage");

/*==============================
    OPEN POPUP
==============================*/

forgotBtn.addEventListener("click", function(e){

    e.preventDefault();

    forgotOverlay.classList.add("active");

    forgotEmail.value = "";

    forgotMessage.innerHTML = "";

    forgotMessage.className = "forgot-message";

});

/*==============================
    CLOSE POPUP
==============================*/

function closeForgotPopup(){

    forgotOverlay.classList.remove("active");

}

/*==============================
    CLOSE BUTTON
==============================*/

closeForgot.addEventListener("click", closeForgotPopup);

/*==============================
    CLICK OUTSIDE
==============================*/

forgotOverlay.addEventListener("click", function(e){

    if(e.target === forgotOverlay){

        closeForgotPopup();

    }

});

/*==============================
    ESC KEY
==============================*/

document.addEventListener("keydown", function(e){

    if(e.key === "Escape"){

        closeForgotPopup();

    }

});

/*==============================
    EMAIL VALIDATION
==============================*/

function isValidEmail(email){

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}

/*==============================
    SEND RESET LINK
==============================*/

sendReset.addEventListener("click", async function(){

    const email = forgotEmail.value.trim();

    forgotMessage.className = "forgot-message";

    forgotMessage.innerHTML = "";

    if(email === ""){

        forgotMessage.classList.add("error");

        forgotMessage.innerHTML = "Please enter your email.";

        return;

    }

    if(!isValidEmail(email)){

        forgotMessage.classList.add("error");

        forgotMessage.innerHTML = "Please enter a valid email.";

        return;

    }

    /*=========================================
        BACKEND API WILL COME HERE
    =========================================*/

    /*
    Example:

    const response = await fetch("/forgot-password",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({email})

    });

    const data = await response.json();

    */

    /*=========================================
        TEMPORARY DEMO
    =========================================*/

    if(email === "admin@gmail.com"){

        forgotMessage.classList.add("success");

        forgotMessage.innerHTML =
            "Reset link has been sent to your email.";

        setTimeout(function(){

            closeForgotPopup();

        },2000);

    }

    else{

        forgotMessage.classList.add("error");

        forgotMessage.innerHTML =
            "User not found.";

    }

});


/*==================================================
            FORM MESSAGE FUNCTIONS
==================================================*/

const loginError = document.getElementById("loginError");
const signupError = document.getElementById("signupError");

/* Show Message */

function showMessage(target, type, message){

    target.className = "form-message";

    target.classList.add(type);

    target.classList.add("show");

    target.innerHTML = message;

    clearTimeout(target.hideTimer);

    target.hideTimer = setTimeout(function(){

        hideMessage(target);

    }, 4000);

}

/* Hide Message */

function hideMessage(target){

    target.classList.remove("show");

}
