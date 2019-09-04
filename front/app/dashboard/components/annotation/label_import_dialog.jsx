import React from 'react';
import Button from '@material-ui/core/Button';
import CardHeader from '@material-ui/core/CardHeader';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import FormControl from '@material-ui/core/FormControl'
import Close from '@material-ui/icons/Close';
import Send from '@material-ui/icons/Send';


export default class LabelImportDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formOpen: false,
      file: null,
    };
  }

  show = () => {
    this.setState({ formOpen: true });
  }

  hide = () => {
    this.setState({ formOpen: false });
  }

  handleChangeFile = (e) => {
    const file = e.target.files.item(0);
    this.setState({ file: file });
  }

  handleSubmit = () => {
    // Define data reader
    var reader = new FileReader();
    // Get text
    reader.readAsText(this.state.file);
    // After loading
    reader.addEventListener( 'load', function() {
      // Parse JSON
      const data = JSON.parse(reader.result);
      // Set url for API
      let url = `/projects/${this.props.project_id}/annotations/${this.props.annotation_id}/import_labels_from_json/`;
      // Post request
      RequestClient.post(
        url,
        data,
        function(res) {
          console.log(res);
        },
        function(mes) {
          console.log(mes);
        }
      );
    }.bind(this));
  }

  render() {
    const closeButton = (
      <Button
        onClick={this.hide}
      >
        <Close />
      </Button>
    );

    return (
      <span>
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
              <FormControl>
                <input
                  type="file"
                  onChange={(e) => this.handleChangeFile(e)}
                />
              </FormControl>

              <Button
                variant="contained"
                color="primary"
                onClick={this.handleSubmit}
              >
                <Send />&nbsp;Submit
              </Button>
            </DialogContent>
          </Dialog>
        </div>

      </span>
    );
  }
}
