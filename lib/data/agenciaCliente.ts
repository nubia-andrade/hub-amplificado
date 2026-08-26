// Usa variáveis de ambiente sensíveis do servidor — nunca importar este módulo a partir de um componente 'use client'.

import { executarGraphQL } from './nhost';
import { obterAgenciaMock } from './agenciaMock';

export interface AgenciaCliente {
  possuiAgencia: boolean;
  nomeAgencia: string | null;
}

interface ClientePorAnuncianteResposta {
  clientes: Array<{
    agencia: { nome: string } | null;
  }>;
}

const QUERY_CLIENTE_POR_ANUNCIANTE = `
  query ClientePorAnunciante($anunciante: String!) {
    clientes(where: { anunciante: { _eq: $anunciante } }, limit: 1) {
      agencia {
        nome
      }
    }
  }
`;

function agenciaMockComo(anunciante: string): AgenciaCliente {
  const nomeMock = obterAgenciaMock(anunciante);
  return { possuiAgencia: nomeMock !== null, nomeAgencia: nomeMock };
}

export async function obterAgenciaCliente(anunciante: string): Promise<AgenciaCliente> {
  try {
    const resultado = await executarGraphQL<ClientePorAnuncianteResposta>(QUERY_CLIENTE_POR_ANUNCIANTE, {
      anunciante,
    });

    const cliente = resultado.clientes[0];
    if (!cliente) {
      return agenciaMockComo(anunciante);
    }

    if (!cliente.agencia) {
      return { possuiAgencia: false, nomeAgencia: null };
    }

    return { possuiAgencia: true, nomeAgencia: cliente.agencia.nome };
  } catch (erro) {
    console.warn(
      `Falha ao consultar agência do cliente "${anunciante}" no Nhost — usando mock. ${erro instanceof Error ? erro.message : String(erro)}`
    );
    return agenciaMockComo(anunciante);
  }
}
