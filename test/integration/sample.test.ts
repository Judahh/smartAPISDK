import { Rest } from '../../src/rest/rest';
import * as dotenv from 'dotenv';
dotenv.config();

const samplePathTree = {
  licitacao: {
    create: 'post',
    read: 'get',
    update: 'put',
    delete: 'delete',
    item: {
      create: 'post',
      read: 'get',
      update: 'put',
      delete: 'delete',
    },
  },
  schedule: {
    create: 'post',
    read: 'get',
    update: 'put',
    delete: 'delete',
  },
};

test('sample', async () => {
  const rest = new Rest('localhost:3000', 'api', samplePathTree);
  const tree = rest.getRequestTree();
  if (
    (await tree.licitacao.read({ codigoReferencia: 'asd3asd' }, {}, 0, 10)).data
  ) {
  }
  console.log(licitacao.headers);
  console.log(licitacao.data);
});
