<script lang="ts" setup>
import type { UserOption } from '#/api/devops/aikey';

import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Avatar,
  Empty,
  Input,
  List,
  ListItem,
  ListItemMeta,
  Menu,
  Spin,
  Tag,
} from 'ant-design-vue';

import { getUserOptions } from '#/api/devops/aikey';

interface Props {
  initialSelectedIds?: string[];
}

const props = defineProps<Props>();
const emit = defineEmits(['confirm']);

const loading = ref(false);
const allUsers = ref<UserOption[]>([]);
const selectedUsers = ref<UserOption[]>([]);
const searchText = ref('');
const activeMenu = ref(['members']);

// 菜单项
const menuItems = [
  { key: 'members', label: '成员', icon: 'mdi:account' },
  { key: 'dept', label: '部门', icon: 'mdi:file-tree' },
  { key: 'group', label: '群组', icon: 'mdi:account-group' },
];

// 加载用户列表
async function loadUsers() {
  loading.value = true;
  try {
    const res = await getUserOptions();
    allUsers.value = res;
    // 初始化选中状态
    if (props.initialSelectedIds && props.initialSelectedIds.length > 0) {
      selectedUsers.value = allUsers.value.filter((u) =>
        props.initialSelectedIds?.includes(u.id),
      );
    }
  } catch (error) {
    console.error('加载用户失败:', error);
  } finally {
    loading.value = false;
  }
}

// 过滤用户
const filteredUsers = computed(() => {
  if (!searchText.value) return allUsers.value;
  const lowerSearch = searchText.value.toLowerCase();
  return allUsers.value.filter(
    (u) =>
      u.realName?.toLowerCase().includes(lowerSearch) ||
      u.username?.toLowerCase().includes(lowerSearch),
  );
});

// 切换选择
function toggleSelect(user: UserOption) {
  const index = selectedUsers.value.findIndex((u) => u.id === user.id);
  if (index > -1) {
    selectedUsers.value.splice(index, 1);
  } else {
    selectedUsers.value.push(user);
  }
}

// 移除选择
function removeSelect(userId: string) {
  const index = selectedUsers.value.findIndex((u) => u.id === userId);
  if (index > -1) {
    selectedUsers.value.splice(index, 1);
  }
}

// 判断是否选中
function isSelected(userId: string) {
  return selectedUsers.value.some((u) => u.id === userId);
}

const [Modal, modalApi] = useVbenModal({
  title: '管理协作者',
  fullscreen: false,
  class: 'w-[800px]',
  onConfirm: () => {
    emit('confirm', [...selectedUsers.value]);
    modalApi.close();
  },
  onOpenChange: (isOpen) => {
    if (isOpen) {
      const data = modalApi.getData<{ selectedIds: string[] }>();
      if (data?.selectedIds) {
        // 如果是通过 setData 传入的 initialSelectedIds
        // 需要等待 loadUsers 完成后再设置，或者在 loadUsers 中处理
      }
      loadUsers().then(() => {
         if (data?.selectedIds) {
            selectedUsers.value = allUsers.value.filter((u) =>
              data.selectedIds.includes(u.id),
            );
         }
      });
    } else {
      searchText.value = '';
      selectedUsers.value = [];
    }
  },
});
</script>

<template>
  <Modal>
    <div class="flex h-[500px] border-t border-gray-200">
      <!-- 左侧选择区域 -->
      <div class="flex flex-1 border-r border-gray-200">
        <!-- 侧边菜单 -->
        <div class="w-[120px] bg-gray-50 pt-2">
          <Menu
            v-model:selected-keys="activeMenu"
            mode="inline"
            class="h-full border-0 bg-transparent"
          >
            <Menu.Item v-for="item in menuItems" :key="item.key">
              <div class="flex items-center gap-2">
                <IconifyIcon :icon="item.icon" />
                <span>{{ item.label }}</span>
              </div>
            </Menu.Item>
          </Menu>
        </div>

        <!-- 列表区域 -->
        <div class="flex-1 flex flex-col p-4">
          <div class="mb-4">
            <Input.Search
              v-model:value="searchText"
              placeholder="搜索成员/部门/群组名称"
              allow-clear
            />
          </div>
          
          <div class="flex-1 overflow-y-auto">
            <template v-if="activeMenu[0] === 'members'">
              <Spin :spinning="loading">
                <List item-layout="horizontal" :data-source="filteredUsers">
                  <template #renderItem="{ item }">
                    <ListItem
                      class="cursor-pointer hover:bg-gray-50 px-2 rounded transition-colors"
                      @click="toggleSelect(item)"
                    >
                      <ListItemMeta>
                        <template #title>
                          <span class="font-medium">{{ item.realName }}</span>
                          <span class="ml-2 text-xs text-gray-400">{{ item.username }}</span>
                        </template>
                        <template #avatar>
                          <Avatar class="bg-primary/10 text-primary">
                             {{ item.realName?.charAt(0) || item.username?.charAt(0) }}
                          </Avatar>
                        </template>
                      </ListItemMeta>
                      <div v-if="isSelected(item.id)">
                        <IconifyIcon icon="mdi:check-circle" class="text-primary text-xl" />
                      </div>
                      <div v-else>
                         <div class="w-5 h-5 rounded-full border border-gray-300"></div>
                      </div>
                    </ListItem>
                  </template>
                </List>
                <Empty v-if="!loading && filteredUsers.length === 0" description="未找到匹配用户" />
              </Spin>
            </template>
            <template v-else>
              <Empty description="暂不支持部门/群组选择" />
            </template>
          </div>
        </div>
      </div>

      <!-- 右侧已选区域 -->
      <div class="w-[280px] flex flex-col p-4 bg-white">
        <div class="mb-4 font-medium flex justify-between items-center">
          <span>已选: {{ selectedUsers.length }}</span>
          <span 
            v-if="selectedUsers.length > 0" 
            class="text-primary text-xs cursor-pointer"
            @click="selectedUsers = []"
          >
            清空
          </span>
        </div>
        
        <div class="flex-1 overflow-y-auto">
           <div class="flex flex-col gap-2">
              <div 
                v-for="user in selectedUsers" 
                :key="user.id"
                class="flex items-center justify-between p-2 bg-gray-50 rounded group hover:bg-gray-100"
              >
                <div class="flex items-center gap-2 overflow-hidden">
                   <Avatar size="small" class="bg-primary/10 text-primary shrink-0">
                      {{ user.realName?.charAt(0) || user.username?.charAt(0) }}
                   </Avatar>
                   <div class="flex flex-col overflow-hidden">
                      <span class="truncate text-sm font-medium">{{ user.realName }}</span>
                      <span class="truncate text-xs text-gray-400">{{ user.username }}</span>
                   </div>
                </div>
                <IconifyIcon 
                  icon="mdi:close" 
                  class="text-gray-400 cursor-pointer hover:text-red-500"
                  @click="removeSelect(user.id)" 
                />
              </div>
           </div>
        </div>
      </div>
    </div>
  </Modal>
</template>
