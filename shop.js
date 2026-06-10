/* ============================================================
   ShopNow – Product Modal + Cart + Checkout Logic
   ============================================================ */

// ── PRODUCT DATA ──────────────────────────────────────────
const products = [
  { id:1,  name:"Wireless Noise-Cancelling Headphones", price:899,  oldPrice:2350, discount:62, rating:4, sold:"1.2k", icon:"fa-headphones",   location:"Manila" },
  { id:2,  name:"Premium Cotton Oversized Tee",         price:329,  oldPrice:599,  discount:45, rating:5, sold:"3.5k", icon:"fa-tshirt",       location:"Cebu" },
  { id:3,  name:"Portable USB Blender Bottle 500ml",    price:549,  oldPrice:1099, discount:50, rating:4, sold:"890",  icon:"fa-blender",      location:"Davao" },
  { id:4,  name:"Running Sneakers Lightweight Mesh",    price:1299, oldPrice:2099, discount:38, rating:4, sold:"2.1k", icon:"fa-shoe-prints",  location:"Cebu" },
  { id:5,  name:"20000mAh Power Bank Fast Charge",      price:699,  oldPrice:2299, discount:70, rating:5, sold:"5k",   icon:"fa-solar-panel",  location:"Manila" },
  { id:6,  name:'14" Laptop Sleeve Water-Resistant',    price:279,  oldPrice:null, discount:0,  rating:5, sold:"742",  icon:"fa-laptop",       location:"Cebu" },
  { id:7,  name:"Ceramic Travel Mug with Lid 350ml",    price:399,  oldPrice:499,  discount:20, rating:4, sold:"318",  icon:"fa-mug-hot",      location:"Manila" },
  { id:8,  name:"Foldable Floor Chair Cushion",         price:1499, oldPrice:null, discount:0,  rating:5, sold:"1.8k", icon:"fa-couch",        location:"Davao" },
  { id:9,  name:'Ring Light 10" with Tripod Stand',     price:799,  oldPrice:1249, discount:35, rating:4, sold:"2.3k", icon:"fa-camera",       location:"Quezon City" },
  { id:10, name:"Indoor Plant Succulent Set of 3",      price:349,  oldPrice:null, discount:0,  rating:5, sold:"956",  icon:"fa-seedling",     location:"Cebu" },
  { id:11, name:"Smart Watch Fitness Tracker IP68",     price:1199, oldPrice:2649, discount:55, rating:4, sold:"4.7k", icon:"fa-watch",        location:"Manila" },
  { id:12, name:"Watercolor Brush Pen Set 48 Colors",   price:459,  oldPrice:null, discount:0,  rating:5, sold:"621",  icon:"fa-paint-brush",  location:"Iloilo" },
  { id:13, name:"Mini Desk Fan USB 3-Speed",            price:249,  oldPrice:349,  discount:28, rating:4, sold:"3.2k", icon:"fa-wind",         location:"Cebu" },
  { id:14, name:"Hardcover Journal Dotted Grid A5",     price:199,  oldPrice:null, discount:0,  rating:5, sold:"1.1k", icon:"fa-book",         location:"Makati" },
  { id:15, name:"Sunscreen SPF 50+ Lightweight Gel",    price:299,  oldPrice:499,  discount:40, rating:5, sold:"6.4k", icon:"fa-sun",          location:"Cebu" },
];

// ── STATE ─────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('shopnow_cart') || '[]');
let currentProduct = null;
let checkoutStep = 1;

// ── HELPERS ───────────────────────────────────────────────
const fmt = n => '\u20B1' + Number(n).toLocaleString();

function stars(n) {
  let s = '';
  for (let i = 1; i <= 5; i++)
    s += `<i class="${i <= n ? 'fas' : 'far'} fa-star"></i>`;
  return s;
}

function saveCart() { localStorage.setItem('shopnow_cart', JSON.stringify(cart)); }

function updateCartBadge() {
  const total = cart.reduce((a, b) => a + b.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = total;
    el.style.display = total ? 'inline' : 'none';
  });
}

