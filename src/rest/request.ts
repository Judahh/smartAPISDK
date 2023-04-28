import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import RequestError from './requestError';

const improveErrorMessage = (error, url?, method?) => {
  let code =
    error.status ||
    error.statusCode ||
    error.request?.statusCode ||
    error.response?.statusCode ||
    error.response?.status;
  let codeText =
    error.statusText ||
    error.request?.statusText ||
    error.response?.statusText ||
    error.response?.name ||
    error.request?.name ||
    error.name ||
    '';
  let response =
    (typeof error.response === 'string' && error.response) ||
    error.responseText ||
    error.request?.response ||
    error.request?.responseText ||
    error.response?.response ||
    error.response?.responseText ||
    error.message ||
    '{}';
  // console.error('AN ERROR:', error, url, method);

  try {
    response = JSON.parse(response);
  } catch (jError) {
    // console.error('Error response:', jError);
    // response = response;
  }

  // for (const key in error) {
  //   if (Object.prototype.hasOwnProperty.call(error, key)) {
  //     const element = error[key];
  //     console.error(key, element);
  //   }
  // }

  if (!code) {
    code = 400;
    if (url.includes('wroom') || url.includes('user') || url.includes('auth')) {
      code = 503;
    }
    codeText = 'CORS Error:' + codeText;
    response = 'CORS Error:' + response;
  }

  return new RequestError(code, codeText, response, error, url, method);
};

const getProtocol = (url: string) => {
  let protocol = '';
  const regex = /\w*:\/\//gm;
  const foundProtocol = url.match(regex);

  if (!foundProtocol) {
    protocol = 'https://';
    if (url.includes('localhost')) protocol = 'http://';
  } else {
    protocol = foundProtocol[0];
  }
  return protocol;
};

const cleanUrl = (address = 'localhost', path?: string) => {
  const cleanedPath = path?.includes('://')
    ? path?.split('://')[1].split('/')[0]
    : path?.split('/')[0];
  const cleanedAddress = address?.includes('://')
    ? address?.split('://')[1]
    : address;
  const junction =
    address[address.length - 1] === '/' || path?.[0] === '/' ? '' : '/';
  const url = cleanedPath?.includes(cleanedAddress)
    ? path || ''
    : address + junction + (path ? path : '');
  return url;
};

const setNoCache = (config: { headers: object }) => {
  // config.headers['Cache-Control'] = 'no-cache no-store';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  config.headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
  // config.headers['cache-control'] = 'public, max-age=0, must-revalidate';
  config.headers['If-Modified-Since'] = yesterday.toDateString();
  config.headers['if-None-Match'] = undefined;
  return config;
};

const setConfigByMethod = (
  config: { headers: object; data? },
  data,
  method = 'get'
) => {
  method = method.toLowerCase();
  config =
    method === 'get' ||
    method === 'delete' ||
    method === 'head' ||
    method === 'options'
      ? { ...config, data }
      : config;
  return config;
};

const generateConfig = (
  method = 'get',
  token?: string,
  query?,
  data?,
  page?: number,
  pageSize?: number,
  noCache?: boolean,
  addedHeaders?,
  replaceHeaders?
) => {
  let config: {
    headers: object;
    data?: unknown;
    params?: Record<string, string>;
  } = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      Accept: '*/*',
    },
  };

  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (page) config.headers['page'] = page;
  if (pageSize) config.headers['pageSize'] = pageSize;
  if (query) config.params = query;
  if (data) config.headers['Content-Type'] = 'application/json';

  if (noCache) {
    // console.log('noCache received header', received, received.headers);
    config = setNoCache(config);
  }

  if (replaceHeaders) {
    config = {
      headers: replaceHeaders,
    };
  }

  config.headers = { ...config.headers, ...addedHeaders };

  config = setConfigByMethod(config, data, method);
  return config;
};

const reduceError = async (
  error: any,
  url: string,
  method: string,
  newRequest: (newError: any) => Promise<AxiosResponse>
) => {
  error = improveErrorMessage(error, url, method);

  if (error.code >= 500 && error.code < 600) {
    // console.error('CodeError:', error);
    return await newRequest(error);
  } else {
    // console.error('Error:', error);
    // console.error(error);
    throw error;
  }
};

const generateParam2 = (method = 'get', clearBaseURL = false, config, data) => {
  const param2 =
    method === 'get' ||
    method === 'delete' ||
    method === 'head' ||
    method === 'options'
      ? clearBaseURL
        ? undefined
        : config
      : data;
  return param2;
};

const generateParam3 = (clearBaseURL = false, config) => {
  const param3 = clearBaseURL ? undefined : config;
  return param3;
};

const splitUrlParams = <T = object>(query?: T) => {
  const urlParams: { [key: string]: unknown } = {};
  for (const key in query) {
    if (Object.hasOwnProperty.call(query, key)) {
      const element = query[key];
      if (
        key.includes('.$') ||
        element == null ||
        (Array.isArray(element) && element.some((e) => e == null))
      ) {
        urlParams[key] = element;
        delete query[key];
      }
    }
  }
  if (Object.keys(urlParams).length === 0) return undefined;
  return urlParams;
};

