import { createSupabaseBrowserClient } from './client'

export async function requireAdmin() {
  const supabase = createSupabaseBrowserClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    window.location.href = '/login'
    return null
  }

  const { data: role, error: roleError } = await supabase
    .from('funcoes_utilizador')
    .select('funcao')
    .eq('user_id', userData.user.id)
    .eq('funcao', 'admin')
    .maybeSingle()

  if (roleError || !role) {
    await supabase.auth.signOut()
    window.location.href = '/login'
    return null
  }

  return userData.user
}
