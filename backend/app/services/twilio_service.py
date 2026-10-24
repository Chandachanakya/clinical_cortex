"""
Twilio WhatsApp notification service for Clinical Cortex.
When MOCK_NOTIFICATIONS=True, messages are printed to console only (safe for dev).
When MOCK_NOTIFICATIONS=False, real WhatsApp messages are sent via Twilio Sandbox.
"""

import asyncio
from datetime import datetime
from app.config import settings


async def send_whatsapp_alert(
    to_phone: str,
    patient_name: str,
    risk_level: str,
    risk_type: str,
    risk_score: float,
    ward: str,
    bed: str,
    doctor_name: str = "Doctor",
) -> dict:
    """
    Send a WhatsApp alert message via Twilio.
    Returns a result dict with status and message SID (or mock info).
    """

    timestamp = datetime.now().strftime("%d %b %Y, %I:%M %p")

    risk_emoji = {
        "CRITICAL": "🚨",
        "HIGH": "🔴",
        "MEDIUM": "🟡",
        "LOW": "🟢",
    }.get(risk_level.upper(), "⚠️")

    message_body = (
        f"{risk_emoji} *CLINICAL CORTEX ALERT*\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 *Patient:* {patient_name}\n"
        f"🏥 *Location:* {ward} · Bed {bed}\n"
        f"⚠️ *Risk Level:* {risk_level}\n"
        f"🩺 *Alert Type:* {risk_type}\n"
        f"📊 *Risk Score:* {int(risk_score * 100)}%\n"
        f"🕐 *Time:* {timestamp}\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"Dear {doctor_name},\n"
        f"Immediate clinical review is recommended. "
        f"Please log in to Clinical Cortex for full details and SHAP explanation.\n\n"
        f"_This is an automated alert. Do not reply._"
    )

    if settings.MOCK_NOTIFICATIONS or not settings.TWILIO_ACCOUNT_SID or settings.TWILIO_ACCOUNT_SID.startswith("your-"):
        # Mock mode — print to console, safe for development
        print("\n" + "=" * 60)
        print("📱 [MOCK WhatsApp] Would send to:", to_phone)
        print("-" * 60)
        print(message_body)
        print("=" * 60 + "\n")
        return {
            "status": "mock_sent",
            "to": to_phone,
            "message": message_body,
            "sid": "MOCK_SID_DEMO_12345",
        }

    # Real Twilio send
    try:
        from twilio.rest import Client

        # Strip stray quotes that dotenv can include if value was quoted
        account_sid = settings.TWILIO_ACCOUNT_SID.strip("'\"")
        auth_token = settings.TWILIO_AUTH_TOKEN.strip("'\"")

        client = Client(account_sid, auth_token)

        # Twilio WhatsApp Sandbox number
        from_whatsapp = "whatsapp:+14155238886"
        to_whatsapp = f"whatsapp:{to_phone}" if not to_phone.startswith("whatsapp:") else to_phone

        print(f"[Twilio] Sending WhatsApp to {to_whatsapp} from {from_whatsapp}")
        msg = await asyncio.to_thread(
            client.messages.create,
            body=message_body,
            from_=from_whatsapp,
            to=to_whatsapp,
        )
        print(f"[Twilio] ✅ WhatsApp sent! SID: {msg.sid}, Status: {msg.status}")
        return {"status": "sent", "to": to_phone, "sid": msg.sid, "message": message_body}

    except Exception as e:
        error_msg = str(e)
        print(f"[Twilio] ❌ ERROR: {error_msg}")
        # Return the error so the frontend can display it
        return {"status": "error", "error": error_msg, "to": to_phone, "message": message_body}
