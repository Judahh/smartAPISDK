import { JsonWebToken } from '@midware/mauth';
import { AxiosResponse } from 'axios';
import { request } from './request';

type PathTreeFunction = (key) => string | PathTree | PathTreeFunction;

type PathTree = {
  [key: string | number]: string | PathTree | PathTreeFunction;
};

type InputType = {
  filter: unknown;
  input: unknown;
  output: unknown;
};

type InputTypeTreeFunction = (
  key
) => InputType | InputTypeTree | InputTypeTreeFunction;

type InputTypeTree = {
  [key: string]: InputType | InputTypeTree | InputTypeTreeFunction;
};

type TypeTreeFinalFunction<T extends InputType> = (
  query?: Partial<T['filter']>,
  data?: T['input'],
  page?: number,
  pageSize?: number,
  noCache?: boolean,
  replaceHeaders?
) => Promise<AxiosResponse<T['output']>> | undefined;

type TypeTree<T extends InputType | InputTypeTree | InputTypeTreeFunction> = {
  [K in keyof T]: T[K] extends InputType
    ? TypeTreeFinalFunction<T[K]>
    : T[K] extends InputTypeTreeFunction
    ? ReturnTypeTree<T[K]>
    : T[K] extends InputTypeTree
    ? TypeTree<T[K]>
    : never;
};

type ReturnTypeTree<T extends InputTypeTreeFunction> = (
  key
) => TypeTree<ReturnType<T>> extends InputTypeTreeFunction
  ? ReturnTypeTree<TypeTree<ReturnType<T>>>
  : ReturnType<T> extends InputTypeTreeFunction
  ? ReturnTypeTree<ReturnType<T>>
  : TypeTree<ReturnType<T>>;

// const samplePathTree: PathTree = {
//   bidding: {
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

// type BiddingInput = any;
// type BiddingOutput = any;
// type ScheduleInput = any;
// type ScheduleOutput = any;
// type ItemInput = any;
// type ItemOutput = any;

// interface SampleTypeTree extends TypeTree<PathTree> {
//   bidding: {
//     create: { input: BiddingInput; output: BiddingOutput };
//     read: { input: BiddingInput; output: BiddingOutput };
//     update: { input: BiddingInput; output: BiddingOutput };
//     delete: { input: BiddingInput; output: BiddingOutput };
//     item: {
//       create: { input: ItemInput; output: ItemOutput };
//       read: { input: ItemInput; output: ItemOutput };
//       update: { input: ItemInput; output: ItemOutput };
//       delete: { input: ItemInput; output: ItemOutput };
//     };
//   };
//   schedule: {
//     create: { input: ScheduleInput; output: ScheduleOutput };
//     read: { input: ScheduleInput; output: ScheduleOutput };
//     update: { input: ScheduleInput; output: ScheduleOutput };
//     delete: { input: ScheduleInput; output: ScheduleOutput };
//   };
// }

class Rest<T extends InputTypeTree> {
  private address: string;
  private token?: string;
  private clearBaseURL?: boolean;
  private root: string;
  private pathTree: PathTree;
  private noCache?: boolean;
  private replaceHeaders?;
  private requestTree: TypeTree<T>;
  private needsToken?: boolean;
  private timeoutThreshold = 1000;
  private autoRefreshToken: boolean;
  private baseQuery?: unknown;

  constructor(
    address = 'localhost',
    root = 'api',
    pathTree?: PathTree,
    options?: {
      clearBaseURL?: boolean;
      noCache?: boolean;
      replaceHeaders?;
      needsToken?: boolean;
      timeoutThreshold?: number;
      autoRefreshToken?: boolean;
      baseQuery?: unknown;
      apiToken?: string;
    }
  ) {
    this.address = address;
    this.clearBaseURL = options?.clearBaseURL;
    this.root = root;
    this.pathTree = pathTree || ({} as PathTree);
    this.noCache = options?.noCache || false;
    this.replaceHeaders = options?.replaceHeaders || false;
    this.requestTree = this.generateRequests(this.pathTree, this.root);
    this.needsToken = options?.needsToken || false;
    this.timeoutThreshold = options?.timeoutThreshold || this.timeoutThreshold;
    this.autoRefreshToken = options?.autoRefreshToken || false;
    this.token = options?.apiToken;
    this.baseQuery = options?.baseQuery || undefined;
  }

