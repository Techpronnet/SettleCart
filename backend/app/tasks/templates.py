"""
Notification message & email templates for SettleCart Marketplace.
Supports responsive HTML emails, plain-text email fallbacks, and concise SMS copy.
"""

from typing import Any, Optional

def get_base_html_layout(title: str, content: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px; color: #1c1917; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e7e5e4; }}
    .header {{ background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff; }}
    .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }}
    .body {{ padding: 28px 24px; font-size: 15px; line-height: 1.6; color: #292524; }}
    .badge {{ display: inline-block; padding: 6px 12px; background: #f5f5f4; border-radius: 6px; font-size: 14px; font-weight: 600; color: #44403c; }}
    .otp-box {{ background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }}
    .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #15803d; }}
    .footer {{ padding: 20px; font-size: 12px; text-align: center; color: #78716c; background: #fafaf9; border-top: 1px solid #f5f5f4; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SettleCart</h1>
    </div>
    <div class="body">
      {content}
    </div>
    <div class="footer">
      &copy; SettleCart Marketplace Platform. All rights reserved.<br>
      This is an automated operational notification.
    </div>
  </div>
</body>
</html>"""


def order_confirmed_template(customer_name: str, order_number: str, total_amount: float) -> dict[str, str]:
    subject = f"Order Confirmed: #{order_number}"
    sms = f"SettleCart: Order #{order_number} confirmed for ₦{total_amount:,.2f}. Stores are preparing your items!"
    content = f"""
    <h2>Thank You for Your Order, {customer_name}!</h2>
    <p>Your payment has been confirmed and order <strong>#{order_number}</strong> is being processed.</p>
    <p><strong>Total Amount:</strong> ₦{total_amount:,.2f}</p>
    <p>Our merchant vendors have been notified to start preparing your items. You will receive real-time updates as your delivery progresses.</p>
    """
    return {"subject": subject, "html": get_base_html_layout(subject, content), "sms": sms}


def vendor_order_template(store_name: str, order_number: str, subtotal: float) -> dict[str, str]:
    subject = f"New Order Received: #{order_number} - {store_name}"
    sms = f"SettleCart: New order #{order_number} for {store_name} (₦{subtotal:,.2f}). Log in to accept and prepare."
    content = f"""
    <h2>New Order Alert!</h2>
    <p>Your store <strong>{store_name}</strong> has received a new order: <strong>#{order_number}</strong>.</p>
    <p><strong>Package Subtotal:</strong> ₦{subtotal:,.2f}</p>
    <p>Please log into your SettleCart Merchant Portal to accept the order and begin preparation.</p>
    """
    return {"subject": subject, "html": get_base_html_layout(subject, content), "sms": sms}


def delivery_otp_template(customer_name: str, order_number: str, otp_code: str, store_name: Optional[str] = None) -> dict[str, str]:
    subject = f"Delivery Verification Code for Order #{order_number}"
    sms = f"SettleCart: Your handover code for Order #{order_number} is {otp_code}. Do NOT share until rider arrives with package."
    store_info = f" from <strong>{store_name}</strong>" if store_name else ""
    content = f"""
    <h2>Secure Handover Verification Code</h2>
    <p>Hello {customer_name},</p>
    <p>Your package{store_info} for order <strong>#{order_number}</strong> is in transit!</p>
    <p>Please share this secure 6-digit verification code with your dispatch rider <strong>only after</strong> you have inspected and received your package:</p>
    <div class="otp-box">
      <div class="otp-code">{otp_code}</div>
    </div>
    <p style="color: #dc2626; font-size: 13px;"><strong>Security Alert:</strong> Never share this code over the phone or before receiving physical custody of your goods.</p>
    """
    return {"subject": subject, "html": get_base_html_layout(subject, content), "sms": sms}


def rider_assigned_template(rider_name: str, order_number: str, pickup_address: str, dropoff_address: str, earnings: float) -> dict[str, str]:
    subject = f"Delivery Assignment: Order #{order_number}"
    sms = f"SettleCart: Delivery task assigned for Order #{order_number}. Pickup: {pickup_address}. Earnings: ₦{earnings:,.2f}."
    content = f"""
    <h2>New Delivery Assignment</h2>
    <p>Hello {rider_name},</p>
    <p>You have been assigned to deliver order <strong>#{order_number}</strong>.</p>
    <p><strong>Pickup Address:</strong> {pickup_address}</p>
    <p><strong>Dropoff Address:</strong> {dropoff_address}</p>
    <p><strong>Estimated Dispatch Earnings:</strong> ₦{earnings:,.2f}</p>
    <p>Please navigate to the vendor store, confirm package pickup, and collect the customer's 6-digit OTP code at destination to complete the delivery.</p>
    """
    return {"subject": subject, "html": get_base_html_layout(subject, content), "sms": sms}


def delivery_completed_template(customer_name: str, order_number: str) -> dict[str, str]:
    subject = f"Order #{order_number} Delivered!"
    sms = f"SettleCart: Order #{order_number} delivered successfully. Thank you for shopping with us!"
    content = f"""
    <h2>Your Order Has Been Delivered!</h2>
    <p>Hello {customer_name},</p>
    <p>Order <strong>#{order_number}</strong> has been successfully verified and delivered by your dispatch rider.</p>
    <p>We hope you enjoy your purchase! You can view your order history or leave a review anytime in your SettleCart account.</p>
    """
    return {"subject": subject, "html": get_base_html_layout(subject, content), "sms": sms}


def settlement_credited_template(recipient_name: str, amount: float, reference: str, account_role: str) -> dict[str, str]:
    subject = f"Wallet Credited: ₦{amount:,.2f} (Ref: {reference})"
    sms = f"SettleCart: Your wallet has been credited with ₦{amount:,.2f} for order {reference}. Available for withdrawal."
    content = f"""
    <h2>Settlement Credit Notification</h2>
    <p>Hello {recipient_name},</p>
    <p>Your SettleCart {account_role} wallet has been credited following completed delivery and automated settlement:</p>
    <p><strong>Amount Credited:</strong> ₦{amount:,.2f}</p>
    <p><strong>Settlement Reference:</strong> {reference}</p>
    <p>These funds have been added to your available ledger balance and are eligible for withdrawal to your verified Nigerian bank account.</p>
    """
    return {"subject": subject, "html": get_base_html_layout(subject, content), "sms": sms}


def kyc_status_template(business_name: str, status: str, notes: Optional[str] = None) -> dict[str, str]:
    subject = f"KYC Verification Update: {status.upper()} - {business_name}"
    sms = f"SettleCart: KYC verification for {business_name} status is now {status.upper()}."
    notes_html = f"<p><strong>Administrator Notes:</strong> {notes}</p>" if notes else ""
    content = f"""
    <h2>Business Verification Status Update</h2>
    <p>The compliance review for <strong>{business_name}</strong> has been updated to:</p>
    <div style="font-size: 18px; font-weight: bold; margin: 10px 0; color: #2563eb;">{status.upper()}</div>
    {notes_html}
    <p>Log into your merchant dashboard for next steps and platform store activation.</p>
    """
    return {"subject": subject, "html": get_base_html_layout(subject, content), "sms": sms}


def withdrawal_reviewed_template(user_name: str, amount: float, status: str, reason: Optional[str] = None) -> dict[str, str]:
    subject = f"Withdrawal Request {status.upper()}: ₦{amount:,.2f}"
    sms = f"SettleCart: Withdrawal request for ₦{amount:,.2f} has been {status.upper()}."
    reason_html = f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""
    content = f"""
    <h2>Withdrawal Request Update</h2>
    <p>Hello {user_name},</p>
    <p>Your withdrawal request for <strong>₦{amount:,.2f}</strong> has been <strong>{status.upper()}</strong>.</p>
    {reason_html}
    <p>If approved, bank disbursements typically arrive within minutes to standard Nigerian NIP commercial banks.</p>
    """
    return {"subject": subject, "html": get_base_html_layout(subject, content), "sms": sms}

