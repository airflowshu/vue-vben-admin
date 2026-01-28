<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed, onMounted, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

const userStore = useUserStore();

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
      fieldName: 'realName',
      component: 'Input',
      label: '姓名',
    },
    {
      fieldName: 'username',
      component: 'Input',
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
      fieldName: 'introduction',
      component: 'Textarea',
      label: '个人简介',
    },
  ];
});

onMounted(() => {
  // 从 store 获取用户信息并填充表单
  profileBaseSettingRef.value?.getFormApi().setValues(userStore.userInfo || {});
});
</script>
<template>
  <ProfileBaseSetting ref="profileBaseSettingRef" :form-schema="formSchema" />
</template>
