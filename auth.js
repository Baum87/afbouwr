/**
 * Afbouwr — Authenticatie module
 *
 * Gebruik:
 *   Auth.inloggen(email, ww)                          → Promise<{ gebruiker, fout }>
 *   Auth.registreren(email, ww, { voornaam, achternaam, bedrijf })
 *                                                     → Promise<{ gebruiker, fout }>
 *   Auth.uitloggen()                                  → Promise<void>
 *   Auth.getSessie()                                  → Promise<{ user } | null>
 *   Auth.getMetadata()                                → Promise<{ voornaam, achternaam, bedrijf, email }>
 *   Auth.profielBijwerken({ voornaam, achternaam, bedrijf, wachtwoord })
 *                                                     → Promise<{ fout }>
 *   Auth.onAuthVerandering(fn)                        → luistert naar login/logout events
 */

'use strict';

const Auth = (() => {

  function client() {
    return window.getSupabase ? window.getSupabase() : null;
  }

  // ── Inloggen ────────────────────────────────────────────────────────────────

  async function inloggen(email, wachtwoord) {
    const sb = client();
    if (!sb) return { gebruiker: null, fout: 'Supabase niet beschikbaar.' };

    const { data, error } = await sb.auth.signInWithPassword({ email, password: wachtwoord });
    return {
      gebruiker: data?.user || null,
      fout: error ? vertaalFout(error.message) : null,
    };
  }

  // ── Registreren ─────────────────────────────────────────────────────────────

  async function registreren(email, wachtwoord, meta = {}) {
    const sb = client();
    if (!sb) return { gebruiker: null, fout: 'Supabase niet beschikbaar.' };

    const { data, error } = await sb.auth.signUp({
      email,
      password: wachtwoord,
      options: {
        data: {
          voornaam:   (meta.voornaam   || '').trim(),
          achternaam: (meta.achternaam || '').trim(),
          bedrijf:    (meta.bedrijf    || '').trim(),
        },
      },
    });
    return {
      gebruiker: data?.user || null,
      fout: error ? vertaalFout(error.message) : null,
    };
  }

  // ── Uitloggen ────────────────────────────────────────────────────────────────

  async function uitloggen() {
    const sb = client();
    if (!sb) return;
    await sb.auth.signOut();
  }

  // ── Sessie ophalen (async, betrouwbaar) ──────────────────────────────────────

  async function getSessie() {
    const sb = client();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  }

  // ── Metadata van ingelogde gebruiker ─────────────────────────────────────────

  async function getMetadata() {
    const sb = client();
    if (!sb) return {};
    const { data } = await sb.auth.getUser();
    const user = data?.user;
    if (!user) return {};
    return {
      email:      user.email       || '',
      voornaam:   user.user_metadata?.voornaam   || '',
      achternaam: user.user_metadata?.achternaam || '',
      bedrijf:    user.user_metadata?.bedrijf    || '',
    };
  }

  // ── Profiel bijwerken ────────────────────────────────────────────────────────

  async function profielBijwerken({ voornaam, achternaam, bedrijf, wachtwoord }) {
    const sb = client();
    if (!sb) return { fout: 'Supabase niet beschikbaar.' };

    const updates = {
      data: {
        voornaam:   (voornaam   || '').trim(),
        achternaam: (achternaam || '').trim(),
        bedrijf:    (bedrijf    || '').trim(),
      },
    };
    if (wachtwoord) updates.password = wachtwoord;

    const { error } = await sb.auth.updateUser(updates);
    return { fout: error ? vertaalFout(error.message) : null };
  }

  // ── Auth-state listener ──────────────────────────────────────────────────────

  function onAuthVerandering(callback) {
    const sb = client();
    if (!sb) return;
    sb.auth.onAuthStateChange((_event, sessie) => {
      callback(sessie?.user || null);
    });
  }

  // ── Foutmeldingen vertalen naar Nederlands ───────────────────────────────────

  function vertaalFout(msg) {
    if (!msg) return 'Onbekende fout.';
    if (msg.includes('Invalid login credentials'))   return 'E-mailadres of wachtwoord is onjuist.';
    if (msg.includes('Email not confirmed'))         return 'Bevestig eerst je e-mailadres via de mail die je ontvangen hebt.';
    if (msg.includes('User already registered'))     return 'Er bestaat al een account met dit e-mailadres.';
    if (msg.includes('Password should be'))          return 'Wachtwoord moet minimaal 6 tekens bevatten.';
    if (msg.includes('rate limit'))                  return 'Te veel pogingen. Probeer het later opnieuw.';
    if (msg.includes('Email address') && msg.includes('invalid')) return 'Vul een geldig e-mailadres in.';
    return msg;
  }

  return { inloggen, registreren, uitloggen, getSessie, getMetadata, profielBijwerken, onAuthVerandering };

})();

window.Auth = Auth;
