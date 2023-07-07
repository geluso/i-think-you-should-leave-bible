let ALL_DATA = {};
let FILTERED = {};

let JSON_LOADED = 0;

let REVERSE_SKIT_LOOKUP = {};

let SEASONS = [];
let EPISODES = [];
let SEASON_LOOKUP = {};
let EPISODE_LOOKUP = {};

const STRUCTURE_SAMPLE = [
  {"type":"directory","name":".","contents":[
    {"type":"directory","name":"S02","contents":[
      {"type":"file","name":"201 - How to Fire a Rifle Without Really Trying.mkv"},
      {"type":"directory","name":"201_-_How_to_Fire_a_Rifle_Without_Really_Trying","contents":[
        {"type":"file","name":"201_-_How_to_Fire_a_Rifle_Without_Really_Trying.json"},
        {"type":"directory","name":"audio","contents":[
          {"type":"file","name":"0000.wav"},
          {"type":"file","name":"0001.wav"},
        ]},
      ]},
     ]},
  ]}
];

const main = () => {
    fetch("structure.json")
    .then(res => res.json())
    .then(dotLevelDirectory => {
        for (let entry of dotLevelDirectory) {
          if (entry.type === 'directory') {
            processShow(entry);
            buildTableOfContents(); 
          }
        }
    });   
};

const processShow = (show) => {
  for (let entry of show.contents) {
    if (entry.type === 'directory') {
      processSeason(entry);
    }
  }

  console.log({SEASONS});
  console.log({SEASON_LOOKUP});
  console.log({EPISODES});
  console.log({EPISODE_LOOKUP});
}

const processSeason = (season) => {
  console.log('---------------------------------');
  console.log('Season:', season.name);

  SEASONS.push(season.name);
  SEASON_LOOKUP[season.name] = season;
  
  for (let entry of season.contents) {
    if (entry.type === 'directory') {
      processEpisode(entry);
    }
  }
}

const processEpisode = (episode) => {
  console.log('Episode:', episode.name);

  EPISODES.push(episode.name);
  EPISODE_LOOKUP[episode.name] = episode;

  for (let entry of episode.contents) {
    if (entry.type === 'file' && entry.name.includes('json')) {
      console.log('file:', entry.name);
    }
  }
};

function buildTableOfContents() {
  const seasonsList = document.getElementById('seasons-list');
  
  SEASONS.forEach(seasonName => {
      // the name of the file is the episode number.
      const season = SEASON_LOOKUP[seasonName];
  
      const seasonListItem = document.createElement('li');
      seasonListItem.textContent = seasonName;
      seasonsList.appendChild(seasonListItem);
  
      const episodesList = document.createElement('ul');
      seasonListItem.appendChild(episodesList);
  
      const episodes = season.contents;
      episodes.forEach(episode => {
          if (episode.type !== 'directory') return;

          // skit name is a name like "01-barley"
          const episodeName = episode.name;
  
          const episodeNameListItem = document.createElement('li');
          episodeNameListItem.textContent = episodeName
          episodeNameListItem.classList.add('clickable');
          episodesList.appendChild(episodeNameListItem);
  
          //const clips = episode.contents;
          //clips.forEach(clip => {
          //    const clipNumber = clip.name.split(".")[0];
          //    const clipId = episodeNumber + '-' + clipNumber.split(".")[0];
          //    console.log('reverse skit lookup put', clipId);
          //    REVERSE_SKIT_LOOKUP['data/' + clipId] = episodeName;
          //});
  
          //episodeNameListItem.addEventListener('click', () => {
          //    clearAll();
  
          //    clips.forEach(clip => {
          //        const clipNumber = clip.name.split(".")[0];
          //        const clipId = episodeNumber + '-' + clipNumber;
          //        addClip(clipId)
          //    });
          //});
      })
  })
  
  incrementJSONLoaded();
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
    console.log('reverse skit lookup get', clipId);
    const text = clipId + ' ' + REVERSE_SKIT_LOOKUP[clipId];
    title.textContent = text
    linesContainer.appendChild(title);

      
    // another nasty hack
    if (!episodeNumber.includes("data/")) {
        episodeNumber = 'data/' + episodeNumber;
    }

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

    // nasty hack
    if (episodeNumber.includes("data")) {
      episodeNumber = episodeNumber.split("/")[1];
    }

    const video = document.createElement('video');
    clipNumber = clipNumber.split(".")[0]
    filename = 'media/' + episodeNumber + '/scenes/' + clipNumber + '.mp4';
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
        let nextClipNumber = Math.min(Object.keys(ALL_DATA['data/' + episodeNumber]).length - 1, parseInt(clipNumber) + 1);
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
