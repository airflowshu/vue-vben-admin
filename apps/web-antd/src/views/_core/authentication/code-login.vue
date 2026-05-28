<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { Form, Input, Modal, message } from 'ant-design-vue';

import { sendSmsCodeApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'CodeLogin' });

const loading = ref(false);
const sending = ref(false);
const authStore = useAuthStore();
const codeLength = computed(
  () => authStore.loginOptions?.methods?.sms?.codeLength ?? 6,
);
const cooldownSeconds = computed(
  () => authStore.loginOptions?.methods?.sms?.cooldownSeconds ?? 60,
);
const phoneRef = ref('');
const mfaForm = reactive({
  code: '',
});
const mfaModalOpen = computed(() => !!authStore.mfaChallenge);
const mfaExpiresInMinutes = computed(() =>
  Math.max(1, Math.ceil((authStore.mfaChallenge?.expiresIn ?? 300) / 60)),
);

const formSchema = computed((): VbenFormSchema[] => {
  const smsCodeLength = codeLength.value;
  const smsCooldownSeconds = cooldownSeconds.value;
  const isSending = sending.value;
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.mobile'),
      },
      dependencies: {
        trigger(values) {
          phoneRef.value = String(values.phoneNumber ?? '');
        },
        triggerFields: ['phoneNumber'],
      },
      fieldName: 'phoneNumber',
      label: $t('authentication.mobile'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.mobileTip') })
        .refine((v) => /^\d{11}$/.test(v), {
          message: $t('authentication.mobileErrortip'),
        }),
    },
    {
      component: 'VbenPinInput',
      componentProps: {
        codeLength: smsCodeLength,
        createText: (countdown: number) => {
          const text =
            countdown > 0
              ? $t('authentication.sendText', [countdown])
              : $t('authentication.sendCode');
          return text;
        },
        handleSendCode,
        loading: isSending,
        maxTime: smsCooldownSeconds,
        placeholder: $t('authentication.code'),
      },
      fieldName: 'code',
      label: $t('authentication.code'),
      rules: z.string().length(codeLength.value, {
        message: $t('authentication.codeTip', [codeLength.value]),
      }),
    },
  ];
});

async function handleSendCode() {
  if (!/^1[3-9]\d{9}$/.test(phoneRef.value)) {
    message.warning($t('authentication.mobileErrortip'));
    throw new Error('Invalid phone number');
  }
  try {
    sending.value = true;
    await sendSmsCodeApi(phoneRef.value);
    message.success($t('authentication.sendCodeSecurityTip'));
  } finally {
    sending.value = false;
  }
}
/**
 * 异步处理登录操作
 * Asynchronously handle the login process
 * @param values 登录表单数据
 */
async function handleLogin(values: Recordable<unknown>) {
  loading.value = true;
  try {
    await authStore.authLogin({
      code: String(values.code ?? ''),
      loginType: 'sms',
      phone: String(values.phoneNumber ?? ''),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  authStore.fetchLoginOptions().catch(() => {});
});

watch(
  () => authStore.mfaChallenge?.token,
  () => {
    mfaForm.code = '';
  },
);

async function handleMfaVerify() {
  const code = mfaForm.code.trim();
  if (!/^\d{6}$/.test(code)) {
    message.warning('请输入 6 位动态验证码');
    return;
  }
  await authStore.authVerifyMfa(code);
}
</script>

<template>
  <div>
    <AuthenticationCodeLogin
      :form-schema="formSchema"
      :loading="loading"
      @submit="handleLogin"
    >
      <template #title>
        {{ $t('authentication.mobileLogin') }}
      </template>
      <template #subTitle>
        {{ $t('authentication.codeLoginBoundTip') }}
      </template>
    </AuthenticationCodeLogin>
    <Modal
      :open="mfaModalOpen"
      :confirm-loading="authStore.loginLoading"
      destroy-on-close
      ok-text="验证并登录"
      title="多因素认证"
      @update:open="
        (open) => {
          if (!open) authStore.clearMfaChallenge();
        }
      "
      @cancel="authStore.clearMfaChallenge"
      @ok="handleMfaVerify"
    >
      <Form class="pt-2" layout="vertical">
        <Form.Item label="认证器动态码" required>
          <Input
            v-model:value="mfaForm.code"
            :maxlength="6"
            autocomplete="one-time-code"
            placeholder="请输入认证器中的 6 位动态码"
          />
        </Form.Item>
        <div class="text-muted-foreground text-sm">
          请打开 Microsoft Authenticator 或其他认证器应用查看动态验证码。验证有效期约
          {{ mfaExpiresInMinutes }} 分钟。
        </div>
      </Form>
    </Modal>
  </div>
</template>
