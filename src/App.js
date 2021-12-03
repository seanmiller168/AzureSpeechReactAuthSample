import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { getTokenOrRefresh } from './token_util';
import './custom.css'
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')


export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            displayText: 'INITIALIZED: ready to test speech...'
        }
    }
    
    async componentDidMount() {
        // check for valid speech key/region
        const tokenRes = await getTokenOrRefresh();
        if (tokenRes.authToken === null) {
            this.setState({
                displayText: 'FATAL_ERROR: ' + tokenRes.error
            });
        }
    }

    async sttFromMic() {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';
        
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        this.setState({
            displayText: 'Speak into your microphone...\n'
        });

        recognizer.recognizing = (sender, eventArgs) => {

            let recognizingMessage = eventArgs.result.text;
            this.setState({
                displayText: `${recognizingMessage}\n`
            });
        };

        recognizer.recognized = (sender, eventArgs) => {
            if (eventArgs.result.reason === speechsdk.ResultReason.NoMatch) {
                var notMatchedMessage = `I didn't recognize the text`;
                this.setState({
                    displayText: `${this.state.displayText}${notMatchedMessage}\n`
                });
            } else {
                var results = JSON.parse(eventArgs.result.json)['NBest'];
                var matchedMessage = `Recognized ${eventArgs.result.text}\n`;
                matchedMessage += `Additional Details\n\n`;
                results.forEach((additionalDetails) => {
                    matchedMessage += `Text ${additionalDetails.Display}\n`;
                    matchedMessage += `Confidence ${additionalDetails.Confidence}\n`;
                    matchedMessage += `LexicalForm ${additionalDetails.Lexical}\n`;
                    matchedMessage += `NormalizedForm ${additionalDetails.ITN}\n`;
                    matchedMessage += `MaskedNormalizedForm ${additionalDetails.MaskedITN}\n`;
                });
                this.setState({
                    displayText: `${this.state.displayText}${matchedMessage}\n`
                });                
            }
        };
        recognizer.canceled = (sender, eventArgs) => {
            var cancelledMessage = `Cancelled reason ${eventArgs.reason}`
            this.setState({
                displayText: `${this.state.displayText}${cancelledMessage}\n`
            });
        };
        recognizer.startContinuousRecognitionAsync();

    }

    async fileChange(event) {
        const audioFile = event.target.files[0];
        console.log(audioFile);
        const fileInfo = audioFile.name + ` size=${audioFile.size} bytes `;

        this.setState({
            displayText: fileInfo
        });

        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';

        const audioConfig = speechsdk.AudioConfig.fromWavFileInput(audioFile);
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognizeOnceAsync(result => {
            let displayText;
            if (result.reason === ResultReason.RecognizedSpeech) {
                displayText = `RECOGNIZED: Text=${result.text}`
            } else {
                displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
            }

            this.setState({
                displayText: fileInfo + displayText
            });
        });
    }

    render() {
        return (
            <Container className="app-container">
                <h1 className="display-4 mb-3">Speech sample app</h1>

                <div className="row main-container">
                    <div className="col-6">
                        <div className="row input microphone">
                            <div className="column input startMicrophone">
                                <i className="fas fa-microphone fa-lg fa-fw fa-align-center" onClick={() => this.sttFromMic()}></i>  
                            </div>
                            <div className="column microphoneText">
                                Convert speech to text from your mic.
                            </div>
                        </div>
                        <div className="row input stopMicrophone">
                            <div className="column input stopMicrophone">
                                <i className="fas fa-stop-circle fa-lg fa-fw fa-align-center" onClick={() => console.log('clicked')}></i>
                            </div>
                            <div className="column stopMicrophoneText">
                                Stop transcribing speech from your mic.
                            </div>
                        </div>
                        <div className="row input audioFile">
                            <div className="column input audioFile">
                                <label htmlFor="audio-file"><i className="fas fa-file-audio fa-lg fa-fw fa-align-center"></i></label>
                                <input 
                                    type="file" 
                                    id="audio-file" 
                                    onChange={(e) => this.fileChange(e)} 
                                    style={{display: "none"}} 
                                />
                            </div>
                            <div className="column input audioFileText">
                                Convert speech to text from an audio file.
                            </div>
                        </div>
                    </div>
                    <div className="col-6 output-display rounded">
                        <code>{this.state.displayText}</code>
                    </div>
                </div>
            </Container>
        );
    }
}