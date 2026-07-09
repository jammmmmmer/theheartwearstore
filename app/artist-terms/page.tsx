import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Artist Terms',
  description: 'Terms for artists submitting designs to The Heartwear Store.',
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-playfair text-xl text-stone-100 mt-10 mb-3">{children}</h2>
)

export default function ArtistTermsPage() {
  return (
    <main className="min-h-screen bg-stone-950 px-4 py-16">
      <div className="max-w-2xl mx-auto text-stone-400 text-sm leading-relaxed">
        <h1 className="font-playfair text-3xl text-stone-50 mb-2">Artist Terms</h1>
        <p className="text-stone-600 text-xs mb-10">Version française ci-dessous · Last updated July 8, 2026</p>

        <SectionTitle>1. Your work, your rights</SectionTitle>
        <p>
          You confirm that every design you submit is your own original work and does not infringe
          any copyright, trademark, or personality right. You keep full ownership of your designs.
          By submitting, you grant The Heartwear Store a non-exclusive, worldwide licence to
          reproduce the design on products, and to display it for promotion of the store, for as
          long as the design is listed. You can request removal of your designs at any time.
        </p>

        <SectionTitle>2. Moderation</SectionTitle>
        <p>
          Every submission is reviewed before going on sale. We may decline any design at our
          discretion — including anything hateful, infringing, or off-brand. Designs suspected of
          infringing third-party rights will be removed, and repeated infringement ends the account.
        </p>

        <SectionTitle>3. Earnings</SectionTitle>
        <p>
          You earn 10% of the item price (excluding shipping and taxes) on every sale of a product
          carrying your design, in the currency of the sale. Earnings accrue automatically and are
          visible in your dashboard. Payouts are made manually (Interac e-Transfer or PayPal) once
          your accrued balance reaches $25, on request. Amounts are before any taxes you may owe;
          you are responsible for your own tax reporting.
        </p>

        <SectionTitle>4. Takedowns (DMCA / notice-and-notice)</SectionTitle>
        <p>
          Rights holders can report infringing designs to the contact address on our Contact page.
          We respond promptly, remove content where warranted, and notify the submitting artist.
        </p>

        <hr className="border-stone-800 my-12" />

        <h1 className="font-playfair text-3xl text-stone-50 mb-2">Conditions pour artistes</h1>
        <p className="text-stone-600 text-xs mb-10">Dernière mise à jour : 8 juillet 2026</p>

        <SectionTitle>1. Vos œuvres, vos droits</SectionTitle>
        <p>
          Vous confirmez que chaque motif soumis est votre création originale et n’enfreint aucun
          droit d’auteur, marque de commerce ou droit à l’image. Vous conservez la pleine propriété
          de vos motifs. En soumettant, vous accordez à The Heartwear Store une licence non
          exclusive et mondiale pour reproduire le motif sur des produits et l’afficher à des fins
          promotionnelles, tant que le motif est en vente. Vous pouvez demander le retrait de vos
          motifs en tout temps.
        </p>

        <SectionTitle>2. Modération</SectionTitle>
        <p>
          Chaque soumission est révisée avant la mise en vente. Nous pouvons refuser tout motif à
          notre discrétion — notamment tout contenu haineux, contrefait ou hors de l’image de
          marque. Les motifs soupçonnés de contrefaçon seront retirés; toute récidive entraîne la
          fermeture du compte.
        </p>

        <SectionTitle>3. Gains</SectionTitle>
        <p>
          Vous gagnez 10 % du prix de l’article (avant livraison et taxes) sur chaque vente d’un
          produit portant votre motif, dans la devise de la vente. Les gains s’accumulent
          automatiquement et sont visibles dans votre tableau de bord. Les paiements sont effectués
          manuellement (virement Interac ou PayPal) dès que votre solde atteint 25 $, sur demande.
          Vous êtes responsable de vos propres déclarations fiscales.
        </p>

        <SectionTitle>4. Retraits (avis et avis / DMCA)</SectionTitle>
        <p>
          Les titulaires de droits peuvent signaler un motif contrefait à l’adresse indiquée sur
          notre page Contact. Nous répondons rapidement, retirons le contenu au besoin et avisons
          l’artiste concerné.
        </p>
      </div>
    </main>
  )
}
