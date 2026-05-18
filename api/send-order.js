import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = "photrinh.vovandung@gmail.com";
const FROM_EMAIL = process.env.ORDER_FROM_EMAIL || "Phở Trịnh <onboarding@resend.dev>";

function money(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  })
    .format(Number(value || 0))
    .replace("₫", "đ");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderItems(items = []) {
  if (!items.length) return "<p>Không có món.</p>";

  return `
    <table cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th align="left" style="border-bottom:1px solid #ddd">Món</th>
          <th align="left" style="border-bottom:1px solid #ddd">Topping</th>
          <th align="right" style="border-bottom:1px solid #ddd">SL</th>
          <th align="right" style="border-bottom:1px solid #ddd">Đơn giá</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `
              <tr>
                <td style="border-bottom:1px solid #eee">
                  <strong>${escapeHtml(item.name)}</strong><br />
                  <span>${escapeHtml(item.size)}</span>
                </td>
                <td style="border-bottom:1px solid #eee">${escapeHtml(item.toppingText || "Không thêm topping")}</td>
                <td align="right" style="border-bottom:1px solid #eee">${escapeHtml(item.qty)}</td>
                <td align="right" style="border-bottom:1px solid #eee">${money(item.unitPrice)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderEmail(order) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#211714">
      <h2>Đơn hàng mới từ website Phở Trịnh</h2>
      <p><strong>Khách hàng:</strong> ${escapeHtml(order.customer)}</p>
      <p><strong>Số điện thoại:</strong> ${escapeHtml(order.phone)}</p>
      <p><strong>Hình thức nhận món:</strong> ${escapeHtml(order.fulfillment)}</p>
      <p><strong>Địa chỉ:</strong> ${escapeHtml(order.address || "Không có")}</p>
      <p><strong>Thanh toán:</strong> ${escapeHtml(order.payment)}</p>
      <p><strong>Nội dung chuyển khoản:</strong> ${escapeHtml(order.transferNote)}</p>
      <hr />
      ${renderItems(order.items)}
      <hr />
      <p><strong>Tạm tính món:</strong> ${money(order.subtotal)}</p>
      <p><strong>Phí ship:</strong> ${money(order.shippingFee)} ${order.shippingDistanceKm ? `(${escapeHtml(order.shippingDistanceKm)} km)` : ""}</p>
      <p><strong>Giá ship áp dụng:</strong> ${escapeHtml(order.shippingPricingLabel || "")}</p>
      <h3>Tổng cộng: ${money(order.total)}</h3>
    </div>
  `;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Missing RESEND_API_KEY" });
  }

  try {
    const order = req.body;

    if (!order?.customer || !order?.phone || !Array.isArray(order?.items) || !order.items.length) {
      return res.status(400).json({ error: "Invalid order payload" });
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `Đơn Phở Trịnh mới - ${order.customer} - ${money(order.total)}`,
      html: renderEmail(order),
    });

    return res.status(200).json({ ok: true, id: result.data?.id });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Cannot send email" });
  }
}
