/* ============================================================
   ShopNow – Product Modal + Cart + Checkout + Search Logic
   ============================================================ */

// ── PRODUCT DATA ──────────────────────────────────────────
const products = [
    { id:101, name:'Fresh Kangkong Bundle',         price:25,  oldPrice:null, discount:0,  rating:5, sold:'320',  icon:'fa-leaf',           location:'Sta. Barbara', category:'vegetable' },
      { id:103, name:'Tomato 1kg Pack',               price:80,  oldPrice:100,  discount:20, rating:5, sold:'540',  icon:'fa-apple-alt',      location:'Sta. Barbara', category:'vegetable' },
      { id:201, name:'Pork Liempo (Belly) 500g',      price:185, oldPrice:220,  discount:16, rating:5, sold:'890',  icon:'fa-drumstick-bite', location:'Sta. Barbara', category:'meat' },
      { id:202, name:'Chicken Breast 1kg',            price:220, oldPrice:260,  discount:15, rating:4, sold:'1.2k', icon:'fa-drumstick-bite', location:'Sta. Barbara', category:'meat' },
      { id:301, name:'Bangus (Milkfish) 500g',        price:120, oldPrice:150,  discount:20, rating:5, sold:'1.1k', icon:'fa-fish',           location:'Sta. Barbara', category:'seafood' },
      { id:303, name:'Hipon (Shrimp) 250g',           price:180, oldPrice:220,  discount:18, rating:5, sold:'650',  icon:'fa-fish',           location:'Sta. Barbara', category:'seafood' },
      { id:401, name:'Lucky Me Pancit Canton 5-pack', price:55,  oldPrice:null, discount:0,  rating:5, sold:'2.3k', icon:'fa-store',          location:'Sta. Barbara', category:'sarisari' },
      { id:404, name:'Milo 300g Pack',                price:120, oldPrice:null, discount:0,  rating:5, sold:'950',  icon:'fa-store',          location:'Sta. Barbara', category:'sarisari' },
      { id:501, name:'Wilkins Mineral Water 1L x6',   price:99,  oldPrice:120,  discount:18, rating:5, sold:'1.5k', icon:'fa-tint',           location:'Sta. Barbara', category:'drinks' },
      { id:502, name:'Coca-Cola 1.5L',                price:65,  oldPrice:null, discount:0,  rating:4, sold:'2.2k', icon:'fa-wine-bottle',    location:'Sta. Barbara', category:'drinks' },
    ];

        document.addEventListener('DOMContentLoaded', function() {
      if (typeof categoryProducts !== 'undefined') {
        categoryProducts.forEach(function(p) {
          if (!products.find(function(x) { return x.id === p.id; })) {
            products.push(p);
          }
        });
      }
    });

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

// ── SEARCH ────────────────────────────────────────────────
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text, query) {
  if (!query) return text;
  return text.replace(
    new RegExp('(' + escapeRegex(query) + ')', 'gi'),
    '<mark style="background:#ffe680;color:#5a4000;border-radius:2px;padding:0 1px">$1</mark>'
  );
}

function filterProducts(query) {
  const q = query.trim().toLowerCase();
  let shown = 0;

  document.querySelectorAll('.product-card').forEach(function(card) {
    const id = Number(card.dataset.productId);
    const product = products.find(function(p) { return p.id === id; });
    if (!product) return;

    const matches = !q || product.name.toLowerCase().includes(q);
    card.style.display = matches ? '' : 'none';
    if (matches) shown++;

    // Store original name text once, then highlight on match
    const nameEl = card.querySelector('.product-name, .product-title, h3, h4, p.name, [class*="name"]');
    if (nameEl) {
      if (nameEl.dataset.originalText === undefined) {
        nameEl.dataset.originalText = nameEl.textContent;
      }
      nameEl.innerHTML = (matches && q)
        ? highlightText(nameEl.dataset.originalText, query.trim())
        : nameEl.dataset.originalText;
    }
  });

  // Show/hide section headings when all cards in that section are hidden
  ['flash-sale', 'recommended'].forEach(function(sectionClass) {
    const section = document.querySelector('.' + sectionClass);
    if (!section) return;
    const visibleCards = section.querySelectorAll('.product-card:not([style*="display: none"])');
    const heading = section.querySelector('h2, h3, .section-title');
    if (heading) heading.style.display = visibleCards.length === 0 ? 'none' : '';
  });

  // Empty state message
  var emptyMsg = document.getElementById('sn-search-empty');
  if (!emptyMsg) {
    emptyMsg = document.createElement('div');
    emptyMsg.id = 'sn-search-empty';
    emptyMsg.style.cssText = [
      'text-align:center',
      'padding:3rem 1rem',
      'color:#999',
      'font-size:15px',
      'display:none'
    ].join(';');
    emptyMsg.innerHTML = '<i class="fas fa-search" style="font-size:32px;display:block;margin-bottom:12px;opacity:0.4"></i>No products found for "<span id="sn-search-term"></span>"';
    var lastSection = document.querySelector('.recommended') || document.querySelector('.flash-sale');
    if (lastSection) lastSection.after(emptyMsg);
    else document.body.appendChild(emptyMsg);
  }

  if (shown === 0 && q) {
    emptyMsg.style.display = 'block';
    var termEl = document.getElementById('sn-search-term');
    if (termEl) termEl.textContent = query.trim();
  } else {
    emptyMsg.style.display = 'none';
  }

  // Update result count hint on the search input if it has a sibling hint element
  var hint = document.getElementById('sn-search-count');
  if (hint) {
    hint.textContent = q
      ? (shown + ' result' + (shown !== 1 ? 's' : '') + ' found')
      : '';
  }
}