  private getRequest<Query = unknown, Input = Query, Output = Input>(
    method: string,
    path: string
  ) {
    const newRequest = async (
      query?: Query,
      data?: Input,
      page?: number,
      pageSize?: number,
      noCache?: boolean,
      replaceHeaders?
    ) => {
      let newQuery: Query | undefined = query ? query : ({} as Query);
      newQuery = this.baseQuery ? { ...this.baseQuery, ...newQuery } : newQuery;
      if (newQuery && Object.keys(newQuery).length === 0) newQuery = undefined;
      return await request<Query, Input, Output>(
        this.address,
        method,
        path,
        this.needsToken || this.token ? await this.getToken() : undefined,
        newQuery,
        data,
        this.clearBaseURL,
        page,
        pageSize,
        noCache || this.noCache,
        replaceHeaders || this.replaceHeaders
      );
    };
    return newRequest;
  }

  private generateRequests(
    pathTree: string | PathTree | PathTreeFunction,
    root: string
  ): TypeTree<T> {
    let requests = {};
    // console.log('generateRequests:', pathTree, root);
    if (typeof pathTree === 'function') {
      const o = pathTree(0);
      requests = (e) =>
        this.generateRequests(o, e != undefined ? root + '/' + e : root);
      // console.log('pathTree function', pathTree, root);
    } else if (typeof pathTree === 'string') {
      // console.log('pathTree string');
      requests = this.getRequest(pathTree, root);
    } else {
      for (const key in pathTree) {
        // console.log('key', key);
        if (Object.prototype.hasOwnProperty.call(pathTree, key)) {
          const element = pathTree[key];
          // if key contains ${<name>} then it is a variable and should be replaced with the value of the variable
          // const variable = key.match(/\${(.*)}/);
          // if (variable) {
          //   requests = (key) =>
          //     this.generateRequests(
          //       element,
          //       typeof element === 'string' ? root : root + '/' + key
          //     );
          // } else {
          requests[key] = this.generateRequests(
            element,
            typeof element === 'string' ? root : root + '/' + key
          );
          // }
        }
      }
      // console.log('pathTree:', pathTree);
    }
    return requests as TypeTree<T>;
  }

  private async refreshToken(
    request?: (lastToken?: string) => Promise<
      | {
          data?: { accessToken?: string; token?: string };
          accessToken?: string;
          token?: string;
        }
      | string
      | undefined
    >
  ) {
    const lastToken = this.token;
    this.token = undefined;
    if (this.autoRefreshToken)
      this.token = await this.getToken(request, lastToken);
    return this.token;
  }

  async getToken(
    request?: (lastToken?: string) => Promise<
      | {
          data?: { accessToken?: string; token?: string };
          accessToken?: string;
          token?: string;
        }
      | string
      | undefined
    >,
    lastToken?: string
  ) {
    const now = Date.now() / 1000;
    if (!this.token) {
      if (request) {
        const req = await request(lastToken);
        this.token = (
          typeof req === 'string'
            ? req
            : req?.data?.token ||
              req?.data?.accessToken ||
              req?.data ||
              req?.token ||
              req?.accessToken ||
              req
        ) as string | undefined;
      } else if (process.env.JWT_PRIVATE_KEY) {
        this.token = await JsonWebToken.getInstance().sign({
          id: '000000000000000000000000',
          givenName: process.env.SERVICE_NAME,
          familyName: process.env.INSTANCE,
          identification: process.env.SERVICE_NAME,
          type: 'API',
          permissions: {
            auth: {
              all: ['all'],
            },
            all: {
              all: ['all'],
            },
          },
          instances: ['all'],
        });
      }
    }
    if (this.token && this.autoRefreshToken) {
      const expiresIn = (await JsonWebToken.getInstance().verify(this.token))
        .exp;
      if (expiresIn) {
        const rF = this.refreshToken.bind(this);
        const tF = async () => {
          const req = await rF(request);
          this.token = req;
        };
        setTimeout(
          tF.bind(this),
          (expiresIn - now) * 1000 - this.timeoutThreshold
        );
      }
    }

    return this.token;
  }

  getRequestTree(): TypeTree<T> {
    return this.requestTree;
  }
}

export { Rest };
export type {
  PathTree,
  InputTypeTree,
  TypeTree,
  InputTypeTreeFunction,
  PathTreeFunction,
};
