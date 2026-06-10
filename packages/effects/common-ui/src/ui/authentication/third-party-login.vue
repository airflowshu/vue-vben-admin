<script setup lang="ts">
import type { AuthenticationThirdPartyProvider } from './types';

import { computed } from 'vue';

import { useAppConfig } from '@vben/hooks';
import {
  SvgGithubIcon,
  SvgGoogleIcon,
  SvgQQChatIcon,
  SvgWeChatIcon,
} from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import DingdingLogin from './dingding-login.vue';

defineOptions({
  name: 'ThirdPartyLogin',
});

const props = withDefaults(
  defineProps<{
    providers?: AuthenticationThirdPartyProvider[];
  }>(),
  {
    providers: () => [],
  },
);

const emit = defineEmits<{
  login: [AuthenticationThirdPartyProvider];
}>();

const {
  auth: { dingding: dingdingAuthConfig },
} = useAppConfig(import.meta.env, import.meta.env.PROD);

const enabledProviders = computed(() =>
  props.providers.filter((provider) => provider.enabled !== false),
);

const showDingding = computed(() =>
  enabledProviders.value.some((provider) => provider.code === 'dingding'),
);

function providerTooltip(provider: AuthenticationThirdPartyProvider) {
  if (provider.code === 'github') {
    return $t('authentication.githubLogin');
  }
  if (provider.code === 'google') {
    return $t('authentication.googleLogin');
  }
  if (provider.code === 'qq') {
    return $t('authentication.qqLogin');
  }
  if (provider.code === 'wechat') {
    return $t('authentication.wechatLogin');
  }
  return provider.code;
}

function handleLogin(provider: AuthenticationThirdPartyProvider) {
  emit('login', provider);
}
</script>

<template>
  <div class="w-full sm:mx-auto md:max-w-md">
    <div class="mt-4 flex items-center justify-between">
      <span class="w-[35%] border-b border-input dark:border-gray-600"></span>
      <span class="text-center text-xs text-muted-foreground uppercase">
        {{ $t('authentication.thirdPartyLogin') }}
      </span>
      <span class="w-[35%] border-b border-input dark:border-gray-600"></span>
    </div>

    <div class="mt-4 flex flex-wrap justify-center">
      <VbenIconButton
        v-for="provider in enabledProviders"
        :key="provider.code"
        :tooltip="providerTooltip(provider)"
        tooltip-side="top"
        class="mb-3"
        @click="handleLogin(provider)"
      >
        <SvgGithubIcon v-if="provider.code === 'github'" />
        <SvgGoogleIcon v-else-if="provider.code === 'google'" />
        <SvgQQChatIcon v-else-if="provider.code === 'qq'" />
        <SvgWeChatIcon v-else-if="provider.code === 'wechat'" />
        <SvgGithubIcon v-else />
      </VbenIconButton>
      <DingdingLogin
        v-if="dingdingAuthConfig && showDingding"
        :corp-id="dingdingAuthConfig.corpId"
        :client-id="dingdingAuthConfig.clientId"
        class="mb-3"
      />
    </div>
  </div>
</template>
