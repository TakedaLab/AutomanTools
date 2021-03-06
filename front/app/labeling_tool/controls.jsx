import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import TextField from '@material-ui/core/TextField';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { NavigateNext, NavigateBefore, ExitToApp } from '@material-ui/icons';
import { withSnackbar } from 'notistack';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { setControls } from './actions/tool_action';

import KlassSet from 'automan/labeling_tool/klass_set';
import Annotation from 'automan/labeling_tool/annotation';
import History from 'automan/labeling_tool/history';
import Clipboard from 'automan/labeling_tool/clipboard';
import LoadingProgress from 'automan/labeling_tool/base_tool/loading_progress';

import ImageLabelTool from 'automan/labeling_tool/image_label_tool';
import PCDLabelTool from 'automan/labeling_tool/pcd_label_tool';

import {toolStyle, appBarHeight, drawerWidth} from 'automan/labeling_tool/tool-style';

import RequestClient from 'automan/services/request-client';
import { execKeyCommand } from './key_control/index';

class Controls extends React.Component {
  // progress
  frameLength = 0;
  // tool status
  toolNames = [];
  toolComponents = [];

  constructor(props) {
    super(props);
    this.state = {
      frameNumber: 0,
      skipFrameCount: 1,
      activeTool: 0,
      isLoading: false,
      isActivePCD: false,
      isCreationKeyPressed: false,
      isMouseOnTool: false,
    };

    this.frameLength = props.labelTool.frameLength;
    this.mainContent = React.createRef();
    this.initTools();
  }
  initTools() {

    // Return if candidate-info is not available
    if (!this.props.labelTool.candidateInfo) {
      return
    }

    // Select tools
    const imageTools = this.props.labelTool.candidateInfo.filter((item) => {
      return item.data_type === 'IMAGE'
    }).map(() => {
      return ImageLabelTool
    });
    const PCDTools = this.props.labelTool.candidateInfo.filter((item) => {
      return item.data_type === 'PCD'
    }).map(() => {
      return PCDLabelTool
    });

    // load labeling tools
    const LABEL_TYPES = {
      BB2D: {
        tools: imageTools,
        pcdIndex: -1,
        names: imageTools.map(()=>'undefined')
      },
      BB2D3D: {
        tools: imageTools.concat(PCDTools),
        pcdIndex: imageTools.length,
        names: imageTools.concat(PCDTools).map(()=>'undefined')
      }
    };
    const type = LABEL_TYPES[this.props.labelTool.labelType];
    if (type == null) {
      console.error('Tool type error [' + this.props.labelTool.labelType + ']');
      return;
    }
    this.toolNames = type.names;
    this.pcdToolIndex = type.pcdIndex;
    this.toolComponents = type.tools.map((tool, idx) => {
      const Component = tool;
      const component = (
        <Component
          key={idx}
          idx={idx}
        />
      );
      return component;
    });
  }
  init() {
    return Promise.all([
      this.props.annotation.init(),
      this.props.klassSet.init(),
      this.props.history.init(),
      this.props.clipboard.init()
    ]);
  }
  resize() {
    // TODO: resize all
    const w = $(window);
    const size = {
      width: w.width() - drawerWidth * 2,
      height: w.height() - appBarHeight
    };

    if (this.mainContent.current != null) {
      this.mainContent.current.style.height = size.height + 'px';
    }
    this.props.tools.forEach((tool) => {
      tool.handles.resize(size);
    });
  }
  initEvent() {
    $(window)
      .keydown(e => {
        if (this.state.isLoading) {
          return;
        }

        // Enable box-creation mode with key 'alt'
        if (e.key === "Alt") {
          this.setState({"isCreationKeyPressed": true});
        }

        // Tool-specific commands
        if (this.state.isMouseOnTool) {
          // Remove browser's default event-handlers
          if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
            e.returnValue = '';
          }

          // Box controls
          const targetLabel = this.props.annotation.getTarget()
          if(targetLabel){
            if(targetLabel.bbox){
              Object.keys(targetLabel.bbox).forEach((bkey) => {
                // loop bbox object
                const bbox = targetLabel.bbox[bkey]
                if(bbox){
                  const shiftBboxParams = (bbox, box_d) => {
                    var changedLabel = bbox.label.createHistory(null)
                    changedLabel.addHistory()
                    bbox.shiftBboxParams(box_d);
                  }
                  ["x", "y", "z"].forEach(axis => {
                    ["pos", "size"].forEach(param => {
                      [
                        "increment", "increment_big",
                        "decrement", "decrement_big"
                      ].forEach(action => {
                        const command = "bbox_"+axis+"_"+param+"_"+action
                        const box_d = {
                          pos: { x: 0, y: 0, z: 0 },
                          size: { x: 0, y: 0, z: 0 },
                          yaw: 0,
                        }
                        switch(action){
                          case "increment":
                            box_d[param][axis] = 0.01
                            break
                          case "decrement":
                            box_d[param][axis] = -0.01
                            break
                          case "increment_big":
                            box_d[param][axis] = 0.1
                            break
                          case "decrement_big":
                            box_d[param][axis] = -0.1
                            break
                        }
                        execKeyCommand(command, e.originalEvent, () => {
                          shiftBboxParams(bbox, box_d)
                        })
                      })
                    })
                  })
                }
              })
            }
          }

          // bbox
          execKeyCommand("bbox_remove", e.originalEvent, () => {
            const label = this.getTargetLabel();
            if (label != null) {
              this.removeLabel(label);
            }
          })
          execKeyCommand("bbox_copy", e.originalEvent, () => this.props.clipboard.copy(null))
          execKeyCommand("bbox_paste", e.originalEvent, () => this.props.clipboard.paste(false))
          execKeyCommand("bbox_paste_in_place", e.originalEvent, () => this.props.clipboard.paste(true))

          execKeyCommand("select_next_bbox", e.originalEvent, () => {
            this.props.annotation.getNextTarget()
          })
          execKeyCommand("select_prev_bbox", e.originalEvent, () => {
            this.props.annotation.getPrevTarget()
          })
          execKeyCommand("deselect_bbox", e.originalEvent, () => {
            this.props.annotation.setTarget(null)
          })
          execKeyCommand("change_tool_mode", e.originalEvent, () => {
            this.setPCDActive(
              !this.state.isActivePCD
            )
          })
        }


        // save
        execKeyCommand("save_frame", e.originalEvent, () => this.saveFrame())

        // history
        execKeyCommand("history_undo", e.originalEvent, () => this.props.history.undo())
        execKeyCommand("history_redo", e.originalEvent, () => this.props.history.redo())

        // frame
        execKeyCommand("frame_next", e.originalEvent, () => this.nextFrame())
        execKeyCommand("frame_prev", e.originalEvent, () => this.previousFrame())

        this.getTool().handles.keydown(e);
      })
      .keyup(e => {
        if (this.state.isLoading) {
          return;
        }

        // Disable box-creation mode with key 'alt'
        if (e.key === "Alt") {
          this.setState({"isCreationKeyPressed": false});
        }

        this.getTool().handles.keyup(e);
      });