function showToast(msg, type) {
  type = type || 'success';
  const t = document.getElementById('sn-toast');
  t.textContent = msg;
  t.className = 'sn-toast sn-toast--' + type + ' sn-toast--show';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('sn-toast--show'), 2800);
}

// ── INJECT DATA-IDS onto existing cards ───────────────────
function injectProductIds() {
  document.querySelectorAll('.flash-sale .product-card').forEach((card, i) => {
    card.dataset.productId = i + 1;
  });
  document.querySelectorAll('.recommended .product-card').forEach((card, i) => {
    card.dataset.productId = i + 6;
  });
}

// ── ATTACH CLICK TO ALL PRODUCT CARDS ─────────────────────
function attachCardClicks() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function(e) {
      if (e.target.closest('.wishlist-btn')) return;
      const idx = this.dataset.productId;
      if (idx) openProductModal(Number(idx));
    });
  });

  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const icon = this.querySelector('i');
      if (icon.classList.contains('far')) {
        icon.classList.replace('far', 'fas');
        icon.style.color = '#EE4D2D';
        showToast('Added to wishlist \u2665');
      } else {
        icon.classList.replace('fas', 'far');
        icon.style.color = '';
        showToast('Removed from wishlist', 'info');
      }
    });
  });
}

// ── PRODUCT MODAL ──────────────────────────────────────────
function openProductModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  currentProduct = Object.assign({}, p, { qty: 1 });

  const m = document.getElementById('sn-productModal');
  m.querySelector('.pm-icon i').className = 'fas ' + p.icon;
  m.querySelector('.pm-name').textContent = p.name;
  m.querySelector('.pm-stars').innerHTML = stars(p.rating) + '<span>' + p.sold + ' sold</span>';
  m.querySelector('.pm-price-now').textContent = fmt(p.price);
  m.querySelector('.pm-price-old').textContent = p.oldPrice ? fmt(p.oldPrice) : '';
  const disc = m.querySelector('.pm-discount');
  disc.textContent = p.discount ? '-' + p.discount + '%' : '';
  disc.style.display = p.discount ? 'inline' : 'none';
  m.querySelector('.pm-location').innerHTML = '<i class="fas fa-map-marker-alt"></i> Ships from ' + p.location;
  m.querySelector('.pm-qty-val').textContent = 1;

  document.getElementById('sn-overlay').classList.add('active');
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('sn-overlay').classList.remove('active');
  document.getElementById('sn-productModal').classList.remove('active');
  document.body.style.overflow = '';
}

function changeQty(delta) {
  currentProduct.qty = Math.max(1, Math.min(99, currentProduct.qty + delta));
  document.querySelector('.pm-qty-val').textContent = currentProduct.qty;
}

function addToCart(andCheckout) {
  const p = currentProduct;
  const existing = cart.find(x => x.id === p.id);
  if (existing) existing.qty += p.qty;
  else cart.push({ id: p.id, name: p.name, price: p.price, icon: p.icon, qty: p.qty });
  saveCart();
  updateCartBadge();

  if (andCheckout) {
    closeProductModal();
    openCheckout();
  } else {
    closeProductModal();
    showToast(p.name + ' added to cart \uD83D\uDED2');
  }
}

