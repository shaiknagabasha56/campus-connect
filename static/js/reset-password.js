document.addEventListener("DOMContentLoaded", () => {

    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");

    const toggleNew = document.getElementById("toggleNew");
    const toggleConfirm = document.getElementById("toggleConfirm");

    const confirmBtn = document.getElementById("confirmBtn");
    const resetMessage = document.getElementById("resetMessage");


    /*==================================================
        SHOW / HIDE PASSWORD
    ==================================================*/

    function bindToggle(button, input) {

        button.addEventListener("click", () => {

            const isHidden = input.type === "password";

            input.type = isHidden ? "text" : "password";

            button.textContent = isHidden ? "HIDE" : "SHOW";

        });

    }

    bindToggle(toggleNew, newPassword);
    bindToggle(toggleConfirm, confirmPassword);


    /*==================================================
        MESSAGE HELPER
    ==================================================*/

    function showMessage(type, message) {

        resetMessage.className = "form-message";

        resetMessage.classList.add(type, "show");

        resetMessage.textContent = message;

        clearTimeout(resetMessage.hideTimer);

        resetMessage.hideTimer = setTimeout(() => {

            resetMessage.classList.remove("show");

        }, 4000);

    }


    /*==================================================
        RESET PASSWORD
    ==================================================*/

    confirmBtn.addEventListener("click", async () => {

        const password = newPassword.value.trim();

        const confirm_password = confirmPassword.value.trim();


        // CHECK EMPTY FIELDS
        if (!password || !confirm_password) {

            showMessage(
                "error",
                "Please fill in both fields."
            );

            return;

        }


        // CHECK PASSWORD LENGTH
        if (password.length < 6) {

            showMessage(
                "error",
                "Password must be at least 6 characters."
            );

            return;

        }


        // CHECK PASSWORD MATCH
        if (password !== confirm_password) {

            showMessage(
                "error",
                "Passwords do not match."
            );

            return;

        }


        // DISABLE BUTTON WHILE REQUEST IS PROCESSING
        confirmBtn.disabled = true;


        try {

            const response = await fetch(

                `/auth/reset-password/${resetToken}`,

                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        password: password,

                        confirm_password: confirm_password

                    })

                }

            );


            const data = await response.json();


            // PASSWORD RESET SUCCESS
            if (data.success) {

                showMessage(
                    "success",
                    data.message || "Password updated successfully."
                );


                // REDIRECT TO LOGIN AFTER SUCCESS
                setTimeout(() => {

                    window.location.href = "/auth/login";

                }, 1500);

            }

            // PASSWORD RESET FAILED
            else {

                showMessage(
                    "error",
                    data.message || "Could not update password."
                );

            }

        }

        catch (error) {

            console.error(
                "Reset password error:",
                error
            );

            showMessage(
                "error",
                "Could not reach the server. Please try again."
            );

        }

        finally {

            confirmBtn.disabled = false;

        }

    });

});