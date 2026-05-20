import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = "photrinh.vovandung@gmail.com";
const FROM_EMAIL = process.env.ORDER_FROM_EMAIL || "Pho Trinh <orders@photrinh.com>";

function money(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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
  if (!items.length) return "<p>Khong co mon.</p>";

  return `
    <table cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th align="left" style="border-bottom:1px solid #ddd">Mon</th>
          <th align="left" style="border-bottom:1px solid #ddd">Topping</th>
          <th align="right" style="border-bottom:1px solid #ddd">SL</th>
          <th align="right" style="border-bottom:1px solid #ddd">Don gia</th>
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
                <td style="border-bottom:1px solid #eee">${escapeHtml(item.toppingText || "Khong them topping")}</td>
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
  const isReservation = order.fulfillmentValue === "table-reservation";
  const isScheduledPickup = order.fulfillmentValue === "pickup";
  const reservationHour = order.reservationHour === "" || order.reservationHour == null ? "Chua chon" : order.reservationHour;
  const reservationMinute =
    order.reservationMinute === "" || order.reservationMinute == null ? "Chua chon" : order.reservationMinute;
  const scheduleTitle = isReservation ? "dat ban" : "hen lay mon";
  const reservationDetails = isReservation || isScheduledPickup
    ? `
      <p><strong>Ngay ${scheduleTitle}:</strong> ${escapeHtml(order.reservationDate || "Chua chon")}</p>
      <p><strong>Gio:</strong> ${escapeHtml(reservationHour)}</p>
      <p><strong>Phut:</strong> ${escapeHtml(reservationMinute)}</p>
      <p><strong>Thoi gian ${scheduleTitle}:</strong> ${escapeHtml(order.reservationTime || "Chua chon")}</p>
    `
    : "";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#211714">
      <h2>${isReservation ? "Dat ban truoc tu website Pho Trinh" : "Don hang moi tu website Pho Trinh"}</h2>
      <p><strong>Khach hang:</strong> ${escapeHtml(order.customer)}</p>
      <p><strong>So dien thoai:</strong> ${escapeHtml(order.phone)}</p>
      <p><strong>Hinh thuc nhan mon:</strong> ${escapeHtml(order.fulfillment)}</p>
      ${reservationDetails}
      <p><strong>Dia chi:</strong> ${escapeHtml(order.address || "Khong co")}</p>
      <p><strong>Thanh toan:</strong> ${escapeHtml(order.payment)}</p>
      <p><strong>Noi dung chuyen khoan:</strong> ${escapeHtml(order.transferNote)}</p>
      <hr />
      ${renderItems(order.items)}
      <hr />
      <p><strong>Tam tinh mon:</strong> ${money(order.subtotal)}</p>
      <p><strong>Phi ship:</strong> ${money(order.shippingFee)} ${order.shippingDistanceKm ? `(${escapeHtml(order.shippingDistanceKm)} km)` : ""}</p>
      <p><strong>Gia ship ap dung:</strong> ${escapeHtml(order.shippingPricingLabel || "")}</p>
      <h3>Tong cong: ${money(order.total)}</h3>
    </div>
  `;
}

function getRequestBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  return {};
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
    const order = getRequestBody(req);
    const hasItems = Array.isArray(order?.items) && order.items.length > 0;
    const isReservation = order?.fulfillmentValue === "table-reservation";

    if (!order?.customer || !order?.phone || (!hasItems && !isReservation)) {
      return res.status(400).json({ error: "Invalid order payload" });
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `${isReservation ? "Dat ban Pho Trinh moi" : "Don Pho Trinh moi"} - ${order.customer} - ${money(order.total)}`,
      html: renderEmail(order),
    });

    if (result.error) {
      return res.status(500).json({
        error: result.error.message || "Resend rejected the email",
        resendError: result.error,
        from: FROM_EMAIL,
        to: TO_EMAIL,
      });
    }

    return res.status(200).json({ ok: true, id: result.data?.id, from: FROM_EMAIL, to: TO_EMAIL });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Cannot send email",
      from: FROM_EMAIL,
      to: TO_EMAIL,
    });
  }
}
