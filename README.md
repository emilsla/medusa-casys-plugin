<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Medusa Casys Payment Plugin
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  A Medusa payment plugin for integrating with the Casys payment gateway
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/master/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    <a href="https://www.producthunt.com/posts/medusa"><img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt"></a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

## Overview

This plugin integrates the Casys payment gateway with your Medusa e-commerce store. It provides a seamless payment experience for your customers, handling payment authorization, processing, and webhooks for successful and failed payments.

## Features

- Seamless integration with Casys payment gateway
- Automatic currency conversion to MKD (Macedonian Denar)
- Handling of payment callbacks and redirects
- Support for payment success and failure workflows

## Compatibility

This plugin is compatible with versions >= 2.4.0 of `@medusajs/medusa`.

## Prerequisites

- Medusa server (v2.4.0 or later)
- Casys (Bankart) merchant account credentials

## Installation

```bash
npm install @myorg/medusa-casys-plugin
# or
yarn add @myorg/medusa-casys-plugin
```

## Configuration

Add the plugin to your `medusa-config.js` file:

```javascript
const plugins = [
  // ... other plugins
  {
    resolve: "@myorg/medusa-casys-plugin",
    options: {
      merchantName: "Your Merchant Name",
      merchantId: "your-merchant-id",
      checkSumKey: "your-checksum-key",
      paymentOkUrl: "https://your-store.com/payment-success",
      paymentFailUrl: "https://your-store.com/payment-failure",
      backendUrl: "https://your-backend.com",
    },
  },
];
```

### Required Options

| Option           | Description                                        |
| ---------------- | -------------------------------------------------- |
| `merchantName`   | Your registered merchant name with Casys           |
| `merchantId`     | Your merchant ID provided by Casys                 |
| `checkSumKey`    | Your checksum key for transaction verification     |
| `paymentOkUrl`   | URL to redirect customers after successful payment |
| `paymentFailUrl` | URL to redirect customers after failed payment     |
| `backendUrl`     | Your backend URL where Casys will send webhooks    |

## How It Works

1. **Payment Initiation**: When a customer proceeds to checkout, the plugin initializes a payment session with Casys.

2. **Currency Conversion**: The plugin automatically converts various currencies (EUR, USD, GBP, AED) to MKD using predefined conversion rates:

   - EUR: 61.5 MKD
   - USD: 56 MKD
   - GBP: 72 MKD
   - AED: 15.5 MKD

3. **Payment Authorization**: The plugin securely prepares the payment request with proper checksums and customer information.

4. **Payment Processing**: Customers are redirected to the Casys payment page to complete their payment.

5. **Payment Completion**: After payment, customers are redirected back to your store, and the plugin handles the payment status.

## API Endpoints

The plugin creates the following API endpoints:

- `POST /api/casys/success` - Handles successful payment callbacks
- `POST /api/casys/fail` - Handles failed payment callbacks

## About Casys

Casys (via Bankart gateway) is a payment processing service allowing businesses to accept payments online. The gateway is accessible at https://gateway.bankart.si.

## What is Medusa

Medusa is a set of commerce modules and tools that allow you to build rich, reliable, and performant commerce applications without reinventing core commerce logic. The modules can be customized and used to build advanced ecommerce stores, marketplaces, or any product that needs foundational commerce primitives. All modules are open-source and freely available on npm.

Learn more about [Medusa's architecture](https://docs.medusajs.com/learn/introduction/architecture) and [commerce modules](https://docs.medusajs.com/learn/fundamentals/modules/commerce-modules) in the Docs.

## Community & Contributions

The community and core team are available in [GitHub Discussions](https://github.com/medusajs/medusa/discussions), where you can ask for support, discuss roadmap, and share ideas.

Join our [Discord server](https://discord.com/invite/medusajs) to meet other community members.

## Other channels

- [GitHub Issues](https://github.com/medusajs/medusa/issues)
- [Twitter](https://twitter.com/medusajs)
- [LinkedIn](https://www.linkedin.com/company/medusajs)
- [Medusa Blog](https://medusajs.com/blog/)
