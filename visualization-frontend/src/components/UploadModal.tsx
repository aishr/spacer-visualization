import * as React from 'react';
import '../styles/NodeMenu.css';
import {Link} from 'react-router-dom';
import Modal from 'react-modal';
const icons = require('../resources/icons/all.svg') as string;
type Props = {
    triggerFetching: ()=>void,
};
type State = {
    isOpen: boolean,
    isUploading: boolean,
    message: string,
    expName: string,
    spacerLog: string,
    inputFile: string,
    runCmd: string,
}
export default class UploadModal extends React.Component<Props, State> {
    private spacerLogUpload = React.createRef<HTMLInputElement>();
    private inputUpload = React.createRef<HTMLInputElement>();
    private runCmdUpload = React.createRef<HTMLInputElement>();
    private stderrUpload = React.createRef<HTMLInputElement>();
    private stdoutLogUpload = React.createRef<HTMLInputElement>();
    private spacerJsonUpload = React.createRef<HTMLInputElement>();

    private filesToUpload = {"spacerLog": "",
                             "stderr":"",
                             "stdout":"",
                             "input":"",
                             "runCmd":"",
                             "spacerJson":""
    };


    constructor(props) {
        super(props);
        this.state = {
            isUploading: false,
            isOpen: false,
            message: "",
            expName: "",
            spacerLog: "",
            inputFile: "",
            runCmd: "",
        };
    }

    async componentDidMount() {
    }

    render() {
        return (
            <div>
                <div className="fake-button" onClick={this.openModal.bind(this)} > Upload your experiment </div>
                <Modal
                    isOpen={this.state.isOpen}
                    contentLabel="Example Modal"
                    onRequestClose={this.closeModal}
                    onAfterClose={this.props.triggerFetching}
                    id="upload-modal"
                >
                    <span>{this.state.message}</span>
                    <br />
                    <label>Experiment's name</label>
                    <input onChange={this.onChangeExpName.bind(this)}/>
                    <br />
                    <span>spacer.log</span>
                    <input
                        ref={this.spacerLogUpload}
                        type="file"
                        onChange={(evt) => this.uploadEncoding(evt, 'spacerLog')}
                    />
                    <br />
                    <span>runCmd</span>
                    <input
                        ref={this.runCmdUpload}
                        type="file"
                        onChange={(evt) => this.uploadEncoding(evt, 'runCmd')}
                    />
                    <br />
                    <span>input smt2 file</span>
                    <input
                        ref={this.inputUpload}
                        type="file"
                        onChange={(evt) => this.uploadEncoding(evt, 'inputFile')}
                    />                    <br />
                    <button onClick={this.closeModal.bind(this)}>Exit</button>
                    <button onClick={this.uploadFiles.bind(this)}>Upload</button>
                </Modal>
            </div>
        )
    }
    openModal() {
        this.setState({isOpen: true});
    }

    closeModal(){
        this.setState({isOpen: false});
    }

    onChangeExpName(e){
        this.setState({"expName": e.target.value});
    }

    uploadEncoding(event: React.ChangeEvent<HTMLInputElement>, key: string) {
        if (event.target.files !== null && event.target.files.length > 0) {
            const file = event.target.files[0];

            const reader = new FileReader();
            // callback which will be executed when readAsText is called
            reader.onloadend = () => {
                const text = (reader.result ? reader.result : '') as string;
                this.setState({[key]: text} as any);
            };
            reader.readAsText(file);
        }
    }

    async uploadFiles() {
        this.setState({
            isUploading: true,
            message: "Uploading the experiment...",
        });

        const fetchedJSON = await fetch('http://localhost:5000/spacer/upload_files', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                expName: this.state.expName,
                spacerLog: this.state.spacerLog,
                inputFile: this.state.inputFile,
                runCmd: this.state.runCmd

            })
        });

        try {
            const json = await fetchedJSON.json();
            console.log("backend response:", json)
            if (json.status === "success") {
                this.setState({
                    isUploading: false,
                    message: "Experiment uploaded successfully. Please close the modal and refresh."
                });
            } else {
                this.setState({
                    isUploading: false,
                    message: json.message,
                });
            }
        } catch (error) {
            if (error.name === "SatVisAssertionError") {
                throw error;
            }
            this.setState({
                isUploading: false,
                message: `Error: ${error["message"]}`,
            });
        }
    }


}
