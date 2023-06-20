# The "I Think You Should Leave" Bible

Messing around with `ffmpeg` and a new tool the
[whisper.cpp](https://github.com/ggerganov/whisper.cpp) audio to text
transcription engine.

This processes episodes of the TV show "I Think You Should Leave."

ffmpeg runs scene detection to chop the episode up into short clips.

whisper.cpp runs audio to text translation on the clips to generate basically
subtitles, or just raw text.

Another tool creates JSON files for all the text and associates it with the
clip the audio/text came from.

The website loads the JSON files and provides a search interface where
you can type in words spoken in the show and see video clips.

See it live:

https://5tephen.com/i-think-you-should-leave-bible/?q=zip+line
