/**
 * Script to create an admin user directly in Supabase
 * This bypasses email verification and creates a ready-to-use admin account
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdminUser() {
    try {
        console.log('Creating admin user...');

        // Create user with email already verified
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email: 'admin@daxow.com',
            password: 'Admin@123456',
            email_confirm: true, // This confirms the email automatically
            user_metadata: {
                first_name: 'Admin',
                last_name: 'User'
            }
        });

        if (userError) {
            console.error('Error creating user:', userError);
            return;
        }

        console.log('✅ Admin user created successfully!');
        console.log('User ID:', userData.user.id);
        console.log('\n📧 Login credentials:');
        console.log('Email: admin@daxow.com');
        console.log('Password: Admin@123456');
        console.log('\n🔗 Login URL: http://localhost:3010/auth/login');

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

createAdminUser();
