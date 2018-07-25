/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  WebView,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  AsyncStorage,
  TextInput
} from 'react-native';

import * as opentype from 'opentype.js';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dragOver: false,
      files: [],
      glyphs: [],
      mapperText: '',
      selectedFile: '',
      glyphsCaches: {}
    }
  }

  componentDidMount() {   
    AsyncStorage.getItem('FileNameStorageKey').then(filesJson => {
      files = JSON.parse(filesJson);
      if (files !== null && files.length > 0) {
        this.parseFile(files[0], files);
      }
    });
  }

  componentWillUnmount() {
    console.log('componentWillUnmountcomponentWillUnmountcomponentWillUnmountcomponentWillUnmountcomponentWillUnmountcomponentWillUnmount');
    const files = this.state.files || []
    AsyncStorage.setItem('FileNameStorageKey', JSON.stringify(files));
  }

  renderAppNameView() {
    return (
      <View style={styles.appNameWrap}>
        <Text style={styles.appName}>Iconfont 1.0</Text>
      </View>
    );
  }

  renderDragView() {
    const { files, dragOver  } = this.state;
    const dragColor =  dragOver ? 'orange' : '#333';
    return (
      <View
        style={[styles.fullDragView]}
        draggedTypes={['NSFilenamesPboardType']}
        onDragEnter={() => this.setState({dragOver: true})}
        onDragLeave={() => this.setState({dragOver: false})}
        onDrop={(e) => this.onDrop(e)}>
        <Text style={{fontSize: 14, color: dragColor }}>
          {files.length > 0 ? files : 'Drop .ttf files here'}
        </Text>               
      </View>
    );
  }

  renderFontFileView() {
    const { files, selectedFile, dragOver } = this.state;
    const dragColor =  dragOver ? 'orange' :  '#ddd';
    return (
      <ScrollView 
      horizontal  
      style={fileItemStyles.fontFileWrap}
      contentContainerStyle={fileItemStyles.fontFileContainerItem} 
      >
        {
          files.map(e => { 
            const isSelectedColor = e === selectedFile ? 'orange' : '#ddd';
            return (
            <View key={e} style={fileItemStyles.fileItemWrap}>
              <TouchableOpacity activeOpacity={0.7} style={fileItemStyles.fileItem} onPress={() => this.onFileSelected(e)}>
                <View style={[fileItemStyles.fileIconWrap, {borderColor: isSelectedColor}]}>
                  <Text style={{fontSize: 40,  color: isSelectedColor}}>𝐹</Text>
                </View>
                <View style={fileItemStyles.fileNameWrap}>
                  <Text style={[fileItemStyles.fileName,{color: isSelectedColor}]} numberOfLines={1}>{e.split('/').pop()}</Text>
                </View>             
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={fileItemStyles.fileClose} onPress={() => this.onDeleteFileItem(e)}>
                <Text style={fileItemStyles.fileCloseIcon}>✕</Text>
              </TouchableOpacity>                                         
            </View>
            )}
          )        
        }
        <Text style={{ color: dragColor, marginLeft: 20 }}>Drop .ttf files here</Text>
      </ScrollView>
    );    
  }

  renderJsonMapperView() {
    return (
      <View style={panelStyles.mapperView}>
<ScrollView >
        <View style={{flex: 1, backgroundColor: '#fff'}}>
          <Text style={{flex: 1, backgroundColor: '#fff'}} selectable={true}>
            {this.state.mapperText}
          </Text>
        </View>
      </ScrollView>
      </View>
      
      // <View style={panelStyles.mapperView}>
      //   <TextInput 
      //   style={panelStyles.jsonView}
      //   editable={false}
      //   multiline
      //   value={jsonText}
      //   />
      // </View> 
    );
  }

  renderPanelView() {
    const { glyphs } = this.state;
    const { files, dragOver  } = this.state;
    const dragColor =  dragOver ? 'orange' :  '#ddd';
    let html = this.getGlyphWrapperHtml(glyphs);
    return (
      <View style={panelStyles.panelView}>
        <View style={[panelStyles.headerView, {borderColor: dragColor}]}
            draggedTypes={['NSFilenamesPboardType']}
            onDragEnter={() => this.setState({dragOver: true})}
            onDragLeave={() => this.setState({dragOver: false})}
            onDrop={(e) => this.onDrop(e)}
          >
          { this.renderFontFileView() }
        </View>

        <View style={panelStyles.fontShowView}>         
          <View style={panelStyles.fontShow}>
            <WebView style={{ flex: 1 }} source={{html:html}} />
          </View> 
          { this.renderJsonMapperView(glyphs) }          
        </View>
      </View>
    );
  }

  render() {  
    return (
      <View style={styles.container}> 
        { this.renderAppNameView() }
        { (this.state.files.length === 0) ? this.renderDragView() : this.renderPanelView() }
      </View>
    );
  }

  onFileSelected(file) {
    const { files, selectedFile } = this.state;
    if (selectedFile === file) return;
    this.parseFile(file, files);
  }

  onDeleteFileItem(file) {
    const { files, selectedFile } = this.state;
    const deleteIndex = files.indexOf(file);    
    const newFiles = files.filter(e => e != file);
    if (newFiles.length === 0) {
      this.setState({
        files: [],
        glyphs: [],
        mapperText: '',
        selectedFile: '',
      }); 
      return; 
    }

    if (file === selectedFile) {
      let newSelectedFile = ''; 
      if (deleteIndex === 0) {
        newSelectedFile = newFiles[0];
      } else if (deleteIndex === (files.length - 1)) {
        newSelectedFile = newFiles[newFiles.length-1];
      } else {
        newSelectedFile = newFiles[deleteIndex];
      }
      this.parseFile(newSelectedFile, newFiles);      
    } else {
      this.setState({
        files: newFiles,
      }); 
    }    
  }

  onDrop(e) {
    this.setState({
      dragOver: false
    });

    console.log(e.nativeEvent);
    let files = e.nativeEvent.files;
    files = this.filteredTTFFiles(files);

    if(files.length === 0) return;
    this.parseFile(files[0], [...this.state.files, ...files]);
  }

  filteredTTFFiles(files) {
    let oFiles = this.state.files;
    return files.filter(e => {
      return e.endsWith('.ttf') && !oFiles.includes(e);
    });
  }

  parseFile(file, files) {
    const glyphs = this.state.glyphsCaches[file];
    if (glyphs) {
      this.loadFileGlyphs(file, files, glyphs);
      return;
    }

    opentype.load(file, (err, font) => {
      if (err) {
        console.warn(err);
        return;
      }
      // console.log(font);
      const glyphs = this.getConfigGlyphs(font.glyphs);
      this.state.glyphsCaches[file] = glyphs;     
      this.loadFileGlyphs(file, files, glyphs);
    });  
  }

  getConfigGlyphs(fontGlyphs) {
    let glyphs = []    
    for (let i = 0; i < fontGlyphs.length; i++) {
      let glyph = fontGlyphs.get(i);
      if(this.filteredNullGlyph(glyph)) {
        let path = glyph.getPath(0, 40, 40);
        glyph.svg = path.toSVG();
        glyph.hex = this.toHex(glyph.unicode);
        glyphs.push(glyph); 
      }        
    }
    return glyphs;
  }

  loadFileGlyphs(file, files, glyphs) {
    console.log(file);
    console.log(files);
    // console.log(glyphs);

    const hasNames = glyphs.some(e => !!(e.name));
    const mapper = hasNames ? this.parseMapper(glyphs) : this.getUnicodeHexs(glyphs);
    this.setState({
      glyphs: glyphs,
      mapperText: mapper,
      selectedFile: file,
      files: files
    });
  }

  filteredNullGlyph(glyph) {
    const { xMax, xMin, yMax, yMin } = glyph;
    return !!xMax || !!xMin || !!yMax || !!yMin;
  }

  toHex(unicode) {
    if(unicode == undefined) return undefined;
    let hex = unicode.toString(16);  
    while(hex.length < 4) {
      hex = '0' + hex; 
    } 
    return hex;
  } 

  parseMapper(glyphs) {
    const mapperText = glyphs.filter(e => !!e.hex).map(e => `  ${e.name}: ${e.hex}`).join(',\n');
    return `{\n${mapperText}\n}`;
  }

  getUnicodeHexs(glyphs) {
    const hexs = glyphs.map(e => `  ${e.hex}`).join(',\n');
    return `[\n${hexs}\n]`;
  }

  getGlyphHtml(glyph, index) {
    const { svg, name, hex, unicode } = glyph;
    const glyphTop = index < 3 ? 'glyph-top' : '';
    const glyphLeft = index%3 === 0 ? 'glyph-left' : '';
    return (
      `<div class="glyph ${glyphTop} ${glyphLeft}">
        <div> ${index+1} </div>
        <svg class="glyph-svg">          
          ${svg}
        </svg>
        <p> ${name || ''} </p>
        <p> ${hex || ''}    /   ${unicode || ''}</p>
      </div>`
    );
  }
 
  getGlyphWrapperHtml(glyphs) {
    return (
      `<div class="warpper">
        ${glyphs.reduce((pre, cur, index) => pre + this.getGlyphHtml(cur, index),'')}
      </div> 
      ${glyphWrapStyles}
      `
    );
  }
}

