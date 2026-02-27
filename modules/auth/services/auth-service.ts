import { emailService } from "@/lib/email-service";
import { supabase } from "@/lib/supabase-auth-client";
import { supabaseServerClient } from "@/lib/supabase-server-client";
import { rolesService } from "@/modules/roles";
import { usersService } from "@/modules/users";

export interface AuthSignupData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role_id?: string;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  signUp: async ({ email, password, firstName, lastName, role_id = "" }: AuthSignupData) => {
    // First check if user exists with the given email
    const existingUser = await usersService.getUserByEmail({
    
        email: {
          eq: email
        }
      
    });

    
    if (existingUser) {
      throw new Error("User already registered with this email");
    }
    
    // Create the user in Supabase Auth if not exists
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { data: { first_name: firstName, last_name: lastName } } 
    });
    if (error) throw error;

    if (data?.user) {
      try {
        // Get the default user role using GraphQL
        const roleId = await rolesService.getRoleByName();
        const payload = {
          id: data?.user?.id,
          email: data?.user?.email, 
          role_id: role_id || roleId,
          first_name: firstName || null,
          last_name: lastName || null,
          is_active: true,
        }
        // Insert the user into the users table using GraphQL
        await usersService.insertUser(payload)
      } catch (profileError) {
        console.error('Error in profile creation:', profileError);
        throw profileError;
      }
    }

    return data;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabaseServerClient().auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;

    return data;
  },

  signOut: async () => {
    const { error } = await supabaseServerClient().auth.signOut();
   
    if (error) throw error;
  },

  sendInvites: async (emails: string[]) => {
    for (const email of emails) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        email_confirm: false,
      });
      if (error) throw error;

      emailService.sendInviteEmail(email, `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite/${data?.user?.id}`)
      if (data?.user) {
        // Wait a moment for the auth user to be fully created before inserting into users table
        await delay(2000);
        try {
          // Get the default user role using GraphQL
          const roleId = await rolesService.getRoleByName();
          const payload = {
            id: data?.user?.id,
            email: data?.user?.email,
            role_id: roleId,
            first_name: null,
            last_name: null,
            is_active: true,
          }
          // Insert the user into the users table using GraphQL
          await usersService.insertUser(payload)
        } catch (profileError) {
          console.error('Error in profile creation:', profileError);
        }
      }
      return data;
    }
  },

  resendVerificationEmail: async (email: string) => {
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });

    if (error) throw error;
    return data;
  },

  acceptInvite: async (token: string, password: string) => {
    try {
      // Exchange the token for a session
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.updateUserById(token, {
        password: password,
        email_confirm:  true
      });
      if (sessionError) {
        throw new Error('Invalid or expired invite token');
      }

      if (!sessionData?.user) {
        throw new Error('No user found for this token');
      }
      return sessionData;
    } catch (error) {
      console.error('Error in acceptInvite:', error);
      throw error;
    }
  },
  deleteUser: async (id: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    await authService.signOut();
    return response.json();
  }
,

  updateEmail: async (newEmail: string, crm_id: string) => {
    console.log("🚀 ~ newEmail:", newEmail)
    console.log("🚀 ~ crm_id:", crm_id)
    

    const response = await fetch('https://automation.sitconnect.net/webhook/03ed1ba0-2bb5-4f12-9996-7a546269aa98', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: crm_id, email: newEmail }),
    });
    if (!response.ok) {
      throw new Error('Failed to update email');
    }
    return response.json();


    // First check if user exists with the new email
    // const existingUser = await usersService.getUserByEmail({
    //   email: {
    //     eq: newEmail
    //   }
    // });

    // if (existingUser) {
    //   throw new Error("User already exists with this email address");
    // }

    // // Update email in Supabase Auth
    // const { data, error } = await supabaseServerClient().auth.updateUser({
    //   email: newEmail,
    // });

    // if (error) {
    //   throw new Error(error.message);
    // }
  },
}; 