const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bwcqjrsuzvsqnmkznmiy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Y3FqcnN1enZzcW5ta3pubWl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwNjQ0MywiZXhwIjoyMDg0NDgyNDQzfQ.wm8PfAg9DHpMZmCCuwo8UTQtyZUNIqgZQhXdqfEqOa0hzE/CON+zBJC7c8rTQzZpVyy43+0Bbpn6eXuPp3dc2Q=='
);

const EMAIL = 'jaykapambwe@gmail.com';

async function assignRoles() {
  console.log('Looking for user:', EMAIL);

  // Find user by email in profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('email', EMAIL);

  if (profileError) {
    console.log('Error finding user in profiles:', profileError.message);
  }

  let userId = null;

  if (profiles && profiles.length > 0) {
    userId = profiles[0].id;
    console.log('Found user in profiles:', userId);
  } else {
    console.log('User not found in profiles. Checking auth.users...');

    // Try auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log('Error checking auth:', authError.message);
      return;
    }

    const user = authData?.users?.find(u => u.email === EMAIL);
    if (user) {
      userId = user.id;
      console.log('Found user in auth.users:', userId);

      // Create profile if missing
      console.log('Creating profile...');
      const { error: insertError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || 'Joseph',
        last_name: user.user_metadata?.last_name || 'Kapambwe',
        is_active: true
      });
      if (insertError) {
        console.log('Profile upsert note:', insertError.message);
      } else {
        console.log('Profile created/updated');
      }
    } else {
      console.log('User not found in auth.users either');
      console.log('Available users:', authData?.users?.map(u => u.email).join(', '));
      return;
    }
  }

  // Assign roles
  const roles = [
    'super_admin', 'ministry_official', 'auditor', 'plgo',
    'tac_chair', 'tac_member', 'cdfc_chair', 'cdfc_member',
    'finance_officer', 'wdc_member', 'mp'
  ];

  console.log('\nAssigning roles to user:', userId);

  for (const role of roles) {
    const { error } = await supabase.from('user_roles').upsert(
      { user_id: userId, role },
      { onConflict: 'user_id,role' }
    );
    if (error) {
      console.log(`  - ${role}: ERROR - ${error.message}`);
    } else {
      console.log(`  - ${role}: OK`);
    }
  }

  // Verify
  const { data: assignedRoles, error: verifyError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (verifyError) {
    console.log('\nVerification error:', verifyError.message);
  } else {
    console.log('\n✓ Verified roles in DB:', assignedRoles?.map(r => r.role).join(', '));
  }

  console.log('\nDone! Please log out and log back in to see the changes.');
}

assignRoles().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
