// =====================================================================
//  Configuration de WorldUltimateRecords : le seul fichier à modifier.
//  Laisse "" pour une option que tu n'utilises pas.
// =====================================================================
window.WUR_CONFIG = {
  // --- Supabase (obligatoire pour le classement en ligne) ---
 supabaseUrl: "https://uhuxtytfuhisvaepulds.supabase.co",
  supabaseAnonKey: "sb_publishable_aXD1XTUedOt_6TBGwAjfsw_3GocAhMG",
  // --- Mentions légales (obligatoire avant de partager le site) ---
 editorName: "WorldUltimateRecords",
  contactEmail: "worldultimaterecords@outlook.com",
  siret: "",             // ton numéro SIRET de micro-entreprise, ex. "123 456 789 00012"
  tvaMention: "",        // ex. "TVA non applicable, art. 293 B du CGI" (si tu es en franchise de TVA)
  mediator: "",          // ton médiateur de la consommation, ex. "CM2C, www.cm2c.net"

  // --- Pass Néon (abonnement Stripe) ---
  passPrice: "2,99 €",
  stripePaymentLink: "", // lien de paiement Stripe MENSUEL, ex. "https://buy.stripe.com/xxxxxxxx"
  passPriceYearly: "24,99 €",
  stripePaymentLinkYearly: "", // lien de paiement Stripe ANNUEL (laisse vide pour ne proposer que le mensuel)
  stripePortalLink: "",  // lien du portail client Stripe, ex. "https://billing.stripe.com/p/login/xxxxxxxx"

  // --- Anti-robot Cloudflare Turnstile (recommandé) ---
  turnstileSiteKey: "",  // ex. "0x4AAAAAAA..."

  // --- Ta chaîne YouTube (facultatif) ---
  youtubeChannelUrl: "", // ex. "https://www.youtube.com/@WorldUltimateRecords"
  youtubeShorts: []      // identifiants de tes Shorts, ex. ["abcDEF12345"]
};