const addParamsToUrl = (
  url: string,
  urlParams?: { [key: string]: unknown }
) => {
  if (!urlParams) return url;
  for (const key in urlParams) {
    if (Object.hasOwnProperty.call(urlParams, key)) {
      const element = urlParams[key];
      url += url.includes('?') ? '&' : '?';
      if (Array.isArray(element)) {
        const array: string[] = [];
        element.forEach((value) => {
          array.push(`${key}[]=${value}`);
        });
        url += array.join('&');
        continue;
      } else url += `${key}=${element}`;
    }
  }
  return url;
};

const splitArrayParams = (params: Record<string, string> | undefined) => {
  const paramsA: Record<string, string> = {};
  if (params)
    for (const key in params) {
      if (Object.hasOwnProperty.call(params, key)) {
        const element = params[key];
        if (Array.isArray(element)) {
          // paramsA[key] = element;
          paramsA[`${key}[]`] = element;
          delete params[key];
          continue;
        }
      }
    }
  return { params, paramsA };
};

const paramsToString = (params: Record<string, string> | undefined) => {
  if (!params) return '';
  if (Object.values(params).some((e) => Array.isArray(e))) {
    let string = '';
    for (const key in params) {
      if (Object.hasOwnProperty.call(params, key)) {
        const element = params[key];
        string += Array.isArray(element)
          ? element.map((c) => `${key}=${c}`, '').join('&')
          : `${key}=${element}&`;
      }
    }
    string = string[string.length - 1] === '&' ? string.slice(0, -1) : string;
    return string;
  }
  return new URLSearchParams(params).toString();
};

const request = async <Query = any, Input = Query, Output = Input>(
  address = 'localhost',
  method = 'get',
  path?: string,
  token?: string,
  query?: Query,
  data?: Input,
  clearBaseURL = false,
  page?: number,
  pageSize?: number,
  noCache?: boolean,
  addedHeaders?,
  replaceHeaders?,
  lastErrors?: any[],
  retry = 5
) => {
  let url = cleanUrl(address, path);

  try {
    const protocol = getProtocol(url);
    const urlParams = splitUrlParams<Query>(query);
    const config = generateConfig(
      method,
      token,
      query,
      data,
      page,
      pageSize,
      noCache,
      addedHeaders,
      replaceHeaders
    );

    const param2 = generateParam2(method, clearBaseURL, config, data);

    const param3 = generateParam3(clearBaseURL, config);

    url = url.replace(protocol, '').replace(protocol.replace('s', ''), '');
    url = protocol + url;
    url = addParamsToUrl(url, urlParams);
    // console.log('URL', url);
    // console.log('token', token);
    // console.log('Method', method);
    // console.log('Param2', param2);
    // console.log('Param3', param3);

    let received: AxiosResponse<Output>;
    if (
      urlParams // &&
      // method === 'put'
    ) {
      //use fetch
      const paramsI = config.params;
      delete config.params;
      const { params, paramsA } = splitArrayParams(paramsI);
      let p = paramsToString(params);
      const pA = paramsToString(paramsA);
      p = p && pA ? `${p}&${pA}` : p || pA;
      p = p ? (url.includes('?') ? '&' : '?') + p : '';
      url += p;

      const r = {
        ...config,
        method: method.toUpperCase(),
      } as RequestInit;
      if (data && Object.keys(data).length > 0) {
        // const formData = new FormData();
        // formData.append('json', JSON.stringify(data));
        // r.body = formData;
        try {
          r.body = JSON.stringify(data);
          // if (replaceHeaders) r.headers = replaceHeaders;
          // if (addedHeaders) r.headers = { ...r.headers, ...addedHeaders };
          if (!r.headers) r.headers = {};
          if (!r.headers?.['Content-Type'])
            r.headers['Content-Type'] = 'application/json';
        } catch (error) {
          r.body = undefined;
          console.error('error', error);
        }
      }
      const f = await fetch(url, r);
      let fData;
      try {
        fData = await f.json();
      } catch (error) {
        fData = f.body;
      }
      f['data'] = fData || f.body;
      received = f as unknown as AxiosResponse<Output>;
      received.config = config as InternalAxiosRequestConfig;
    } else {
      // console.log('axios', method, url, param2, param3);
      received = await axios[method](url, param2, param3);
    }

    received.data = (typeof received.data == 'string' &&
    received.data?.trim?.() == ''
      ? undefined
      : received.data) as unknown as Output;

    return received as AxiosResponse<Output>;
  } catch (error: any) {
    if (retry == undefined || retry === 0) {
      error.lastErrors = lastErrors;
      throw error;
    } else if (retry < 0) {
      console.warn('Retry is less than 0', retry);
    }
    lastErrors = lastErrors || [];
    lastErrors.push(error);
    await reduceError(error, url, method, async (error) => {
      lastErrors?.push(error);
      return (await request(
        address,
        method,
        path,
        token,
        query,
        data,
        clearBaseURL,
        page,
        pageSize,
        noCache,
        addedHeaders,
        replaceHeaders,
        lastErrors,
        retry - 1
      )) as AxiosResponse<Output>;
    });
  }
};

export { request };
