/**
 * Afbouwr — Supabase configuratie
 *
 * Vul hieronder je eigen Supabase project-URL en anon-key in.
 * Deze vind je in je Supabase dashboard → Project Settings → API.
 *
 * De anon-key is publiek (bedoeld voor client-side gebruik).
 * Bewaar de service_role key NOOIT in dit bestand.
 */

'use strict';

const SUPABASE_URL      = 'https://ajqnkcvfbgogvnknoqdf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcW5rY3ZmYmdvZ3Zua25vcWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODE0NzIsImV4cCI6MjA4OTc1NzQ3Mn0.QyBfADlKQm7vhPHN7XKkeSwTBO_WQbnUHKqCexNOEy4';

// ── Initialiseer Supabase client ───────────────────────────────────────────
// Vereist: Supabase JS SDK geladen via <script> tag (zie components.js of HTML)

let _supabaseClient = null;

function getSupabase() {
  if (_supabaseClient) return _supabaseClient;

  if (typeof window.supabase === 'undefined') {
    console.warn('[Afbouwr] Supabase SDK niet geladen.');
    return null;
  }

  _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _supabaseClient;
}

window.getSupabase = getSupabase;
