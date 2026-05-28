<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';

import { useQRCode } from '@vueuse/integrations/useQRCode';
import {
  Alert,
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  Modal,
  Space,
  Tag,
  message,
} from 'ant-design-vue';

import {
  bindSecurityEmailApi,
  bindSecurityPhoneApi,
  confirmMfaTotpApi,
  disableMfaTotpApi,
  sendSecurityEmailCodeApi,
  sendSecurityPhoneCodeApi,
  setupMfaTotpApi,
  type UserMfaTotpSetupResult,
} from '#/api/system/user';
import { useAuthStore } from '#/store';

const userStore = useUserStore();
const authStore = useAuthStore();

type BindType = 'email' | 'phone';

const activeBindType = ref<BindType>('phone');
const modalOpen = ref(false);
const mfaSetupOpen = ref(false);
const mfaDisableOpen = ref(false);
const sending = ref(false);
const binding = ref(false);
const mfaSettingUp = ref(false);
const mfaConfirming = ref(false);
const mfaDisabling = ref(false);
const mfaSetup = ref<null | UserMfaTotpSetupResult>(null);
const countdown = ref(0);
let countdownTimer: null | ReturnType<typeof setTimeout> = null;

const formModel = reactive({
  code: '',
  email: '',
  phone: '',
});

const mfaBindForm = reactive({
  code: '',
  deviceName: '认证器应用',
});

const mfaDisableForm = reactive({
  code: '',
  password: '',
});

const disabledMfaOkButtonProps = computed(() => ({
  disabled: mfaSettingUp.value || !mfaSetup.value,
}));

const securityPhoneBound = computed(
  () => userStore.userInfo?.securityPhoneBound === true,
);

const securityPhoneText = computed(() =>
  securityPhoneBound.value
    ? `已绑定手机：${userStore.userInfo?.securityPhoneMasked ?? '-'}`
    : '未绑定密保手机，绑定后可用于手机号验证码登录',
);

const securityEmailBound = computed(
  () => userStore.userInfo?.securityEmailBound === true,
);

const securityEmailText = computed(() =>
  securityEmailBound.value
    ? `已绑定邮箱：${userStore.userInfo?.securityEmailMasked ?? '-'}`
    : '未绑定备用邮箱，绑定后可用于密码找回等安全操作',
);

const mfaEnabled = computed(() => userStore.userInfo?.mfaEnabled === true);

const mfaText = computed(() =>
  mfaEnabled.value
    ? `已绑定认证器：${userStore.userInfo?.mfaDeviceName ?? '认证器应用'}；解绑后再次启用需重新扫码绑定`
    : '未绑定 MFA 设备，绑定后登录需输入认证器动态码',
);

const mfaOtpAuthUri = computed(() => mfaSetup.value?.otpauthUri ?? 'about:blank');
const mfaQrCode = useQRCode(mfaOtpAuthUri);

const codeLength = computed(
  () =>
    activeBindType.value === 'phone'
      ? (authStore.loginOptions?.methods?.sms?.codeLength ?? 6)
      : 6,
);

const cooldownSeconds = computed(
  () =>
    activeBindType.value === 'phone'
      ? (authStore.loginOptions?.methods?.sms?.cooldownSeconds ?? 60)
      : 60,
);

const sendButtonText = computed(() =>
  countdown.value > 0 ? `${countdown.value}s 后重试` : '发送验证码',
);

const securityItems = computed(() => [
  {
    action: securityPhoneBound.value ? '更换' : '绑定',
    description: securityPhoneText.value,
    key: 'securityPhone',
    status: securityPhoneBound.value ? '已绑定' : '未绑定',
    statusColor: securityPhoneBound.value ? 'success' : 'warning',
    title: '密保手机',
  },
  {
    action: securityEmailBound.value ? '更换' : '绑定',
    description: securityEmailText.value,
    key: 'securityEmail',
    status: securityEmailBound.value ? '已绑定' : '未绑定',
    statusColor: securityEmailBound.value ? 'success' : 'warning',
    title: '备用邮箱',
  },
  {
    action: mfaEnabled.value ? '解绑' : '绑定',
    description: mfaText.value,
    key: 'securityMfa',
    status: mfaEnabled.value ? '已绑定' : '未绑定',
    statusColor: mfaEnabled.value ? 'success' : 'warning',
    title: 'MFA 设备',
  },
]);

