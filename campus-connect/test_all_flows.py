import sys
from app import createApp
from database.db import get_db_connection

app = createApp()
client = app.test_client()

print("=" * 60)
print("STARTING COMPLETE END-TO-END SYSTEM INTEGRATION TEST")
print("=" * 60)

# 1. TEST LANDING PAGE
res = client.get("/")
assert res.status_code == 200
print("✓ Landing page loads cleanly (200 OK)")

# 2. TEST LOGIN - STUDENT
res = client.post("/auth/login", json={
    "email": "student@rguktong.ac.in",
    "password": "password123"
})
data = res.get_json()
assert res.status_code == 200 and data.get("success") == True
print("✓ Student Login Successful")

# 3. TEST PROFILE
res = client.get("/auth/profile")
data = res.get_json()
assert data.get("success") == True and data["user"]["username"] == "StudentUser"
print(f"✓ Profile retrieved: {data['user']['username']} ({data['user']['email']})")

# 4. TEST COMPLAINT SUBMISSION (Student)
res = client.post("/complaints/submit", data={
    "title": "Need new art supplies for Artix event",
    "category": "Clubs & Cells",
    "priority": "High",
    "description": "Artix club room requires additional canvas and paint supplies.",
    "name": "StudentUser",
    "roll": "N200123",
    "phone": "9876543210"
})
data = res.get_json()
assert res.status_code == 201 and data.get("success") == True
ref_id = data["reference_id"]
print(f"✓ Student submitted complaint: Ref {ref_id}")

# 5. TEST GET MY COMPLAINTS
res = client.get("/complaints/list")
data = res.get_json()
assert data.get("success") == True and len(data["complaints"]) > 0
print(f"✓ Student retrieved {len(data['complaints'])} submitted complaints")

# 6. TEST APPLY TO CLUB (Student)
res = client.post("/applications/apply", json={
    "organization_slug": "artix",
    "reason": "Interested in joining fine arts committee."
})
data = res.get_json()
assert res.status_code == 201 and data.get("success") == True
app_id = data["application_id"]
app_ref_id = data["reference_id"]
print(f"✓ Student applied to Artix Club: Ref {app_ref_id} (ID: {app_id})")

# 7. TEST CHATBOT
res = client.post("/api/chatbot/message", json={
    "message": "tell me about artix club and how to complain"
})
data = res.get_json()
assert data.get("success") == True and "Artix" in data["reply"]
print("✓ Chatbot returned intelligent campus response")

# 8. TEST EMERGENCY NOTICES
res = client.get("/emergency/notices")
data = res.get_json()
assert data.get("success") == True and len(data["notices"]) > 0
print(f"✓ Emergency notices retrieved: {len(data['notices'])} active notices")

# 9. TEST LOGIN - ARTIX ADMIN
client.post("/auth/logout")
res = client.post("/auth/login", json={
    "email": "artixadmin@rguktong.ac.in",
    "password": "password123"
})
data = res.get_json()
assert res.status_code == 200 and data.get("success") == True
print("✓ Artix Admin Login Successful")

# 10. TEST ADMIN COMPLAINTS LIST
res = client.get("/complaints/admin/list")
data = res.get_json()
assert data.get("success") == True and len(data["complaints"]) > 0
print(f"✓ Artix Admin fetched {len(data['complaints'])} organization complaints")

# 11. TEST ADMIN UPDATE COMPLAINT STATUS
res = client.post("/complaints/admin/update-status", json={
    "id": ref_id,
    "status": "in-progress",
    "admin_reply": "Artix executive committee approved request. Supplies ordered."
})
data = res.get_json()
assert data.get("success") == True
print(f"✓ Admin updated complaint status to 'in-progress' with admin reply")

# 12. TEST ADMIN MANAGE APPLICATIONS
res = client.get("/applications/organization/artix")
data = res.get_json()
assert data.get("success") == True and len(data["applications"]) > 0
print(f"✓ Artix Admin fetched {len(data['applications'])} pending applications")

res = client.post(f"/applications/{app_id}/update-status", json={
    "status": "approved",
    "admin_notes": "Welcome to Artix Club!"
})
data = res.get_json()
assert data.get("success") == True
print("✓ Artix Admin approved student club application")

# 13. TEST ADMIN AUTHORIZATION SECURITY
# Artix Admin trying to access Pixelro Admin panel should be 403 Forbidden
res = client.get("/clubs/pixelro/admin")
assert res.status_code == 403
print("✓ SECURITY VERIFIED: Artix Admin denied access to Pixelro Admin panel (403 Forbidden)")

# 14. TEST SUPER ADMIN LOGIN & ELEVATION
client.post("/auth/logout")
res = client.post("/auth/login", json={
    "email": "superadmin@rguktong.ac.in",
    "password": "password123"
})
data = res.get_json()
assert res.status_code == 200 and data.get("user")["role"] == "super_admin"
print("✓ Super Admin Login Successful")

# 15. TEST SUPER ADMIN USERS LIST & STATS
res = client.get("/superadmin/stats")
data = res.get_json()
assert data.get("success") == True
print(f"✓ Super Admin Stats: {data['stats']}")

print("=" * 60)
print("ALL SYSTEM INTEGRATION TESTS PASSED 100% SUCCESSFULLY!")
print("=" * 60)

