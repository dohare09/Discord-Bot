// import {searchYoutube} from "youtube_search.js"
const discord = require('discord.js');
const {google} = require('googleapis');
const fs = require('fs');
const youtubedl = require('youtube-dl');
const events = require('events');
const secrets = require('./secret.json');


var eventEmitter = new events.EventEmitter();
const bot = new discord.Client();
const prefix = "!";

bot.login(secrets['discord']);

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}`);
});

bot.on('message', msg => {
    if (msg.content.startsWith(`${prefix}play `)) {
        var voiceChannel = msg.member.voice.channel;
        voiceChannel.join().then(conn => {
            var voice_conn = msg.member.guild.voice.connection;
            searchYoutube(msg.content); 
            eventEmitter.on('finishedDownload', function() {
                console.log('listener triggered');
                voice_conn.play(fs.createReadStream('toPlay.mp4'));
            });
        });
    } else if (msg.content.includes('!stop')) {
        console.log("Stopping");
        msg.member.voice.channel.leave();
    }
});


function searchYoutube(searchParam) {
    const youtube = google.youtube({
        version: 'v3',
        auth: secrets['youtube']
    });
    youtube.search.list({
        part: 'id,snippet',
        q: searchParam,
    }).then(res => {
        let vidId = res.data.items[0].id.videoId;
        const video = youtubedl(`https://www.youtube.com/watch?v=${vidId}`);
    
        video.on('info', function(info) {
            console.log('Download started!');
            console.log('filename: ' + info._filename);
        });

        video.pipe(fs.createWriteStream('toPlay.mp4'));

        video.on('end', function() {
            eventEmitter.emit('finishedDownload');
            console.log('Finished Download!');
        })
    });
}