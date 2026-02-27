import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
    const { data, error } = await supabase.auth.signUp({
        email: 'admin@empresa.com',
        password: 'password123',
    });
    console.log(error ? 'Error: ' + error.message : 'Success: User admin@empresa.com created');
}

main();
