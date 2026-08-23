document.addEventListener("DOMContentLoaded", () => {

    // ==================================================
    // ELEMENTS
    // ==================================================

    const flipCard = document.querySelector(".flip-card");

    const showSignup = document.getElementById("showSignup");
    const showLogin = document.getElementById("showLogin");


    // ==================================================
    // LOGIN ELEMENTS
    // ==================================================

    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("password");
    const loginError = document.getElementById("loginError");


    // ==================================================
    // SIGNUP ELEMENTS
    // ==================================================

    const signupFullName = document.getElementById("signupFullName");
    const signupPhone = document.getElementById("signupPhone");
    const signupEmail = document.getElementById("signupEmail");
    const signupPassword = document.getElementById("signupPassword");
    const confirmPassword = document.getElementById("confirmPassword");

    const signupError = document.getElementById("signupError");


    // ==================================================
    // PASSWORD TOGGLE ELEMENTS
    // ==================================================

    const togglePassword = document.getElementById("togglePassword");

    const toggleSignupPassword =
        document.getElementById("toggleSignupPassword");


    // ==================================================
    // BUTTON ELEMENTS
    // ==================================================

    const loginBtn =
        document.querySelector(".card-front .login-btn");

    const signupBtn =
        document.querySelector(".card-back .login-btn");


    // ==================================================
    // GOOGLE BUTTON ELEMENTS
    // ==================================================

    const loginGoogleBtn =
        document.getElementById("loginGoogleBtn");

    const signupGoogleBtn =
        document.getElementById("signupGoogleBtn");


    // ==================================================
    // LOGIN + SIGNUP CARD FLIP FUNCTIONALITY
    // ==================================================

    if (showSignup) {

        showSignup.addEventListener("click", (e) => {

            e.preventDefault();

            // Flip card to signup side
            flipCard.classList.add("flip");

        });

    }


    if (showLogin) {

        showLogin.addEventListener("click", (e) => {

            e.preventDefault();

            // Flip card back to login side
            flipCard.classList.remove("flip");

        });

    }


    // ==================================================
    // LOGIN PASSWORD TOGGLE FUNCTIONALITY
    // ==================================================

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


    // ==================================================
    // SIGNUP PASSWORD TOGGLE FUNCTIONALITY
    // ==================================================

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


    // ==================================================
    // LOGIN VALIDATION + BACKEND REQUEST
    // ==================================================

    if (loginBtn) {

        loginBtn.addEventListener("click", async (e) => {

            e.preventDefault();

            // Get values from login inputs
            const email = loginEmail.value.trim();

            const password = loginPassword.value;


            // ==========================================
            // CLIENT-SIDE VALIDATION
            // ==========================================

            if (email === "") {

                showMessage(
                    loginError,
                    "error",
                    "Please enter your email address."
                );

                return;

            }


            if (password === "") {

                showMessage(
                    loginError,
                    "error",
                    "Please enter your password."
                );

                return;

            }


            // ==========================================
            // DISABLE BUTTON WHILE REQUEST IS PROCESSING
            // ==========================================

            loginBtn.disabled = true;


            try {

                // Send login data to Flask
                const response = await fetch("/auth/login", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        email: email,

                        password: password

                    })

                });


                // Convert Flask response to JavaScript object
                const data = await response.json();


                // ======================================
                // HANDLE SUCCESS
                // ======================================

                if (data.success) {

                    showMessage(
                        loginError,
                        "success",
                        data.message
                    );


                    setTimeout(() => {

                        // Redirect user to homepage
                        window.location.href = "/homepage/home";

                    }, 800);


                } else {

                    // Handle backend error
                    showMessage(
                        loginError,
                        "error",
                        data.message || "Login failed."
                    );

                }


            } catch (error) {

                console.error("Login error:", error);

                showMessage(
                    loginError,
                    "error",
                    "Could not reach the server. Please try again."
                );


            } finally {

                // Re-enable login button
                loginBtn.disabled = false;

            }

        });

    }


    // ==================================================
    // SIGNUP VALIDATION + BACKEND REQUEST
    // ==================================================

    if (signupBtn) {

        signupBtn.addEventListener("click", async (e) => {

            e.preventDefault();


            // Get user input
            const fullName = signupFullName.value.trim();

            const phone = signupPhone.value.trim();

            const email = signupEmail.value.trim();

            const password = signupPassword.value;

            const confirm = confirmPassword.value;


            // Clear previous message
            hideMessage(signupError);


            // ==========================================
            // CLIENT-SIDE VALIDATION
            // ==========================================

            // Check full name
            if (fullName === "") {

                showMessage(
                    signupError,
                    "error",
                    "Please enter your full name."
                );

                return;

            }


            // Check phone number
            if (phone === "") {

                showMessage(
                    signupError,
                    "error",
                    "Please enter your phone number."
                );

                return;

            }


            // Check whether phone contains exactly 10 digits
            if (!/^\d{10}$/.test(phone)) {

                showMessage(
                    signupError,
                    "error",
                    "Please enter a valid 10-digit phone number."
                );

                return;

            }


            // Check email
            if (email === "") {

                showMessage(
                    signupError,
                    "error",
                    "Please enter your email address."
                );

                return;

            }


            // Validate email format
            if (!isValidEmail(email)) {

                showMessage(
                    signupError,
                    "error",
                    "Please enter a valid email address."
                );

                return;

            }


            // Check password
            if (password === "") {

                showMessage(
                    signupError,
                    "error",
                    "Please enter a password."
                );

                return;

            }


            // Minimum password length
            if (password.length < 6) {

                showMessage(
                    signupError,
                    "error",
                    "Password must be at least 6 characters."
                );

                return;

            }


            // Check confirm password
            if (confirm === "") {

                showMessage(
                    signupError,
                    "error",
                    "Please confirm your password."
                );

                return;

            }


            // Check whether both passwords match
            if (password !== confirm) {

                showMessage(
                    signupError,
                    "error",
                    "Passwords do not match."
                );

                return;

            }


            // ==========================================
            // DISABLE BUTTON
            // ==========================================

            signupBtn.disabled = true;


            try {

                // Send data to Flask backend
                const response = await fetch("/auth/signup", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        username: fullName,

                        phone: phone,

                        email: email,

                        password: password,

                        confirm_password: confirm

                    })

                });


                // Parse JSON response
                const data = await response.json();


                // Successful response
                if (response.ok && data.success) {

                    showMessage(
                        signupError,
                        "success",
                        "✅ " + data.message
                    );


                    // Clear input fields
                    signupFullName.value = "";

                    signupPhone.value = "";

                    signupEmail.value = "";

                    signupPassword.value = "";

                    confirmPassword.value = "";


                } else {

                    // Error response
                    showMessage(
                        signupError,
                        "error",
                        data.message || "Signup failed."
                    );

                }


            } catch (err) {

                console.error("Signup error:", err);

                showMessage(
                    signupError,
                    "error",
                    "Could not reach the server. Please try again."
                );


            } finally {

                // Re-enable signup button
                signupBtn.disabled = false;

            }

        });

    }


    // ==================================================
    // GOOGLE LOGIN / SIGNUP
    // ==================================================

    function startGoogleLogin() {

        // Redirect browser to Flask Google OAuth route
        window.location.href = "/auth/google";

    }


    // LOGIN WITH GOOGLE
    if (loginGoogleBtn) {

        loginGoogleBtn.addEventListener(
            "click",
            startGoogleLogin
        );

    }


    // SIGNUP WITH GOOGLE
    if (signupGoogleBtn) {

        signupGoogleBtn.addEventListener(
            "click",
            startGoogleLogin
        );

    }

});


