// WorldUltimateRecords : réception des paiements Stripe (Pass Néon)
// Supabase > Edge Functions > nom : stripe-webhook > "Verify JWT" DÉSACTIVÉ
// Secrets nécessaires (Edge Functions > Secrets) : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
import Stripe from "npm:stripe@23.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const db = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Fin de période : sur l'abonnement (anciennes versions de l'API) ou sur ses lignes (versions récentes)
function periodEnd(sub: any): string | null {
  const ts = sub?.current_period_end ??
    Math.min(...((sub?.items?.data ?? []).map((i: any) => i.current_period_end).filter(Boolean)));
  return Number.isFinite(ts) ? new Date(ts * 1000).toISOString() : null;
}
const custId = (c: any) => (typeof c === "string" ? c : c?.id ?? null);

async function saveForUser(userId: string, sub: any) {
  const { error } = await db.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: custId(sub.customer),
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end: periodEnd(sub),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
}

async function saveBySubscription(sub: any) {
  const { data, error } = await db.from("subscriptions").update({
    status: sub.status,
    current_period_end: periodEnd(sub),
    stripe_customer_id: custId(sub.customer),
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", sub.id).select("user_id");
  if (error) throw error;
  // Abonnement inconnu (ex. événement reçu avant checkout.session.completed) : on retrouve le joueur via les métadonnées
  if (!data?.length && UUID.test(sub.metadata?.user_id ?? "")) await saveForUser(sub.metadata.user_id, sub);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Méthode non autorisée", { status: 405 });
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: any;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature ?? "", Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "", undefined, cryptoProvider);
  } catch (_e) {
    return new Response("Signature invalide", { status: 400 });
  }
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const userId = s.client_reference_id;
        if (s.mode === "subscription" && s.subscription && UUID.test(userId ?? "")) {
          const subId = typeof s.subscription === "string" ? s.subscription : s.subscription.id;
          // on note le joueur dans l'abonnement pour les événements suivants
          const sub = await stripe.subscriptions.update(subId, { metadata: { user_id: userId } });
          await saveForUser(userId, sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await saveBySubscription(event.data.object);
        break;
    }
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response("Erreur de traitement", { status: 500 });
  }
});
