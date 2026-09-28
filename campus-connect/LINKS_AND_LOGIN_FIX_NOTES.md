# Links, login page and avatar fixes

1. Every "Home" link and logo now goes to the site home page (/homepage/home).
   Before: ../index.html (404), "#" (does nothing), or the section hub page.
2. Section links fixed: Academic, Non-Academic, Clubs & Cells -> their real pages;
   footer "Contact" -> the Contact section on the same page.
3. templates/admin/emergency/emergency_admin.html: the file was saved as " emergency_admin.html"
   (leading space), so /emergency/admin/ could not find it. DELETE the old file with the space in its name.
   routes/emergency.py: that page is now admin-only (app.py's admin check skips URLs ending in "/admin/").
4. static/js/emergency_admin.js: logout used GET /logout (404); now POSTs to /auth/logout.
5. Login page: new stacked phone/tablet layout (bottom of login.css); login/sign-up swap without the
   3D flip on small screens; needless <a> wrappers around buttons removed (login.html).
6. Profile avatar in the top bar is a true circle (homepage.css).
7. Phones: the Admin pill moved into the hamburger menu (mobile.css, mobile-nav.js).
