import { supabaseServerClient } from "@/lib/supabase-server-client";

export const checkAuthentication = async () => {
  try {
    const { data } = await supabaseServerClient().auth.getUser();
    const { user }: any = data;
    return { user: user, status: true, session: data };
  } catch (error: any) {
    console.log(error);
    return { user: "", status: false, session: "" };
  }
};
