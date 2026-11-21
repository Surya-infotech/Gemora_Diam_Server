const nodemailer = require("nodemailer");

/**
 * Creates and returns a configured Nodemailer transporter.
 */
const getTransporter = () => {
    const host = process.env.EMAIL_HOST || "smtp.gmail.com";
    const port = Number(process.env.EMAIL_PORT) || 465;
    const secure = process.env.EMAIL_SECURE === "true" || port === 465;
    const user = process.env.EMAIL_USER || "gemoradiamofficial@gmail.com";
    // Strip any accidental spaces from the Google App Password
    const pass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
    });
};

const getAdminEmail = () => {
    return process.env.ADMIN_NOTIFICATION_EMAIL || "gemoradiamofficial@gmail.com";
};

const getSenderHeader = () => {
    const user = process.env.EMAIL_USER || "gemoradiamofficial@gmail.com";
    return `"Gemora Diam Atelier" <${user}>`;
};

// Common Email Container Wrapper
const wrapEmailTemplate = ({ title, preheader, contentHtml }) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #0d0f12;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #e5e7eb;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 620px;
            margin: 30px auto;
            background-color: #161a22;
            border-radius: 12px;
            border: 1px solid #2d333f;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }
        .header {
            background: linear-gradient(135deg, #1f242e 0%, #11141a 100%);
            padding: 30px 24px 20px;
            text-align: center;
            border-bottom: 1px solid #2d333f;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: #d4af37; /* Atelier Gold */
            font-weight: 600;
        }
        .header p {
            margin: 6px 0 0;
            font-size: 13px;
            color: #9ca3af;
            letter-spacing: 1px;
        }
        .content {
            padding: 28px 24px;
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .badge-gold {
            background-color: rgba(212, 175, 55, 0.15);
            color: #d4af37;
            border: 1px solid rgba(212, 175, 55, 0.3);
        }
        .badge-green {
            background-color: rgba(16, 185, 129, 0.15);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .card {
            background-color: #1c212c;
            border: 1px solid #2a3140;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        .data-table td {
            padding: 8px 4px;
            border-bottom: 1px solid #252b38;
        }
        .data-table tr:last-child td {
            border-bottom: none;
        }
        .label {
            color: #9ca3af;
            font-weight: 500;
            width: 35%;
        }
        .value {
            color: #f3f4f6;
            font-weight: 500;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 13px;
        }
        .items-table th {
            text-align: left;
            padding: 10px 8px;
            color: #9ca3af;
            font-size: 11px;
            text-transform: uppercase;
            border-bottom: 1px solid #2d333f;
        }
        .items-table td {
            padding: 12px 8px;
            border-bottom: 1px solid #232936;
            vertical-align: middle;
        }
        .footer {
            background-color: #11141a;
            padding: 18px 24px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #232936;
        }
    </style>
</head>
<body>
    <span style="display:none;font-size:0px;line-height:0px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
        ${preheader || title}
    </span>
    <div class="container">
        <div class="header">
            <h1>GEMORA DIAM</h1>
            <p>ATELIER LUXURY MANAGEMENT</p>
        </div>
        <div class="content">
            ${contentHtml}
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Gemora Diam Atelier. Automated System Notification.<br/>
            Delivered directly to: <strong>${getAdminEmail()}</strong>
        </div>
    </div>
</body>
</html>
    `.trim();
};

/**
 * Sends an email notification when a new order is placed in the database.
 * @param {Object} order - The saved order document from MongoDB
 */
const sendOrderNotificationEmail = async (order) => {
    try {
        if (!order) return;

        const transporter = getTransporter();
        const adminEmail = getAdminEmail();
        const orderNum = order.ordernumber || order.orderid || "N/A";
        const symbol = order.currencydetails?.currencysymbol || "$";
        const currency = order.currencydetails?.currency || "USD";
        const totalAmount = `${symbol}${Number(order.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

        // Build items rows
        const itemsHtml = (order.items || []).map((item, index) => {
            const specs = [
                item.stonename,
                item.metalname,
                item.diamondsize,
                item.shapename,
                item.clarityname,
                item.diamondcolor,
                item.bandcolor
            ].filter(Boolean).join(" • ");

            return `
                <tr>
                    <td style="width: 35px; text-align: center; color: #9ca3af; font-size: 13px; font-weight: 600; vertical-align: middle;">
                        ${index + 1}
                    </td>
                    <td style="vertical-align: middle;">
                        <table style="border-collapse: collapse; border: none; margin: 0; padding: 0;">
                            <tr>
                                ${item.image ? `
                                <td style="padding: 0 12px 0 0; vertical-align: middle; border: none;">
                                    <img src="${item.image}" alt="" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover; border: 1px solid #374151; display: block;" />
                                </td>` : ""}
                                <td style="vertical-align: middle; border: none; padding: 0;">
                                    <strong style="color: #f9fafb; font-size: 13px;">${item.itemname || "Jewelry Item"}</strong>
                                    ${specs ? `<br/><span style="font-size: 11px; color: #9ca3af;">${specs}</span>` : ""}
                                    ${item.specialinstruction ? `<br/><span style="font-size: 11px; color: #d4af37;">Note: ${item.specialinstruction}</span>` : ""}
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td style="text-align: center; color: #e5e7eb; vertical-align: middle; width: 50px;">${item.qty || 1}</td>
                    <td style="text-align: right; color: #f3f4f6; font-weight: 600; vertical-align: middle; width: 90px;">
                        ${symbol}${Number(item.totalprice || item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                </tr>
            `;
        }).join("");

        const address = order.shippingaddress || {};
        const fullAddress = [
            address.address,
            address.cityname,
            address.statename,
            address.countryname,
            address.pincode
        ].filter(Boolean).join(", ");

        const contentHtml = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2 style="margin: 0; font-size: 18px; color: #f9fafb;">🎉 New Order Received!</h2>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #9ca3af;">Order <strong>#${orderNum}</strong> has been successfully placed.</p>
                </div>
                <div>
                    <span class="badge badge-gold">${order.orderstatus || "Confirmed"}</span>
                </div>
            </div>

            <div class="card">
                <table class="data-table">
                    <tr>
                        <td class="label">Customer Name:</td>
                        <td class="value"><strong>${order.customername || "Guest Customer"}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Customer Email:</td>
                        <td class="value"><a href="mailto:${order.customeremail}" style="color: #60a5fa; text-decoration: none;">${order.customeremail || "N/A"}</a></td>
                    </tr>
                    <tr>
                        <td class="label">Customer Phone:</td>
                        <td class="value">${order.customerphone || "N/A"}</td>
                    </tr>
                    <tr>
                        <td class="label">Shipping Address:</td>
                        <td class="value">${fullAddress || "N/A"}</td>
                    </tr>
                    <tr>
                        <td class="label">Payment Method:</td>
                        <td class="value">${order.paymentmethod || "N/A"} (${order.paymentstatus || "Paid"})</td>
                    </tr>
                    ${order.transactionid ? `
                    <tr>
                        <td class="label">Transaction ID:</td>
                        <td class="value" style="font-family: monospace; font-size: 12px; color: #d4af37;">${order.transactionid}</td>
                    </tr>` : ""}
                    <tr>
                        <td class="label">Placed On:</td>
                        <td class="value">${new Date(order.createdAt || Date.now()).toLocaleString()}</td>
                    </tr>
                </table>
            </div>

            <h3 style="margin: 20px 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #d4af37;">Order Items</h3>
            <div class="card" style="padding: 8px 14px;">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 35px; text-align: center;">#</th>
                            <th>Description</th>
                            <th style="text-align: center; width: 50px;">Qty</th>
                            <th style="text-align: right; width: 90px;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <div style="border-top: 1px solid #2d333f; margin-top: 14px; padding-top: 12px; text-align: right;">
                    <span style="font-size: 13px; color: #9ca3af; margin-right: 15px;">Subtotal: ${symbol}${Number(order.subtotal || 0).toLocaleString()}</span>
                    <span style="font-size: 16px; font-weight: 700; color: #d4af37;">Total: ${totalAmount} ${currency}</span>
                </div>
            </div>
        `;

        const mailOptions = {
            from: getSenderHeader(),
            to: adminEmail,
            subject: `🛍️ New Order #${orderNum} Placed - ${totalAmount} (${order.customername || "Customer"})`,
            html: wrapEmailTemplate({
                title: `New Order #${orderNum}`,
                preheader: `New order #${orderNum} for ${totalAmount} placed by ${order.customername || "Customer"}.`,
                contentHtml
            })
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Order notification email sent to ${adminEmail} (MsgId: ${info.messageId})`);
        return info;
    } catch (error) {
        console.error("[EmailService] Failed to send order notification email:", error);
    }
};

/**
 * Sends an email notification when someone submits the Contact Us form.
 * @param {Object} contact - The saved ContactUs document from MongoDB
 */
const sendContactUsNotificationEmail = async (contact) => {
    try {
        if (!contact) return;

        const transporter = getTransporter();
        const adminEmail = getAdminEmail();

        const contentHtml = `
            <div style="margin-bottom: 20px;">
                <h2 style="margin: 0 0 4px; font-size: 18px; color: #f9fafb;">📩 New Contact Us Message Received</h2>
                <p style="margin: 0; font-size: 13px; color: #9ca3af;">A new message was submitted via the website contact form.</p>
            </div>

            <div class="card">
                <table class="data-table">
                    <tr>
                        <td class="label">Sender Name:</td>
                        <td class="value"><strong>${contact.fullname}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Email Address:</td>
                        <td class="value">
                            <a href="mailto:${contact.email}" style="color: #60a5fa; text-decoration: none;">${contact.email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td class="label">Country / Region:</td>
                        <td class="value">${contact.countryname || "Not specified"}</td>
                    </tr>
                    <tr>
                        <td class="label">Received At:</td>
                        <td class="value">${new Date(contact.createdAt || Date.now()).toLocaleString()}</td>
                    </tr>
                </table>
            </div>

            <h3 style="margin: 16px 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #d4af37;">Message Content</h3>
            <div class="card" style="background-color: #12151c; border-left: 3px solid #d4af37; padding: 16px 20px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e5e7eb; white-space: pre-wrap;">${contact.message}</p>
            </div>

            <div style="text-align: center; margin-top: 25px;">
                <a href="mailto:${contact.email}?subject=Re: Your inquiry to Gemora Diam Atelier" 
                   style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #aa8624 100%); color: #0d0f12; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; letter-spacing: 0.5px;">
                    Reply to ${contact.fullname}
                </a>
            </div>
        `;

        const mailOptions = {
            from: getSenderHeader(),
            to: adminEmail,
            replyTo: contact.email,
            subject: `📩 New Contact Form Message from ${contact.fullname} (${contact.countryname || "Inquiry"})`,
            html: wrapEmailTemplate({
                title: "New Contact Us Message",
                preheader: `Contact inquiry from ${contact.fullname}: "${(contact.message || "").substring(0, 80)}..."`,
                contentHtml
            })
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Contact Us notification email sent to ${adminEmail} (MsgId: ${info.messageId})`);
        return info;
    } catch (error) {
        console.error("[EmailService] Failed to send Contact Us notification email:", error);
    }
};

/**
 * Sends an email notification when a new subscriber joins the newsletter.
 * @param {Object} subscriber - The saved Subscriber document from MongoDB
 */
const sendSubscriberNotificationEmail = async (subscriber) => {
    try {
        if (!subscriber) return;

        const transporter = getTransporter();
        const adminEmail = getAdminEmail();

        const contentHtml = `
            <div style="margin-bottom: 20px;">
                <span class="badge badge-green">New Subscription</span>
                <h2 style="margin: 8px 0 4px; font-size: 18px; color: #f9fafb;">💎 New Newsletter Subscriber!</h2>
                <p style="margin: 0; font-size: 13px; color: #9ca3af;">A new subscriber has joined the Gemora Diam VIP list.</p>
            </div>

            <div class="card">
                <table class="data-table">
                    <tr>
                        <td class="label">Subscriber Email:</td>
                        <td class="value">
                            <strong style="color: #d4af37; font-size: 14px;">${subscriber.email}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td class="label">Status:</td>
                        <td class="value"><span class="badge badge-green">${subscriber.status || "Subscribed"}</span></td>
                    </tr>
                    <tr>
                        <td class="label">Acquisition Source:</td>
                        <td class="value">${subscriber.source || "LandingPage Footer"}</td>
                    </tr>
                    <tr>
                        <td class="label">Subscribed At:</td>
                        <td class="value">${new Date(subscriber.createdAt || Date.now()).toLocaleString()}</td>
                    </tr>
                </table>
            </div>
        `;

        const mailOptions = {
            from: getSenderHeader(),
            to: adminEmail,
            subject: `💎 New Newsletter Subscriber: ${subscriber.email}`,
            html: wrapEmailTemplate({
                title: "New Newsletter Subscriber",
                preheader: `${subscriber.email} just subscribed to the Gemora Diam newsletter.`,
                contentHtml
            })
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Subscriber notification email sent to ${adminEmail} (MsgId: ${info.messageId})`);
        return info;
    } catch (error) {
        console.error("[EmailService] Failed to send subscriber notification email:", error);
    }
};

/**
 * Utility to verify SMTP connection configuration.
 */
const verifyEmailConnection = async () => {
    try {
        const transporter = getTransporter();
        await transporter.verify();
        return { success: true, message: "SMTP connection verified successfully" };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOrderNotificationEmail,
    sendContactUsNotificationEmail,
    sendSubscriberNotificationEmail,
    verifyEmailConnection
};
