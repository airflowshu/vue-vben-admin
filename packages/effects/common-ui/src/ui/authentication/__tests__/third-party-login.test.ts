import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import ThirdPartyLogin from '../third-party-login.vue';

vi.mock('@vben/icons', () => ({
  SvgGithubIcon: { template: '<span data-provider-icon="github" />' },
  SvgGoogleIcon: { template: '<span data-provider-icon="google" />' },
  SvgQQChatIcon: { template: '<span data-provider-icon="qq" />' },
  SvgWeChatIcon: { template: '<span data-provider-icon="wechat" />' },
}));

describe('third-party-login.vue', () => {
  it('renders only enabled providers', () => {
    const wrapper = mount(ThirdPartyLogin, {
      props: {
        providers: [
          { code: 'github', enabled: true },
          { code: 'google', enabled: false },
        ],
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(1);
    expect(wrapper.text()).toContain('authentication.thirdPartyLogin');
  });

  it('emits login when provider is clicked', async () => {
    const wrapper = mount(ThirdPartyLogin, {
      props: {
        providers: [{ code: 'github', enabled: true }],
      },
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('login')?.[0]?.[0]).toMatchObject({
      code: 'github',
    });
  });

  it('renders qq icon and emits qq provider', async () => {
    const wrapper = mount(ThirdPartyLogin, {
      props: {
        providers: [{ code: 'qq', enabled: true }],
      },
    });

    expect(wrapper.find('[data-provider-icon="qq"]').exists()).toBe(true);

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('login')?.[0]?.[0]).toMatchObject({
      code: 'qq',
    });
  });
});
