<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed, markRaw, onMounted, ref, watch } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { updateCurrentUserProfileApi } from '#/api/system/user';
import AvatarUpload from '#/views/common/upload/avatar.vue';

const userStore = useUserStore();

// 头像文件ID
const avatarFileId = ref(String(userStore.userInfo?.profileFileId ?? ''));

// 处理头像上传后的文件ID
function handleAvatarFileIdChange(fileId: string) {
  avatarFileId.value = fileId;
}

const profileBaseSettingRef = ref();

// 从 store 中获取用户角色
const userRoles = computed(() => {
  const roles = userStore.userInfo?.roles || [];
  // 将角色数组转换为 options 格式
  return roles.map((role: string) => ({
    label: role,
    value: role,
  }));
});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'avatar',
      component: markRaw(AvatarUpload),
      label: '头像',
      help: '支持jpg、png格式，文件大小不超过2MB',
      modelPropName: 'value',
      componentProps: {
        'onUpdate:fileId': handleAvatarFileIdChange,
      },
    },
    {
      fieldName: 'realName',
      component: 'Input',
      label: '姓名',
      rules: 'required',
    },
    {
      fieldName: 'username',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      label: '用户名',
    },
    {
      fieldName: 'roles',
      component: 'Select',
      componentProps: {
        disabled: true,
        mode: 'tags',
        options: userRoles.value,
      },
      label: '角色',
    },
    {
      fieldName: 'remark',
      component: 'Textarea',
      componentProps: {
        maxlength: 500,
        showCount: true,
      },
      label: '个人简介',
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  try {
    // 移除角色字段（只读字段不允许修改）
    // eslint-disable-next-line unused-imports/no-unused-vars
    const { roles, username, ...editableValues } = values;

    // 始终包含头像文件ID（新上传的或原有的）
    const updatedUserInfo = await updateCurrentUserProfileApi({
      profileFileId: avatarFileId.value,
      realName: String(editableValues.realName ?? ''),
      remark: String(editableValues.remark ?? ''),
    });

    userStore.setUserInfo({
      ...userStore.userInfo,
      ...updatedUserInfo,
      avatar: String(
        updatedUserInfo.avatar ?? userStore.userInfo?.avatar ?? '',
      ),
      realName: String(updatedUserInfo.realName ?? ''),
      userId: String(
        updatedUserInfo.userId ??
          updatedUserInfo.id ??
          userStore.userInfo?.userId ??
          '',
      ),
      username: String(
        updatedUserInfo.username ?? userStore.userInfo?.username ?? '',
      ),
    });
    avatarFileId.value = String(updatedUserInfo.profileFileId ?? '');
    profileBaseSettingRef.value?.getFormApi().setValues(updatedUserInfo);
    message.success('更新成功');
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => {
  // 从 store 获取用户信息并填充表单
  profileBaseSettingRef.value?.getFormApi().setValues(userStore.userInfo || {});
});

watch(
  () => userStore.userInfo?.profileFileId,
  (profileFileId) => {
    avatarFileId.value = String(profileFileId ?? '');
  },
);
</script>
<template>
  <ProfileBaseSetting
    ref="profileBaseSettingRef"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
