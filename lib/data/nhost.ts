// Usa variáveis de ambiente sensíveis do servidor — nunca importar este módulo a partir de um componente 'use client'.

interface RespostaGraphQL<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function executarGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const subdomain = process.env.NHOST_SUBDOMAIN;
  const region = process.env.NHOST_REGION;
  const adminSecret = process.env.NHOST_ADMIN_SECRET;

  if (!subdomain || !region || !adminSecret) {
    throw new Error(
      'Variáveis de ambiente do Nhost não configuradas (NHOST_SUBDOMAIN, NHOST_REGION, NHOST_ADMIN_SECRET).'
    );
  }

  const resposta = await fetch(`https://${subdomain}.hasura.${region}.nhost.run/v1/graphql`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hasura-admin-secret': adminSecret,
    },
    body: JSON.stringify({ query, variables }),
  });

  const corpo = (await resposta.json()) as RespostaGraphQL<T>;

  if (corpo.errors && corpo.errors.length > 0) {
    throw new Error(`Erro no GraphQL do Nhost: ${corpo.errors.map((erro) => erro.message).join('; ')}`);
  }

  if (!corpo.data) {
    throw new Error('Resposta do GraphQL do Nhost sem dados.');
  }

  return corpo.data;
}
