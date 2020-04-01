import * as React from 'react';
import '../styles/Menu.css';
import Modal from 'react-modal';
type Props = {
    endpoint: string,
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
    stderr: string,
    stdout: string,
    spacerJson: string,
}
export default class UploadModal extends React.Component<Props, State> {
    private spacerLogUpload = React.createRef<HTMLInputElement>();
    private inputUpload = React.createRef<HTMLInputElement>();
    private runCmdUpload = React.createRef<HTMLInputElement>();
    private stderrUpload = React.createRef<HTMLInputElement>();
    private stdoutUpload = React.createRef<HTMLInputElement>();
    private spacerJsonUpload = React.createRef<HTMLInputElement>();



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
            stderr: "",
            stdout: "",
            spacerJson: ""
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
                    className="upload-modal"
                    style={{
                        overlay: {
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.75)',
                            zIndex: '100',
                        },
                        content: {
                            position: 'absolute',
                            width: '300px',
                            border: '1px solid #ccc',
                            background: '#fff',
                            overflow: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            borderRadius: '4px',
                            outline: 'none',
                            padding: '20px',
                        }
                    }}                >
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
                        <span>input smt2 file</span>
                        <input
                            ref={this.inputUpload}
                            type="file"
                            onChange={(evt) => this.uploadEncoding(evt, 'inputFile')}
                        />
                        <br />
                        <span>runCmd (optional)</span>
                        <input
                            ref={this.runCmdUpload}
                            type="file"
                            onChange={(evt) => this.uploadEncoding(evt, 'runCmd')}
                        />
                        <br />
                        <span>STDERR (optional)</span>
                        <input
                            ref={this.stderrUpload}
                            type="file"
                            onChange={(evt) => this.uploadEncoding(evt, 'stderr')}
                        />
                        <br />
                        <span>STDOUT (optional)</span>
                        <input
                            ref={this.stdoutUpload}
                            type="file"
                            onChange={(evt) => this.uploadEncoding(evt, 'stdout')}
                        />
                        <br />
                        <button className="fake-button" onClick={this.closeModal.bind(this)}>Exit</button>
                        <button className="fake-button" onClick={this.uploadFiles.bind(this)}>Upload</button>
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

        const fetchedJSON = await fetch(this.props.endpoint+'/spacer/upload_files', {
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
                runCmd: this.state.runCmd,
                stderr: this.state.stderr,
                stdout: this.state.stdout,
                spacerJson: this.state.spacerJson
            })
        });

        try {
            const json = await fetchedJSON.json();
            console.log("backend response:", json)
            if (json.status === "success") {
                this.setState({
                    isUploading: false,
                    message: "Experiment uploaded successfully. Please close the modal."
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
