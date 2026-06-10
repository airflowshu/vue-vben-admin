<script lang="ts" setup>
import type { AuthApi } from '#/api';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';

import {
  Avatar,
  Button,
  Form,
  Input,
  message,
  Modal,
  Spin,
} from 'ant-design-vue';

import { bindOAuthAccountApi, getOAuthResultApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'OAuthCallback' });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const binding = ref(false);
const result = ref<AuthApi.OAuthCallbackResult | null>(null);
const bindForm = reactive({
  password: '',
  username: '',
});
const mfaForm = reactive({
  code: '',
});

const externalUser = computed(() => result.value?.externalUser);
const provider = computed(() => externalUser.value?.provider || 'github');
const candidates = computed(() => result.value?.candidates ?? []);
const status = computed(() => result.value?.status);
const errorMessage = computed(
  () => result.value?.message || '第三方登录失败，请重新登录',
);
const mfaModalOpen = computed(() => !!authStore.mfaChallenge);
const mfaExpiresInMinutes = computed(() =>
  Math.max(1, Math.ceil((authStore.mfaChallenge?.expiresIn ?? 300) / 60)),
);

onMounted(async () => {
  const ticket = String(route.query.ticket || '');
  if (!ticket) {
    result.value = {
      message: '登录结果票据缺失，请重新登录',
      status: 'ERROR',
    };
    loading.value = false;
    return;
  }

  try {
    const oauthResult = await getOAuthResultApi(ticket);
    result.value = oauthResult;
    if (
      oauthResult.status === 'LOGIN_SUCCESS' &&
      oauthResult.login?.accessToken
    ) {
      await authStore.completeLoginWithToken(oauthResult.login.accessToken);
      return;
    }
    if (oauthResult.status === 'MFA_REQUIRED' && oauthResult.login) {
      authStore.setMfaChallenge(oauthResult.login);
    }
    if (oauthResult.status === 'BIND_REQUIRED') {
      bindForm.username = oauthResult.candidates?.[0]?.username ?? '';
    }
  } finally {
    loading.value = false;
  }
});

watch(
  () => authStore.mfaChallenge?.token,
  () => {
    mfaForm.code = '';
  },
);

async function handleBind() {
  if (!result.value?.bindTicket) {
    message.error('绑定票据已过期，请重新登录');
    return;
  }
  if (!bindForm.username.trim() || !bindForm.password) {
    message.warning('请输入系统账号和密码');
    return;
  }
  try {
    binding.value = true;
    const loginResult = await bindOAuthAccountApi(provider.value, {
      bindTicket: result.value.bindTicket,
      password: bindForm.password,
      username: bindForm.username.trim(),
    });
    authStore.setMfaChallenge(loginResult);
    if (loginResult.accessToken) {
      await authStore.completeLoginWithToken(loginResult.accessToken);
    }
  } finally {
    binding.value = false;
  }
}

async function handleMfaVerify() {
  const code = mfaForm.code.trim();
  if (!/^\d{6}$/.test(code)) {
    message.warning('请输入 6 位动态验证码');
    return;
  }
  await authStore.authVerifyMfa(code);
}

function backToLogin() {
  router.replace(LOGIN_PATH);
}
</script>

<template>
  <div class="w-full sm:mx-auto md:max-w-md">
    <div v-if="loading" class="flex min-h-48 items-center justify-center">
      <Spin />
    </div>

    <div v-else-if="status === 'BIND_REQUIRED'" class="space-y-5">
      <div class="text-center">
        <Avatar :src="externalUser?.avatarUrl" :size="56" class="mb-3" />
        <div class="text-lg font-medium">绑定系统账号</div>
        <div class="text-muted-foreground mt-1 text-sm">
          {{ externalUser?.nickname || externalUser?.providerUsername }}
        </div>
      </div>

      <div
        v-if="candidates.length > 0"
        class="border-border bg-muted/30 rounded-md border p-3 text-sm"
      >
        已根据 GitHub 验证邮箱找到候选账号：
        <button
          v-for="candidate in candidates"
          :key="candidate.userId"
          class="vben-link ml-1"
          type="button"
          @click="bindForm.username = candidate.username"
        >
          {{ candidate.username }}
        </button>
      </div>

      <Form layout="vertical">
        <Form.Item label="系统账号" required>
          <Input
            v-model:value="bindForm.username"
            autocomplete="username"
            placeholder="请输入系统账号"
          />
        </Form.Item>
        <Form.Item label="系统密码" required>
          <Input.Password
            v-model:value="bindForm.password"
            autocomplete="current-password"
            placeholder="请输入系统密码"
          />
        </Form.Item>
      </Form>

      <Button :loading="binding" block type="primary" @click="handleBind">
        绑定并登录
      </Button>
      <Button block @click="backToLogin">返回登录</Button>
    </div>

    <div v-else class="space-y-4 text-center">
      <div class="text-lg font-medium">第三方登录未完成</div>
      <div class="text-muted-foreground text-sm">{{ errorMessage }}</div>
      <Button block type="primary" @click="backToLogin">返回登录</Button>
    </div>

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