const x = []

const fileItemStyles = StyleSheet.create({
  fontFileWrap: {
    flex: 1,
    marginHorizontal: 10,   
  },
  fontFileContainerItem: {
    alignItems: 'center',
  },
  fileItemWrap: {
    width: 100,
    marginRight: 15,
    marginTop: 10
  },  
  fileItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },  
  fileIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    width: 80,
    height: 100,
    marginTop: 5
  },
  fileIcon: {
    borderColor: '#ddd',
    borderWidth: 1,
    fontSize: 15
  },
  fileNameWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5
  },
  fileName: {
    fontSize: 14,
    textAlign: 'center',
  },
  fileClose: {
    alignSelf: 'flex-end',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',  
    backgroundColor: '#000',
    position: 'absolute',
    right: 0,
    top: 0,
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#fff',
  },
  fileCloseIcon: {
    fontSize: 15,
    color: '#fff'
  },  
});

const panelStyles = StyleSheet.create({
  panelView: {
    flex: 1,
  },
  headerView: {
    marginTop: 0,
    marginHorizontal: 15,
    flexDirection: 'row',
    borderStyle: 'solid',
    borderWidth: 1,
    height: 150,
    backgroundColor: '#fff'
  },
  fontShowView: {
    flex: 1,
    marginVertical: 15,
    marginHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fontShow: {
    flex: 1,
    flexGrow: 2,
  },
  mapperView: {
    flex: 1,
    flexGrow: 1,
    marginLeft: 15,
    marginTop: 0,
    marginBottom: 0,
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  jsonView: {
    color: 'orange',
    fontSize: 15,
    height: 150,
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    overflow: 'hidden'
  },
  appNameWrap: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  appName: {
    marginVertical: 5,
    fontSize: 15,
    color: '#333',
  },  
  fullDragView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

const glyphWrapStyles = `
<style> 
  .glyph {
    padding: 10px 15px 10px 15px;
    width: 33.333333%;
    border-bottom: 1px solid lightgray;
    border-right: 1px solid lightgray; 
    -webkit-box-sizing:border-box;     
  }
  .glyph-top {
    border-top: 1px solid lightgray; 
  }
  .glyph-left {
    border-left: 1px solid lightgray; 
  }  
  .glyph-svg {
    margin-top: 10px;
    width: 50px;
    height: 50px;       
  }
  .warpper {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }        
</style>
`;