// ==================================================
// FORGOT PASSWORD POPUP ELEMENTS
// ==================================================

const forgotBtn =
    document.getElementById("forgotPasswordBtn");

const forgotOverlay =
    document.getElementById("forgotOverlay");

const forgotCard =
    document.getElementById("forgotCard");

const closeForgot =
    document.getElementById("closeForgot");

const sendReset =
    document.getElementById("sendReset");

const forgotEmail =
    document.getElementById("forgotEmail");

const forgotMessage =
    document.getElementById("forgotMessage");


// ==================================================
// OPEN FORGOT PASSWORD POPUP
// ==================================================

if (forgotBtn) {

    forgotBtn.addEventListener("click", function (e) {

        e.preventDefault();

        forgotOverlay.classList.add("active");

        forgotEmail.value = "";

        forgotMessage.innerHTML = "";

        forgotMessage.className = "forgot-message";

    });

}


// ==================================================
// CLOSE FORGOT PASSWORD POPUP
// ==================================================

function closeForgotPopup() {

    if (forgotOverlay) {

        forgotOverlay.classList.remove("active");

    }

}


// ==================================================
// CLOSE BUTTON
// ==================================================

if (closeForgot) {

    closeForgot.addEventListener(
        "click",
        closeForgotPopup
    );

}


