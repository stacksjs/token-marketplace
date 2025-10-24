# Stacks Objects

Easily work with objects.

## ☘️ Features

- Access to Laravel-like Collections API
- Other object helpers

## 🤖 Usage

```bash
bun install -d @stacksjs/objects
```

Now, you can easily access it in your project:

```js
import { collect } from '@stacksjs/objects'

const collection = collect([{
  name: 'My story',
  pages: 176,
}, {
  name: 'Fantastic Beasts and Where to Find Them',
  pages: 1096,
}])

console.log(collection.avg('pages')) // 636
```

To view the full documentation, please visit [https://stacksjs.org/objects](https://stacksjs.org/objects).

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

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## 🙏🏼 Credits

Many thanks to the following core technologies & people who have contributed to this package:

- [Collect.js](https://github.com/ecrmnn/collect.js)
- [Laravel](https://laravel.com/)
- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](../../contributors)

## 📄 License

The MIT License (MIT). Please see [LICENSE](https://github.com/stacksjs/stacks/tree/main/LICENSE.md) for more information.

Made with 💙
