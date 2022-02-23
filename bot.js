const Web3 = require('web3');

const keys = require('./keys');

const web3 = new Web3(new Web3.providers.HttpProvider(`https://mainnet.infura.io/v3/${keys.infura}`));

const { Client, Intents } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const onlyUnique = (value, index, self) => {
    return self.indexOf(value) === index;
}

client.on('ready', () => {
    client.api.applications(client.user.id).commands.post({
        data: {
            name: 'balance',
            description: 'Get ethereum balance of accounts',
            options: [{
                type: 3,
                name: 'addresses',
                description: 'List of addresses',
                required: true
            }]
        }
    });

    client.ws.on('INTERACTION_CREATE', async (interaction) => {
        const commandId = interaction.data.id;
        const commandName = interaction.data.name;
        
        if (commandName == 'balance') {
            let addresses = interaction.data.options[0].value.split(/[\s,]+/).filter(x => web3.utils.isAddress(x)).filter(onlyUnique);
            let acm = [];
            while (addresses.length > 0) {
                let address = addresses.pop();
                acm.unshift(`${address} : ${web3.utils.fromWei(await web3.eth.getBalance(address), 'ether')} ETH`);
            }
            let content = '' + acm.join('\n');
            if (content.length === 0) content = 'no valid addresses provided';
            client.api.interactions(interaction.id, interaction.token).callback.post({
                data: {
                    type: 4,
                    data: {
                        content
                    }
                }
            });
        }
    });
});

client.login(keys.discord);