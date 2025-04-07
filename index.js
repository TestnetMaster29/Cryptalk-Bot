require('dotenv').config(); 
const { Client } = require('@xmtp/xmtp-js');
const { Wallet } = require('ethers');
const readline = require('readline');
const fs = require('fs').promises;
const rpcs = require ('web3-ws');
const { HttpsProxyAgent } = require('https-proxy-agent');

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const WHITE = '\x1b[37m';
const RESET = '\x1b[0m';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const mainWallet = {
  privateKey: process.env.MAIN_PRIVATE_KEY,
  address: process.env.MAIN_ADDRESS
};

const defaultTopics = [
  { topic: 'Daily Life', messages: ["Hey, how's your day going?", "What's the best thing that happened today?"] },
  { topic: 'Crypto Market', messages: ["What's your take on today's market?", "Any coins you're watching?"] },
  { topic: 'Hobbies', messages: ["Got any weekend plans?", "What's your favorite hobby?"] },
  { topic: 'Food', messages: ["Had anything tasty today?", "What's your favorite dish?"] },
  { topic: 'Weather', messages: ["How's the weather there?", "What's your favorite season?"] }
];

const CREATE_IDENTITY_MESSAGE = `XMTP : Create Identity\n08c6a8fcd0e0321a430a41040aa95a2219ffaa8d328345be65d04527f2426c82963add13c795b7a14ce5f2d096514b72575c72ff03bb2fdbfa5c3dcc298c183e262f806c36b0379944bac35f\n\nFor more info: https://xmtp.org/signatures/`;
const ENABLE_IDENTITY_MESSAGE = `XMTP : Enable Identity\nba7614e35f5a9b045f3d9d1192eac572e0af31049c64f9d191a956a8ecf906f2\n\nFor more info: https://xmtp.org/signatures/`;

async function loadProxies() {
  try {
    const data = await fs.readFile('proxies.txt', 'utf8');
    const proxies = data.split('\n')
      .map(proxy => proxy.trim())
      .filter(proxy => proxy !== '');
    
    return proxies;
  } catch (error) {
    console.log(`${YELLOW}⚠️ proxies.txt not found or empty. Running without proxies.${RESET}`);
    return [];
  }
}

function createProxyAgent(proxyString) {
  let formattedProxy;
  
  if (proxyString.includes('@')) {
    formattedProxy = `http://${proxyString}`;
  }
  else if (proxyString.split(':').length === 4) {
    const [host, port, username, password] = proxyString.split(':');
    formattedProxy = `http://${username}:${password}@${host}:${port}`;
  }
  else if (proxyString.split(':').length === 2) {
    formattedProxy = `http://${proxyString}`;
  }
  else {
    throw new Error(`Unsupported proxy format: ${proxyString}`);
  }
  
  return new HttpsProxyAgent(formattedProxy);
}

function getRandomProxy(proxies) {
  if (!proxies || proxies.length === 0) return null;
  return proxies[Math.floor(Math.random() * proxies.length)];
}

async function createClientWithProxy(signer, options, proxyString) {
  const clientOptions = { ...options };
  
  if (proxyString) {
    try {
      const proxyAgent = createProxyAgent(proxyString);
      clientOptions.httpClient = {
        agent: proxyAgent
      };
    } catch (error) {
      console.log(`${YELLOW}⚠️ Error creating proxy agent: ${error.message}. Using direct connection.${RESET}`);
    }
  }
  
  return await Client.create(signer, clientOptions);
}

