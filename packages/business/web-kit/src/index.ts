import type { App } from 'vue';

import type { ComponentRecordType } from '@vben/types';

export type LocaleLoader = () => Promise<{ default: Record<string, any> }>;
export type LocaleLoaders = Record<string, LocaleLoader>;

export interface FlexbootWebModule {
  componentKeys: string[];
  install?: (app: App) => Promise<void> | void;
  locales?: LocaleLoaders;
  name: string;
  pages: ComponentRecordType;
}

export interface FlexbootRequestClient {
  delete: <T = any>(url: string, config?: any) => Promise<T>;
  download: <T = Blob>(url: string, config?: any) => Promise<T>;
  get: <T = any>(url: string, config?: any) => Promise<T>;
  post: <T = any>(url: string, data?: any, config?: any) => Promise<T>;
  put: <T = any>(url: string, data?: any, config?: any) => Promise<T>;
  upload: <T = any>(
    url: string,
    data: Record<string, any> & { file: Blob | File },
    config?: any,
  ) => Promise<T>;
}

export interface SearchItem {
  children?: SearchItem[];
  field?: string;
  logic?: 'AND' | 'OR';
  op?: string;
  val?: any;
}

export interface OrderItem {
  asc: boolean;
  column: string;
}

export interface SearchRequest {
  items?: SearchItem[];
  keyword?: string;
  logic?: 'AND' | 'OR';
  orders?: OrderItem[];
  pageNumber: number;
  pageSize: number;
  searchFields?: string[];
}

let requestClient: FlexbootRequestClient | undefined;
let baseRequestClient: FlexbootRequestClient | undefined;
let flexbootComponentKeys: string[] = [];

function defineFlexbootWebModule(module: FlexbootWebModule) {
  return module;
}

function setFlexbootRequestClient(client: FlexbootRequestClient) {
  requestClient = client;
}

function setFlexbootBaseRequestClient(client: FlexbootRequestClient) {
  baseRequestClient = client;
}

function setFlexbootComponentKeys(keys: string[]) {
  flexbootComponentKeys = [...new Set(keys)].toSorted();
}

function getFlexbootComponentKeys() {
  return flexbootComponentKeys;
}

function useFlexbootRequestClient() {
  if (!requestClient) {
    throw new Error('FlexBoot4 request client is not initialized.');
  }
  return requestClient;
}

function useFlexbootBaseRequestClient() {
  if (!baseRequestClient) {
    throw new Error('FlexBoot4 base request client is not initialized.');
  }
  return baseRequestClient;
}

function buildSearchItem(
  field: string,
  op: string,
  val: any,
  logic?: 'AND' | 'OR',
): SearchItem {
  return {
    field,
    op,
    val,
    logic,
  };
}

function buildSearchGroup(
  logic: 'AND' | 'OR',
  children: SearchItem[],
): SearchItem {
  return {
    logic,
    children,
  };
}

function normalizeViewPath(path: string) {
  const normalizedPath = path.replace(/^(\.\/|\.\.\/)+/, '');
  const viewPath = normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`;
  return viewPath.replace(/^\/src\/views/, '').replace(/^\/views/, '');
}

function normalizePages(pages: ComponentRecordType): ComponentRecordType {
  const result: ComponentRecordType = {};
  for (const [key, value] of Object.entries(pages)) {
    const normalized = normalizeViewPath(key);
    result[normalized] = value;
  }
  return result;
}

function componentKeysFromPages(pages: ComponentRecordType) {
  return Object.keys(normalizePages(pages))
    .filter((path) => path.endsWith('.vue'))
    .map((path) => path.slice(0, -4))
    .toSorted();
}

function mergeFlexbootPages(modules: FlexbootWebModule[]) {
  const pages: ComponentRecordType = {};
  for (const module of modules) {
    Object.assign(pages, normalizePages(module.pages));
  }
  return pages;
}

function mergeFlexbootComponentKeys(
  coreKeys: string[],
  modules: FlexbootWebModule[],
) {
  return [
    ...new Set([
      ...coreKeys,
      ...modules.flatMap((module) => module.componentKeys),
    ]),
  ].toSorted();
}

async function loadFlexbootModuleMessages(
  modules: FlexbootWebModule[],
  lang: string,
) {
  const messages = await Promise.all(
    modules.map(async (module) => module.locales?.[lang]?.()),
  );
  return Object.assign(
    {},
    ...messages.map((message) => message?.default ?? {}),
  ) as Record<string, any>;
}

async function installFlexbootModules(app: App, modules: FlexbootWebModule[]) {
  for (const module of modules) {
    await module.install?.(app);
  }
}

export {
  buildSearchGroup,
  buildSearchItem,
  componentKeysFromPages,
  defineFlexbootWebModule,
  getFlexbootComponentKeys,
  installFlexbootModules,
  loadFlexbootModuleMessages,
  mergeFlexbootComponentKeys,
  mergeFlexbootPages,
  normalizePages,
  setFlexbootBaseRequestClient,
  setFlexbootComponentKeys,
  setFlexbootRequestClient,
  useFlexbootBaseRequestClient,
  useFlexbootRequestClient,
};
