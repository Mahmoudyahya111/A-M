// TELEGANT owner-only password management. Service key stays on the server.
// Actions: set_password {email, password}  |  generate_password {email}  (server makes the password, returns it once, never stores or logs it)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const reply = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
function gen() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', S = '!@#$%*-_';
  const r = (n: number) => { const b = new Uint32Array(1); let x; do { crypto.getRandomValues(b); x = b[0]; } while (x >= 4294967296 - (4294967296 % n)); return x % n; };
  const c: string[] = []; for (let i = 0; i < 12; i++) c.push(A[r(A.length)]); c.push(S[r(S.length)]); c.push(String(r(10)));
  for (let i = c.length - 1; i > 0; i--) { const j = r(i + 1); [c[i], c[j]] = [c[j], c[i]]; }
  return c.join('');
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: u, error: ue } = jwt ? await admin.auth.getUser(jwt) : { data: null, error: true } as any;
  if (ue || !u?.user) return reply({ error: 'Not signed in' }, 401);
  const { data: me } = await admin.from('profiles').select('role,status').eq('id', u.user.id).maybeSingle();
  if (!me || me.role !== 'owner' || me.status !== 'approved') return reply({ error: 'Owner only' }, 403);
  let b: any; try { b = await req.json(); } catch { return reply({ error: 'Bad request' }, 400); }
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return reply({ error: 'Enter a valid email' }, 400);
  const { data: t } = await admin.from('profiles').select('id,role').eq('email', email).maybeSingle();
  if (!t) return reply({ error: 'No account with this email' }, 404);
  if (t.role === 'owner' && t.id !== u.user.id) return reply({ error: "Another owner's password can only be changed by that owner" }, 403);
  let pw: string;
  if (b.action === 'generate_password') pw = gen();
  else if (b.action === 'set_password') { pw = String(b.password ?? ''); if (pw.length < 8) return reply({ error: 'Password must be at least 8 characters' }, 400); }
  else return reply({ error: 'Unknown action' }, 400);
  const r = await admin.auth.admin.updateUserById(t.id, { password: pw, email_confirm: true });
  if (r.error) return reply({ error: r.error.message }, 400);
  return reply(b.action === 'generate_password' ? { ok: true, password: pw } : { ok: true });
});
