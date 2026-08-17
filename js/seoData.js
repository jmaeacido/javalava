/**
 * Temporary mini SEO database — paste approved Google Sheet values here.
 * Apply into static HTML via `npm run seo:apply` (see scripts/apply-seo.js).
 * Paths follow the live site routes on www.javalava.rocks.
 */
'use strict';

const SITE_URL = 'https://www.javalava.rocks';
const BRAND_NAME = 'Java Lava';
const DEFAULT_OG_IMAGE = 'https://www.javalava.rocks/assets/og.jpg';

/** @typedef {{
 *   title: string,
 *   description: string,
 *   path: string,
 *   file: string,
 *   focusKeyword?: string,
 *   socialTitle?: string,
 *   socialDescription?: string,
 *   ogTitle?: string,
 *   ogDescription?: string,
 *   ogImage?: string,
 *   noIndex?: boolean,
 * }} SeoEntry */

/** @type {Record<string, SeoEntry>} */
const seoData = {
  home: {
    title: 'Java Lava — Premium Coffee Liqueur',
    description:
      'Java Lava is a premium coffee liqueur born from volcanic soil — ethically sourced Arabica, Caribbean rum and blue agave. Ignite the flow.',
    path: '/',
    file: 'index.html',
    focusKeyword: 'premium coffee liqueur',
    ogDescription:
      'Born from volcanic soil. Ethically sourced Arabica, Caribbean rum and blue agave. Ignite the flow.',
  },
  shop: {
    title: 'Shop — Java Lava Coffee Liqueur',
    description:
      'Shop Java Lava Coffee Liqueur — 750ml, 20% ABV. Ethically sourced Arabica, Caribbean rum and blue agave. $35.99.',
    path: '/shop',
    file: 'shop.html',
    focusKeyword: 'Java Lava coffee liqueur',
  },
  merch: {
    title: 'Merch — Java Lava',
    description: 'Shop Java Lava apparel, hoodies, crews, tanks, and branded essentials.',
    path: '/merch',
    file: 'merch.html',
    focusKeyword: 'Java Lava merch',
  },
  story: {
    title: 'Our Story — Java Lava',
    description:
      'Born from volcanic soil. The story behind Java Lava — ethically sourced Arabica, Caribbean rum and blue agave.',
    path: '/story',
    file: 'story.html',
    focusKeyword: 'Java Lava story',
  },
  locator: {
    title: 'Store Locations — Java Lava',
    description: 'Find Java Lava Coffee Liqueur at a stockist near you, or order online.',
    path: '/locator',
    file: 'locator.html',
    focusKeyword: 'Java Lava store locator',
  },
  contact: {
    title: 'Contact — Java Lava',
    description: 'Get in touch with Java Lava — stockist enquiries, press, and customer support.',
    path: '/contact',
    file: 'contact.html',
    focusKeyword: 'contact Java Lava',
  },
  '404': {
    title: 'Page Not Found — Java Lava',
    description:
      'This Java Lava page could not be found. Return home to explore the coffee liqueur, shop, merch, and store locations.',
    path: '/404',
    file: '404.html',
    noIndex: true,
  },
  'privacy-policy': {
    title: 'Privacy Policy — Java Lava',
    description: 'Java Lava Privacy Policy for website, order, marketing, and AccelPay-related data.',
    path: '/privacy-policy',
    file: 'privacy-policy.html',
    focusKeyword: 'Java Lava privacy policy',
  },
  'refund-policy': {
    title: 'Refund & Cancellation Policy — Java Lava',
    description:
      'Java Lava refund and cancellation policy for alcohol orders, damages, incorrect items, and AccelPay support.',
    path: '/refund-policy',
    file: 'refund-policy.html',
    focusKeyword: 'Java Lava refund policy',
  },
  'shipping-policy': {
    title: 'Shipping Policy — Java Lava',
    description:
      'Java Lava shipping policy, delivery timelines, adult signature requirements, and support contacts.',
    path: '/shipping-policy',
    file: 'shipping-policy.html',
    focusKeyword: 'Java Lava shipping policy',
  },
  'terms-conditions': {
    title: 'Terms & Conditions — Java Lava',
    description:
      'Java Lava terms and conditions for website use, alcohol purchase requirements, AccelPay checkout, and support.',
    path: '/terms-conditions',
    file: 'terms-conditions.html',
    focusKeyword: 'Java Lava terms and conditions',
  },
  'accessibility-statement': {
    title: 'Accessibility Statement — Java Lava',
    description: 'Java Lava accessibility statement and feedback contact information.',
    path: '/accessibility-statement',
    file: 'accessibility-statement.html',
    focusKeyword: 'Java Lava accessibility',
  },
  admin: {
    title: 'Admin — Java Lava',
    description: 'Java Lava compact admin for merch and mailing records.',
    path: '/admin',
    file: 'admin.html',
    noIndex: true,
  },
  'email-admin': {
    title: 'Email Admin — Java Lava',
    description: 'Java Lava mailing and contact record admin.',
    path: '/email-admin',
    file: 'email-admin.html',
    noIndex: true,
  },
  'merch-admin': {
    title: 'Merch Admin — Java Lava',
    description: 'Manage Java Lava merch products and availability notifications.',
    path: '/merch-admin',
    file: 'merch-admin.html',
    noIndex: true,
  },
  blog: {
    title: 'Blog — Java Lava',
    description: 'Cocktail recipes, coffee culture, and spirit stories from the Java Lava team.',
    path: '/blog',
    file: 'blog.html',
    focusKeyword: 'Java Lava blog',
    ogDescription: 'Cocktail recipes, coffee culture, and spirit stories from the Java Lava team.',
  },
  'blog-post': {
    title: 'Blog — Java Lava',
    description: 'Java Lava blog post.',
    path: '/blog',
    file: 'blog-post.html',
    noIndex: false,
  },
  'blog-admin': {
    title: 'Blog Admin — Java Lava',
    description: 'Java Lava blog post management.',
    path: '/blog-admin',
    file: 'blog-admin.html',
    noIndex: true,
  },
};

module.exports = {
  SITE_URL,
  BRAND_NAME,
  DEFAULT_OG_IMAGE,
  seoData,
};