watch(modalOpen, (open) => {
  if (!open) {
    resetForm();
  }
});

watch(mfaSetupOpen, (open) => {
  if (!open) {
    resetMfaBindForm();
  }
});

watch(mfaDisableOpen, (open) => {
  if (!open) {
    resetMfaDisableForm();
  }
});

const modalTitle = computed(() => {
  if (activeBindType.value === 'email') {
    return securityEmailBound.value ? '更换备用邮箱' : '绑定备用邮箱';
  }
  return securityPhoneBound.value ? '更换密保手机' : '绑定密保手机';
});

const inputLabel = computed(() =>
  activeBindType.value === 'email' ? '邮箱' : '手机号',
);

const inputPlaceholder = computed(() =>
  activeBindType.value === 'email'
    ? '请输入要绑定的邮箱'
    : '请输入要绑定的手机号',
);

const codePlaceholder = computed(() =>
  activeBindType.value === 'email' ? '请输入邮箱验证码' : '请输入短信验证码',
);

function openBindModal(type: BindType) {
  activeBindType.value = type;
  modalOpen.value = true;
  if (type === 'phone') {
    authStore.fetchLoginOptions().catch(() => {});
  }
}

function handleItemAction(key: string) {
  if (key === 'securityPhone') {
    openBindModal('phone');
  } else if (key === 'securityEmail') {
    openBindModal('email');
  } else if (key === 'securityMfa') {
    if (mfaEnabled.value) {
      mfaDisableOpen.value = true;
    } else {
      openMfaSetupModal();
    }
  }
}

async function openMfaSetupModal() {
  mfaSetupOpen.value = true;
  mfaSettingUp.value = true;
  try {
    mfaSetup.value = await setupMfaTotpApi();
  } finally {
    mfaSettingUp.value = false;
  }
}

function normalizePhone(value: string) {
  return value.trim().replaceAll(/\s+/g, '');
}

function validatePhone() {
  const phone = normalizePhone(formModel.phone);
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    message.warning('请输入正确的手机号');
    return '';
  }
  formModel.phone = phone;
  return phone;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validateEmail() {
  const email = normalizeEmail(formModel.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    message.warning('请输入正确的邮箱地址');
    return '';
  }
  formModel.email = email;
  return email;
}

async function handleSendCode() {
  const target =
    activeBindType.value === 'email' ? validateEmail() : validatePhone();
  if (!target || countdown.value > 0) {
    return;
  }
  try {
    sending.value = true;
    if (activeBindType.value === 'email') {
      await sendSecurityEmailCodeApi(target);
    } else {
      await sendSecurityPhoneCodeApi(target);
    }
    message.success('验证码已发送，请注意查收');
    startCountdown();
  } finally {
    sending.value = false;
  }
}

async function handleBindPhone() {
  const target =
    activeBindType.value === 'email' ? validateEmail() : validatePhone();
  if (!target) {
    return;
  }
  const code = formModel.code.trim();
  if (code.length !== codeLength.value) {
    message.warning(`请输入 ${codeLength.value} 位验证码`);
    return;
  }

  try {
    binding.value = true;
    if (activeBindType.value === 'email') {
      const wasBound = securityEmailBound.value;
      await bindSecurityEmailApi({ code, email: target });
      await authStore.fetchUserInfo();
      message.success(wasBound ? '备用邮箱已更新' : '备用邮箱已绑定');
    } else {
      const wasBound = securityPhoneBound.value;
      await bindSecurityPhoneApi({ code, phone: target });
      await authStore.fetchUserInfo();
      message.success(wasBound ? '密保手机已更新' : '密保手机已绑定');
    }
    modalOpen.value = false;
  } finally {
    binding.value = false;
  }
}

