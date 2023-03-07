import { InputTypeTree, Rest, TypeTree } from '../../src/rest/rest';
import * as dotenv from 'dotenv';
dotenv.config();

// interface Lic {
//   codigoReferencia: string;
//   codigoLicitacao: string;
//   codigoModalidade: string;
// }

// interface LicItem {
//   codigoLicitacao: string;
//   codigoItem: string;
//   name: string;
// }

// interface Schedule {
//   id: string;
//   name: string;
//   schedule: string;
// }

// interface SampleTypeTree extends InputTypeTree {
//   licitacao: {
//     create: {
//       filter: undefined;
//       input: Lic | Lic[];
//       output: Lic | Lic[] | undefined;
//     };
//     read: {
//       filter: Lic;
//       input: undefined;
//       output: Lic | Lic[] | undefined;
//     };
//     update: {
//       filter: Lic;
//       input: Lic | Lic[];
//       output: Lic | Lic[] | undefined;
//     };
//     delete: {
//       filter: Lic;
//       input: Lic | Lic[];
//       output: Lic | Lic[] | undefined;
//     };
//     item: {
//       create: {
//         filter: undefined;
//         input: LicItem | LicItem[];
//         output: LicItem | LicItem[] | undefined;
//       };
//       read: {
//         filter: LicItem;
//         input: undefined;
//         output: LicItem | LicItem[] | undefined;
//       };
//       update: {
//         filter: LicItem;
//         input: LicItem | LicItem[];
//         output: LicItem | LicItem[] | undefined;
//       };
//       delete: {
//         filter: LicItem;
//         input: LicItem | LicItem[];
//         output: LicItem | LicItem[] | undefined;
//       };
//     };
//   };
//   schedule: {
//     create: {
//       filter: undefined;
//       input: Schedule | Schedule[];
//       output: Schedule | Schedule[] | undefined;
//     };
//     read: {
//       filter: Schedule;
//       input: undefined;
//       output: Schedule | Schedule[] | undefined;
//     };
//     update: {
//       filter: Schedule;
//       input: Schedule | Schedule[];
//       output: Schedule | Schedule[] | undefined;
//     };
//     delete: {
//       filter: Schedule;
//       input: Schedule | Schedule[];
//       output: Schedule | Schedule[] | undefined;
//     };
//   };
// }

// const samplePathTree = {
//   licitacao: {
//     create: 'post',
//     read: 'get',
//     update: 'put',
//     delete: 'delete',
//     item: {
//       create: 'post',
//       read: 'get',
//       update: 'put',
//       delete: 'delete',
//     },
//   },
//   schedule: {
//     create: 'post',
//     read: 'get',
//     update: 'put',
//     delete: 'delete',
//   },
// };

test('sample', async () => {
  // const rest = new Rest<SampleTypeTree>(
  //   'localhost:3000',
  //   'api',
  //   samplePathTree
  // );
  // const tree = rest.getRequestTree();
  // const licitacao = await tree.licitacao.read(
  //   { codigoReferencia: 'asd3asd' },
  //   undefined,
  //   0,
  //   10
  // );
  // if (licitacao) {
  //   console.log(licitacao.headers);
  //   console.log(licitacao.data);
  // }
});

const tree7Pace = {
  rest: {
    workLogs: {
      create: 'post',
      read: 'get',
    },
  },
};

interface TypeTree7Pace extends InputTypeTree {
  rest: {
    workLogs: {
      create: {
        filter: undefined;
        input: any | any[];
        output: any | any[] | undefined;
      };
      read: {
        filter: any;
        input: undefined;
        output: any | any[] | undefined;
      };
    };
  };
}

test('sample 7Pace', async () => {
  const rest7Pace: Rest<TypeTree7Pace> = new Rest<TypeTree7Pace>(
    'https://app.7pace.com',
    'api',
    tree7Pace
  );
  const requestTree7Pace: TypeTree<TypeTree7Pace> = rest7Pace.getRequestTree();
  const licitacao = await requestTree7Pace.rest.workLogs.read();
  if (licitacao) {
    console.log(licitacao.headers);
    console.log(licitacao.data);
  }
});
