import React from 'react';
import Button from '@material-ui/core/Button';
import CardHeader from '@material-ui/core/CardHeader';
import { amber, green } from '@material-ui/core/colors';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import Close from '@material-ui/icons/Close';
import Send from '@material-ui/icons/Send';


export default class LabelImportDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formOpen: false,
      file: null,
      isImportSuccess: null,
      message: '',

      // States for candidates
      candidatesObjects: [],
      selectedCandidateId: null,
    };
  }

  show = () => {
    this.setState({ formOpen: true });

    this.fetchCandidates();
  }

  hide = () => {
    this.setState({ formOpen: false });
  }

  handleChangeFile = (e) => {
    const file = e.target.files.item(0);
    this.setState({ file: file });
  }

  handleChangeStorage = (e) => {
    this.setState({ selectedCandidateId: e.target.value });
  };

  handleSubmit = () => {
    // Define data reader
    var reader = new FileReader();
    // Get text
    reader.readAsText(this.state.file);
    // After loading
    reader.addEventListener( 'load', function() {
      // Create data to send to API
      const data = {
        labelJson: JSON.parse(reader.result),
        candidateId: this.state.selectedCandidateId,
      };
      // Set url for API
      let url = `/projects/${this.props.project_id}/annotations/${this.props.annotation_id}/import_labels_from_json/`;
      // Post request
      RequestClient.post(
        url,
        data,
        function() {
          this.setState({ isImportSuccess: true });
          this.setState({ message: '成功しました' });
        }.bind(this),
        function() {
          this.setState({ isImportSuccess: false });
          this.setState({ message: '失敗しました' });
        }.bind(this)
      );
    }.bind(this));
  }

  fetchCandidates = () => {
    // Set url for API
    let url = `/projects/${this.props.project_id}/originals/${this.props.dataset_id}/candidates/`;
    // Post request
    RequestClient.get(
      url,
      {},
      function(res) {
        var candidates = [];
        for(let v of res.records) {
          candidates.push({
            name: JSON.parse(v.analyzed_info).topic_name,
            id: v.candidate_id,
            data_type: v.data_type,
          });
        }
        this.setState({ candidatesObjects: candidates })
      }.bind(this),
      function(res) {
        console.log(res);
      }.bind(this)
    );
  }

  render() {
    const closeButton = (
      <Button
        onClick={this.hide}
      >
        <Close />
      </Button>
    );

    const successMessage = (
      <SnackbarContent 
        message={this.state.message}
        style={{
          backgroundColor: green[600],
          marginTop: '15px',
        }}
      />
    );

    const errorMessage = (
      <SnackbarContent 
        message={this.state.message}
        style={{
          backgroundColor: amber[700],
          marginTop: '15px',
        }}
      />
    );

    const storageMenu = this.state.candidatesObjects.map(
      (candidate, index) => {
        return (
          <MenuItem key={index} value={candidate.id}>
            {candidate.data_type} : {candidate.name}
          </MenuItem>
        );
      }
    );

    return (
      <span className="col-xs-1">
        <a
          className="button glyphicon glyphicon-import"
          onClick={this.show}
          title="Import"
        />

        <div>
          <Dialog
            open={this.state.formOpen}
            aria-labelledby="form-dialog-title"
          >
            <CardHeader action={closeButton} title="Import Labels from JSON" />
            <DialogContent>
              <div>
                <FormControl>
                  <input
                    type="file"
                    onChange={(e) => this.handleChangeFile(e)}
                  />
                </FormControl>
              </div>

              <div style={{ marginTop: '15px' }}>
                <FormControl>
                  <InputLabel htmlFor="candidate">Candidate</InputLabel>
                  <Select
                    autoFocus
                    value={this.state.selectedCandidateId || false}
                    onChange={this.handleChangeStorage}
                  >
                    {storageMenu}
                  </Select>
                </FormControl>
              </div>

              <div style={{ marginTop: '15px' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.handleSubmit}
                >
                  <Send />&nbsp;Submit
                </Button>
              </div>

              {this.state.isImportSuccess === true ? successMessage : null}
              {this.state.isImportSuccess === false ? errorMessage : null}
            </DialogContent>
          </Dialog>
        </div>

      </span>
    );
  }
}