async function handleConfirmMfa() {
  const code = mfaBindForm.code.trim();
  if (!/^\d{6}$/.test(code)) {
    message.warning('请输入 6 位动态验证码');
    return;
  }

  try {
    mfaConfirming.value = true;
    await confirmMfaTotpApi({
      code,
      deviceName: mfaBindForm.deviceName.trim() || '认证器应用',
    });
    await authStore.fetchUserInfo();
    message.success('MFA 设备已绑定');
    mfaSetupOpen.value = false;
  } finally {
    mfaConfirming.value = false;
  }
}

async function handleDisableMfa() {
  const password = mfaDisableForm.password;
  const code = mfaDisableForm.code.trim();
  if (!password) {
    message.warning('请输入当前密码');
    return;
  }
  if (!/^\d{6}$/.test(code)) {
    message.warning('请输入 6 位动态验证码');
    return;
  }

  try {
    mfaDisabling.value = true;
    await disableMfaTotpApi({ code, password });
    await authStore.fetchUserInfo();
    message.success('MFA 设备已解绑');
    mfaDisableOpen.value = false;
  } finally {
    mfaDisabling.value = false;
  }
}

function startCountdown() {
  clearCountdown();
  countdown.value = cooldownSeconds.value;
  tickCountdown();
}

function tickCountdown() {
  if (countdown.value <= 0) {
    clearCountdown();
    return;
  }
  countdownTimer = setTimeout(() => {
    countdown.value -= 1;
    tickCountdown();
  }, 1000);
}

function clearCountdown() {
  if (countdownTimer) {
    clearTimeout(countdownTimer);
    countdownTimer = null;
  }
}

function resetForm() {
  formModel.phone = '';
  formModel.email = '';
  formModel.code = '';
  sending.value = false;
  binding.value = false;
  countdown.value = 0;
  clearCountdown();
}

function resetMfaBindForm() {
  mfaSetup.value = null;
  mfaBindForm.code = '';
  mfaBindForm.deviceName = '认证器应用';
  mfaSettingUp.value = false;
  mfaConfirming.value = false;
}

function resetMfaDisableForm() {
  mfaDisableForm.code = '';
  mfaDisableForm.password = '';
  mfaDisabling.value = false;
}

onBeforeUnmount(() => {
  clearCountdown();
});
</script>

