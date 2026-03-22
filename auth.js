/**
 * Afbouwr — Authenticatie module
 *
 * Biedt login, registratie, logout en sessie-beheer via Supabase Auth.
 * De calculators gebruiken dit om projecten in de cloud op te slaan.
 *
 * Gebruik:
 *   Auth.getGebruiker()            → huidige ingelogde gebruiker of null
 *   Auth.isIngelogd()              → boolean
 *   Auth.inloggen(email, ww)       → Promise<{ gebruiker, fout }>
 *   Auth.registreren(email, ww)    → Promise<{ gebruiker, fout }>
 *   Auth.uitloggen()               → Promise<void>
 *   Auth.onAuthVerandering(fn)     → luistert naar login/logout events
 */

'use strict';

const Auth = (() => {

  function client() {
    return window.getSupabase ? window.getSupabase() : null;
  }

  async function inloggen(email, wachtwoord) {
    const sb = client();
    if (!sb) return { gebruiker: null, fout: 'Supabase niet beschikbaar.' };

    const { data, error } = await sb.auth.signInWithPassword({ email, password: wachtwoord });
    return {
      gebruiker: data?.user || null,
      fout: error ? vertaalFout(error.message) : null,
    };
  }

  async function registreren(email, wachtwoord) {
    const sb = client();
    if (!sb) return { gebruiker: null, fout: 'Supabase niet beschikbaar.' };

    const { data, error } = await sb.auth.signUp({ email, password: wachtwoord });
    return {
      gebruiker: data?.user || null,
      fout: error ? vertaalFout(error.message) : null,
    };
  }

  async function uitloggen() {
    const sb = client();
    if (!sb) return;
    await sb.auth.signOut();
  }

  function getGebruiker() {
    const sb = client();
    if (!sb) return null;
    // Supabase v2: sessie is geserialiseerd in localStorage
    const sessie = sb.auth.getUser();
    return sessie || null;
  }

  function isIngelogd() {
    const sb = client();
    if (!sb) return false;
    // Synchrone check via lokale sessie
    const sessieStr = localStorage.getItem('sb-' + window.SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
    return !!sessieStr;
  }

  function onAuthVerandering(callback) {
    const sb = client();
    if (!sb) return;
    sb.auth.onAuthStateChange((_event, sessie) => {
      callback(sessie?.user || null);
    });
  }

  // ── Foutmeldingen vertalen naar Nederlands ─────────────────────────────────
  function vertaalFout(msg) {
    if (!msg) return 'Onbekende fout.';
    if (msg.includes('Invalid login credentials'))   return 'E-mailadres of wachtwoord is onjuist.';
    if (msg.includes('Email not confirmed'))         return 'Bevestig eerst je e-mailadres.';
    if (msg.includes('User already registered'))     return 'Er bestaat al een account met dit e-mailadres.';
    if (msg.includes('Password should be'))          return 'Wachtwoord moet minimaal 6 tekens bevatten.';
    if (msg.includes('rate limit'))                  return 'Te veel pogingen. Probeer het later opnieuw.';
    return msg;
  }

  return { inloggen, registreren, uitloggen, getGebruiker, isIngelogd, onAuthVerandering };

})();

window.Auth = Auth;
