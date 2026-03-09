import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Cms',
    path: '/cms',
    meta: {
      icon: 'lucide:newspaper',
      title: '内容管理',
    },
    children: [
      {
        name: 'CmsCategory',
        path: '/cms/category',
        component: () => import('#/views/cms/category/index.vue'),
        meta: {
          icon: 'lucide:folder-tree',
          title: '栏目管理',
        },
      },
      {
        name: 'CmsTag',
        path: '/cms/tag',
        component: () => import('#/views/cms/tag/index.vue'),
        meta: {
          icon: 'lucide:tags',
          title: '标签管理',
        },
      },
      {
        name: 'CmsArticleList',
        path: '/cms/article/list',
        component: () => import('#/views/cms/article/list/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '文章管理',
        },
      },
      {
        name: 'CmsArticleFile',
        path: '/cms/article-file',
        component: () => import('#/views/cms/article-file/index.vue'),
        meta: {
          icon: 'lucide:paperclip',
          title: '附件管理',
        },
      },
    ],
  },
];

export default routes;
