import { z } from '@vben/common-ui';

export type ConfigValueType =
  | 'ARRAY'
  | 'BOOLEAN'
  | 'JSON'
  | 'NUMBER'
  | 'STRING';

export const CONFIG_TYPE_OPTIONS: Array<{
  label: string;
  value: ConfigValueType;
}> = [
  { value: 'STRING', label: '字符串' },
  { value: 'NUMBER', label: '数字' },
  { value: 'BOOLEAN', label: '布尔值' },
  { value: 'JSON', label: 'JSON' },
  { value: 'ARRAY', label: '数组' },
];

export function normalizeConfigValueType(type?: string): ConfigValueType {
  if (
    type === 'ARRAY' ||
    type === 'BOOLEAN' ||
    type === 'JSON' ||
    type === 'NUMBER' ||
    type === 'STRING'
  ) {
    return type;
  }
  return 'STRING';
}

export function isStructuredConfigValueType(type?: string) {
  const normalizedType = normalizeConfigValueType(type);
  return normalizedType === 'JSON' || normalizedType === 'ARRAY';
}

export function getConfigValuePlaceholder(type?: string) {
  switch (normalizeConfigValueType(type)) {
    case 'ARRAY': {
      return '请输入JSON数组格式，如：["a", "b", "c"]';
    }
    case 'BOOLEAN': {
      return '请输入 true、false、0 或 1';
    }
    case 'JSON': {
      return '请输入JSON格式，如：{"key": "value"}';
    }
    case 'NUMBER': {
      return '请输入数字，如：100、-5.5';
    }
    default: {
      return '请输入配置值';
    }
  }
}

export function getConfigValueRules(type?: string) {
  switch (normalizeConfigValueType(type)) {
    case 'ARRAY': {
      return z
        .string()
        .min(1, '请输入数组')
        .refine((value) => isValidArray(value), {
          message: '请输入有效的JSON数组格式',
        });
    }
    case 'BOOLEAN': {
      return z
        .string()
        .min(1, '请输入布尔值')
        .regex(/^(?:true|false|0|1)$/i, '请输入 true、false、0 或 1');
    }
    case 'JSON': {
      return z
        .string()
        .min(1, '请输入JSON')
        .refine((value) => isValidJson(value), {
          message: '请输入有效的JSON格式',
        });
    }
    case 'NUMBER': {
      return z
        .string()
        .min(1, '请输入数字')
        .regex(/^-?\d+(?:\.\d+)?$/, '请输入有效的数字');
    }
    default: {
      return z.string().min(1, '请输入配置值');
    }
  }
}

export function getConfigValueComponent(type?: string) {
  return isStructuredConfigValueType(type) ? 'Textarea' : 'Input';
}

export function getConfigValueComponentProps(type?: string) {
  const placeholder = getConfigValuePlaceholder(type);
  if (!isStructuredConfigValueType(type)) {
    return { placeholder };
  }

  return {
    autoSize: { minRows: 8, maxRows: 12 },
    placeholder,
    style: {
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
      lineHeight: '1.6',
    },
  };
}

export function validateConfigValue(value: string, type?: string) {
  if (!value) {
    return false;
  }

  switch (normalizeConfigValueType(type)) {
    case 'ARRAY': {
      return isValidArray(value);
    }
    case 'BOOLEAN': {
      return /^(?:true|false|0|1)$/i.test(value);
    }
    case 'JSON': {
      return isValidJson(value);
    }
    case 'NUMBER': {
      return /^-?\d+(?:\.\d+)?$/.test(value);
    }
    default: {
      return true;
    }
  }
}

export function getConfigValueInvalidMessage(type?: string) {
  switch (normalizeConfigValueType(type)) {
    case 'ARRAY': {
      return '配置值格式不正确，请检查是否为有效的 JSON 数组格式';
    }
    case 'BOOLEAN': {
      return '配置值格式不正确，请输入 true、false、0 或 1';
    }
    case 'JSON': {
      return '配置值格式不正确，请检查是否为有效的 JSON 格式';
    }
    case 'NUMBER': {
      return '配置值格式不正确，请输入有效的数字';
    }
    default: {
      return '请输入配置值';
    }
  }
}

export function formatStructuredConfigValue(
  value: string,
  type?: string,
  compact = false,
): { message: string; success: false } | { success: true; value: string } {
  const normalizedType = normalizeConfigValueType(type);
  if (!isStructuredConfigValueType(normalizedType)) {
    return { success: false, message: '当前配置类型不支持格式化' };
  }

  try {
    const parsed = JSON.parse(value);
    if (normalizedType === 'ARRAY' && !Array.isArray(parsed)) {
      return { success: false, message: '请输入有效的 JSON 数组格式' };
    }
    return {
      success: true,
      value: JSON.stringify(parsed, null, compact ? 0 : 2),
    };
  } catch {
    return {
      success: false,
      message:
        normalizedType === 'ARRAY'
          ? '请输入有效的 JSON 数组格式'
          : '请输入有效的 JSON 格式',
    };
  }
}

function isValidJson(value: string) {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function isValidArray(value: string) {
  try {
    return Array.isArray(JSON.parse(value));
  } catch {
    return false;
  }
}
