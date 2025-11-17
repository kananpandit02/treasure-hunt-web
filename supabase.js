import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabaseUrl = localStorage.getItem('supabaseUrl');
let supabaseKey = localStorage.getItem('supabaseKey');

function promptForCredentials() {
    const url = prompt("FIRST TIME SETUP:\nPlease enter your Supabase Project URL:");
    const key = prompt("FIRST TIME SETUP:\nPlease enter your Supabase Anon Key:");
    return { url, key };
}

if (!supabaseUrl || !supabaseKey) {
    alert("Welcome! As this is your first time running the app, you need to connect it to your Supabase backend.");
    const { url, key } = promptForCredentials();

    if (url && key) {
        localStorage.setItem('supabaseUrl', url);
        localStorage.setItem('supabaseKey', key);
        supabaseUrl = url;
        supabaseKey = key;
        alert("Credentials saved! The application will now load.");
    } else {
        document.body.innerHTML = `<div style="color: red; text-align: center; padding: 50px;"><h1>Setup Incomplete</h1><p>Supabase URL and Key are required. Please refresh the page and provide them to use the application.</p></div>`;
        throw new Error("Supabase credentials not provided.");
    }
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
