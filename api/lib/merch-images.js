const MERCH_IMAGES = {
  'java-lava-dark-roast-long-sleeve': 'Java Lava Dark Roast Long Sleeve.png',
  'java-lava-emerald-brew-tank': 'Java Lava Emerald Brew Tank.png',
  'java-lava-espresso-reserve-tee': 'Java Lava Espresso Reserve Tee.png',
  'java-lava-frosted-cappuccino-zip-hoodie': 'Java Lava Frosted Cappuccino Zip Hoodie.png',
  'java-lava-midnight-roast-tee': 'Java Lava Midnight Roast Tee.png',
  'java-lava-mocha-quarter-zip': 'Java Lava Mocha Quarter-Zip.png',
  'java-lava-plum-mocha-long-sleeve': 'Java Lava Plum Mocha Long Sleeve.png',
  'java-lava-rose-latte-tee': 'Java Lava Rose Latte Tee.png',
  'java-lava-silver-roast-quarter-zip': 'Java Lava Silver Roast Quarter-Zip.png',
  'java-lava-silver-roast-tee': 'Java Lava Silver Roast Tee.png',
  'java-lava-vanilla-bean-tee': 'Java Lava Vanilla Bean Tee.png',
  'java-lava-vanilla-cream-hoodie': 'Java Lava Vanilla Cream Hoodie.png'
};

const VARIANT_IMAGES = {
  'java-lava-silver-roast-quarter-zip:midnight-roast': 'Java Lava Midnight Roast Quarter-Zip Back View.png'
};

function merchImageUrl(productId, variantId) {
  const file = VARIANT_IMAGES[`${productId}:${variantId}`] || MERCH_IMAGES[productId];
  return file ? `/assets/merch/${encodeURIComponent(file)}` : '';
}

function merchProductUrl(productId, variantId) {
  if (!productId) return 'merch';
  const product = encodeURIComponent(productId);
  const variant = variantId ? `&variant=${encodeURIComponent(variantId)}` : '';
  return `merch?product=${product}${variant}`;
}

module.exports = { merchImageUrl, merchProductUrl };
