<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import { computed, markRaw, onMounted, reactive, watch } from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Form, Input, message, Modal } from 'ant-design-vue';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const mfaForm = reactive({
  code: '',
});

const mfaModalOpen = computed(() => !!authStore.mfaChallenge);
const mfaExpiresInMinutes = computed(() =>
  Math.max(1, Math.ceil((authStore.mfaChallenge?.expiresIn ?? 300) / 60)),
);

const MOCK_USER_OPTIONS: BasicOption[] = [
  {
    label: 'Super',
    value: 'super',
  },
  {
    label: 'Admin',
    value: 'admin',
  },
  {
    label: 'User',
    value: 'jack',
  },
  {
    label: 'Test',
    value: 'test',
  },
];

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenSelect',
      componentProps: {
        options: MOCK_USER_OPTIONS,
        placeholder: $t('authentication.selectAccount'),
      },
      fieldName: 'selectAccount',
      label: $t('authentication.selectAccount'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.selectAccount') })
        .optional()
        .default('super'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      dependencies: {
        trigger(values, form) {
          if (values.selectAccount) {
            const findUser = MOCK_USER_OPTIONS.find(
              (item) => item.value === values.selectAccount,
            );
            if (findUser) {
              form.setValues({
                password: '11111111',
                username: findUser.value,
              });
            }
          }
        },
        triggerFields: ['selectAccount'],
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(SliderCaptcha),
      fieldName: 'captcha',
      rules: z.boolean().refine((value) => value, {
        message: $t('authentication.verifyRequiredTip'),
      }),
    },
  ];
});

const loginMethods = computed(() => authStore.loginOptions?.methods ?? {});
const showCodeLogin = computed(() => loginMethods.value.sms?.enabled ?? false);
const showForgetPassword = computed(
  () => loginMethods.value.forgetPassword?.enabled ?? true,
);
const showQrcodeLogin = computed(
  () => loginMethods.value.qrcode?.enabled ?? false,
);
const showRegister = computed(
  () => loginMethods.value.register?.enabled ?? false,
);
const showThirdPartyLogin = computed(
  () => loginMethods.value.thirdParty?.enabled ?? false,
);

onMounted(() => {
  authStore.fetchLoginOptions().catch(() => {
    // 读取失败时使用组件默认保底配置，登录接口仍由后端校验。
  });
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
    <AuthenticationLogin
      :form-schema="formSchema"
      :loading="authStore.loginLoading"
      :show-code-login="showCodeLogin"
      :show-forget-password="showForgetPassword"
      :show-qrcode-login="showQrcodeLogin"
      :show-register="showRegister"
      :show-third-party-login="showThirdPartyLogin"
      @submit="authStore.authLogin"
    />
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
          请打开 Microsoft Authenticator
          或其他认证器应用查看动态验证码。验证有效期约
          {{ mfaExpiresInMinutes }} 分钟。
        </div>
      </Form>
    </Modal>
  </div>
</template>
