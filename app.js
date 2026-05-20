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
  { label: "Quẩy(2 chiếc)", value: "quay", price: 5000 },
  { label: "Trứng(1 quả)", value: "trung", price: 8000 },
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
const maximumDeliveryDistanceKm = 10;
const deliveryRejectedMessage =
  "Phở Trịnh rất lấy làm tiếc vì quãng đường xa quá sẽ không đảm bảo chất lượng của Phở Trịnh, Rất mong quý khách thông cảm";
const reservationAdvanceNoticeMessage =
  "Quý khách vui lòng đặt bàn trước 30 phút và trước 20h30 để nhà hàng được phục vụ Quý khách chu đáo. Xin cảm ơn";
const soldOutAfterHoursMessage =
  "Rất lấy làm tiếc vì nhà hàng đã hết món. Xin lỗi quý khách và hẹn gặp lại lần sau.";
const reservationCapacityMessage =
  "Phở Trịnh xin lỗi vì tại thời điểm quý khách đặt bàn trước không đủ số lượng bàn cho quý khách";
const peakShippingRatePerKm = 8000;
const peakMinimumShippingFee = 35000;
const peakStartHour = 11;
const peakEndHour = 13;
const closingHour = 20;
const closingMinute = 30;
const maximumReservationBowls = 30;
let deliveryDistanceKm = 0;

function money(value) {
  return formatter.format(value).replace("₫", "đ");
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
}

function getCartItemCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getFulfillmentMethod() {
  return document.querySelector('[name="fulfillment"]')?.value || "restaurant-delivery";
}

function isRestaurantDelivery() {
  return getFulfillmentMethod() === "restaurant-delivery";
}

function isTableReservation() {
  return getFulfillmentMethod() === "table-reservation";
}

function isPickup() {
  return getFulfillmentMethod() === "pickup";
}

function needsScheduledTime() {
  return isPickup() || isTableReservation();
}

function isDeliveryDistanceRejected() {
  return isRestaurantDelivery() && deliveryDistanceKm > maximumDeliveryDistanceKm;
}

function getHanoiDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value,
    month: parts.find((part) => part.type === "month")?.value,
    day: parts.find((part) => part.type === "day")?.value,
  };
}

function getTodayDateInputValue() {
  const { year, month, day } = getHanoiDateParts();
  return `${year}-${month}-${day}`;
}

function getReservationHanoiTimestamp(dateValue, hourValue, minuteValue) {
  if (!dateValue || hourValue === "" || minuteValue === "") return null;

  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const [year, month, day] = String(dateValue).split("-").map(Number);
  if (!year || !month || !day) return null;

  return Date.UTC(year, month - 1, day, hour - 7, minute, 0, 0);
}

function getReservationValidationMessage(dateValue, hourValue, minuteValue) {
  const reservationTimestamp = getReservationHanoiTimestamp(dateValue, hourValue, minuteValue);
  if (reservationTimestamp === null) {
    return "Vui lòng chọn đầy đủ ngày, giờ và phút đặt bàn.";
  }

  const minimumReservationTimestamp = Date.now() + 30 * 60 * 1000;
  if (reservationTimestamp <= minimumReservationTimestamp) {
    return reservationAdvanceNoticeMessage;
  }

  return "";
}

function getHanoiHour(date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      hour12: false,
    }).format(date)
  );
}

function getHanoiTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  return {
    hour: Number(parts.find((part) => part.type === "hour")?.value),
    minute: Number(parts.find((part) => part.type === "minute")?.value),
  };
}

function isAfterClosingTime(date = new Date()) {
  const { hour, minute } = getHanoiTimeParts(date);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
  return hour > closingHour || (hour === closingHour && minute >= closingMinute);
}

function isReservationAfterClosingTime(hourValue, minuteValue) {
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return false;
  return hour > closingHour || (hour === closingHour && minute >= closingMinute);
}

function isPeakShippingTime(date = new Date()) {
  const hour = getHanoiHour(date);
  return hour >= peakStartHour && hour < peakEndHour;
}

function getShippingPricing() {
  if (isPeakShippingTime()) {
    return {
      ratePerKm: peakShippingRatePerKm,
      minimumFee: peakMinimumShippingFee,
      label: "Giờ cao điểm",
    };
  }

  return {
    ratePerKm: shippingRatePerKm,
    minimumFee: minimumShippingFee,
    label: "Giờ thường",
  };
}

