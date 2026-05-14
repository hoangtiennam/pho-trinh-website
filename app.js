const menu = [
  {
    id: "pho-tai",
    name: "Phở bò tái",
    price: 45000,
    image: "assets/Images/pho_tai.jpg",
    desc: "Thịt bò tái mềm, hành thơm, nước dùng trong và đậm vị.",
  },
  {
    id: "pho-chin",
    name: "Phở bò chín",
    price: 45000,
    image: "assets/Images/phochin.png",
    desc: "Bò chín thái mỏng, phù hợp bữa sáng hoặc bữa trưa nhẹ.",
  },
  {
    id: "pho-dac-biet",
    name: "Phở đặc biệt",
    price: 100000,
    image: "assets/Images/bapbo.jpg",
    desc: "Đầy đủ gồm bắp lõi, nạm, gầu, tái, gân. Nếu không ăn phần nào, vui lòng báo nhà hàng.",
  },
  {
    id: "pho-tai-lan",
    name: "Phở tái lăn",
    price: 60000,
    image: "assets/Images/photai.jpg",
    desc: "Thịt bò tái lăn thơm, vị đậm hơn cho người thích bát phở dậy mùi.",
  },
  {
    id: "combo-sang",
    name: "Tái gầu",
    price: 50000,
    image: "assets/Images/taigau.jpg",
    desc: "Một tô phở bò nóng, gầu giòn tan trong miệng.",
  },
  {
    id: "pho-rau-nam",
    name: "Phở tái nạm",
    price: 50000,
    image: "assets/Images/gaunam.jpg",
    desc: "Tái mỏng tươi, nạm thơm.",
  },
];

const sizeOptions = [
  { label: "Size vừa", value: "vừa", delta: 0 },
  { label: "Size lớn +10.000đ", value: "lớn", delta: 10000 },
];

const toppingOptions = [
  { label: "Quẩy", value: "quay", price: 8000 },
  { label: "Trứng", value: "trung", price: 8000 },
];

let cart = [];

const formatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const transferPrefix = "PHOTRINH";
const bankId = "TPB";
const bankAccountNo = "21071979999";
const bankAccountName = "Lê Thị Thanh Huyền";
const storeLocation = {
  lat: 21.0169,
  lng: 105.8236,
};
const storeAddress = "Số 36, ngõ 26, phố Võ Văn Dũng, Đống Đa, Hà Nội";
const shippingRatePerKm = 6000;
const minimumShippingFee = 25000;
const minimumShippingDistanceKm = 4;
let deliveryDistanceKm = 0;

function money(value) {
  return formatter.format(value).replace("₫", "đ");
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
}

function getShippingFee() {
  if (!cart.length || !deliveryDistanceKm) return 0;
  if (deliveryDistanceKm < minimumShippingDistanceKm) return minimumShippingFee;
  return Math.ceil(deliveryDistanceKm) * shippingRatePerKm;
}

function getOrderTotal() {
  return getCartTotal() + getShippingFee();
}

function distanceInKm(from, to) {
  const earthRadiusKm = 6371;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function setDeliveryDistance(distanceKm, sourceLabel) {
  const status = document.querySelector("#deliveryDistance");
  deliveryDistanceKm = Number(distanceKm.toFixed(2));
  if (status) {
    status.textContent = `${sourceLabel}: khoảng ${deliveryDistanceKm.toFixed(2)} km từ quán. Phí ship ${money(getShippingFee())}.`;
  }
  renderCart();
}

function setDeliveryStatus(message) {
  const status = document.querySelector("#deliveryDistance");
  if (status) status.textContent = message;
}

function clearDeliveryDistance(message) {
  deliveryDistanceKm = 0;
  setDeliveryStatus(message);
  renderCart();
}

async function geocodeAddress(address) {
  const query = `${address}, Hà Nội, Việt Nam`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Không thể kết nối dịch vụ bản đồ.");
  }

  const results = await response.json();
  if (!results.length) {
    throw new Error("Không tìm thấy địa chỉ này trên bản đồ.");
  }

  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
  };
}

async function calculateDistanceFromAddress() {
  const address = document.querySelector('[name="address"]').value.trim();
  if (!address) {
    setDeliveryStatus("Vui lòng nhập địa chỉ giao hàng trước khi tính phí ship.");
    return;
  }

  setDeliveryStatus("Đang tìm địa chỉ trên bản đồ...");
  try {
    const customerLocation = await geocodeAddress(address);
    setDeliveryDistance(distanceInKm(storeLocation, customerLocation), "Theo địa chỉ đã nhập");
  } catch (error) {
    setDeliveryStatus(`${error.message} Bạn có thể bấm "Lấy vị trí của tôi" để tính bằng GPS.`);
  }
}

