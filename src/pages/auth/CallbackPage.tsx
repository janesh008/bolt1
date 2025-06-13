import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const CallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast.error('Authentication failed');
          navigate('/login');
          return;
        }

        if (data.session) {
          const user = data.session.user;
          
          // Check if user has admin privileges
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (adminUser) {
            // Update admin user with auth_user_id if not set
            if (!adminUser.auth_user_id) {
              await supabase
                .from('admin_users')
                .update({ 
                  auth_user_id: user.id,
                  last_login: new Date().toISOString()
                })
                .eq('id', adminUser.id);
            }
            
            toast.success('Welcome to Admin Panel!');
            navigate('/admin');
          } else {
            // Regular user - create user profile if needed
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();

            if (!existingUser) {
              // Create user profile
              await supabase
                .from('users')
                .insert([{
                  id: user.id,
                  full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                  email: user.email || '',
                  phone: user.user_metadata?.phone || '',
                }]);
            }

            toast.success('Welcome!');
            navigate('/profile');
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        toast.error('Authentication failed');
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-charcoal-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default CallbackPage;