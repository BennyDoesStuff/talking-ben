# My Talking Ben

A Discord bot that plays sounds from the My Talking Ben app in voice channels.

## Installation

1. Create a new Discord Bot [here](https://discord.com/developers/applications) and invite it to your server
2. Update the `config.json` and include your Discord Bot's token and client ID.
3. Install node packages `npm i`
4. Run the bot `node .`
5. Join a voice channel! If auto-join is not enabled, type the command `/startben` to get the bot to join.

## Configuration

In the project root directory, there is a file named `config.json`. Below are the configurable settings and their description:

**TOKEN** Your bot's Discord token

**CLIENT_ID** Your bot's client ID

**RESPOND_ON_MEMBER_VOICE_STATE** If `true`, the bot will wait for a user to speak instead of randomly waiting 1 - 4 seconds.

**JOIN_AUTOMATICALLY** If `true`, the bot will automatically join a vc when a user joins. If the bot is in another channel, it won't move.