function calculateDistanceFromCurrentLocation() {
  if (!navigator.geolocation) {
    setDeliveryStatus("Trình duyệt này không hỗ trợ lấy vị trí hiện tại.");
    return;
  }

  setDeliveryStatus("Đang lấy vị trí hiện tại của bạn...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const customerLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setDeliveryDistance(distanceInKm(storeLocation, customerLocation), "Theo vị trí hiện tại");
    },
    () => {
      setDeliveryStatus("Không lấy được vị trí. Vui lòng cho phép quyền vị trí hoặc nhập địa chỉ để tính.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    }
  );
}

function getTransferNote() {
  const phone = document.querySelector('[name="phone"]')?.value.trim();
  return phone ? `${transferPrefix} ${phone}` : transferPrefix;
}

function getVietQrUrl(amount = getOrderTotal(), note = getTransferNote()) {
  const params = new URLSearchParams({
    amount: String(Math.max(0, Math.round(amount))),
    addInfo: note,
    accountName: bankAccountName,
  });
  return `https://img.vietqr.io/image/${bankId}-${bankAccountNo}-compact2.png?${params.toString()}`;
}

function updateTransferPanel() {
  const form = document.querySelector("#checkoutForm");
  const panel = document.querySelector("#bankTransferPanel");
  const transferQr = document.querySelector("#transferQr");
  const transferAmount = document.querySelector("#transferAmount");
  const transferNote = document.querySelector("#transferNote");

  if (!form || !panel || !transferQr || !transferAmount || !transferNote) return;

  const isBankTransfer = form.elements.payment.value === "bank";
  panel.hidden = !isBankTransfer;
  transferAmount.textContent = money(getOrderTotal());
  transferNote.textContent = getTransferNote();
  transferQr.src = getVietQrUrl();
}

function renderMenu() {
  const menuGrid = document.querySelector("#menuGrid");
  menuGrid.innerHTML = menu
    .map(
      (item) => `
        <article class="menu-card">
          <img src="${item.image}" alt="${item.name}" loading="lazy" />
          <div class="menu-body">
            <div class="menu-title-row">
              <h3>${item.name}</h3>
              <span class="price">${money(item.price)}</span>
            </div>
            <p>${item.desc}</p>
            <div class="options">
              <select aria-label="Chọn size cho ${item.name}" data-size="${item.id}">
                ${sizeOptions
                  .map((option) => `<option value="${option.value}">${option.label}</option>`)
                  .join("")}
              </select>
              <div class="topping-picker" aria-label="Chọn topping cho ${item.name}">
                <span>Topping</span>
                ${toppingOptions
                  .map(
                    (option) => `
                      <label class="topping-row">
                        <span>${option.label} <b>${money(option.price)}</b></span>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          value="0"
                          inputmode="numeric"
                          data-topping-qty="${item.id}-${option.value}"
                          aria-label="Số lượng ${option.label} cho ${item.name}"
                        />
                      </label>
                    `
                  )
                  .join("")}
              </div>
              <button class="button add-button" data-add="${item.id}" type="button">Thêm vào giỏ</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function getOption(options, value) {
  return options.find((option) => option.value === value) || options[0];
}

function getSelectedToppings(id) {
  return toppingOptions
    .map((option) => {
      const input = document.querySelector(`[data-topping-qty="${id}-${option.value}"]`);
      const qty = Math.max(0, Number(input?.value || 0));
      return {
        ...option,
        qty,
        total: option.price * qty,
      };
    })
    .filter((option) => option.qty > 0);
}

function getToppingKey(toppings) {
  return toppings.map((topping) => `${topping.value}:${topping.qty}`).join("|") || "no-topping";
}

function getToppingText(toppings) {
  if (!toppings.length) return "Không thêm topping";
  return toppings
    .map((topping) => `${topping.label} x${topping.qty} (${money(topping.total)})`)
    .join(", ");
}

function addToCart(id) {
  const item = menu.find((entry) => entry.id === id);
  const sizeValue = document.querySelector(`[data-size="${id}"]`).value;
  const size = getOption(sizeOptions, sizeValue);
  const toppings = getSelectedToppings(id);
  const toppingTotal = toppings.reduce((sum, topping) => sum + topping.total, 0);
  const key = `${id}-${size.value}-${getToppingKey(toppings)}`;
  const existing = cart.find((entry) => entry.key === key);
  const unitPrice = item.price + size.delta + toppingTotal;

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      key,
      id,
      name: item.name,
      size: size.value,
      toppings,
      toppingText: getToppingText(toppings),
      unitPrice,
      qty: 1,
    });
  }

  renderCart();
}

function updateQty(key, delta) {
  cart = cart
    .map((item) => (item.key === key ? { ...item, qty: item.qty + delta } : item))
    .filter((item) => item.qty > 0);
  renderCart();
}

function renderCart() {
  const cartItems = document.querySelector("#cartItems");
  const cartTotal = document.querySelector("#cartTotal");
  const shippingFeeDisplay = document.querySelector("#shippingFee");
  const shippingDistance = document.querySelector("#shippingDistance");
  const grandTotal = document.querySelector("#grandTotal");
  const subtotal = getCartTotal();
  const deliveryFee = getShippingFee();
  const total = getOrderTotal();

  if (!cart.length) {
    cartItems.innerHTML = `<p class="cart-empty">Chưa có món nào trong giỏ hàng.</p>`;
  } else {
    cartItems.innerHTML = cart
      .map(
        (item) => `
          <div class="cart-row">
            <div class="cart-meta">
              <strong>${item.name}</strong>
              <span>${item.size}, ${item.toppingText} · ${money(item.unitPrice)}</span>
            </div>
            <div class="qty-controls" aria-label="Số lượng ${item.name}">
              <button class="icon-btn" type="button" data-dec="${item.key}" aria-label="Giảm">-</button>
              <strong>${item.qty}</strong>
              <button class="icon-btn" type="button" data-inc="${item.key}" aria-label="Tăng">+</button>
            </div>
          </div>
        `
      )
      .join("");
  }

  cartTotal.textContent = money(subtotal);
  shippingFeeDisplay.textContent = money(deliveryFee);
  shippingDistance.textContent = deliveryDistanceKm ? `(${deliveryDistanceKm.toFixed(2)} km)` : "";
  grandTotal.textContent = money(total);
  updateTransferPanel();
}

function renderLastOrder() {
  const lastOrder = document.querySelector("#lastOrder");
  const rawOrder = localStorage.getItem("pho-trinh-last-order");

  if (!rawOrder) {
    lastOrder.textContent = "";
    return;
  }

  try {
    const order = JSON.parse(rawOrder);
    lastOrder.textContent = `Đơn gần nhất: ${order.customer} - ${money(order.total)}.`;
  } catch {
    lastOrder.textContent = "";
  }
}

function showOrderMessage(order) {
  const message = document.querySelector("#orderMessage");
  message.textContent =
    order.payment === "Chuyển khoản ngân hàng"
      ? `Đã ghi nhận đơn hàng mẫu. Vui lòng chuyển khoản ${money(order.total)} với nội dung: ${order.customer}.`
      : "Đã ghi nhận đơn hàng mẫu. Dữ liệu được lưu trên trình duyệt.";

  if (order.payment === "Chuyển khoản ngân hàng") {
    const br = document.createElement("br");
    const img = document.createElement("img");
    img.src = getVietQrUrl(order.total, order.transferNote);
    img.alt = "QR chuyển khoản VietQR";
    img.style.maxWidth = "200px";
    message.appendChild(br);
    message.appendChild(img);
  }
}

function handleCheckout(event) {
  event.preventDefault();
  const message = document.querySelector("#orderMessage");

  if (!cart.length) {
    message.textContent = "Vui lòng thêm ít nhất một món trước khi gửi đơn.";
    return;
  }

  const form = new FormData(event.currentTarget);
  const subtotal = getCartTotal();
  const deliveryFee = getShippingFee();
  const total = getOrderTotal();
  const paymentSelect = event.currentTarget.elements.payment;
  const order = {
    customer: form.get("name"),
    phone: form.get("phone"),
    address: form.get("address"),
    payment: paymentSelect.options[paymentSelect.selectedIndex].text,
    transferNote: getTransferNote(),
    bankId,
    bankAccountNo,
    bankAccountName,
    items: cart,
    subtotal,
    shippingFee: deliveryFee,
    shippingDistanceKm: deliveryDistanceKm,
    shippingRatePerKm,
    minimumShippingFee,
    minimumShippingDistanceKm,
    storeAddress,
    total,
  };

  localStorage.setItem("pho-trinh-last-order", JSON.stringify(order));
  cart = [];
  renderCart();
  renderLastOrder();
  event.currentTarget.reset();
  updateTransferPanel();
  showOrderMessage(order);
}

document.addEventListener("click", (event) => {
  const addId = event.target.closest("[data-add]")?.dataset.add;
  const incKey = event.target.closest("[data-inc]")?.dataset.inc;
  const decKey = event.target.closest("[data-dec]")?.dataset.dec;

  if (addId) addToCart(addId);
  if (incKey) updateQty(incKey, 1);
  if (decKey) updateQty(decKey, -1);
});

document.querySelector("#checkoutForm").addEventListener("submit", handleCheckout);
document.querySelector('[name="payment"]').addEventListener("change", updateTransferPanel);
document.querySelector('[name="phone"]').addEventListener("input", updateTransferPanel);
document.querySelector("#useCurrentLocation").addEventListener("click", calculateDistanceFromCurrentLocation);
document.querySelector("#calculateAddressDistance").addEventListener("click", calculateDistanceFromAddress);
document.querySelector('[name="address"]').addEventListener("input", () => {
  if (deliveryDistanceKm) {
    clearDeliveryDistance('Địa chỉ đã thay đổi. Bấm "Tính từ địa chỉ" để cập nhật phí ship.');
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

renderMenu();
renderCart();
renderLastOrder();
updateTransferPanel();
