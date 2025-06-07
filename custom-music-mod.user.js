// ==UserScript==
// @name         Drednot Music Mod
// @version      1.2
// @description  Music on drednot.io
// @author       MiguelEX3
// @match        https://*.drednot.io/
// @icon         https://drednot.io/img/item/exbox.png
// @downloadURL  https://raw.githubusercontent.com/MiguelEXE/drednot-custom-music-mod/master/custom-music-mod.js
// @updateURL    https://raw.githubusercontent.com/MiguelEXE/drednot-custom-music-mod/master/custom-music-mod.js
// @supportURL   https://github.com/MiguelEXE/drednot-custom-music-mod/issues
// @namespace    https://github.com/MiguelEXE/drednot-custom-music-mod
// @grant        none
// @run-at       document-start
// ==/UserScript==

let holderWrapper;
let youtubePlayer;
let skipAndDeny = false;
let alreadyAsked = false;
const _wait = ms => new Promise(r => setTimeout(r,ms));
function createHolder(){
	const holderWrapper2 = document.createElement("div");
	const holder = document.createElement("div");
	holderWrapper2.classList.add("holder-wrapper2");
	holderWrapper2.append(holder);
	holderWrapper.append(holderWrapper2);
	return holder;
}
let currentYoutubePlayer;
function parseMotd(motd){
	const splitted = motd.split("\n");
	let platform = "";
	let id = "";
	for(const line of splitted){
		const args = line.split(" ");
		if(args.shift() === "#SOUND"){
			platform = args.shift();
			id = args.join(" ");
		}
	}
	return {platform, id};
}
function onPlayerStateChange(event){
	switch(event.data){
		case YT.PlayerState.ENDED:
			event.target.seekTo(0);
			break;
		default:
			break;
	}
}
function onPlayerReady(event){
	event.target.playVideo();
}
function playYoutubeVideo(id){
	youtubePlayer.loadVideoById(id);
}

function createTextEl(elType, text){
	const el = document.createElement(elType);
	el.innerText = text;
	return el;
}
function createBox(){
	const bigBox = document.createElement("div");
	bigBox.classList.add("modal-container");
	const smallBox = document.createElement("div");
	smallBox.classList.add("modal-window");
	smallBox.classList.add("window");
	smallBox.classList.add("darker");
	bigBox.append(smallBox);
	document.body.append(bigBox);
	return {bigBox, smallBox};
}
function createLinkToYoutubeVideo(id){
	return `https://www.youtube.com/watch?v=${id}`;
}
function createLinkToPlatformAudio(platform, id){
	const link = createTextEl("a", "Link to the audio which the mod will play.");
	link.target = "_blank";
	link.rel = "noopener noreferrer";
	switch(platform){
		case "YTV":
			link.href = createLinkToYoutubeVideo(id);
			break;
		default:
			console.warn("[DCMM] Invalid platform for link");
			break;
	}
	return link;
}
function askPermission(platform, id){
	const {bigBox, smallBox} = createBox();
	const acceptEl = createTextEl("button", "Yes");
	const denyEl = createTextEl("button", "No");
	acceptEl.classList.add("btn-green");
	denyEl.classList.add("btn-red");
	smallBox.style.textAlign = "center";
	smallBox.append(createTextEl("h2", alreadyAsked ? `Let this ship play another music on your tab?` : `Let this ship play music on your tab?`), createTextEl("p", "BY PRESSING 'Yes' YOU CONFIRM THAT ANY AUDIO PLAYED IS NOT FROM THE MOD AUTHOR'S FAULT BUT FROM WHO PUT IN THE MOTD.\nPressing 'No' will deny further request from the ship to play any audio on your tab. To reset this, simply rejoin the ship."), createLinkToPlatformAudio(platform, id), document.createElement("br"), acceptEl, denyEl);
	alreadyAsked = true;
	return new Promise(r => {
		function deny(e){
			if(!e.isTrusted) return;
			acceptEl.removeEventListener("click", accept);
			denyEl.removeEventListener("click", deny);
			bigBox.remove();
			skipAndDeny = true;
			r(false);
		}
		function accept(e){
			if(!e.isTrusted) return;
			acceptEl.removeEventListener("click", accept);
			denyEl.removeEventListener("click", deny);
			bigBox.remove();
			r(true);
		}
		acceptEl.addEventListener("click", accept);
		denyEl.addEventListener("click", deny);
	});
}
function stopPlayers(){
	youtubePlayer.stopVideo();
	console.info("[DCMM] Stopped players.");
}
async function checkAndPlaySound(motd){
	if(skipAndDeny) return;
	const {platform, id} = parseMotd(motd);
	if(platform !== ""){
		const hasPermission = await askPermission(platform, id);
		if(!hasPermission) return stopPlayers();
	}
	switch(platform){
		case "YTV":
			//embed.src = makeYTVEmbedURL(id);
			console.info("[DCMM] Youtube video.");
			playYoutubeVideo(id);
			break;
		default:
			console.warn("[DCMM] Invalid platform");
			break;
	}
}
function waitFor(el){
	return new Promise(async r => {
		while(!document.querySelector(el)) await _wait(1);
		r(document.querySelector(el));
	});
}
async function createSoundInfo(){
	const soundSection = document.createElement("section");
	soundSection.append(createTextEl("h3", "Drednot Music Mod"));
	const firstSection = document.createElement("p");
	soundSection.append(firstSection);

	firstSection.append(createTextEl("b", "Status:"));
	const status = createTextEl("span", "Loading...");
	status.style = "margin-left: 5px;"
	firstSection.append(status);

	const menu = await waitFor("#shipyard > div:nth-child(1)");
	menu.append(soundSection);
	return {statusEl: status};
}
function loadYoutubeAPI(){
	const script = document.createElement("script");
	script.src = "https://www.youtube.com/iframe_api";
	document.head.append(script);
	return new Promise(r => {
		window.onYouTubeIframeAPIReady = () => r();
	});
}

// Main function
(async function() {
    'use strict';

	const {statusEl} = await createSoundInfo();
	holderWrapper = document.createElement("div");
	document.body.append(holderWrapper);
	holderWrapper.style.display = "none";
	// Your code here...
	await loadYoutubeAPI();
	const ytHolder = createHolder();
	youtubePlayer = new YT.Player(ytHolder, {
		suggestedQuality: "tiny",
		events: {
			onStateChange: onPlayerStateChange,
			onReady: onPlayerReady
		}
	});

	const mapButtonEl = document.querySelector("#exit_button");
	const motdTextEl = document.querySelector("#motd-text");
	let observer = new MutationObserver(function(){
		checkAndPlaySound(motdTextEl.textContent);
	});
	observer.observe(motdTextEl, {
		characterData: true,
		subtree: true,
		attributes: true,
		childList: true
	});
	let gameClosedObserver = new MutationObserver(function(){
		if(getComputedStyle(mapButtonEl).display === "none"){
			alreadyAsked = skipAndDeny = false;
			stopPlayers();
		}
	});
	gameClosedObserver.observe(mapButtonEl, {
		attributes: true
	});
	statusEl.textContent = "Ready!";
})();
