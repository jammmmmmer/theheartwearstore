// lib/translations.ts
export type Lang = 'en' | 'fr'

export const t = {
  en: {
    // Nav
    nav_home: 'Home',
    nav_shop: 'Shop',
    nav_about: 'About',
    nav_cart: 'Cart',
    nav_open_cart: 'Open cart',
    nav_items: 'items',
    nav_item: 'item',

    // Hero
    hero_eyebrow: 'Print on demand · Made to order',
    hero_heading_line1: 'Wear Your',
    hero_heading_line2: 'Heart',
    hero_body: 'Natural clothing that speaks across generations. Every piece made with purpose, printed on demand — so nothing goes to waste.',
    hero_cta_shop: 'Shop Now',
    hero_cta_story: 'Our Story',
    hero_trust_1: 'No minimums',
    hero_trust_2: 'Ships to Canada & USA',
    hero_trust_3: 'Secure checkout',

    // Featured collection (homepage)
    featured_eyebrow: 'New arrivals',
    featured_heading: 'Featured Collection',
    featured_view_all: 'View all styles →',
    featured_coming_soon: 'Our collection is coming soon.',
    featured_coming_soon_sub: 'Check back shortly — great things are being made.',

    // Our Promise
    promise_eyebrow: 'Why us',
    promise_heading: 'Our Promise',
    promise_1_title: 'Made to Order',
    promise_1_body: 'Every piece is printed when you order it — zero overproduction, zero waste.',
    promise_2_title: 'Natural Ethos',
    promise_2_body: 'We care about what touches your skin and what stays on this earth.',
    promise_3_title: 'For Everyone',
    promise_3_body: 'Timeless designs that speak across generations — because good taste has no age.',

    // CTA banner
    cta_heading: 'Something made just for you',
    cta_body: 'Browse our full collection and find a piece that feels like it was made with your heart in mind. Because it was.',
    cta_button: 'Shop the Collection',

    // Footer
    footer_tagline: 'Made with love. Printed with purpose.',
    footer_explore: 'Explore',
    footer_legal: 'Legal',
    footer_privacy: 'Privacy Policy',
    footer_terms: 'Terms of Service',
    footer_contact: 'Contact',
    footer_copyright: 'The Heartwear Store. All rights reserved.',
    footer_canada: 'Thoughtfully made in Canada.',

    // Shop page
    shop_eyebrow: 'Handpicked for you',
    shop_heading: 'The Collection',
    shop_count_single: 'style available',
    shop_count_plural: 'styles available',
    shop_empty: 'Our collection is on its way.',
    shop_empty_sub: "We're curating something special. Check back soon — every piece is worth the wait.",

    // Product detail
    product_from: 'From',
    product_add_to_cart: 'Add to Cart',
    product_added: 'Added to Cart',
    product_buy_now: 'Buy Now',
    product_redirecting: 'Redirecting...',
    product_select_prompt: 'Please select',
    product_trust_1: 'Printed on demand — unique to your order',
    product_trust_2: 'Ships within 3–7 business days',
    product_trust_3: 'Free exchanges for sizing issues',
    product_trust_4: 'Secure checkout via Stripe',

    // Cart
    cart_title: 'Your Cart',
    cart_empty: 'Your cart is empty.',
    cart_continue: 'Continue Shopping',
    cart_subtotal: 'Subtotal',
    cart_shipping_note: 'Shipping and taxes calculated at checkout.',
    cart_checkout: 'Checkout',
    cart_clear: 'Clear cart',
    cart_or: 'or',

    // Success
    success_heading: 'Order Confirmed',
    success_body: "Thank you for your purchase. You'll receive a confirmation email shortly. Your order will be printed and shipped with love.",
    success_next_eyebrow: 'What happens next',
    success_next_1: 'Your order goes straight to our print partner',
    success_next_2: 'Each piece is made just for you — no mass production',
    success_next_3: 'Shipping typically takes 3–7 business days',
    success_next_4: "You'll get a shipping notification by email",
    success_keep_shopping: 'Keep Shopping',
    success_home: 'Back to Home',
    success_quote: '"Made with love. Printed with purpose."',

    // Cancel
    cancel_heading: 'No worries',
    cancel_body: "Your order wasn't completed. Your cart is still waiting for you — nothing has been charged.",
    cancel_quote: '"Good things don\'t rush. Come back when it feels right."',
    cancel_shop: 'Back to Shop',
    cancel_home: 'Back to Home',

    // About page
    about_eyebrow: 'Our story',
    about_heading_1: 'Clothing that carries',
    about_heading_2: 'something real',
    about_intro: 'The Heartwear Store was born from a simple belief — that what you wear should reflect what you care about. Not trends. Not logos. Just meaning.',
    about_p1: 'It started, as most honest things do, with a question: Why is it so hard to find clothing that feels like it was made for a real person? Not a demographic. Not a market segment. A person — with a history, a family, a quiet love for the world.',
    about_p2: 'We are a small, Canadian brand built on the idea that clothing can carry more than a body. It can carry a feeling. A memory. A way of seeing the world. The Heartwear Store makes pieces for the people who believe that — across every age, background, and generation.',
    about_p3: 'Every item in our collection is printed on demand, exactly when you order it. There is no warehouse full of unsold stock. No waste. No excess. Just your piece, made for you, when you want it.',
    about_p4: 'We partner with responsible print providers who share our commitment to quality and care. From the softness of the fabric to the depth of the print, every detail is chosen with intention.',
    about_quote: '"Wear your heart. Everything else is just fabric."',
    about_p5: 'We are grateful you are here. Whether this is your first visit or your tenth order, thank you for believing that the small choices — what we wear, how it is made, who we support — matter.',
    about_p6: 'They do.',
    about_values_eyebrow: 'What we stand for',
    about_values_heading: 'Our Values',
    about_val_1_title: 'Made with Intention',
    about_val_1_body: 'Every design begins with a feeling — something true, something worth wearing. We believe clothing should mean something, not just fill a drawer.',
    about_val_2_title: 'Zero Waste by Design',
    about_val_2_body: 'Nothing is printed until you order it. No overstock, no landfill, no waste. Each piece exists because someone wanted it.',
    about_val_3_title: 'Gentle on the Earth',
    about_val_3_body: 'We choose print partners who share our values — quality materials, responsible production, and a genuine care for what we leave behind.',
    about_val_4_title: 'Made for Everyone',
    about_val_4_body: 'Our designs speak across generations. Whether you are eight or eighty, there is something here that was made with your heart in mind.',
    about_promise_eyebrow: 'Our promise to you',
    about_promise_heading: 'Every order, made with care',
    about_promise_p1: 'When you order from The Heartwear Store, your piece is created specifically for you. If something is ever wrong — the fit, the print, anything — reach out. We will make it right.',
    about_promise_p2: 'Free exchanges for sizing issues. Real people on the other end of every message.',
    about_cta_shop: 'Shop the Collection',
    about_cta_contact: 'Get in Touch',

    // Contact page
    contact_eyebrow: "We're here",
    contact_heading: 'Get in Touch',
    contact_intro: 'A real person reads every message. We aim to respond within one business day.',
    contact_reach_heading: 'Reach us directly',
    contact_email_label: 'hello@theheartwearstore.ca',
    contact_email_sub: 'We reply within 1 business day',
    contact_response_title: 'Response time',
    contact_response_body: 'Monday to Friday, within 24 hours. We read every message.',
    contact_exchange_title: 'Returns & exchanges',
    contact_exchange_body: 'Free size exchanges within 30 days. Replacements for any damaged items, no questions asked.',
    contact_based_title: 'Based in Canada',
    contact_based_body: 'We are a small Canadian brand. When you write to us, you are writing to the people who built this.',
    contact_quote: '"Made with love. Printed with purpose."',
    contact_faq_heading: 'Common questions',
    contact_cta_body: 'Not sure what to order? Browse the collection — every piece is made with you in mind.',
    contact_cta_button: 'Shop the Collection',
    contact_faq: [
      { q: 'How long does shipping take?', a: 'Orders are printed and shipped within 3–7 business days. Standard shipping takes 5–10 days; express is 2–4 days. You will receive a tracking number by email once your order ships.' },
      { q: 'Can I exchange my item for a different size?', a: 'Yes — we offer free size exchanges. If your item does not fit right, email us within 30 days of delivery and we will sort it out. No hassle.' },
      { q: 'My order arrived damaged. What do I do?', a: 'We are sorry to hear that. Please email us a photo of the issue and your order number and we will send a replacement at no charge.' },
      { q: 'Can I cancel or change my order?', a: 'Because every piece is printed on demand, we can only make changes within 24 hours of placing your order. Email us as soon as possible and we will do our best.' },
      { q: 'Do you ship outside Canada and the USA?', a: 'Currently we ship to Canada and the United States. We are working on expanding — stay tuned.' },
      { q: 'What are your garments made from?', a: 'Our tees are made from 100% combed ring-spun cotton — soft, breathable, and built to last. Specific fabric details are listed on each product page.' },
    ],

    // Privacy page
    privacy_eyebrow: 'Legal',
    privacy_heading: 'Privacy Policy',
    privacy_updated: 'Last updated: March 2026',

    // Terms page
    terms_eyebrow: 'Legal',
    terms_heading: 'Terms of Service',
    terms_updated: 'Last updated: March 2026',

    // Shared
    link_privacy: 'Privacy Policy →',
    link_terms: 'Terms of Service →',
    link_contact: 'Contact Us →',
  },

  fr: {
    // Nav
    nav_home: 'Accueil',
    nav_shop: 'Boutique',
    nav_about: 'À propos',
    nav_cart: 'Panier',
    nav_open_cart: 'Ouvrir le panier',
    nav_items: 'articles',
    nav_item: 'article',

    // Hero
    hero_eyebrow: 'Imprimé à la demande · Fait sur commande',
    hero_heading_line1: 'Portez votre',
    hero_heading_line2: 'Cœur',
    hero_body: "Des vêtements naturels qui parlent à toutes les générations. Chaque pièce faite avec soin, imprimée à la demande — rien n'est gaspillé.",
    hero_cta_shop: 'Magasiner',
    hero_cta_story: 'Notre histoire',
    hero_trust_1: 'Sans minimum',
    hero_trust_2: 'Livraison au Canada et aux États-Unis',
    hero_trust_3: 'Paiement sécurisé',

    // Featured collection (homepage)
    featured_eyebrow: 'Nouveautés',
    featured_heading: 'Collection vedette',
    featured_view_all: 'Voir tous les styles →',
    featured_coming_soon: 'Notre collection arrive bientôt.',
    featured_coming_soon_sub: 'Revenez bientôt — de belles choses sont en cours.',

    // Our Promise
    promise_eyebrow: 'Pourquoi nous',
    promise_heading: 'Notre engagement',
    promise_1_title: 'Fait sur commande',
    promise_1_body: 'Chaque pièce est imprimée au moment de votre commande — zéro surproduction, zéro gaspillage.',
    promise_2_title: 'Éthique naturelle',
    promise_2_body: 'Nous prenons soin de ce qui touche votre peau et de ce que nous laissons à la terre.',
    promise_3_title: 'Pour tout le monde',
    promise_3_body: "Des designs intemporels qui parlent à toutes les générations — parce que le bon goût n'a pas d'âge.",

    // CTA banner
    cta_heading: 'Quelque chose fait pour vous',
    cta_body: "Parcourez notre collection et trouvez une pièce qui semble avoir été faite avec votre cœur en tête. Parce que c'est le cas.",
    cta_button: 'Voir la collection',

    // Footer
    footer_tagline: 'Fait avec amour. Imprimé avec intention.',
    footer_explore: 'Explorer',
    footer_legal: 'Légal',
    footer_privacy: 'Politique de confidentialité',
    footer_terms: "Conditions d'utilisation",
    footer_contact: 'Contact',
    footer_copyright: 'The Heartwear Store. Tous droits réservés.',
    footer_canada: 'Fait au Canada avec soin.',

    // Shop page
    shop_eyebrow: 'Sélectionnés pour vous',
    shop_heading: 'La collection',
    shop_count_single: 'style disponible',
    shop_count_plural: 'styles disponibles',
    shop_empty: 'Notre collection arrive bientôt.',
    shop_empty_sub: "Nous préparons quelque chose de spécial. Revenez bientôt — chaque pièce vaut l'attente.",

    // Product detail
    product_from: 'À partir de',
    product_add_to_cart: 'Ajouter au panier',
    product_added: 'Ajouté au panier',
    product_buy_now: 'Acheter maintenant',
    product_redirecting: 'Redirection...',
    product_select_prompt: 'Veuillez sélectionner',
    product_trust_1: 'Imprimé à la demande — unique à votre commande',
    product_trust_2: 'Expédié dans les 3 à 7 jours ouvrables',
    product_trust_3: 'Échanges gratuits pour les problèmes de taille',
    product_trust_4: 'Paiement sécurisé via Stripe',

    // Cart
    cart_title: 'Votre panier',
    cart_empty: 'Votre panier est vide.',
    cart_continue: 'Continuer les achats',
    cart_subtotal: 'Sous-total',
    cart_shipping_note: 'Livraison et taxes calculées à la caisse.',
    cart_checkout: 'Passer à la caisse',
    cart_clear: 'Vider le panier',
    cart_or: 'ou',

    // Success
    success_heading: 'Commande confirmée',
    success_body: 'Merci pour votre achat. Vous recevrez un courriel de confirmation sous peu. Votre commande sera imprimée et expédiée avec amour.',
    success_next_eyebrow: 'La suite',
    success_next_1: "Votre commande est transmise directement à notre partenaire d'impression",
    success_next_2: 'Chaque pièce est faite pour vous — sans production de masse',
    success_next_3: 'La livraison prend généralement 3 à 7 jours ouvrables',
    success_next_4: "Vous recevrez une notification d'expédition par courriel",
    success_keep_shopping: 'Continuer les achats',
    success_home: "Retour à l'accueil",
    success_quote: '« Fait avec amour. Imprimé avec intention. »',

    // Cancel
    cancel_heading: 'Pas de souci',
    cancel_body: "Votre commande n'a pas été finalisée. Votre panier vous attend toujours — aucun montant n'a été débité.",
    cancel_quote: '« Les bonnes choses ne se précipitent pas. Revenez quand le moment est venu. »',
    cancel_shop: 'Retour à la boutique',
    cancel_home: "Retour à l'accueil",

    // About page
    about_eyebrow: 'Notre histoire',
    about_heading_1: 'Des vêtements qui portent',
    about_heading_2: 'quelque chose de vrai',
    about_intro: "The Heartwear Store est né d'une conviction simple — que ce que vous portez devrait refléter ce qui vous tient à cœur. Pas les tendances. Pas les logos. Juste du sens.",
    about_p1: "Tout a commencé, comme la plupart des choses honnêtes, par une question : Pourquoi est-il si difficile de trouver des vêtements qui semblent avoir été faits pour une vraie personne ? Pas un groupe démographique. Pas un segment de marché. Une personne — avec une histoire, une famille, un amour discret pour le monde.",
    about_p2: "Nous sommes une petite marque canadienne fondée sur l'idée que les vêtements peuvent porter plus qu'un corps. Ils peuvent porter un sentiment. Un souvenir. Une façon de voir le monde. The Heartwear Store crée des pièces pour ceux qui y croient — à travers chaque âge, chaque origine, chaque génération.",
    about_p3: "Chaque article de notre collection est imprimé à la demande, exactement au moment où vous le commandez. Il n'y a pas d'entrepôt rempli de stocks invendus. Pas de gaspillage. Pas d'excès. Juste votre pièce, faite pour vous, quand vous le souhaitez.",
    about_p4: "Nous travaillons avec des partenaires d'impression responsables qui partagent notre engagement envers la qualité et le soin. De la douceur du tissu à la profondeur de l'impression, chaque détail est choisi avec intention.",
    about_quote: '« Portez votre cœur. Le reste, c\'est juste du tissu. »',
    about_p5: "Nous sommes reconnaissants que vous soyez ici. Que ce soit votre première visite ou votre dixième commande, merci de croire que les petits choix — ce que nous portons, comment c'est fabriqué, qui nous soutenons — ont de l'importance.",
    about_p6: "Ils en ont.",
    about_values_eyebrow: 'Ce en quoi nous croyons',
    about_values_heading: 'Nos valeurs',
    about_val_1_title: 'Fait avec intention',
    about_val_1_body: "Chaque design commence par un sentiment — quelque chose de vrai, quelque chose qui mérite d'être porté. Nous croyons que les vêtements devraient avoir du sens.",
    about_val_2_title: 'Zéro gaspillage par conception',
    about_val_2_body: "Rien n'est imprimé avant votre commande. Pas de surstock, pas de décharge, pas de gaspillage. Chaque pièce existe parce que quelqu'un la voulait.",
    about_val_3_title: 'Doux pour la terre',
    about_val_3_body: 'Nous choisissons des partenaires d\'impression qui partagent nos valeurs — matériaux de qualité, production responsable, et un véritable souci de ce que nous laissons derrière nous.',
    about_val_4_title: 'Pour tout le monde',
    about_val_4_body: 'Nos designs parlent à toutes les générations. Que vous ayez huit ou quatre-vingts ans, il y a quelque chose ici qui a été fait avec votre cœur en tête.',
    about_promise_eyebrow: 'Notre promesse',
    about_promise_heading: 'Chaque commande, faite avec soin',
    about_promise_p1: "Lorsque vous commandez chez The Heartwear Store, votre pièce est créée spécialement pour vous. Si quelque chose ne va pas — la coupe, l'impression, quoi que ce soit — contactez-nous. Nous arrangerons les choses.",
    about_promise_p2: 'Échanges gratuits pour les problèmes de taille. De vraies personnes à l\'autre bout de chaque message.',
    about_cta_shop: 'Voir la collection',
    about_cta_contact: 'Nous contacter',

    // Contact page
    contact_eyebrow: 'Nous sommes là',
    contact_heading: 'Nous contacter',
    contact_intro: 'Une vraie personne lit chaque message. Nous répondons dans un délai d\'un jour ouvrable.',
    contact_reach_heading: 'Nous joindre directement',
    contact_email_label: 'hello@theheartwearstore.ca',
    contact_email_sub: 'Réponse dans un jour ouvrable',
    contact_response_title: 'Délai de réponse',
    contact_response_body: 'Du lundi au vendredi, dans les 24 heures. Nous lisons chaque message.',
    contact_exchange_title: 'Retours et échanges',
    contact_exchange_body: 'Échanges de taille gratuits dans les 30 jours. Remplacement pour tout article endommagé, sans questions.',
    contact_based_title: 'Basé au Canada',
    contact_based_body: 'Nous sommes une petite marque canadienne. Quand vous nous écrivez, vous écrivez aux personnes qui ont construit ceci.',
    contact_quote: '« Fait avec amour. Imprimé avec intention. »',
    contact_faq_heading: 'Questions fréquentes',
    contact_cta_body: 'Vous ne savez pas quoi commander ? Parcourez la collection — chaque pièce est faite pour vous.',
    contact_cta_button: 'Voir la collection',
    contact_faq: [
      { q: 'Combien de temps prend la livraison ?', a: "Les commandes sont imprimées et expédiées dans les 3 à 7 jours ouvrables. La livraison standard prend 5 à 10 jours ; l'express, 2 à 4 jours. Vous recevrez un numéro de suivi par courriel dès l'expédition." },
      { q: 'Puis-je échanger mon article pour une autre taille ?', a: 'Oui — nous offrons des échanges de taille gratuits. Si votre article ne va pas, envoyez-nous un courriel dans les 30 jours suivant la livraison et nous réglerons cela. Sans tracas.' },
      { q: 'Ma commande est arrivée endommagée. Que faire ?', a: 'Nous sommes désolés. Envoyez-nous une photo du problème et votre numéro de commande et nous vous enverrons un remplacement sans frais.' },
      { q: 'Puis-je annuler ou modifier ma commande ?', a: "Parce que chaque pièce est imprimée à la demande, nous ne pouvons apporter des modifications que dans les 24 heures suivant la commande. Écrivez-nous dès que possible et nous ferons notre possible." },
      { q: 'Livrez-vous en dehors du Canada et des États-Unis ?', a: "Pour l'instant, nous livrons au Canada et aux États-Unis. Nous travaillons à élargir notre portée — restez à l'affût." },
      { q: 'De quoi sont faits vos vêtements ?', a: "Nos t-shirts sont en coton peigné filé en anneau à 100 % — doux, respirant et durable. Les détails du tissu sont indiqués sur chaque page produit." },
    ],

    // Privacy page
    privacy_eyebrow: 'Légal',
    privacy_heading: 'Politique de confidentialité',
    privacy_updated: 'Dernière mise à jour : mars 2026',

    // Terms page
    terms_eyebrow: 'Légal',
    terms_heading: "Conditions d'utilisation",
    terms_updated: 'Dernière mise à jour : mars 2026',

    // Shared
    link_privacy: 'Politique de confidentialité →',
    link_terms: "Conditions d'utilisation →",
    link_contact: 'Nous contacter →',
  },
} as const

export type TranslationKey = keyof typeof t.en
