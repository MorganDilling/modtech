<div align="center">
  <h1>🛠️ Modtech</h1>
  <p>A utilities and moderation bot for Discord.</p>

<a href="/LICENSE">
  <img alt="GitHub" src="https://img.shields.io/github/license/morgandilling/ts-node-project-template?style=for-the-badge">
</a>
</div>

## Setup

You will need:

- [Node.js](https://nodejs.org/en/) (latest LTS version)
- [pnpm](https://pnpm.io/)

Install dependencies with `pnpm install`.

## Config

Create a file named `config.json` in the root directory of the project. This file should contain the following:

```json
{
  "token": "[discord bot token]",
  "owners": ["[bot owner id]"],
  "feedbackChannel": "[feedback channel id]"
}
```

Create a file named `.env` in the root directory of the project. This file should contain the following:

```env
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
```

Where the DATEBASE_URL is a valid PostgreSQL connection string.

## Scripts

- `pnpm run start` - Run the project in production
- `pnpm run dev` - Run the project in development (with hot reloading)

## License

This project is licensed under [MIT](/LICENSE)

## Credits

<b>👤 Morgan Dilling "MJD"</b>

- 💻 [Website](https://morgandilling.com)
- 🛠️ [GitHub](https://github.com/morgandilling)
- 🐦 [Twitter](https://twitter.com/MJDRBLX)
- 🎮 [Roblox](https://www.roblox.com/users/187221070/profile)
- 📧 [Email](mailto:business@morgandilling.dev)

## Contributing

Contributions, issues and feature requests are welcome! Check out the [Code of Conduct](.github/CODE_OF_CONDUCT.md) before contributing.