// ── CHECKOUT FLOW ──────────────────────────────────────────
function openCheckout() {
  if (!cart.length) { showToast('Your cart is empty', 'info'); return; }
  checkoutStep = 1;
  renderCheckout();
  document.getElementById('sn-coOverlay').classList.add('active');
  document.getElementById('sn-checkoutModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('sn-coOverlay').classList.remove('active');
  document.getElementById('sn-checkoutModal').classList.remove('active');
  document.body.style.overflow = '';
}

function renderCheckout() {
  const modal = document.getElementById('sn-checkoutModal');
  const stepNames = ['Cart', 'Shipping', 'Payment', 'Confirm'];
  const stepBar = stepNames.map((s, i) =>
    '<div class="co-step ' + (i + 1 === checkoutStep ? 'active' : '') + ' ' + (i + 1 < checkoutStep ? 'done' : '') + '">' +
    '<div class="co-step-num">' + (i + 1 < checkoutStep ? '<i class="fas fa-check"></i>' : (i + 1)) + '</div>' +
    '<span>' + s + '</span></div>' +
    (i < stepNames.length - 1 ? '<div class="co-step-line"></div>' : '')
  ).join('');

  let body = '';

  if (checkoutStep === 1) {
    const rows = cart.map(item =>
      '<div class="co-cart-row" data-id="' + item.id + '">' +
      '<div class="co-cart-icon"><i class="fas ' + item.icon + '"></i></div>' +
      '<div class="co-cart-info"><p class="co-cart-name">' + item.name + '</p>' +
      '<div class="co-cart-controls">' +
      '<button onclick="changeCartQty(' + item.id + ',-1)">&#8722;</button>' +
      '<span>' + item.qty + '</span>' +
      '<button onclick="changeCartQty(' + item.id + ',1)">+</button>' +
      '<button class="co-remove" onclick="removeCartItem(' + item.id + ')"><i class="fas fa-trash"></i></button>' +
      '</div></div>' +
      '<div class="co-cart-price">' + fmt(item.price * item.qty) + '</div></div>'
    ).join('');
    const sub = cart.reduce((a, b) => a + b.price * b.qty, 0);
    const ship = sub >= 500 ? 0 : 79;
    body = '<div class="co-cart-list">' + rows + '</div>' +
      '<div class="co-summary">' +
      '<div class="co-summary-row"><span>Subtotal</span><span>' + fmt(sub) + '</span></div>' +
      '<div class="co-summary-row"><span>Shipping</span><span>' + (ship === 0 ? '<span class="free-tag">FREE</span>' : fmt(ship)) + '</span></div>' +
      '<div class="co-summary-row total"><span>Total</span><span>' + fmt(sub + ship) + '</span></div>' +
      '</div>';

  } else if (checkoutStep === 2) {
    body = '<div class="co-form">' +
      '<h3>Delivery Address</h3>' +
      '<div class="co-form-row">' +
      '<div class="co-field"><label>First Name</label><input type="text" placeholder="Name"/></div>' +
      '<div class="co-field"><label>Last Name</label><input type="text" placeholder="Last Name"/></div>' +
      '</div>' +
      '<div class="co-field"><label>Phone Number</label><input type="tel" placeholder="+63 9XX XXX XXXX"/></div>' +
      '<div class="co-field"><label>Street Address</label><input type="text" placeholder="House No., Street, Barangay"/></div>' +
      '<div class="co-form-row">' +
      '<div class="co-field"><label>City / Municipality</label><input type="text" placeholder="Sta. Barbara" value="Sta. Barbara"/></div>' +
      '<div class="co-field"><label>ZIP Code</label><input type="text" placeholder="5002" value="5002"/></div>' +
      '</div>' +
      '<div class="co-field"><label>Delivery Option</label>' +
      '<div class="co-delivery-opts">' +
      '<label class="co-radio"><input type="radio" name="delivery" value="standard" checked/>' +
      '<span><strong>Standard Delivery</strong><em>3\u201520 minutes &nbsp;&bull;&nbsp; FREE on \u20B1200+</em></span></label>' +
      '<label class="co-radio"><input type="radio" name="delivery" value="Saver"/>' +
      '<span><strong>Saver Delivery</strong><em>1\u201530 minutes &nbsp;&bull;&nbsp; \u20B1149</em></span></label>' +
      '<label class="co-radio"><input type="radio" name="delivery" value="Priority"/>' +
      '<span><strong>Priority Delivery</strong><em>1\u201515 minutes &nbsp;&bull;&nbsp; \u20B1149</em></span></label>' +
      '</div></div></div>';
      

  } else if (checkoutStep === 3) {
    body = '<div class="co-form">' +
      '<h3>Payment Method</h3>' +
      '<div class="co-pay-opts">' +
      '<label class="co-radio co-pay-radio"><input type="radio" name="payment" value="cod" checked/>' +
      '<span><i class="fas fa-money-bill-wave"></i><strong>Cash on Delivery</strong></span></label>' +
      '<label class="co-radio co-pay-radio"><input type="radio" name="payment" value="gcash"/>' +
      '<span><i class="fas fa-mobile-alt"></i><strong>GCash</strong></span></label>' +
      '</div>' +
      '<div id="sn-cardFields" style="display:none" class="co-card-fields">' +
      '<div class="co-field"><label>Card Number</label><input type="text" placeholder="1234 5678 9012 3456" maxlength="19"/></div>' +
      '<div class="co-form-row">' +
      '<div class="co-field"><label>Expiry</label><input type="text" placeholder="MM/YY" maxlength="5"/></div>' +
      '<div class="co-field"><label>CVV</label><input type="text" placeholder="123" maxlength="3"/></div>' +
      '</div>' +
      '<div class="co-field"><label>Name on Card</label><input type="text" placeholder="JUAN DELA CRUZ"/></div>' +
      '</div></div>';

  } else if (checkoutStep === 4) {
    const sub = cart.reduce((a, b) => a + b.price * b.qty, 0);
    const ship = sub >= 500 ? 0 : 79;
    const itemList = cart.map(i =>
      '<li><span>' + i.name + ' \u00D7 ' + i.qty + '</span><span>' + fmt(i.price * i.qty) + '</span></li>'
    ).join('');
    body = '<div class="co-confirm">' +
      '<div class="co-confirm-icon"><i class="fas fa-clipboard-check"></i></div>' +
      '<h3>Review Your Order</h3>' +
      '<ul class="co-confirm-items">' + itemList + '</ul>' +
      '<div class="co-summary">' +
      '<div class="co-summary-row"><span>Subtotal</span><span>' + fmt(sub) + '</span></div>' +
      '<div class="co-summary-row"><span>Shipping</span><span>' + (ship === 0 ? '<span class="free-tag">FREE</span>' : fmt(ship)) + '</span></div>' +
      '<div class="co-summary-row total"><span>Total</span><span>' + fmt(sub + ship) + '</span></div>' +
      '</div>' +
      '<p class="co-note"><i class="fas fa-shield-alt"></i> Your payment is protected by ShopNow Guarantee.</p>' +
      '</div>';
  }

  const nextLabel = checkoutStep === 4 ? 'Place Order' : 'Continue';
  const nextIcon  = checkoutStep === 4 ? 'fa-check-circle' : 'fa-arrow-right';
  const backBtn   = checkoutStep > 1
    ? '<button class="co-btn co-btn--back" onclick="goStep(-1)"><i class="fas fa-arrow-left"></i> Back</button>'
    : '<button class="co-btn co-btn--back" onclick="closeCheckout()">Cancel</button>';

  modal.innerHTML =
    '<div class="co-header">' +
    '<h2><i class="fas fa-shopping-bag"></i> Checkout</h2>' +
    '<button class="co-close" onclick="closeCheckout()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div class="co-steps">' + stepBar + '</div>' +
    '<div class="co-body">' + body + '</div>' +
    '<div class="co-footer">' + backBtn +
    '<button class="co-btn co-btn--next" onclick="goStep(1)">' + nextLabel + ' <i class="fas ' + nextIcon + '"></i></button>' +
    '</div>';

  if (checkoutStep === 3) {
    modal.querySelectorAll('input[name="payment"]').forEach(function(r) {
      r.addEventListener('change', function() {
        var cf = document.getElementById('sn-cardFields');
        if (cf) cf.style.display = this.value === 'card' ? 'block' : 'none';
      });
    });
  }
}

function goStep(delta) {
  if (delta === 1 && checkoutStep === 4) { placeOrder(); return; }
  checkoutStep = Math.max(1, Math.min(4, checkoutStep + delta));
  renderCheckout();
}

function changeCartQty(id, delta) {
  var item = cart.find(function(x) { return x.id === id; });
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  updateCartBadge();
  renderCheckout();
}

function removeCartItem(id) {
  cart = cart.filter(function(x) { return x.id !== id; });
  saveCart();
  updateCartBadge();
  if (!cart.length) { closeCheckout(); showToast('Cart is empty', 'info'); return; }
  renderCheckout();
}

function placeOrder() {
  closeCheckout();
  cart = [];
  saveCart();
  updateCartBadge();
  showOrderSuccess();
}

function showOrderSuccess() {
  var orderId = 'SN' + String(Date.now()).slice(-8).toUpperCase();
  document.getElementById('sn-orderId').textContent = orderId;
  document.getElementById('sn-successOverlay').classList.add('active');
  document.getElementById('sn-successModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSuccess() {
  document.getElementById('sn-successOverlay').classList.remove('active');
  document.getElementById('sn-successModal').classList.remove('active');
  document.body.style.overflow = '';
}

// ── INJECT MODAL HTML ──────────────────────────────────────
function injectModals() {
  var html =
    // Toast
    '<div id="sn-toast" class="sn-toast"></div>' +

    // Product modal overlay
    '<div id="sn-overlay" class="sn-overlay" onclick="closeProductModal()"></div>' +

    // Product modal
    '<div id="sn-productModal" class="sn-product-modal">' +
    '<button class="pm-close" onclick="closeProductModal()"><i class="fas fa-times"></i></button>' +
    '<div class="pm-body">' +
    '<div class="pm-icon"><i class="fas fa-box"></i></div>' +
    '<div class="pm-details">' +
    '<p class="pm-name"></p>' +
    '<div class="pm-stars"></div>' +
    '<div class="pm-prices">' +
    '<span class="pm-price-now"></span>' +
    '<span class="pm-price-old"></span>' +
    '<span class="pm-discount"></span>' +
    '</div>' +
    '<p class="pm-location"></p>' +
    '<div class="pm-qty">' +
    '<span>Quantity:</span>' +
    '<button onclick="changeQty(-1)">&#8722;</button>' +
    '<span class="pm-qty-val">1</span>' +
    '<button onclick="changeQty(1)">+</button>' +
    '</div>' +
    '<div class="pm-actions">' +
    '<button class="pm-btn pm-btn--cart" onclick="addToCart(false)"><i class="fas fa-cart-plus"></i> Add to Cart</button>' +
    '<button class="pm-btn pm-btn--buy" onclick="addToCart(true)"><i class="fas fa-bolt"></i> Buy Now</button>' +
    '</div></div></div></div>' +

    // Checkout overlay + modal
    '<div id="sn-coOverlay" class="sn-overlay" onclick="closeCheckout()"></div>' +
    '<div id="sn-checkoutModal" class="sn-checkout-modal"></div>' +

    // Success overlay + modal
    '<div id="sn-successOverlay" class="sn-overlay"></div>' +
    '<div id="sn-successModal" class="sn-success-modal">' +
    '<div class="success-icon"><i class="fas fa-check-circle"></i></div>' +
    '<h2>Order Placed!</h2>' +
    '<p>Thank you for shopping with ShopNow.</p>' +
    '<p class="order-id-label">Order ID: <strong id="sn-orderId"></strong></p>' +
    '<p class="success-sub">You\'ll receive a confirmation SMS shortly.</p>' +
    '<button class="co-btn co-btn--next" onclick="closeSuccess()" style="margin-top:24px;width:100%">Continue Shopping <i class="fas fa-arrow-right"></i></button>' +
    '</div>';

  var div = document.createElement('div');
  div.innerHTML = html;
  while (div.firstChild) document.body.appendChild(div.firstChild);
}

// ── CART ICON CLICK ────────────────────────────────────────
function initCartClick() {
  document.querySelectorAll('.cart-icon').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      openCheckout();
    });
  });
}

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  injectModals();
  injectProductIds();
  attachCardClicks();
  initCartClick();
  updateCartBadge();
});