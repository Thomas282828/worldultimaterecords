// WorldUltimateRecords : mot de passe lié au pseudo
// Supabase > Edge Functions > nom : pseudo-account ("Verify JWT" peut rester ACTIVÉ)
// Aucun secret à ajouter : SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase.
//
// Deux actions :
//  - { action: "set-password", password }        : protège le compte connecté par un mot de passe
//  - { action: "login", pseudo, password, captchaToken? } : renvoie une session pour ce pseudo
import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const admin = createClient(URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// Adresse technique (jamais utilisée pour envoyer un e-mail : le domaine .invalid n'existe pas)
const techEmail = (id: string) => `${id}@joueurs.wur.invalid`;
const MAX_FAILS = 10, WINDOW_MIN = 15;

async function setPassword(req: Request, body: any) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: { user }, error } = await admin.auth.getUser(jwt);
  if (error || !user) return json({ error: "Session invalide : recharge la page." }, 401);
  const password = String(body.password ?? "");
  if (password.length < 8 || password.length > 72) return json({ error: "Le mot de passe doit faire 8 à 72 caractères." }, 400);
  const { data: prof } = await admin.from("profiles").select("pseudo").eq("user_id", user.id).maybeSingle();
  if (!prof) return json({ error: "Choisis d'abord un pseudo." }, 400);
  const patch: Record<string, unknown> = { password, app_metadata: { ...(user.app_metadata ?? {}), pw: true } };
  if (!user.email) { patch.email = techEmail(user.id); patch.email_confirm = true; }
  const { error: e2 } = await admin.auth.admin.updateUserById(user.id, patch);
  if (e2) return json({ error: e2.message }, 400);
  return json({ ok: true });
}

async function login(body: any) {
  const pseudo = String(body.pseudo ?? "").trim(), password = String(body.password ?? "");
  if (!pseudo || !password) return json({ error: "Pseudo ou mot de passe incorrect." }, 400);
  const key = pseudo.toLowerCase();
  const since = new Date(Date.now() - WINDOW_MIN * 60000).toISOString();
  const { count } = await admin.from("login_failures").select("id", { count: "exact", head: true }).eq("pseudo", key).gte("created_at", since);
  if ((count ?? 0) >= MAX_FAILS) return json({ error: "Trop d'essais pour ce pseudo. Réessaie dans 15 minutes." }, 429);
  const fail = async () => { await admin.from("login_failures").insert({ pseudo: key }); return json({ error: "Pseudo ou mot de passe incorrect." }, 400); };
  const esc = pseudo.replace(/[\\%_]/g, (m) => "\\" + m);
  const { data: rows } = await admin.from("profiles").select("user_id,pseudo").ilike("pseudo", esc).limit(5);
  const prof = (rows ?? []).find((r: any) => String(r.pseudo).toLowerCase() === key);
  if (!prof) return fail();
  const { data: u } = await admin.auth.admin.getUserById(prof.user_id);
  const email = u?.user?.email;
  if (!email || !u?.user?.app_metadata?.pw) return fail();
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const opts = body.captchaToken ? { captchaToken: String(body.captchaToken) } : undefined;
  const { data, error } = await client.auth.signInWithPassword({ email, password, options: opts } as any);
  if (error || !data?.session) return fail();
  return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === "set-password") return await setPassword(req, body);
    if (body.action === "login") return await login(body);
    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
