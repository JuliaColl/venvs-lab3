import { AudioChatOverlayView } from "./audioChatOverlayView.js";

export class AudioChatController {
    _chunkTimeMs = null;
    _isMuted = null;

    wsClient = null;

    constructor(chunkTimeMs = 500) {
        this._chunkTimeMs = chunkTimeMs;
        this._isMuted = true;

        this._audioChatOverlayView = new AudioChatOverlayView();
        this._audioChatOverlayView.onClick = (e) => {
          e.preventDefault();
          console.log("clicked")
          if (this._isMuted){
            this._audioChatOverlayView.unmute();
            this._start();
          } else {
            this._audioChatOverlayView.mute();
            this._stop();
          }
        }
    }

    _start(){
        if (!this._isMuted) return;
        this._isMuted = false;

        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            var mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
        
            var audioChunks = [];
        
            mediaRecorder.addEventListener("dataavailable", function (event) {
              audioChunks.push(event.data);
            });
        
            mediaRecorder.addEventListener("stop", () => {
              var audioBlob = new Blob(audioChunks);
        
              audioChunks = [];
        
              var fileReader = new FileReader();
              fileReader.readAsDataURL(audioBlob);
              fileReader.onloadend = () => {
                if (this._isMuted) return;
        
                var base64String = fileReader.result;
                this.wsClient.sendAudio(base64String);
              };
        
              if (!this._isMuted) {
                mediaRecorder.start();
                setTimeout(function () {
                    mediaRecorder.stop();
                  }, this._chunkTimeMs);
              }
            });
        
            setTimeout(function () {
              mediaRecorder.stop();
            }, this._chunkTimeMs);
        });
    }

    _stop(){
        this._isMuted = true;
    }

    onAudioReceived(blob){
        const audio = new Audio("data:audio/ogg;" + blob.split(";")[1]);
        audio.play();
    }
}

// core code: https://dev.to/hosseinmobarakian/create-simple-voice-chat-app-with-nodejs-1b70
