/****************************************
 *   Ki11er AK47 Community Plugin for AstralMod: Plugin for AstralMod that handles Ki11er AK47 Chats
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * *************************************/

var client;
var consts;

var allowPrepChat = true;
var membersPlaced = [];
var numberOfMembersTried = 0;

var dispatcher;
var connection;

function playAudio() {
    try {
        if (connection.status == 0) {
            dispatcher = connection.playFile("forecastvoiceki11er.mp3");
            dispatcher.on('end', playAudio);
            dispatcher.on('error', function(err) {
                connection.disconnect();
                log("Ki11er Voice connection encountered an error: " + err, logType.critical);
                log("Disconnected from the waiting room.", logType.critical);
            });
        } else {
            log("connection.status " + parseInt(connection.status));
        }
    } catch (err) {
        log("Disconnected from the waiting room.", logType.critical);
    }
}

function startup() {
    try {
        if (client.guilds.has(consts.kill.id)) {
            log("Ki11er AK47 Community has been detected.");
            log("Now connecting to the waiting room.");
            //Jump into waiting room
            client.channels.get(consts.kill.waitingRoomChannel).join().then(function(conn) {
                log("Now playing audio in the Ki11er AK47 Community Waiting Room.", logType.good);
                connection = conn;
                connection.on('disconnect', function() {
                    log("Disconnected from the waiting room.", logType.critical);
                    //connection.disconnect();
                });
                connection.on('reconnecting', function() {
                    log("Attempting to reconnect to the waiting room.", logType.warning);
                });
                connection.on('warn', function(warning) {
                    if (typeof warning == "string") {
                        log(warning, logType.warning);
                    } else {
                        if (warning.message) {
                            log(warning.message, logType.critical);
                        }
                    }
                });
                connection.on('debug', function(message) {
                    if (typeof message == "string") {
                        log(message, logType.warning);
                    } else {
                        if (message.message) {
                            log(message.message, logType.critical);
                        }
                    }
                });
                connection.on('error', function(warning) {
                    if (typeof warning == "string") {
                        log(warning, logType.warning);
                    } else {
                        if (warning.message) {
                            log(warning.message, logType.critical);
                        }
                    }
                });
                playAudio();
            });
        }
    } catch (err) {
        log("Couldn't connect to Ki11er AK47 Community.", logType.critical);
    }
}

function disconnected() {
    dispatcher.end("Disconnection");
    connection.disconnect();
}