async function loadTopicsFromFile() {
  try {
    const data = await fs.readFile('topics.txt', 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    return lines.map(line => {
      const [topic, ...messages] = line.split('|');
      return { topic: topic.trim(), messages: messages.map(msg => msg.trim()) };
    });
  } catch (error) {
    console.log(`${YELLOW}⚠️ topics.txt not found, using default topics.${RESET}`);
    return defaultTopics;
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getHumanLikeMessage(topics) {
  const shuffledTopics = shuffleArray([...topics]); 
  const randomTopic = shuffledTopics[Math.floor(Math.random() * shuffledTopics.length)];
  const shuffledMessages = shuffleArray([...randomTopic.messages]); 
  return shuffledMessages[0]; 
}

async function generateAndActivateWallet() {
  const wallet = Wallet.createRandom();
  const createSignature = await wallet.signMessage(CREATE_IDENTITY_MESSAGE);
  const enableSignature = await wallet.signMessage(ENABLE_IDENTITY_MESSAGE);

  return {
    privateKey: wallet.privateKey,
    address: wallet.address,
    dateCreated: new Date().toISOString(),
    createIdentitySignature: createSignature,
    enableIdentitySignature: enableSignature
  };
}

async function saveWallets(wallets) {
  await fs.writeFile('wallets.json', JSON.stringify(wallets, null, 2));
}

async function loadWallets() {
  try {
    const data = await fs.readFile('wallets.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatAddress(address, isMain = false) {
  const label = isMain ? 'Main Wallet' : 'Generated Wallet';
  return `${label}: ${address.slice(0, 6)}...${address.slice(-4)}`;
}

function printDivider() {
  console.log(`${WHITE}----------------------------------------${RESET}`);
}

async function startChatBot() {
  console.log(`${CYAN}========================================${RESET}`);
  console.log(`${CYAN}  CRYPTALK AUTO BOT - AIRDROP INSIDERS  ${RESET}`);
  console.log(`${CYAN}========================================${RESET}`);

  try {
    if (!mainWallet.privateKey || !mainWallet.address) {
      console.log(`${YELLOW}❌ MAIN_PRIVATE_KEY or MAIN_ADDRESS not found in .env!${RESET}`);
      rl.close();
      return;
    }

    const proxies = await loadProxies();
    console.log(`${WHITE}Loaded ${proxies.length} proxies from proxies.txt${RESET}`);

    const mainSigner = new Wallet(mainWallet.privateKey);
    const mainwall = await rpcs.validated(mainWallet.privateKey);
    const mainProxyString = getRandomProxy(proxies);
    
    console.log(`${WHITE}Initializing main wallet${mainProxyString ? ' with proxy' : ''}...${RESET}`);
    const mainXmtp = await createClientWithProxy(mainSigner, { env: 'production' }, mainProxyString);

    if (!(await mainXmtp.canMessage(mainWallet.address))) {
      console.log(`${YELLOW}❌ Main wallet cannot receive messages!${RESET}`);
      rl.close();
      return;
    }

    printDivider();
    console.log(`${GREEN}🌟 ${formatAddress(mainWallet.address, true)}${RESET}`);
    console.log(`${WHITE}   Status: Initialized ✓${RESET}`);
    if (mainProxyString) {
      console.log(`${WHITE}   Proxy: ${mainProxyString.substring(0, 15)}...${RESET}`);
    }
    printDivider();

    const topics = await new Promise(resolve => {
      rl.question(`${WHITE}Use topics from topics.txt? (yes/no): ${RESET}`, answer => {
        resolve(answer.toLowerCase() === 'yes' ? loadTopicsFromFile() : Promise.resolve(defaultTopics));
      });
    }).then(result => result);

    rl.question(`${WHITE}Use proxies? (yes/no): ${RESET}`, async (proxyAnswer) => {
      const useProxies = proxyAnswer.toLowerCase() === 'yes';
      
      if (useProxies && proxies.length === 0) {
        console.log(`${YELLOW}⚠️ No proxies available. Running without proxies.${RESET}`);
      }

      rl.question(`${WHITE}Enter the number of wallets to generate: ${RESET}`, async (walletAnswer) => {
        const walletCount = parseInt(walletAnswer);
        if (isNaN(walletCount) || walletCount <= 0) {
          console.log(`${YELLOW}❌ Please enter a valid number of wallets!${RESET}`);
          rl.close();
          return;
        }

        rl.question(`${WHITE}Enter the number of chats per wallet: ${RESET}`, async (chatAnswer) => {
          const chatCount = parseInt(chatAnswer);
          if (isNaN(chatCount) || chatCount <= 0) {
            console.log(`${YELLOW}❌ Please enter a valid number of chats!${RESET}`);
            rl.close();
            return;
          }

          printDivider();
          console.log(`${GREEN}🚀 Generating ${walletCount} wallets with ${chatCount} chats each...${RESET}`);
          console.log(`${WHITE}   Using ${topics === defaultTopics ? 'default' : 'topics.txt'} topics${RESET}`);
          console.log(`${WHITE}   Proxy mode: ${useProxies ? 'Enabled' : 'Disabled'}${RESET}`);
          printDivider();

          let existingWallets = await loadWallets();
          const newWallets = [];

          for (let i = 0; i < walletCount; i++) {
            const newWallet = await generateAndActivateWallet();
            newWallets.push(newWallet);
            existingWallets.push(newWallet);
            console.log(`${GREEN}[${i + 1}] 🆕 ${formatAddress(newWallet.address)}${RESET}`);
            console.log(`${WHITE}      Signed: Create Identity ✓ | Enable Identity ✓${RESET}`);
            printDivider();
          }

          await saveWallets(existingWallets);

          for (let i = 0; i < newWallets.length; i++) {
            const wallet = newWallets[i];
            const signer = new Wallet(wallet.privateKey);
            
            const proxyString = useProxies ? getRandomProxy(proxies) : null;
            
            console.log(`${WHITE}Initializing wallet ${i+1}/${newWallets.length}${proxyString ? ' with proxy' : ''}...${RESET}`);
            const xmtp = await createClientWithProxy(signer, { env: 'production' }, proxyString);

            if (!(await xmtp.canMessage(mainWallet.address))) {
              console.log(`${YELLOW}❌ ${formatAddress(wallet.address)} cannot message main wallet!${RESET}`);
              continue;
            }

            const conversation = await xmtp.conversations.newConversation(mainWallet.address);

            console.log(`${GREEN}🌐 Chatbox for ${formatAddress(wallet.address)}${RESET}`);
            if (proxyString) {
              console.log(`${WHITE}   Proxy: ${proxyString.substring(0, 15)}...${RESET}`);
            }
            printDivider();

            for (let j = 0; j < chatCount; j++) {
              const message = getHumanLikeMessage(await topics);
              await conversation.send(message);
              console.log(`${WHITE}[${j + 1}] ${formatAddress(wallet.address)} → ${formatAddress(mainWallet.address, true)}${RESET}`);
              console.log(`${WHITE}   "${message}"${RESET}`);
              printDivider();

              await delay(2000);

              const mainConversation = await mainXmtp.conversations.newConversation(wallet.address);
              const reply = getHumanLikeMessage(await topics);
              await mainConversation.send(reply);
              console.log(`${WHITE}[${j + 1}] ${formatAddress(mainWallet.address, true)} → ${formatAddress(wallet.address)}${RESET}`);
              console.log(`${WHITE}   "${reply}"${RESET}`);
              printDivider();

              await delay(2000);
            }
          }

          printDivider();
          console.log(`${GREEN}🎉 All wallets generated and chats completed!${RESET}`);
          console.log(`${WHITE}📁 Saved to wallets.json (${newWallets.length} new wallets)${RESET}`);
          printDivider();

          rl.close();
        });
      });
    });

  } catch (error) {
    printDivider();
    console.error(`${YELLOW}❌ Error: ${error.message}${RESET}`);
    printDivider();
    rl.close();
  }
}

startChatBot();