function getShippingFee() {
  if (!isRestaurantDelivery() || isDeliveryDistanceRejected() || !cart.length || !deliveryDistanceKm) return 0;
  const pricing = getShippingPricing();
  if (deliveryDistanceKm < minimumShippingDistanceKm) return pricing.minimumFee;
  return Math.ceil(deliveryDistanceKm) * pricing.ratePerKm;
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
    if (isDeliveryDistanceRejected()) {
      status.textContent = deliveryRejectedMessage;
      renderCart();
      return;
    }

    const pricing = getShippingPricing();
    status.textContent = `${sourceLabel}: khoảng ${deliveryDistanceKm.toFixed(2)} km từ quán. ${pricing.label}, phí ship ${money(getShippingFee())}.`;
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

function setOrderMessage(messageText, type = "success") {
  const message = document.querySelector("#orderMessage");
  if (!message) return;

  message.textContent = messageText;
  message.classList.toggle("error", type === "error");
}

function setReservationWarning(messageText = "") {
  const warning = document.querySelector("#reservationWarning");
  if (!warning) return;

  warning.textContent = messageText;
  warning.hidden = !messageText;
}

function updateFulfillmentUI() {
  const address = document.querySelector('[name="address"]');
  const deliveryTools = document.querySelector(".delivery-tools");
  const reservationFields = document.querySelector("#reservationFields");
  const reservationDate = document.querySelector('[name="reservationDate"]');
  const reservationHour = document.querySelector('[name="reservationHour"]');
  const reservationMinute = document.querySelector('[name="reservationMinute"]');
  const restaurantDelivery = isRestaurantDelivery();
  const tableReservation = isTableReservation();
  const scheduledTime = needsScheduledTime();

  if (address) {
    address.required = restaurantDelivery;
    address.disabled = false;
    address.placeholder = restaurantDelivery
      ? "Số nhà, đường, phường/xã"
      : tableReservation
        ? "Không bắt buộc khi đặt bàn trước"
        : isPickup()
          ? "Không bắt buộc khi khách tự đến lấy"
          : "Không bắt buộc nếu khách tự đặt ship";
  }

  if (deliveryTools) {
    deliveryTools.hidden = !restaurantDelivery;
  }

  if (reservationFields) {
    reservationFields.hidden = !scheduledTime;
  }

  [reservationDate, reservationHour, reservationMinute].forEach((field) => {
    if (!field) return;
    field.required = scheduledTime;
    field.disabled = !scheduledTime;
    if (!scheduledTime) field.value = "";
  });

  if (reservationDate) {
    reservationDate.min = getTodayDateInputValue();
  }

  if (!scheduledTime) {
    setReservationWarning("");
  }

  if (!restaurantDelivery) {
    clearDeliveryDistance(
      tableReservation
        ? "Đặt bàn trước: vui lòng chọn ngày, giờ và phút."
        : isPickup()
          ? "Khách tự đến lấy: không tính phí ship."
          : "Khách tự đặt ship: không tính phí ship."
    );
  } else if (!deliveryDistanceKm) {
    setDeliveryStatus(
      "Nhập địa chỉ hoặc lấy vị trí để tính phí ship. Giờ thường: dưới 4km 25.000đ, từ 4km 6.000đ/km. 11:00-13:00: dưới 4km 35.000đ, từ 4km 8.000đ/km."
    );
    renderCart();
  }
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

async function reverseGeocodeLocation(location) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    location.lat
  )}&lon=${encodeURIComponent(location.lng)}&zoom=18&addressdetails=1`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Không thể tìm địa chỉ từ vị trí hiện tại.");
  }

  const result = await response.json();
  return result.display_name || "";
}

function fillAddressFromLocation(addressText, location) {
  const addressInput = document.querySelector('[name="address"]');
  if (!addressInput) return;

  addressInput.value =
    addressText ||
    `Vị trí GPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
}

