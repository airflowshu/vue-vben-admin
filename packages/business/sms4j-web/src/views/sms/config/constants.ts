export interface SmsSupplierPreset {
  accent: string;
  accentSoft: string;
  description: string;
  emptyTip: string;
  fieldHints: string[];
  label: string;
  supplierType: string;
}

export const SMS_SUPPLIER_PRESETS = [
  {
    accent: '#1677ff',
    accentSoft: 'rgb(22 119 255 / 14%)',
    description: '适合验证码、通知类短信的稳定发送与弹性扩容。',
    emptyTip: '当前还没有读取到阿里云配置，可直接在该卡片完成接入。',
    fieldHints: ['AccessKeyId', 'AccessKeySecret', '签名', '模板 ID'],
    label: '阿里云',
    supplierType: 'aliyun',
  },
  {
    accent: '#13c2c2',
    accentSoft: 'rgb(19 194 194 / 14%)',
    description: '适合多地域业务与国际化发送场景。',
    emptyTip: '当前还没有读取到腾讯云配置，可直接在该卡片完成接入。',
    fieldHints: ['AppId / 密钥', '签名', '模板 ID', 'SDK AppId'],
    label: '腾讯云',
    supplierType: 'tencent',
  },
  {
    accent: '#722ed1',
    accentSoft: 'rgb(114 46 209 / 14%)',
    description: '适合政企短信与华为云生态集成场景。',
    emptyTip: '当前还没有读取到华为云配置，可直接在该卡片完成接入。',
    fieldHints: ['AccessKey', 'Secret', '签名', '模板 ID'],
    label: '华为云',
    supplierType: 'huawei',
  },
  {
    accent: '#fa8c16',
    accentSoft: 'rgb(250 140 22 / 14%)',
    description: '轻量快速接入，适合中小业务的短信通知。',
    emptyTip: '当前还没有读取到短信宝配置，可直接在该卡片完成接入。',
    fieldHints: ['账号', '密码', '签名', '模板 ID'],
    label: '短信宝',
    supplierType: 'smsbao',
  },
  {
    accent: '#eb2f96',
    accentSoft: 'rgb(235 47 150 / 14%)',
    description: '企业级短信通道，适合营销与通知混合场景。',
    emptyTip: '当前还没有读取到梦网科技配置，可直接在该卡片完成接入。',
    fieldHints: ['企业账号', '密钥', '签名', '扩展参数'],
    label: '梦网科技',
    supplierType: 'mengwang',
  },
  {
    accent: '#52c41a',
    accentSoft: 'rgb(82 196 26 / 14%)',
    description: '适合行业短信与批量触达配置管理。',
    emptyTip: '当前还没有读取到亿联云配置，可直接在该卡片完成接入。',
    fieldHints: ['AccessKey', 'Secret', '签名', '模板 ID'],
    label: '亿联云',
    supplierType: 'yilian',
  },
  {
    accent: '#2f54eb',
    accentSoft: 'rgb(47 84 235 / 14%)',
    description: '适合短信、语音等多通道融合触达。',
    emptyTip: '当前还没有读取到容联云配置，可直接在该卡片完成接入。',
    fieldHints: ['AccountSid', 'AuthToken', '签名', '模板 ID'],
    label: '容联云',
    supplierType: 'cloopen',
  },
] satisfies SmsSupplierPreset[];

export function getSmsSupplierPreset(supplierType?: string) {
  if (!supplierType) {
    return undefined;
  }

  return SMS_SUPPLIER_PRESETS.find(
    (item) => item.supplierType === supplierType.toLowerCase(),
  );
}
