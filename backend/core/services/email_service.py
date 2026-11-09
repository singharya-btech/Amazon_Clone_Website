import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def send_verification_email(email, username, token):
    """
    Sends email verification token link.
    """
    subject = "Verify your AmazonClone Account"
    verification_url = f"http://localhost:3001/verify-email?token={token}&email={email}"
    message = (
        f"Hi {username},\n\n"
        f"Welcome to AmazonClone! Please verify your email address to activate all account features.\n\n"
        f"Click the link below or copy your verification code:\n"
        f"{verification_url}\n\n"
        f"Verification Token: {token}\n\n"
        f"This link expires in 24 hours.\n\n"
        f"Thanks,\nThe AmazonClone Team"
    )
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@amazonclone.local')
    try:
        send_mail(subject, message, from_email, [email], fail_silently=True)
        logger.info(f"Verification email sent to {email}")
        return True
    except Exception as e:
        logger.warning(f"Failed to send verification email to {email}: {e}")
        return False


def send_password_reset_email(email, username, token):
    """
    Sends password reset token link.
    """
    subject = "Reset your AmazonClone Password"
    reset_url = f"http://localhost:3001/reset-password?token={token}"
    message = (
        f"Hi {username},\n\n"
        f"We received a request to reset your AmazonClone password.\n\n"
        f"Use the link below to set a new password:\n"
        f"{reset_url}\n\n"
        f"Reset Token: {token}\n\n"
        f"This code will expire in 2 hours. If you did not request this, please ignore this email.\n\n"
        f"Thanks,\nThe AmazonClone Team"
    )
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@amazonclone.local')
    try:
        send_mail(subject, message, from_email, [email], fail_silently=True)
        logger.info(f"Password reset email sent to {email}")
        return True
    except Exception as e:
        logger.warning(f"Failed to send password reset email to {email}: {e}")
        return False


def send_order_notification_email(email, username, order_id, total, status_text):
    """
    Sends transactional order status email.
    """
    subject = f"Order #{order_id} Update: {status_text.capitalize()}"
    message = (
        f"Hi {username},\n\n"
        f"Your order #{order_id} has an update: status is now '{status_text}'.\n"
        f"Total Amount: ₹{total:.2f}\n\n"
        f"View your order details at: http://localhost:3001/orders\n\n"
        f"Thank you for shopping with us!\nThe AmazonClone Team"
    )
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@amazonclone.local')
    try:
        send_mail(subject, message, from_email, [email], fail_silently=True)
        logger.info(f"Order email sent for #{order_id} to {email}")
        return True
    except Exception as e:
        logger.warning(f"Failed to send order email for #{order_id}: {e}")
        return False
