
import { doc } from "prettier";
import { fetchRequest } from "../api";
import { ENDPOINT, LOADED_TRACKS, SECTIONTYPE, getItemFromLocalStorage, logout, setItemLocalStorage } from "../common";

const audio = new Audio();
let displayName;

const onProfileClick = (event) => {
    event.stopPropagation();
    const profileMenu = document.querySelector("#profile-menu");
    profileMenu.classList.toggle("hidden");
    if(!profileMenu.classList.contains("hidden")) {
        profileMenu.querySelector("li#logout").addEventListener("click", logout);
    }
}

const loadUserProfile = ()=>{
    return new Promise(async(resolve,reject)=>{
    
        const defaultImage= document.querySelector("#default-image");
        const profileButton = document.querySelector("#user-profile-btn");
        const displayNameElement=document.querySelector("#display-name");
    
        const {display_name:displayName,images} = await fetchRequest(ENDPOINT.userInfo);
    
        if(images?.length){
            defaultImage.classList.add("hidden");
        }else{
            defaultImage.classList.remove("hidden");
            
        }
        profileButton.addEventListener("click",onProfileClick)

        displayNameElement.textContent=displayName;
        resolve({displayName});
    })


}

const onPlaylistItemClicked = (event,id) => {
    console.log(event.target);
    const section = {type: SECTIONTYPE.PLAYLIST, playlist: id};
    history.pushState(section, "", `playlist/${id}`);
    loadSection(section);
}

const loadPlaylist = async(endpoint, elementId)=>{
    const  {playlists:{items}} = await fetchRequest(endpoint);
    const playlistItemsSection = document.querySelector(`#${elementId}`);
    
    for(let {name, description, images, id} of items){

        const playlistItem = document.createElement("section");
        playlistItem.className = "bg-black-secondary rounded p-4 hover:cursor-pointer hover:bg-light-black";
        playlistItem.id = id;
        playlistItem.setAttribute("data-type", "playlist");
        playlistItem.addEventListener("click",(event)=> onPlaylistItemClicked(event,id))

        const [{url:imageUrl}] = images;
        playlistItem.innerHTML = `<img src="${imageUrl}" alt="${name}" class="rounded mb-4 object-contain shadow" />
                    <h2 class="text-base font-semibold mb-1 truncate">${name}</h2>
                    <h3 class="text-sm text-secondary line-clamp-5">${description}</h3>`
        playlistItemsSection.appendChild(playlistItem);
    }
    
}

const loadPlaylists = ()=>{
    loadPlaylist(ENDPOINT.featuredPlaylist, "featured-playlist-items");
    loadPlaylist(ENDPOINT.toplists, "top-playlist-items");
}

const fillContentForDashboard = () =>{
    const coverContext = document.querySelector("#cover-content");
    coverContext.innerHTML = `<h1 class="text-6xl ml-5">Hello, ${displayName}</h1>`;
    const pageContent = document.querySelector("#page-content");
    const playlistMap = new Map([["featured","featured-playlist-items"],["top playlists","top-playlist-items"]]);
    let innerHTML = "";
    for(let [type, id] of playlistMap){
        innerHTML += `<article class="p-4">
       <h1 class="mb-4 text-2xl font-bold capitalize">${type}</h1>
        <section id="${id}" class="featured-songs grid grid-cols-auto-fill-cards gap-4">
           
        </section>
    </article>`
    }
    pageContent.innerHTML = innerHTML;
}

const formatTime = (duration)=>{
    const min = Math.floor(duration/60_000);
    const sec = ((duration%6_000) / 1000).toFixed(0);
    const formattedTime = sec == 60?
    min + 1 + ":00" : min + ":" + (sec < 10 ? "0" : "") + sec;
    return formattedTime;
}

const onTrackSelection = (id, event) => {
    document.querySelectorAll("#tracks .track").forEach(trackItem => {
        if (trackItem.id === id) {
            trackItem.classList.add("bg-gray", "selected");
        } else {
            trackItem.classList.remove("bg-gray","selected"); 
        }
    })
}

const updateIconsForPlayMode = (id) => {
    const playButton = document.querySelector("#play");
    playButton.querySelector("span").textContent = "pause_circle";
    const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
    
    if (playButtonFromTracks) {
        playButtonFromTracks.textContent = "pause";
    }
    
}

const updateIconsForPauseMode = (id) => {
    const playButton = document.querySelector("#play");
    playButton.querySelector("span").textContent = "play_circle";
    const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
    if (playButtonFromTracks) {
        playButtonFromTracks.textContent = "play_arrow";
    }
}

const onAudioMetaDataLoaded = (id) => {
    const totalSongDuration = document.querySelector("#total-song-duration");
    totalSongDuration.textContent = `0:${audio.duration.toFixed(0)}`;
    
}

const togglePlay = () => {
    if(audio.src){
        if(audio.paused){
            audio.play();
            
        } else{
            audio.pause();
            
        }
    }
}