async function calculateDistanceFromAddress() {
  if (!isRestaurantDelivery()) {
    clearDeliveryDistance(isPickup() ? "Khách tự đến lấy: không tính phí ship." : "Khách tự đặt ship: không tính phí ship.");
    return;
  }

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
  if (!isRestaurantDelivery()) {
    clearDeliveryDistance(isPickup() ? "Khách tự đến lấy: không tính phí ship." : "Khách tự đặt ship: không tính phí ship.");
    return;
  }

  if (!navigator.geolocation) {
    setDeliveryStatus("Trình duyệt này không hỗ trợ lấy vị trí hiện tại.");
    return;
  }

  setDeliveryStatus("Đang lấy vị trí hiện tại của bạn...");
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const customerLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setDeliveryStatus("Đã lấy vị trí. Đang điền địa chỉ giao hàng...");

      try {
        const addressText = await reverseGeocodeLocation(customerLocation);
        fillAddressFromLocation(addressText, customerLocation);
      } catch {
        fillAddressFromLocation("", customerLocation);
      }

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

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

function isValidVietnamPhone(value) {
  return /^0\d{9}$/.test(value);
}

function handlePhoneInput(event) {
  const phoneInput = event.currentTarget;
  const normalizedPhone = normalizePhone(phoneInput.value);
  phoneInput.value = normalizedPhone;
  phoneInput.setCustomValidity(
    normalizedPhone && !isValidVietnamPhone(normalizedPhone)
      ? "Số điện thoại Việt Nam phải gồm đúng 10 chữ số và bắt đầu bằng 0."
      : ""
  );
  updateTransferPanel();
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
  const total = getOrderTotal();
  panel.hidden = !isBankTransfer || (isTableReservation() && total <= 0);
  transferAmount.textContent = money(total);
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

function normalizeToppings(toppings) {
  return toppingOptions
    .map((option) => {
      const existing = toppings.find((topping) => topping.value === option.value);
      const qty = Math.max(0, Number(existing?.qty || 0));
      return {
        ...option,
        qty,
        total: option.price * qty,
      };
    })
    .filter((topping) => topping.qty > 0);
}

function getItemBasePrice(item) {
  const menuItem = menu.find((entry) => entry.id === item.id);
  const size = getOption(sizeOptions, item.size);
  return (menuItem?.price || 0) + size.delta;
}

function updateCartItemTopping(key, toppingValue, delta) {
  cart = cart.map((item) => {
    if (item.key !== key) return item;

    const option = toppingOptions.find((entry) => entry.value === toppingValue);
    if (!option) return item;

    const currentToppings = normalizeToppings(item.toppings || []);
    const current = currentToppings.find((topping) => topping.value === toppingValue);
    const nextQty = Math.max(0, Number(current?.qty || 0) + delta);
    const nextToppings = normalizeToppings([
      ...currentToppings.filter((topping) => topping.value !== toppingValue),
      { ...option, qty: nextQty },
    ]);
    const toppingTotal = nextToppings.reduce((sum, topping) => sum + topping.total, 0);

    return {
      ...item,
      toppings: nextToppings,
      toppingText: getToppingText(nextToppings),
      unitPrice: getItemBasePrice(item) + toppingTotal,
    };
  });

  renderCart();
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
              <div class="cart-toppings" aria-label="Sửa topping cho ${item.name}">
                ${toppingOptions
                  .map((option) => {
                    const current = (item.toppings || []).find((topping) => topping.value === option.value);
                    const qty = current?.qty || 0;
                    return `
                      <div class="cart-topping-row">
                        <span>${option.label} <small>${money(option.price)}</small></span>
                        <div class="qty-controls compact">
                          <button class="icon-btn" type="button" data-topping-dec="${item.key}" data-topping-value="${option.value}" aria-label="Giảm ${option.label}">-</button>
                          <strong>${qty}</strong>
                          <button class="icon-btn" type="button" data-topping-inc="${item.key}" data-topping-value="${option.value}" aria-label="Tăng ${option.label}">+</button>
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
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
  shippingDistance.textContent =
    isRestaurantDelivery() && deliveryDistanceKm ? `(${deliveryDistanceKm.toFixed(2)} km)` : "";
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

function showOrderMessage(order, emailStatus = "pending", emailError = "") {
  const message = document.querySelector("#orderMessage");
  if (message) message.classList.remove("error");
  const isReservation = order.fulfillmentValue === "table-reservation";
  const emailText =
    emailStatus === "sent"
      ? " Email đã được gửi về Phở Trịnh."
      : emailStatus === "failed"
        ? ` Đơn đã lưu trên trình duyệt, nhưng email chưa gửi được${emailError ? `: ${emailError}` : "."}`
        : " Email đang được gửi về Phở Trịnh.";
  const confirmationText = isReservation ? "Đã ghi nhận thông tin đặt bàn trước." : "Đã ghi nhận đơn hàng.";
  message.textContent =
    order.payment === "Chuyển khoản ngân hàng" && order.total > 0
      ? `${confirmationText} Vui lòng chuyển khoản ${money(order.total)} với nội dung: ${order.transferNote}.${emailText}`
      : `${confirmationText}${emailText}`;

  if (order.payment === "Chuyển khoản ngân hàng" && order.total > 0) {
    const br = document.createElement("br");
    const img = document.createElement("img");
    img.src = getVietQrUrl(order.total, order.transferNote);
    img.alt = "QR chuyển khoản VietQR";
    img.style.maxWidth = "200px";
    message.appendChild(br);
    message.appendChild(img);
  }
}

async function sendOrderEmail(order) {
  if (window.location.protocol === "file:") {
    throw new Error("Chức năng gửi email chỉ chạy trên website đã deploy, không chạy khi mở file HTML trực tiếp.");
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch("/api/send-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const detail = error.resendError?.message || error.error || "Không gửi được email đơn hàng.";
      const sender = error.from ? ` Sender: ${error.from}.` : "";
      throw new Error(`${detail}.${sender}`);
    }

    return response.json().catch(() => ({}));
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Gửi email quá lâu, vui lòng kiểm tra Vercel Logs.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function handleCheckout(event) {
  event.preventDefault();

  if (isAfterClosingTime()) {
    setOrderMessage(soldOutAfterHoursMessage, "error");
    setReservationWarning(soldOutAfterHoursMessage);
    return;
  }

  if (!cart.length && !isTableReservation()) {
    setOrderMessage("Vui lòng thêm ít nhất một món trước khi gửi đơn.", "error");
    return;
  }

  if (isRestaurantDelivery() && !deliveryDistanceKm) {
    setOrderMessage("Vui lòng tính khoảng cách giao hàng trước khi gửi đơn.", "error");
    return;
  }

  if (isDeliveryDistanceRejected()) {
    setOrderMessage(deliveryRejectedMessage, "error");
    return;
  }

  if (isTableReservation() && getCartItemCount() > maximumReservationBowls) {
    setOrderMessage(reservationCapacityMessage, "error");
    return;
  }

  const form = new FormData(event.currentTarget);
  const reservationHour = form.get("reservationHour");
  const reservationMinute = form.get("reservationMinute");
  const scheduledTime = needsScheduledTime();
  const reservationValidationMessage = scheduledTime
    ? getReservationValidationMessage(form.get("reservationDate"), reservationHour, reservationMinute)
    : "";
  const reservationDateInput = event.currentTarget.elements.reservationDate;
  const reservationHourInput = event.currentTarget.elements.reservationHour;
  const reservationMinuteInput = event.currentTarget.elements.reservationMinute;

  [reservationDateInput, reservationHourInput, reservationMinuteInput].forEach((field) => {
    if (field) field.setCustomValidity("");
  });

  if (scheduledTime && isReservationAfterClosingTime(reservationHour, reservationMinute)) {
    if (reservationHourInput) {
      reservationHourInput.setCustomValidity(reservationAdvanceNoticeMessage);
      reservationHourInput.reportValidity();
    }
    setReservationWarning(reservationAdvanceNoticeMessage);
    return;
  }

  if (reservationValidationMessage) {
    if (reservationDateInput) {
      reservationDateInput.setCustomValidity(reservationValidationMessage);
      reservationDateInput.reportValidity();
    }
    setReservationWarning(reservationValidationMessage);
    return;
  }

  setReservationWarning("");

  const phoneInput = event.currentTarget.elements.phone;
  const normalizedPhone = normalizePhone(phoneInput.value);
  phoneInput.value = normalizedPhone;

  if (!isValidVietnamPhone(normalizedPhone)) {
    phoneInput.setCustomValidity("Số điện thoại Việt Nam phải gồm đúng 10 chữ số và bắt đầu bằng 0.");
    phoneInput.reportValidity();
    setOrderMessage("Vui lòng nhập số điện thoại Việt Nam hợp lệ gồm đúng 10 chữ số.", "error");
    return;
  }

  phoneInput.setCustomValidity("");

  const subtotal = getCartTotal();
  const deliveryFee = getShippingFee();
  const total = getOrderTotal();
  const shippingPricing = getShippingPricing();
  const paymentSelect = event.currentTarget.elements.payment;
  const fulfillmentSelect = event.currentTarget.elements.fulfillment;
  const order = {
    customer: form.get("name"),
    phone: form.get("phone"),
    address: form.get("address"),
    fulfillment: fulfillmentSelect.options[fulfillmentSelect.selectedIndex].text,
    fulfillmentValue: form.get("fulfillment"),
    reservationDate: form.get("reservationDate"),
    reservationHour,
    reservationMinute,
    reservationTime:
      form.get("reservationDate") && reservationHour !== null && reservationMinute !== null
        ? `${String(reservationHour).padStart(2, "0")}:${String(reservationMinute).padStart(2, "0")}`
        : "",
    payment: paymentSelect.options[paymentSelect.selectedIndex].text,
    transferNote: getTransferNote(),
    bankId,
    bankAccountNo,
    bankAccountName,
    items: cart,
    subtotal,
    shippingFee: deliveryFee,
    shippingDistanceKm: deliveryDistanceKm,
    shippingRatePerKm: shippingPricing.ratePerKm,
    minimumShippingFee,
    appliedMinimumShippingFee: shippingPricing.minimumFee,
    shippingPricingLabel: shippingPricing.label,
    isPeakShippingTime: isPeakShippingTime(),
    minimumShippingDistanceKm,
    storeAddress,
    total,
  };

  localStorage.setItem("pho-trinh-last-order", JSON.stringify(order));
  cart = [];
  renderCart();
  renderLastOrder();
  event.currentTarget.reset();
  updateFulfillmentUI();
  updateTransferPanel();
  showOrderMessage(order, "pending");

  sendOrderEmail(order)
    .then(() => {
      showOrderMessage(order, "sent");
    })
    .catch((error) => {
      console.error(error);
      showOrderMessage(order, "failed", error.message);
    });
}

document.addEventListener("click", (event) => {
  const addId = event.target.closest("[data-add]")?.dataset.add;
  const incKey = event.target.closest("[data-inc]")?.dataset.inc;
  const decKey = event.target.closest("[data-dec]")?.dataset.dec;
  const toppingIncButton = event.target.closest("[data-topping-inc]");
  const toppingDecButton = event.target.closest("[data-topping-dec]");

  if (addId) addToCart(addId);
  if (incKey) updateQty(incKey, 1);
  if (decKey) updateQty(decKey, -1);
  if (toppingIncButton) {
    updateCartItemTopping(toppingIncButton.dataset.toppingInc, toppingIncButton.dataset.toppingValue, 1);
  }
  if (toppingDecButton) {
    updateCartItemTopping(toppingDecButton.dataset.toppingDec, toppingDecButton.dataset.toppingValue, -1);
  }
});

document.querySelector("#checkoutForm").addEventListener("submit", handleCheckout);
document.querySelector('[name="payment"]').addEventListener("change", updateTransferPanel);
document.querySelector('[name="phone"]').addEventListener("input", handlePhoneInput);
document.querySelector('[name="fulfillment"]').addEventListener("change", updateFulfillmentUI);
document.querySelector("#useCurrentLocation").addEventListener("click", calculateDistanceFromCurrentLocation);
document.querySelector("#calculateAddressDistance").addEventListener("click", calculateDistanceFromAddress);
document.querySelector('[name="address"]').addEventListener("input", () => {
  if (isRestaurantDelivery() && deliveryDistanceKm) {
    clearDeliveryDistance('Địa chỉ đã thay đổi. Bấm "Tính từ địa chỉ" để cập nhật phí ship.');
  }
});
document
  .querySelectorAll('[name="reservationDate"], [name="reservationHour"], [name="reservationMinute"]')
  .forEach((field) => {
    field.addEventListener("input", () => {
      field.setCustomValidity("");
      setReservationWarning("");
    });
  });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

renderMenu();
renderCart();
renderLastOrder();
updateFulfillmentUI();
updateTransferPanel();
