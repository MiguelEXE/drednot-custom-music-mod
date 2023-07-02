// ==UserScript==
// @name         Custom ship music
// @version      1.0
// @description  Music on drednot.io
// @author       MiguelEX3
// @match        https://*.drednot.io/
// @icon         https://test.drednot.io/img/item/exbox.png
// @downloadURL  https://raw.githubusercontent.com/MiguelEXE/drednot-custom-music-mod/master/custom-music-mod.js
// @updateURL    https://raw.githubusercontent.com/MiguelEXE/drednot-custom-music-mod/master/custom-music-mod.js
// @supportURL   https://github.com/MiguelEXE/drednot-custom-music-mod/issues
// @namespace    https://github.com/MiguelEXE/drednot-custom-music-mod
// @grant        none
// @run-at       document-start
// ==/UserScript==

let holderWrapper;
let youtubePlayer;
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
function playSound(motd){
	const {platform, id} = parseMotd(motd);
	console.log(platform, id);
	switch(platform){
		case "YTV":
			//embed.src = makeYTVEmbedURL(id);
			console.info("[OSTs] Youtube video.");
			playYoutubeVideo(id);
			break;
		default:
			console.warn("[OSTs] Invalid platform");
			break;
	}
}
const _wait = ms => new Promise(r => setTimeout(r,ms));
function waitFor(el){
	return new Promise(async r => {
		while(!document.querySelector(el)) await _wait(1);
		r(document.querySelector(el));
	});
}
function createTextEl(elType, text){
	const el = document.createElement(elType);
	el.innerText = text;
	return el;
}
async function createSoundInfo(){
	const soundSection = document.createElement("section");
	soundSection.append(createTextEl("h3", "Custom ship music mod"));
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
function stopPlayers(){
	console.info("[OSTs] done.");
	youtubePlayer.stopVideo();
}

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

	const mapButtonEl = document.querySelector("#map_button");
	const motdTextEl = document.querySelector("#motd-text");
	let observer = new MutationObserver(function(){
		playSound(motdTextEl.textContent);
	});
	observer.observe(motdTextEl, {
		characterData: true,
		subtree: true,
		attributes: true,
		childList: true
	});
	let gameClosedObserver = new MutationObserver(function(){
		if(getComputedStyle(mapButtonEl).display === "none"){
			stopPlayers();
		}
	});
	gameClosedObserver.observe(mapButtonEl, {
		attributes: true
	});
	statusEl.textContent = "Ready!";
})();