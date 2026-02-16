import type { DocsConfig } from '@stacksjs/types'
import type { HeadConfig } from 'vitepress'
import { SocialLinkIcon } from '@stacksjs/types'
import analytics from '../config/analytics'

export const faviconHead: HeadConfig[] = [
  [
    'link',
    {
      rel: 'icon',
      href: 'https://raw.githubusercontent.com/stacksjs/stacks/main/public/logo-transparent.svg?https://raw.githubusercontent.com/stacksjs/stacks/main/public/logo-transparent.svg?asdas',
    },
  ],
]

export const googleAnalyticsHead: HeadConfig[] = [
  [
    'script',
    {
      async: '',
      src: `https://www.googletagmanager.com/gtag/js?id=${analytics.drivers?.googleAnalytics?.trackingId}`,
    },
  ],
  [
    'script',
    {},
    `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'TAG_ID');`,
  ],
]

export const fathomAnalyticsHead: HeadConfig[] = [
  [
    'script',
    {
      'src': 'https://cdn.usefathom.com/script.js',
      'data-site': analytics.drivers?.fathom?.siteId || '',
      'defer': '',
    },
  ],
]

export const analyticsHead
  = analytics.driver === 'fathom'
    ? fathomAnalyticsHead
    : analytics.driver === 'google-analytics'
      ? googleAnalyticsHead
      : []

const nav = [
  {
    text: 'Features',
    link: '/guide/features',
  },
  {
    text: 'API Reference',
    link: '/guide/api-reference',
  },
  {
    text: 'Setup',
    link: '/guide/setup',
  },
]

const sidebar = {
  '/': [
    {
      text: 'Getting Started',
      collapsible: true,
      items: [
        { text: 'Overview', link: '/guide/features' },
        { text: 'Setup', link: '/guide/setup' },
      ],
    },

    {
      text: 'Marketplace',
      collapsible: true,
      items: [
        { text: 'Collections', link: '/guide/features#collections' },
        { text: 'Rarity', link: '/guide/features#rarity' },
        { text: 'Activity Feed', link: '/guide/features#activity-feed' },
        { text: 'User Profiles', link: '/guide/features#user-profiles' },
      ],
    },

    {
      text: 'Minting',
      collapsible: true,
      items: [
        { text: 'Candy Machine', link: '/guide/features#candy-machine-minting' },
        { text: 'Presales', link: '/guide/features#presales' },
        { text: 'Quick Mint', link: '/guide/features#quick-mint' },
      ],
    },

    {
      text: 'Trading',
      collapsible: true,
      items: [
        { text: 'Listing & Buying', link: '/guide/features#listing-buying' },
        { text: 'Offers', link: '/guide/features#offers' },
        { text: 'Auctions', link: '/guide/features#auctions' },
        { text: 'Escrow', link: '/guide/features#escrow' },
        { text: 'Platform Fee', link: '/guide/features#platform-fee' },
      ],
    },

    {
      text: 'Authentication',
      collapsible: true,
      items: [
        { text: 'Wallet Login', link: '/guide/features#wallet-login' },
        { text: 'Token Management', link: '/guide/features#token-management' },
      ],
    },

    {
      text: 'Advanced',
      collapsible: true,
      items: [
        { text: 'Multi-Signature', link: '/guide/features#multi-signature' },
        { text: 'Admin Dashboard', link: '/guide/features#admin-dashboard' },
      ],
    },

    {
      text: 'API Reference',
      collapsible: true,
      items: [
        { text: 'All Endpoints', link: '/guide/api-reference' },
        { text: 'Marketplace', link: '/guide/api-reference#marketplace' },
        { text: 'Authentication', link: '/guide/api-reference#authentication' },
        { text: 'NFT Trading', link: '/guide/api-reference#nft-trading' },
        { text: 'Minting', link: '/guide/api-reference#minting' },
        { text: 'Multi-Signature', link: '/guide/api-reference#multi-signature-admin' },
      ],
    },
  ],
}

/**
 * **Documentation Options**
 *
 * This configuration defines all of your documentation options. Because Stacks is fully-typed,
 * you may hover any of the options below and the definitions will be provided. In case
 * you have any questions, feel free to reach out via Discord or GitHub Discussions.
 */
export default {
  lang: 'en-US',
  title: 'Naked NFTs',
  description: 'Solana NFT Marketplace — browse, mint, trade, and manage digital assets.',
  lastUpdated: true,
  deploy: true,
  base: '/',

  metaChunk: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/images/logos/logo-mini.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/images/logos/logo.png' }],
    ['meta', { name: 'theme-color', content: '#1e40af' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Naked NFTs — Solana NFT Marketplace' }],
    ['meta', { property: 'og:site_name', content: 'Naked NFTs' }],
    ['meta', { property: 'og:image', content: 'https://stacksjs.org/images/og-image.png' }],
    ['meta', { property: 'og:url', content: 'https://stacksjs.org/' }],
    // ['script', { 'src': 'https://cdn.usefathom.com/script.js', 'data-site': '', 'data-spa': 'auto', 'defer': '' }],
    ...analyticsHead,
  ],

  themeConfig: {
    logo: '/images/logos/logo-transparent.svg',

    nav,
    sidebar,

    editLink: {
      pattern: 'https://github.com/stacksjs/stacks/edit/main/docs/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Stacks.js, Inc.',
    },

    socialLinks: [
      { icon: SocialLinkIcon.Twitter, link: 'https://twitter.com/stacksjs' },
      { icon: SocialLinkIcon.Bluesky, link: 'https://bsky.app/profile/chrisbreuer.dev' },
      { icon: SocialLinkIcon.GitHub, link: 'https://github.com/stacksjs/stacks' },
      { icon: SocialLinkIcon.Discord, link: 'https://discord.gg/stacksjs' },
    ],

    // algolia: services.algolia,

    // carbonAds: {
    //   code: '',
    //   placement: '',
    // },
  },
} satisfies DocsConfig
