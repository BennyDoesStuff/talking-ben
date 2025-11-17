// Talking Ben bot that plays random sound files in a VC
// Updated to discord.js v14 with slash commands

const fs = require("fs");
const path = require("path");
const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    REST, 
    Routes,
    SlashCommandBuilder
} = require("discord.js");
const voice = require("@discordjs/voice");
const config = require("./config.json");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel],
});

const sounds = [];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

client.login(config.TOKEN);

async function runBen(voiceChannel) {
    if (!voiceChannel) return;

    // Prevent joining multiple channels
    if (voiceChannel.guild.members.me.voice.channel) return;

    const connection = voice.joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false
    });

    const player = voice.createAudioPlayer({
        behaviors: {
            noSubscriber: voice.NoSubscriberBehavior.Play
        }
    });

    connection.subscribe(player);

    // Helper: play a random sound at controlled volume
    const playRandomSound = () => {
        const soundPath = sounds[getRandomInt(0, sounds.length)];

        const resource = voice.createAudioResource(fs.createReadStream(soundPath), {
            inputType: voice.StreamType.Arbitrary,
            inlineVolume: true
        });

        resource.volume.setVolume(0.7); // 70% volume

        player.play(resource);
    };

    // Continuous loop mode
    if (!config.RESPOND_ON_MEMBER_VOICE_STATE) {
        playRandomSound();

        player.on("stateChange", (oldState, newState) => {
            if (newState.status === voice.AudioPlayerStatus.Idle) {
                setTimeout(playRandomSound, getRandomInt(1, 4) * 1000);
            }
        });
    }

    // Respond-to-speech mode
    else {
        const speakingMap = connection.receiver.speaking;
        const currentlyTalking = new Set();

        const tryPlay = () => {
            if (currentlyTalking.size === 0 && player.state.status === voice.AudioPlayerStatus.Idle) {
                playRandomSound();
            }
        };

        speakingMap.on("start", (userId) => {
            currentlyTalking.add(userId);
        });

        speakingMap.on("end", (userId) => {
            currentlyTalking.delete(userId);
            tryPlay(); // Only plays if everyone stopped talking
        });

        // When Ben finishes a sound, try to play another
        player.on("stateChange", (oldState, newState) => {
            if (newState.status === voice.AudioPlayerStatus.Idle) {
                tryPlay();
            }
        });
    }
}

function stopBen(guild) {
    const connection = voice.getVoiceConnection(guild.id);

    if (connection) {
        connection.destroy();  // completely disconnects
        return true;
    }

    return false;
}

client.on("voiceStateUpdate", (oldState, newState) => {
    if (newState.member.user.bot) return;

    if (config.JOIN_AUTOMATICALLY && !oldState.channel && newState.channel) {
        runBen(newState.channel);
    }
});

client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);

    // Load the sounds
    const files = fs.readdirSync("./sounds");
    files.forEach((file) => sounds.push(path.join("./sounds", file)));

    // Register slash commands
    await registerSlashCommands();
    console.log("Slash commands registered!");
});

// Slash Command Register
async function registerSlashCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName("startben")
            .setDescription("Summons Talking Ben into your voice channel."),
    
        new SlashCommandBuilder()
            .setName("stopben")
            .setDescription("Stops Talking Ben and makes him leave the voice channel.")
    ];

    const rest = new REST({ version: "10" }).setToken(config.TOKEN);

    await rest.put(
        Routes.applicationCommands(config.CLIENT_ID),
        { body: commands }
    );
}

// Slash Command Handler
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "startben") {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: "You must be in a voice channel!", ephemeral: true });
        }

        runBen(voiceChannel);
        return interaction.reply("☎️ **Ben is joining...**");
    }

    if (interaction.commandName === "stopben") {
        const success = stopBen(interaction.guild);

        if (!success) {
            return interaction.reply({ content: "Ben is not in a voice channel.", ephemeral: true });
        }

        return interaction.reply("🚪 **Ben has left the voice channel.**");
    }
});
