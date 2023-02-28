import axios, { AxiosResponse } from 'axios';
import RequestError from './requestError';

const improveErrorMessage = (error: any, url?, method?) => {
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
  console.error('AN ERROR:', error, url, method);

  try {
    response = JSON.parse(response);
  } catch (error) {
    console.error('Error response:', error);
    response = response;
  }

  for (const key in error) {
    if (Object.prototype.hasOwnProperty.call(error, key)) {
      const element = error[key];
      console.error(key, element);
    }
  }

  if (!code) {
    code = 400;
    if (url.includes('wroom') || url.includes('user') || url.includes('auth')) {
      code = 503;
    }
    codeText = 'CORS Error:' + codeText;
    response = 'CORS Error:' + response;
  }

  return new RequestError(code, codeText, response);
};

const getProtocol = (url: string) => {
  let protocol = '';
  const regex = /\w*\:\/\//gm;
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

const setNoCache = (config: { headers: {} }) => {
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
  config: { headers: {}; data? },
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
  replaceHeaders?
) => {
  let config: { headers: {}; data?: {}; params?: {} } = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      Accept: '*/*',
    },
  };

  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (page) config.headers['page'] = page;
  if (pageSize) config.headers['pageSize'] = pageSize;
  if (query) config.params = query;

  if (noCache) {
    // console.log('noCache received header', received, received.headers);
    config = setNoCache(config);
  }

  if (replaceHeaders) {
    config = {
      headers: replaceHeaders,
    };
  }

  config = setConfigByMethod(config, data, method);
  return config;
};

const reduceError = async (
  error: any,
  url: string,
  method: string,
  newRequest
) => {
  error = improveErrorMessage(error, url, method);

  if (error.code >= 500 && error.code < 600) {
    console.error('CodeError:', error);
    return await newRequest();
  } else {
    console.error('Error:', error);
    console.error(error);
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
  replaceHeaders?
) => {
  let url = cleanUrl(address, path);

  try {
    const protocol = getProtocol(url);

    const config = generateConfig(
      method,
      token,
      query,
      data,
      page,
      pageSize,
      noCache,
      replaceHeaders
    );

    const param2 = generateParam2(method, clearBaseURL, config, data);

    const param3 = generateParam3(clearBaseURL, config);

    url = protocol + url;
    // console.log('URL', url);
    // console.log('Method', method);
    // console.log('Param2', param2);
    // console.log('Param3', param3);

    const received = await axios[method](url, param2, param3);

    return received as AxiosResponse<Output>;
  } catch (error: any) {
    await reduceError(error, url, method, async () => {
      return (await request(
        address,
        method,
        path,
        token,
        query,
        data,
        clearBaseURL,
        page,
        pageSize
      )) as AxiosResponse<Output>;
    });
  }
};

export { request };