function processCommand(message, isMod, command) {
    if (isMod) {
        if (command == "prepchat") { //Ki11er specific command
            var numberOfMembers = 15;
            if (message.guild.id != consts.kill.id) {
                message.reply(':no_entry_sign: ERROR: Unable to use that command in this server.');
            } else if (!allowPrepChat) {
                message.reply(':no_entry_sign: ERROR: Command was run less than a minute ago. To override this, use `mod:forceprepchat`');
            } else {
                var waitingRoom = client.channels.get(consts.kill.waitingRoomChannel);

                membersInWaitingRoom = Array.from(waitingRoom.members.values());

                for (var i = 0; i < membersInWaitingRoom.length; i++) {
                    var member = membersInWaitingRoom[i];
                    if (member.selfMute || member.serverMute || member.id == 282048599574052864) {// || isMod(member)) {
                        membersInWaitingRoom.splice(i, 1);
                        i--;
                    }
                }

                var placeMemberFunction = function() {
                    numberOfMembersTried++;
                    if (membersInWaitingRoom.length != 0) {
                        //Choose a random member
                        var chosenMember = membersInWaitingRoom.splice(Math.floor(Math.random() * 1000) % membersInWaitingRoom.length, 1)[0];
                        chosenMember.setVoiceChannel(consts.kill.weeklyChatChannel).then(function() {
                            chosenMember.addRole(message.guild.roles.get(consts.kill.weeklyChateesRole));
                            log("Member placed in weekly chat");
                            membersPlaced.push(chosenMember);
                            message.channel.send(":speech_balloon: `" + getUserString(chosenMember) + "` was placed into the Weekly Chat")
                            //postFeedbackFunction();
                        }).catch(function() {
                            log("Member couldn't be placed in weekly chat", logType.warning);
                            message.channel.send(":speech_balloon: `" + getUserString(chosenMember) + "` was unable to be placed into the Weekly Chat")
                            //postFeedbackFunction();
                        });
                        return true;
                    } else {
                        log("No more members to place in weekly chat");
                        return false;
                        //postFeedbackFunction();
                    }
                }

                var changeAllowPrepChat = true;

                for (var i = 0; i < numberOfMembers; i++) {
                    if (placeMemberFunction()) {
                        if (i == numberOfMembers - 1) {
                            //TODO: Turn on expletive filter
                            message.channel.send(":speech_balloon: " + parseInt(numberOfMembers) + " people have been queued to be moved to the weekly chat.")
                        }
                    } else {
                        if (i == 0) {
                            message.channel.send(":speech_balloon: No eligible members were found in the waiting room.")
                            changeAllowPrepChat = false;
                        } else {
                            message.channel.send(":speech_balloon: There are only " + parseInt(i) + " eligible members in the weekly chat and all of them have been queued to be moved in.")
                            //TODO: Turn on expletive filter
                        }
                        i = numberOfMembers;
                    }
                }

                message.delete();
                
                if (changeAllowPrepChat) {
                    allowPrepChat = false;
                    setTimeout(function() {
                        allowPrepChat = true;
                    }, 60000);
                }
            }
        } else if (command == "stopchat") {
            if (message.guild.id != consts.kill.id) {
                message.reply(':no_entry_sign: ERROR: Unable to use that command in this server.');
            } else {
                message.guild.roles.get(consts.kill.weeklyChateesRole).members.forEach(function(cmember) {
                    cmember.removeRole(message.guild.roles.get(consts.kill.weeklyChateesRole));
                });
                message.channel.send(":speech_balloon: All weekly chat-ees have the In Game permissions revoked.");
            }
            message.delete();
        }
    }

    if (command == "inviteki11") {
        message.author.send("Here's an invite to Ki11er AK47 Community: https://discord.gg/hS7h7Dd");
    }
}

module.exports = {
    name: "AstralPhaser Central Commands",
    constructor: function(discordClient, commandEmitter, constants) {
        client = discordClient;
        consts = constants;

        commandEmitter.on('startup', startup);
        commandEmitter.on('processCommand', processCommand);
        commandEmitter.on('disconnect', disconnected);
        commandEmitter.on('reconnect', startup);
    },
    destructor: function(commandEmitter) {
        dispatcher.end("Disconnection");
        connection.disconnect();

        commandEmitter.removeListener('startup', startup);
        commandEmitter.removeListener('processCommand', processCommand);
        commandEmitter.removeListener('disconnect', disconnected);
        commandEmitter.removeListener('reconnect', startup);
    },
    availableCommands: {
        general: {
            commands: [
                "inviteki11"
            ]
        },
        "277922530973581312": {
            modCommands: [
                "prepchat",
                "stopchat"
            ]
        }
    },
    acquireHelp: function(helpCmd) {
        var help = {};

        switch (helpCmd) {
            case "inviteki11":
                help.title = "am:inviteki11";
                help.helpText = "Obtain an invite link to the Ki11er AK47 Community.";
                break;
            case "prepchat":
                help.title = "mod:prepchat";
                help.helpText = "Prepares the Ki11er AK47 Weekly Chat by moving 15 people from the Waiting Room to the Weekly Chat room, and applying the Weekly Chat permission to those people. **This command can only be used in Ki11er AK47 Community.**";
                break;
            case "stopchat":
                help.title = "mod:stopchat";
                help.helpText = "Revokes Weekly Chat role from everyone who has the role. **This command can only be used in Ki11er	AK47 Community.**";
                break;
        }

        return help;
    }
}