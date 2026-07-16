const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD, //using a gmail app password here
    },
});

async function sendOtp(toEmail, otp) {
    await transporter.sendMail({
        from: `"IzzyRoots" <${process.env.MAIL_USERNAME}>`,
        to: toEmail,
        subject: 'Your IzzyRoots Verification Code',
        text:
        `Hi there!\n\n` +
      `Your verification code is: ${otp}\n\n` +
      `This code expires in 15 minutes.\n\n` +
      `If you did not create an account, please ignore this email.\n\n` +
      `– The Izzy Roots Team`,
    });
}

async function sendPasswordResetOtp(toEmail, otp) {
    await transporter.sendMail({
        from: `"IzzyRoots" <${process.env.MAIL_USERNAME}>`,
        to: toEmail,
        subject: "Your IzzyRoots Password Reset Code",
        text:
            `Hi there!\n\n` +
            `We received a request to reset your IzzyRoots password.\n\n` +
            `Your password reset code is: ${otp}\n\n` +
            `This code expires in 15 minutes.\n\n` +
            `If you did not request a password reset, you can safely ignore this email.\n\n` +
            `– The IzzyRoots Team`,
    });
}

async function sendReceiptEmail(order) {
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;">
                ${item.name}${item.packSize ? ` (${item.packSize})` : ''}<br/>
                <span style="color:#888; font-size:12px;">${item.quantity} &times; &#8358;${item.price.toFixed(2)}</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align:right;">
                &#8358;${(item.price * item.quantity).toFixed(2)}
            </td>
        </tr>
        `).join('');
        
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background:#FBF9F4;">
        <div style="background:#052e16; color:#fff; padding: 24px;">
            <p style="margin:0; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#86efac;">Official Receipt</p>
            <h1 style="margin:4px 0 0; font-size:22px;">IzzyRoots</h1>
            <p style="margin:4px 0 0; font-size:12px; color:#bbf7d0;">Seeds for your growing season</p>
        </div>

        <div style="padding: 20px;">
            <table style="width:100%; border-collapse: collapse; margin-bottom: 16px;">
                <tr>
                    <td style="font-size:11px; color:#999; text-transform:uppercase;">Order No.</td>
                    <td style="font-size:11px; color:#999; text-transform:uppercase; text-align:right;">Date</td>
                </tr>
                <tr>
                    <td style="font-weight:bold; color:#052e16;">#${order.id.toString().slice(-8).toUpperCase()}</td>
                    <td style="text-align:right; color:#444;">${new Date(order.paidAt || order.createdAt).toLocaleDateString('en-NG')}</td>
                </tr>
            </table>

            <p style="font-size:11px; color:#999; text-transform:uppercase; margin-bottom:4px;">Delivered To</p>
            <p style="margin:0; font-weight:600; color:#333;">${order.fullname}</p>
            <p style="margin:0; color:#555;">${order.address}</p>
            <p style="margin:0; color:#555;">${order.region}</p>
            <p style="margin:0 0 16px; color:#555;">${order.phone}</p>

            <table style="width:100%; border-collapse: collapse;">
                ${itemsHtml}
            </table>

            <table style="width:100%; margin-top:16px; font-size:13px; color:#555;">
                <tr>
                    <td style="padding:2px 0;">Subtotal</td>
                    <td style="padding:2px 0; text-align:right;">&#8358;${order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="padding:2px 0;">Delivery</td>
                    <td style="padding:2px 0; text-align:right;">&#8358;${order.deliveryFee.toFixed(2)}</td>
                </tr>
            </table>

            <table style="width:100%; margin-top:12px; background:#052e16; color:#fff;">
                <tr>
                    <td style="padding:12px 16px; font-weight:600;">Total Paid</td>
                    <td style="padding:12px 16px; text-align:right; font-weight:bold; font-size:16px;">&#8358;${order.total.toFixed(2)}</td>
                </tr>
            </table>

            ${order.paymentReference ? `
            <p style="font-size:11px; color:#999; text-transform:uppercase; margin-top:16px; margin-bottom:2px;">Payment Ref</p>
            <p style="font-family: monospace; font-size:12px; color:#555; margin:0;">${order.paymentReference}</p>
            ` : ''}
        </div>

        <div style="background:#f0fdf4; padding:16px 20px; text-align:center;">
            <p style="margin:0; font-size:12px; color:#166534; font-style:italic;">Thank you for growing with us.</p>
        </div>
    </div>
        `;

        await transporter.sendMail({
            from: `"IzzyRoots" <${process.env.MAIL_USERNAME}>`,
            to: order.email,
            subject: `Your IzzyRoots Receipt - Order #${order.id.toString().slice(-8).toUpperCase()}`,
            html,
        });
}

async function sendGuestMessage({ fullname, email, phone, country, region, message}) {
    await transporter.sendMail({
        from: `"IzzyRoots" <${process.env.MAIL_USERNAME}>`,
        to: process.env.MAIL_USERNAME,
        replyTo: email,
        subject: `New contact form message from ${fullname}`,
        text:
            `Name: ${fullname}\n` +
            `Email: ${email}\n` +
            `Phone: ${phone || '—'}\n` +
            `Country: ${country || '—'}\n` +
            `Region: ${region || '—'}\n\n` +
            `Message:\n${message}`,
    });
}



module.exports = { sendOtp, sendPasswordResetOtp, sendReceiptEmail, sendGuestMessage };