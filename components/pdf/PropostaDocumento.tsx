import { join } from 'node:path';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from '@react-pdf/renderer';
import { formatarMoeda } from '@/lib/rps/formato';
import type { LinhaProposta, TotalProposta } from '@/lib/propostas/calculoProposta';

// Usa fs/path (Node) — nunca importar este módulo a partir de um componente 'use client'.

const PASTA_FONTES = join(process.cwd(), 'assets', 'fonts');

Font.register({
  family: 'Globotipo Corporativa',
  fonts: [
    { src: join(PASTA_FONTES, 'GlobotipoCorporativa-Regular.ttf'), fontWeight: 400 },
    { src: join(PASTA_FONTES, 'GlobotipoCorporativa-Bold.ttf'), fontWeight: 700 },
  ],
});

Font.register({
  family: 'Globotipo Corporativa Textos',
  fonts: [
    { src: join(PASTA_FONTES, 'GlobotipoCorporativaTextos-Regular.ttf'), fontWeight: 400 },
    { src: join(PASTA_FONTES, 'GlobotipoCorporativaTextos-Bold.ttf'), fontWeight: 700 },
  ],
});

export interface PaginaProposta {
  rp: string;
  cliente: string;
  executivo: string;
  agencia: string | null;
  mesAno: string;
  linhas: LinhaProposta[];
  total: TotalProposta;
}

interface PropostaDocumentoProps {
  paginas: PaginaProposta[];
  dataGeracao: string;
}

const LARGURA_PAGINA = 842;
const ALTURA_FAIXA = 64;

const styles = StyleSheet.create({
  pagina: {
    fontFamily: 'Globotipo Corporativa Textos',
    fontSize: 9,
    color: '#14161a',
    paddingBottom: 32,
  },
  faixaCabecalho: {
    height: ALTURA_FAIXA,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  faixaSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tituloFaixa: {
    fontFamily: 'Globotipo Corporativa',
    fontWeight: 700,
    fontSize: 18,
    color: '#ffffff',
  },
  subtituloFaixa: {
    fontFamily: 'Globotipo Corporativa Textos',
    fontSize: 10,
    color: '#ffffff',
    marginTop: 2,
  },
  corpo: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  linhaCabecalhoInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  campoInfo: {
    marginRight: 28,
    marginBottom: 6,
  },
  rotuloInfo: {
    fontSize: 8,
    color: '#8a909a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  valorInfo: {
    fontFamily: 'Globotipo Corporativa',
    fontWeight: 700,
    fontSize: 11,
    marginTop: 2,
  },
  tabela: {
    borderWidth: 1,
    borderColor: '#eceef1',
    borderRadius: 4,
  },
  linhaTabela: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eceef1',
    alignItems: 'center',
    minHeight: 22,
  },
  linhaCabecalhoTabela: {
    backgroundColor: '#f7f8f9',
  },
  linhaTotal: {
    backgroundColor: '#f7f8f9',
    borderBottomWidth: 0,
  },
  celula: {
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  textoCabecalhoCelula: {
    fontFamily: 'Globotipo Corporativa',
    fontWeight: 700,
    fontSize: 7.5,
    color: '#5a606a',
    textTransform: 'uppercase',
  },
  textoTotal: {
    fontFamily: 'Globotipo Corporativa',
    fontWeight: 700,
  },
  colSigla: { width: '6%' },
  colPrograma: { width: '15%' },
  colSecundagem: { width: '6%', textAlign: 'right' },
  colLocal: { width: '5%' },
  colPreco: { width: '10%', textAlign: 'right' },
  colInsercoes: { width: '8%', textAlign: 'right' },
  colImpressoes: { width: '10%', textAlign: 'right' },
  colTabela: { width: '10%', textAlign: 'right' },
  colDesconto: { width: '6%', textAlign: 'right' },
  colBruto: { width: '12%', textAlign: 'right' },
  colLiquido: { width: '12%', textAlign: 'right' },
});

function FaixaGradiente() {
  return (
    <Svg style={styles.faixaSvg} width={LARGURA_PAGINA} height={ALTURA_FAIXA}>
      <Defs>
        <LinearGradient id="gradienteMarca" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFA60C" />
          <Stop offset="0.97" stopColor="#F50234" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={LARGURA_PAGINA} height={ALTURA_FAIXA} fill="url(#gradienteMarca)" />
    </Svg>
  );
}

function CampoInfo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={styles.campoInfo}>
      <Text style={styles.rotuloInfo}>{rotulo}</Text>
      <Text style={styles.valorInfo}>{valor}</Text>
    </View>
  );
}

