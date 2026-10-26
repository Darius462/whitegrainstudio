let clientPromise;
export function getClient() {
  const config = window.WHITEGRAIN_CONFIG;
  if (!config?.supabaseUrl || !config?.supabaseKey) return Promise.resolve(null);
  if (!clientPromise) clientPromise = import('https://esm.sh/@supabase/supabase-js@2.57.4').then(({ createClient }) =>
    createClient(config.supabaseUrl, config.supabaseKey));
  return clientPromise;
}
export async function allProjects(client, publishedOnly = true) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    let query = client.from('projects').select('*').order('sort_order').order('id').range(offset, offset + 499);
    if (publishedOnly) query = query.eq('published', true);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
