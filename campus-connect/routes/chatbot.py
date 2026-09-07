import os
import re
from flask import Blueprint, request, jsonify, session
from database.queries import (
    get_all_organizations,
    get_active_emergency_notices,
    get_all_complaints
)

chatbot_bp = Blueprint(
    "chatbot",
    __name__,
    url_prefix="/api/chatbot"
)


# ==================================================
# KNOWLEDGE BASE QUERY MATCHER
# ==================================================
def match_campus_knowledge(user_query):
    q = user_query.lower().strip()

    # 1. CLUBS
    if any(k in q for k in ["club", "artix", "techxcel", "aws", "icro", "khelsaathi", "kaladharani", "sarvasrijana", "pixelro"]):
        if "artix" in q:
            return "🎨 **Artix Club** is the fine arts and creative design club of RGUKT. You can view their latest events and apply to join from the Clubs section!"
        elif "techxcel" in q:
            return "💻 **TechXcel Club** is the technical coding and engineering club. Check out their hackathons and tech quizzes under Clubs!"
        elif "aws" in q:
            return "☁️ **AWS Student Club** focuses on Cloud Computing, DevOps, and cloud certifications."
        elif "pixelro" in q:
            return "📸 **Pixelro Club** is the official photography and media club of RGUKT."
        else:
            return "🏛️ Campus Connect features 8 vibrant clubs: **Artix**, **TechXcel**, **AWS**, **ICRO**, **KhelSaathi**, **Kaladharani**, **Sarvasrijana**, and **Pixelro**. Visit the /clubs section to explore!"

    # 2. CELLS
    if any(k in q for k in ["cell", "ecell", "e-cell", "cdpc", "hec", "placement", "career", "entrepreneur"]):
        if "ecell" in q or "e-cell" in q:
            return "🚀 **E-Cell** (Entrepreneurship Cell) conducts workshops, startup pitches, and founder mentorship sessions."
        elif "cdpc" in q or "placement" in q:
            return "💼 **CDPC** (Career Development & Placement Cell) coordinates campus recruitments, internships, and resume building."
        elif "hec" in q:
            return "🎓 **HEC** (Higher Education Cell) guides students for GATE, GRE, CAT, and higher studies."
        else:
            return "🤝 Campus Cells include **E-Cell**, **CDPC**, and **HEC**. You can check their announcements under /cells!"

    # 3. ACADEMICS
    if any(k in q for k in ["academic", "dept", "department", "cse", "ece", "civil", "mech", "eee", "metallurgy", "chemical", "ai-ml", "exam"]):
        return "📚 Academic Departments on Campus Connect: **CSE**, **ECE**, **EEE**, **Civil**, **Mechanical**, **Metallurgy**, **Chemical**, and **AI & ML**. Check department updates under /academic!"

    # 4. SERVICES / NON-ACADEMIC
    if any(k in q for k in ["canteen", "hostel", "mess", "hospital", "store", "infra", "scholarship", "financial", "fee"]):
        if "mess" in q or "canteen" in q:
            return "🍲 Mess and Canteen services post daily menus, operating hours, and notices under the Non-Academic section."
        elif "hostel" in q:
            return "🏢 Hostel info, maintenance requests, and hall warden notices are available under Non-Academic -> Hostel."
        elif "hospital" in q or "doctor" in q:
            return "🏥 The Campus Hospital desk provides medical emergency assistance and health center updates."
        else:
            return "🏫 Non-academic campus services include: **Mess**, **Canteen**, **Store**, **Hostel**, **IT Infra**, **Hospital**, **Scholarship Office**, and **Financial Office**."

    # 5. COMPLAINTS
    if any(k in q for k in ["complaint", "issue", "problem", "report", "water", "grievance"]):
        return "⚠️ To raise a complaint: Navigate to the **Complaints** section from the top navbar. You can submit both Normal and Anonymous complaints. You can track your complaint status in real-time as admins review it!"

    # 6. HOW TO APPLY / JOIN
    if any(k in q for k in ["apply", "join", "registration", "how to join"]):
        return "📝 To apply for a club, cell, or event: Open the relevant club page or announcement modal and click **Apply Now**. Your application will be reviewed directly by the organization admin!"

    # 7. EMERGENCY
    if any(k in q for k in ["emergency", "blood", "helpline", "urgent"]):
        return "🚨 For immediate campus emergencies, visit the **Emergency** ticker at the top of the homepage or click the Emergency tab to reach support numbers."

    # 8. GENERAL GREETING / HELP
    if any(k in q for k in ["hi", "hello", "hey", "help", "who are you"]):
        user_name = session.get("username", "Student")
        return f"Hello {user_name}! 👋 I am **Campus Connect AI Assistant**. I can help you with questions about clubs, cells, academic departments, complaints, applications, and campus services. What would you like to know?"

    return "I am here to help with Campus Connect! Ask me about **clubs**, **cells**, **academic departments**, **non-academic services**, **complaints**, or **how to apply** to campus activities."


# ==================================================
# CHATBOT API ENDPOINT
# ==================================================
@chatbot_bp.route("/message", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"success": False, "message": "Please enter a query."}), 400

    # Optional external LLM API support via environment variables
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
    bot_reply = None

    if api_key and os.getenv("USE_EXTERNAL_AI", "false").lower() == "true":
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"You are Campus Connect Assistant for RGUKT college portal. Answer concisely: {message}"
            response = model.generate_content(prompt)
            bot_reply = response.text
        except Exception as e:
            print("External AI Error:", e)

    # Fallback to campus knowledge engine
    if not bot_reply:
        bot_reply = match_campus_knowledge(message)

    return jsonify({
        "success": True,
        "reply": bot_reply
    })