function PaginaDaProposta({ pagina, dataGeracao }: { pagina: PaginaProposta; dataGeracao: string }) {
  return (
    <Page size="A4" orientation="landscape" style={styles.pagina}>
      <View style={styles.faixaCabecalho}>
        <FaixaGradiente />
        <Text style={styles.tituloFaixa}>Proposta · Comercial Amplificado</Text>
        <Text style={styles.subtituloFaixa}>Hub Amplificado</Text>
      </View>

      <View style={styles.corpo}>
        <View style={styles.linhaCabecalhoInfo}>
          <CampoInfo rotulo="Data" valor={dataGeracao} />
          <CampoInfo rotulo="Cliente" valor={pagina.cliente} />
          {pagina.agencia && <CampoInfo rotulo="Agência" valor={pagina.agencia} />}
          <CampoInfo rotulo="RP" valor={pagina.rp} />
          <CampoInfo rotulo="Executivo" valor={pagina.executivo} />
          <CampoInfo rotulo="Mês/Ano" valor={pagina.mesAno} />
        </View>

        <View style={styles.tabela}>
          <View style={[styles.linhaTabela, styles.linhaCabecalhoTabela]} fixed>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colSigla]}>Sigla</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colPrograma]}>Programa</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colSecundagem]}>Secundagem</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colLocal]}>Local</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colPreco]}>Preço Inserção</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colInsercoes]}>Total Inserções</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colImpressoes]}>Total Impressões</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colTabela]}>Valor Tabela</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colDesconto]}>% Desconto</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colBruto]}>Valor Bruto Negociado</Text>
            <Text style={[styles.celula, styles.textoCabecalhoCelula, styles.colLiquido]}>Valor Líquido</Text>
          </View>

          {pagina.linhas.map((linha, indice) => (
            <View key={indice} style={styles.linhaTabela} wrap={false}>
              <Text style={[styles.celula, styles.colSigla]}>{linha.sigla}</Text>
              <Text style={[styles.celula, styles.colPrograma]}>{linha.programa}</Text>
              <Text style={[styles.celula, styles.colSecundagem]}>{linha.secundagem}</Text>
              <Text style={[styles.celula, styles.colLocal]}>{linha.local}</Text>
              <Text style={[styles.celula, styles.colPreco]}>{formatarMoeda(linha.precoInsercao)}</Text>
              <Text style={[styles.celula, styles.colInsercoes]}>{linha.totalInsercoes}</Text>
              <Text style={[styles.celula, styles.colImpressoes]}>
                {linha.totalImpressoes.toLocaleString('pt-BR')}
              </Text>
              <Text style={[styles.celula, styles.colTabela]}>{formatarMoeda(linha.valorTabela)}</Text>
              <Text style={[styles.celula, styles.colDesconto]}>{linha.percentualDesconto.toLocaleString('pt-BR')}%</Text>
              <Text style={[styles.celula, styles.colBruto]}>{formatarMoeda(linha.valorBrutoNegociado)}</Text>
              <Text style={[styles.celula, styles.colLiquido]}>{formatarMoeda(linha.valorLiquido)}</Text>
            </View>
          ))}

          <View style={[styles.linhaTabela, styles.linhaTotal]} wrap={false}>
            <Text style={[styles.celula, styles.textoTotal, styles.colSigla]}>Total</Text>
            <Text style={[styles.celula, styles.colPrograma]} />
            <Text style={[styles.celula, styles.colSecundagem]} />
            <Text style={[styles.celula, styles.colLocal]} />
            <Text style={[styles.celula, styles.colPreco]} />
            <Text style={[styles.celula, styles.textoTotal, styles.colInsercoes]}>{pagina.total.totalInsercoes}</Text>
            <Text style={[styles.celula, styles.textoTotal, styles.colImpressoes]}>
              {pagina.total.totalImpressoes.toLocaleString('pt-BR')}
            </Text>
            <Text style={[styles.celula, styles.textoTotal, styles.colTabela]}>
              {formatarMoeda(pagina.total.valorTabela)}
            </Text>
            <Text style={[styles.celula, styles.textoTotal, styles.colDesconto]}>{pagina.total.percentualDesconto.toLocaleString('pt-BR')}%</Text>
            <Text style={[styles.celula, styles.textoTotal, styles.colBruto]}>
              {formatarMoeda(pagina.total.valorBrutoNegociado)}
            </Text>
            <Text style={[styles.celula, styles.textoTotal, styles.colLiquido]}>
              {formatarMoeda(pagina.total.valorLiquido)}
            </Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

export function PropostaDocumento({ paginas, dataGeracao }: PropostaDocumentoProps) {
  return (
    <Document title="Proposta Comercial Amplificado">
      {paginas.map((pagina) => (
        <PaginaDaProposta key={pagina.rp} pagina={pagina} dataGeracao={dataGeracao} />
      ))}
    </Document>
  );
}
