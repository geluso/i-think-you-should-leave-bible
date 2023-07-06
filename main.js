const EPISODES = [
    "s03e01",
    "s03e02",
    "s03e03",
    "s03e04",
    "s03e05",
    "s03e06",
]

let ALL_DATA = {};
let FILTERED = {};

let JSON_LOADED = 0;

let REVERSE_SKIT_LOOKUP = {};

const main = () => {
  EPISODES.forEach(loadEpisode);
  loadSkits();
}

const loadSkits = () => {
    fetch("skits.json")
    .then(res => res.json())
    .then(episodes => {
        const episodesList = document.getElementById('episodes-list');

        episodes.forEach(episode => {
            // the name of the file is the episode number.
            const episodeNumber = episode.name;
            const skits = episode.contents;

            const episodeNumberListItem = document.createElement('li');
            episodeNumberListItem.textContent = episodeNumber;
            episodesList.appendChild(episodeNumberListItem);

            const skitsList = document.createElement('ul');
            episodeNumberListItem.appendChild(skitsList);

            skits.forEach(skit => {
                // skit name is a name like "01-barley"
                const skitName = skit.name;

                const skitNameListItem = document.createElement('li');
                skitNameListItem.textContent = skitName
                skitNameListItem.classList.add('clickable');
                skitsList.appendChild(skitNameListItem);

                const clips = skit.contents;
                clips.forEach(clip => {
                    const clipNumber = clip.name.split(".")[0];
                    const clipId = episodeNumber + '-' + clipNumber.split(".")[0];
                    REVERSE_SKIT_LOOKUP[clipId] = skitName;
                });

                skitNameListItem.addEventListener('click', () => {
                    clearAll();

                    clips.forEach(clip => {
                        const clipNumber = clip.name.split(".")[0];
                        const clipId = episodeNumber + '-' + clipNumber;
                        addClip(clipId)
                    });
                });
            })
        })

        incrementJSONLoaded();
    });
}

const loadEpisode = (episode) => {
    fetch(episode + ".json")
    .then(res => res.json())
    .then(json => {
        ALL_DATA[episode] = json;
        console.log('episode:', episode)

        const form = document.getElementById('search-form');
        const input = document.getElementById('search-input');
        form.addEventListener('submit', (ev) => handleSearch(ev, input.value))

        incrementJSONLoaded();
    });
}

const incrementJSONLoaded = () => {
    JSON_LOADED++;
    // adding + 1 here to account for loading the skits.json too
    if (JSON_LOADED === EPISODES.length + 1) {
        populateSearch();
    }
}

const populateSearch = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const searchTerm = searchParams.get("q") || 'zip line';

    const input = document.getElementById('search-input');
    input.value = searchTerm;

    const eventStub = { preventDefault: () => {} }
    handleSearch( eventStub, searchTerm);
}

const handleSearch = (ev, searchTerm) => {
    clearAll();

    ev.preventDefault();
    searchTerm = searchTerm.toLowerCase();

    var searchParams = new URLSearchParams(window.location.search);
    searchParams.set("q", searchTerm);
    var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
    history.pushState(null, '', newRelativePathQuery);

    FILTERED = {};

    const episodes = Object.keys(ALL_DATA);
    episodes.forEach(episode => {
        const clips = Object.keys(ALL_DATA[episode]);
        clips.forEach(clip => {
            const lines = ALL_DATA[episode][clip];
            lines.forEach(({timestamp, text}) => {
                if (text.toLowerCase().includes(searchTerm)) {
                    FILTERED[episode + '-' + clip] = lines;
                }
            });
        });
    })

    populate(FILTERED);

    const results = document.getElementById('results-count');
    const count = Object.keys(FILTERED).length + ' results.';
    console.log('results:', count);
    results.textContent = count;
}

const clearAll = () => {
    const resultsContainer = document.getElementById('results-container');
    while (resultsContainer.firstChild) {
        resultsContainer.firstChild.remove();
    }
}

const populate = episodeClips => {
    for (episodeClip in episodeClips) {
        addClip(episodeClip)
    }
}

const addClip = episodeClip => {
    const [episodeNumber, clipNumber] = episodeClip.split('-');

    const resultsContainer = document.getElementById('results-container');

    const clipContainer = document.createElement('div');
    clipContainer.classList.add('clip');

    resultsContainer.appendChild(clipContainer);

    const videoContainer = document.createElement('div');
    clipContainer.appendChild(videoContainer);

    const playContainer = document.createElement('p');
    const play = document.createElement("button")
    playContainer.appendChild(play);
    videoContainer.appendChild(playContainer)

    play.textContent = "play"
    play.addEventListener('click', () => {
        playMovie(linesContainer, videoContainer, episodeNumber, clipNumber);
    })

    const linesContainer = document.createElement('div');
    clipContainer.appendChild(linesContainer);

    addLines(linesContainer, episodeNumber, clipNumber)
}

const addLines = (linesContainer, episodeNumber, clipNumber) => {
    while (linesContainer.firstChild) {
        linesContainer.firstChild.remove();
    }

    // nasty hack to canonicalize differences between clip files with .mp4 or .srt extensions.
    if (!clipNumber.includes(".srt")) {
        clipNumber = clipNumber.split(".")[0] + ".srt";
    }

    const title = document.createElement('h3');

    const clipId = episodeNumber + '-' + clipNumber.split(".")[0];
    const text = clipId + ' ' + REVERSE_SKIT_LOOKUP[clipId];
    title.textContent = text
    linesContainer.appendChild(title);

    const lines = ALL_DATA[episodeNumber][clipNumber]
    lines.forEach(line => {
        const div = document.createElement('div');
        div.textContent = line.text
        linesContainer.appendChild(div);
    })
}

const playMovie = (linesContainer, videoContainer, episodeNumber, clipNumber) => {
    console.log('play movie:', episodeNumber, clipNumber);

    while (videoContainer.firstChild) {
        videoContainer.firstChild.remove();
    }

    const video = document.createElement('video');
    clipNumber = clipNumber.split(".")[0]
    filename = episodeNumber + '/scenes/' + clipNumber + '.mp4';
    video.src = filename
    video.controls = true;
    video.autoplay = true;

    const prevNextControls = document.createElement('p');
    const prev = document.createElement('button');
    prev.textContent = 'prev';
    prev.addEventListener('click', () => {
        let prevClipNumber = Math.max(0, parseInt(clipNumber) - 1);
        prevClipNumber = String(prevClipNumber).padStart(4, '0');
        console.log('clip number:', clipNumber, 'prev:', prevClipNumber);
        addLines(linesContainer, episodeNumber, prevClipNumber + '.srt');
        playMovie(linesContainer, videoContainer, episodeNumber, prevClipNumber + '.mp4');
    });

    const next = document.createElement('button');
    next.textContent = 'next';
    next.addEventListener('click', () => {
        let nextClipNumber = Math.min(Object.keys(ALL_DATA[episodeNumber]).length - 1, parseInt(clipNumber) + 1);
        nextClipNumber = String(nextClipNumber).padStart(4, '0');
        console.log('clip number:', clipNumber, 'next:', nextClipNumber);
        addLines(linesContainer, episodeNumber, nextClipNumber + '.srt');
        playMovie(linesContainer, videoContainer, episodeNumber, nextClipNumber + '.mp4');
    });

    videoContainer.appendChild(prevNextControls);
    prevNextControls.appendChild(prev);
    prevNextControls.appendChild(next);

    videoContainer.appendChild(video);
}

document.addEventListener('DOMContentLoaded', main);