<template>
  <div class="security-settings">
    <div
      v-for="item in securityItems"
      :key="item.key"
      class="security-settings__item"
    >
      <div class="security-settings__content">
        <div class="security-settings__title-row">
          <span class="security-settings__title">{{ item.title }}</span>
          <Tag :color="item.statusColor">{{ item.status }}</Tag>
        </div>
        <div class="security-settings__description">
          {{ item.description }}
        </div>
      </div>
      <Button
        type="link"
        @click="handleItemAction(item.key)"
      >
        {{ item.action }}
      </Button>
    </div>

    <Modal
      v-model:open="modalOpen"
      :confirm-loading="binding"
      :title="modalTitle"
      destroy-on-close
      ok-text="确认绑定"
      @ok="handleBindPhone"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item :label="inputLabel" required>
          <Input
            v-if="activeBindType === 'phone'"
            v-model:value="formModel.phone"
            :disabled="binding"
            allow-clear
            :maxlength="11"
            :placeholder="inputPlaceholder"
          />
          <Input
            v-else
            v-model:value="formModel.email"
            :disabled="binding"
            allow-clear
            :maxlength="120"
            :placeholder="inputPlaceholder"
          />
        </Form.Item>
        <Form.Item label="验证码" required>
          <Space.Compact class="w-full">
            <Input
              v-model:value="formModel.code"
              :disabled="binding"
              :maxlength="codeLength"
              :placeholder="codePlaceholder"
            />
            <Button
              :disabled="countdown > 0 || binding"
              :loading="sending"
              @click="handleSendCode"
            >
              {{ sendButtonText }}
            </Button>
          </Space.Compact>
        </Form.Item>
      </Form>
    </Modal>

    <Drawer
      v-model:open="mfaSetupOpen"
      destroy-on-close
      title="绑定 MFA 设备"
      width="560px"
    >
      <div v-if="mfaSettingUp" class="security-settings__mfa-loading">
        正在生成认证器二维码...
      </div>
      <div v-else-if="mfaSetup" class="security-settings__mfa-setup">
        <Alert
          message="如认证器应用中已有旧的 FlexBoot4 条目，建议先在手机端删除旧条目后再扫码绑定，避免后续使用时混淆。"
          show-icon
          type="info"
        />
        <div class="security-settings__mfa-qr">
          <img :src="mfaQrCode" alt="MFA QR Code" />
        </div>
        <div class="security-settings__mfa-copy">
          使用 Microsoft Authenticator、Google Authenticator 等认证器扫描二维码。
        </div>
        <Divider>账户名</Divider>
        <Input :value="mfaSetup.accountName" readonly />
        <Divider>手动输入密钥</Divider>
        <Input :value="mfaSetup.manualKey" readonly />
        <Form class="mt-4" layout="vertical">
          <Form.Item label="设备名称">
            <Input
              v-model:value="mfaBindForm.deviceName"
              :maxlength="120"
              placeholder="例如：Microsoft Authenticator"
            />
          </Form.Item>
          <Form.Item label="动态验证码" required>
            <Input
              v-model:value="mfaBindForm.code"
              :maxlength="6"
              autocomplete="one-time-code"
              placeholder="请输入认证器中的 6 位动态码"
            />
          </Form.Item>
        </Form>
      </div>
      <template #footer>
        <Space>
          <Button @click="mfaSetupOpen = false">取消</Button>
          <Button
            :disabled="disabledMfaOkButtonProps.disabled"
            :loading="mfaConfirming"
            type="primary"
            @click="handleConfirmMfa"
          >
            确认绑定
          </Button>
        </Space>
      </template>
    </Drawer>

    <Modal
      v-model:open="mfaDisableOpen"
      :confirm-loading="mfaDisabling"
      destroy-on-close
      ok-text="确认解绑"
      title="解绑 MFA 设备"
      @ok="handleDisableMfa"
    >
      <Form class="pt-2" layout="vertical">
        <Alert
          class="mb-4"
          message="解绑后当前认证器将不再用于登录二次验证；如需再次启用，需要重新扫码绑定。"
          show-icon
          type="warning"
        />
        <Form.Item label="当前密码" required>
          <Input.Password
            v-model:value="mfaDisableForm.password"
            autocomplete="current-password"
            placeholder="请输入当前登录密码"
          />
        </Form.Item>
        <Form.Item label="动态验证码" required>
          <Input
            v-model:value="mfaDisableForm.code"
            :maxlength="6"
            autocomplete="one-time-code"
            placeholder="请输入认证器中的 6 位动态码"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.security-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.security-settings__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.security-settings__content {
  min-width: 0;
}

.security-settings__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.security-settings__title {
  font-size: 16px;
  font-weight: 500;
}

.security-settings__description {
  margin-top: 6px;
  color: hsl(var(--muted-foreground));
}

.security-settings__mfa-loading {
  padding: 32px 0;
  color: hsl(var(--muted-foreground));
  text-align: center;
}

.security-settings__mfa-setup {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.security-settings__mfa-qr {
  display: flex;
  justify-content: center;
}

.security-settings__mfa-qr img {
  width: 196px;
  height: 196px;
  padding: 8px;
  background: #fff;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.security-settings__mfa-copy {
  color: hsl(var(--muted-foreground));
  text-align: center;
}
</style>
