'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/language-context'

export default function TermsPage() {
  const { tr, lang } = useTranslation()

  return (
    <div className="bg-stone-950 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">

      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest text-sage-500 mb-3">{tr.terms_eyebrow}</p>
        <h1 className="font-playfair text-4xl text-stone-50 mb-4">{tr.terms_heading}</h1>
        <p className="text-stone-400 text-sm">{tr.terms_updated}</p>
      </div>

      {lang === 'fr' ? (
        <div className="space-y-10 text-stone-400 text-[0.95rem] leading-relaxed">

          <section className="space-y-3">
            <h2 className="font-playfair text-xl text-stone-50">1. Aperçu général</h2>
            <p>
              En visitant et en passant une commande sur <span className="font-medium text-stone-300">www.theheartwearstore.ca</span>, vous acceptez d&apos;être lié par ces conditions d&apos;utilisation. Veuillez les lire attentivement. Ces conditions s&apos;appliquent à tous les utilisateurs du site, y compris les visiteurs, les clients et les contributeurs.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">2. Produits</h2>
            <p>
              Tous les produits sont fabriqués sur commande et imprimés à la demande. Les images des produits sont représentatives du design — de légères variations de couleur peuvent survenir selon votre écran. Nous faisons de notre mieux pour assurer une représentation fidèle.
            </p>
            <p>
              Nous nous réservons le droit de retirer tout produit à tout moment sans préavis.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">3. Prix et paiement</h2>
            <p>
              Tous les prix sont en dollars canadiens (CAD), sauf indication contraire. Les prix sont susceptibles de changer sans préavis. Nous nous réservons le droit de refuser ou d&apos;annuler toute commande en cas d&apos;erreur de prix.
            </p>
            <p>
              Le paiement est traité de manière sécurisée par Stripe. Nous acceptons les principales cartes de crédit et, le cas échéant, Apple Pay et Google Pay. Nous ne conservons pas vos informations de paiement.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">4. Expédition et livraison</h2>
            <p>
              Les commandes sont généralement imprimées et expédiées dans les 3 à 7 jours ouvrables. Les délais de livraison varient selon la destination et le mode d&apos;expédition choisi à la caisse. Nous livrons au Canada et aux États-Unis.
            </p>
            <p>
              Nous ne sommes pas responsables des retards causés par les transporteurs, les douanes ou des circonstances hors de notre contrôle. Un numéro de suivi vous sera fourni dès l&apos;expédition de votre commande.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">5. Retours et échanges</h2>
            <p>
              Parce que chaque article est fabriqué spécialement pour vous, nous n&apos;acceptons pas les retours pour changement d&apos;avis. Cependant :
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Si votre article arrive endommagé ou défectueux, nous le remplacerons sans frais. Envoyez-nous une photo par courriel dans les 30 jours suivant la livraison.</li>
              <li>Si la taille ne convient pas, nous offrons des échanges gratuits dans les 30 jours suivant la livraison. Contactez-nous pour les modalités.</li>
            </ul>
            <p>
              Pour demander un échange ou signaler un problème, écrivez-nous à <a href="mailto:hello@theheartwearstore.ca" className="text-sage-400 underline underline-offset-2 hover:text-sage-300">hello@theheartwearstore.ca</a> avec votre numéro de commande et les détails.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">6. Annulations</h2>
            <p>
              Parce que la production commence peu après la passation d&apos;une commande, les annulations ne peuvent être acceptées que dans les 24 heures suivant l&apos;achat. Veuillez nous contacter immédiatement si vous devez annuler. Après 24 heures, votre commande sera en production et ne pourra être annulée.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">7. Propriété intellectuelle</h2>
            <p>
              Tous les designs, contenus et éléments de marque présents sur ce site web sont la propriété de The Heartwear Store et ne peuvent être reproduits, copiés ou distribués sans autorisation écrite.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">8. Limitation de responsabilité</h2>
            <p>
              The Heartwear Store ne sera pas responsable des dommages indirects, accessoires ou consécutifs découlant de l&apos;utilisation de nos produits ou de notre site web. Notre responsabilité totale envers vous ne dépassera pas le montant payé pour la commande en question.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">9. Droit applicable</h2>
            <p>
              Ces conditions sont régies par les lois du Canada et de la province de l&apos;Ontario. Tout litige sera résolu devant les tribunaux de l&apos;Ontario.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">10. Modifications des conditions</h2>
            <p>
              Nous pouvons réviser ces conditions à tout moment. La date mise à jour en haut de cette page reflétera les modifications. L&apos;utilisation continue du site après les mises à jour constitue une acceptation des conditions révisées.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">11. Contact</h2>
            <p>
              Des questions sur ces conditions ? Nous sommes toujours heureux d&apos;aider. Écrivez-nous à{' '}
              <a href="mailto:hello@theheartwearstore.ca" className="text-sage-400 underline underline-offset-2 hover:text-sage-300">
                hello@theheartwearstore.ca
              </a>.
            </p>
          </section>

        </div>
      ) : (
        <div className="space-y-10 text-stone-400 text-[0.95rem] leading-relaxed">

          <section className="space-y-3">
            <h2 className="font-playfair text-xl text-stone-50">1. Overview</h2>
            <p>
              By visiting and placing an order through <span className="font-medium text-stone-300">www.theheartwearstore.ca</span>, you agree to be bound by these Terms of Service. Please read them carefully. These terms apply to all users of the site, including browsers, customers, and contributors.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">2. Products</h2>
            <p>
              All products are made to order and printed on demand. Product images are representative of the design — slight variations in colour may occur depending on your screen. We do our best to ensure accurate representation.
            </p>
            <p>
              We reserve the right to discontinue any product at any time without notice.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">3. Pricing & payment</h2>
            <p>
              All prices are in Canadian dollars (CAD) unless otherwise stated. Prices are subject to change without notice. We reserve the right to refuse or cancel any order if a pricing error occurs.
            </p>
            <p>
              Payment is processed securely by Stripe. We accept major credit cards and, where available, Apple Pay and Google Pay. We do not store your payment information.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">4. Shipping & delivery</h2>
            <p>
              Orders are typically printed and dispatched within 3–7 business days. Delivery times vary by destination and shipping method selected at checkout. We ship to Canada and the United States.
            </p>
            <p>
              We are not responsible for delays caused by carriers, customs, or circumstances outside our control. Tracking information will be provided once your order ships.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">5. Returns & exchanges</h2>
            <p>
              Because every item is made specifically for you, we do not accept returns for change of mind. However:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>If your item arrives damaged or defective, we will replace it at no cost. Email us a photo within 30 days of delivery.</li>
              <li>If the size is not right, we offer free exchanges within 30 days of delivery. Contact us to arrange.</li>
            </ul>
            <p>
              To request an exchange or report an issue, email us at <a href="mailto:hello@theheartwearstore.ca" className="text-sage-400 underline underline-offset-2 hover:text-sage-300">hello@theheartwearstore.ca</a> with your order number and details.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">6. Cancellations</h2>
            <p>
              Because production begins shortly after an order is placed, cancellations can only be accepted within 24 hours of purchase. Please contact us immediately if you need to cancel. After 24 hours, your order will be in production and cannot be cancelled.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">7. Intellectual property</h2>
            <p>
              All designs, content, and branding on this website are the property of The Heartwear Store and may not be reproduced, copied, or distributed without written permission.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">8. Limitation of liability</h2>
            <p>
              The Heartwear Store shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website. Our total liability to you shall not exceed the amount paid for the order in question.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">9. Governing law</h2>
            <p>
              These terms are governed by the laws of Canada and the province of Ontario. Any disputes shall be resolved in the courts of Ontario.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">10. Changes to these terms</h2>
            <p>
              We may revise these terms at any time. The updated date at the top of this page will reflect any changes. Continued use of the site after updates constitutes acceptance of the revised terms.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-800 pt-8">
            <h2 className="font-playfair text-xl text-stone-50">11. Contact</h2>
            <p>
              Questions about these terms? We are always happy to help. Email us at{' '}
              <a href="mailto:hello@theheartwearstore.ca" className="text-sage-400 underline underline-offset-2 hover:text-sage-300">
                hello@theheartwearstore.ca
              </a>.
            </p>
          </section>

        </div>
      )}

      <div className="mt-14 pt-8 border-t border-stone-800 flex flex-col sm:flex-row gap-4">
        <Link href="/privacy" className="text-sm text-stone-400 hover:text-stone-50 underline underline-offset-2 transition-colors">
          {tr.link_privacy}
        </Link>
        <Link href="/contact" className="text-sm text-stone-400 hover:text-stone-50 underline underline-offset-2 transition-colors">
          {tr.link_contact}
        </Link>
      </div>

    </div>
  )
}
