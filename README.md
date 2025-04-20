# Cryptalk Auto Bot

An automated chat bot for XMTP messaging protocol, designed to generate wallets and simulate human-like conversations.

## 🚀 Features

- Generate multiple Ethereum wallets for testing
- Create and enable XMTP identities for each wallet
- Simulate natural conversations between wallets
- Support for custom conversation topics
- Proxy support for anonymized connections

## ⚙️ Installation

```bash
# Clone the repository
git clone https://github.com/TestnetMaster29/Cryptalk-Bot.git
cd Cryptalk-Bot

# Install dependencies
npm install
```

## 📋 Configuration

1. Create a `.env` file in the root directory with your main wallet details:

```
MAIN_PRIVATE_KEY=your_private_key_here
MAIN_ADDRESS=your_wallet_address_here
```

2. (Optional) Create a `topics.txt` file for custom conversation topics:

```
Topic Name|Message 1|Message 2|Message 3
Another Topic|Example message|Another example
```

3. (Optional) Create a `proxies.txt` file for proxy support:

```
http://username:password@host:port
http://host:port:username:password
http://host:port
```

## 🔧 Usage

```bash
# Start the bot
node index.js
```

Follow the on-screen prompts to:
1. Choose whether to use custom topics
2. Enable or disable proxy support
3. Specify the number of wallets to generate
4. Set how many chat messages each wallet should send

## 📄 Output

- **Console**: Real-time logging of wallet generation and message sending
- **wallets.json**: Saved record of all generated wallets with their private keys and addresses

## ⚠️ Important Notes

- This tool is intended for testing and educational purposes only
- Keep your generated wallets secure - never share your private keys
- Running large numbers of wallets/chats may be rate-limited by the XMTP network

## 📦 Project Structure

- `index.js` - Main application file
- `.env` - Configuration file for main wallet
- `topics.txt` - Custom conversation topics (optional)
- `proxies.txt` - Proxy list for connections (optional)
- `wallets.json` - Generated wallets output file

## 🛠️ Dependencies

- @xmtp/xmtp-js - XMTP client library
- ethers - Ethereum wallet library
- dotenv - Environment variable management
- https-proxy-agent - Proxy support for connections

## 📜 License

MIT

Feel free to contribute to this project by submitting a PR or opening an issue.

Last updated: Sun Apr 20 03:14:45 UTC 2025
