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

  if (roleError) {
    console.log('[v0] Erro ao validar função administrativa:', roleError.message)
    throw new Error('Não foi possível validar as permissões administrativas.')
  }

  if (!role) {
    throw new Error('Esta conta não tem permissões de administrador.')
  }

  return userData.user
}