    window.addEventListener('resize', () => {
      this.resize();
    });

    // Prompt if there's unsaved changes
    window.addEventListener("beforeunload", (event) => {
      if (this.props.annotation.isChanged()) {
        const confirmationMessage = '保存されていない変更がありますが本当に閉じますか？';
        event.preventDefault();
        event.returnValue = confirmationMessage;
        return confirmationMessage;
      }
    });
  }

  selectKlass(kls) {
    if (!this.props.labelTool.isLoaded()) {
      return false;
    }
    let newKls = this.props.klassSet.setTarget(kls);
    if (newKls !== null) {
      const label = this.props.annotation.getTarget();
      if (label !== null) {
        this.props.annotation.changeKlass(label, newKls);
        // update ??
      }
    } else {
      return false;
    }
    return true;
    // *********
  }
  getTargetKlass() {
    return this.props.klassSet.getTarget();
  }
  getKlass(name) {
    return this.props.klassSet.getByName(name);
  }
  selectLabel(label) {
    if (!this.props.labelTool.isLoaded()) {
      return false;
    }
    const oldLabel = this.props.annotation.getTarget()
    let newLabel;
    newLabel = this.props.annotation.setTarget(label);
    if (newLabel !== null) {
      this.props.klassSet.setTarget(newLabel.klass);
    }
    //update
    this.getTool().updateTarget(oldLabel, newLabel);
    return true;
    // *********
  }
  getTargetLabel() {
    return this.props.annotation.getTarget();
  }
  createLabel(klass, param) {
    if (!this.props.labelTool.isLoaded()) {
      return null;
    }
    let newLabel = null;
    try {
      newLabel = this.props.annotation.create(klass, param);
    } catch (e) {
      // error
      console.log(e);
      return null;
    }
    this.props.annotation.setTarget(newLabel);
    this.props.klassSet.setTarget(newLabel.klass);
    // update ??
    return newLabel;
    // *********
  }
  removeLabel(label) {
    if (!this.props.labelTool.isLoaded()) {
      return false;
    }
    try {
      this.props.annotation.remove(label);
    } catch (e) {
      // error
      return false;
    }
    // update
    return true;
    // *********
  }

  getFixedSkipFrameCount() {
    return Math.max(1, this.state.skipFrameCount);
  }

  getTools() {
    return this.props.tools;
  }
  getPCDActive() {
    return this.state.isActivePCD;
  }
  setPCDActive(isActive) {
    const prevState = this.state.isActivePCD;
    const pcdIndex = this.pcdToolIndex;
    if (pcdIndex < 0 || prevState === isActive) {
      return;
    }
    let prevTool, nextTool;
    const activeTool = this.state.activeTool;
    const imageTool = this.props.tools[activeTool];
    const pcdTool = this.props.tools[pcdIndex];
    this.setState({isActivePCD: isActive});
    if (prevState) {
      pcdTool.setActive(false);
      imageTool.setActive(true);
    } else {
      imageTool.setActive(true, true);
      pcdTool.setActive(true);
    }
  }
  setTool(idx) {
    const isActivePCD = this.state.isActivePCD;
    const activeTool = this.state.activeTool;
    if (activeTool === idx) {
      return;
    }
    const prevTool = this.props.tools[activeTool];
    const nextTool = this.props.tools[idx];
    this.setState({activeTool: idx});
    prevTool.setActive(false);
    nextTool.setActive(true, isActivePCD);

    if (this.pcdToolIndex) {
      this.props.tools[this.pcdToolIndex].activeToolUpdated(idx);
    }
  }
  getTool() {
    if (this.state.isActivePCD) {
      return this.props.tools[this.pcdToolIndex];
    }
    return this.props.tools[this.state.activeTool];
  }
  getToolFromCandidateId(id) {
    const filtered = this.getTools().filter(tool =>
      tool.isTargetCandidate(id)
    );
    if (filtered.length != 1) {
      //controls.error('candidate id error');
      return null;
    }
    return filtered[0];
    // *********
  }

  nextFrame(count) {
    if (count == undefined) {
      count = Math.max(1, this.state.skipFrameCount);
    }
    this.moveFrame(count);
  }
  previousFrame(count) {
    if (count == undefined) {
      count = Math.max(1, this.state.skipFrameCount);
    }
    this.moveFrame(-count);
  }
  moveFrame(cnt) {
    // TODO: check type of'cnt'
    let newFrame = this.state.frameNumber + cnt;
    newFrame = Math.max(newFrame, 0);
    newFrame = Math.min(this.frameLength - 1, newFrame);
    if (window.isFinite(newFrame)) {
      return this.setFrameNumber(newFrame);
    }
    return false;
  }
  isLoading = false;
  setFrameNumber(num) {
    num = parseInt(num);
    if (isNaN(num) || num < 0 || this.frameLength <= num) {
      return false;
    }
    if (this.state.frameNumber === num) {
      return true;
    }

    let savePromise;
    if (this.props.annotation.isChanged()) {
      const TEXT_SAVE = 'Do you want to save?';
      const TEXT_MOVE = 'Do you want to move frame WITHOUT saving?';
      if ( window.confirm(TEXT_SAVE) ) {
        savePromise = this.props.annotation.save();
      } else if ( window.confirm(TEXT_MOVE) ) {
        savePromise = Promise.resolve();
      } else {
        return true;
      }
    } else {
      savePromise = Promise.resolve();
    }

    savePromise
      .then(() => this.loadFrame(num))
      .then(
        () => {
        },
        err => {
          this.props.enqueueSnackbar('' + err, { variant: 'error' });
        }
      );
    return true;
  }

  saveFrame() {
    return this.props.annotation.save()
      .then(() => this.loadFrame(this.getFrameNumber()))
      .then(
        () => {
          this.props.enqueueSnackbar('Saved', { variant: 'success' });
        },
        err => {
          this.props.enqueueSnackbar('' + err, { variant: 'error' });
        }
      );
  }
  reloadFrame() {
    return this.loadFrame(this.getFrameNumber())
      .then(
        () => {
        },
        err => {
          this.props.enqueueSnackbar('' + err, { variant: 'error' });
        }
      );
  }

  // Validate number of frame
  validateFrameNumber(frameNumber) {
    return !isNaN(frameNumber) && 0 < frameNumber && frameNumber < this.frameLength;
  }

  loadFrame(num) {
    if (this.state.isLoading) {
      return Promise.reject('duplicate loading');
    }
    this.selectLabel(null);

    if (num == null) {
      num = this.state.frameNumber;
    }

    // Prefetch next frame if exists
    const nextFrameNumber = num + Math.max(1, this.state.skipFrameCount);
    if (this.validateFrameNumber(nextFrameNumber)) {
      this.props.labelTool.loadBlobURL(nextFrameNumber);
    }

    this.setState({ isLoading: true });
    return this.props.labelTool.loadBlobURL(num)
      .then(() => {
        return this.props.annotation.load(num);
      })
      // Load previous frame data for wipe
      .then(() => {
        const previousFrameNumber = num - Math.max(1, this.state.skipFrameCount);
        if (this.validateFrameNumber(previousFrameNumber)) {
          return this.props.labelTool.loadBlobURL(previousFrameNumber);
        }
      })
      .then(() => {
        return Promise.all(
          this.getTools().map(
            tool => tool.load(num)
          )
        );
      })
      .then(() => {
        this.setState({ isLoading: false });
        this.setState({frameNumber: num});

        // Set timer for auto save
        this.clearAutoSaveTimer();
        this.initializeAutoSaveTimer();
      });
  }
  getFrameNumber() {
    return this.state.frameNumber;
  }


  initialized = false;
  isAllComponentsReady() {
    return !this.initialized &&
      this.props.controls != null &&
      this.props.annotation != null &&
      this.props.klassSet != null &&
      this.props.history != null &&
      this.props.clipboard != null;
  }
  toolInitialized = false;
  isToolReady() {
    return !this.toolInitialized &&
      this.props.controls == null &&
      this.props.toolsCnt == this.toolComponents.length;
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.isToolReady()) {
      if (this.props.labelTool.candidateInfo.length !== this.getTools().length) {
        this.initTools();
      }

      this.props.labelTool.candidateInfo.forEach(info => {
        // Parse analyzed_info
        const analyzedInfo = JSON.parse(info.analyzed_info);

        // Select a suitable tool and set properties of it
        this.getTools().forEach((tool, toolIndex) => {
          if (this.getTools().map((t) => t.candidateId).includes(info.candidate_id)) {
            return;
          }

          // Get an available tool
          if (tool.dataType === info.data_type) {
            if (tool.candidateId >= 0) {
              return;
            }
            tool.candidateId = info.candidate_id;
            this.props.labelTool.filenames[tool.candidateId] = [];
            this.toolNames[toolIndex] = analyzedInfo['topic_name'];

            // Add event handler of mouseenter and mouseleave
            tool._wrapper.mouseenter(() => {
              this.setState({'isMouseOnTool': true});
            }).mouseleave(() => {
              this.setState({'isMouseOnTool': false});
            });
          }
        }, analyzedInfo);
      });

      this.props.tools[this.state.activeTool].setActive(true);

      this.resize();

      this.toolInitialized = true;
      this.props.dispatchSetControls(this);
    }

    if (this.isAllComponentsReady()) {
      this.init().then(() => {
        this.initialized = true;
        this.props.onload(this);
      }, err => {
        this.props.enqueueSnackbar('' + err, { variant: 'error' });
      });
    }
  }

  // events
  onClickLogout = (e) => {
    this.setState({ isLoading: true });
    RequestClient.delete(
      this.props.labelTool.getURL('unlock'),
      null,
      res => {
        window.close();
      },
      err => {
      }
    );
  };
  onClickNextFrame = (e) => {
    if (this.state.isLoading) {
      return;
    }
    this.nextFrame();
  };
  onClickPrevFrame = (e) => {
    if (this.state.isLoading) {
      return;
    }
    this.previousFrame();
  };
  onFrameBlurOrFocus = (e) => {
    e.target.value = '';
  };
  onFrameKeyPress = (e) => {
    // only when enter
    if (e.charCode == 13) {
      let value = +(e.target.value);
      this.setFrameNumber(value - 1);
      e.target.value = '';
      e.preventDefault();
      return;
    }
  };
  onSkipChange = (e) => {
    let value = +(e.target.value) | 0;
    if (e.target.value === '') {
      value = 0;
    }
    if (isNaN(value) || value < 0) {
      return;
    }
    this.setState({ skipFrameCount: value });
  };

  // Auto save timer
  initializeAutoSaveTimer() {
    // Initialize timer for autosave (every 1 hour)
    this.timerForAutoSave = setInterval(() => {
      this.saveFrame();
    }, 1000 * 60 * 60);
  }
  clearAutoSaveTimer() {
    // Clear timer for autosave
    clearInterval(this.timerForAutoSave);
  }

  renderKlassSet(classes) {
    return (
      <KlassSet
        classes={classes}
      />
    );
  }
  renderLabels(classes) {
    return (
      <Annotation
        classes={classes}
      />
    );
  }
  renderLeftBar(classes) {
    const toolButtons = [];
    this.toolNames.forEach((name, idx) => {
      if (idx === this.pcdToolIndex) {
        return;
      }
      const isActive = this.state.activeTool === idx;
      const cls = isActive ? classes.activeTool : '';
      const button = (
        <ListItem
          onClick={() => this.setTool(idx)}
          button={!isActive}
          key={idx}
          className={cls}
        >
          {name}
        </ListItem>
      );
      toolButtons.push(button);
    });
    let pcdButton;
    if (this.pcdToolIndex >= 0) {
      pcdButton = (
        <Button
          onClick={
            () => this.setPCDActive(
              !this.state.isActivePCD
            )
          }
          variant={
            this.state.isActivePCD ?
              'contained' : 'outlined'
          }
        >
          3D
        </Button>
      );
    }
    const tool = this.getTool();
    const buttons  = tool == null ? null : tool.getButtons();
    return (
      <Drawer
        anchor="left"
        variant="permanent"
        open={true}
        classes={{
          paper: classes.drawer
        }}
      >
        <div className={classes.toolControlsWrapper}>
          <div className={classes.toolControls}>
            <Grid container alignItems="center">
              <Grid item xs={12}>
                Cameras {pcdButton}
                <Divider />
                <List>
                  {toolButtons}
                </List>
                <Divider />
                Tools
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Button onClick={() => this.saveFrame()}>Save</Button>
                <Button onClick={() => this.reloadFrame()}>Reload</Button>
              </Grid>
              <Grid item xs={12}>
              </Grid>
                <Clipboard
                  controls={this}
                  classes={classes}
                />
              <Grid item xs={12}>
                <History
                  controls={this}
                  classes={classes}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider />
                {buttons}
              </Grid>
            </Grid>
          </div>
          <div className={classes.labelList}>
            {this.renderLabels(classes)}
          </div>
        </div>
      </Drawer>
    );
  }
  renderRightBar(classes) {
    const tool = this.getTool();
    const editor = tool == null ? null : tool.getEditor();
    return (
      <Drawer
        anchor="right"
        variant="permanent"
        open={true}
        classes={{
          paper: classes.drawer
        }}
      >
        {editor}
      </Drawer>
    );
  }
  render() {
    const classes = this.props.classes;
    let skip = this.state.skipFrameCount;
    let frameNumberForm = (
      <div className={classes.frameNumberParts}>
        <IconButton
          color="inherit"
          onClick={this.onClickPrevFrame}
        >
          <NavigateBefore />
        </IconButton>
        <TextField
          type="text"
          placeholder={(this.state.frameNumber+1)+'/'+this.frameLength}
          onBlur={this.onFrameBlurOrFocus}
          onFocus={this.onFrameBlurOrFocus}
          onKeyPress={this.onFrameKeyPress}
          className={classes.frameNumber}
          margin="normal"
        />
        <IconButton
          color="inherit"
          onClick={this.onClickNextFrame}
        >
          <NavigateNext />
        </IconButton>
        <TextField
          label="skip step"
          type="text"
          placeholder="skip step"
          onChange={this.onSkipChange}
          className={classes.frameSkip}
          value={skip === 0 ? '' : skip}
          margin="dense"
        />
      </div>
    );
    let appBar = (
      <AppBar
        position="relative"
        className={classes.appBar}
      >
        <Grid
          container
          alignItems="center"
          className={classes.gridContainer}
        >
          <Grid item xs={6} className={classes.appBarLeft}>
            {frameNumberForm}
            {this.renderKlassSet(classes)}
          </Grid>
          <Grid item xs={6} className={classes.appBarRight}>
            {this.props.labelTool.annotationName}&nbsp;
            (#{this.props.labelTool.datasetId})&nbsp;
            <IconButton
              onClick={this.onClickLogout}
              style={{backgroundColor: '#fff'}}
            >
              <ExitToApp />
            </IconButton>
          </Grid>
        </Grid>
      </AppBar>
    );

    return (
      <div>
        {appBar}
        {this.renderLeftBar(classes)}
        <main
          className={classes.content}
          ref={this.mainContent}
        >
          {this.toolComponents}
        </main>
        {this.renderRightBar(classes)}
        { this.state.isLoading &&
          <LoadingProgress
            text="Loading"
            progress={null}
          />
        }
      </div>
    );
  }
}
const mapStateToProps = state => ({
  controls: state.tool.controls,
  annotation: state.tool.annotation,
  klassSet: state.tool.klassSet,
  history: state.tool.history,
  clipboard: state.tool.clipboard,
  tools: state.tool.tools,
  toolsCnt: state.tool.toolsCnt
});
const mapDispatchToProps = dispatch => ({
  dispatchSetControls: target => dispatch(setControls(target))
});
export default compose(
  withStyles(toolStyle),
  withSnackbar,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(Controls);

