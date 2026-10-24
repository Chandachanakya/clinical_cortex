from typing import Dict, Optional
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
from app.config import settings

class NotificationService:
    """Handle email and SMS notifications"""
    
    def __init__(self):
        self.twilio_client = None
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.twilio_client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
    
    async def send_email(self, to: str, subject: str, body: str) -> bool:
        """Send email notification"""
        if settings.MOCK_NOTIFICATIONS:
            print(f"[MOCK EMAIL] To: {to}, Subject: {subject}")
            print(f"Body: {body[:200]}...")
            return True
        
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            print("SMTP credentials not configured")
            return False
        
        try:
            message = MIMEMultipart()
            message["From"] = settings.EMAIL_FROM
            message["To"] = to
            message["Subject"] = subject
            message.attach(MIMEText(body, "plain"))
            
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=True
            )
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    async def send_sms(self, to: str, message: str) -> bool:
        """Send SMS notification"""
        if settings.MOCK_NOTIFICATIONS:
            print(f"[MOCK SMS] To: {to}, Message: {message[:100]}...")
            return True
        
        if not self.twilio_client or not settings.TWILIO_PHONE_NUMBER:
            print("Twilio not configured")
            return False
        
        try:
            self.twilio_client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=to
            )
            return True
        except Exception as e:
            print(f"Error sending SMS: {e}")
            return False
    
    async def send_alert_notification(self, alert_data: Dict, recipient_email: str, 
                                      recipient_phone: Optional[str] = None):
        """Send alert notification via email and optionally SMS"""
        risk_level = alert_data.get("explanation", {}).get("risk_level", "UNKNOWN")
        risk_type = alert_data.get("explanation", {}).get("risk_type", "Unknown Risk")
        
        subject = f"🚨 Clinical Alert: {risk_type} - {risk_level} RISK"
        body = f"""
Clinical Risk Alert

Risk Type: {risk_type}
Risk Level: {risk_level}
Encounter ID: {alert_data.get('encounter_id', 'N/A')}

{alert_data.get('explanation', {}).get('explanation_text', 'No explanation available')}

Please review the patient immediately.

This is an automated alert from the Clinical Risk Monitoring System.
        """
        
        await self.send_email(recipient_email, subject, body)
        
        if recipient_phone:
            sms_message = f"ALERT: {risk_type} - {risk_level} risk. Encounter {alert_data.get('encounter_id')}. Review immediately."
            await self.send_sms(recipient_phone, sms_message)
