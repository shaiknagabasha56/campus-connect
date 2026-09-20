# Mobile layout fix

Unzip over your project (same folder structure). Nothing was deleted.

New files
- static/css/mobile.css   shared phone styles (loaded last on every page with a top bar)
- static/js/mobile-nav.js builds a hamburger menu from each page's existing nav links

Edited files
- 61 templates: added the mobile.css / mobile-nav.js tags just before </head>
- templates/auth/reset-password.html: was a bare fragment with no <head>, so no viewport tag
- static/css/homepage.css: phone-only rules appended at the end (inside @media (max-width:600px))

Why it looked bad: below 900px the CSS hid the nav links (.na-nav-simple a / nav.main-nav)
with no replacement, and the homepage top bar, hero, footer and chat panel used fixed widths/heights.