// ==================================================
// CLOSE WHEN CLICKING OUTSIDE
// ==================================================

if (forgotOverlay) {

    forgotOverlay.addEventListener("click", function (e) {

        if (e.target === forgotOverlay) {

            closeForgotPopup();

        }

    });

}


// ==================================================
// CLOSE WITH ESC KEY
// ==================================================

document.addEventListener("keydown", function (e) {

    if (e.key === "Escape") {

        closeForgotPopup();

    }

});


// ==================================================
// EMAIL VALIDATION FUNCTION
// ==================================================

function isValidEmail(email) {

    return /^o2[1-6]\d+@rguktong\.ac\.in$/i.test(email);

}


// ==================================================
// SEND PASSWORD RESET LINK
// ==================================================

if (sendReset) {

    sendReset.addEventListener("click", async function () {

        const email = forgotEmail.value.trim();


        // Reset previous message
        forgotMessage.className = "forgot-message";

        forgotMessage.innerHTML = "";


        // ==============================================
        // CHECK EMPTY EMAIL
        // ==============================================

        if (email === "") {

            forgotMessage.classList.add("error");

            forgotMessage.innerHTML =
                "Please enter your email.";

            return;

        }


        // ==============================================
        // CHECK EMAIL FORMAT
        // ==============================================

        if (!isValidEmail(email)) {

            forgotMessage.classList.add("error");

            forgotMessage.innerHTML =
                "Please enter a valid email.";

            return;

        }


        // ==============================================
        // DISABLE BUTTON
        // ==============================================

        sendReset.disabled = true;


        try {

            // ==========================================
            // SEND EMAIL TO FLASK
            // ==========================================

            const response = await fetch(
                "/auth/forgot-password",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        email: email

                    })

                }
            );


            // Convert response to JavaScript object
            const data = await response.json();


            // ==========================================
            // SUCCESS
            // ==========================================

            if (response.ok && data.success) {

                forgotMessage.className =
                    "forgot-message success";

                forgotMessage.innerHTML =
                    "✅ " + data.message;


                // Clear email field
                forgotEmail.value = "";


                // Close popup after 2.5 seconds
                setTimeout(() => {

                    closeForgotPopup();

                }, 2500);


            } else {

                // ======================================
                // BACKEND ERROR
                // ======================================

                forgotMessage.className =
                    "forgot-message error";

                forgotMessage.innerHTML =
                    data.message ||
                    "Could not send reset link.";

            }


        } catch (error) {

            console.error(
                "Forgot password error:",
                error
            );


            forgotMessage.className =
                "forgot-message error";

            forgotMessage.innerHTML =
                "Could not reach the server. Please try again.";


        } finally {

            // Re-enable button
            sendReset.disabled = false;

        }

    });

}


// ==================================================
// FORM MESSAGE FUNCTIONS
// ==================================================

function showMessage(target, type, message) {

    // Remove existing classes and reset message box
    target.className = "form-message";


    // Add error or success class
    target.classList.add(type);


    // Make message visible
    target.classList.add("show");


    // Display message
    target.innerHTML = message;


    // Clear any previous hide timer
    clearTimeout(target.hideTimer);


    // Automatically hide message after 4 seconds
    target.hideTimer = setTimeout(function () {

        hideMessage(target);

    }, 4000);

}


// ==================================================
// HIDE MESSAGE
// ==================================================

function hideMessage(target) {

    target.classList.remove("show");

}