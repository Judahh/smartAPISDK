import { InputTypeTree } from '../../src/rest/rest';

export interface IPncpCompra {
  valorTotalEstimado: number;
  valorTotalHomologado: number;
  srp: boolean;
  orgaoSubRogado: {
    cnpj: string;
    razaoSocial: string;
    poderId: string;
    esferaId: string;
  };
  unidadeOrgao: {
    municipioId: number;
    municipioNome: string;
    ufNome: string;
    ufSigla: string;
    codigoUnidade: string;
    nomeUnidade: string;
  };
  unidadeSubRogada: {
    municipioId: number;
    municipioNome: string;
    ufNome: string;
    ufSigla: string;
    codigoUnidade: string;
    nomeUnidade: string;
  };
  processo: string;
  objetoCompra: string;
  dataAberturaProposta: Date;
  dataEncerramentoProposta: Date;
  informacaoComplementar: string;
  amparoLegal: {
    nome: string;
    descricao: string;
  };
  linkSistemaOrigem: string;
  dataAtualizacao: Date;
  dataInclusao: Date;
  dataPublicacaoPncp: Date;
  existeResultado: boolean;
  anoCompra: number;
  sequencialCompra: number;
  orgaoEntidade: {
    cnpj: string;
    razaoSocial: string;
    poderId: string;
    esferaId: string;
  };
  numeroCompra: string;
  numeroControlePNCP: string;
  modalidadeId: number;
  usuarioNome: string;
  modalidadeNome: string;
  situacaoCompraId: number;
  situacaoCompraNome: string;
  tipoInstrumentoConvocatorioCodigo: number;
  tipoInstrumentoConvocatorioNome: string;
  modoDisputaNome: string;
  indicadorOrcamentoSigiloso: boolean;
  modoDisputaId: number;
}
export interface IPncpItem {
  descricao: string;
  valorTotal: number;
  dataAtualizacao: Date;
  quantidade: number;
  dataInclusao: Date;
  numeroItem: number;
  materialOuServico: 'M' | 'S';
  tipoBeneficio: number;
  incentivoProdutivoBasico: boolean;
  unidadeMedida: string;
  valorUnitarioEstimado: number;
  situacaoCompraItem: number;
  criterioJulgamentoId: number;
  criterioJulgamentoNome: string;
  materialOuServicoNome: string;
  situacaoCompraItemNome: string;
  tipoBeneficioNome: string;
}
export interface IPncpResultado {
  dataAtualizacao: Date;
  niFornecedor: string;
  tipoPessoa: 'PJ' | 'PF';
  dataInclusao: Date;
  dataCancelamento: Date;
  numeroItem: number;
  nomeRazaoSocialFornecedor: string;
  codigoPais: string;
  porteFornecedorId: 1;
  quantidadeHomologada: number;
  valorUnitarioHomologado: number;
  valorTotalHomologado: number;
  percentualDesconto: number;
  indicadorSubcontratacao: true;
  ordemClassificacaoSrp: number;
  dataResultado: Date;
  motivoCancelamento: string;
  numeroControlePNCPCompra: string;
  porteFornecedorNome: string;
  situacaoCompraItemResultadoId: number;
  situacaoCompraItemResultadoNome: string;
  sequencialResultado: number;
  naturezaJuridicaId: string;
  naturezaJuridicaNome: string;
}
export interface IPncpArquivo {
  uri: string;
  url: string;
  sequencialDocumento: number;
  cnpj: string;
  dataPublicacaoPncp: Date;
  anoCompra: number;
  sequencialCompra: number;
  titulo: string;
  statusAtivo: boolean;
  tipoDocumentoNome: string;
  tipoDocumentoId: number;
  tipoDocumentoDescricao: string;
}

const pncpTree = {
  orgaos: {
    read: 'get',
    cnpj: () => ({
      read: 'get',
      compras: {
        year: () => ({
          sequential: () => ({
            read: 'get',
            arquivos: {
              read: 'get',
            },
            itens: {
              read: 'get',
              number: () => ({
                read: 'get',
                resultados: {
                  read: 'get',
                },
              }),
            },
          }),
        }),
      },
    }),
  },
};

interface IPNCPOrgao {
  cnpj: string;
  razaoSocial: string;
  poderId: string;
  esferaId: string;
}

interface PNCPTypeTree extends InputTypeTree {
  orgaos: {
    read: {
      filter: any;
      input: undefined;
      output: IPNCPOrgao[];
    };
    cnpj: (cnpj: string) => {
      read: {
        filter: any;
        input: undefined;
        output: IPNCPOrgao;
      };
      compras: {
        year: (year: number) => {
          sequential: (sequential: number) => {
            read: {
              filter: any;
              input: undefined;
              output: IPncpCompra;
            };
            arquivos: {
              read: {
                filter: any;
                input: undefined;
                output: IPncpArquivo | IPncpArquivo[] | undefined;
              };
            };
            itens: {
              read: {
                filter: any;
                input: undefined;
                output: IPncpItem | IPncpItem[] | undefined;
              };
              number: (itemNumber: number) => {
                read: {
                  filter: any;
                  input: undefined;
                  output: IPncpItem | IPncpItem[] | undefined;
                };
                resultados: {
                  read: {
                    filter: any;
                    input: undefined;
                    output: IPncpResultado | IPncpResultado[] | undefined;
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}

export { pncpTree, PNCPTypeTree };