const findCurrentTrack = () => {
    const audioControl = document.querySelector("#audio-control");
    const trackId = audioControl.getAttribute("data-track-id");
    if(trackId) {
        const loadedTracks = getItemFromLocalStorage(LOADED_TRACKS);
        const currentTrackIndex = loadedTracks?.findIndex(trk=> trk.id === trackId);
        return {currentTrackIndex, tracks:loadedTracks};
    }
    return null;
}

const playNextTrack = () => {
    const {currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
    if(currentTrackIndex > -1 && currentTrackIndex < tracks?.length - 1){
        playTrack(null, tracks[currentTrackIndex + 1]);
    }
}

const playPrevTrack = () => {
    const {currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
    if(currentTrackIndex > 0){
        playTrack(null, tracks[currentTrackIndex - 1]);
    }
}

const playTrack = (event, {image, artistNames, name, duration, previewUrl, id}) => {
    if(event?.stopPropagation) {
        event.stopPropagation();
    }
    
    if(audio.src === previewUrl){
        togglePlay();
    }else {
        document.querySelectorAll("[data-play").forEach(btn => {
            btn.setAttribute("data-play", "false");
            console.log(btn);
        })
        console.log(event, {image, artistNames, name, duration, previewUrl, id});
    
        const nowPlayingSongImage = document.querySelector("#now-playing-image");
        const songTitle = document.querySelector("#now-playing-song");
        const artists = document.querySelector("#now-playing-artists");
        const audioControl = document.querySelector("#audio-control");
        const songInfo = document.querySelector("#song-info");

        audioControl.setAttribute("data-track-id", id);
        nowPlayingSongImage.src = image.url;
        songTitle.textContent = name;
        artists.textContent = artistNames;
        audio.src = previewUrl;
        audio.play(); 
        songInfo.classList.remove("invisible");
    }
}

const loadPlaylistTracks = ({tracks})=>{
    const trackSections = document.querySelector("#tracks");

    let trackNo = 1;
    const loadedTracks = [];
    for(let trackItem of tracks.items.filter(item=> item.track.preview_url)) { 
        
        let {id, artists, name, album, duration_ms: duration, preview_url: previewUrl} = trackItem.track;
        let track = document.createElement("section");
        track.id = id;
        track.className = "track p-1 grid grid-cols-[50px_1fr_1fr_50px] items-center justify-items-start gap-4 rounded-md hover:bg-light-black";
        let image = album.images.find(img => img.height === 64);
        const artistNames = Array.from(artists, artist => artist.name).join(", ");
        track.innerHTML = `<p class="relative w-full flex items-center justify-center"><span class="track-no">${trackNo++}</span></p>
        <section class="grid grid-cols-[auto_1fr] place-items-center gap-2">
            <img class="h-10 w-10" src="${image.url}" alt="${name}">
            <article class="song-title flex flex-col gap-1 justify-center">
                <h2 class="text-base text-primary line-clamp-1">${name}</h2>
                <p class="text-xs line-clamp-1">${artistNames}</p>
            </article>
        </section>
        <p class="text-sm">${album.name}</p>
        <p class="text-sm">${formatTime(duration)}</p>`;

        track.addEventListener("click", (event) => onTrackSelection(id, event));

        const playButton = document.createElement("button");
        playButton.id = `play-track-${id}`
        playButton.className = `play w-full absolute left-0 text-lg invisible material-symbols-outlined`;
        playButton.textContent = "play_arrow";

        playButton.addEventListener("click", (event) => playTrack(event, {image, artistNames, name, duration, previewUrl, id}));

        track.querySelector("p").appendChild(playButton);
        trackSections.appendChild(track);
        loadedTracks.push({id, artistNames, name, album, duration, previewUrl, image});
    }
    setItemLocalStorage(LOADED_TRACKS, loadedTracks);
}

const fillContentForPlaylist = async(playlistId)=>{
    const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistId}`)
    const { name, description, images, tracks } = playlist;
    const coverElement = document.querySelector("#cover-content");
    coverElement.innerHTML = `
    <img class="object-contain ml-4 h-40 w-40" src="${images[0].url}" alt="" />
    <section>
            <p id="playlist-name" class="text-6xl">${name}</p>
            <p id="playlist-details" class="text-base">${tracks.items.length} songs</p>
    </section>`;
    
    const pageContent = document.querySelector("#page-content");
    pageContent.innerHTML = `<header id="playlist-header" class="mx-8  border-light-black border-b-[2px] z-10">
    <nav class="py-2">
        <ul class="grid grid-cols-[50px_1fr_1fr_50px] gap-4 text-secondary">
            <li class="justify-self-center">#</li>
            <li>Title</li>
            <li>Album</li>
            <li><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          </li>
        </ul>
    </nav>
</header>
<section class="px-8 text-secondary mt-4" id="tracks"></section>`

console.log(playlist);
loadPlaylistTracks(playlist);
}

const onContentScroll = (event) => {
        const {scrollTop} = event.target;
        const header = document.querySelector(".header");
        const coverElement = document.querySelector("#cover-content");
        const totalHeight = coverElement.offsetHeight;
        const coverOpacity = 100 - (scrollTop >= totalHeight ? 100 : (scrollTop/totalHeight)*100);
        const headerOpacity = scrollTop >= header.offsetHeight? 100: ((scrollTop/header.offsetHeight)*100);
        coverElement.style.opacity = `${coverOpacity}`;
        header.style.background = `rgba(0 0 0 / ${headerOpacity}%)`;

        if(history.state.type === SECTIONTYPE.PLAYLIST){
            const playlistHeader = document.querySelector("#playlist-header");
            if(coverOpacity <= 35){
                playlistHeader.classList.add("sticky","bg-black", "px-8");
                playlistHeader.classList.remove("mx-8");
                playlistHeader.style.top = `${header.offsetHeight}px`;

            }else{
                playlistHeader.classList.remove("sticky","bg-black", "px-8");
                playlistHeader.classList.add("mx-8");
                playlistHeader.style.top = `revert`;

            }

        }
}

const loadSection = (section) => {
    if(section.type === SECTIONTYPE.DASHBOARD){
        fillContentForDashboard();
        loadPlaylists();
    }
    else if(section.type === SECTIONTYPE.PLAYLIST){
        //load the elements for playlists
        fillContentForPlaylist(section.playlist);
    }

    document.querySelector(".content").removeEventListener("scroll",onContentScroll);
    document.querySelector(".content").addEventListener("scroll",onContentScroll);
    
}

const onUserPlaylistClick = (id) => {
    const section = {type:SECTIONTYPE.PLAYLIST, playlist: id};
    history.pushState(section, "", `/dashboard/playlist/${id}`);
    loadSection(section);
}

const loadUserPlaylists = async()=>{
    const playlists = await fetchRequest(ENDPOINT.userPlaylist);
    console.log(playlists);
    const userPlaylistSection = document.querySelector("#user-playlists > ul");
    userPlaylistSection.innerHTML = "";
    for(let {name,id} of playlists.items){
         const li = document.createElement("li");
         li.textContent = name;
         li.className = "cursor-pointer hover:text-primary";
         li.addEventListener("click", ()=>onUserPlaylistClick(id));
         userPlaylistSection.appendChild(li);
    }
}

document.addEventListener("DOMContentLoaded", async() => {
    const volume = document.querySelector("#volume");
    const playButton = document.querySelector("#play");
    const songDurationCompleted = document.querySelector("#song-duration-completed");
    const songProgress = document.querySelector("#progress");
    const timeline = document.querySelector("#timeline");
    const audioControl = document.querySelector("#audio-control");
    const next = document.querySelector("#next");
    const prev = document.querySelector("#prev");
    let progressInterval;
    ({displayName} = await loadUserProfile());
    loadUserPlaylists();
    const section = { type: SECTIONTYPE.DASHBOARD};
    // const section = {type: SECTIONTYPE.PLAYLIST, playlist: "37i9dQZF1DX5cZuAHLNjGz"};
    history.pushState(section, "", "");
    // history.pushState(section,"",`/dashboard/playlist/${section.playlist}`);
    loadSection(section);

    document.addEventListener("click", () => {
        const profileMenu = document.querySelector("#profile-menu");
        if(!profileMenu.classList.contains("hidden")){
            profileMenu.classList.add("hidden")
        }
    })

    audio.addEventListener("play",()=>{
        
        const selectedTrackId = audioControl.getAttribute("data-track-id");
        const tracks = document.querySelector("#tracks");
        const playingTrack = tracks?.querySelector("section.playing");
        const selectedTrack = tracks?.querySelector(`[id="${selectedTrackId}"]`);
        if(playingTrack?.id !== selectedTrack?.id){
            playingTrack?.classList.remove("playing");
        }
        selectedTrack?.classList.add("playing");

        progressInterval = setInterval(() => {
            if(audio.paused){
                return
            }
            songDurationCompleted.textContent = `${audio.currentTime.toFixed(0) < 10 ? "0:0" + audio.currentTime.toFixed(0) : "0:" + audio.currentTime.toFixed(0)}`;
            songProgress.style.width = `${(audio.currentTime/ audio.duration) * 100}%`;
        }, 100);
        updateIconsForPlayMode(selectedTrackId);
    })

    audio.addEventListener("pause",()=>{
        if(progressInterval) {
            clearInterval(progressInterval);
        }
        const selectedTrackId = audioControl.getAttribute("data-track-id");
        updateIconsForPauseMode(selectedTrackId);
    })

    audio.addEventListener("loadedmetadata", onAudioMetaDataLoaded);
        playButton.addEventListener("click", togglePlay);

    volume.addEventListener("change",()=>{
        audio.volume = volume.value / 100;
    })

    timeline.addEventListener("click", (e)=>{
        const timelineWidth = window.getComputedStyle(timeline).width;
        const timeToSeek = (e.offsetX / parseInt(timelineWidth)) * audio.duration;
        audio.currentTime = timeToSeek;
        songProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    },false);

    next.addEventListener("click", playNextTrack);
    prev.addEventListener("click", playPrevTrack);

    window.addEventListener("popstate", (event) => {
        loadSection(event.state);
    })
})