function initSearch() {
  // Try common search input selectors — adjust the selector to match your HTML
  var input = document.querySelector(
    'input[type="search"], ' +
    '.search-bar input, ' +
    '.search-input, ' +
    'input[placeholder*="earch"]'
  );

  if (!input) {
    console.warn('ShopNow search: no search input found. Check your selector in initSearch().');
    return;
  }

  // Live filter as the user types
  input.addEventListener('input', function() {
    filterProducts(this.value);
  });

  // Also handle Enter key (optional, for keyboards)
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      this.value = '';
      filterProducts('');
    }
  });

  // Clear search when input is cleared via the browser's native X button
  input.addEventListener('search', function() {
    filterProducts(this.value);
  });
}

// ── CATEGORY LINKS ──────────────────────────────────────────
// Each category shortcut already links to category.html?cat=... in the
// HTML, so clicking it navigates to that page in the same tab by default.
// (No extra JS needed — kept as a no-op for compatibility.)
function initCategoryClicks() {}

// ── INJECT DATA-IDS onto existing cards ───────────────────
function injectProductIds() {
  // Only assign an id to cards that don't already have one in the HTML.
  document.querySelectorAll('.flash-sale .product-card').forEach(function(card, i) {
    if (!card.dataset.productId) card.dataset.productId = i + 1;
  });
  document.querySelectorAll('.recommended .product-card').forEach(function(card, i) {
    if (!card.dataset.productId) card.dataset.productId = i + 6;
  });
}

// ── ATTACH CLICK TO ALL PRODUCT CARDS ─────────────────────
function attachCardClicks() {
  document.querySelectorAll('.product-card').forEach(function(card) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function(e) {
      if (e.target.closest('.wishlist-btn')) return;
      const idx = this.dataset.productId;
      if (idx) openProductModal(Number(idx));
    });
  });

  document.querySelectorAll('.wishlist-btn').forEach(function(btn) {
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
  const p = products.find(function(x) { return x.id === id; });
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
  const existing = cart.find(function(x) { return x.id === p.id; });
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
  const stepBar = stepNames.map(function(s, i) {
    return '<div class="co-step ' + (i + 1 === checkoutStep ? 'active' : '') + ' ' + (i + 1 < checkoutStep ? 'done' : '') + '">' +
      '<div class="co-step-num">' + (i + 1 < checkoutStep ? '<i class="fas fa-check"></i>' : (i + 1)) + '</div>' +
      '<span>' + s + '</span></div>' +
      (i < stepNames.length - 1 ? '<div class="co-step-line"></div>' : '');
  }).join('');

  let body = '';

  if (checkoutStep === 1) {
    const rows = cart.map(function(item) {
      return '<div class="co-cart-row" data-id="' + item.id + '">' +
        '<div class="co-cart-icon"><i class="fas ' + item.icon + '"></i></div>' +
        '<div class="co-cart-info"><p class="co-cart-name">' + item.name + '</p>' +
        '<div class="co-cart-controls">' +
        '<button onclick="changeCartQty(' + item.id + ',-1)">&#8722;</button>' +
        '<span>' + item.qty + '</span>' +
        '<button onclick="changeCartQty(' + item.id + ',1)">+</button>' +
        '<button class="co-remove" onclick="removeCartItem(' + item.id + ')"><i class="fas fa-trash"></i></button>' +
        '</div></div>' +
        '<div class="co-cart-price">' + fmt(item.price * item.qty) + '</div></div>';
    }).join('');
    const sub = cart.reduce(function(a, b) { return a + b.price * b.qty; }, 0);
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
      '<div class="co-field"><label>First Name</label><input type="text" placeholder="First Name"/></div>' +
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
    const sub = cart.reduce(function(a, b) { return a + b.price * b.qty; }, 0);
    const ship = sub >= 500 ? 0 : 79;
    const itemList = cart.map(function(i) {
      return '<li><span>' + i.name + ' \u00D7 ' + i.qty + '</span><span>' + fmt(i.price * i.qty) + '</span></li>';
    }).join('');
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
  initSearch();
  initCategoryClicks();
});
