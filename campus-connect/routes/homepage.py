from flask import Blueprint, render_template

from database.queries import (
    get_homepage_announcements,
    get_all_college_updates
)


homepage_bp = Blueprint(
    "homepage",
    __name__,
    url_prefix="/homepage"
)


@homepage_bp.route("/home")
def homepage():

    # --------------------------------------------------
    # LATEST ANNOUNCEMENT CARDS
    # --------------------------------------------------

    all_announcements = get_homepage_announcements()

    academic = []
    non_academic = []
    clubs = []
    cells = []

    for announcement in all_announcements:

        category = announcement.get(
            "organization_category"
        )

        if category == "academic":
            academic.append(announcement)

        elif category == "non_academic":
            non_academic.append(announcement)

        elif category == "club":
            clubs.append(announcement)

        elif category == "cell":
            cells.append(announcement)


    # --------------------------------------------------
    # ALL COLLEGE UPDATES
    # --------------------------------------------------

    college_updates = get_all_college_updates()


    return render_template(
        "home/homepage.html",

        academic=academic,
        non_academic=non_academic,
        clubs=clubs,
        cells=cells,

        college_updates=college_updates
    )