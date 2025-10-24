# Stacks Tunnel

## ☘️ Features

- easily expose localhost ports

## 🤖 Usage

```bash
bun install -d @stacksjs/tunnel
```

Now, you can use it in your project:

```js
import { createLocalTunnel } from '@stacksjs/tunnel'

const url = await createLocalTunnel(3000)

console.log('publicly sharable URL of your localhost', url)
```

Learn more in the docs.

## 🧪 Testing

```bash
bun test
```

## 📈 Changelog

Please see our [releases](https://github.com/stacksjs/stacks/releases) page for more information on what has changed recently.

## 🚜 Contributing

Please review the [Contributing Guide](https://github.com/stacksjs/contributing) for details.

## 🏝 Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/stacks/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord tunnel](https://discord.gg/stacksjs)

## 📄 License

The MIT License (MIT). Please see [LICENSE](https://github.com/stacksjs/stacks/tree/main/LICENSE.md) for more information.

Made with 💙
