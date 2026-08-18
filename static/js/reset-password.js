document.addEventListener("DOMContentLoaded", () => {

    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");

    const toggleNew = document.getElementById("toggleNew");
    const toggleConfirm = document.getElementById("toggleConfirm");

    const confirmBtn = document.getElementById("confirmBtn");
    const resetMessage = document.getElementById("resetMessage");

    /*==================================================
        SHOW / HIDE TOGGLES
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
        resetMessage.innerHTML = message;

        clearTimeout(resetMessage.hideTimer);

        resetMessage.hideTimer = setTimeout(() => {
            resetMessage.classList.remove("show");
        }, 4000);

    }

    /*==================================================
        CONFIRM
        Wire this fetch call to your actual endpoint,
        e.g. POST /api/reset-password with { password }
        (plus a token if you're using the emailed-link flow).
    ==================================================*/

    confirmBtn.addEventListener("click", async () => {

        const pass = newPassword.value.trim();
        const confirm = confirmPassword.value.trim();

        if (pass === "" || confirm === "") {
            showMessage("error", "Please fill in both fields.");
            return;
        }

        if (pass.length < 8) {
            showMessage("error", "Password must be at least 8 characters.");
            return;
        }

        if (pass !== confirm) {
            showMessage("error", "Passwords do not match.");
            return;
        }

        confirmBtn.disabled = true;

        try {

            const response = await fetch("/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: pass })
            });

            const data = await response.json();

            if (data.success) {
                showMessage("success", "Password updated successfully.");
            } else {
                showMessage("error", data.message || "Could not update password.");
            }

        } catch (err) {

            showMessage("error", "Could not reach the server. Please try again.");

        } finally {

            confirmBtn.disabled = false;

        }

    });

});
