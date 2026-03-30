'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/language-context'

export default function PrivacyPage() {
  const { tr, lang } = useTranslation()

  return (
    <div className="bg-stone-950 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">

      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest text-sage-500 mb-3">{tr.privacy_eyebrow}</p>
        <h1 className="font-playfair text-4xl text-stone-50 mb-4">{tr.privacy_heading}</h1>
        <p className="text-stone-400 text-sm">{tr.privacy_updated}</p>
      </div>

      {lang === 'fr' ? (
        <div className="prose prose-stone max-w-none space-y-10 text-stone-400 text-[0.95rem] leading-relaxed">

          <section className="space-y-3">
            <h2 className="font-playfair text-xl text-stone-50">1. Qui nous sommes</h2>
            <p>
              The Heartwear Store («&nbsp;nous&nbsp;», «&nbsp;notre&nbsp;» ou «&nbsp;nos&nbsp;») exploite le site web{' '}
              <span className="font-medium text-stone-300">www.theheartwearstore.ca</span>. Nous sommes une marque canadienne de vêtements imprimés à la demande. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos renseignements personnels lorsque vous visitez notre site ou effectuez un achat.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">2. Renseignements que nous collectons</h2>
            <p>Nous collectons les renseignements que vous nous fournissez directement, notamment :</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Nom et adresse courriel (lors d&apos;une commande ou d&apos;un contact)</li>
              <li>Adresse de livraison et numéro de téléphone (pour l&apos;exécution des commandes)</li>
              <li>Informations de paiement — traitées de façon sécurisée par Stripe ; nous ne stockons jamais vos coordonnées bancaires</li>
              <li>Historique des commandes et contenu du panier</li>
            </ul>
            <p>Nous collectons également des données techniques limitées automatiquement, telles que votre adresse IP, le type de navigateur et les pages visitées, afin d&apos;assurer le bon fonctionnement du site.</p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">3. Utilisation de vos renseignements</h2>
            <p>Nous utilisons vos renseignements pour :</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Traiter et exécuter vos commandes</li>
              <li>Envoyer des confirmations de commande et des mises à jour d&apos;expédition</li>
              <li>Répondre à vos questions et demandes de soutien</li>
              <li>Améliorer notre site web et notre offre de produits</li>
              <li>Respecter nos obligations légales</li>
            </ul>
            <p>Nous ne vendons pas vos renseignements personnels à des tiers. Nous n&apos;envoyons pas de courriels de marketing à moins que vous n&apos;y consentiez explicitement.</p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">4. Services tiers</h2>
            <p>Nous collaborons avec des partenaires de confiance pour fournir notre service :</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><span className="font-medium text-stone-300">Stripe</span> — traitement des paiements. Vos données de paiement sont entièrement gérées par Stripe et sont soumises à leur politique de confidentialité.</li>
              <li><span className="font-medium text-stone-300">Printify</span> — impression et exécution. Votre adresse de livraison est partagée avec Printify pour produire et expédier votre commande.</li>
              <li><span className="font-medium text-stone-300">Netlify</span> — hébergement du site web.</li>
              <li><span className="font-medium text-stone-300">Supabase</span> — base de données sécurisée pour les dossiers de commandes.</li>
            </ul>
            <p>Chacun de ces services opère selon ses propres politiques de confidentialité et pratiques de protection des données.</p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">5. Conservation des données</h2>
            <p>
              Nous conservons vos informations de commande aussi longtemps que nécessaire pour remplir les objectifs décrits dans cette politique, ou tel que requis par la loi. Vous pouvez demander la suppression de vos données personnelles à tout moment en nous écrivant.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">6. Vos droits</h2>
            <p>Vous avez le droit de :</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Accéder aux données personnelles que nous détenons à votre sujet</li>
              <li>Demander la correction de renseignements inexacts</li>
              <li>Demander la suppression de vos données</li>
              <li>Retirer votre consentement lorsque le traitement est basé sur celui-ci</li>
            </ul>
            <p>Pour exercer l&apos;un de ces droits, veuillez nous contacter à <a href="mailto:hello@theheartwearstore.ca" className="text-sage-400 underline underline-offset-2 hover:text-sage-300">hello@theheartwearstore.ca</a>.</p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">7. Témoins (cookies)</h2>
            <p>
              Nous utilisons des témoins essentiels pour maintenir le fonctionnement de votre panier entre les pages. Nous n&apos;utilisons pas de témoins publicitaires ou de suivi. Vous pouvez désactiver les témoins dans les paramètres de votre navigateur, bien que cela puisse affecter certaines fonctionnalités du site.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">8. Modifications de cette politique</h2>
            <p>
              Nous pouvons mettre à jour cette politique de temps à autre. Dans ce cas, nous mettrons à jour la date en haut de cette page. L&apos;utilisation continue du site après les modifications constitue une acceptation de la politique mise à jour.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">9. Contact</h2>
            <p>
              Des questions sur cette politique ? Rejoignez-nous à{' '}
              <a href="mailto:hello@theheartwearstore.ca" className="text-sage-400 underline underline-offset-2 hover:text-sage-300">
                hello@theheartwearstore.ca
              </a>.
            </p>
          </section>

        </div>
      ) : (
        <div className="prose prose-stone max-w-none space-y-10 text-stone-400 text-[0.95rem] leading-relaxed">

          <section className="space-y-3">
            <h2 className="font-playfair text-xl text-stone-50">1. Who we are</h2>
            <p>
              The Heartwear Store (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the website{' '}
              <span className="font-medium text-stone-300">www.theheartwearstore.ca</span>. We are a Canadian print-on-demand clothing brand. This Privacy Policy explains how we collect, use, and protect your personal information when you visit our site or make a purchase.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">2. Information we collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Name and email address (when placing an order or contacting us)</li>
              <li>Shipping address and phone number (for order fulfillment)</li>
              <li>Payment information — processed securely by Stripe; we never store your card details</li>
              <li>Order history and cart contents</li>
            </ul>
            <p>We also collect limited technical data automatically, such as your IP address, browser type, and pages visited, to keep the site running smoothly.</p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">3. How we use your information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Respond to your questions and support requests</li>
              <li>Improve our website and product offerings</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p>We do not sell your personal information to third parties. We do not send marketing emails unless you explicitly opt in.</p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">4. Third-party services</h2>
            <p>We work with trusted partners to deliver our service:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><span className="font-medium text-stone-300">Stripe</span> — payment processing. Your payment data is handled entirely by Stripe and is subject to their privacy policy.</li>
              <li><span className="font-medium text-stone-300">Printify</span> — print and fulfillment. Your shipping address is shared with Printify to produce and ship your order.</li>
              <li><span className="font-medium text-stone-300">Netlify</span> — website hosting.</li>
              <li><span className="font-medium text-stone-300">Supabase</span> — secure database for order records.</li>
            </ul>
            <p>Each of these services operates under their own privacy policies and data protection practices.</p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">5. Data retention</h2>
            <p>
              We retain your order information for as long as necessary to fulfill the purposes described in this policy, or as required by law. You may request deletion of your personal data at any time by emailing us.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">6. Your rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p>To exercise any of these rights, please contact us at <a href="mailto:hello@theheartwearstore.ca" className="text-sage-400 underline underline-offset-2 hover:text-sage-300">hello@theheartwearstore.ca</a>.</p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">7. Cookies</h2>
            <p>
              We use essential cookies to keep your shopping cart working between pages. We do not use advertising or tracking cookies. You can disable cookies in your browser settings, though this may affect some site functionality.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">8. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. When we do, we will update the date at the top of this page. Continued use of the site after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">9. Contact</h2>
            <p>
              Questions about this policy? Reach us at{' '}
              <a href="mailto:hello@theheartwearstore.ca" className="text-sage-400 underline underline-offset-2 hover:text-sage-300">
                hello@theheartwearstore.ca
              </a>.
            </p>
          </section>

        </div>
      )}

      <div className="mt-14 pt-8 border-t border-stone-800 flex flex-col sm:flex-row gap-4">
        <Link href="/terms" className="text-sm text-stone-400 hover:text-stone-50 underline underline-offset-2 transition-colors">
          {tr.link_terms}
        </Link>
        <Link href="/contact" className="text-sm text-stone-400 hover:text-stone-50 underline underline-offset-2 transition-colors">
          {tr.link_contact}
        </Link>
      </div>

    </div>
  )
}
